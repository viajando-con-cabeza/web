/* VCC · Seguros · carruseles nativos, sin dependencias. */
(() => {
"use strict";
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll("[data-sv-track]").forEach(track => {
 const id=track.dataset.svTrack;
 const prev=document.querySelector('[data-sv-prev="'+id+'"]');
 const next=document.querySelector('[data-sv-next="'+id+'"]');
 if(!prev||!next)return;
 const max=()=>Math.max(0,track.scrollWidth-track.clientWidth);
 const step=(direction)=>{
   const card=track.querySelector(".sv-card");
   const gap=parseFloat(getComputedStyle(track).columnGap)||0;
   const distance=card?card.getBoundingClientRect().width+gap:track.clientWidth;
   const target=Math.min(max(),Math.max(0,track.scrollLeft+direction*distance));
   track.scrollTo({left:target,behavior:reduced?"auto":"smooth"});
 };
 let scheduled=false;
 const sync=()=>{
   scheduled=false;
   prev.disabled=track.scrollLeft<3;
   next.disabled=track.scrollLeft>max()-3;
 };
 prev.addEventListener("click",()=>step(-1));
 next.addEventListener("click",()=>step(1));
 track.addEventListener("keydown",event=>{
   if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
   event.preventDefault();step(event.key==="ArrowRight"?1:-1);
 });
 track.addEventListener("scroll",()=>{
  if(scheduled)return;scheduled=true;requestAnimationFrame(sync);
 },{passive:true});
 window.addEventListener("resize",sync,{passive:true});sync();
});
const tabs=[...document.querySelectorAll(".sv-tabs a[href^='#']")];
tabs.forEach(link=>link.addEventListener("click",()=>{
 tabs.forEach(el=>{el.removeAttribute("aria-current");el.classList.remove("vcc-subheader-current")});
 link.setAttribute("aria-current","location");link.classList.add("vcc-subheader-current");
}));
})();