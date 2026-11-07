/* VCC · Carrusel de consejos para ahorrar · desplazamiento nativo horizontal */
(function () {
  "use strict";
  function init() {
    const track = document.getElementById("mv-saving-track");
    if (!track) return;
    const shell = track.closest(".mv-carousel-shell");
    const prev = shell && shell.querySelector(".mv-prev");
    const next = shell && shell.querySelector(".mv-next");
    const cards = Array.from(track.querySelectorAll(".mv-saving-card"));
    if (!prev || !next || !cards.length) return;
    function updateControls() {
      prev.disabled = track.scrollLeft <= 3;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 3;
    }
    function move(direction) {
      const first = cards[0];
      const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      const step = first.getBoundingClientRect().width + gap;
      const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollBy({ left: step * direction, behavior: reduceMotion ? "instant" : "smooth" });
      window.setTimeout(updateControls, reduceMotion ? 0 : 400);
    }
    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls, { passive: true });
    updateControls();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
