/* VCC · Itineraris: visor universal només quan és necessari.
 * El mosaic és HTML/CSS; no requereix les 38 KB de JS i les 30 KB de CSS
 * del visor fins que el lector s'acosta a les fotos.
 * Reutilitza sense modificar el component compartit Booking.
 */
(()=>{
 'use strict';
 const modal=document.querySelector('[data-vcc-booking-gallery][data-vcc-lazy-gallery-modal]');
 const first=document.querySelector('.vcc-booking-gallery .day-mosaic');
 if(!modal||!first)return;
 const css='/configuracion/css/componentes/vcc-gallery-booking.css?v=20261112-itinerary-lazy-v1';
 const script='/configuracion/js/componentes/vcc-gallery-booking.js?v=20261112-itinerary-lazy-v1';
 let pending=null;
 const ready=()=>Boolean(window.VCCBookingGallery);
 function load(){
  if(ready())return Promise.resolve(true);
  if(pending)return pending;
  pending=new Promise((resolve,reject)=>{
   const link=document.createElement('link');
   link.rel='stylesheet';link.href=css;
   link.onload=()=>{
    const tag=document.createElement('script');
    tag.src=script;tag.async=true;
    tag.onload=()=>ready()?resolve(true):reject(new Error('Visor no inicializado'));
    tag.onerror=()=>reject(new Error('Fallo cargando el visor'));
    document.body.append(tag);
   };
   link.onerror=()=>reject(new Error('Fallo cargando el CSS del visor'));
   document.head.append(link);
  }).catch(e=>{
   console.warn('Galería VCC:',e);
   pending=null;
   return false;
  });
  return pending;
 }
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   observer.disconnect();void load();
  },{rootMargin:'550px 0px',threshold:0});
  observer.observe(first);
 }
 // Fallback per a usuaris que arriben al mosaic abans que es completi
 // la càrrega: no es perd el primer clic ni el focus de teclat.
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('.vcc-booking-gallery .day-mosaic button[data-photo]');
  if(!button||ready())return;
  event.preventDefault();
  event.stopImmediatePropagation();
  void load().then(ok=>{if(ok&&button.isConnected)button.click()});
 },true);
 document.addEventListener('focusin',event=>{
  if(event.target.closest?.('.vcc-booking-gallery .day-mosaic'))void load();
 },true);
})();
