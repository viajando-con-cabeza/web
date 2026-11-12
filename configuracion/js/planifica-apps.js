/* VCC · Apps de viaje. Carruseles accesibles y filtros reales, sin dependencias. */
(()=>{
  "use strict";
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const carousels=new Map();

  document.querySelectorAll("[data-av-track]").forEach(track=>{
    const id=track.dataset.avTrack;
    const prev=document.querySelector('[data-av-prev="'+id+'"]');
    const next=document.querySelector('[data-av-next="'+id+'"]');
    if(!prev||!next)return;
    const max=()=>Math.max(0,track.scrollWidth-track.clientWidth);
    const sync=()=>{
      prev.disabled=track.scrollLeft<=2;
      next.disabled=track.scrollLeft>=max()-2;
    };
    const move=direction=>{
      const first=[...track.children].find(card=>!card.hidden);
      if(!first)return;
      const gap=parseFloat(getComputedStyle(track).columnGap)||0;
      const step=first.getBoundingClientRect().width+gap;
      const target=Math.max(0,Math.min(max(),track.scrollLeft+direction*step));
      track.scrollTo({left:target,behavior:reduced?"auto":"smooth"});
    };
    prev.addEventListener("click",()=>move(-1));
    next.addEventListener("click",()=>move(1));
    track.addEventListener("keydown",event=>{
      if(event.key!=="ArrowRight"&&event.key!=="ArrowLeft")return;
      event.preventDefault();
      move(event.key==="ArrowRight"?1:-1);
    });
    let pending=false;
    track.addEventListener("scroll",()=>{
      if(pending)return;
      pending=true;
      requestAnimationFrame(()=>{pending=false;sync();});
    },{passive:true});
    window.addEventListener("resize",sync,{passive:true});
    carousels.set(id,{track,sync});
    sync();
  });

  const categoryButtons=[...document.querySelectorAll("[data-av-category]")];
  const appCards=[...document.querySelectorAll("[data-av-app]")];
  categoryButtons.forEach(button=>button.addEventListener("click",()=>{
    const category=button.dataset.avCategory;
    categoryButtons.forEach(b=>{
      const active=b===button;
      b.classList.toggle("is-active",active);
      b.setAttribute("aria-pressed",String(active));
    });
    appCards.forEach(card=>{card.hidden=card.dataset.avApp!==category;});
    const carousel=carousels.get("apps");
    if(carousel){
      carousel.track.scrollLeft=0;
      requestAnimationFrame(carousel.sync);
    }
  }));

  const search=document.querySelector("[data-av-activity-search]");
  const continent=document.querySelector("[data-av-continent]");
  const destination=document.querySelector("[data-av-destination]");
  const reset=document.querySelector("[data-av-reset]");
  const resultCount=document.querySelector("[data-av-result-count]");
  const empty=document.querySelector("[data-av-empty]");
  const activityCards=[...document.querySelectorAll("[data-av-activity]")];
  const normalize=value=>(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim();
  const updateActivities=()=>{
    const query=normalize(search?.value);
    let visible=0;
    activityCards.forEach(card=>{
      const continentMatches=!continent||continent.value==="all"||card.dataset.continent===continent.value;
      const destinationMatches=!destination||destination.value==="all"||card.dataset.destination===destination.value;
      const textMatches=!query||normalize(card.textContent).includes(query);
      card.hidden=!(continentMatches&&destinationMatches&&textMatches);
      if(!card.hidden)visible++;
    });
    if(resultCount)resultCount.textContent=visible+" "+(visible===1?"actividad":"actividades");
    if(empty)empty.hidden=visible>0;
    const activityCarousel=carousels.get("actividades");
    if(activityCarousel){
      activityCarousel.track.scrollLeft=0;
      requestAnimationFrame(activityCarousel.sync);
    }
  };
  [continent,destination].forEach(select=>select?.addEventListener("change",updateActivities));
  search?.addEventListener("input",updateActivities);
  reset?.addEventListener("click",()=>{
    if(search)search.value="";
    if(continent)continent.value="all";
    if(destination)destination.value="all";
    updateActivities();
    search?.focus();
  });
  updateActivities();

  const nav=[...document.querySelectorAll(".av-subnav a[href^='#']")];
  nav.forEach(link=>link.addEventListener("click",()=>{
    nav.forEach(a=>{a.classList.remove("vcc-subheader-current");a.removeAttribute("aria-current");});
    link.classList.add("vcc-subheader-current");
    link.setAttribute("aria-current","location");
  }));
})();
