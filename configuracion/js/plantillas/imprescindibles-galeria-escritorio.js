/* VCC · galeria d'imprescindibles per a ordinador (quality).
   Primer clic: mosaic desplegat 3/3/3. Segon clic: visor original amb text lateral.
   En mòbils no intervé: segueix funcionant la galeria vertical existent. */
(() => {
  'use strict';
  const desktop = window.matchMedia('(min-width: 801px)');
  // La variant petita es crea i es desa automàticament a R2 via Worker.
  const miniUrl = source => String(source).replace(/^https:\/\/img\.viajandoconcabeza\.com\/(destinos\/.+\.(?:avif|webp))$/i,
    'https://img.viajandoconcabeza.com/__vcc_preview/mini/$1');

  const layer = document.createElement('div');
  layer.id = 'vcc-desktop-gallery';
  layer.hidden = true;
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-hidden', 'true');
  layer.setAttribute('aria-label', 'Galería de fotografías');
  layer.innerHTML = [
    '<div class="vcc-dg-panel">',
      '<div class="vcc-dg-top">',
        '<button class="vcc-dg-back" type="button" data-vcc-dg="close" aria-label="Volver a la guía">← <span>Volver a la guía</span></button>',
        '<div class="vcc-dg-heading"><strong></strong></div>',
        '<button class="vcc-dg-close" type="button" data-vcc-dg="close" aria-label="Cerrar galería">×</button>',
      '</div>',
      '<div class="vcc-dg-main">',
        '<div class="vcc-dg-scroll" tabindex="0" aria-label="Fotografías de la galería">',
          '<div class="vcc-dg-grid"></div>',
        '</div>',
        '<aside class="vcc-dg-sidebar">',
          '<div class="vcc-dg-sidebar-content">',
            '<h3 class="vcc-dg-place"></h3>',
            '<p class="vcc-dg-description"></p>',
          '</div>',
        '</aside>',
      '</div>',
    '</div>',
  ].join('');
  document.body.append(layer);
  const grid = layer.querySelector('.vcc-dg-grid');
  const scroll = layer.querySelector('.vcc-dg-scroll');
  const mosaicPanel = layer.querySelector('.vcc-dg-panel');
  const heading = layer.querySelector('.vcc-dg-heading strong');
  const asideTitle = layer.querySelector('.vcc-dg-place');
  const asideDescription = layer.querySelector('.vcc-dg-description');
  const closeButton = layer.querySelector('.vcc-dg-close');
  const existingLightbox = document.getElementById('lightbox');
  const existingStage = existingLightbox?.querySelector('.lb-stage');
  let activeGallery = null;
  let focusedBefore = null;
  let clickedGridImage = null;
  let activeSources = [];

  // Mismo botón de retroceso que Booking dentro del visor actual.
  let backFromPhoto = null;
  if (existingStage) {
    backFromPhoto = document.createElement('button');
    backFromPhoto.type = 'button';
    backFromPhoto.className = 'vcc-dg-photo-back';
    backFromPhoto.textContent = '← Galería';
    backFromPhoto.setAttribute('aria-label', 'Volver a las tres fotos por fila');
    backFromPhoto.addEventListener('click', () => window.VCCImprescindiblesLightbox?.dismiss());
    existingStage.append(backFromPhoto);
  }

  const closeGallery = () => {
    if (existingLightbox?.classList.contains('open')) {
      window.VCCImprescindiblesLightbox?.dismiss();
    }
    resetViewerPan();
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('vcc-desktop-gallery-open');
    clearNativeGalleryLayout();
    window.VCCGalleryScrollLock?.release('desktop');
    activeGallery = null;
    clickedGridImage = null;
    activeSources = [];
    grid.replaceChildren();
    if (focusedBefore?.isConnected) focusedBefore.focus({preventScroll:true});
    focusedBefore = null;
  };

  const openPhoto = (index, tile) => {
    if (!activeGallery || typeof window.VCCImprescindiblesLightbox?.open !== 'function') return;
    clickedGridImage = tile;
    resetHoverPan();
    layer.setAttribute('aria-hidden', 'true');
    window.VCCImprescindiblesLightbox.open(activeGallery, index);
    if(existingLightbox){
      existingLightbox.scrollLeft=layer.scrollLeft;
      existingLightbox.scrollTop=layer.scrollTop;
    }
    syncViewerPan();
    /* El visor ampliat comparteix títol i informació amb el mosaic previ. */
    const name = heading.textContent;
    const caption = existingStage?.querySelector('.lb-caption');
    const infoTitle = existingStage?.querySelector('.lb-place-info h3');
    const infoText = existingStage?.querySelector('.lb-place-info p');
    if (caption) caption.textContent = name;
    if (infoTitle) infoTitle.textContent = asideTitle.textContent;
    if (infoText) infoText.textContent = asideDescription.textContent;
    existingLightbox?.classList.toggle('vcc-dg-single', Number(activeGallery.dataset.count) === 1);
    syncRoundedPhoto();
  };

  const openGallery = gallery => {
    let sources;
    try { sources = JSON.parse(gallery.dataset.images || '[]'); }
    catch {sources = [];}
    if (!Array.isArray(sources) || !sources.length) return;
    const section = gallery.closest('.place');
    if (!section) return;
    activeGallery = gallery;
    activeSources = sources;
    focusedBefore = document.activeElement;
    const name = section.querySelector('.place-heading h2')?.textContent?.trim() || 'Galería';
    const copy = section.querySelector('.place-copy > p')?.textContent?.trim() || '';
    const subtitle = section.querySelector('.place-copy .place-kicker')?.textContent?.trim() || name;
    heading.textContent = name;
    asideTitle.textContent = subtitle;
    asideDescription.textContent = copy;

    const fragment = document.createDocumentFragment();
    sources.forEach((url,index) => {
      const button = document.createElement('button');
      button.type='button';
      button.className='vcc-dg-tile';
      button.setAttribute('aria-label','Ampliar fotografía '+(index+1)+' de '+sources.length);
      const img=document.createElement('img');
      img.src=miniUrl(url);
      img.onerror=()=>{ if(img.src!==url) img.src=url; };
      img.alt=name+' · fotografía '+(index+1);
      img.loading='lazy';
      img.decoding='async';
      button.append(img);
      button.addEventListener('click',()=>openPhoto(index,button));
      fragment.append(button);
    });
    grid.replaceChildren(fragment);
    scroll.scrollTop=0;
    layer.hidden=false;
    layer.setAttribute('aria-hidden','false');
    document.body.classList.add('vcc-desktop-gallery-open');
    window.VCCGalleryScrollLock?.acquire('desktop');
    startPanBaseline();
    closeButton.focus({preventScroll:true});
  };

  // Intercepta només l'escriptori i només el mosaic de la guia.
  // El mosaic del mòbil i el lightbox original continuen iguals.
  document.addEventListener('click', event => {
    if (!desktop.matches || !layer.hidden) return;
    const tile=event.target.closest('.imp-page .gallery-mosaic .gallery-tile');
    if (!tile) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openGallery(tile.closest('.gallery'));
  },true);

  layer.addEventListener('click',event => {
    if (event.target.closest('[data-vcc-dg="close"]')) closeGallery();
    else if(event.target===layer) closeGallery();
  });

  // Al visor individual, la X tanca TOTA la galeria.
  // La fletxa «← Galería» continua tornant només al mosaic.
  // Capturem el clic abans del dismiss genèric del lightbox.
  existingLightbox?.addEventListener('click',event=>{
    if(layer.hidden || !existingLightbox.classList.contains('open'))return;
    if(!event.target.closest('.lb-close'))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeGallery();
  },true);

  /* Visor individual: zoom amb rodeta amunt/avall, sense clic. */
  const enlargedPhoto = existingStage?.querySelector('.lb-photo');
  // La imatge era un fons CSS: per arrodonir les cantonades visibles,
  // superposem el mateix fitxer WebP amb un element <img> real.
  let roundedImage = null;
  if (enlargedPhoto) {
    const matte = document.createElement('div');
    matte.className = 'vcc-dg-rounded-matte';
    matte.setAttribute('aria-hidden', 'true');
    roundedImage = document.createElement('img');
    roundedImage.alt = '';
    roundedImage.decoding = 'async';
    roundedImage.draggable = false;
    matte.append(roundedImage);
    enlargedPhoto.append(matte);
  }
  let photoSequence=0;
  let upgradeTimer=null;
  // El visor obre una previsualització nítida de R2 immediatament,
  // i després substitueix el mateix <img> per l'original ja descodificat.
  // No hi ha una segona capa de zoom ni descàrregues originals al mosaic.
  function syncRoundedPhoto() {
    if (!enlargedPhoto || !roundedImage) return;
    const sequence=++photoSequence;
    clearTimeout(upgradeTimer);
    enlargedPhoto.classList.remove('vcc-dg-rounded-ready');
    if (!photoVisible()) return;
    const originalUrl=photoSource();
    const raw=enlargedPhoto.style.backgroundImage;
    const quoted=raw.startsWith('url(') ? raw.slice(4,-1).trim() : '';
    const previewUrl=(quoted.startsWith('"') || quoted.startsWith("'")) ? quoted.slice(1,-1) : quoted;
    if (!previewUrl || previewUrl==='none') return;
    roundedImage.onload=()=>{
      if (sequence!==photoSequence || !photoVisible()) return;
      enlargedPhoto.classList.add('vcc-dg-rounded-ready');
      if (!originalUrl || previewUrl===originalUrl) return;
      upgradeTimer=setTimeout(()=>{
        if (sequence!==photoSequence || !photoVisible()) return;
        const full=new Image();
        full.alt='';
        full.draggable=false;
        full.decoding='async';
        full.onload=async()=>{
          try {if (full.decode) await full.decode();} catch (_) {}
          if (sequence!==photoSequence || !photoVisible()) return;
          // Conservem l'ampliació si el WebP original arriba mentre fem zoom.
          full.style.transform=roundedImage.style.transform;
          full.style.transformOrigin=roundedImage.style.transformOrigin;
          roundedImage.replaceWith(full);
          roundedImage=full;
        };
        full.onerror=()=>{}; // La previsualització segueix visible.
        full.src=originalUrl;
      },180);
    };
    roundedImage.onerror=()=>{
      if (sequence!==photoSequence) return;
      // Si falta el derivat, recuperem directament l'original de R2.
      if (originalUrl && roundedImage.getAttribute('src')!==originalUrl) {
        roundedImage.src=originalUrl;
      }
    };
    if (roundedImage.getAttribute('src')!==previewUrl) roundedImage.src=previewUrl;
    else if (roundedImage.complete && roundedImage.naturalWidth) roundedImage.onload();
  }
  // No depenem de min-width:801px: Ctrl+rodeta pot travessar aquest breakpoint.
  const photoVisible = () => document.body.classList.contains('vcc-desktop-gallery-open') &&
    !layer.hidden && existingLightbox?.classList.contains('open') && !!enlargedPhoto;

  function photoSource() {
    const count=existingStage?.querySelector('.lb-counter')?.textContent||'';
    const position=Number.parseInt(count.split('/')[0].trim(),10);
    return Number.isInteger(position) ? activeSources[position-1] : null;
  }

  // El fons queda fixat amb VCCGalleryScrollLock; únicament les dues
  // galeries tenen un viewport desplaçable propi. D'aquesta manera Ctrl+rodeta
  // amplia la pàgina de forma nativa sense desplaçar el contingut del blog.
  let viewportBaseline=null;
  let zoomSyncPending=false;
  let zoomWheelFallback=1;
  let lastHoverPan=null;
  let hoverPanRaf=0;
  let hoverPanDeltaX=0;
  let hoverPanDeltaY=0;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const resetHoverPan=()=>{
    lastHoverPan=null;
    hoverPanDeltaX=hoverPanDeltaY=0;
    if(hoverPanRaf){cancelAnimationFrame(hoverPanRaf);hoverPanRaf=0;}
  };
  const zoomRatio=()=>{
    if(!viewportBaseline)return 1;
    const vv=window.visualViewport;
    const cssZoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
    const observed=Math.max(
      viewportBaseline.w/Math.max(1,window.innerWidth),
      viewportBaseline.h/Math.max(1,window.innerHeight),
      (window.devicePixelRatio||1)/Math.max(.01,viewportBaseline.dpr),
      (vv?.scale||1)/Math.max(.01,viewportBaseline.visualScale),
      viewportBaseline.vvWidth/Math.max(1,vv?.width||window.innerWidth),
      viewportBaseline.vvHeight/Math.max(1,vv?.height||window.innerHeight),
      cssZoom/Math.max(.01,viewportBaseline.cssZoom)
    );
    // Some Edge configurations report zoom in the wheel event before their
    // viewport measurements change. Keep a bounded fallback in that case.
    return observed>1.025 ? observed : zoomWheelFallback;
  };
  const currentGalleryViewport=()=>{
    if(layer.hidden || !viewportBaseline)return null;
    return existingLightbox?.classList.contains('open') ? existingLightbox : layer;
  };
  const updateMosaicZoomMode=()=>{
    if(layer.hidden || !viewportBaseline)return;
    // Només canviem el scroll interior del mosaic. El marc exterior
    // sempre és 100vw × 100dvh: no es redimensiona artificialment.
    layer.classList.toggle('vcc-mosaic-native-zoom',zoomRatio()>1.025);
  };
  const queueMosaicZoomSync=()=>{
    if(zoomSyncPending)return;
    zoomSyncPending=true;
    requestAnimationFrame(()=>{
      zoomSyncPending=false;
      updateMosaicZoomMode();
    });
  };
  const flushHoverPan=()=>{
    hoverPanRaf=0;
    const modal=currentGalleryViewport();
    const dx=hoverPanDeltaX,dy=hoverPanDeltaY;
    hoverPanDeltaX=hoverPanDeltaY=0;
    if(!modal)return;
    const availableX=Math.max(0,modal.scrollWidth-modal.clientWidth);
    const availableY=Math.max(0,modal.scrollHeight-modal.clientHeight);
    if(availableX<2 && availableY<2)return;
    // One full cursor sweep can cover an oversized panel, without sudden
    // automatic recentering or animation after the mouse stops.
    const gainX=Math.max(1,Math.min(4,availableX/Math.max(1,modal.clientWidth*.8)));
    const gainY=Math.max(1,Math.min(4,availableY/Math.max(1,modal.clientHeight*.8)));
    if(dx && availableX>0)modal.scrollLeft+=dx*gainX;
    if(dy && availableY>0)modal.scrollTop+=dy*gainY;
  };
  const onGalleryMouseMove=event=>{
    if(event.type==='pointermove' && event.pointerType && event.pointerType!=='mouse')return;
    if(event.buttons!==0)return;
    const modal=currentGalleryViewport();
    if(!modal)return;
    // A real scrollable area is more reliable than zoom percentage alone.
    // This also covers Edge's visual viewport zoom with unchanged innerWidth.
    const availableX=modal.scrollWidth-modal.clientWidth;
    const availableY=modal.scrollHeight-modal.clientHeight;
    const isZoomed=zoomRatio()>1.025;
    if(!isZoomed){
      resetHoverPan();
      return;
    }
    if(availableX<2 && availableY<2){
      queueMosaicZoomSync();
      return;
    }
    const mode=modal===layer ? 'mosaic':'photo';
    const now={mode,x:event.clientX,y:event.clientY};
    const prev=lastHoverPan;
    lastHoverPan=now;
    if(!prev || prev.mode!==mode)return;
    const dx=now.x-prev.x,dy=now.y-prev.y;
    if(Math.abs(dx)>140 || Math.abs(dy)>140)return;
    if(Math.abs(dx)<.1 && Math.abs(dy)<.1)return;
    hoverPanDeltaX+=dx;
    hoverPanDeltaY+=dy;
    if(!hoverPanRaf)hoverPanRaf=requestAnimationFrame(flushHoverPan);
  };
  window.addEventListener('resize',queueMosaicZoomSync,{passive:true});
  window.visualViewport?.addEventListener('resize',queueMosaicZoomSync,{passive:true});
  window.addEventListener('wheel',event=>{
    if(layer.hidden || !(event.ctrlKey||event.metaKey))return;
    const delta=clamp(event.deltaY,-120,120);
    zoomWheelFallback=clamp(zoomWheelFallback-delta*.001,1,4);
    resetHoverPan();
    requestAnimationFrame(()=>requestAnimationFrame(queueMosaicZoomSync));
  },{capture:true,passive:true});
  // Listen at window capture: Edge may emit mousemove without a matching
  // pointermove over modal descendants. Duplicate events have zero delta.
  window.addEventListener('pointermove',onGalleryMouseMove,{capture:true,passive:true});
  window.addEventListener('mousemove',onGalleryMouseMove,{capture:true,passive:true});
  const resetViewerPan=()=>{}; // Manté el zoom natiu entre mosaic i fotografia.
  const syncViewerPan=()=>{};
  const clearNativeGalleryLayout=()=>{
    resetHoverPan();
    layer.classList.remove('vcc-mosaic-native-zoom','vcc-gallery-viewport');
    existingLightbox?.classList.remove('vcc-gallery-viewport');
    const root=document.documentElement;
    root.classList.remove('vcc-gallery-modal-locked');
    for(const name of [
      '--vcc-gallery-panel-width','--vcc-gallery-panel-height',
      '--vcc-gallery-grid-columns','--vcc-gallery-grid-padding',
      '--vcc-gallery-grid-gap','--vcc-gallery-sidebar-padding'
    ])root.style.removeProperty(name);
    viewportBaseline=null;
    zoomWheelFallback=1;
  };
  const startPanBaseline=()=>{
    resetHoverPan();
    zoomWheelFallback=1;
    const root=document.documentElement;
    viewportBaseline={
      w:window.innerWidth,
      h:window.innerHeight,
      dpr:window.devicePixelRatio||1,
      visualScale:window.visualViewport?.scale||1,
      vvWidth:window.visualViewport?.width||window.innerWidth,
      vvHeight:window.visualViewport?.height||window.innerHeight,
      cssZoom:parseFloat(getComputedStyle(root).zoom)||1
    };
    // Guardem les mides i l'espaiat reals del mosaic ABANS del zoom.
    // No es permet que els breakpoints del navegador remaquetin la galeria.
    const main=layer.querySelector('.vcc-dg-main');
    const mosaicScroll=layer.querySelector('.vcc-dg-scroll');
    const mosaicGrid=layer.querySelector('.vcc-dg-grid');
    const mosaicSidebar=layer.querySelector('.vcc-dg-sidebar');
    const snapshot=[
      ['--vcc-gallery-grid-columns',getComputedStyle(main).gridTemplateColumns],
      ['--vcc-gallery-grid-padding',getComputedStyle(mosaicScroll).padding],
      ['--vcc-gallery-grid-gap',getComputedStyle(mosaicGrid).gap],
      ['--vcc-gallery-sidebar-padding',getComputedStyle(mosaicSidebar).padding]
    ];
    snapshot.forEach(([name,value])=>root.style.setProperty(name,value));
    root.style.setProperty('--vcc-gallery-panel-width',Math.max(1,mosaicPanel.offsetWidth)+'px');
    root.style.setProperty('--vcc-gallery-panel-height',Math.max(1,mosaicPanel.offsetHeight)+'px');
    layer.classList.add('vcc-gallery-viewport');
    existingLightbox?.classList.add('vcc-gallery-viewport');
    root.classList.add('vcc-gallery-modal-locked');
    updateMosaicZoomMode();
  };

  // El zoom de tota la pàgina és responsabilitat del navegador.
  // No interceptem wheel, Ctrl+wheel o els gestos del trackpad.
  // Així funciona exactament igual al mosaic i a la fotografia individual.
  if (enlargedPhoto) {
    enlargedPhoto.removeAttribute('title');
    new MutationObserver(() => syncRoundedPhoto())
      .observe(enlargedPhoto,{attributes:true,attributeFilter:['aria-label']});
  }

  existingLightbox?.addEventListener('vcc:lightbox-closed',()=>{
    ++photoSequence;
    clearTimeout(upgradeTimer);
    resetViewerPan();
    enlargedPhoto?.classList.remove('vcc-dg-rounded-ready');
    if(layer.hidden || !activeGallery) return;
    resetHoverPan();
    if(existingLightbox){
      layer.scrollLeft=existingLightbox.scrollLeft;
      layer.scrollTop=existingLightbox.scrollTop;
    }
    layer.setAttribute('aria-hidden','false');
    syncViewerPan();
    if(clickedGridImage?.isConnected) clickedGridImage.focus({preventScroll:true});
    else closeButton.focus({preventScroll:true});
  });

  document.addEventListener('keydown',event => {
    if (layer.hidden || existingLightbox?.classList.contains('open')) return;
    if (event.key==='Escape') {event.preventDefault();closeGallery();}
    if (event.key==='Tab') {
      const focusable = [...layer.querySelectorAll('button:not([disabled])')].filter(el=>el.getClientRects().length);
      if (!focusable.length) return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });

  // No tanquem el visor quan el zoom del navegador travessa els 801px.
  // En equips Windows tàctils (pointer:coarse), el codi antic tancava el
  // mosaic i revelava la guia del darrere a mig zoom. Només la X tanca.

})();
