/* Viajando con Cabeza · galeria reutilizable: mosaico + visor modal.
   Miniaturas AVIF/WebP en R2; preview de visor solo al abrir;
   original en alta resolucion solo al ampliar. Sin dependencias de Qué ver. */
(() => {
  'use strict';
  const galleries = document.querySelectorAll('[data-vcc-photo-gallery]');
  if (!galleries.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  galleries.forEach(gallery => {
    const data = gallery.querySelector('script.vcc-gallery-data[type="application/json"]');
    let photos;
    try { photos = JSON.parse(data?.textContent || '[]'); } catch { photos = []; }
    photos = photos.filter(p => p && typeof p.original === 'string' && typeof p.visor === 'string' && typeof p.mini === 'string');
    if (!photos.length || typeof HTMLDialogElement === 'undefined') return;

    const dialog = document.createElement('dialog');
    dialog.className = 'vcc-gallery-dialog';
    dialog.setAttribute('aria-label', 'Galería de fotos VCC');
    dialog.innerHTML = `
      <div class="vcc-gallery-modal">
        <div class="vcc-gallery-top">
          <strong class="vcc-gallery-title">Fotografías de nuestro viaje</strong>
          <span class="vcc-gallery-counter" aria-live="polite"></span>
          <button class="vcc-gallery-close" type="button" data-vcc-act="close" aria-label="Cerrar galería">×</button>
        </div>
        <div class="vcc-gallery-stage">
          <button class="vcc-gallery-arrow prev" type="button" data-vcc-act="prev" aria-label="Fotografía anterior">‹</button>
          <div class="vcc-gallery-picture">
            <img alt="" decoding="async">
            <p class="vcc-gallery-error" hidden>No se ha podido cargar la fotografía.</p>
          </div>
          <button class="vcc-gallery-arrow next" type="button" data-vcc-act="next" aria-label="Fotografía siguiente">›</button>
        </div>
        <div class="vcc-gallery-foot">
          <p class="vcc-gallery-caption"></p>
          <button class="vcc-gallery-zoom" type="button" data-vcc-act="zoom" aria-label="Ampliar fotografía">Ampliar</button>
        </div>
        <div class="vcc-gallery-thumbs" role="group" aria-label="Seleccionar fotografía"></div>
      </div>`;
    document.body.append(dialog);
    const mainImage = dialog.querySelector('.vcc-gallery-picture img');
    const picture = dialog.querySelector('.vcc-gallery-picture');
    const error = dialog.querySelector('.vcc-gallery-error');
    const counter = dialog.querySelector('.vcc-gallery-counter');
    const caption = dialog.querySelector('.vcc-gallery-caption');
    const thumbs = dialog.querySelector('.vcc-gallery-thumbs');
    const zoom = dialog.querySelector('.vcc-gallery-zoom');
    let current=0, enlarged=false, focusedBefore=null, finger=null;
    let activeRequest=0;

    const resetZoom = () => {
      enlarged=false;
      picture.classList.remove('is-zoomed');
      zoom.textContent='Ampliar';
      zoom.setAttribute('aria-label','Ampliar fotografía');
    };
    photos.forEach((p,i)=>{
      const button=document.createElement('button');
      button.type='button';button.className='vcc-gallery-thumb';
      button.setAttribute('aria-label','Ver foto '+(i+1)+' de '+photos.length);
      button.dataset.index=String(i);
      const img=document.createElement('img');img.src=p.mini;img.alt='';img.loading='lazy';img.decoding='async';
      button.append(img);thumbs.append(button);
    });
    const select=index=>{
      current=(index+photos.length)%photos.length;
      const entry=photos[current],ticket=++activeRequest;
      resetZoom();
      error.hidden=true;
      mainImage.hidden=false;
      mainImage.alt=entry.alt || 'Fotografía de nuestro viaje a Suecia';
      mainImage.src=entry.visor;
      mainImage.onerror=()=>{
        if(ticket!==activeRequest)return;
        mainImage.hidden=true;
        error.hidden=false;
      };
      counter.textContent=(current+1)+' / '+photos.length;
      caption.textContent=entry.caption||'Foto propia de Viajando con Cabeza';
      thumbs.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',i===current?'true':'false'));
      const active=thumbs.querySelectorAll('button')[current];
      if(active && !reduceMotion.matches)active.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
    };
    const close=()=>{if(dialog.open)dialog.close();};
    const open=index=>{
      focusedBefore=document.activeElement;
      if(!dialog.open)dialog.showModal();
      document.body.classList.add('vcc-gallery-dialog-open');
      select(index);
      dialog.querySelector('.vcc-gallery-close').focus({preventScroll:true});
    };
    gallery.addEventListener('click',event=>{
      const anchor=event.target.closest('[data-vcc-gallery-open]');
      if(!anchor)return;
      event.preventDefault();
      open(Number(anchor.dataset.vccGalleryOpen)||0);
    });
    thumbs.addEventListener('click',event=>{
      const btn=event.target.closest('button[data-index]');
      if(btn)select(Number(btn.dataset.index));
    });
    dialog.addEventListener('click',event=>{
      const button=event.target.closest('button[data-vcc-act]');
      if(button){
        const action=button.dataset.vccAct;
        if(action==='close')close();
        if(action==='prev')select(current-1);
        if(action==='next')select(current+1);
        if(action==='zoom'){
          if(enlarged){select(current);return;}
          enlarged=true;
          picture.classList.add('is-zoomed');
          zoom.textContent='Reducir';
          zoom.setAttribute('aria-label','Reducir fotografía');
          mainImage.src=photos[current].original;
        }
      } else if(event.target===dialog){close();}
    });
    dialog.addEventListener('keydown',event=>{
      if(!dialog.open || enlarged)return;
      if(event.key==='ArrowRight'){event.preventDefault();select(current+1);}
      if(event.key==='ArrowLeft'){event.preventDefault();select(current-1);}
    });
    const stage=dialog.querySelector('.vcc-gallery-stage');
    stage.addEventListener('touchstart',event=>{
      if(enlarged||event.touches.length!==1)return;
      finger={x:event.touches[0].clientX,y:event.touches[0].clientY};
    },{passive:true});
    stage.addEventListener('touchend',event=>{
      if(!finger||enlarged)return;
      const end=event.changedTouches[0],dx=end.clientX-finger.x,dy=end.clientY-finger.y;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)select(current+(dx<0?1:-1));
      finger=null;
    },{passive:true});
    dialog.addEventListener('close',()=>{
      document.body.classList.remove('vcc-gallery-dialog-open');
      resetZoom();
      ++activeRequest;mainImage.removeAttribute('src');
      focusedBefore?.focus?.({preventScroll:true});
      focusedBefore=null;
    });
  });
})();
