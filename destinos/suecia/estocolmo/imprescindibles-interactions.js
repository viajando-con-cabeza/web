/* Quality: barra sincronitzada, mosaic Booking i visor accessible amb comptador. */
(() => {
  const nav = document.getElementById('placeNav');
  const sections = [...document.querySelectorAll('.imp-main .place[id]')];
  const links = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  if (nav && sections.length && links.length) {
    let active = '', queued = false;
    const highlight = id => {
      if (active === id) return;
      active = id;
      const chosen = links.find(a => a.getAttribute('href') === '#' + id);
      links.forEach(a => {
        a.classList.toggle('active', a === chosen);
        if (a === chosen) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
      if (chosen) nav.scrollTo({left: Math.max(0, chosen.offsetLeft - nav.offsetLeft - (nav.clientWidth - chosen.offsetWidth) / 2), behavior:'smooth'});
    };
    const sync = () => {
      queued = false;
      const header = document.querySelector('.shared-header');
      const bar = document.querySelector('.place-nav-wrap');
      const limit = (header?.offsetHeight || 50) + (bar?.offsetHeight || 43) + 45;
      let id = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= limit) id = section.id;
        else break;
      }
      highlight(id);
    };
    const queue = () => {if (!queued) {queued = true; requestAnimationFrame(sync);}};
    links.forEach(a => a.addEventListener('click', () => highlight(a.hash.slice(1))));
    window.addEventListener('scroll', queue, {passive:true});
    window.addEventListener('resize', queue);
    window.addEventListener('hashchange', queue);
    queue();
  }

  /* Fotografies de demostració: es poden substituir per originals de VCC. */
  const unsplash = id => `https://unsplash.com/photos/${id}/download?w=1200`;
  const city = [
    'mJAMq6b5yQo','Mr4pKe6GvSI','VPPIMOrXasA','Oa0VyfkUyuo','4R2byovEbLc',
    'EAe_AWX92ds','MTVNmZ3giQA','ovCfRHRg2IQ','UZC72aP5gog','qLpKUb-ScZY',
    '2WP6etuxw98','Xca0hoSXaRg','vFxwpG3R2XU','TM10cRgMaiI','17fQ9mJT-aw'
  ].map(unsplash);
  const vasa = ['TM10cRgMaiI','17fQ9mJT-aw','Lr9PlVUih_0','rFErChXo_qQ','PgTkZZLsl-s'].map(unsplash);
  const overlay = document.getElementById('lightbox');
  const stage = overlay?.querySelector('.lb-stage');
  const image = stage?.querySelector(':scope > img');
  const thumbnails = stage?.querySelector('.lb-thumbs');
  const caption = stage?.querySelector('.lb-caption');
  const previous = stage?.querySelector('.lb-prev');
  const next = stage?.querySelector('.lb-next');
  const close = stage?.querySelector('.lb-close');
  let counter = stage?.querySelector('.lb-counter');
  if (stage && thumbnails && !counter) {
    counter = document.createElement('div');
    counter.className = 'lb-counter';
    counter.setAttribute('role', 'status');
    counter.setAttribute('aria-live', 'polite');
    stage.insertBefore(counter, thumbnails);
  }
  /* Reutilitzem la descripció editorial que ja apareix a cada fitxa. */
  let placeInfo = stage?.querySelector('.lb-place-info');
  let placeDescription = placeInfo?.querySelector('p');
  if (stage && !placeInfo) {
    placeInfo = document.createElement('aside');
    placeInfo.className = 'lb-place-info';
    placeInfo.setAttribute('aria-label', 'Descripción del lugar');
    const heading = document.createElement('h3');
    placeDescription = document.createElement('p');
    placeInfo.append(heading, placeDescription);
    stage.append(placeInfo);
  }
  const placeHeading = placeInfo?.querySelector('h3');
  let album = [], current = 0, focusBefore = null;
  const show = i => {
    if (!album.length || !image) return;
    current = (i + album.length) % album.length;
    image.src = album[current];
    image.alt = `${placeHeading?.textContent || 'Estocolmo'} · fotografía ${current + 1} de ${album.length}`;
    if (counter) counter.textContent = `${current + 1} / ${album.length}`;
    [...thumbnails.children].forEach((button,j) => {
      button.classList.toggle('active',j === current);
      button.setAttribute('aria-pressed', String(j === current));
    });
    const selected = thumbnails.children[current];
    if (selected) thumbnails.scrollTo({left:Math.max(0,selected.offsetLeft - thumbnails.offsetLeft - (thumbnails.clientWidth - selected.offsetWidth)/2),behavior:'smooth'});
    previous.hidden = next.hidden = album.length < 2;
  };
  const dismiss = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    image.removeAttribute('src');
    if (counter) counter.textContent = '';
    focusBefore?.focus?.();
  };
  const open = (gallery, index) => {
    if (!overlay || !image || !thumbnails || !close) return;
    try {album = JSON.parse(gallery.dataset.images || '[]');} catch {album = [];}
    if (!album.length) return;
    focusBefore = document.activeElement;
    const place = gallery.closest('.place');
    const placeName = place?.querySelector('h2')?.textContent?.trim() || 'Estocolmo';
    if (caption) caption.textContent = '';
    if (placeHeading) placeHeading.textContent = placeName;
    if (placeDescription) placeDescription.textContent = place?.querySelector('.place-copy > p')?.textContent?.trim() || '';
    if (placeInfo) placeInfo.scrollTop = 0;
    thumbnails.replaceChildren();
    album.forEach((src,j) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label',`Ver fotografía ${j+1} de ${album.length}`);
      const thumb = document.createElement('img'); thumb.src = src; thumb.alt = '';
      button.append(thumb);
      button.addEventListener('click',() => show(j));
      thumbnails.append(button);
    });
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    show(index);
    close.focus();
  };
  document.querySelectorAll('.imp-main .gallery').forEach((gallery, placeIndex) => {
    const original = gallery.querySelector('.gallery-main');
    let own = [];
    try {own = JSON.parse(original?.dataset.images || '[]');} catch {own = [];}
    const requested = placeIndex + 1;
    const source = placeIndex === 1 ? [...vasa, ...city] : [...city.slice(placeIndex % city.length), ...city.slice(0,placeIndex % city.length)];
    const photos = [...new Set([...own.filter(Boolean), ...source])].slice(0,requested);
    gallery.dataset.images = JSON.stringify(photos);
    gallery.dataset.count = String(photos.length);
    const mosaic = document.createElement('div');
    mosaic.className = `gallery-mosaic count-${Math.min(photos.length,5)}`;
    photos.slice(0,5).forEach((src,index) => {
      const tile = document.createElement('button');
      tile.type='button'; tile.className='gallery-tile'; tile.dataset.i=String(index);
      tile.setAttribute('aria-label',`Ampliar fotografía ${index+1} de ${photos.length}`);
      const img=document.createElement('img'); img.src=src;
      img.alt=`${gallery.closest('.place')?.querySelector('h2')?.textContent || 'Estocolmo'} · fotografía ${index+1}`;
      img.loading='lazy';
      tile.append(img);
      if (index === 4 && photos.length > 5) {
        const more=document.createElement('span'); more.className='gallery-more';
        more.textContent=`+${photos.length-5} fotos más`;
        tile.append(more);
      }
      tile.addEventListener('click',() => open(gallery,index));
      mosaic.append(tile);
    });
    gallery.replaceChildren(mosaic);
  });
  /* Recomanació al final de la guia: mateix llenguatge visual, sense pressupost. */
  const main = document.querySelector('.imp-page .imp-main');
  if (main && !document.getElementById('vcc-itinerary-feature')) {
    const feature = document.createElement('section');
    feature.id = 'vcc-itinerary-feature';
    feature.className = 'vcc-itinerary-feature';
    feature.setAttribute('aria-labelledby','vcc-itinerary-feature-title');
    feature.innerHTML = `<a class="vcc-itinerary-feature-image" href="itinerario.html?dias=3" aria-label="Ver itinerario de Estocolmo en 3 días"><img loading="lazy" src="https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=85" alt="Vista panorámica de Estocolmo"><span>ITINERARIO DESTACADO</span></a><div class="vcc-itinerary-feature-copy"><span class="vcc-itinerary-feature-kicker">DESCUBRE ESTOCOLMO</span><h2 id="vcc-itinerary-feature-title">ESTOCOLMO EN 3 DÍAS</h2><p>Del encanto de Gamla Stan a los museos de Djurgården y los miradores de Södermalm. Organiza tu escapada con una ruta por horas, fotografías y mapas interactivos.</p><div class="vcc-itinerary-feature-details"><span>◷ 3 días</span><span>⌖ Mapa interactivo</span><span>↗ Ruta día a día</span></div><a class="vcc-itinerary-feature-cta" href="itinerario.html?dias=3">VER ITINERARIO COMPLETO →</a></div>`;
    main.after(feature);
  }
  if (!overlay || !image || !thumbnails || !previous || !next || !close) return;
  previous.addEventListener('click',() => show(current-1));
  next.addEventListener('click',() => show(current+1));
  close.addEventListener('click',dismiss);
  overlay.addEventListener('click',e => {if (e.target === overlay) dismiss();});

  /* El gest anterior només escoltava sobre l'element img: si la foto era
     horitzontal i hi havia marges blancs, l'arrossegament no s'iniciava.
     Escoltem tota la franja visual i distingim el gest horitzontal del scroll. */
  image.draggable = false;
  image.style.userSelect = 'none';
  image.style.webkitUserSelect = 'none';
  image.style.cursor = 'grab';
  image.addEventListener('dragstart', e => e.preventDefault());
  const overPhoto = (x, y) => {
    const area = image.getBoundingClientRect();
    return x >= area.left - 24 && x <= area.right + 24 && y >= area.top && y <= area.bottom;
  };
  const switchOnSwipe = (dx, dy) => {
    if (album.length > 1 && Math.abs(dx) >= 38 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      show(current + (dx < 0 ? 1 : -1));
    }
  };
  let pointerDrag = null;
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !overlay.classList.contains('open') || album.length < 2 || !overPhoto(e.clientX, e.clientY)) return;
    pointerDrag = {id:e.pointerId, x:e.clientX, y:e.clientY};
    image.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('pointerup', e => {
    if (!pointerDrag || pointerDrag.id !== e.pointerId) return;
    const drag = pointerDrag;
    pointerDrag = null;
    image.style.cursor = 'grab';
    if (overlay.classList.contains('open')) switchOnSwipe(e.clientX - drag.x, e.clientY - drag.y);
  });
  window.addEventListener('pointercancel', () => {pointerDrag = null; image.style.cursor = 'grab';});
  window.addEventListener('blur', () => {pointerDrag = null; image.style.cursor = 'grab';});
  let touchDrag = null;
  stage.addEventListener('touchstart', e => {
    if (!overlay.classList.contains('open') || album.length < 2 || e.touches.length !== 1) {touchDrag = null; return;}
    const t = e.touches[0];
    touchDrag = overPhoto(t.clientX, t.clientY) ? {id:t.identifier, x:t.clientX, y:t.clientY} : null;
  }, {passive:true});
  stage.addEventListener('touchend', e => {
    if (!touchDrag) return;
    const t = [...e.changedTouches].find(t => t.identifier === touchDrag.id);
    if (t) switchOnSwipe(t.clientX - touchDrag.x, t.clientY - touchDrag.y);
    touchDrag = null;
  }, {passive:true});
  stage.addEventListener('touchcancel', () => {touchDrag = null;}, {passive:true});

  document.addEventListener('keydown',e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') dismiss();
    if (e.key === 'ArrowLeft' && album.length > 1) show(current-1);
    if (e.key === 'ArrowRight' && album.length > 1) show(current+1);
    if (e.key === 'Tab') {
      const focusable = [...overlay.querySelectorAll('button:not([hidden])')].filter(button => button.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length-1];
      if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
      else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
    }
  });
  overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Galería de fotografías'); overlay.setAttribute('aria-hidden','true');
})();
