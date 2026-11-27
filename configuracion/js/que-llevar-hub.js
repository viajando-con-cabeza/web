/* Hub de equipaje VCC · filtros por tipo y continente; sin dependencias. */
(() => {
  "use strict";
  const root = document.querySelector(".que-llevar-hub");
  if (!root) return;
  const cards = Array.from(root.querySelectorAll(".packing-card"));
  const type = document.getElementById("filter-type");
  const continent = document.getElementById("filter-continent");
  const submit = document.getElementById("filter-submit");
  const reset = document.getElementById("filter-reset");
  const count = document.getElementById("packing-count");
  const empty = root.querySelector(".it-empty");
  if (!type || !continent || !submit || !reset || !count || !empty) return;

  const apply = () => {
    let visible = 0;
    for (const card of cards) {
      const continentOK = continent.value === "all" || card.dataset.continent === continent.value;
      const typeOK = type.value === "all" || (card.dataset.type || "").split(/\s+/).includes(type.value);
      const show = continentOK && typeOK;
      card.hidden = !show;
      if (show) visible++;
    }
    empty.hidden = visible > 0;
    empty.style.display = visible ? "none" : "block";
    count.textContent = visible + (visible === 1 ? " guía" : " guías");
  };
  const clear = () => {
    type.value = "all";
    continent.value = "all";
    apply();
  };
  submit.addEventListener("click", apply);
  reset.addEventListener("click", clear);
  [type, continent].forEach(select => select.addEventListener("change", apply));
  apply();
})();
