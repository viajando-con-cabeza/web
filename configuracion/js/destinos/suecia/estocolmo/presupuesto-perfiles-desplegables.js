/* VCC Estocolmo: acordeón de presupuestos + descarga PDF del cálculo existente.
   La calculadora original permanece intacta: se leen sus resultados visibles. */
(function () {
  "use strict";
  const root = document.querySelector("#filosofia");
  if (!root) return;
  const cards = Array.from(root.querySelectorAll("[data-budget-mode]"));
  const panels = Array.from(root.querySelectorAll("[data-budget-panel]"));
  let active = "";

  function activate(id, scroll) {
    active = id;
    cards.forEach(function (card) {
      const isCurrent = card.dataset.budgetMode === id;
      card.setAttribute("aria-expanded", String(isCurrent));
      card.classList.toggle("is-selected", isCurrent);
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.dataset.budgetPanel !== id;
    });
    if (scroll && id && window.matchMedia("(max-width:750px)").matches) {
      const panel = panels.find(function (el) { return el.dataset.budgetPanel === id; });
      if (panel) panel.scrollIntoView({behavior:"smooth",block:"nearest"});
    }
  }
  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      const id = card.dataset.budgetMode;
      activate(active === id ? "" : id, true);
    });
  });
  root.querySelectorAll("[data-budget-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      const previouslyActive = active;
      activate("", false);
      const opener = cards.find(function (card) { return card.dataset.budgetMode === previouslyActive; });
      if (opener) opener.focus({preventScroll:true});
    });
  });
  const track = root.querySelector(".vcc-budget-mode-track");
  root.querySelectorAll("[data-budget-scroll]").forEach(function (arrow) {
    arrow.addEventListener("click", function () {
      if (!track || !track.firstElementChild) return;
      const width = track.firstElementChild.getBoundingClientRect().width + 10;
      track.scrollBy({left: Number(arrow.dataset.budgetScroll) * width,behavior:"smooth"});
    });
  });
  activate("", false);

  /* Carrusel diario: un día visible a la vez, independientemente de si hay 3 o 15. */
  panels.forEach(function (panel) {
    const column = panel.querySelector(".vcc-budget-daily-column");
    if (!column || column.querySelector(".vcc-daily-track")) return;
    const heading = column.querySelector("h4");
    const days = Array.from(column.querySelectorAll(":scope > .vcc-budget-day"));
    if (!heading || !days.length) return;

    const top = document.createElement("div");
    top.className = "vcc-budget-daily-top";
    heading.parentNode.insertBefore(top, heading);
    top.appendChild(heading);

    const controls = document.createElement("div");
    controls.className = "vcc-daily-controls";
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "vcc-daily-arrow";
    previous.setAttribute("aria-label", "Ver gastos del día anterior");
    previous.textContent = "‹";
    const count = document.createElement("output");
    count.className = "vcc-daily-count";
    count.setAttribute("aria-live", "polite");
    count.setAttribute("aria-label", "Día visible del total");
    const next = document.createElement("button");
    next.type = "button";
    next.className = "vcc-daily-arrow";
    next.setAttribute("aria-label", "Ver gastos del día siguiente");
    next.textContent = "›";
    controls.append(previous, count, next);
    top.appendChild(controls);

    const slider = document.createElement("div");
    slider.className = "vcc-daily-track";
    slider.setAttribute("role", "region");
    slider.setAttribute("aria-roledescription", "carrusel");
    slider.setAttribute("aria-label", "Gastos diarios: desliza a los lados para cambiar de día");
    slider.tabIndex = 0;
    column.insertBefore(slider, days[0]);
    const icons = {
      "Alojamiento": "alojamiento",
      "Comida": "comida",
      "Transporte": "transporte",
      "Actividades": "actividades",
      "Extras": "extras"
    };
    /* Valores fuente = gasto del grupo completo (2 viajeros).
       Los importes visibles del carrusel se calculan SIEMPRE por persona.
       Guardamos el original en un atributo para evitar divisiones repetidas. */
    const euroFormatter = new Intl.NumberFormat("es-ES", {useGrouping:"always",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    const travelers = Math.max(1, Number(panel.dataset.budgetTravelers) || 2);
    function originalEuros(element) {
      if (!element) return NaN;
      if (element.dataset.totalGroupEuros !== undefined) {
        return Number(element.dataset.totalGroupEuros);
      }
      const amount = (element.textContent || "").match(/([\d.,]+)\s*€/);
      if (!amount) return NaN;
      const number = Number(amount[1].replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(number)) return NaN;
      element.dataset.totalGroupEuros = String(number);
      return number;
    }
    function showPerPerson(day) {
      const dayAmount = day.querySelector(".vcc-day-price");
      const totalGroup = originalEuros(dayAmount);
      if (dayAmount && Number.isFinite(totalGroup)) {
        dayAmount.textContent = euroFormatter.format(totalGroup / travelers) + " € / pax";
        dayAmount.setAttribute("aria-label", euroFormatter.format(totalGroup / travelers) + " euros por persona");
      }
      day.querySelectorAll(".vcc-budget-day-expenses li").forEach(function (li) {
        const value = li.querySelector(":scope > strong");
        const groupValue = originalEuros(value);
        if (value && Number.isFinite(groupValue)) {
          value.textContent = euroFormatter.format(groupValue / travelers) + " €";
        }
      });
    }
    function decorateDay(day) {
      showPerPerson(day);
      const head = day.querySelector(".vcc-budget-day-head");
      if (head) {
        const label = head.querySelector("strong");
        const price = head.querySelector(".vcc-day-price");
        const source = label ? label.textContent.trim() : "";
        const match = source.match(/^D[IÍ]A\s+(\d+)\s*[·:-]\s*(.+)$/i);
        // Datos del título en dos líneas para cada día, sin duplicarlo en la ficha.
        day.dataset.dailyNumber = match ? match[1] : "";
        day.dataset.dailyRoute = match ? match[2] : source;
        const expenses = day.querySelector(".vcc-budget-day-expenses");
        if (price && expenses) {
          // Sexta celda: total diario alineado con Extras, sin borde ni fondo.
          const totalTile = document.createElement("li");
          totalTile.className = "vcc-day-total-tile";
          const totalLabel = document.createElement("span");
          totalLabel.className = "vcc-day-total-label";
          totalLabel.textContent = "TOTAL / PAX";
          totalTile.append(totalLabel, price);
          expenses.appendChild(totalTile);
        }
        head.remove();
      }
      day.querySelectorAll(".vcc-budget-day-expenses li").forEach(function (li) {
        if (li.querySelector(".vcc-day-tile-icon")) return;
        const category = li.querySelector(".vcc-day-expense-category");
        if (!category) return;
        const icon = document.createElement("span");
        icon.className = "vcc-day-tile-icon";
        icon.setAttribute("aria-hidden", "true");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "1.7");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        const iconName = icons[category.textContent.trim()] || icons.Extras;
        svg.innerHTML = '<use href="/configuracion/imagenes/iconos/compartidos/presupuesto-gastos.svg#' + iconName + '"></use>';
        icon.appendChild(svg);
        li.insertBefore(icon, category);
        li.classList.add("vcc-day-expense-tile");
      });
    }
    days.forEach(function (day, i) {
      decorateDay(day);
      day.classList.add("vcc-daily-slide");
      day.setAttribute("role", "group");
      day.setAttribute("aria-roledescription", "diapositiva");
      day.setAttribute("aria-label", "Día " + (i + 1) + " de " + days.length);
      slider.appendChild(day);
    });

    let current = 0;
    function setCurrent(index) {
      current = Math.max(0, Math.min(days.length - 1, index));
      count.textContent = (current + 1) + " / " + days.length;
      const main = document.createElement("span");
      main.className = "vcc-daily-heading-main";
      main.textContent = "GASTOS DÍA " + (days[current].dataset.dailyNumber || (current + 1));
      const subtitle = document.createElement("small");
      subtitle.className = "vcc-daily-heading-sub";
      subtitle.textContent = days[current].dataset.dailyRoute || "";
      heading.replaceChildren(main, subtitle);
      previous.disabled = current === 0;
      next.disabled = current === days.length - 1;
    }
    function goTo(index) {
      const target = Math.max(0, Math.min(days.length - 1, index));
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      slider.scrollTo({
        left: days[target].offsetLeft - days[0].offsetLeft,
        behavior: reduced ? "instant" : "smooth"
      });
      setCurrent(target);
    }
    previous.addEventListener("click", function () { goTo(current - 1); });
    next.addEventListener("click", function () { goTo(current + 1); });
    slider.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        goTo(current + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    let framePending = false;
    slider.addEventListener("scroll", function () {
      if (framePending) return;
      framePending = true;
      requestAnimationFrame(function () {
        framePending = false;
        if (slider.clientWidth) {
          setCurrent(Math.round(slider.scrollLeft / slider.clientWidth));
        }
      });
    }, {passive: true});
    window.addEventListener("resize", function () { goTo(current); });
    setCurrent(0);
  });

  /* Descarga PDF real de los importes visibles de la calculadora. */
  const exporter=document.querySelector("[data-vcc-download-pdf]");
  if(!exporter)return;
  const categories=[
    ["alojamiento","Alojamiento"],["comida","Comida"],["transporte","Transporte"],
    ["actividades","Actividades"],["extras","Extras"]
  ];
  function numeric(value){
    const text=String(value||"").replace(/[^0-9,.-]/g,"").replace(/\./g,"").replace(",",".");
    return Number(text);
  }
  const text=selector=>{
    const field=document.querySelector(selector);
    if(!field)throw Error("Dato no disponible: "+selector);
    return field.textContent.trim();
  };
  const euros=value=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:2}).format(value);

  function snapshot(){
    const days=numeric(text("#days-output")),nights=numeric(text("#nights-output"));
    const people=numeric(text("#people-output")),total=numeric(text("#grand-total"));
    if(!(days>0&&nights>=0&&people>0&&Number.isFinite(total)))throw Error("Presupuesto incompleto");
    const sections=[{heading:"Resumen del viaje",lines:[
      "Duración: "+days+" días · "+nights+" noches",
      "Viajeros: "+people,
      "Total estimado del viaje: "+euros(total),
      "Total estimado por pax: "+euros(total/people)
    ]}];
    const details=[];
    for(const [key,label] of categories){
      const selector=document.querySelector('[data-category="'+key+'"]');
      const selected=selector?.selectedOptions[0]?.textContent.trim()||"VCC";
      const rate=numeric(text("#price-"+key));
      const amount=numeric(text("#legend-"+key));
      if(!Number.isFinite(rate)||!Number.isFinite(amount))throw Error("Datos incompletos: "+label);
      details.push(label+" · "+selected+": subtotal "+euros(amount)+" para el grupo (precio "+euros(rate)+" / pax / "+(key==="alojamiento"?"noche":"día")+")");
    }
    sections.push({heading:"Desglose por categorías",lines:details});
    return {
      filename:"presupuesto-estocolmo-VCC.pdf",
      title:"Presupuesto de Estocolmo",
      subtitle:"Tu estimación personalizada según los días, viajeros y estilo de viaje",
      sections,
      note:"Estimación orientativa. No incluye vuelos ni los traslados de ida y vuelta al destino. Los importes corresponden a los valores visibles al descargar."
    };
  }
  exporter.addEventListener("click",()=>{
    try{
      if(!window.VCCPDF)throw Error("Generador PDF no disponible");
      window.VCCPDF.download(snapshot());
    }catch(error){
      console.error("VCC: no se pudo generar el PDF de Estocolmo",error);
      window.alert("No hemos podido generar el PDF. Revisa los datos e inténtalo de nuevo.");
    }
  });
})();
