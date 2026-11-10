/* VCC · Carrusel de alojamientos: nativo, accesible, sin dependencias */
(() => {
  "use strict";
  const track = document.querySelector("[data-al-track]");
  if (!track) return;
  const cards = Array.from(track.querySelectorAll(".al-card"));
  const prev = document.querySelector("[data-al-prev]");
  const next = document.querySelector("[data-al-next]");
  const dots = Array.from(document.querySelectorAll("[data-al-dot]"));
  if (!cards.length || !prev || !next) return;
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const offsets = () => cards.map(card => card.offsetLeft - cards[0].offsetLeft);
  const currentIndex = () => {
    const positions = offsets();
    let nearest = 0;
    let distance = Infinity;
    for (let i = 0; i < positions.length; i++) {
      const d = Math.abs(positions[i] - track.scrollLeft);
      if (d < distance) { distance = d; nearest = i; }
    }
    return nearest;
  };
  const update = () => {
    const x = track.scrollLeft;
    prev.disabled = x < 3;
    next.disabled = x >= maxScroll() - 3;
    const active = currentIndex();
    dots.forEach((dot, i) => {
      dot.setAttribute("aria-current", i === active ? "true" : "false");
    });
  };
  const toIndex = (i) => track.scrollTo({
    left: Math.min(offsets()[Math.max(0, Math.min(i, cards.length - 1))], maxScroll()),
    behavior: reducedMotion() ? "auto" : "smooth"
  });
  prev.addEventListener("click", () => toIndex(currentIndex() - 1));
  next.addEventListener("click", () => toIndex(currentIndex() + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => toIndex(i)));
  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    toIndex(currentIndex() + (event.key === "ArrowRight" ? 1 : -1));
  });
  let scheduled = false;
  track.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; update(); });
  }, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
})();