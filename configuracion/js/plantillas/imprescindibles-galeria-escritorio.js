/* VCC · galeria d'imprescindibles per a ordinador (quality).
   Primer clic: mosaic desplegat 3/3/3. Segon clic: visor original amb text lateral.
   En mòbils no intervé: segueix funcionant la galeria vertical existent. */
(() => {
  'use strict';
  const desktop = window.matchMedia('(min-width: 801px)');
  // Mostra exactament el WebP de Cloudflare R2 també al mosaic.
  const miniUrl = source => source;

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
      img.alt=name+' · fotografía '+(index+1);
      img.loading=index<6?'eager':'lazy';
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

  /* Zoom d'escriptori en la foto individual.
     Clic: 1× / 2.4×. Roda: 1–4×. Arrossegar: explorar detalls.
     Les fletxes i miniatures continuen canviant de fotografia. */
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
  function syncRoundedPhoto() {
    if (!enlargedPhoto || !roundedImage) return;
    enlargedPhoto.classList.remove('vcc-dg-rounded-ready');
    if (!photoVisible()) return;
    const raw = enlargedPhoto.style.backgroundImage;
    const quoted = raw.startsWith('url(') ? raw.slice(4, -1).trim() : '';
    const src = (quoted.startsWith('"') || quoted.startsWith("'"))
      ? quoted.slice(1, -1) : quoted;
    if (!src || src === 'none') return;
    roundedImage.onload = () => {
      if (roundedImage.getAttribute('src') === src &&
          photoVisible() && roundedImage.naturalWidth) {
        enlargedPhoto.classList.add('vcc-dg-rounded-ready');
      }
    };
    roundedImage.onerror = () => enlargedPhoto.classList.remove('vcc-dg-rounded-ready');
    roundedImage.src = src;
    if (roundedImage.complete && roundedImage.naturalWidth) roundedImage.onload();
  }
  let zoomLayer = null;
  let zoomLevel = 1;
  let zoomX = 0;
  let zoomY = 0;
  let photoDimensions = null;
  let dragging = null;
  let ignoredClick = false;
  let highResolutionToken = 0;
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const photoVisible = () => desktop.matches && !layer.hidden &&
    existingLightbox?.classList.contains('open') && !!enlargedPhoto;

  if (enlargedPhoto) {
    zoomLayer=document.createElement('div');
    zoomLayer.className='vcc-dg-zoom-layer';
    zoomLayer.setAttribute('aria-hidden','true');
    enlargedPhoto.append(zoomLayer);
    enlargedPhoto.setAttribute('title','Clica per ampliar · roda del ratolí per fer zoom');
  }

  function constrainZoom() {
    if (!enlargedPhoto || !photoDimensions) return;
    const {width,height}=enlargedPhoto.getBoundingClientRect();
    const {width:originalWidth,height:originalHeight}=photoDimensions;
    if (!originalWidth || !originalHeight || !width || !height) return;
    const fit=Math.min(width/originalWidth,height/originalHeight);
    const maxX=Math.max(0,(originalWidth*fit*zoomLevel-width)/2);
    const maxY=Math.max(0,(originalHeight*fit*zoomLevel-height)/2);
    zoomX=clamp(zoomX,-maxX,maxX);
    zoomY=clamp(zoomY,-maxY,maxY);
  }
  function drawZoom(animate=false) {
    if (!zoomLayer || !enlargedPhoto) return;
    constrainZoom();
    const active=zoomLevel>1.01;
    enlargedPhoto.classList.toggle('vcc-dg-is-zoomed',active);
    enlargedPhoto.classList.toggle('vcc-dg-is-dragging',Boolean(dragging?.moved));
    zoomLayer.style.visibility=active?'visible':'hidden';
    zoomLayer.style.transition=animate?'transform 150ms ease-out':'none';
    zoomLayer.style.transform='translate3d('+zoomX+'px,'+zoomY+'px,0) scale('+zoomLevel+')';
    enlargedPhoto.setAttribute('title',active?'Arrossega per moure · clic per reduir · roda per ajustar':'Clica per ampliar · roda del ratolí per fer zoom');
  }
  function resetDesktopZoom() {
    ++highResolutionToken;
    zoomLevel=1;
    zoomX=0;
    zoomY=0;
    dragging=null;
    ignoredClick=false;
    photoDimensions=null;
    if (zoomLayer)zoomLayer.style.backgroundImage='none';
    drawZoom();
  }
  function photoSource() {
    const count=existingStage?.querySelector('.lb-counter')?.textContent||'';
    const position=Number.parseInt(count.split('/')[0].trim(),10);
    return Number.isInteger(position) ? activeSources[position-1] : null;
  }
  function originalQuality() {
    const url=photoSource();
    if (!url || !zoomLayer || !enlargedPhoto)return;
    const request=++highResolutionToken;
    const original=new Image();
    original.onload=()=>{
      if(request!==highResolutionToken || !photoVisible())return;
      photoDimensions={width:original.naturalWidth,height:original.naturalHeight};
      zoomLayer.style.backgroundImage='url("'+url+'")';
      drawZoom();
    };
    original.onerror=()=>{}; // Si R2 no respon, es conserva el WebP actual.
    original.src=url;
  }
  function setDesktopZoom(target,clientX,clientY,animate=false) {
    if (!photoVisible())return;
    const old=zoomLevel;
    zoomLevel=clamp(target,1,4);
    if (zoomLevel<=1.01){zoomLevel=1;zoomX=0;zoomY=0;}
    else {
      const r=enlargedPhoto.getBoundingClientRect();
      const offsetX=clientX-(r.left+r.width/2);
      const offsetY=clientY-(r.top+r.height/2);
      const ratio=zoomLevel/old;
      zoomX=offsetX-(offsetX-zoomX)*ratio;
      zoomY=offsetY-(offsetY-zoomY)*ratio;
      if(old===1) {
        // El visor normal conserva el WebP de 2200 px; el zoom
        // carrega els píxels originals del mateix objecte Cloudflare R2.
        zoomLayer.style.backgroundImage=enlargedPhoto.style.backgroundImage;
        originalQuality();
      }
    }
    drawZoom(animate);
  }
  enlargedPhoto?.addEventListener('pointerdown',event=>{
    if (!photoVisible() || event.button!==0 || zoomLevel<=1)return;
    dragging={x:event.clientX,y:event.clientY,panX:zoomX,panY:zoomY,moved:false};
    enlargedPhoto.setPointerCapture(event.pointerId);
  });
  enlargedPhoto?.addEventListener('pointermove',event=>{
    if (!dragging || !photoVisible())return;
    const dx=event.clientX-dragging.x,dy=event.clientY-dragging.y;
    if(Math.hypot(dx,dy)>5)dragging.moved=true;
    if(!dragging.moved)return;
    zoomX=dragging.panX+dx;
    zoomY=dragging.panY+dy;
    drawZoom();
    event.preventDefault();
  });
  const finishDrag=()=>{
    if(!dragging)return;
    ignoredClick=dragging.moved;
    dragging=null;
    drawZoom();
  };
  enlargedPhoto?.addEventListener('pointerup',finishDrag);
  enlargedPhoto?.addEventListener('pointercancel',finishDrag);
  enlargedPhoto?.addEventListener('click',event=>{
    if(!photoVisible())return;
    if(ignoredClick){ignoredClick=false;return;}
    setDesktopZoom(zoomLevel>1?1:2.4,event.clientX,event.clientY,true);
  });
  enlargedPhoto?.addEventListener('wheel',event=>{
    if(!photoVisible())return;
    event.preventDefault();
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?300:1);
    const factor=Math.exp(-delta*0.002);
    setDesktopZoom(zoomLevel*factor,event.clientX,event.clientY);
  },{passive:false});
  if (enlargedPhoto) {
    new MutationObserver(() => {resetDesktopZoom();syncRoundedPhoto();}).observe(enlargedPhoto,{attributes:true,attributeFilter:['aria-label']});
  }
  window.addEventListener('resize',()=>{
    if(photoVisible() && zoomLevel>1)drawZoom();
  });
  document.addEventListener('keydown',event=>{
    if(!photoVisible())return;
    if(event.key==='0' || event.key==='Escape'){
      if(zoomLevel>1){event.preventDefault();resetDesktopZoom();}
    }
    if(event.key==='+' || event.key==='='){
      event.preventDefault();
      const r=enlargedPhoto.getBoundingClientRect();
      setDesktopZoom(zoomLevel*1.35,r.left+r.width/2,r.top+r.height/2,true);
    }
    if(event.key==='-'){
      event.preventDefault();
      const r=enlargedPhoto.getBoundingClientRect();
      setDesktopZoom(zoomLevel/1.35,r.left+r.width/2,r.top+r.height/2,true);
    }
  });

  existingLightbox?.addEventListener('vcc:lightbox-closed',()=>{
    resetDesktopZoom();
    enlargedPhoto?.classList.remove('vcc-dg-rounded-ready');
    if(layer.hidden || !activeGallery) return;
    layer.setAttribute('aria-hidden','false');
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
    if (!desktop.matches && !layer.hidden) closeGallery();
  });
})();
