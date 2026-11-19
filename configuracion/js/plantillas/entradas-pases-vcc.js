/* VCC · Entradas y pases · navegación editorial + consejos deslizables.
   Cero APIs externas, rankings ficticios ni dependencias; el texto existe en HTML. */
(function(){
"use strict";
function init(){
  const root=document.querySelector(".ep-page");
  if(!root)return;
  // Les dades de les fotos a EN es poden regenerar des del castellà:
  // normalitzar data-area i data-caption abans d'obrir el visor compartit.
  if(window.location.pathname==="/en"||window.location.pathname.startsWith("/en/")){
    const translations=new Map([
      ["Fotos de nuestro primer día por Gamla Stan y el entorno del Palacio Real","Photos from day one around Gamla Stan and the Royal Palace area"],
      ["Fotos de nuestra visita a Djurgården y al entorno del Museo Vasa","Photos from our Djurgården walk and the Vasa Museum area"],
      ["Fotos de nuestra excursión por el archipiélago de Estocolmo","Photos from our trip through the Stockholm archipelago"]
    ]);
    const mosaic=root.querySelector('.ep4-photos-aside .day-mosaic');
    if(mosaic){
      if(mosaic.dataset.subtitle==="Dos visitas de pago y una jornada entre islas")mosaic.dataset.subtitle="Two paid attraction visits and a day among islands";
      if(mosaic.dataset.description==="Fotos propias de Gamla Stan, Djurgården y el archipiélago. Abre el mosaico para verlas todas.")mosaic.dataset.description="Our own photos from Gamla Stan, Djurgården and the archipelago. Click to open the full gallery.";
    }
    root.querySelectorAll('.ep4-photos-aside .day-mosaic button[data-photo]').forEach(photo=>{
      if(photo.dataset.area==="Archipiélago")photo.dataset.area="Archipelago";
      if(translations.has(photo.dataset.caption))photo.dataset.caption=translations.get(photo.dataset.caption);
      const badge=photo.querySelector(".ep4-photo-label");
      if(badge&&photo.dataset.area)badge.textContent=photo.dataset.area;
    });
  }
  const nav=root.querySelector(".ep-subnav");
  if(nav){
    const links=[...nav.querySelectorAll('a[href^="#"]')];
    const sections=links.map(link=>document.getElementById(link.hash.slice(1))).filter(Boolean);
    let rafPending=false,preferPass=false;
    function syncNav(){
      const header=document.querySelector(".shared-header")||document.querySelector(".page-header");
      const sticky=header&&["fixed","sticky"].includes(window.getComputedStyle(header).position);
      const headerHeight=sticky?Math.round(header.getBoundingClientRect().height):0;
      document.documentElement.style.setProperty("--ep-header-height",headerHeight+"px");
      const trigger=headerHeight+nav.offsetHeight+24;
      const pass=root.querySelector(".ep4-pass") || document.getElementById("pase-turistico");
      // The pass is beside the comparison table on desktop; same Y ≠ different section.
      // Prefer the main comparison section unless the user explicitly requested the pass.
      let active=sections[0];
      sections.forEach(section=>{
        if(section.id==="pase-turistico"&&!preferPass)return;
        if(section.getBoundingClientRect().top<=trigger)active=section;
      });
      if(preferPass&&pass&&pass.getBoundingClientRect().bottom<=trigger){
        preferPass=false;
        active=sections.find(section=>section.id==="ahorrar")||active;
      }
      links.forEach(link=>{
        if(active&&link.hash==="#"+active.id)link.setAttribute("aria-current","location");
        else link.removeAttribute("aria-current");
      });
      rafPending=false;
    }
    function scheduleNav(){if(rafPending)return;rafPending=true;window.requestAnimationFrame(syncNav);}
    links.forEach(link=>link.addEventListener("click",()=>{
      preferPass=link.hash==="#pase-turistico";
      links.forEach(other=>other.removeAttribute("aria-current"));
      link.setAttribute("aria-current","location");
    }));
    window.addEventListener("scroll",scheduleNav,{passive:true});
    window.addEventListener("resize",scheduleNav,{passive:true});
    window.addEventListener("load",syncNav,{once:true});
    syncNav();
  }
  root.querySelectorAll(".ep-scroll-track").forEach(track=>{
    const buttons=[...root.querySelectorAll('[data-ep-slide-target="'+track.id+'"]')];
    if(!buttons.length)return;
    let waiting=false;
    function sync(){
      const max=Math.max(0,track.scrollWidth-track.clientWidth);
      buttons.forEach(button=>{
        const backward=button.dataset.epSlideDir==="-1";
        button.disabled=max<3||(backward?track.scrollLeft<=2:track.scrollLeft>=max-2);
        button.setAttribute("aria-disabled",String(button.disabled));
      });
      if(track.id==="ep4-our-track") { const stage=track.closest(".ep4-our-stage"); if(stage) stage.classList.toggle("ep4-our-no-overflow",max<3); }
      waiting=false;
    }
    function schedule(){if(waiting)return;waiting=true;window.requestAnimationFrame(sync);}
    buttons.forEach(button=>button.addEventListener("click",()=>{
      if(button.disabled)return;
      const first=track.firstElementChild;if(!first)return;
      const gap=parseFloat(window.getComputedStyle(track).gap)||0;
      const step=first.getBoundingClientRect().width+gap;
      const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollBy({left:Number(button.dataset.epSlideDir)*step,behavior:reduced?"auto":"smooth"});
      schedule();
    }));
    track.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    window.addEventListener("load",schedule,{once:true});
    window.requestAnimationFrame(sync);
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();