/* VCC · Entradas y pases · navegación editorial + consejos deslizables.
   Cero APIs externas, rankings ficticios ni dependencias; el texto existe en HTML. */
(function(){
"use strict";
function init(){
  const root=document.querySelector(".ep-page");
  if(!root)return;
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
      const pass=document.getElementById("pase-turistico");
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
    const indicator=track.id==="ep3-saving-track"?root.querySelector("#ep4-saving-count"):null;
    let waiting=false;
    function sync(){
      const max=Math.max(0,track.scrollWidth-track.clientWidth);
      buttons.forEach(button=>{
        const backward=button.dataset.epSlideDir==="-1";
        button.disabled=max<3||(backward?track.scrollLeft<=2:track.scrollLeft>=max-2);
        button.setAttribute("aria-disabled",String(button.disabled));
      });
      if(indicator){
        const first=track.firstElementChild;
        const total=track.children.length;
        if(first&&total){
          const gap=parseFloat(window.getComputedStyle(track).gap)||0;
          const step=Math.max(1,first.getBoundingClientRect().width+gap);
          const visible=Math.max(1,Math.min(total,Math.floor((track.clientWidth+gap+2)/step)));
          const firstIndex=Math.max(0,Math.min(total-visible,Math.round(track.scrollLeft/step)));
          const start=firstIndex+1,end=Math.min(total,firstIndex+visible);
          indicator.textContent=start===end?"Consejo "+start+" de "+total:"Consejos "+start+"–"+end+" de "+total;
        }
      }
      waiting=false;
    }
    function schedule(){if(waiting)return;waiting=true;window.requestAnimationFrame(sync);}
    buttons.forEach(button=>button.addEventListener("click",()=>{
      if(button.disabled)return;
      const first=track.firstElementChild;if(!first)return;
      const gap=parseFloat(window.getComputedStyle(track).gap)||0;
      const step=first.getBoundingClientRect().width+gap;
      const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollBy({left:Number(button.dataset.epSlideDir)*step,behavior:reduced?"instant":"smooth"});
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