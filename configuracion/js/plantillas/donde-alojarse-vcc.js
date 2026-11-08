/* VCC · Interacción accesible para la plantilla universal Dónde alojarse.
   Las tarjetas son HTML indexable; este script solo gestiona la navegación y el My Maps. */
(() => {
  'use strict';
  const root=document.querySelector('[data-dv-root]');
  if(!root) return;
  // Si GitHub Raw falla temporalmente, usar el mismo WebP del despliegue local.
  const heroImage=root.querySelector('.dv-hero-photo[data-local-fallback]');
  if(heroImage){
    const fallback=()=>{
      const local=heroImage.dataset.localFallback;
      if(local&&heroImage.getAttribute('src')!==local){
        heroImage.setAttribute('src',local);
      }
    };
    heroImage.addEventListener('error',fallback,{once:true});
    if(heroImage.complete&&!heroImage.naturalWidth)fallback();
  }
  const scroller=root.querySelector('[data-dv-scroller]');
  const cards=Array.from(root.querySelectorAll('[data-dv-card]'));
  const prev=root.querySelector('[data-dv-prev]');
  const next=root.querySelector('[data-dv-next]');
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
    requestAnimationFrame(sync);
  }

  // Carrusel reutilizable de vinyetes editorials, amb fletxes i lliscament tàctil.
  const tipsScroller=root.querySelector('[data-dv-tip-scroller]');
  const tipsPrev=root.querySelector('[data-dv-tip-prev]');
  const tipsNext=root.querySelector('[data-dv-tip-next]');
  if(tipsScroller){
    const tips=Array.from(tipsScroller.querySelectorAll('.dv-tip'));
    const syncTips=()=>{
      if(tipsPrev)tipsPrev.disabled=tipsScroller.scrollLeft<=3;
      if(tipsNext)tipsNext.disabled=tipsScroller.scrollLeft+tipsScroller.clientWidth>=tipsScroller.scrollWidth-3;
    };
    const moveTip=(direction)=>{
      if(!tips.length)return;
      const gap=parseFloat(getComputedStyle(tipsScroller).columnGap)||13;
      const cardWidth=tips[0].getBoundingClientRect().width;
      tipsScroller.scrollBy({left:direction*(cardWidth+gap),behavior:'smooth'});
    };
    tipsPrev?.addEventListener('click',()=>moveTip(-1));
    tipsNext?.addEventListener('click',()=>moveTip(1));
    tipsScroller.addEventListener('scroll',syncTips,{passive:true});
    window.addEventListener('resize',syncTips,{passive:true});
    syncTips();
  }

  // Resaltar la sección visible del subheader, con los mismos enlaces de ancla.
  const navLinks=[...root.querySelectorAll('.dv-subnav a[href^="#"]')];
  const sections=navLinks.map(a=>document.getElementById(a.getAttribute('href').slice(1)));
  if(navLinks.length&&sections.every(Boolean)){
    let pendingNav=false;
    const syncNav=()=>{
      pendingNav=false;
      const bar=root.querySelector('.dv-subnav');
      const threshold=(bar?.getBoundingClientRect().bottom||90)+35;
      let activeIndex=0;
      sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<=threshold)activeIndex=i});
      navLinks.forEach((link,i)=>{
        if(i===activeIndex)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    };
    const requestNav=()=>{if(!pendingNav){pendingNav=true;requestAnimationFrame(syncNav)}};
    window.addEventListener('scroll',requestNav,{passive:true});
    window.addEventListener('resize',requestNav,{passive:true});
    navLinks.forEach(a=>a.addEventListener('click',()=>{
      navLinks.forEach(n=>n.removeAttribute('aria-current'));
      a.setAttribute('aria-current','location');
    }));
    requestAnimationFrame(syncNav);
  }

  const map=root.querySelector('[data-dv-map]');
  if(map){
    const mid=(map.dataset.mymapsId||'').trim();
    /* Only use an exact Google My Maps ID, never an itinerary map by mistake. */
    if(/^[A-Za-z0-9_-]{10,}$/.test(mid)){
      map.src='https://www.google.com/maps/d/embed?mid='+encodeURIComponent(mid);
    }else{
      map.src='https://www.google.com/maps?q=Stockholm%2C%20Sweden&output=embed';
    }
  }
})();