/* VCC · Galería móvil en dos niveles. Solo quality / Estocolmo.
   Nivel 1: mosaico vertical grande + dos pequeñas. Nivel 2: foto individual.
   No altera el visor de escritorio ni las URL R2 originales. */
(() => {
  'use strict';
  const mobile = window.matchMedia('(max-width: 800px)');
  const base = '/destinos/suecia/goteborg/imagenes/optimizadas/';
  const preview = (url, size) => {
    const match = String(url).match(/(DSC[0-9]+[.]webp)(?:[?#].*)?$/i);
    return match ? base + size + '/' + match[1] : url;
  };
  const root = document.createElement('div');
  root.id = 'vcc-mobile-gallery';
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = [
    '<section class="vcc-mobile-gallery-panel vcc-mobile-grid-view" aria-label="Galería de fotografías">',
      '<header class="vcc-mobile-gallery-header">',
        '<button type="button" class="vcc-mobile-nav" data-vcc-action="exit" aria-label="Volver a la guía">←</button>',
        '<div class="vcc-mobile-heading"><strong class="vcc-grid-title"></strong><span class="vcc-grid-count"></span></div>',
        '<button type="button" class="vcc-mobile-nav vcc-mobile-close" data-vcc-action="exit" aria-label="Cerrar galería">×</button>',
      '</header>',
      '<div class="vcc-mobile-gallery-scroll"><div class="vcc-mobile-photo-grid"></div></div>',
    '</section>',
    '<section class="vcc-mobile-gallery-panel vcc-mobile-photo-view" aria-label="Fotografía ampliada" hidden>',
      '<header class="vcc-mobile-gallery-header">',
        '<button type="button" class="vcc-mobile-nav" data-vcc-action="grid" aria-label="Volver al mosaico">←</button>',
        '<div class="vcc-mobile-heading"><strong class="vcc-photo-title"></strong><span class="vcc-photo-count" aria-live="polite"></span></div>',
        '<button type="button" class="vcc-mobile-nav vcc-mobile-close" data-vcc-action="exit" aria-label="Cerrar galería">×</button>',
      '</header>',
      '<div class="vcc-mobile-photo-stage">',
        '<div class="vcc-mobile-photo-full" role="img" aria-label="Fotografía ampliada"></div>',
        '<button type="button" class="vcc-mobile-photo-arrow vcc-arrow-prev" data-vcc-action="prev" aria-label="Fotografía anterior">‹</button>',
        '<button type="button" class="vcc-mobile-photo-arrow vcc-arrow-next" data-vcc-action="next" aria-label="Fotografía siguiente">›</button>',
      '</div>',
      '<div class="vcc-mobile-photo-hint">Desliza para cambiar de fotografía</div>',
    '</section>'
  ].join('');
  document.body.append(root);

  const gridView = root.querySelector('.vcc-mobile-grid-view');
  const photoView = root.querySelector('.vcc-mobile-photo-view');
  const scroller = root.querySelector('.vcc-mobile-gallery-scroll');
  const photoGrid = root.querySelector('.vcc-mobile-photo-grid');
  const large = root.querySelector('.vcc-mobile-photo-full');
  const photoCount = root.querySelector('.vcc-photo-count');
  const previous = root.querySelector('.vcc-arrow-prev');
  const next = root.querySelector('.vcc-arrow-next');

  let photos = [];
  let placeTitle = '';
  let selected = 0;
  let focusBefore = null;
  let previousTile = null;

  function returnToGuide() {
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('vcc-mobile-gallery-open');
    window.VCCGalleryScrollLock?.release('mobile');
    large.style.removeProperty('background-image');
    previousTile = null;
    if (focusBefore && focusBefore.isConnected) focusBefore.focus({preventScroll: true});
    focusBefore = null;
  }
  function showGrid() {
    photoView.hidden = true;
    gridView.hidden = false;
    large.style.removeProperty('background-image');
    if (previousTile && previousTile.isConnected) previousTile.focus({preventScroll: true});
    else gridView.querySelector('.vcc-mobile-nav').focus({preventScroll: true});
  }
  function showPhoto(index) {
    if (!photos.length) return;
    selected = (index + photos.length) % photos.length;
    photoView.hidden = false;
    gridView.hidden = true;
    const url = preview(photos[selected], 'visor');
    large.style.backgroundImage = 'url("' + url + '")';
    large.setAttribute('aria-label', placeTitle + ', fotografía ' + (selected + 1) + ' de ' + photos.length);
    photoCount.textContent = 'Foto ' + (selected + 1) + ' de ' + photos.length;
    previous.disabled = photos.length < 2;
    next.disabled = photos.length < 2;
    photoView.querySelector('.vcc-mobile-nav').focus({preventScroll: true});
    // Precarga solo la siguiente imagen de tamaño visor, no todas las originales.
    if (photos.length > 1) {
      const img = new Image();
      img.src = preview(photos[(selected + 1) % photos.length], 'visor');
    }
  }
  function openGallery(gallery) {
    if (!gallery) return;
    try { photos = JSON.parse(gallery.dataset.images || '[]'); } catch { photos = []; }
    if (!Array.isArray(photos) || !photos.length) return;
    placeTitle = gallery.closest('.place')?.querySelector('h2')?.textContent?.trim() || 'FOTOGRAFÍAS';
    focusBefore = document.activeElement;
    previousTile = null;
    root.querySelector('.vcc-grid-title').textContent = placeTitle;
    root.querySelector('.vcc-photo-title').textContent = placeTitle;
    root.querySelector('.vcc-grid-count').textContent = photos.length + (photos.length === 1 ? ' fotografía' : ' fotografías');
    photoGrid.replaceChildren();
    photos.forEach((url, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vcc-mobile-photo-tile ' + (index % 3 === 0 ? 'is-wide' : 'is-small');
      button.setAttribute('aria-label', 'Ampliar fotografía ' + (index + 1) + ' de ' + photos.length);
      const img = document.createElement('img');
      img.src = preview(url, 'mini');
      img.alt = placeTitle + ', foto ' + (index + 1);
      img.loading = index < 3 ? 'eager' : 'lazy';
      img.decoding = 'async';
      button.append(img);
      button.addEventListener('click', () => {
        previousTile = button;
        showPhoto(index);
      });
      photoGrid.append(button);
    });
    gridView.hidden = false;
    photoView.hidden = true;
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('vcc-mobile-gallery-open');
    window.VCCGalleryScrollLock?.acquire('mobile');
    scroller.scrollTop = 0;
    gridView.querySelector('.vcc-mobile-nav').focus({preventScroll: true});
  }

  // El mosaico inicial mantiene las fotos de cada lugar; con 6+ muestra
  // cinco miniaturas y un contador sobre la quinta, igual que Booking.
  function decorate() {
    document.querySelectorAll('.imp-page .gallery').forEach(gallery => {
      const count = Number(gallery.dataset.count);
      const fifth = gallery.querySelector('.gallery-mosaic .gallery-tile:nth-child(5)');
      if (count > 5 && fifth && !fifth.querySelector('.vcc-mobile-more')) {
        const more = document.createElement('span');
        more.className = 'vcc-mobile-more';
        more.textContent = '+' + (count - 5) + ' fotos';
        fifth.append(more);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate, {once: true});
  else decorate();

  // Interceptamos en fase de captura: en móvil, el primer clic abre el
  // mosaico extendido, NO el lightbox antiguo (que sigue en escritorio).
  document.addEventListener('click', event => {
    if (!mobile.matches || !root.hidden) return;
    const tile = event.target.closest('.imp-page .gallery-mosaic .gallery-tile');
    if (!tile) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openGallery(tile.closest('.gallery'));
  }, true);

  root.addEventListener('click', event => {
    const action = event.target.closest('[data-vcc-action]')?.dataset.vccAction;
    if (action === 'exit') returnToGuide();
    if (action === 'grid') showGrid();
    if (action === 'prev') showPhoto(selected - 1);
    if (action === 'next') showPhoto(selected + 1);
  });
  document.addEventListener('keydown', event => {
    if (root.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!photoView.hidden) showGrid();
      else returnToGuide();
    }
    if (!photoView.hidden && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault();
      showPhoto(selected + (event.key === 'ArrowRight' ? 1 : -1));
    }
    if (event.key === 'Tab') {
      const visible = photoView.hidden ? gridView : photoView;
      const buttons = [...visible.querySelectorAll('button:not([disabled])')];
      if (!buttons.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
    }
  });

  let touch = null;
  const stage = root.querySelector('.vcc-mobile-photo-stage');
  stage.addEventListener('touchstart', event => {
    if (photoView.hidden || event.touches.length !== 1) return;
    touch = {x:event.touches[0].clientX, y:event.touches[0].clientY};
  }, {passive: true});
  stage.addEventListener('touchend', event => {
    if (!touch || photoView.hidden || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2)
      showPhoto(selected + (dx < 0 ? 1 : -1));
  }, {passive: true});
  mobile.addEventListener('change', () => {if (!mobile.matches && !root.hidden) returnToGuide();});
})();
