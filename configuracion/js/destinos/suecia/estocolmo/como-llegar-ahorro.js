/* VCC · Deslizador accesible de consejos de ahorro al llegar a Estocolmo.
   Patrón compartido: tarjetas 3/2/1 visibles, controles laterales, swipe y teclado. */
(() => {
  'use strict';
  function init() {
    const root = document.querySelector('.vcc-saving-carousel');
    if (!root) return;
    const track = root.querySelector('.vcc-saving-track');
    const previous = root.querySelector('.vcc-saving-prev');
    const next = root.querySelector('.vcc-saving-next');
    if (!track || !previous || !next) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = maxScroll <= 2 || track.scrollLeft >= maxScroll - 2;
    };
    const move = direction => {
      const card = track.querySelector('.vcc-saving-card');
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({
        left: direction * (card.getBoundingClientRect().width + gap),
        behavior: reduceMotion.matches ? 'instant' : 'smooth'
      });
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('load', update, { once: true });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(update).observe(track);
    requestAnimationFrame(update);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
