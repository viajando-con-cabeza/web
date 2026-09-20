(() => {
  /* La página de itinerario comparte ahora escala y márgenes con la guía. */
  const aligned = document.createElement('link');
  aligned.rel = 'stylesheet';
  aligned.href = 'itinerario-quality-alineacion.css?v=1';
  document.head.append(aligned);

  const navRoot = document.querySelector('.vcc-nav-inner');
  if (navRoot) {
    const dayLinks = [...document.querySelectorAll('.day-section[id]')].map(section => ({
      href: `#${section.id}`,
      label: `DÍA ${section.id.replace(/^dia/, '')}`
    }));
    navRoot.replaceChildren();
    [{href:'#resumen',label:'INTRODUCCIÓN'}, ...dayLinks].forEach(({href,label}) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      navRoot.append(a);
    });
  }
  /* Contexto editorial corto para cada parada; los horarios existentes se respetan. */
  const notes = {
    dia1: [
      'Comienza por el palacio y su entorno histórico.',
      'Recorre la plaza y observa sus fachadas de colores.',
      'Pasea por las calles antiguas y sus rincones.',
      'Haz una pausa para comer en el casco antiguo.',
      'Acércate a la isla y disfruta de las vistas.',
      'Termina la jornada junto al agua.'
    ],
    dia2: [
      'Reserva tiempo para conocer el barco y su historia.',
      'Camina por los senderos y espacios verdes de la isla.',
      'Descansa antes de continuar con las visitas.',
      'Escoge la visita que más te apetezca; no hace falta verlo todo.',
      'Disfruta del trayecto sobre el agua al regresar.'
    ],
    dia3: [
      'Descubre las calles y tiendas del barrio a tu ritmo.',
      'Haz una parada para contemplar la ciudad.',
      'Tómate un descanso en una cafetería.',
      'Elige entre fotografía contemporánea y arte en las estaciones.',
      'Termina explorando otra zona del centro.'
    ]
  };
  document.querySelectorAll('.day-section[id]').forEach(section => {
    section.querySelectorAll('.timeline li').forEach((stop,index) => {
      const destination = stop.querySelector('span');
      if (!destination || destination.querySelector('.stop-detail')) return;
      const note = notes[section.id]?.[index];
      if (!note) return;
      const detail = document.createElement('small');
      detail.className = 'stop-detail';
      detail.textContent = note;
      destination.append(detail);
    });
  });

  const modal = document.getElementById('dayLightbox');
  if (!modal) return;
  const galleryFix = document.createElement('style');
  galleryFix.textContent = '.day-mosaic.count-4{grid-template-columns:1.25fr 1fr 1fr!important;grid-template-rows:repeat(2,minmax(0,1fr))!important}.day-mosaic.count-4 button:first-child{grid-column:1;grid-row:1/3}.day-mosaic.count-4 button:nth-child(2){grid-column:2/4;grid-row:1}.day-mosaic.count-4 button:nth-child(3){grid-column:2;grid-row:2}.day-mosaic.count-4 button:nth-child(4){display:block!important;grid-column:3;grid-row:2}';
  document.head.append(galleryFix);
  const stage = modal.querySelector('.day-lightbox-stage');
  const image = modal.querySelector('.day-lightbox-stage > img');
  const counter = modal.querySelector('.day-lightbox-counter');
  const thumbs = modal.querySelector('.day-lightbox-thumbs');
  const title = modal.querySelector('.day-lightbox-info h3');
  const description = modal.querySelector('.day-lightbox-info p');
  const close = modal.querySelector('.day-lightbox-close');
  let currentImages = [], currentIndex = 0, lastFocus = null, originX = null, originY = null;
  const galleries = document.querySelectorAll('.day-mosaic');
  const render = () => {
    if (!currentImages.length) return;
    const item = currentImages[currentIndex];
    image.src = item.src;
    image.alt = item.alt;
    counter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
    thumbs.replaceChildren();
    currentImages.forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = index === currentIndex ? 'active' : '';
      button.setAttribute('aria-label', `Ver foto ${index + 1} de ${currentImages.length}`);
      const thumb = document.createElement('img');
      thumb.src = photo.src;
      thumb.alt = photo.alt;
      button.append(thumb);
      button.addEventListener('click', () => { currentIndex = index; render(); });
      thumbs.append(button);
      if (index === currentIndex) button.scrollIntoView({block:'nearest',inline:'nearest'});
    });
  };
  const move = delta => { if (!currentImages.length) return; currentIndex = (currentIndex + delta + currentImages.length) % currentImages.length; render(); };
  const hide = () => { modal.hidden = true; document.body.style.overflow = ''; image.removeAttribute('src'); if (lastFocus?.focus) lastFocus.focus(); };
  galleries.forEach(gallery => {
    const buttons = [...gallery.querySelectorAll('button[data-photo]')];
    const images = buttons.map(button => ({src:button.dataset.photo,alt:button.querySelector('img')?.alt || gallery.dataset.title || 'Estocolmo'}));
    buttons.forEach((button,index) => button.addEventListener('click', () => {
      currentImages = images; currentIndex = index; lastFocus = button;
      title.textContent = gallery.dataset.title || '';
      description.textContent = gallery.dataset.description || '';
      modal.hidden = false; document.body.style.overflow = 'hidden';
      render(); close.focus();
    }));
  });
  close.addEventListener('click', hide);
  modal.querySelector('.day-lightbox-prev').addEventListener('click', () => move(-1));
  modal.querySelector('.day-lightbox-next').addEventListener('click', () => move(1));
  modal.addEventListener('click', e => { if (e.target === modal) hide(); });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') hide();
    else if (e.key === 'ArrowRight') move(1);
    else if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'Tab') { const focusables = [...modal.querySelectorAll('button:not([disabled])')]; const index = focusables.indexOf(document.activeElement); if (e.shiftKey && index === 0) {e.preventDefault();focusables.at(-1).focus();} else if (!e.shiftKey && index === focusables.length-1) {e.preventDefault();focusables[0].focus();} }
  });
  stage.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; originX = e.clientX; originY = e.clientY; try { stage.setPointerCapture(e.pointerId); } catch (_) {} });
  stage.addEventListener('pointerup', e => { if (originX === null) return; const dx = e.clientX - originX, dy = e.clientY - originY; originX = originY = null; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) move(dx < 0 ? 1 : -1); });
  stage.addEventListener('pointercancel', () => { originX = originY = null; });
  const nav = [...document.querySelectorAll('.vcc-nav a[href^="#"]')];
  const updateNav = () => { const hash = location.hash || '#resumen'; nav.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === hash)); };
  window.addEventListener('hashchange', updateNav); updateNav();
})();