/* VCC · Dónde dormir en Suecia / por región.
   Carrusel accesible: cuatro tarjetas en escritorio, dos en tablet,
   una principal en móvil; flechas, teclado y gesto táctil nativo. */
(()=>{
  "use strict";
  const track=document.getElementById("dvRegionTrack");
  const prev=document.getElementById("dvRegionPrev");
  const next=document.getElementById("dvRegionNext");
  if(!track||!prev||!next)return;
  const cards=[...track.querySelectorAll(".dv-region-card")];
  if(!cards.length)return;
  const reducedMotion=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const step=()=>cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:cards[0].getBoundingClientRect().width;
  const sync=()=>{
    const end=Math.max(0,track.scrollWidth-track.clientWidth);
    prev.disabled=track.scrollLeft<=2;
    next.disabled=track.scrollLeft>=end-2;
  };
  const move=direction=>{
    const width=step();
    if(width<=0)return;
    const end=Math.max(0,track.scrollWidth-track.clientWidth);
    const left=Math.max(0,Math.min(end,(Math.round(track.scrollLeft/width)+direction)*width));
    track.scrollTo({left,behavior:reducedMotion()?"auto":"smooth"});
  };
  prev.addEventListener("click",()=>move(-1));
  next.addEventListener("click",()=>move(1));
  track.addEventListener("scroll",sync,{passive:true});
  track.addEventListener("keydown",event=>{
    if(event.target!==track)return;
    if(event.key==="ArrowLeft"||event.key==="ArrowRight"){
      event.preventDefault();
      move(event.key==="ArrowRight"?1:-1);
    }
  });
  window.addEventListener("resize",sync,{passive:true});
  sync();
})();
