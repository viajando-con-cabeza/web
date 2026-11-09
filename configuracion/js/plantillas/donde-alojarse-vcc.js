/* VCC · Interacción accesible para la plantilla universal Dónde alojarse.
   Las tarjetas son HTML indexable; este script solo gestiona la navegación y el My Maps. */
(() => {
  'use strict';
  const root=document.querySelector('[data-dv-root]');
  if(!root) return;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    let pending=false;
    const sync=()=>{
      pending=false;
      if(prev) prev.disabled=scroller.scrollLeft<5;
      if(next) next.disabled=scroller.scrollLeft+scroller.clientWidth>=scroller.scrollWidth-5;
    };
    const requestSync=()=>{if(!pending){pending=true;requestAnimationFrame(sync);}};
    const jump=(delta)=>{
      const width=cards[0].getBoundingClientRect().width;
      const gap=parseFloat(getComputedStyle(scroller).columnGap)||14;
      scroller.scrollBy({left:delta*(width+gap),behavior:reducedMotion?'auto':'smooth'});
      setTimeout(sync,420);
    };
    prev?.addEventListener('click',()=>jump(-1));
    next?.addEventListener('click',()=>jump(1));
    scroller.addEventListener('scroll',requestSync,{passive:true});
    window.addEventListener('resize',requestSync,{passive:true});
    requestAnimationFrame(sync);
  }


  // Al pulsar un barrio, mostrar exclusivamente su ficha ampliada bajo el carrusel.
  // Los siete paneles son HTML estático para que los buscadores puedan leer su contenido.
  const zoneDetails=root.querySelector('[data-dv-zone-details]');
  const zonePanels=Array.from(root.querySelectorAll('[data-dv-zone-panel]'));
  if(zoneDetails&&zonePanels.length===cards.length){
    let activeZone=null;
    const showZone=(id)=>{
      const nextId=activeZone===id?null:id;
      activeZone=nextId;
      zoneDetails.hidden=!nextId;
      zonePanels.forEach(panel=>{
        panel.hidden=panel.dataset.dvZonePanel!==nextId;
      });
      cards.forEach(card=>{
        card.setAttribute('aria-expanded',String(card.dataset.dvCard===nextId));
      });
      if(nextId){
        requestAnimationFrame(()=>{
          const rect=zoneDetails.getBoundingClientRect();
          if(rect.top>window.innerHeight-110){
            zoneDetails.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'nearest'});
          }
        });
      }
    };
    cards.forEach(card=>{
      const id=card.dataset.dvCard;
      const panel=zonePanels.find(el=>el.dataset.dvZonePanel===id);
      if(!panel)return;
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-controls',panel.id);
      card.setAttribute('aria-expanded','false');
      let pointerStart=null;
      card.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});
      card.addEventListener('pointercancel',()=>{pointerStart=null;});
      card.addEventListener('click',e=>{
        if(pointerStart){
          const moved=Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>10;
          pointerStart=null;
          if(moved)return; // No abrir tras arrastrar el carrusel.
        }
        showZone(id);
      });
      card.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){
          e.preventDefault();
          showZone(id);
        }
      });
    });
    zoneDetails.querySelectorAll('[data-dv-zone-close]').forEach(button=>{
      button.addEventListener('click',()=>{
        const id=activeZone;
        showZone(id);
        const matching=cards.find(card=>card.dataset.dvCard===id);
        matching?.focus({preventScroll:true});
      });
    });
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
      tipsScroller.scrollBy({left:direction*(cardWidth+gap),behavior:reducedMotion?'auto':'smooth'});
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
    const destination=/^[A-Za-z0-9_-]{10,}$/.test(mid)
      ? 'https://www.google.com/maps/d/embed?mid='+encodeURIComponent(mid)
      : 'https://www.google.com/maps?q=Stockholm%2C%20Sweden&output=embed';
    // No volver a cargar el iframe si ya contiene el My Maps correcto.
    if(map.getAttribute('src')!==destination) map.src=destination;
  }
})();