/* VCC · Mapa Imprescindibles: carregar Leaflet quan es necessita.
   L'índex i el PDF els crea imprescindibles-mapa.js després de Leaflet.
   La galeria i la portada no depenen d'aquest mòdul. */
(() => {
 'use strict';
 const target=document.getElementById('imp-all-map');
 if(!target)return;
 const exportButton=document.getElementById('imp-export-pdf');
 let started=null,ready=false;
 const appendStyle=(href)=>new Promise((resolve,reject)=>{
   const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(n=>n.href===new URL(href,location.href).href);
   if(existing){resolve();return;}
   const link=document.createElement('link');
   link.rel='stylesheet';link.href=href;
   link.onload=resolve;link.onerror=()=>reject(new Error('No carga Leaflet CSS'));
   document.head.append(link);
 });
 const appendScript=(src)=>new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=src;script.async=true;
   script.onload=resolve;script.onerror=()=>reject(new Error('No carga el mapa: '+src));
   document.body.append(script);
 });
 function load(){
  if(started)return started;
  started=(async()=>{
   await appendStyle('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
   if(!window.L)await appendScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
   await appendScript('/configuracion/js/destinos/suecia/estocolmo/imprescindibles-mapa.js?v=20261112-drottningholm-v3');
   ready=true;
  })().catch(error=>{
   console.warn('No se pudo cargar el mapa de imprescindibles.',error);
   const note=target.querySelector('.imp-map-unavailable');
   if(note)note.textContent='El mapa interactivo no está disponible en este momento.';
   if(exportButton)exportButton.disabled=true;
  });
  return started;
 }
 const observer='IntersectionObserver' in window ? new IntersectionObserver(entries=>{
  if(!entries.some(e=>e.isIntersecting))return;
  observer.disconnect();void load();
 },{rootMargin:'600px 0px',threshold:0}) : null;
 if(observer)observer.observe(target);
 else if(document.readyState==='complete')void load();
 else window.addEventListener('load',load,{once:true});
 target.addEventListener('focusin',()=>{void load()},{once:true});
 // Exportar a PDF sigue funcionando aunque el usuario llegue antes de que
 // haya cargado Leaflet. El clic se reproduce solo si se inició el mapa.
 exportButton?.addEventListener('click',event=>{
  if(ready)return;
  event.preventDefault();event.stopImmediatePropagation();
  void load().then(()=>{if(ready&&!exportButton.disabled)exportButton.click()});
 },true);
})();
