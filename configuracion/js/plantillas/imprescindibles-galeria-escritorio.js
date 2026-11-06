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
    panBaseline=null;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('vcc-desktop-gallery-open');
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
    layer.setAttribute('aria-hidden', 'true');
    window.VCCImprescindiblesLightbox.open(activeGallery, index);
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

  // Browser zoom remains native. Retain the exact image/content point
  // under the cursor across Ctrl+wheel, instead of jumping to panel centre.
  // Mouse movement afterwards pans relatively, only while zoomed.
  let panBaseline=null;
  let panMode=null;
  let panFrame=0;
  let panLastMouse=null;
  let lastPointer=null;
  let pendingZoomAnchor=null;
  let panX=0,panY=0;
  let panTargetX=0,panTargetY=0;
  const PAN_GAIN=1;
  const limit=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const stopPan=()=>{
    if(panFrame){cancelAnimationFrame(panFrame);panFrame=0;}
  };
  const clearPanelPan=()=>{
    stopPan();
    for(const [modal,panel] of [[layer,mosaicPanel],[existingLightbox,existingStage]]){
      modal?.classList.remove('vcc-native-pan-enabled');
      modal?.style.removeProperty('--vcc-pan-width');
      modal?.style.removeProperty('--vcc-pan-height');
      if(panel)panel.style.transform='';
    }
    panMode=null;
    panLastMouse=null;
    panX=panY=panTargetX=panTargetY=0;
  };
  const resetViewerPan=()=>{
    clearPanelPan();
    lastPointer=null;
    pendingZoomAnchor=null;
  };
  const zoomRatio=()=>{
    if(!panBaseline)return 1;
    return Math.max(
      panBaseline.viewportWidth/Math.max(1,window.innerWidth),
      panBaseline.viewportHeight/Math.max(1,window.innerHeight),
      (window.devicePixelRatio||1)/Math.max(.01,panBaseline.pixelRatio),
      (window.visualViewport?.scale||1)/Math.max(.01,panBaseline.visualScale)
    );
  };
  const activePanel=()=>{
    if(!panBaseline || layer.hidden ||
      !document.body.classList.contains('vcc-desktop-gallery-open'))return null;
    if(photoVisible() && existingLightbox && existingStage){
      return {kind:'photo',modal:existingLightbox,panel:existingStage,
        width:panBaseline.photoWidth,height:panBaseline.photoHeight};
    }
    if(!existingLightbox?.classList.contains('open')){
      return {kind:'mosaic',modal:layer,panel:mosaicPanel,
        width:panBaseline.mosaicWidth,height:panBaseline.mosaicHeight};
    }
    return null;
  };
  const boundsFor=view=>{
    const rect=view.modal.getBoundingClientRect();
    const vw=Math.max(1,Math.min(rect.width,window.visualViewport?.width||rect.width));
    const vh=Math.max(1,Math.min(rect.height,window.visualViewport?.height||rect.height));
    return {x:Math.max(0,view.width-vw),y:Math.max(0,view.height-vh)};
  };
  const paintPan=()=>{
    panFrame=0;
    const view=activePanel();
    if(!view || panMode!==view.kind ||
      !view.modal.classList.contains('vcc-native-pan-enabled'))return;
    panX=panTargetX;panY=panTargetY;
    view.panel.style.transform='translate3d('+panX.toFixed(2)+'px,'+
      panY.toFixed(2)+'px,0)';
  };
  const schedulePan=()=>{
    if(!panFrame)panFrame=requestAnimationFrame(paintPan);
  };
  // Before browser zoom changes the layout, record the content location
  // beneath the cursor, in panel-local CSS pixels.
  const rememberZoomAnchor=event=>{
    const view=activePanel();
    if(!view || !event.ctrlKey && !event.metaKey)return;
    const rect=view.panel.getBoundingClientRect();
    pendingZoomAnchor={
      mode:view.kind,
      contentX:event.clientX-rect.left,
      contentY:event.clientY-rect.top,
      pointerX:event.clientX,
      pointerY:event.clientY,
      viewportWidth:window.innerWidth,
      viewportHeight:window.innerHeight
    };
    panLastMouse=null; // Zoom-induced pointer co-ordinate changes are not movement.
  };
  const applyZoomAnchor=view=>{
    const anchor=pendingZoomAnchor;
    if(!anchor || anchor.mode!==view.kind)return false;
    const bounds=boundsFor(view);
    // Browser zoom changes CSS viewport size, not the physical mouse
    // position. Project its coordinate into the new CSS viewport.
    const x=anchor.pointerX*(window.innerWidth/Math.max(1,anchor.viewportWidth));
    const y=anchor.pointerY*(window.innerHeight/Math.max(1,anchor.viewportHeight));
    panTargetX=limit(x-anchor.contentX,-bounds.x,0);
    panTargetY=limit(y-anchor.contentY,-bounds.y,0);
    pendingZoomAnchor=null;
    panLastMouse=null;
    return true;
  };
  const syncViewerPan=()=>{
    const view=activePanel();
    if(!view || zoomRatio()<=1.035){
      if(panMode)clearPanelPan();
      if(zoomRatio()<=1.035)pendingZoomAnchor=null;
      return;
    }
    if(panMode!==view.kind){
      clearPanelPan();
      panMode=view.kind;
      view.modal.style.setProperty('--vcc-pan-width',view.width+'px');
      view.modal.style.setProperty('--vcc-pan-height',view.height+'px');
      view.modal.classList.add('vcc-native-pan-enabled');
      // Never jump to the centre. Preserve the cursor's zoom focus.
      if(!applyZoomAnchor(view)){
        const bounds=boundsFor(view);
        // If opened directly while zoomed, align to the last cursor
        // position, or keep the default top-left of the panel.
        panTargetX=limit(0,-bounds.x,0);
        panTargetY=limit(0,-bounds.y,0);
      }
      schedulePan();
      return;
    }
    if(!applyZoomAnchor(view)){
      const bounds=boundsFor(view);
      panTargetX=limit(panTargetX,-bounds.x,0);
      panTargetY=limit(panTargetY,-bounds.y,0);
    }
    schedulePan();
  };
  const startPanBaseline=()=>{
    resetViewerPan();
    if(!mosaicPanel)return;
    panBaseline={
      viewportWidth:window.innerWidth,
      viewportHeight:window.innerHeight,
      pixelRatio:window.devicePixelRatio||1,
      visualScale:window.visualViewport?.scale||1,
      mosaicWidth:mosaicPanel.offsetWidth,
      mosaicHeight:mosaicPanel.offsetHeight,
      photoWidth:Math.max(1,window.innerWidth-36),
      photoHeight:Math.max(1,window.innerHeight-36)
    };
  };
  const queuePanSync=()=>{
    if(panBaseline)requestAnimationFrame(syncViewerPan);
  };
  window.addEventListener('resize',queuePanSync,{passive:true});
  window.visualViewport?.addEventListener('resize',queuePanSync,{passive:true});
  window.addEventListener('wheel',event=>{
    // Do not prevent browser zoom: only capture the point to preserve.
    if(panBaseline && (event.ctrlKey||event.metaKey)){
      rememberZoomAnchor(event);
      requestAnimationFrame(()=>requestAnimationFrame(syncViewerPan));
    }
  },{capture:true,passive:true});
  document.addEventListener('pointermove',event=>{
    if(!panBaseline || event.pointerType!=='mouse' || event.buttons!==0)return;
    const view=activePanel();
    if(!view)return;
    lastPointer={x:event.clientX,y:event.clientY,kind:view.kind};
    syncViewerPan();
    if(panMode!==view.kind || !view.modal.classList.contains('vcc-native-pan-enabled'))return;
    const now={x:event.clientX,y:event.clientY,kind:view.kind};
    const prev=panLastMouse;
    panLastMouse=now;
    if(!prev || prev.kind!==now.kind)return;
    const dx=limit(now.x-prev.x,-90,90);
    const dy=limit(now.y-prev.y,-90,90);
    if(dx===0 && dy===0)return;
    const bounds=boundsFor(view);
    panTargetX=limit(panTargetX-dx*PAN_GAIN,-bounds.x,0);
    panTargetY=limit(panTargetY-dy*PAN_GAIN,-bounds.y,0);
    schedulePan();
  },{capture:true,passive:true});

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

  desktop.addEventListener('change',() => {
    // Durant el zoom natiu canvia el breakpoint virtual, però no és un mòbil.
    // Mantenim el visor d'escriptori mentre la fotografia és oberta.
    if (!desktop.matches && !layer.hidden &&
        !existingLightbox?.classList.contains('open') &&
        window.matchMedia('(pointer:coarse)').matches) closeGallery();
  });
})();
