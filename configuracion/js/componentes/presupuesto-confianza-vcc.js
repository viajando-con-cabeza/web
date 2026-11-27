/* VCC · Bloque de confianza compartido en presupuestos de todos los destinos.
   Un único texto corporativo, sin nombres, fechas ni importes particulares.
   El HTML conserva una copia estática para SEO y para usuarios sin JavaScript. */
(() => {
  "use strict";
  const copy = {
    heading: "¿POR QUÉ CONFIAR EN NOSOTROS?",
    paragraphs: ["Nuestros presupuestos se basan en viajes reales y en decisiones que hemos tomado nosotros mismos.","Te mostramos desgloses claros y distinguimos los gastos reales de las cifras orientativas.","Compartimos consejos prácticos para adaptar cada viaje a tu presupuesto de forma flexible y sin gastar de más."]
  };
  const apply = () => {
    document.querySelectorAll("body.budget-vcc .vcc-budget-trust").forEach(block => {
      const heading = block.querySelector(".vcc-budget-trust-heading h3");
      const paragraphs = block.querySelectorAll(".vcc-budget-trust-grid > div > p");
      if (heading) heading.textContent = copy.heading;
      paragraphs.forEach((paragraph, index) => {
        if (copy.paragraphs[index]) paragraph.textContent = copy.paragraphs[index];
      });
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, {once:true});
  else apply();
})();
