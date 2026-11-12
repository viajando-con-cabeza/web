/* VCC · Carregador diferit del visor compartit (galeries amb mosaics SSR/JS).
   No modifica els mosaics, ni les fotos, ni les transicions Booking.
   Només carrega el CSS i el controlador de visor quan hi ha interacció. */
(() => {
 'use strict';
 const modal=document.querySelector('[data-vcc-booking-gallery][data-vcc-lazy-gallery-modal]');
 const galleries=[...document.querySelectorAll('.imp-page .imp-main .gallery')];
 if(!modal||!galleries.length)return;
 let pending=null,ready=Boolean(window.VCCBookingGallery);
 const styleURL='/configuracion/css/componentes/vcc-gallery-booking.css?v=20261112-on-demand-v1';
 const scriptURL='/configuracion/js/componentes/vcc-gallery-booking.js?v=20261112-on-demand-v1';
 function load(){
  if(ready)return Promise.resolve();
  if(pending)return pending;
  pending=new Promise((resolve,reject)=>{
   const link=document.createElement('link');
   link.rel='stylesheet';link.href=styleURL;
   link.onload=()=>{
    const script=document.createElement('script');
    script.src=scriptURL;script.async=true;
    script.onload=()=>{
     ready=Boolean(window.VCCBookingGallery);
     if(ready){resolve();return;}
     reject(new Error('El visor no se ha inicializado'));
    };
    script.onerror=()=>reject(new Error('No se pudo cargar el visor'));
    document.body.append(script);
   };
   link.onerror=()=>reject(new Error('No se pudo cargar el CSS del visor'));
   document.head.append(link);
  }).catch(error=>{
   console.warn('Galería VCC:',error);
   pending=null;
  });
  return pending;
 }
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   observer.disconnect();void load();
  },{rootMargin:'100px 0px',threshold:0});
  observer.observe(galleries[0]);
 }
 // Un clic anticipat no es perd: esperem a muntar el modal i el repetim.
 document.addEventListener('click',event=>{
  const tile=event.target.closest?.('.imp-page .imp-main .gallery .gallery-tile');
  if(!tile||ready)return;
  event.preventDefault();event.stopImmediatePropagation();
  void load().then(()=>{if(ready&&tile.isConnected)tile.click()});
 },true);
 document.addEventListener('focusin',event=>{
  if(event.target.closest?.('.imp-page .imp-main .gallery'))void load();
 },true);
})();
