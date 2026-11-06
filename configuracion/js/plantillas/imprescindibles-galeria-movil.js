/* VCC · Galería móvil en dos niveles. Solo quality / Estocolmo.
   Nivel 1: mosaico vertical grande + dos pequeñas. Nivel 2: foto individual.
   No altera el visor de escritorio ni las URL R2 originales. */
(() => {
  'use strict';
  const mobile = window.matchMedia('(max-width: 800px)');
  // Mateixa URL WebP de Cloudflare R2 en mosaic, visor i zoom.
  const preview = (url, size='visor') => String(url).replace(/(\/2026-dia1\/)(DSC\d+\.webp)$/i,'$1_preview/'+(size==='mini'?'mini':'visor')+'/$2');
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
        '<div class="vcc-mobile-photo-peek" aria-hidden="true" hidden></div>',
      '</div>',
    '</section>'
  ].join('');
  document.body.append(root);

  const gridView = root.querySelector('.vcc-mobile-grid-view');
  const photoView = root.querySelector('.vcc-mobile-photo-view');
  const scroller = root.querySelector('.vcc-mobile-gallery-scroll');
  const photoGrid = root.querySelector('.vcc-mobile-photo-grid');
  const large = root.querySelector('.vcc-mobile-photo-full');
  const photoCount = root.querySelector('.vcc-photo-count');
  const stage = root.querySelector('.vcc-mobile-photo-stage');
  const incoming = root.querySelector('.vcc-mobile-photo-peek');

  let photos = [];
  let placeTitle = '';
  let selected = 0;
  let focusBefore = null;
  let previousTile = null;

  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let naturalWidth = 0;
  let naturalHeight = 0;
  let loadedOriginal = false;
  let originalRequestId = 0;
  let gesture = null;
  let lastTap = null;
  let slideDirection = 0;
  let slideTimer = null;
  let slideAnimating = false;
  let slideFinish = null;
  const slideDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 62;
  let highResTimer = null;
  let highResToken = 0;
  let stageWidth = 0;
  const previewCache = new Map();
  const PREVIEW_CACHE_LIMIT = 3;
  const MAX_ZOOM = 4;

  // Mantenim un conjunt petit de WebP del visor a la memòria.
  // Evita tornar a crear quatre descàrregues en cada swipe consecutiu.
  function warmPreview(index) {
    if (!photos.length) return null;
    const key = preview(photos[(index + photos.length) % photos.length], 'visor');
    const existing = previewCache.get(key);
    if (existing) {
      previewCache.delete(key);
      previewCache.set(key, existing);
      return existing;
    }
    const img = new Image();
    img.decoding = 'async';
    img.src = key;
    previewCache.set(key, img);
    if (previewCache.size > PREVIEW_CACHE_LIMIT) {
      previewCache.delete(previewCache.keys().next().value);
    }
    return img;
  }
  function warmNeighbors() {
    if (photos.length < 2) return;
    // Sense precàrrega de tres WebP originals grans: el navegador ja els desa en memòria cau.
    // Les fotos veïnes es demanen només en navegar-hi.
  }
  // El retall suau s'aplica només a fotografies horitzontals.
  // Tant la foto activa com la que entra pel costat utilitzen el mateix marc.
  function framePhoto(element, index) {
    const img = warmPreview(index);
    element.classList.remove('is-landscape');
    if (!img) return;
    const update = () => {
      if (!img.naturalWidth || !img.naturalHeight || photoView.hidden) return;
      if (element === large && selected !== index) return;
      if (element === incoming &&
          (incoming.hidden || !slideDirection || neighborIndex(slideDirection) !== index)) return;
      element.classList.toggle('is-landscape', img.naturalWidth > img.naturalHeight);
    };
    if (img.complete && img.naturalWidth) update();
    else img.addEventListener('load', update, {once:true});
  }
  function scheduleOriginal(delay = 220) {
    clearTimeout(highResTimer);
    const request = ++highResToken;
    highResTimer = setTimeout(() => {
      highResTimer = null;
      if (request !== highResToken || photoView.hidden ||
          slideAnimating || gesture?.kind === 'swipe' || gesture?.kind === 'pan') return;
      loadOriginalForZoom();
    }, delay);
  }
  const bound = (v,low,high) => Math.max(low,Math.min(high,v));
  const touchPoint = t => ({x:t.clientX,y:t.clientY});
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const midpoint = (a,b) => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2});

  /* Foto oberta = fitxer WebP original de R2, sense segona compressió.
     Només s'inicia quan el dit s'atura; el fotograma en moviment usa
     previsualitzacions ràpides. El zoom força la petició immediatament. */
  function loadOriginalForZoom() {
    if (loadedOriginal || !photos[selected] || photoView.hidden) return;
    loadedOriginal = true;
    const id = ++originalRequestId, index = selected;
    const originalUrl = photos[index];
    const image = new Image();
    image.decoding = 'async';
    const apply = () => {
      if (id !== originalRequestId || index !== selected || photoView.hidden ||
          slideAnimating || gesture?.kind === 'swipe') return;
      large.style.backgroundImage = 'url("' + originalUrl + '")';
      naturalWidth = image.naturalWidth;
      naturalHeight = image.naturalHeight;
      renderZoom();
    };
    image.onload = () => {
      // La descodificació asíncrona evita bloquejar el fil principal al mig d'un gest.
      if (typeof image.decode === 'function') image.decode().then(apply, apply);
      else apply();
    };
    image.onerror = () => {
      if (id === originalRequestId) loadedOriginal = false;
    };
    image.src = originalUrl;
  }
  function restorePreview() {
    ++originalRequestId;
    loadedOriginal=false;
    if (!photoView.hidden && photos[selected]) {
      large.style.backgroundImage='url("'+preview(photos[selected],'visor')+'")';
    }
  }
  function clampPan() {
    const width = stage.clientWidth || 1, height = stage.clientHeight || 1;
    const fit = naturalWidth && naturalHeight ? Math.min(width/naturalWidth,height/naturalHeight) : 1;
    // L'enquadrament horitzontal és un 18% més gran fins i tot abans del zoom.
    const crop = large.classList.contains('is-landscape') ? 1.18 : 1;
    const imageWidth = naturalWidth ? naturalWidth*fit*crop : width;
    const imageHeight = naturalHeight ? naturalHeight*fit*crop : height;
    panX = bound(panX,-Math.max(0,(imageWidth*zoom-width)/2),Math.max(0,(imageWidth*zoom-width)/2));
    panY = bound(panY,-Math.max(0,(imageHeight*zoom-height)/2),Math.max(0,(imageHeight*zoom-height)/2));
  }
  function renderZoom(animate=false) {
    clampPan();
    large.style.transition = animate ? 'transform 180ms ease-out' : 'none';
    large.style.transform = 'translate3d('+panX+'px,'+panY+'px,0) scale('+zoom+')';
    stage.classList.toggle('is-zoomed',zoom>1.01);
    if(zoom>=1.45) { clearTimeout(highResTimer); loadOriginalForZoom(); }
  }
  function resetZoom() {
    zoom=1;panX=0;panY=0;gesture=null;lastTap=null;
    restorePreview();
    renderZoom();
  }
  function setZoom(next,at,animate=false) {
    const prev=zoom;
    zoom=bound(next,1,MAX_ZOOM);
    if (at && prev) {
      const rect=stage.getBoundingClientRect();
      const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      const factor=zoom/prev;
      panX=at.x-cx-factor*(at.x-cx-panX);
      panY=at.y-cy-factor*(at.y-cy-panY);
    }
    if (zoom<=1.01) {zoom=1;panX=0;panY=0;}
    renderZoom(animate);
  }


  /* Carrusel físic: mentre el dit es mou es veuen dues fotografies alhora.
     La foto veïna segueix el desplaçament de la principal i no salta al final. */
  const neighborIndex = direction => (selected + direction + photos.length) % photos.length;
  function clearSlide() {
    if (slideTimer !== null) clearTimeout(slideTimer);
    slideTimer = null;
    slideFinish = null;
    slideAnimating = false;
    slideDirection = 0;
    incoming.hidden = true;
    incoming.style.transition = 'none';
    incoming.style.transform = '';
    incoming.style.removeProperty('background-image');
    incoming.classList.remove('is-landscape');
    large.style.transition = 'none';
    large.style.transform = 'translate3d('+panX+'px,'+panY+'px,0) scale('+zoom+')';
  }
  function moveSlide(dx) {
    if (zoom !== 1 || photos.length < 2 || slideAnimating) return;
    const direction = dx < 0 ? 1 : -1;
    const width = stageWidth || stage.clientWidth || 1;
    if (slideDirection !== direction) {
      slideDirection = direction;
      const nextIndex = neighborIndex(direction);
      incoming.style.backgroundImage = 'url("'+preview(photos[nextIndex],'visor')+'")';
      incoming.hidden = false;
      framePhoto(incoming, nextIndex);
    }
    const offset = bound(dx,-width,width);
    large.style.transition = 'none';
    incoming.style.transition = 'none';
    large.style.transform = 'translate3d('+offset+'px,0,0) scale(1)';
    incoming.style.transform = 'translate3d('+(offset+direction*width)+'px,0,0)';
  }
  function finishSlide(dx,elapsed=400,forcedSingle=false) {
    if (!slideDirection || zoom !== 1 || photos.length < 2) {clearSlide();return;}
    const direction = slideDirection;
    const width = stageWidth || stage.clientWidth || 1;
    const next = neighborIndex(direction);
    // Un flick curt i ràpid també canvia de foto; manté la possibilitat
    // de tornar al centre si el desplaçament és realment petit.
    const velocity = Math.abs(dx)/Math.max(1,elapsed);
    const complete = Math.abs(dx)>=Math.max(34,width*0.105) ||
      (Math.abs(dx)>23 && velocity>0.52);
    // Un gest llarg i ràpid avança dues fotos, en dos moviments seguits
    // perquè també es pugui veure la fotografia intermèdia.
    const fast = velocity;
    const doubleStep = !forcedSingle && photos.length>2 && complete &&
      Math.abs(dx)>=width*0.58 && fast>=1.2;
    const endpoint = complete ? -direction*width : 0;
    slideAnimating = true;
    const duration = doubleStep ? Math.min(slideDuration,48) : slideDuration;
    let finished = false;
    const done = (interrupted=false) => {
      if (finished) return;
      finished=true;
      if (slideTimer!==null)clearTimeout(slideTimer);
      slideTimer = null;
      slideFinish = null;
      if (!complete) {clearSlide();return;}
      showPhoto(next);
      if (doubleStep && !interrupted && !photoView.hidden) {
        // Arrenca automàticament el segon fotograma del mateix gest.
        moveSlide(-direction*6);
        requestAnimationFrame(() => {
          if (slideDirection===direction && !photoView.hidden) {
            finishSlide(-direction*width,400,true);
          }
        });
      }
    };
    slideFinish = () => done(true);
    large.style.transition = 'transform '+duration+'ms cubic-bezier(.22,.67,.25,1)';
    incoming.style.transition = 'transform '+duration+'ms cubic-bezier(.22,.67,.25,1)';
    large.style.transform = 'translate3d('+endpoint+'px,0,0) scale(1)';
    incoming.style.transform = 'translate3d('+(endpoint+direction*width)+'px,0,0)';
    slideTimer = setTimeout(done,duration+18);
  }
  function returnToGuide() {
    clearTimeout(highResTimer);
    ++highResToken;
    ++originalRequestId;
    previewCache.clear();
    stageWidth = 0;
    clearSlide();
    resetZoom();
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
    clearTimeout(highResTimer);
    ++highResToken;
    clearSlide();
    resetZoom();
    photoView.hidden = true;
    gridView.hidden = false;
    large.style.removeProperty('background-image');
    if (previousTile && previousTile.isConnected) previousTile.focus({preventScroll: true});
    else gridView.querySelector('.vcc-mobile-nav').focus({preventScroll: true});
  }
  function showPhoto(index) {
    if (!photos.length) return;
    clearTimeout(highResTimer);
    ++highResToken;
    clearSlide();
    selected = (index + photos.length) % photos.length;
    ++originalRequestId;
    loadedOriginal=false;
    resetZoom();
    naturalWidth=0;naturalHeight=0;
    photoView.hidden = false;
    gridView.hidden = true;
    framePhoto(large, selected);
    const url = preview(photos[selected], 'visor');
    large.style.backgroundImage = 'url("' + url + '")';
    // Calculem els límits de desplaçament segons l'aspecte real del WebP.
    const currentPhoto = selected;
    const probe = warmPreview(selected);
    const sizeReady = () => {
      if (selected === currentPhoto && !photoView.hidden && probe?.naturalWidth) {
        naturalWidth = probe.naturalWidth;
        naturalHeight = probe.naturalHeight;
        if (!slideAnimating && gesture?.kind !== 'swipe') renderZoom();
      }
    };
    if (probe?.complete && probe.naturalWidth) sizeReady();
    else probe?.addEventListener('load', sizeReady, {once:true});
    large.setAttribute('aria-label', placeTitle + ', fotografía ' + (selected + 1) + ' de ' + photos.length);
    photoCount.textContent = 'Foto ' + (selected + 1) + ' de ' + photos.length;
    // La foto original de R2 arriba quan la navegació ja s'ha estabilitzat.
    // Abans mantenim els WebP de visor, lleugers i amb menys latència.
    scheduleOriginal();
    if (!photoView.contains(document.activeElement)) {
      photoView.querySelector('.vcc-mobile-nav').focus({preventScroll: true});
    }
    warmNeighbors();
  }
  function openGallery(gallery) {
    if (!gallery) return;
    try { photos = JSON.parse(gallery.dataset.images || '[]'); } catch { photos = []; }
    if (!Array.isArray(photos) || !photos.length) return;
    previewCache.clear();
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
      img.onerror = () => { if (img.src !== url) img.src=url; };
      img.alt = placeTitle + ', foto ' + (index + 1);
      img.loading = 'lazy';
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
  });
  document.addEventListener('keydown', event => {
    if (root.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!photoView.hidden) showGrid();
      else returnToGuide();
    }
    if (!photoView.hidden && zoom===1 && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
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

  /* Gestos de la fotografia: lliscar sense zoom, pessigar per ampliar,
     arrossegar mentre està ampliada i doble toc per ampliar/reduir. */
  stage.addEventListener('touchstart', event => {
    if (photoView.hidden) return;
    // Permet fer dos o més gestos seguits sense esperar que acabi la transició.
    if (slideAnimating) slideFinish?.();
    // Cap descàrrega/descodificació d'alta resolució mentre hi ha moviment.
    clearTimeout(highResTimer);
    ++highResToken;
    ++originalRequestId;
    loadedOriginal = false;
    stageWidth = stage.clientWidth || 1;
    if (event.touches.length===2) {
      clearSlide();
      const a=touchPoint(event.touches[0]),b=touchPoint(event.touches[1]);
      gesture={kind:'pinch',distance:Math.max(1,distance(a,b)),
        middle:midpoint(a,b),zoom,panX,panY};
      lastTap=null;
    } else if (event.touches.length===1 && (!gesture || gesture.kind!=='pinch')) {
      const pos=touchPoint(event.touches[0]);
      gesture={kind:zoom>1?'pan':'swipe',start:pos,panX,panY,moved:false,started:Date.now()};
    }
  },{passive:true});
  stage.addEventListener('touchmove', event => {
    if (photoView.hidden) return;
    if (event.cancelable) event.preventDefault();
    if (event.touches.length===2 && gesture?.kind==='pinch') {
      const a=touchPoint(event.touches[0]),b=touchPoint(event.touches[1]);
      const middle=midpoint(a,b);
      const factor=bound(gesture.zoom*(distance(a,b)/gesture.distance),1,MAX_ZOOM)/gesture.zoom;
      zoom=bound(gesture.zoom*(distance(a,b)/gesture.distance),1,MAX_ZOOM);
      const r=stage.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      panX=middle.x-cx-factor*(gesture.middle.x-cx-gesture.panX);
      panY=middle.y-cy-factor*(gesture.middle.y-cy-gesture.panY);
      if (zoom<=1.01) {zoom=1;panX=0;panY=0;}
      renderZoom();
    } else if (event.touches.length===1 && gesture?.kind==='pan') {
      const pt=touchPoint(event.touches[0]);
      const dx=pt.x-gesture.start.x,dy=pt.y-gesture.start.y;
      gesture.moved ||= Math.hypot(dx,dy)>8;
      panX=gesture.panX+dx;panY=gesture.panY+dy;
      renderZoom();
    } else if (event.touches.length===1 && gesture?.kind==='swipe') {
      const pt=touchPoint(event.touches[0]);
      const dx=pt.x-gesture.start.x,dy=pt.y-gesture.start.y;
      gesture.moved ||= Math.hypot(dx,dy)>8;
      if (Math.abs(dx)>6 && Math.abs(dx)>Math.abs(dy)*1.15) moveSlide(dx);
    }
  },{passive:false});
  stage.addEventListener('touchend', event => {
    if (photoView.hidden || !gesture) return;
    if (gesture.kind==='pinch') {
      if (event.touches.length===0) {gesture=null;if (zoom<1.08)setZoom(1,null,true);scheduleOriginal();}
      return;
    }
    if (event.touches.length || !event.changedTouches.length) return;
    const pt=touchPoint(event.changedTouches[0]),g=gesture;
    gesture=null;
    const dx=pt.x-g.start.x,dy=pt.y-g.start.y;
    if (g.kind==='swipe' && zoom===1) {
      if (slideDirection || (Math.abs(dx)>14 && Math.abs(dx)>Math.abs(dy)*1.15)) {
        if (!slideDirection && photos.length>1) moveSlide(dx);
        finishSlide(dx,Date.now()-g.started);
        lastTap=null;
        return;
      }
      clearSlide();
    }
    if (Math.hypot(dx,dy)>14) {lastTap=null;scheduleOriginal();return;}
    const now=Date.now();
    if (lastTap && now-lastTap.time<320 && distance(pt,lastTap.pos)<55) {
      setZoom(zoom>1.01?1:2.5,pt,true);
      lastTap=null;
    } else lastTap={pos:pt,time:now};
    if (zoom===1) scheduleOriginal();
  },{passive:true});
  stage.addEventListener('touchcancel',() => {gesture=null;lastTap=null;clearSlide();scheduleOriginal();},{passive:true});
  window.addEventListener('resize',() => {stageWidth=0;if (!photoView.hidden) {clearSlide();renderZoom();}});
  mobile.addEventListener('change', () => {if (!mobile.matches && !root.hidden) returnToGuide();});
})();
