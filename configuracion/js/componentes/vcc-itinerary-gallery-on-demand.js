/* VCC · Itineraris: codi del visor només quan és necessari.
 * El CSS compartit conté el mosaic de 5 fotos i s'ha de carregar
 * al primer render per no provocar salts de disseny mentre es fa scroll.
 * El controlador JS del visor s'importa quan el lector s'apropa.
 */
(()=>{
 'use strict';
 const modal=document.querySelector('[data-vcc-booking-gallery][data-vcc-lazy-gallery-modal]');
 const first=document.querySelector('.vcc-booking-gallery .day-mosaic');
 if(!modal||!first)return;
 const script='/configuracion/js/componentes/vcc-gallery-booking.js?v=20261112-itinerary-lazy-v1';
 let pending=null;
 const ready=()=>Boolean(window.VCCBookingGallery);
 function load(){
  if(ready())return Promise.resolve(true);
  if(pending)return pending;
  pending=new Promise((resolve,reject)=>{
   const tag=document.createElement('script');
   tag.src=script;tag.async=true;
   tag.onload=()=>ready()?resolve(true):reject(new Error('Visor no inicializado'));
   tag.onerror=()=>reject(new Error('Fallo cargando el visor'));
   document.body.append(tag);
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
