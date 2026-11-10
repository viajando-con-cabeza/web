/* VCC: carregador compartit de fons no crítics sense canviar la imatge.
   S'activa només en seccions amb data-vcc-lazy-background. */
(() => {
'use strict';
function init(){
 const sections=[...document.querySelectorAll('[data-vcc-lazy-background]')];
 if(!sections.length)return;
 const reveal=el=>el.classList.add('vcc-bg-ready');
 if(!('IntersectionObserver' in window)){
  sections.forEach(reveal);return;
 }
 const observer=new IntersectionObserver((entries)=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   reveal(entry.target);
   observer.unobserve(entry.target);
  }
 },{rootMargin:'2200px 0px',threshold:0});
 sections.forEach(el=>observer.observe(el));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
