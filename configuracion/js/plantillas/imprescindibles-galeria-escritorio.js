/* VCC · galeria d'imprescindibles per a ordinador (quality).
   Primer clic: mosaic desplegat 3/3/3. Segon clic: visor original amb text lateral.
   En mòbils no intervé: segueix funcionant la galeria vertical existent. */
(() => {
  'use strict';
  const desktop = window.matchMedia('(min-width: 801px)');
  const imageRoot = '/destinos/suecia/goteborg/imagenes/optimizadas/mini/';
  const miniUrl = source => {
    const name = String(source).match(/(DSC[0-9]+[.]webp)(?:[?#].*)?$/i);
    return name ? imageRoot + name[1] : source;
  };

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
  };

  const openGallery = gallery => {
    let sources;
    try { sources = JSON.parse(gallery.dataset.images || '[]'); }
    catch {sources = [];}
    if (!Array.isArray(sources) || !sources.length) return;
    const section = gallery.closest('.place');
    if (!section) return;
    activeGallery = gallery;
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

  /* Cursor de mà també a la fotografia ampliada:
     clic per avançar; si només n'hi ha una, tornar al mosaic.
     No dupliquem els gestos d'arrossegar que ja té el visor. */
  const enlargedPhoto = existingStage?.querySelector('.lb-photo');
  let photoPointerStart = null;
  let photoWasDragged = false;
  enlargedPhoto?.addEventListener('pointerdown', event => {
    photoPointerStart = {x:event.clientX,y:event.clientY};
    photoWasDragged = false;
  });
  enlargedPhoto?.addEventListener('pointerup', event => {
    if (!photoPointerStart) return;
    photoWasDragged = Math.hypot(event.clientX-photoPointerStart.x,event.clientY-photoPointerStart.y)>9;
    photoPointerStart = null;
  });
  enlargedPhoto?.addEventListener('click', () => {
    if (!existingLightbox?.classList.contains('open') || layer.hidden) return;
    if (photoWasDragged) {photoWasDragged=false;return;}
    if (existingLightbox.classList.contains('vcc-dg-single')) {
      window.VCCImprescindiblesLightbox?.dismiss();
    } else {
      existingStage?.querySelector('.lb-next')?.click();
    }
  });

  existingLightbox?.addEventListener('vcc:lightbox-closed',()=>{
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
