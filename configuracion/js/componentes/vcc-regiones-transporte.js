/* Carrusel de regiones: 4 visibles en escritorio, 3/2/1 según el ancho;
   flechas y gestos, sin contador ni duplicación de tarjetas. */
(() => {
  "use strict";
  function initSwedenRegions() {
    const track = document.getElementById("swmove-region-track");
    if (!track) return;
    const section = track.closest(".swmove-region-carousel");
    if (!section) return;
    const prev = section.querySelector(".swmove-region-prev");
    const next = section.querySelector(".swmove-region-next");
    const cards = Array.from(track.querySelectorAll(".swmove-region-card"));
    if (!prev || !next || cards.length < 2) return;
    const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pitch = () => cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    function update() {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    function move(direction) {
      const step = pitch();
      if (step <= 0) return;
      const current = Math.round(track.scrollLeft / step);
      const targetIndex = Math.max(0, Math.min(cards.length-1, current + direction));
      const left = cards[targetIndex].offsetLeft - cards[0].offsetLeft;
      track.scrollTo({left, behavior: reduceMotion() ? "auto" : "smooth"});
    }
    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("keydown", event => {
      if (event.target !== track || !["ArrowLeft","ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    });
    track.addEventListener("scroll", update, {passive:true});
    window.addEventListener("resize", update, {passive:true});
    update();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSwedenRegions, {once:true});
  else initSwedenRegions();
})();
