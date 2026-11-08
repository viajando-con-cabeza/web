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
    // El visor individual conserva el mateix enquadrament del mosaic.
    if(existingLightbox){
      const source=panState.mosaic,dest=panState.photo;
      const lim=panLimits(existingLightbox);
      dest.x=clamp(source.x,lim.minX,lim.x);
      dest.y=clamp(source.y,lim.minY,lim.y);
      paintPan(existingLightbox);
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
    // A Edge, Ctrl+rodeta pot no emetre wheel. El clic d'obertura
    // ens proporciona l'últim punt conegut sota el cursor.
    latestPointer={kind:'mosaic',x:event.clientX,y:event.clientY,
      sx:event.screenX,sy:event.screenY};
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

  // Desplaçament directe, exacte i acotat del contingut (no scroll intern).
  // La navegació nativa d'Edge continua fent Ctrl+rodeta. El cursor mou
  // només el mosaic o la foto, sense clics, fins als seus límits reals.
  let viewportBaseline=null;
  let zoomSyncQueued=false;
  let panGestureBase=null;
  let latestPointer=null;
  let panFrame=0;
  let pendingDx=0,pendingDy=0;
  let pendingZoomAnchor=null;
  let zoomWasActive=false;
  let previousZoomRatio=1;
  const panState={mosaic:{x:0,y:0},photo:{x:0,y:0}};
  const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
  const activeViewport=()=>{
    if(!viewportBaseline || layer.hidden)return null;
    return existingLightbox?.classList.contains('open')?existingLightbox:layer;
  };
  const panelOf=modal=>modal===layer?mosaicPanel:existingStage;
  const modeOf=modal=>modal===layer?'mosaic':'photo';
  const zoomRatio=()=>{
    if(!viewportBaseline)return 1;
    const vv=window.visualViewport;
    const css=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
    return Math.max(
      viewportBaseline.w/Math.max(1,window.innerWidth),
      viewportBaseline.h/Math.max(1,window.innerHeight),
      (window.devicePixelRatio||1)/Math.max(.01,viewportBaseline.dpr),
      (vv?.scale||1)/Math.max(.01,viewportBaseline.scale),
      viewportBaseline.visualWidth/Math.max(1,vv?.width||window.innerWidth),
      viewportBaseline.visualHeight/Math.max(1,vv?.height||window.innerHeight),
      css/Math.max(.01,viewportBaseline.css)
    );
  };
  const panLimits=modal=>{
    const panel=panelOf(modal);
    if(!panel)return {x:0,y:0};
    const rect=modal.getBoundingClientRect();
    const zoom=Math.max(1,zoomRatio());
    // En alguns modes d'Edge el viewport visual és més petit, però el
    // rectangle CSS del modal conserva l'amplada anterior. Fem servir
    // l'àrea REALMENT visible, i no només modal.getBoundingClientRect().
    const visibleW=Math.max(1,Math.min(rect.width,
      window.visualViewport?.width||rect.width,
      viewportBaseline?.w/zoom||rect.width));
    const visibleH=Math.max(1,Math.min(rect.height,
      window.visualViewport?.height||rect.height,
      viewportBaseline?.h/zoom||rect.height));
    // Sense límits dividits per dos: no podem empènyer el contingut
    // més enllà de les seves vores i deixar espais buits.
    const x=Math.max(0,panel.offsetWidth+36-visibleW);
    const y=Math.max(0,panel.offsetHeight+36-visibleH);
    // Recorregut ampli en els QUATRE sentits. Abans el límit a
    // esquerra/dalt era només 120px/100px, mentre que a la dreta/baix
    // es podien recórrer centenars de píxels. Equiparem el màxim
    // desplaçament i deixem una franja mínima visible del panell.
    // NO desplacem el zoom inicial: aquests extrems només s'assoleixen
    // en moure el cursor cap a les vores del visor.
    const leftReach=Math.min(x,Math.max(0,visibleW-36));
    const topReach=Math.min(y,Math.max(0,visibleH-36));
    return {x,y,minX:-leftReach,minY:-topReach,width:visibleW,height:visibleH};
  };
  // Velocitat constant i moderada: sense acceleració als extrems.
  // El zoom del navegador no canvia la velocitat de navegació.
  const PAN_SPEED=0.80;
  const paintPan=modal=>{
    const panel=panelOf(modal);
    if(!panel)return;
    const state=panState[modeOf(modal)];
    if(Math.abs(state.x)<.05 && Math.abs(state.y)<.05){
      panel.style.removeProperty('transform');
    } else {
      panel.style.setProperty('transform',
        'translate3d('+(-state.x).toFixed(2)+'px,'+
        (-state.y).toFixed(2)+'px,0)','important');
    }
  };
  const resetHoverPan=()=>{
    panGestureBase=null;
    pendingDx=pendingDy=0;
    if(panFrame){cancelAnimationFrame(panFrame);panFrame=0;}
  };
  const resetPan=()=>{
    resetHoverPan();
    pendingZoomAnchor=null;
    for(const modal of [layer,existingLightbox]){
      if(!modal)continue;
      panState[modeOf(modal)].x=0;
      panState[modeOf(modal)].y=0;
      panelOf(modal)?.style.removeProperty('transform');
      modal.scrollLeft=0;modal.scrollTop=0;
    }
  };
  const rememberZoomAnchor=event=>{
    const modal=activeViewport();
    if(!modal)return;
    const panel=panelOf(modal);
    if(!panel)return;
    const rect=panel.getBoundingClientRect();
    pendingZoomAnchor={
      modal,
      pointX:event.clientX-rect.left,
      pointY:event.clientY-rect.top,
      pointerX:event.clientX,
      pointerY:event.clientY,
      viewportW:Math.max(1,window.innerWidth),
      viewportH:Math.max(1,window.innerHeight)
    };
  };
  const applyZoomAnchor=modal=>{
    const anchor=pendingZoomAnchor;
    if(!anchor || anchor.modal!==modal)return false;
    const bounds=panLimits(modal);
    // Mantenim exactament el punt anterior sota el cursor en canviar escala.
    const x=anchor.pointerX*window.innerWidth/anchor.viewportW;
    const y=anchor.pointerY*window.innerHeight/anchor.viewportH;
    const state=panState[modeOf(modal)];
    state.x=clamp(18+anchor.pointX-x,bounds.minX,bounds.x);
    state.y=clamp(18+anchor.pointY-y,bounds.minY,bounds.y);
    pendingZoomAnchor=null;
    resetHoverPan();
    return true;
  };
  const syncZoom=()=>{
    const active=activeViewport();
    const currentZoom=zoomRatio();
    const zoomed=currentZoom>1.025;
    const wasZoomed=zoomWasActive;
    const firstZoom=zoomed&&!wasZoomed;
    previousZoomRatio=currentZoom;
    zoomWasActive=zoomed;
    layer.classList.toggle('vcc-mosaic-native-zoom',zoomed);
    for(const modal of [layer,existingLightbox]){
      if(!modal)continue;
      modal.classList.toggle('vcc-zoom-pan-enabled',zoomed);
    }
    if(!zoomed){
      // Edge pot enviar Ctrl+wheel ABANS que el navegador ampliï el
      // viewport. En aquest únic cas conservem breument l'ancoratge.
      // Però si ja estàvem ampliats i tornem al zoom original, el pan
      // s'ha de reiniciar SENSE esperar: l'antic "if(anchor)return"
      // deixava el mosaic/hero descentrat després de reduir el zoom.
      if(pendingZoomAnchor && !wasZoomed)return;
      resetPan();
      // El restabliment inclou els dos modal, no només el que és visible.
      // El layout posterior a la roda també ha de conservar l'origen.
      if(wasZoomed)requestAnimationFrame(()=>{
        if(layer.hidden || zoomRatio()>1.025)return;
        resetPan();
      });
      return;
    }
    for(const modal of [layer,existingLightbox]){
      if(!modal)continue;
      const state=panState[modeOf(modal)];
      const bounds=panLimits(modal);
      if(modal===active && applyZoomAnchor(modal)){
        // La vista apunta al MATEIX píxel del panell sota el cursor.
        // Mai s'afegeix un desplaçament artificial posterior.
      }else if(modal===active && firstZoom){
        // Reserva només si Edge no ha enviat Ctrl+wheel; usem el cursor
        // conegut, no el centre arbitrari ni una posició forçada.
        const beforeX=latestPointer?.kind===modeOf(modal)
          ?latestPointer.x:viewportBaseline.w/2;
        const beforeY=latestPointer?.kind===modeOf(modal)
          ?latestPointer.y:viewportBaseline.h/2;
        const fraction=1-1/Math.max(1,currentZoom);
        state.x=clamp(beforeX*fraction,bounds.minX,bounds.x);
        state.y=clamp(beforeY*fraction,bounds.minY,bounds.y);
        resetHoverPan();
      }else{
        state.x=clamp(state.x,bounds.minX,bounds.x);
        state.y=clamp(state.y,bounds.minY,bounds.y);
      }
      paintPan(modal);
    }
  };
  const queueMosaicZoomSync=()=>{
    if(zoomSyncQueued||!viewportBaseline||layer.hidden)return;
    zoomSyncQueued=true;
    requestAnimationFrame(()=>{
      zoomSyncQueued=false;
      syncZoom();
    });
  };
  const flushPan=()=>{
    panFrame=0;
    const modal=activeViewport();
    if(!modal||zoomRatio()<=1.025)return;
    const state=panState[modeOf(modal)],lim=panLimits(modal);
    // Sempre ens posicionem respecte del MATEIX origen de ratolí.
    // Quan el cursor torna al punt inicial, el pan torna exactament,
    // fins i tot si abans havia arribat al límit elàstic negatiu.
    state.x=clamp(pendingDx,lim.minX,lim.x);
    state.y=clamp(pendingDy,lim.minY,lim.y);
    paintPan(modal);
  };
  const onGalleryMouseMove=event=>{
    if(event.type==='pointermove'&&event.pointerType&&event.pointerType!=='mouse')return;
    if(typeof event.buttons==='number'&&event.buttons!==0)return;
    const modal=activeViewport();
    if(!modal)return;
    const now={kind:modeOf(modal),x:event.clientX,y:event.clientY,
      sx:event.screenX,sy:event.screenY};
    latestPointer=now;
    if(zoomRatio()<=1.025){resetHoverPan();return;}
    if(!panGestureBase||panGestureBase.kind!==now.kind){
      const state=panState[now.kind];
      panGestureBase={...now,panX:state.x,panY:state.y};
      return;
    }
    // El moviment segueix el cursor amb una velocitat reduïda i uniforme.
    // Sense multiplicadors segons el zoom o la proximitat a les vores.
    let dx=now.x-panGestureBase.x,dy=now.y-panGestureBase.y;
    if(Math.abs(dx)<.1&&Number.isFinite(now.sx)&&Number.isFinite(panGestureBase.sx))
      dx=(now.sx-panGestureBase.sx)/Math.max(1,zoomRatio());
    if(Math.abs(dy)<.1&&Number.isFinite(now.sy)&&Number.isFinite(panGestureBase.sy))
      dy=(now.sy-panGestureBase.sy)/Math.max(1,zoomRatio());
    if(!Number.isFinite(dx)||!Number.isFinite(dy))return;
    const limits=panLimits(modal);
    pendingDx=clamp(panGestureBase.panX+dx*PAN_SPEED,limits.minX,limits.x);
    pendingDy=clamp(panGestureBase.panY+dy*PAN_SPEED,limits.minY,limits.y);
    if(!panFrame)panFrame=requestAnimationFrame(flushPan);
  };
  window.addEventListener('resize',()=>{resetHoverPan();queueMosaicZoomSync();},{passive:true});
  window.visualViewport?.addEventListener('resize',()=>{
    resetHoverPan();queueMosaicZoomSync();
  },{passive:true});
  window.addEventListener('wheel',event=>{
    if(layer.hidden||!(event.ctrlKey||event.metaKey))return;
    rememberZoomAnchor(event);
    resetHoverPan();
    requestAnimationFrame(()=>requestAnimationFrame(queueMosaicZoomSync));
  },{capture:true,passive:true});
  window.addEventListener('pointermove',onGalleryMouseMove,{capture:true,passive:true});
  window.addEventListener('mousemove',onGalleryMouseMove,{capture:true,passive:true});
  const resetViewerPan=()=>{};
  const syncViewerPan=()=>{};
  const clearNativeGalleryLayout=()=>{
    resetPan();
    layer.classList.remove('vcc-mosaic-native-zoom','vcc-gallery-viewport','vcc-zoom-pan-enabled');
    existingLightbox?.classList.remove('vcc-gallery-viewport','vcc-zoom-pan-enabled');
    const root=document.documentElement;
    root.classList.remove('vcc-gallery-modal-locked');
    for(const name of [
      '--vcc-gallery-panel-width','--vcc-gallery-panel-height',
      '--vcc-gallery-grid-columns','--vcc-gallery-grid-padding',
      '--vcc-gallery-grid-gap','--vcc-gallery-sidebar-padding'
    ])root.style.removeProperty(name);
    viewportBaseline=null;
    zoomWasActive=false;
    previousZoomRatio=1;
    latestPointer=null;
  };
  const startPanBaseline=()=>{
    resetPan();
    zoomWasActive=false;
    previousZoomRatio=1;
    latestPointer=null;
    const root=document.documentElement,vv=window.visualViewport;
    viewportBaseline={
      w:window.innerWidth,h:window.innerHeight,
      dpr:window.devicePixelRatio||1,scale:vv?.scale||1,
      visualWidth:vv?.width||window.innerWidth,
      visualHeight:vv?.height||window.innerHeight,
      css:parseFloat(getComputedStyle(root).zoom)||1
    };
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
    syncZoom();
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
      const source=panState.photo,dest=panState.mosaic;
      const lim=panLimits(layer);
      dest.x=clamp(source.x,lim.minX,lim.x);
      dest.y=clamp(source.y,lim.minY,lim.y);
      paintPan(layer);
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
