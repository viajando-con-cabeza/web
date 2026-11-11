/* VCC · Carga diferida de galerías situadas fuera del primer viewport.
 * NO implementa el visor: carga los dos módulos originales de configuracion
 * y sus estilos, en orden, cuando el mosaico se aproxima a la pantalla.
 * Accesible sin IntersectionObserver y respetuoso con caché/navegación directa. */
(() => {
 'use strict';
 function init(){
  const target=document.querySelector('[data-vcc-lazy-gallery]');
  if(!target)return;
  let started=false;
  const styles=[
   '/configuracion/css/componentes/galeria-vcc-cuando-ir.css?v=20261110-universal1',
   '/configuracion/css/componentes/vcc-gallery-booking.css?v=20261111-fast-preview-v5'
  ];
  const scripts=[
   '/configuracion/js/plantillas/imprescindibles-interactions.js?v=20261110-universal1',
   '/configuracion/js/componentes/vcc-gallery-booking.js?v=20261111-fast-preview-v5'
  ];
  const addStyle=url=>new Promise(resolve=>{
   if(document.querySelector('link[rel="stylesheet"][href="'+url+'"]'))return resolve();
   const link=document.createElement('link');
   link.rel='stylesheet';link.href=url;
   link.onload=resolve;
   link.onerror=()=>{console.warn('VCC galería: no se pudo cargar el CSS',url);resolve();};
   document.head.append(link);
  });
  const addScript=url=>new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=url;script.async=false;
   script.onload=resolve;
   script.onerror=()=>reject(new Error('No se pudo cargar el módulo VCC: '+url));
   document.body.append(script);
  });
  async function load(){
   if(started)return;
   started=true;
   try{
    await Promise.all(styles.map(addStyle));
    // La primera librería dibuja el mosaico; la segunda monta el visor.
    for(const script of scripts)await addScript(script);
    target.dataset.vccGalleryLoaded='true';
   }catch(error){
    console.error('VCC galería:',error);
    // El contenido editorial y las fotografías originales siguen intactos.
    target.dataset.vccGalleryError='true';
   }
  }
  if(!('IntersectionObserver' in window)){load();return;}
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   observer.disconnect();
   load();
  },{rootMargin:'1400px 0px',threshold:0});
  observer.observe(target);
  // Acceso directo por teclado o enlace a la sección antes del scroll.
  target.addEventListener('focusin',load,{once:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();