/* VCC · Alojamientos. Carruseles nativos y comparador de precios finales.
   Sin dependencias ni datos externos. */
(() => {
  'use strict';
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function activateCarousel(trackSelector, itemSelector, prevSelector, nextSelector) {
    const track = document.querySelector(trackSelector);
    const items = track && Array.from(track.querySelectorAll(itemSelector));
    const prev = document.querySelector(prevSelector);
    const next = document.querySelector(nextSelector);
    if (!track || !items.length || !prev || !next) return;

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const positions = () => items.map(item => item.offsetLeft - items[0].offsetLeft);
    const currentIndex = () => {
      const offsets = positions();
      let nearest = 0, distance = Infinity;
      offsets.forEach((x, i) => {
        const d = Math.abs(x - track.scrollLeft);
        if (d < distance) { distance = d; nearest = i; }
      });
      return nearest;
    };
    const update = () => {
      prev.disabled = track.scrollLeft <= 3;
      next.disabled = track.scrollLeft >= maxScroll() - 3;
    };
    const scrollStep = direction => {
      const x = positions();
      const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex() + direction));
      const target = direction > 0 && nextIndex === items.length - 1 ? maxScroll() : Math.min(maxScroll(), x[nextIndex]);
      track.scrollTo({ left: target, behavior: reducedMotion() ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => scrollStep(-1));
    next.addEventListener('click', () => scrollStep(1));
    track.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      scrollStep(event.key === 'ArrowRight' ? 1 : -1);
    });
    let scheduled = false;
    track.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function activatePriceComparison() {
    const a = document.querySelector('[data-al-price-a]');
    const b = document.querySelector('[data-al-price-b]');
    const result = document.querySelector('[data-al-compare-result]');
    if (!a || !b || !result) return;
    const format = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    const show = (title, detail) => {
      result.replaceChildren();
      const headline = document.createElement('strong');
      headline.textContent = title;
      const line = document.createElement('p');
      line.textContent = detail;
      result.append(headline, line);
    };
    const update = () => {
      const first = Number(a.value), second = Number(b.value);
      if (!a.value.trim() || !b.value.trim() ||
          !Number.isFinite(first) || !Number.isFinite(second) || first < 0 || second < 0) {
        show('¿Qué oferta sale mejor?', 'Introduce los dos precios finales para compararlos.');
        return;
      }
      const diff = Math.abs(first - second);
      if (diff < 0.005) {
        show('El mismo precio', 'Ambas opciones cuestan ' + format.format(first) + '. Compara cancelación y condiciones.');
      } else {
        const winner = first < second ? 'A' : 'B';
        show('La opción ' + winner + ' es más barata', 'Ahorro total: ' + format.format(diff) + '. Comprueba que las condiciones sean equivalentes.');
      }
    };
    a.addEventListener('input', update);
    b.addEventListener('input', update);
    update();
  }

  const boot = () => {
    activateCarousel('[data-al-track]', '.al-card', '[data-al-prev]', '[data-al-next]');
    activateCarousel('[data-al-tips-track]', '.al-tip', '[data-al-tips-prev]', '[data-al-tips-next]');
    activatePriceComparison();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
