/* VCC · Control común de subheaders, sin afectar al menú principal. */
(() => {
  'use strict';
  const NAVS='nav.st-tabs,nav.vcc-nav,nav.place-nav-wrap,nav.country-nav,nav.mv-subnav,nav.dv-subnav,nav.ep-subnav,nav.ql-subnav,nav.ci-subnav,nav.content-nav,nav.rich-tabs,nav.cl-subnav,nav.tv-tabs';
  const HEROS='.st-hero,.country-hero,.imp-hero,.vcc-hero,.mv-hero,.dv-hero,.ep-hero,.ql-hero,.ci-hero,.budget-hero,.content-hero,.rich-hero,.tv-hero';
  const managed=new Set();
  const pending=new WeakMap();
  const headerTop=()=>{
    const h=document.querySelector('body > .shared-header, body > .page-header, .shared-header, .page-header');
    if(!h)return 0;
    const p=getComputedStyle(h).position;
    return p==='fixed'||p==='sticky'?Math.round(h.getBoundingClientRect().height):0;
  };
  const setTop=()=>document.documentElement.style.setProperty('--vcc-subheader-top',headerTop()+'px');
  const linkTarget=(a)=>{
    const href=a.getAttribute('href')||'';
    if(!href.startsWith('#')||href.length<2)return null;
    try{return document.getElementById(decodeURIComponent(href.slice(1)))}
    catch(e){return null}
  };
  const itemsOf=(nav)=>Array.from(nav.querySelectorAll('a[href^="#"]'))
    .map(a=>({a,target:linkTarget(a)})).filter(x=>x.target&&getComputedStyle(x.a).display!=='none');
  let raf=0;
  const paint=(nav,chosen)=>{
    if(!chosen)return;
    for(const a of nav.querySelectorAll('a[href^="#"]')){
      const on=a===chosen.a;
      a.classList.toggle('vcc-subheader-current',on);
      if(on)a.setAttribute('aria-current','location');
      else if(a.getAttribute('aria-current')==='location')a.removeAttribute('aria-current');
    }
  };
  const sync=()=>{
    raf=0;setTop();
    for(const nav of managed){
      if(!nav.isConnected){managed.delete(nav);continue}
      if(nav.classList.contains('place-nav-wrap'))continue; // Su propio índice gestiona lugares.
      const items=itemsOf(nav);if(!items.length)continue;
      const line=headerTop()+nav.getBoundingClientRect().height+25;
      let chosen=items[0];
      for(const item of items){
        if(item.target.getBoundingClientRect().top<=line)chosen=item;
      }
      const click=pending.get(nav);
      if(click){
        const settled=Math.abs(click.target.getBoundingClientRect().top-line)<40;
        if(performance.now()<click.until&&!settled)chosen={a:click.a,target:click.target};
        else pending.delete(nav);
      }
      paint(nav,chosen);
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync)};
  const setup=(nav)=>{
    if(managed.has(nav))return;
    managed.add(nav);
    nav.classList.add('vcc-unified-subheader');
    if(nav.querySelector('.vcc-nav-inner,.ql-subnav-inner,.country-nav-inner'))
      nav.classList.add('vcc-subnav-inner-layout');
    // Algunas plantillas insertan un espaciador de la barra fija entre hero y subheader.
    // Saltar únicamente esos espaciadores, sin asociar barras con contenidos ajenos.
    let before=nav.previousElementSibling;
    for(let i=0;i<3&&before&&before.matches('.country-nav-spacer,.ci-subnav-placeholder,.it-nav-placeholder');i++){
      before=before.previousElementSibling;
    }
    if(before&&before.matches(HEROS)){
      before.classList.add('vcc-subheader-hero','vcc-standardized-hero-height');
    }
    for(const item of itemsOf(nav))item.target.setAttribute('data-vcc-subheader-target','');
    if(!nav.classList.contains('place-nav-wrap')){
      nav.addEventListener('click',(event)=>{
        const a=event.target.closest('a[href^="#"]');
        if(!a||!nav.contains(a))return;
        const target=linkTarget(a);
        if(target){
          pending.set(nav,{a,target,until:performance.now()+1200});
          paint(nav,{a,target});
        }
        schedule();
      });
    }
  };
  const scan=()=>{
    document.querySelectorAll(NAVS).forEach(setup);
    for(const nav of managed){
      if(!nav.isConnected)continue;
      for(const item of itemsOf(nav))item.target.setAttribute('data-vcc-subheader-target','');
    }
    schedule();
  };
  const start=()=>{
    setTop();scan();
    let scanFrame=0;
    new MutationObserver((mutations)=>{
      if(!mutations.some(m=>m.addedNodes.length||m.removedNodes.length))return;
      if(scanFrame)return;
      scanFrame=requestAnimationFrame(()=>{scanFrame=0;scan()});
    }).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',()=>{setTop();schedule()},{passive:true});
    window.addEventListener('hashchange',schedule);
    window.addEventListener('load',scan,{once:true});
    if(document.fonts?.ready)document.fonts.ready.then(schedule).catch(()=>{});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();