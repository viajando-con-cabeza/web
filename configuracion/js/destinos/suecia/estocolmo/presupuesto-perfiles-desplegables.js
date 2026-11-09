/* VCC Estocolmo: acordeón de presupuestos + descarga XLSX del cálculo existente.
   La calculadora original permanece intacta: se leen sus resultados visibles. */
(function () {
  "use strict";
  const root = document.querySelector("#filosofia");
  if (!root) return;
  const cards = Array.from(root.querySelectorAll("[data-budget-mode]"));
  const panels = Array.from(root.querySelectorAll("[data-budget-panel]"));
  let active = "vcc";

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
  activate("vcc", false);

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
      "Alojamiento": '<rect x="3" y="10" width="18" height="9" rx="2"/><path d="M3 13V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M7 10V8h4v2m2 0V8h4v2M3 19v2m18-2v2"/>',
      "Comida": '<path d="M4 2v8a3 3 0 0 0 6 0V2M7 2v20M17 22V2c-3 2-4 6-4 10h4"/>',
      "Transporte": '<rect x="5" y="2" width="14" height="17" rx="3"/><path d="M5 10h14M9 19l-2 3m8-3 2 3M9 15h.01M15 15h.01"/>',
      "Actividades": '<path d="M2 9a2 2 0 0 0 2-2h16a2 2 0 0 0 2 2v6a2 2 0 0 0-2 2H4a2 2 0 0 0-2-2V9ZM12 7v10"/><path d="M12 10h.01M12 14h.01"/>',
      "Extras": '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>'
    };
    /* Valores fuente = gasto del grupo completo (2 viajeros).
       Los importes visibles del carrusel se calculan SIEMPRE por persona.
       Guardamos el original en un atributo para evitar divisiones repetidas. */
    const euroFormatter = new Intl.NumberFormat("es-ES", {
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
      const dayAmount = day.querySelector(".vcc-budget-day-head > span.vcc-day-price, .vcc-budget-day-head > span");
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
        const price = head.querySelector("span");
        if (label && !head.querySelector(".vcc-day-place")) {
          const source = label.textContent.trim();
          const match = source.match(/^D[IÍ]A\s+(\d+)\s*[·:-]\s*(.+)$/i);
          // Un único título compacto: sin el antiguo sobretítulo manuscrito.
          const title = document.createElement("strong");
          title.className = "vcc-day-place";
          title.textContent = match ? "Día " + match[1] + " · " + match[2] : source;
          head.insertBefore(title, label);
          label.remove();
        }
        if (price) price.classList.add("vcc-day-price");
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
        svg.innerHTML = icons[category.textContent.trim()] || icons.Extras;
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

  /* El libro Excel se construye con ZIP/OOXML sin bibliotecas de terceros. */
  const exporter = document.querySelector("[data-vcc-download-excel]");
  if (!exporter) return;
  const categories = [
    ["alojamiento", "Alojamiento"],
    ["comida", "Comida"],
    ["transporte", "Transporte"],
    ["actividades", "Actividades"],
    ["extras", "Extras"]
  ];
  function numberFrom(text) {
    return Number(String(text || "").replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",","."));
  }
  function xmlEscape(value) {
    return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  }
  function cell(address, value) {
    if (value && typeof value === "object" && value.formula) {
      return '<c r="' + address + '"><f>' + xmlEscape(value.formula) + '</f><v>' +
        xmlEscape(value.cached || 0) + '</v></c>';
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return '<c r="' + address + '" t="n"><v>' + value + '</v></c>';
    }
    return '<c r="' + address + '" t="inlineStr"><is><t>' +
      xmlEscape(value == null ? "" : value) + '</t></is></c>';
  }
  function worksheet(rows) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
      rows.map(function (row, rowIndex) {
        return '<row r="' + (rowIndex + 1) + '">' +
          row.map(function (value, colIndex) {
            return cell(alphabet[colIndex] + (rowIndex + 1), value);
          }).join("") + '</row>';
      }).join("") + '</sheetData></worksheet>';
  }
  function zipFile(entries) {
    const encoder = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let x = n;
      for (let bit = 0; bit < 8; bit++) x = x & 1 ? (0xedb88320 ^ (x >>> 1)) : x >>> 1;
      crcTable[n] = x >>> 0;
    }
    function crc32(bytes) {
      let crc = 0xffffffff;
      bytes.forEach(function (byte) { crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8); });
      return (crc ^ 0xffffffff) >>> 0;
    }
    function header(length) {
      const raw = new Uint8Array(length);
      return {raw:raw, view:new DataView(raw.buffer)};
    }
    for (const entry of entries) {
      const name = encoder.encode(entry.name);
      const body = encoder.encode(entry.content);
      const crc = crc32(body);
      const local = header(30);
      local.view.setUint32(0, 0x04034b50, true);
      local.view.setUint16(4, 20, true);
      local.view.setUint16(6, 0x0800, true);
      local.view.setUint16(8, 0, true);
      local.view.setUint32(14, crc, true);
      local.view.setUint32(18, body.length, true);
      local.view.setUint32(22, body.length, true);
      local.view.setUint16(26, name.length, true);
      chunks.push(local.raw, name, body);
      const dir = header(46);
      dir.view.setUint32(0, 0x02014b50, true);
      dir.view.setUint16(4, 20, true);
      dir.view.setUint16(6, 20, true);
      dir.view.setUint16(8, 0x0800, true);
      dir.view.setUint32(16, crc, true);
      dir.view.setUint32(20, body.length, true);
      dir.view.setUint32(24, body.length, true);
      dir.view.setUint16(28, name.length, true);
      dir.view.setUint32(42, offset, true);
      central.push(dir.raw, name);
      offset += local.raw.length + name.length + body.length;
    }
    const centralLength = central.reduce(function (sum, chunk) { return sum + chunk.length; }, 0);
    chunks.push.apply(chunks, central);
    const end = header(22);
    end.view.setUint32(0, 0x06054b50, true);
    end.view.setUint16(8, entries.length, true);
    end.view.setUint16(10, entries.length, true);
    end.view.setUint32(12, centralLength, true);
    end.view.setUint32(16, offset, true);
    chunks.push(end.raw);
    return new Blob(chunks, {
      type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
  }
  function snapshotWorkbook() {
    const getText = function (selector) {
      const element = document.querySelector(selector);
      if (!element) throw new Error("Falta el campo " + selector);
      return element.textContent.trim();
    };
    const days = Number(getText("#days-output"));
    const nights = Number(getText("#nights-output"));
    const people = Number(getText("#people-output"));
    const total = numberFrom(getText("#grand-total"));
    if (!(days > 0 && nights >= 0 && people > 0 && Number.isFinite(total))) {
      throw new Error("Los valores del presupuesto no son válidos");
    }
    const costs = categories.map(function (category, index) {
      const key = category[0], label = category[1];
      const selector = document.querySelector('[data-category="' + key + '"]');
      const style = selector ? selector.selectedOptions[0].textContent.trim() : "VCC";
      return {key:key, label:label,style:style,rate:numberFrom(getText("#price-" + key)),
        units:key === "alojamiento" ? nights : days,
        total:numberFrom(getText("#legend-" + key)),row:index+2};
    });
    const rowsSummary = [
      ["VCC - PRESUPUESTO DE ESTOCOLMO", "Importe"],
      ["Días",days],
      ["Noches",nights],
      ["Viajeros",people],
      ["Total viaje (EUR)",{formula:"SUM(Desglose!E2:E6)",cached:total}],
      ["Total por persona (EUR)",{formula:"IF(B4>0,B5/B4,0)",cached:total/people}],
      ["Nota","Estimación; no incluye vuelos ni traslados de ida/vuelta al destino"],
      ["Uso","Puedes modificar los días, noches, viajeros o precios unitarios; Excel recalculará el total."],
      ["Origen","www.viajandoconcabeza.com"]
    ];
    const rowsDetails = [["Categoría","Estilo","EUR/persona por unidad","Unidades","Total EUR"]];
    costs.forEach(function (cost) {
      rowsDetails.push([cost.label,cost.style,cost.rate,
        {formula:cost.key === "alojamiento" ? "Resumen!$B$3" : "Resumen!$B$2",cached:cost.units},
        {formula:"C" + cost.row + "*D" + cost.row + "*Resumen!$B$4",cached:cost.total}]);
    });
    rowsDetails.push(["TOTAL","","","",{formula:"SUM(E2:E6)",cached:total}]);
    const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    return zipFile([
      {name:"[Content_Types].xml",content:'<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>'},
      {name:"_rels/.rels",content:'<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="' + office + '/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'},
      {name:"xl/workbook.xml",content:'<?xml version="1.0" encoding="UTF-8"?>' +
        '<workbook xmlns="' + main + '" xmlns:r="' + office + '">' +
        '<sheets><sheet name="Resumen" sheetId="1" r:id="rId1"/>' +
        '<sheet name="Desglose" sheetId="2" r:id="rId2"/></sheets>' +
        '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'},
      {name:"xl/_rels/workbook.xml.rels",content:'<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="' + office + '/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="' + office + '/worksheet" Target="worksheets/sheet2.xml"/>' +
        '</Relationships>'},
      {name:"xl/worksheets/sheet1.xml",content:worksheet(rowsSummary)},
      {name:"xl/worksheets/sheet2.xml",content:worksheet(rowsDetails)}
    ]);
  }
  exporter.addEventListener("click", function () {
    try {
      const blob = snapshotWorkbook();
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url;
      download.download = "presupuesto-estocolmo-VCC.xlsx";
      document.body.appendChild(download);
      download.click();
      download.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    } catch (error) {
      console.error("VCC: no se pudo crear el Excel", error);
      window.alert("No hemos podido exportar el presupuesto. Revisa los datos e inténtalo de nuevo.");
    }
  });
})();
