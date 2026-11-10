/* VCC · Galeria Booking compartida (Quality).
   Basada en el visor de "Qué ver · Imprescindibles": mosaic, lateral, comptador,
   zoom natiu Mac/Windows, panoràmica 2D i gestos tàctils al mòbil.
   Ús: afegir data-vcc-booking-gallery al modal i data-vcc-gallery-selector
   indicant els mosaics. Cada mosaic ha de tenir button[data-photo] i data-title.
   El mateix component pot muntar-se a més guies sense copiar el controlador. */
(() => {
'use strict';
// Component complet: les futures guies només necessiten el contenidor modal buit.
const galleryTemplate="\n <div class=\"day-lightbox-panel\">\n  <section class=\"day-lightbox-grid-view\" aria-label=\"Mosaico completo de fotografías\" hidden>\n   <header class=\"day-lightbox-grid-head\">\n    <button class=\"day-lightbox-grid-back\" type=\"button\" aria-label=\"Volver al itinerario\">← <span>Volver a la guía</span></button>\n    <div class=\"day-lightbox-grid-heading\"><strong></strong><span class=\"day-lightbox-grid-count\"></span></div>\n    <button class=\"day-lightbox-grid-close\" type=\"button\" aria-label=\"Cerrar galería\">×</button>\n   </header>\n   <div class=\"day-lightbox-grid-main\">\n    <div class=\"day-lightbox-grid-scroll\" tabindex=\"0\" aria-label=\"Todas las fotografías del día\">\n     <div class=\"day-lightbox-grid\"></div>\n    </div>\n    <aside class=\"day-lightbox-grid-info\"><div class=\"day-lightbox-grid-info-inner\"><h3></h3><p></p></div></aside>\n   </div>\n  </section>\n  <section class=\"day-lightbox-photo-view\" aria-label=\"Fotografía ampliada\" hidden>\n   <header class=\"day-lightbox-photo-head\">\n    <button class=\"day-lightbox-to-grid\" type=\"button\" aria-label=\"Volver al mosaico completo\">← GALERÍA</button>\n    <h3 class=\"day-lightbox-photo-title\"></h3>\n    <button class=\"day-lightbox-close\" type=\"button\" aria-label=\"Cerrar galería\">×</button>\n   </header>\n   <div class=\"day-lightbox-stage\">\n    <div class=\"day-lightbox-photo-frame\"><img alt=\"\" draggable=\"false\" decoding=\"async\"></div>\n    <button class=\"day-lightbox-prev\" type=\"button\" aria-label=\"Foto anterior\">‹</button>\n    <button class=\"day-lightbox-next\" type=\"button\" aria-label=\"Foto siguiente\">›</button>\n   </div>\n   <div class=\"day-lightbox-counter\" aria-live=\"polite\"></div>\n   <div class=\"day-lightbox-thumbs\" aria-label=\"Miniaturas de la galería\"></div>\n   <aside class=\"day-lightbox-info\"><h3></h3><p></p></aside>\n  </section>\n </div>\n";
const ensureGalleryMarkup=modal=>{
 if(modal.querySelector('.day-lightbox-panel'))return;
 modal.insertAdjacentHTML('beforeend',galleryTemplate);
};
const instances=new WeakMap();
function mount(modal,options={}){
 if(!modal)return null;
 if(instances.has(modal))return instances.get(modal);
 ensureGalleryMarkup(modal);
const gallerySelector=options.gallerySelector||modal.dataset.vccGallerySelector||'.vcc-booking-gallery .day-mosaic';
const overviewSelector=options.overviewSelector||modal.dataset.vccOverviewSelector||'.overview-card img';
const galleries=[...document.querySelectorAll(gallerySelector)];
if(!galleries.length)return null;
const panel=modal.querySelector('.day-lightbox-panel');
const gridView=modal.querySelector('.day-lightbox-grid-view');
const photoView=modal.querySelector('.day-lightbox-photo-view');
const grid=modal.querySelector('.day-lightbox-grid');
const gridHead=modal.querySelector('.day-lightbox-grid-heading strong');
const gridCount=modal.querySelector('.day-lightbox-grid-count');
const gridTitle=modal.querySelector('.day-lightbox-grid-info h3');
const gridDescription=modal.querySelector('.day-lightbox-grid-info p');
const gridBack=modal.querySelector('.day-lightbox-grid-back');
const gridClose=modal.querySelector('.day-lightbox-grid-close');
const gridScroll=modal.querySelector('.day-lightbox-grid-scroll');
const photoTitle=modal.querySelector('.day-lightbox-photo-title');
const photoImage=modal.querySelector('.day-lightbox-photo-frame>img');
const stage=modal.querySelector('.day-lightbox-stage');
const counter=modal.querySelector('.day-lightbox-counter');
const thumbs=modal.querySelector('.day-lightbox-thumbs');
const photoInfoTitle=modal.querySelector('.day-lightbox-info h3');
const photoInfoDescription=modal.querySelector('.day-lightbox-info p');
const photoBack=modal.querySelector('.day-lightbox-to-grid');
const photoClose=modal.querySelector('.day-lightbox-close');
const prev=modal.querySelector('.day-lightbox-prev');
const next=modal.querySelector('.day-lightbox-next');
const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const nativeMobile=()=>window.matchMedia('(max-width: 800px)').matches;
const isMobile=()=>modal.classList.contains('vcc-gallery-mobile');
let currentImages=[],currentIndex=0,lastFocus=null,gridButtons=[];
let originalScrollY=0,photoSequence=0;
const visible=()=>!modal.hidden;
const gridOpen=()=>visible()&&!gridView.hidden;
const photoOpen=()=>visible()&&!photoView.hidden;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const previewFallback=(img,original)=>{
 if(!img||!original)return;
 img.addEventListener('error',()=>{
  if(img.dataset.fullFallback)return;
  img.dataset.fullFallback='1';
  img.src=original;
 },{once:true});
};
galleries.forEach(gallery=>gallery.querySelectorAll('button[data-photo]').forEach(button=>{
 previewFallback(button.querySelector('img'),button.dataset.photo);
}));
document.querySelectorAll(overviewSelector).forEach(img=>{
 previewFallback(img,img.src.replace('/__vcc_preview/mini/','/'));
});
function createThumb(url,source,alt){
 const img=document.createElement('img');
 img.loading='lazy';img.decoding='async';img.alt=alt;
 img.src=url;
 previewFallback(img,source);
 return img;
}
function resetTouchZoom(){
 touchZoom=1;touchPanX=0;touchPanY=0;
 photoImage.style.removeProperty('--vcc-touch-zoom');
 photoImage.style.removeProperty('--vcc-touch-pan-x');
 photoImage.style.removeProperty('--vcc-touch-pan-y');
}
const paintTouchZoom=()=>{
 photoImage.style.setProperty('--vcc-touch-zoom',String(touchZoom));
 photoImage.style.setProperty('--vcc-touch-pan-x',touchPanX+'px');
 photoImage.style.setProperty('--vcc-touch-pan-y',touchPanY+'px');
};
let touchZoom=1,touchPanX=0,touchPanY=0,touchGesture=null,lastTap=null;
const limitTouchPan=()=>{
 const w=stage.clientWidth,h=stage.clientHeight;
 const fittedW=photoImage.clientWidth,fittedH=photoImage.clientHeight;
 touchPanX=clamp(touchPanX,-Math.max(0,(fittedW*touchZoom-w)/2),Math.max(0,(fittedW*touchZoom-w)/2));
 touchPanY=clamp(touchPanY,-Math.max(0,(fittedH*touchZoom-h)/2),Math.max(0,(fittedH*touchZoom-h)/2));
};
function createGrid(){
 grid.replaceChildren();gridButtons=[];
 currentImages.forEach((item,index)=>{
  const b=document.createElement('button');b.type='button';
  b.setAttribute('aria-label','Abrir fotografía '+(index+1)+' de '+currentImages.length);
  b.append(createThumb(item.preview,item.src,'Fotografía '+(index+1)+' de '+currentImages.length));
  b.addEventListener('click',()=>showPhoto(index));
  grid.append(b);gridButtons.push(b);
 });
}
function createThumbs(){
 thumbs.replaceChildren();
 currentImages.forEach((item,index)=>{
  const b=document.createElement('button');b.type='button';
  b.className=index===currentIndex?'active':'';
  b.setAttribute('aria-label','Ver foto '+(index+1)+' de '+currentImages.length);
  b.append(createThumb(item.preview,item.src,''));
  b.addEventListener('click',()=>showPhoto(index));
  thumbs.append(b);
  if(index===currentIndex)requestAnimationFrame(()=>b.scrollIntoView({
   block:'nearest',inline:'nearest'
  }));
 });
}
function showGrid(returnFocus=false){
 ++photoSequence;
 photoImage.removeAttribute('src');
 resetTouchZoom();
 photoView.hidden=true;gridView.hidden=false;
 gridView.setAttribute('aria-hidden','false');
 photoView.setAttribute('aria-hidden','true');
 if(returnFocus&&gridButtons[currentIndex])gridButtons[currentIndex].focus({preventScroll:true});
 else gridClose.focus({preventScroll:true});
 syncNativeZoom();
}
function showPhoto(index){
 if(!currentImages.length)return;
 currentIndex=(index+currentImages.length)%currentImages.length;
 const item=currentImages[currentIndex],id=++photoSequence;
 gridView.hidden=true;photoView.hidden=false;
 gridView.setAttribute('aria-hidden','true');
 photoView.setAttribute('aria-hidden','false');
 photoTitle.textContent=activeTitle;
 photoInfoTitle.textContent=activeSubtitle;
 photoInfoDescription.textContent=activeDescription;
 counter.textContent=isMobile()?'Foto '+(currentIndex+1)+' de '+currentImages.length:
  (currentIndex+1)+' / '+currentImages.length;
 resetTouchZoom();
 // Miniatura immediata; original descodificat sense bloquejar la navegació.
 const visor=item.preview.includes('/__vcc_preview/mini/')
  ?item.preview.replace('/__vcc_preview/mini/','/__vcc_preview/visor/')
  :item.preview.replace('/_preview/mini/','/_preview/visor/');
 photoImage.src=visor;
 photoImage.alt=item.alt;
 photoImage.onerror=()=>{if(id===photoSequence&&photoImage.src!==item.src)photoImage.src=item.src};
 const full=new Image();full.decoding='async';
 full.onload=async()=>{
  try{if(full.decode)await full.decode()}catch(_){}
  if(id!==photoSequence||!photoOpen())return;
  photoImage.src=item.src;
 };
 full.src=item.src;
 createThumbs();
 photoBack.focus({preventScroll:true});
 syncNativeZoom();
}
function move(delta){
 if(!photoOpen()||!currentImages.length)return;
 showPhoto(currentIndex+delta);
}
let activeTitle='',activeSubtitle='',activeDescription='';
function openGallery(gallery,button){
 const buttons=[...gallery.querySelectorAll('button[data-photo]')];
 currentImages=buttons.map((b,i)=>({
  src:b.dataset.photo,
  preview:b.querySelector('img')?.src||b.dataset.photo,
  alt:b.querySelector('img')?.alt||'Fotografía '+(i+1)+' del itinerario'
 }));
 if(!currentImages.length)return;
 activeTitle=gallery.dataset.title||'Galería de fotografías';
 activeSubtitle=gallery.closest('.day-section')?.querySelector('.day-intro .hand')?.textContent?.trim()||activeTitle;
 activeDescription=gallery.dataset.description||'';
 gridHead.textContent=activeTitle;gridCount.textContent=currentImages.length+' fotografías';
 gridTitle.textContent=activeSubtitle;gridDescription.textContent=activeDescription;
 lastFocus=button;
 originalScrollY=window.scrollY;
 createGrid();
 modal.classList.toggle('vcc-gallery-mobile',nativeMobile());
 modal.classList.toggle('vcc-gallery-desktop',!nativeMobile());
 modal.hidden=false;
 document.body.classList.add('vcc-booking-gallery-open');
 gridScroll.scrollTop=0;
 showGrid();
 if(!isMobile())startPanBaseline();
}
function closeGallery(){
 ++photoSequence;
 resetPan();
 clearZoomBaseline();
 modal.hidden=true;
 gridView.hidden=true;photoView.hidden=true;
 modal.classList.remove('vcc-gallery-mobile','vcc-gallery-desktop');
 document.body.classList.remove('vcc-booking-gallery-open');
 photoImage.removeAttribute('src');
 grid.replaceChildren();thumbs.replaceChildren();
 currentImages=[];gridButtons=[];resetTouchZoom();
 if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
 lastFocus=null;
}
galleries.forEach(gallery=>{
 gallery.querySelectorAll('button[data-photo]').forEach(button=>{
  button.addEventListener('click',()=>openGallery(gallery,button));
 });
});
gridBack.addEventListener('click',closeGallery);
gridClose.addEventListener('click',closeGallery);
photoClose.addEventListener('click',closeGallery);
photoBack.addEventListener('click',()=>showGrid(true));
prev.addEventListener('click',()=>move(-1));
next.addEventListener('click',()=>move(1));
modal.addEventListener('click',event=>{if(event.target===modal)closeGallery()});
document.addEventListener('keydown',event=>{
 if(!visible())return;
 if(event.key==='Escape'){
  event.preventDefault();if(photoOpen())showGrid(true);else closeGallery();
 }else if(event.key==='ArrowRight'&&photoOpen()){
  event.preventDefault();move(1);
 }else if(event.key==='ArrowLeft'&&photoOpen()){
  event.preventDefault();move(-1);
 }else if(event.key==='Tab'){
  const focusables=[...modal.querySelectorAll('button:not([disabled])')]
   .filter(x=>x.getClientRects().length>0);
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){
   event.preventDefault();last.focus();
  }else if(!event.shiftKey&&document.activeElement===last){
   event.preventDefault();first.focus();
  }
 }
});
/* Zoom natiu + pan del mateix sistema VCC d'Imprescindibles:
   Ctrl+rodeta / pinça del navegador intactes, cursor lliure, trackpad 2D.
   No fem un segon zoom CSS en escriptori. */
let baseline=null,zoomPan={x:0,y:0},lastPointer=null,panBase=null,panFrame=0;
let pendingX=0,pendingY=0,pendingAnchor=null,zoomWasActive=false,zoomFrame=0;
const activeDesktop=()=>visible()&&!isMobile()&&!!baseline;
const zoomRatio=()=>{
 if(!baseline)return 1;
 const vv=window.visualViewport,css=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
 return Math.max(
  baseline.w/Math.max(1,window.innerWidth),
  baseline.h/Math.max(1,window.innerHeight),
  (window.devicePixelRatio||1)/Math.max(.01,baseline.dpr),
  (vv?.scale||1)/Math.max(.01,baseline.scale),
  baseline.vw/Math.max(1,vv?.width||window.innerWidth),
  baseline.vh/Math.max(1,vv?.height||window.innerHeight),
  css/Math.max(.01,baseline.css)
 );
};
const limits=()=>{
 const rect=modal.getBoundingClientRect(),vv=window.visualViewport;
 const zoom=Math.max(1,zoomRatio());
 const visibleW=Math.max(1,Math.min(rect.width,vv?.width||rect.width,baseline?.w/zoom||rect.width));
 const visibleH=Math.max(1,Math.min(rect.height,vv?.height||rect.height,baseline?.h/zoom||rect.height));
 const offsetX=Math.max(0,Number(vv?.offsetLeft)||0);
 const offsetY=Math.max(0,Number(vv?.offsetTop)||0);
 const minX=Math.min(0,18-offsetX),minY=Math.min(0,18-offsetY);
 return {
  minX,minY,
  x:Math.max(minX,18+panel.offsetWidth-visibleW-offsetX),
  y:Math.max(minY,18+panel.offsetHeight-visibleH-offsetY)
 };
};
function paintPan(){
 if(!activeDesktop())return;
 if(Math.abs(zoomPan.x)<.05&&Math.abs(zoomPan.y)<.05)
  panel.style.removeProperty('transform');
 else panel.style.setProperty('transform',
  'translate3d('+(-zoomPan.x).toFixed(2)+'px,'+(-zoomPan.y).toFixed(2)+'px,0)','important');
}
function resetHoverPan(){
 panBase=null;pendingX=pendingY=0;
 if(panFrame){cancelAnimationFrame(panFrame);panFrame=0}
}
function resetPan(){
 resetHoverPan();pendingAnchor=null;zoomPan.x=zoomPan.y=0;
 panel.style.removeProperty('transform');
 modal.scrollLeft=0;modal.scrollTop=0;
}
function clearZoomBaseline(){
 resetPan();
 baseline=null;zoomWasActive=false;
 modal.classList.remove('vcc-gallery-viewport','vcc-zoom-pan-enabled');
 modal.style.removeProperty('--vcc-gallery-panel-width');
 modal.style.removeProperty('--vcc-gallery-panel-height');
 modal.style.removeProperty('--vcc-gallery-grid-columns');
 modal.style.removeProperty('--vcc-gallery-photo-columns');
 modal.style.removeProperty('--vcc-gallery-grid-gap');
 modal.style.removeProperty('--vcc-gallery-grid-padding');
}
function startPanBaseline(){
 resetPan();
 zoomWasActive=false;
 const vv=window.visualViewport,root=document.documentElement;
 baseline={
  w:window.innerWidth,h:window.innerHeight,dpr:window.devicePixelRatio||1,
  scale:vv?.scale||1,vw:vv?.width||window.innerWidth,
  vh:vv?.height||window.innerHeight,
  css:parseFloat(getComputedStyle(root).zoom)||1
 };
 const width=panel.offsetWidth,height=panel.offsetHeight;
 modal.style.setProperty('--vcc-gallery-panel-width',Math.max(1,width)+'px');
 modal.style.setProperty('--vcc-gallery-panel-height',Math.max(1,height)+'px');
 // Congelar columnes i espais reals en travessar breakpoints amb zoom de Mac/Windows.
 const main=modal.querySelector('.day-lightbox-grid-main');
 modal.style.setProperty('--vcc-gallery-grid-columns',getComputedStyle(main).gridTemplateColumns);
 modal.style.setProperty('--vcc-gallery-photo-columns',getComputedStyle(main).gridTemplateColumns);
 modal.style.setProperty('--vcc-gallery-grid-gap',getComputedStyle(grid).gap);
 modal.style.setProperty('--vcc-gallery-grid-padding',getComputedStyle(gridScroll).padding);
 modal.classList.add('vcc-gallery-viewport');
 syncNativeZoom();
}
function rememberZoomAnchor(event){
 const p=panel.getBoundingClientRect();
 pendingAnchor={
  pointX:event.clientX-p.left,pointY:event.clientY-p.top,
  cursorX:event.clientX,cursorY:event.clientY,
  viewportW:Math.max(1,window.innerWidth),
  viewportH:Math.max(1,window.innerHeight)
 };
}
function syncNativeZoom(){
 if(!activeDesktop())return;
 const ratio=zoomRatio(),zoomed=ratio>1.025,wasZoomed=zoomWasActive;
 zoomWasActive=zoomed;
 modal.classList.toggle('vcc-zoom-pan-enabled',zoomed);
 if(!zoomed){
  if(pendingAnchor&&!wasZoomed)return;
  resetPan();
  if(wasZoomed)requestAnimationFrame(()=>{
   if(activeDesktop()&&zoomRatio()<=1.025)resetPan();
  });
  return;
 }
 const lim=limits();
 if(pendingAnchor){
  const a=pendingAnchor;
  const px=a.cursorX*window.innerWidth/a.viewportW;
  const py=a.cursorY*window.innerHeight/a.viewportH;
  zoomPan.x=clamp(18+a.pointX-px,lim.minX,lim.x);
  zoomPan.y=clamp(18+a.pointY-py,lim.minY,lim.y);
  pendingAnchor=null;resetHoverPan();
 }else if(!wasZoomed){
  const bx=lastPointer?.x??baseline.w/2;
  const by=lastPointer?.y??baseline.h/2;
  const frac=1-1/Math.max(1,ratio);
  zoomPan.x=clamp(bx*frac,lim.minX,lim.x);
  zoomPan.y=clamp(by*frac,lim.minY,lim.y);
  resetHoverPan();
 }else{
  zoomPan.x=clamp(zoomPan.x,lim.minX,lim.x);
  zoomPan.y=clamp(zoomPan.y,lim.minY,lim.y);
 }
 paintPan();
}
function queueZoomSync(){
 if(!activeDesktop()||zoomFrame)return;
 zoomFrame=requestAnimationFrame(()=>{zoomFrame=0;syncNativeZoom()});
}
function onMouseMove(event){
 if(!activeDesktop())return;
 if(event.type==='pointermove'&&event.pointerType&&event.pointerType!=='mouse')return;
 if(typeof event.buttons==='number'&&event.buttons!==0)return;
 const p={x:event.clientX,y:event.clientY,sx:event.screenX,sy:event.screenY};
 lastPointer=p;
 if(zoomRatio()<=1.025){resetHoverPan();return}
 if(!panBase){panBase={...p,panX:zoomPan.x,panY:zoomPan.y};return}
 let dx=p.x-panBase.x,dy=p.y-panBase.y;
 if(Math.abs(dx)<.1&&Number.isFinite(p.sx))dx=(p.sx-panBase.sx)/zoomRatio();
 if(Math.abs(dy)<.1&&Number.isFinite(p.sy))dy=(p.sy-panBase.sy)/zoomRatio();
 if(!Number.isFinite(dx)||!Number.isFinite(dy))return;
 const lim=limits();
 pendingX=clamp(panBase.panX+dx*.8,lim.minX,lim.x);
 pendingY=clamp(panBase.panY+dy*.8,lim.minY,lim.y);
 if(!panFrame)panFrame=requestAnimationFrame(()=>{
  panFrame=0;
  if(!activeDesktop()||zoomRatio()<=1.025)return;
  zoomPan.x=pendingX;zoomPan.y=pendingY;paintPan();
 });
}
window.addEventListener('mousemove',onMouseMove,{capture:true,passive:true});
window.addEventListener('pointermove',onMouseMove,{capture:true,passive:true});
window.addEventListener('wheel',event=>{
 if(!activeDesktop())return;
 if(event.ctrlKey||event.metaKey){
  rememberZoomAnchor(event);resetHoverPan();
  requestAnimationFrame(()=>requestAnimationFrame(queueZoomSync));
  return;
 }
 if(zoomRatio()<=1.025||!event.cancelable)return;
 const factor=event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1;
 const dx=event.deltaX*factor,dy=event.deltaY*factor;
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||(!dx&&!dy))return;
 event.preventDefault();
 const lim=limits();
 zoomPan.x=clamp(zoomPan.x+dx*.8,lim.minX,lim.x);
 zoomPan.y=clamp(zoomPan.y+dy*.8,lim.minY,lim.y);
 resetHoverPan();paintPan();
},{capture:true,passive:false});
window.addEventListener('resize',()=>{resetHoverPan();queueZoomSync()},{passive:true});
window.visualViewport?.addEventListener('resize',()=>{resetHoverPan();queueZoomSync()},{passive:true});
window.visualViewport?.addEventListener('scroll',queueZoomSync,{passive:true});
window.addEventListener('gesturechange',queueZoomSync,{passive:true});
window.addEventListener('gestureend',queueZoomSync,{passive:true});
/* Mòbil: swipe horitzontal; pinça i drag lliure de la foto ampliada. */
const distance=(a,b)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
stage.addEventListener('touchstart',event=>{
 if(!isMobile()||!photoOpen())return;
 if(event.touches.length===2){
  const dist=distance(event.touches[0],event.touches[1]);
  touchGesture={kind:'pinch',dist,zoom:touchZoom,panX:touchPanX,panY:touchPanY};
 }else if(event.touches.length===1){
  const t=event.touches[0];
  touchGesture={kind:'drag',x:t.clientX,y:t.clientY,panX:touchPanX,panY:touchPanY};
 }
},{passive:true});
stage.addEventListener('touchmove',event=>{
 if(!isMobile()||!photoOpen()||!touchGesture)return;
 if(event.touches.length===2){
  if(touchGesture.kind!=='pinch'){
   touchGesture={kind:'pinch',dist:distance(event.touches[0],event.touches[1]),zoom:touchZoom};
  }
  event.preventDefault();
  touchZoom=clamp(touchGesture.zoom*distance(event.touches[0],event.touches[1])/Math.max(1,touchGesture.dist),1,4);
  if(touchZoom===1)touchPanX=touchPanY=0;
  limitTouchPan();paintTouchZoom();
 }else if(event.touches.length===1&&touchGesture.kind==='drag'){
  const t=event.touches[0];
  if(touchZoom>1.01){
   event.preventDefault();
   touchPanX=touchGesture.panX+t.clientX-touchGesture.x;
   touchPanY=touchGesture.panY+t.clientY-touchGesture.y;
   limitTouchPan();paintTouchZoom();
  }
 }
},{passive:false});
stage.addEventListener('touchend',event=>{
 if(!isMobile()||!photoOpen()||!touchGesture)return;
 if(event.touches.length)return;
 if(touchGesture.kind==='drag'&&touchZoom<=1.01){
  const t=event.changedTouches[0];
  const dx=t.clientX-touchGesture.x,dy=t.clientY-touchGesture.y;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)move(dx<0?1:-1);
 }
 touchGesture=null;
},{passive:true});
stage.addEventListener('touchcancel',()=>{touchGesture=null},{passive:true});
stage.addEventListener('dblclick',event=>{
 if(!isMobile()||!photoOpen())return;
 event.preventDefault();touchZoom=touchZoom>1?1:2;
 if(touchZoom===1)touchPanX=touchPanY=0;
 limitTouchPan();paintTouchZoom();
});

 const instance={modal,close:closeGallery};
 instances.set(modal,instance);
 return instance;
}
const api=Object.freeze({mount});
window.VCCBookingGallery=api;
const init=()=>document.querySelectorAll('[data-vcc-booking-gallery]').forEach(modal=>mount(modal));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
