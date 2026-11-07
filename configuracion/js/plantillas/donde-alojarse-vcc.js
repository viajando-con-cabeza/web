/* VCC · Interacción accesible para la plantilla universal Dónde alojarse.
   Las tarjetas son HTML indexable; este script solo gestiona la navegación y el My Maps. */
(() => {
  'use strict';
  const root=document.querySelector('[data-dv-root]');
  if(!root) return;
  const scroller=root.querySelector('[data-dv-scroller]');
  const cards=Array.from(root.querySelectorAll('[data-dv-card]'));
  const prev=root.querySelector('[data-dv-prev]');
  const next=root.querySelector('[data-dv-next]');
  const counter=root.querySelector('[data-dv-counter]');
  const filters=Array.from(root.querySelectorAll('[data-dv-filter]'));
  if(scroller&&cards.length){
    const visibleCount=()=>{
      const w=scroller.clientWidth,cardWidth=cards[0].getBoundingClientRect().width;
      return Math.max(1,Math.min(cards.length,Math.floor((w+8)/(cardWidth+8))));
    };
    let pending=false;
    const sync=()=>{
      pending=false;
      const current=cards.reduce((best,card,index)=>{
        const d=Math.abs(card.offsetLeft - scroller.offsetLeft - scroller.scrollLeft);
        return d<best.d?{i:index,d}:best;
      },{i:0,d:Infinity}).i;
      const n=visibleCount();
      const first=Math.max(0,Math.min(current,cards.length-n));
      if(counter) counter.textContent=(first+1)+'–'+Math.min(cards.length,first+n)+' de '+cards.length;
      if(prev) prev.disabled=scroller.scrollLeft<5;
      if(next) next.disabled=scroller.scrollLeft+scroller.clientWidth>=scroller.scrollWidth-5;
    };
    const requestSync=()=>{if(!pending){pending=true;requestAnimationFrame(sync);}};
    const jump=(delta)=>{
      const width=cards[0].getBoundingClientRect().width;
      const gap=parseFloat(getComputedStyle(scroller).columnGap)||14;
      scroller.scrollBy({left:delta*(width+gap),behavior:'smooth'});
      setTimeout(sync,420);
    };
    prev?.addEventListener('click',()=>jump(-1));
    next?.addEventListener('click',()=>jump(1));
    scroller.addEventListener('scroll',requestSync,{passive:true});
    window.addEventListener('resize',requestSync,{passive:true});
    filters.forEach(button=>button.addEventListener('click',()=>{
      const key=button.dataset.dvFilter;
      const match=cards.find(c=>c.dataset.dvCard===key);
      if(!match)return;
      filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      scroller.scrollTo({left:match.offsetLeft-scroller.offsetLeft,behavior:'smooth'});
      match.setAttribute('tabindex','-1');
      match.focus({preventScroll:true});
      setTimeout(sync,420);
    }));
    requestAnimationFrame(sync);
  }
  const map=root.querySelector('[data-dv-map]');
  const mapLink=root.querySelector('[data-dv-map-link]');
  if(map){
    const mid=(map.dataset.mymapsId||'').trim();
    /* Only use an exact Google My Maps ID, never an itinerary map by mistake. */
    if(/^[A-Za-z0-9_-]{10,}$/.test(mid)){
      map.src='https://www.google.com/maps/d/embed?mid='+encodeURIComponent(mid);
      if(mapLink)mapLink.href='https://www.google.com/maps/d/viewer?mid='+encodeURIComponent(mid);
    }else{
      map.src='https://www.google.com/maps?q=Stockholm%2C%20Sweden&output=embed';
      if(mapLink)mapLink.href='https://www.google.com/maps/search/?api=1&query=Stockholm%2C%20Sweden';
    }
  }
})();