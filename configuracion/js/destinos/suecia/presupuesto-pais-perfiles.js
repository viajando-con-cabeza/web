/* VCC Suecia: mismo acordeón de Estocolmo + exportación PDF del cálculo regional.
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

  /* Descarga PDF real de las etapas que están seleccionadas en la calculadora. */
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
    const rows=[...document.querySelectorAll("#swb-route-rows .vcc-budget-route-row")];
    if(!rows.length)throw Error("Añade al menos una etapa");
    const days=numeric(text("#days-output")),nights=numeric(text("#nights-output"));
    const people=numeric(text("#people-output")),total=numeric(text("#grand-total"));
    if(!(days>0&&nights>=0&&people>0&&Number.isFinite(total)))throw Error("Presupuesto incompleto");
    const sections=[{heading:"Resumen del viaje",lines:[
      "Duración: "+days+" días · "+nights+" noches",
      "Viajeros: "+people,
      "Total estimado del viaje: "+euros(total),
      "Total estimado por persona: "+euros(total/people)
    ]}];
    rows.forEach((row,index)=>{
      const zone=row.querySelector("[data-zone-name]")?.selectedOptions[0]?.textContent.trim();
      const stopDays=numeric(row.querySelector('[data-stage-input="days"]')?.value);
      const stopNights=numeric(row.querySelector('[data-stage-input="nights"]')?.value);
      const stopTotal=numeric(row.querySelector("[data-zone-total]")?.textContent);
      if(!zone||!Number.isFinite(stopDays)||!Number.isFinite(stopNights)||!Number.isFinite(stopTotal))throw Error("Datos incompletos en una zona");
      const lines=["Duración: "+stopDays+" días · "+stopNights+" noches"];
      for(const [key,label] of categories){
        const selector=row.querySelector('[data-zone-category="'+key+'"]');
        const price=row.querySelector('[data-zone-price="'+key+'"]');
        if(!selector||!price)throw Error("Datos incompletos: "+label);
        const amount=numeric(price.textContent);
        if(!Number.isFinite(amount))throw Error("Precio incorrecto: "+label);
        lines.push(label+" ("+selector.selectedOptions[0].textContent.trim()+"): "+euros(amount)+" / persona / "+(key==="alojamiento"?"noche":"día"));
      }
      lines.push("Subtotal de la etapa: "+euros(stopTotal));
      sections.push({heading:"Etapa "+(index+1)+" · "+zone,lines});
    });
    return {
      filename:"presupuesto-suecia-VCC.pdf",
      title:"Presupuesto de Suecia",
      subtitle:"Tu estimación personalizada por zonas y etapas",
      sections,
      note:"Precios orientativos de planificación, no gastos reales de toda Suecia. Comprueba tarifas y disponibilidad antes de reservar."
    };
  }
  exporter.addEventListener("click",()=>{
    try{
      if(!window.VCCPDF)throw Error("Generador PDF no disponible");
      window.VCCPDF.download(snapshot());
    }catch(error){
      console.error("VCC: no se pudo generar el PDF de Suecia",error);
      window.alert("No hemos podido generar el PDF. Revisa los datos e inténtalo de nuevo.");
    }
  });
})();
