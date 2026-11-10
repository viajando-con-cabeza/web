/* Quality: barra sincronitzada, mosaic Booking i visor accessible amb comptador. */
(() => {
  // Un único controlador del subheader (antes había dos scripts compitiendo).
  // Orden DOM: mapa primero, después las 15 fichas.
  const nav=document.getElementById('placeNav');
  const sections=[...document.querySelectorAll('#mapa-imprescindibles, .imp-main .place[id]')];
  const links=[...(nav?.querySelectorAll('a[href^="#"]')||[])];
  if(nav && sections.length && links.length){
    let active='',queued=false,suppressUntil=0;
    const highlight=id=>{
      if(id===active)return;
      active=id;
      const chosen=links.find(a=>a.hash==='#'+id);
      links.forEach(a=>{
        const selected=a===chosen;
        a.classList.toggle('active',selected);
        a.classList.toggle('is-active',selected);
        if(selected)a.setAttribute('aria-current','location');
        else a.removeAttribute('aria-current');
      });
      if(chosen){
        const left=Math.max(0,chosen.offsetLeft-nav.offsetLeft-(nav.clientWidth-chosen.offsetWidth)/2);
        nav.scrollTo({left,behavior:'smooth'});
      }
    };
    const sync=()=>{
      queued=false;
      if(performance.now()<suppressUntil)return;
      const header=document.querySelector('.shared-header, .page-header');
      const bar=document.querySelector('.place-nav-wrap');
      const limit=(header?.getBoundingClientRect().height||50)+(bar?.getBoundingClientRect().height||43)+26;
      let id=sections[0].id;
      for(const section of sections){
        if(section.getBoundingClientRect().top<=limit) id=section.id;
        else break;
      }
      highlight(id);
    };
    const queue=()=>{if(!queued){queued=true;requestAnimationFrame(sync);}};
    links.forEach(a=>a.addEventListener('click',()=>{
      highlight(decodeURIComponent(a.hash.slice(1)));
      suppressUntil=performance.now()+850;
      setTimeout(queue,900);
    }));
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',queue,{passive:true});
    window.addEventListener('hashchange',()=>{
      const hash=decodeURIComponent(location.hash.slice(1));
      if(sections.some(section=>section.id===hash))highlight(hash);
      suppressUntil=performance.now()+500;
      setTimeout(queue,550);
    });
    const firstHash=decodeURIComponent(location.hash.slice(1));
    highlight(sections.some(section=>section.id===firstHash)?firstHash:sections[0].id);
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
  const r2Demo = document.querySelector('.imp-page[data-gallery-source="r2"]') !== null;
  // Cache fijo: no recrear este Set al pintar cada mosaico o miniatura.
  const archivedPreviews = new Set(['DSC08334.avif','DSC08335.avif','DSC08336.avif','DSC08337.avif','DSC08338.avif','DSC08342.avif','DSC08344.avif','DSC08345.avif']);
  const image = stage?.querySelector(':scope > .lb-photo');
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
  /* La portada de la pàgina carrega R2 amb background-image.
     Fem exactament el mateix per al mosaic, miniatures i visor, sense <img src>.
     No s'injecta cap imatge alternativa ni es repeteixen fotografies. */
  /* Pintat immediat, sense esperes: la foto individual ha d'exposar la
     previsualització al visor en el mateix tick per activar la càrrega progressiva. */
  const useR2Background = (node, src) => {
    node.style.setProperty('background-image', 'url("' + src + '")', 'important');
    node.style.setProperty('background-position', 'center', 'important');
    node.style.setProperty('background-repeat', 'no-repeat', 'important');
  };
  /* Worker automàtic: variants AVIF/WebP de 480px i 1800px.
     Les originals només es carreguen al visor, després de la previsualització. */
  const optimizedPhoto = (original, size='mini') => {
    // Arxipèlag: l'R2 ja guarda les previews a l'arrel de _preview,
    // mentre els AVIF originals són dins paisajes/, bosques/ i mar/.
    // No demanar al Worker una ruta _preview que no existeix.
    const arch = String(original).match(/^https:\/\/img\.viajandoconcabeza\.com\/(destinos\/suecia\/estocolmo-archipelago\/[0-9]{4}-dia8)\/(?:paisajes|bosques|mar)\/(DSC\d+\.avif)$/i);
    if (arch) {
      // Las fotos aún sin derivado se optimizan bajo demanda en el Worker
      // /__vcc_preview/. No descargamos su AVIF original de varios MB.
      return archivedPreviews.has(arch[2])
        ? 'https://img.viajandoconcabeza.com/'+arch[1]+'/_preview/'+size+'/'+arch[2]
        : 'https://img.viajandoconcabeza.com/__vcc_preview/'+size+'/'
          +String(original).slice('https://img.viajandoconcabeza.com/'.length);
    }
    return String(original).replace(/^https:\/\/img\.viajandoconcabeza\.com\/(destinos\/.+\.(?:avif|webp))$/i,
      'https://img.viajandoconcabeza.com/__vcc_preview/'+size+'/$1');
  };
  // Els mosaics fan càrrega diferida: la URL sempre és el WebP original de R2.
  const lazyImages = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      useR2Background(node, node.dataset.r2Image);
      delete node.dataset.r2Image;
      lazyImages.unobserve(node);
    });
  }, {rootMargin:'250px 0px'}) : null;
  const lazyR2Background = (node, url) => {
    if (!lazyImages) { useR2Background(node,url); return; }
    node.dataset.r2Image=url;
    lazyImages.observe(node);
  };
  const show = i => {
    if (!album.length || !image) return;
    current = (i + album.length) % album.length;
    const label = `${placeHeading?.textContent || 'Estocolmo'} · fotografía ${current + 1} de ${album.length}`;
    useR2Background(image, optimizedPhoto(album[current], 'visor'));
    image.setAttribute('aria-label', label);
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
    image.style.removeProperty('background-image');
    if (counter) counter.textContent = '';
    focusBefore?.focus?.({preventScroll:true});
    overlay.dispatchEvent(new CustomEvent('vcc:lightbox-closed'));
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
    if (placeDescription) placeDescription.textContent = place?.querySelector('.place-copy > .place-info-card > p, .place-copy > p')?.textContent?.trim() || '';
    if (placeInfo) placeInfo.scrollTop = 0;
    thumbnails.replaceChildren();
    album.forEach((src,j) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label',`Ver fotografía ${j+1} de ${album.length}`);
      lazyR2Background(button, optimizedPhoto(src, 'mini'));
      button.style.setProperty('background-size', 'cover', 'important');
      button.addEventListener('click',() => show(j));
      thumbnails.append(button);
    });
     overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    show(index);
    close.focus({preventScroll:true});
  };
  /* Exposa el visor existent a la segona fase de galeria d'escriptori.
     Manté el text lateral, el comptador, les fletxes i els WebP actuals. */
  window.VCCImprescindiblesLightbox = {open, dismiss};
  // Normalización R2 compartida: un solo closure para las 14 galerías.
  // Conserva ambas correcciones legacy que evitan los 404 de días de 2026.
  const correctR2Url = value => String(value)
    .replace('/goteborg/-dia1/', '/goteborg/' + '20' + '26-dia1/')
    .replace('/estocolmo-archipelago/-dia8/', '/estocolmo-archipelago/' + '20' + '26-dia8/');
  document.querySelectorAll('.imp-main .gallery').forEach((gallery, placeIndex) => {
    const original = gallery.querySelector('.gallery-main');
    let own = [];
    try {own = JSON.parse(original?.dataset.images || '[]');} catch {own = [];}
    const requested = placeIndex + 1;
    /* Esta guía usa exclusivamente sus fotos R2; no crear ni ordenar imágenes
       Unsplash fallback que luego serán descartadas. Otras guías conservan
       el comportamiento original de sus galerías. */
    const onlyOwn = r2Demo;
    const source = onlyOwn ? [] : placeIndex === 1
      ? [...vasa, ...city]
      : [...city.slice(placeIndex % city.length), ...city.slice(0,placeIndex % city.length)];
    const photos = (onlyOwn ? own.filter(Boolean) : [...new Set([...own.filter(Boolean), ...source])].slice(0,requested)).map(correctR2Url);
    gallery.dataset.images = JSON.stringify(photos);
    gallery.dataset.count = String(photos.length);
    // Permite que una galería concreta muestre menos miniaturas, sin limitar su visor.
    // El resto de galerías de Qué ver mantienen exactamente su configuración.
    const configured = Number(gallery.dataset.mosaicVisible);
    const visible = document.querySelector('[data-vcc-booking-gallery]')
      ? Math.min(5,photos.length) // mosaic VCC universal
      : Number.isInteger(configured) && configured >= 1
        ? Math.min(6, photos.length, configured)
        : Math.min(6, photos.length);
    const mosaic = document.createElement('div');
    mosaic.className = `gallery-mosaic count-${visible}`;
    photos.slice(0,visible).forEach((src,index) => {
      const tile = document.createElement('button');
      tile.type='button'; tile.className='gallery-tile'; tile.dataset.i=String(index);
      tile.setAttribute('aria-label',`Ampliar fotografía ${index+1} de ${photos.length}`);
      if (gallery.dataset.seoImages === 'true') {
        // Solo en las galerías marcadas: <img> real, con alt, sin CSS background duplicado.
        // Conservamos el botón, el mosaico y el visor de Qué ver sin cambios.
        const img=document.createElement('img');
        img.src=optimizedPhoto(src, 'mini');
        const placeName=gallery.closest('.place')?.querySelector('.place-heading h2')?.textContent?.trim()||'Estocolmo';
        const subject=/\/bosques\//.test(src)?' · paisaje forestal':
          /\/mar\//.test(src)?' · costa y mar':'';
        img.alt=placeName+subject+' · imagen '+(index+1)+' de '+photos.length;
        img.width=450;img.height=300;
        img.loading='lazy';img.decoding='async';
        img.onerror=()=>{ if (img.src!==src) img.src=src; };
        tile.append(img);
      } else {
        lazyR2Background(tile, optimizedPhoto(src, 'mini'));
        tile.style.setProperty('background-size', 'cover', 'important');
      }
      const extras = photos.length - visible;
      if (index === visible - 1 && extras > 0) {
        const more=document.createElement('span');more.className='gallery-more';
        more.textContent=`+${extras} ${extras===1?'foto':'fotos'}`;
        tile.append(more);
      }
      // El visor VCC compartit gestiona el clic quan hi ha un modal universal.
      if (!document.querySelector('[data-vcc-booking-gallery]')) tile.addEventListener('click',() => open(gallery,index));
      mosaic.append(tile);
    });
    gallery.replaceChildren(mosaic);
  });
  /* Recomanació al final de la guia: mateix llenguatge visual, sense pressupost. */
  const main = document.querySelector('.imp-page .imp-main');
  // Aquesta targeta antiga és exclusiva d'Estocolmo; en altres ciutats
  // no s'han de mostrar ni fotos ni textos d'un altre destí.
  if (main && !main.hasAttribute('data-no-itinerary-feature') && /^\/destinos\/suecia\/estocolmo\//.test(location.pathname) &&
      !document.querySelector('.imp-page .related-section') &&
      !document.getElementById('vcc-itinerary-feature')) {
    const feature = document.createElement('section');
    feature.id = 'vcc-itinerary-feature';
    feature.className = 'vcc-itinerary-feature';
    feature.setAttribute('aria-labelledby','vcc-itinerary-feature-title');
    feature.innerHTML = `<a class="vcc-itinerary-feature-image" href="itinerario.html?dias=3" aria-label="Ver itinerario de Estocolmo en 3 días"><img loading="lazy" src="/configuracion/imagenes/externas/unsplash/photo-1509356843151-3e7d96241e11.webp" alt="Vista panorámica de Estocolmo"><span>ITINERARIO DESTACADO</span></a><div class="vcc-itinerary-feature-copy"><span class="vcc-itinerary-feature-kicker">DESCUBRE ESTOCOLMO</span><h2 id="vcc-itinerary-feature-title">ESTOCOLMO EN 3 DÍAS</h2><p>Del encanto de Gamla Stan a los museos de Djurgården y los miradores de Södermalm. Organiza tu escapada con una ruta por horas, fotografías y mapas interactivos.</p><div class="vcc-itinerary-feature-details"><span>◷ 3 días</span><span>⌖ Mapa interactivo</span><span>↗ Ruta día a día</span></div><a class="vcc-itinerary-feature-cta" href="itinerario.html?dias=3">VER ITINERARIO COMPLETO →</a></div>`;
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
    // Quan s'amplia la foto a l'ordinador, el drag mou la imatge; no canvia de diapositiva.
    if (image.classList.contains('vcc-dg-is-zoomed')) { pointerDrag=null;return; }
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
