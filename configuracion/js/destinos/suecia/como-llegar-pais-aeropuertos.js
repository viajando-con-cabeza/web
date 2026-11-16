/* VCC · Flechas del carrusel de aeropuertos de Suecia.
   El CSS compartido de Nuestra experiencia gestiona geometría / responsive. */
(()=>{
  'use strict';
  const track=document.getElementById('swAirportTrack');
  const prev=document.getElementById('swAirportPrev');
  const next=document.getElementById('swAirportNext');
  if(!track||!prev||!next)return;
  const cards=[...track.querySelectorAll('.vcc-airport-card')];
  const getStep=()=>{
    if(cards.length>1)return cards[1].offsetLeft-cards[0].offsetLeft;
    return cards[0]?.getBoundingClientRect().width||0;
  };
  const sync=()=>{
    const end=Math.max(0,track.scrollWidth-track.clientWidth);
    prev.disabled=track.scrollLeft<=2;
    next.disabled=track.scrollLeft>=end-2;
  };
  const move=direction=>{
    const step=getStep();
    if(!step)return;
    const end=Math.max(0,track.scrollWidth-track.clientWidth);
    const left=Math.max(0,Math.min(end,(Math.round(track.scrollLeft/step)+direction)*step));
    track.scrollTo({left,behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  };
  prev.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));
  track.addEventListener('scroll',sync,{passive:true});
  track.addEventListener('keydown',event=>{
    if(event.target===track&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){
      event.preventDefault();move(event.key==='ArrowRight'?1:-1);
    }
  });
  window.addEventListener('resize',sync,{passive:true});
  requestAnimationFrame(sync);
})();
