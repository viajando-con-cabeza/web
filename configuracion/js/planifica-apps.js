/* VCC · Apps de viaje: carruseles y filtro de apps, sin dependencias. */
(()=>{
"use strict";
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const carousels={};
document.querySelectorAll("[data-av-track]").forEach(track=>{
  const id=track.dataset.avTrack;
  const prev=document.querySelector('[data-av-prev="'+id+'"]');
  const next=document.querySelector('[data-av-next="'+id+'"]');
  if(!prev||!next)return;
  const max=()=>Math.max(0,track.scrollWidth-track.clientWidth);
  const sync=()=>{prev.disabled=track.scrollLeft<3;next.disabled=track.scrollLeft>max()-3;};
  const move=dir=>{
    const card=[...track.children].find(c=>!c.hidden);
    if(!card)return;
    const gap=parseFloat(getComputedStyle(track).columnGap)||0;
    track.scrollTo({left:Math.min(max(),Math.max(0,track.scrollLeft+dir*(card.getBoundingClientRect().width+gap))),behavior:reduce?"auto":"smooth"});
  };
  prev.addEventListener("click",()=>move(-1));
  next.addEventListener("click",()=>move(1));
  track.addEventListener("keydown",ev=>{if(ev.key!=="ArrowLeft"&&ev.key!=="ArrowRight")return;ev.preventDefault();move(ev.key==="ArrowRight"?1:-1);});
  let scheduled=false;
  track.addEventListener("scroll",()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync();});},{passive:true});
  window.addEventListener("resize",sync,{passive:true});
  carousels[id]={track,sync};sync();
});
const chips=[...document.querySelectorAll("[data-av-category]")];
const cards=[...document.querySelectorAll("[data-av-app]")];
chips.forEach(button=>button.addEventListener("click",()=>{
  const category=button.dataset.avCategory;
  chips.forEach(b=>{const active=b===button;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active));});
  cards.forEach(c=>{c.hidden=c.dataset.avApp!==category;});
  if(carousels.apps){carousels.apps.track.scrollLeft=0;requestAnimationFrame(carousels.apps.sync);}
}));
const nav=[...document.querySelectorAll(".av-subnav a[href^='#']")];
nav.forEach(link=>link.addEventListener("click",()=>{
  nav.forEach(a=>{a.classList.remove("vcc-subheader-current");a.removeAttribute("aria-current");});
  link.classList.add("vcc-subheader-current");link.setAttribute("aria-current","location");
}));
/* El selector es extensible cuando haya fichas reales de más destinos. */
})();
