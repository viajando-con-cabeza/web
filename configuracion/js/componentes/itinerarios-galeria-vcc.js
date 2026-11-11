/* VCC · Carrusel itinerarios: transición lateral como galería Booking.
   En móvil, arrastrar sigue el dedo; imágenes AVIF de R2 cargadas bajo demanda. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function init(gallery) {
    const photos = Array.from(gallery.querySelectorAll('[data-vcc-it-slide]'));
    const counter = gallery.querySelector('[data-vcc-it-count]');
    if (photos.length < 2 || !counter) return;
    let current = 0, active = null, direction = 0, busy = false, gesture = null, endTimer = null, endListener = null;
    const images = photos.length;
    const position = i => (i + images) % images;

    function load(i) {
      const img = photos[position(i)];
      if (img.dataset.src) {
        img.loading = "eager";
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      if (img.complete && img.naturalWidth) return Promise.resolve(true);
      if (img.dataset.failed) return Promise.resolve(false);
      return new Promise(resolve => {
        img.addEventListener('load', () => resolve(true), { once: true });
        img.addEventListener('error', () => { img.dataset.failed = 'true'; resolve(false); }, { once: true });
      });
    }

    function prepare(dir) {
      const nextIndex = position(current + dir);
      const incoming = photos[nextIndex];
      if (!incoming.complete || !incoming.naturalWidth) return false;
      direction = dir;
      active = nextIndex;
      incoming.classList.add('is-adjacent');
      incoming.setAttribute('aria-hidden', 'true');
      incoming.style.transform = 'translate3d(' + dir * 100 + '%,0,0)';
      photos[current].style.transform = 'translate3d(0,0,0)';
      return true;
    }

    function cleanup(completed) {
      if (endTimer) { window.clearTimeout(endTimer); endTimer = null; }
      if (endListener && active !== null) photos[active].removeEventListener('transitionend', endListener);
      endListener = null;
      const oldIndex = current;
      gallery.classList.remove('is-sliding', 'is-dragging');
      photos[oldIndex].style.removeProperty('transform');
      if (active !== null) {
        photos[active].style.removeProperty('transform');
        photos[active].classList.remove('is-adjacent');
      }
      if (completed && active !== null) {
        photos[oldIndex].classList.remove('is-current');
        photos[oldIndex].setAttribute('aria-hidden', 'true');
        current = active;
        photos[current].classList.add('is-current');
        photos[current].removeAttribute('aria-hidden');
        counter.textContent = (current + 1) + ' / ' + images;
      }
      active = null;
      direction = 0;
      busy = false;
    }

    function settle(complete, initialDistance = 0) {
      if (active === null) return;
      const old = photos[current], incoming = photos[active];
      const width = Math.max(1, gallery.clientWidth);
      busy = true;
      gallery.classList.remove('is-dragging');
      if (reduce.matches) {
        cleanup(complete);
        return;
      }
      const duration = Math.max(180, Math.min(430, Math.round(420 * (1 - Math.min(1, Math.abs(initialDistance) / width)))));
      gallery.style.setProperty('--vcc-it-slide-duration', duration + 'ms');
      gallery.classList.add('is-sliding');
      void incoming.offsetWidth;
      const done = () => cleanup(complete);
      endListener = event => {
        if (event.propertyName !== 'transform') return;
        if (active !== null) done();
      };
      incoming.addEventListener('transitionend', endListener);
      endTimer = window.setTimeout(() => { if (active !== null) done(); }, duration + 120);
      window.requestAnimationFrame(() => {
        old.style.transform = 'translate3d(' + (complete ? -direction * width : 0) + 'px,0,0)';
        incoming.style.transform = 'translate3d(' + (complete ? 0 : direction * width) + 'px,0,0)';
      });
    }

    async function go(dir) {
      if (busy || gesture) return;
      busy = true;
      const target = position(current + dir);
      const ok = await load(target);
      if (!ok) { busy = false; return; }
      if (!prepare(dir)) { busy = false; return; }
      settle(true);
    }

    gallery.querySelectorAll('[data-vcc-it-dir]').forEach(btn => {
      btn.addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation();
        go(btn.dataset.vccItDir === 'next' ? 1 : -1);
      });
    });
    gallery.addEventListener('keydown', event => {
      if (event.target.closest('button')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        go(event.key === 'ArrowRight' ? 1 : -1);
      }
    });

    gallery.addEventListener('touchstart', event => {
      if (busy || event.touches.length !== 1 || event.target.closest('button')) return;
      gesture = { x: event.touches[0].clientX, y: event.touches[0].clientY, dx: 0, dy: 0, dragging: false };
    }, { passive: true });
    gallery.addEventListener('touchmove', event => {
      if (!gesture || busy || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - gesture.x;
      const dy = touch.clientY - gesture.y;
      gesture.dx = dx; gesture.dy = dy;
      if (!gesture.dragging && (Math.abs(dx) < 7 || Math.abs(dx) <= Math.abs(dy) * 1.2)) return;
      const dir = dx < 0 ? 1 : -1;
      if (direction !== dir) {
        if (active !== null) cleanup(false);
        if (!prepare(dir)) return;
      }
      gesture.dragging = true;
      gallery.classList.add('is-dragging');
      if (event.cancelable) event.preventDefault();
      const offset = Math.max(-gallery.clientWidth, Math.min(gallery.clientWidth, dx));
      photos[current].style.transform = 'translate3d(' + offset + 'px,0,0)';
      photos[active].style.transform = 'translate3d(' + (offset + dir * gallery.clientWidth) + 'px,0,0)';
    }, { passive: false });
    gallery.addEventListener('touchend', event => {
      if (!gesture) return;
      const drag = gesture;
      gesture = null;
      const dir = drag.dx < 0 ? 1 : -1;
      const valid = Math.abs(drag.dx) > Math.max(38, gallery.clientWidth * 0.16) && Math.abs(drag.dx) > Math.abs(drag.dy) * 1.2;
      if (active !== null) {
        settle(valid, drag.dx);
      } else if (valid) {
        go(dir);
      }
    }, { passive: true });
    gallery.addEventListener('touchcancel', () => {
      gesture = null;
      if (active !== null) settle(false);
    }, { passive: true });

    /* Precalentar las dos imágenes vecinas únicamente cuando la tarjeta entra en pantalla. */
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          load(1); load(images - 1);
          observer.disconnect();
        }
      }, { rootMargin: '100px' });
      observer.observe(gallery);
    }
  }
  const boot = () => document.querySelectorAll('[data-vcc-it-gallery]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
