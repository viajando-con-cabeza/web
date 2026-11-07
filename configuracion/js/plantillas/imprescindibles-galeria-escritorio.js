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
  // Suport a Edge quan el zoom amplia visualment el contingut però el
  // scrollWidth del visor no creix. Només es trasllada el panell, MAI s'escala.
  const fallbackOffsets={mosaic:{x:0,y:0},photo:{x:0,y:0}};
  // Abans començàvem sempre a (0,0): només podíem avançar a dreta/avall.
  // Iniciem el recorregut sobre el punt ampliat, amb marge en els dos sentits.
  const panInitialized={mosaic:false,photo:false};
  let zoomPointer={x:.5,y:.5};
  const resetPanInitialization=()=>{
    panInitialized.mosaic=false;
    panInitialized.photo=false;
  };
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
    const zoomed=zoomRatio()>1.025;
    layer.classList.toggle('vcc-mosaic-native-zoom',zoomed);
    if(!zoomed){
      clearFallbackPan();
      resetPanInitialization();
      resetHoverPan();
    }
  };
  const queueMosaicZoomSync=()=>{
    if(zoomSyncPending)return;
    zoomSyncPending=true;
    requestAnimationFrame(()=>{
      zoomSyncPending=false;
      updateMosaicZoomMode();
    });
  };
  const fallbackPanInfo=modal=>{
    if(!modal || !viewportBaseline)return null;
    const ratio=zoomRatio();
    if(ratio<=1.025)return null;
    const panel=modal===layer ? mosaicPanel : existingStage;
    if(!panel)return null;
    const rect=panel.getBoundingClientRect();
    // No fem servir rect.width perquè CSS zoom també l'amplia visualment.
    // offsetWidth conserva les mides del disseny inicial que hem congelat.
    const viewW=Math.min(modal.clientWidth,viewportBaseline.w/ratio);
    const viewH=Math.min(modal.clientHeight,viewportBaseline.h/ratio);
    return {
      panel,
      rangeX:Math.max(0,panel.offsetWidth+36-viewW),
      rangeY:Math.max(0,panel.offsetHeight+36-viewH),
      ratio
    };
  };
  const clearFallbackPan=()=>{
    fallbackOffsets.mosaic.x=fallbackOffsets.mosaic.y=0;
    fallbackOffsets.photo.x=fallbackOffsets.photo.y=0;
    mosaicPanel?.style.removeProperty('transform');
    existingStage?.style.removeProperty('transform');
  };
  const panFallback= (modal,dx,dy,nativeX,nativeY)=>{
    const f=fallbackPanInfo(modal);
    if(!f)return false;
    const useX=nativeX<=2 && f.rangeX>2;
    const useY=nativeY<=2 && f.rangeY>2;
    const state=modal===layer?fallbackOffsets.mosaic:fallbackOffsets.photo;
    if(!useX&&!useY){
      // Si el navegador comença a informar scroll natiu, mantenim la
      // posició en el scrollport i retirem el pan alternatiu.
      if(state.x && nativeX>2)modal.scrollLeft=clamp(state.x,0,nativeX);
      if(state.y && nativeY>2)modal.scrollTop=clamp(state.y,0,nativeY);
      state.x=state.y=0;
      f.panel.style.removeProperty('transform');
      return false;
    }
    // 1 píxel de moviment = 1 píxel local de pan. Sense inèrcia.
    if(useX && dx)state.x=clamp(state.x+dx,0,f.rangeX);
    if(useY && dy)state.y=clamp(state.y+dy,0,f.rangeY);
    f.panel.style.setProperty('transform',
      'translate3d('+(-state.x).toFixed(2)+'px,'+
      (-state.y).toFixed(2)+'px,0)','important');
    return true;
  };
  const initializeCenteredPan=modal=>{
    if(!modal || zoomRatio()<=1.025)return;
    const kind=modal===layer?'mosaic':'photo';
    if(panInitialized[kind])return;
    panInitialized[kind]=true;
    const overX=Math.max(0,modal.scrollWidth-modal.clientWidth);
    const overY=Math.max(0,modal.scrollHeight-modal.clientHeight);
    const backup=fallbackPanInfo(modal);
    // Restringim el punt focal a la zona central del recorregut:
    // permet anar també cap a l'esquerra i amunt després de fer zoom.
    const originX=clamp(zoomPointer.x,.3,.7);
    const originY=clamp(zoomPointer.y,.3,.7);
    modal.scrollLeft=overX*originX;
    modal.scrollTop=overY*originY;
    if(backup){
      const state=fallbackOffsets[kind];
      state.x=overX<=2 ? backup.rangeX*originX : 0;
      state.y=overY<=2 ? backup.rangeY*originY : 0;
      if(state.x || state.y){
        backup.panel.style.setProperty('transform',
          'translate3d('+(-state.x).toFixed(2)+'px,'+
          (-state.y).toFixed(2)+'px,0)','important');
      }
    }
    // El primer moviment després del zoom només estableix referència;
    // no provoca un segon salt per diferències d'escala.
    resetHoverPan();
  };
  // A l'Edge no suposem que innerWidth, DPR o visualViewport reflecteixen
  // immediatament el zoom del navegador. La condició real és que el visor
  // contingui parts fora de la pantalla: scrollWidth > clientWidth.
  // Aquesta àrea queda bloquejada a 100% i és navegable quan s'amplia.
  const flushHoverPan=()=>{
    hoverPanRaf=0;
    const modal=currentGalleryViewport();
    const dx=hoverPanDeltaX,dy=hoverPanDeltaY;
    hoverPanDeltaX=hoverPanDeltaY=0;
    if(!modal)return;
    const overX=Math.max(0,modal.scrollWidth-modal.clientWidth);
    const overY=Math.max(0,modal.scrollHeight-modal.clientHeight);
    const usesFallback=panFallback(modal,dx,dy,overX,overY);
    if(overX<2 && overY<2 && !usesFallback)return;
    // La velocitat és proporcional al recorregut visible, no a l'escala
    // total de la foto. Sense inèrcia ni transformacions del panell.
    const gainX=Math.min(3.5,Math.max(1,overX/Math.max(1,modal.clientWidth*.72)));
    const gainY=Math.min(3.5,Math.max(1,overY/Math.max(1,modal.clientHeight*.72)));
    if(overX>2 && dx)modal.scrollLeft+=dx*gainX;
    if(overY>2 && dy)modal.scrollTop+=dy*gainY;
  };
  const onGalleryMouseMove=event=>{
    if(event.type==='pointermove' && event.pointerType && event.pointerType!=='mouse')return;
    if(typeof event.buttons==='number' && event.buttons!==0)return;
    const modal=currentGalleryViewport();
    if(!modal)return;
    if(zoomRatio()>1.025 && !panInitialized[modal===layer?'mosaic':'photo'])
      initializeCenteredPan(modal);
    const overX=Math.max(0,modal.scrollWidth-modal.clientWidth);
    const overY=Math.max(0,modal.scrollHeight-modal.clientHeight);
    // Amb zoom normal usem scroll. Quan Edge fa zoom només de DPR
    // i no crea scrollWidth, el panell congelat té un desplaçament auxiliar.
    const fallback=fallbackPanInfo(modal);
    const canFallback=!!fallback && (
      (overX<2 && fallback.rangeX>2) ||
      (overY<2 && fallback.rangeY>2)
    );
    if(overX<2 && overY<2 && !canFallback){
      resetHoverPan();
      return;
    }
    const mode=modal===layer?'mosaic':'photo';
    const now={
      mode,
      x:event.clientX,y:event.clientY,
      screenX:event.screenX,screenY:event.screenY
    };
    const prev=lastHoverPan;
    lastHoverPan=now;
    if(!prev || prev.mode!==mode)return;
    let dx=now.x-prev.x,dy=now.y-prev.y;
    // Hi ha configuracions Windows amb zoom que no actualitzen clientX/Y.
    // Només aleshores fem servir la diferència física del cursor com a suport.
    const factor=Math.max(1,Math.min(4,zoomRatio()));
    if(Math.abs(dx)<.1 && Number.isFinite(now.screenX) && Number.isFinite(prev.screenX))
      dx=(now.screenX-prev.screenX)/factor;
    if(Math.abs(dy)<.1 && Number.isFinite(now.screenY) && Number.isFinite(prev.screenY))
      dy=(now.screenY-prev.screenY)/factor;
    if(!Number.isFinite(dx)||!Number.isFinite(dy))return;
    // Canvis sobtats de coordenades en canviar el zoom no són moviment.
    if(Math.abs(dx)>150 || Math.abs(dy)>150)return;
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
    // Cursor dins del viewport al moment de fer zoom: punt focal.
    // No el resetejem quan augmentem el zoom consecutivament.
    if(!panInitialized.mosaic && !panInitialized.photo){
      zoomPointer={
        x:clamp(event.clientX/Math.max(1,window.innerWidth),0,1),
        y:clamp(event.clientY/Math.max(1,window.innerHeight),0,1)
      };
    }
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
    clearFallbackPan();
    resetPanInitialization();
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
    clearFallbackPan();
    resetPanInitialization();
    zoomPointer={x:.5,y:.5};
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
