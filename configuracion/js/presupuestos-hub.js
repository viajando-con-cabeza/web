/* Filtros sin dependencias para el catálogo de presupuestos VCC. */
(() => {
  const cards = [...document.querySelectorAll(".presupuestos-vcc .budget-card")];
  const budget = document.getElementById("filter-budget");
  const type = document.getElementById("filter-type");
  const continent = document.getElementById("filter-continent");
  const count = document.getElementById("budget-count");
  const empty = document.querySelector(".presupuestos-vcc .it-empty");
  const submit = document.getElementById("filter-submit");
  const reset = document.getElementById("filter-reset");
  if (!budget || !type || !continent || !count || !empty || !submit || !reset) return;

  function matchesPrice(value, band) {
    if (band === "all") return true;
    const price = Number(value);
    if (!Number.isFinite(price) || price <= 0) return false;
    if (band === "201+") return price > 200;
    const limits = band.split("-").map(Number);
    if (limits.length !== 2 || limits.some(n => !Number.isFinite(n))) return false;
    return price > (limits[0] === 0 ? -1 : limits[0] - 1) && price <= limits[1];
  }

  function applyFilters() {
    let visible = 0;
    for (const card of cards) {
      const matchesContinent = continent.value === "all" || card.dataset.continent === continent.value;
      const matchesType = type.value === "all" || (card.dataset.type || "").split(/\s+/).includes(type.value);
      const matchesBudget = matchesPrice(card.dataset.daily, budget.value);
      const show = matchesContinent && matchesType && matchesBudget;
      card.hidden = !show;
      if (show) visible++;
    }
    empty.style.display = visible ? "none" : "block";
    count.textContent = visible + (visible === 1 ? " presupuesto" : " presupuestos");
  }

  submit.addEventListener("click", applyFilters);
  reset.addEventListener("click", () => {
    budget.value = "all";
    type.value = "all";
    continent.value = "all";
    applyFilters();
  });
  [budget, type, continent].forEach(el => el.addEventListener("change", applyFilters));
  applyFilters();
})();