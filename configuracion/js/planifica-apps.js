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

  const search=document.querySelector("[data-av-activity-search]");
  const continent=document.querySelector("[data-av-continent]");
  const country=document.querySelector("[data-av-country]");
  const reset=document.querySelector("[data-av-reset]");
  const resultCount=document.querySelector("[data-av-result-count]");
  const empty=document.querySelector("[data-av-empty]");
  const activityCards=[...document.querySelectorAll("[data-av-activity]")];
  const moreWrap=document.querySelector("[data-av-more-wrap]");
  const moreButton=document.querySelector("[data-av-show-more]");
  const PAGE_SIZE=10;
  let visibleLimit=PAGE_SIZE;
  const applyFilters=()=>{
    const query=normalize(search?.value);
    const matching=activityCards.filter(card=>{
      const continentMatches=!continent||continent.value==="all"||card.dataset.continent===continent.value;
      const countryMatches=!country||country.value==="all"||card.dataset.country===country.value;
      const textMatches=!query||normalize(card.dataset.avSearch+" "+card.textContent).includes(query);
      return continentMatches&&countryMatches&&textMatches;
    });
    const subset=new Set(matching.slice(0,visibleLimit));
    activityCards.forEach(card=>{card.hidden=!subset.has(card);});
    if(resultCount)resultCount.textContent=matching.length+" "+(matching.length===1?"actividad":"actividades");
    if(empty)empty.hidden=matching.length>0;
    if(moreWrap)moreWrap.hidden=matching.length<=visibleLimit;
    if(moreButton){
      const left=Math.max(0,matching.length-visibleLimit);
      moreButton.setAttribute("aria-label","Mostrar "+Math.min(left,PAGE_SIZE)+" actividades más");
    }
  };
  moreButton?.addEventListener("click",()=>{
    visibleLimit+=PAGE_SIZE;
    applyFilters();
  });
  const normalize=value=>(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim();
  const updateActivities=()=>{
    visibleLimit=PAGE_SIZE;
    applyFilters();
  };
  [continent,country].forEach(select=>select?.addEventListener("change",updateActivities));
  search?.addEventListener("input",updateActivities);
  reset?.addEventListener("click",()=>{
    if(search)search.value="";
    if(continent)continent.value="all";
    if(country)country.value="all";
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
