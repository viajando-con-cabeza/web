(() => {
'use strict';
// Els derivats R2 són miniatures; l'original sempre és el recanvi segur.
const fallbackPreview=(img,full)=>{
 if(!img||!full)return;
 img.addEventListener('error',()=>{if(img.dataset.fullFallback)return;img.dataset.fullFallback='1';img.src=full;},{once:true});
};
document.querySelectorAll('.day-mosaic button[data-photo]').forEach(button=>{
 fallbackPreview(button.querySelector('img'),button.dataset.photo);
});
document.querySelectorAll('.overview-card img').forEach(img=>{
 fallbackPreview(img,img.src.replace('/__vcc_preview/mini/','/'));
});
const overview=document.querySelector('.overview-list');
if(overview && overview.querySelectorAll('.overview-card').length > 3){
 const cards=[...overview.querySelectorAll('.overview-card')];
 const pages=Math.ceil(cards.length/3),controls=document.createElement('div');controls.className='vcc-overview-controls';controls.setAttribute('aria-label','Páginas del resumen');
 const previous=document.createElement('button');previous.type='button';previous.textContent='‹';previous.setAttribute('aria-label','Grupo anterior de días');
 const dots=document.createElement('div');dots.className='vcc-overview-dots';const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','Grupo siguiente de días');
 controls.append(previous,dots,next);overview.append(controls);let page=0,gestureX=null,gestureY=null;
 const render=(p)=>{page=Math.max(0,Math.min(pages-1,p));cards.forEach((card,i)=>{card.hidden=Math.floor(i/3)!==page;card.style.display=card.hidden?'none':'';});previous.disabled=page===0;next.disabled=page===pages-1;[...dots.children].forEach((dot,i)=>dot.setAttribute('aria-current',String(i===page)));};
 for(let i=0;i<pages;i++){const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',`Mostrar días ${i*3+1} a ${Math.min((i+1)*3,cards.length)}`);dot.addEventListener('click',()=>render(i));dots.append(dot);}
 previous.addEventListener('click',()=>render(page-1));next.addEventListener('click',()=>render(page+1));overview.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;gestureX=e.clientX;gestureY=e.clientY;});overview.addEventListener('pointerup',e=>{if(gestureX===null)return;const dx=e.clientX-gestureX,dy=e.clientY-gestureY;gestureX=gestureY=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){e.preventDefault();render(page+(dx<0?1:-1));}});overview.addEventListener('pointercancel',()=>{gestureX=gestureY=null;});controls.hidden=pages<=1;render(0);
}
const modal=document.getElementById('dayLightbox');
if(!modal)return;
const gridView=modal.querySelector('.day-lightbox-grid-view');
const grid=modal.querySelector('.day-lightbox-grid');
const gridTitle=modal.querySelector('.day-lightbox-grid-heading');
const gridCount=modal.querySelector('.day-lightbox-grid-count');
const gridBack=modal.querySelector('.day-lightbox-grid-back');
const photoBack=modal.querySelector('.day-lightbox-to-grid');
const stage=modal.querySelector('.day-lightbox-stage');
const image=stage.querySelector(':scope > img');
const counter=modal.querySelector('.day-lightbox-counter');
const thumbs=modal.querySelector('.day-lightbox-thumbs');
const title=modal.querySelector('.day-lightbox-info h3');
const description=modal.querySelector('.day-lightbox-info p');
const sidebar=modal.querySelector('.day-lightbox-info');
const close=modal.querySelector('.day-lightbox-close');
const prev=modal.querySelector('.day-lightbox-prev');
const next=modal.querySelector('.day-lightbox-next');
let currentImages=[],currentIndex=0,lastFocus=null,originX=null,originY=null;
let gridButtons=[];
const isGrid=()=>modal.classList.contains('is-grid');
const renderPhoto=()=>{
 if(!currentImages.length)return;
 const item=currentImages[currentIndex];
 image.src=item.src;
 image.alt=item.alt;
 counter.textContent=(currentIndex+1)+' / '+currentImages.length;
 thumbs.replaceChildren();
 currentImages.forEach((photo,index)=>{
  const button=document.createElement('button');
  button.type='button';
  button.className=index===currentIndex?'active':'';
  button.setAttribute('aria-label','Ver foto '+(index+1)+' de '+currentImages.length);
  const thumb=document.createElement('img');
  thumb.src=photo.preview||photo.src;thumb.alt='';fallbackPreview(thumb,photo.src);
  thumb.loading='lazy';thumb.decoding='async';
  button.append(thumb);
  button.addEventListener('click',()=>{currentIndex=index;renderPhoto()});
  thumbs.append(button);
  if(index===currentIndex)button.scrollIntoView({block:'nearest',inline:'nearest'});
 });
};
const renderGrid=()=>{
 grid.replaceChildren();
 gridButtons=[];
 currentImages.forEach((photo,index)=>{
  const button=document.createElement('button');
  button.type='button';
  button.setAttribute('aria-label','Abrir foto '+(index+1)+' de '+currentImages.length);
  const picture=document.createElement('img');
  picture.src=photo.preview||photo.src;picture.alt=photo.alt;fallbackPreview(picture,photo.src);
  picture.loading='lazy';picture.decoding='async';
  const count=document.createElement('span');
  count.textContent=(index+1)+' / '+currentImages.length;
  count.setAttribute('aria-hidden','true');
  button.append(picture,count);
  button.addEventListener('click',()=>openPhoto(index));
  grid.append(button);
  gridButtons.push(button);
 });
};
const showGrid=(focusPhoto=false)=>{
 image.removeAttribute('src');
 modal.classList.add('is-grid');
 gridView.hidden=false;
 stage.hidden=true;sidebar.hidden=true;
 gridCount.textContent=currentImages.length+' fotos';
 if(focusPhoto&&gridButtons[currentIndex])gridButtons[currentIndex].focus();
 else gridBack.focus();
};
const openPhoto=(index)=>{
 currentIndex=index;
 modal.classList.remove('is-grid');
 gridView.hidden=true;stage.hidden=false;sidebar.hidden=false;
 renderPhoto();
 photoBack.focus();
};
const openGallery=(gallery,button)=>{
 const images=[...gallery.querySelectorAll('button[data-photo]')];
 currentImages=images.map((b,index)=>({
  src:b.dataset.photo,
  preview:b.querySelector('img')?.src||b.dataset.photo,
  alt:b.querySelector('img')?.alt||b.dataset.alt||gallery.dataset.title||('Foto '+(index+1))
 }));
 if(!currentImages.length)return;
 currentIndex=0;
 lastFocus=button;
 gridTitle.textContent=gallery.dataset.title||'Galería de fotografías';
 title.textContent=gallery.dataset.title||'Galería de fotografías';
 description.textContent=gallery.dataset.description||'';
 modal.hidden=false;
 document.body.style.overflow='hidden';
 renderGrid();
 showGrid();
};
const hide=()=>{
 modal.hidden=true;
 modal.classList.remove('is-grid');
 gridView.hidden=true;
 stage.hidden=false;sidebar.hidden=false;
 document.body.style.overflow='';
 image.removeAttribute('src');
 thumbs.replaceChildren();
 grid.replaceChildren();
 gridButtons=[];currentImages=[];
 lastFocus?.focus?.();lastFocus=null;
};
const move=delta=>{
 if(!currentImages.length||isGrid())return;
 currentIndex=(currentIndex+delta+currentImages.length)%currentImages.length;
 renderPhoto();
};
document.querySelectorAll('.day-mosaic').forEach(gallery=>{
 gallery.querySelectorAll('button[data-photo]').forEach(button=>{
  button.addEventListener('click',()=>openGallery(gallery,button));
 });
});
gridBack.addEventListener('click',hide);
photoBack.addEventListener('click',()=>showGrid(true));
close.addEventListener('click',hide);
prev.addEventListener('click',()=>move(-1));
next.addEventListener('click',()=>move(1));
modal.addEventListener('click',event=>{if(event.target===modal)hide()});
document.addEventListener('keydown',event=>{
 if(modal.hidden)return;
 if(event.key==='Escape'){
  event.preventDefault();
  if(isGrid())hide();else showGrid(true);
 }else if(!isGrid()&&event.key==='ArrowRight'){
  event.preventDefault();move(1);
 }else if(!isGrid()&&event.key==='ArrowLeft'){
  event.preventDefault();move(-1);
 }else if(event.key==='Tab'){
  const focusables=[...modal.querySelectorAll('button:not([disabled])')]
    .filter(x=>x.getClientRects().length>0);
  if(!focusables.length)return;
  const index=focusables.indexOf(document.activeElement);
  if(event.shiftKey&&index<=0){event.preventDefault();focusables.at(-1).focus()}
  else if(!event.shiftKey&&index===focusables.length-1){
   event.preventDefault();focusables[0].focus();
  }
 }
});
stage.addEventListener('pointerdown',event=>{
 if(event.target.closest('button'))return;
 originX=event.clientX;originY=event.clientY;
 try{stage.setPointerCapture(event.pointerId)}catch(_){}
});
stage.addEventListener('pointerup',event=>{
 if(originX===null)return;
 const dx=event.clientX-originX,dy=event.clientY-originY;
 originX=originY=null;
 if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)move(dx<0?1:-1);
});
stage.addEventListener('pointercancel',()=>{originX=originY=null});
})();
