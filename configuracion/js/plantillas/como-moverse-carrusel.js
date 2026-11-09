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

/* VCC · Carrusel de sis transportes: 3/6, 4/6, 5/6, 6/6 a escriptori.
   El comptador mostra la darrera targeta visible, no el número de pàgina.
   Les fletxes avancen una targeta; les sis romanen al DOM per a SEO. */
(function () {
  "use strict";
  function initTransport() {
    const track = document.getElementById("mv-transport-track");
    if (!track) return;
    const section = track.closest(".mv-transport-section");
    if (!section) return;
    const prev = section.querySelector(".mv-transport-prev");
    const next = section.querySelector(".mv-transport-next");
    const label = section.querySelector(".mv-transport-counter");
    const cards = Array.from(track.querySelectorAll(".mv-card"));
    if (!prev || !next || !label || !cards.length) return;

    const visibleCount = () =>
      window.matchMedia("(max-width: 690px)").matches ? 1 :
      window.matchMedia("(max-width: 1050px)").matches ? 2 : 3;
    const reduceMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const maxStart = () => Math.max(0, cards.length - visibleCount());
    const cardStep = () =>
      cards.length > 1 ? (cards[1].offsetLeft - cards[0].offsetLeft) : track.clientWidth;
    function currentStart() {
      const pitch = cardStep();
      if (!pitch || pitch <= 0) return 0;
      return Math.max(0, Math.min(maxStart(), Math.round(track.scrollLeft / pitch)));
    }
    function update() {
      const first = currentStart();
      const last = Math.min(cards.length, first + visibleCount());
      label.textContent = last + "/" + cards.length;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    function go(firstIndex, smooth) {
      const index = Math.max(0, Math.min(maxStart(), firstIndex));
      const target = Math.max(0, cards[index].offsetLeft - cards[0].offsetLeft);
      track.scrollTo({left: target, behavior: smooth && !reduceMotion() ? "smooth" : "auto"});
      if (!smooth || reduceMotion()) update();
    }
    prev.addEventListener("click", () => go(currentStart() - 1, true));
    next.addEventListener("click", () => go(currentStart() + 1, true));
    track.addEventListener("keydown", event => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      go(currentStart() + (event.key === "ArrowRight" ? 1 : -1), true);
    });
    let pending = false;
    track.addEventListener("scroll", () => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(() => {pending = false; update();});
    }, {passive: true});
    let previousVisible = visibleCount();
    window.addEventListener("resize", () => {
      const now = visibleCount();
      if (now !== previousVisible) {
        previousVisible = now;
        go(0, false);
      } else update();
    }, {passive: true});
    update();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initTransport, {once: true});
  else initTransport();
})();

/* VCC · Itineraris de transport:
   1-3 dies: sense carrusel; 4+ dies: carrusel de dies navegable.
   El Consejo VCC queda sempre fora del track i per tant no es desplaça. */
(function () {
  "use strict";
  function initDayCarousel() {
    const track = document.getElementById("mv-day-track");
    if (!track) return;
    const route = track.closest(".mv-day-route");
    if (!route) return;
    const cards = Array.from(track.querySelectorAll(".mv-day-card"));
    const controls = route.querySelector(".mv-day-controls");
    const prev = route.querySelector(".mv-day-prev");
    const next = route.querySelector(".mv-day-next");
    const counter = route.querySelector("#mv-day-carousel-counter");
    if (!controls || !prev || !next || !counter || cards.length <= 3) return;
    route.classList.add("is-carousel");
    controls.hidden = false;
    const visible = () => window.matchMedia("(max-width: 1050px)").matches ? 1 : 3;
    const pages = () => Math.ceil(cards.length / visible());
    const pageStep = () => {
      const i = Math.min(visible(), cards.length - 1);
      return cards[i].offsetLeft - cards[0].offsetLeft || track.clientWidth;
    };
    const currentPage = () => Math.max(0, Math.min(pages() - 1, Math.round(track.scrollLeft / pageStep())));
    const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function updateControls() {
      const page = currentPage();
      counter.textContent = (page + 1) + " / " + pages();
      prev.disabled = track.scrollLeft <= 3;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 3;
    }
    function go(page) {
      const bounded = Math.max(0, Math.min(pages() - 1, page));
      const card = cards[Math.min(cards.length - 1, bounded * visible())];
      track.scrollTo({left: Math.max(0, card.offsetLeft - cards[0].offsetLeft), behavior: reducedMotion() ? "auto" : "smooth"});
      if (reducedMotion()) updateControls();
    }
    prev.addEventListener("click", () => go(currentPage() - 1));
    next.addEventListener("click", () => go(currentPage() + 1));
    track.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      go(currentPage() + (event.key === "ArrowRight" ? 1 : -1));
    });
    let queued = false;
    track.addEventListener("scroll", () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => { queued = false; updateControls(); });
    }, {passive:true});
    let priorVisible = visible();
    window.addEventListener("resize", () => {
      if (visible() !== priorVisible) {
        priorVisible = visible();
        track.scrollTo({left:0,behavior:"auto"});
      }
      updateControls();
    }, {passive:true});
    updateControls();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initDayCarousel, {once:true});
  else initDayCarousel();
})();
