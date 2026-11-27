/* VCC: Ocultar flechas sin desplazamiento disponible.
   Solo carruseles de scroll nativo; no modifica los de transición por índice. */
(function(){
"use strict";
if(window.__vccOverflowArrows)return;
window.__vccOverflowArrows=true;
const roots=".vcc-budget-mode-carousel,.carousel-shell,.al-carousel,.al-tips-carousel,.tv-carousel-shell,.mv-transport-shell,.mv-carousel-shell,.vl-tips-carousel,.vl-air-carousel,.vcc-route-carousel,.vcc-saving-carousel,.dv-carousel-wrap,.dv-tip-carousel-wrap,.ci-tips-shell,.ep3-saving-stage,.ep4-our-stage,.ql-advice-carousel-sides";
const bound=new WeakSet();
function init(root){
 if(bound.has(root))return;
 const buttons=[...root.children].filter(el=>el.tagName==="BUTTON");
 const matches=(btn,prev)=>{
  const name=[btn.className,btn.id,btn.getAttribute("aria-label"),btn.dataset.budgetScroll].join(" ").toLowerCase();
  return prev ? /(?:^|[ _-])(prev|previous|left|anterior|izquierda)(?:$|[ _-])/.test(name)||btn.dataset.budgetScroll==="-1"
    : /(?:^|[ _-])(next|right|siguiente|derecha)(?:$|[ _-])/.test(name)||btn.dataset.budgetScroll==="1";
 };
 const prev=buttons.find(b=>matches(b,true)),next=buttons.find(b=>matches(b,false));
 if(!prev||!next)return;
 const special=root.classList.contains("vcc-budget-mode-carousel");
 const track=special?root.querySelector(":scope > .vcc-budget-mode-track"):
   [...root.children].find(el=>el!==prev&&el!==next&&["auto","scroll"].includes(getComputedStyle(el).overflowX));
 if(!track)return;
 bound.add(root);
 let scheduled=false;
 const update=()=>{
  scheduled=false;
  if(!track.clientWidth)return;
  const max=Math.max(0,track.scrollWidth-track.clientWidth),at=Math.max(0,Math.min(max,track.scrollLeft));
  const travel=max>4;
  prev.toggleAttribute("data-vcc-scroll-hidden",!travel||at<=3);
  next.toggleAttribute("data-vcc-scroll-hidden",!travel||at>=max-3);
 };
 const refresh=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
 track.addEventListener("scroll",refresh,{passive:true});
 if(typeof ResizeObserver==="function"){
  const ro=new ResizeObserver(refresh);
  [root,track,track.firstElementChild,track.lastElementChild].filter(Boolean).forEach(el=>ro.observe(el));
 }
 new MutationObserver(refresh).observe(track,{childList:true});
 window.addEventListener("resize",refresh,{passive:true});
 refresh();
}
const scan=()=>document.querySelectorAll(roots).forEach(init);
const observe=()=>new MutationObserver(records=>{
 if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.(roots)||n.querySelector?.(roots)))))scan();
}).observe(document.body,{childList:true,subtree:true});
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",()=>{scan();observe();},{once:true});}
else{scan();observe();}
window.addEventListener("load",scan,{once:true});
})();
