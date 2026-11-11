/* VCC · Carruseles de fotos de itinerarios; imágenes adicionales solo bajo demanda. */
(() => {
  'use strict';
  const initialise = () => {
    document.querySelectorAll('[data-vcc-it-gallery]').forEach(gallery => {
      const slides = Array.from(gallery.querySelectorAll('[data-vcc-it-slide]'));
      const counter = gallery.querySelector('[data-vcc-it-count]');
      if (slides.length < 2 || !counter) return;
      let current = 0;
      let loading = false;
      let touchX = null;
      let touchY = null;

      const show = index => {
        const next = (index + slides.length) % slides.length;
        if (next === current || loading) return;
        const incoming = slides[next];
        const reveal = () => {
          slides[current].classList.remove('is-current');
          slides[current].setAttribute('aria-hidden', 'true');
          incoming.classList.add('is-current');
          incoming.removeAttribute('aria-hidden');
          current = next;
          counter.textContent = (next + 1) + ' / ' + slides.length;
          loading = false;
        };
        if (incoming.dataset.src) {
          loading = true;
          incoming.addEventListener('load', reveal, { once: true });
          incoming.addEventListener('error', () => {
            loading = false;
            incoming.classList.add('vcc-it-load-error');
          }, { once: true });
          incoming.src = incoming.dataset.src;
          delete incoming.dataset.src;
          if (incoming.complete && incoming.naturalWidth) reveal();
        } else if (!incoming.classList.contains('vcc-it-load-error')) {
          reveal();
        }
      };

      gallery.querySelectorAll('[data-vcc-it-dir]').forEach(button => {
        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          show(current + (button.dataset.vccItDir === 'next' ? 1 : -1));
        });
      });

      gallery.addEventListener('keydown', event => {
        if (event.target.closest('button')) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          show(current + (event.key === 'ArrowRight' ? 1 : -1));
        }
      });
      gallery.addEventListener('touchstart', event => {
        if (event.touches.length !== 1) return;
        touchX = event.touches[0].clientX;
        touchY = event.touches[0].clientY;
      }, { passive: true });
      gallery.addEventListener('touchend', event => {
        if (touchX === null || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - touchX;
        const dy = event.changedTouches[0].clientY - touchY;
        touchX = touchY = null;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          show(current + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
