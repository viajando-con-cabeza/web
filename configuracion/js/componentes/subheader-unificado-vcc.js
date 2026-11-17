/* VCC · Control común de subheaders, sin afectar al menú principal. */
(() => {
  'use strict';
  const NAVS='nav.st-tabs,nav.vcc-nav,nav.place-nav-wrap,nav.country-nav,nav.mv-subnav,nav.dv-subnav,nav.ep-subnav,nav.ql-subnav,nav.ci-subnav,nav.content-nav,nav.rich-tabs,nav.cl-subnav,nav.cl-subheader,nav.av-subnav,nav.sv-tabs,nav.di-subnav,nav.tv-tabs,nav.vcc-unified-subheader';
  const HEROS='.st-hero,.country-hero,.imp-hero,.vcc-hero,.mv-hero,.dv-hero,.ep-hero,.ql-hero,.ci-hero,.budget-hero,.content-hero,.rich-hero,.tv-hero,.al-hero,.cl-landing-hero,.vcc-planifica-hero,.av-hero,.sv-hero,.di-hero,.vl-hero,.swb-hero';
  /* La font de veritat visual és portades-contracte-unic-vcc.css.
   * No tocar les 6 portades principals ni les dues guies amb targeta central.
   * Per a la resta, qualsevol hero editorial reutilitza alçada/marges/fade. */
  const pathname=location.pathname.replace(/\/index\.html$/i,'/').replace(/\/$/,'')||'/';
  const excluded=new Set(['/','/destinos','/planifica','/itinerarios',
    '/nosotros','/contacto','/destinos/suecia','/destinos/suecia/estocolmo']);
  const eligible=!excluded.has(pathname);
  const HERO_CONTRACT='.vcc-guide-hero-unified,.vcc-planifica-hero,.rich-hero';
  const markHero=(hero)=>{
    if(!eligible||!hero||hero.matches('.country-hero,.st-hero'))return;
    if(hero.matches(HERO_CONTRACT))hero.classList.add('vcc-sacred-hero');
  };
  const managed=new Set();
  const pending=new WeakMap();
  const headerTop=()=>{
    const h=document.querySelector('body > .shared-header, body > .page-header, .shared-header, .page-header');
    if(!h)return 0;
    const p=getComputedStyle(h).position;
    return p==='fixed'||p==='sticky'?Math.round(h.getBoundingClientRect().height):0;
  };
  let lastHeaderHeight=-1,lastStickyTop=-1;
  const setTop=()=>{
    const h=document.querySelector('body > .shared-header, body > .page-header, .shared-header, .page-header');
    // Agrupar totes les lectures ANTES de modificar variables CSS:
    // evitar read -> write -> getBoundingClientRect (reflow forçat).
    const rawHeight=h?h.getBoundingClientRect().height:0;
    const position=h?getComputedStyle(h).position:'static';
    const height=Math.ceil(rawHeight);
    const top=position==='fixed'||position==='sticky'?Math.round(rawHeight):0;
    if(height!==lastHeaderHeight){
      document.documentElement.style.setProperty('--vcc-page-header-height',height+'px');
      lastHeaderHeight=height;
    }
    if(top!==lastStickyTop){
      document.documentElement.style.setProperty('--vcc-subheader-top',top+'px');
      lastStickyTop=top;
    }
  };
  const linkTarget=(a)=>{
    const href=a.getAttribute('href')||'';
    if(!href.startsWith('#')||href.length<2)return null;
    try{return document.getElementById(decodeURIComponent(href.slice(1)))}
    catch(e){return null}
  };
  const itemsOf=(nav)=>Array.from(nav.querySelectorAll('a[href^="#"]'))
    .map(a=>({a,target:linkTarget(a)})).filter(x=>x.target&&getComputedStyle(x.a).display!=='none');
  /* VCC · Arribada única de totes les àncores editorials.
   * El primer element visible és el SOBRETÍTOL (o la capçalera, quan no n'hi
   * ha). Això evita mostrar els padding interns diferents de cada plantilla. */
  const OVERLINES='.vcc-editorial-overline,.sv-over,.vl-kicker,.tv-eyebrow,.av-over,.ep4-script,.dv-section-script,.swb-overline,.mv-overline,.al-eyebrow,.ql-kicker,.ci-over,.ep-over,.budget-script,.philosophy-script,.eyebrow,.kicker,.section-script,.country-script,.st-script,.st-half-heading p,.country-heading > div > p,.budget-visual-heading p:first-child,.vcc-faq-kicker,.philosophy-poster-title > p:first-child,.rich-heading small,.day-copy > small,.hand';
  const HEADING_ROOTS='.vcc-editorial-heading,.dv-section-title,.swb-heading,.swmove-head,.mv-section-head,.al-heading,.country-heading,.st-heading,.section-header,.section-head,.sv-heading,.av-heading,.vl-section-head,.tv-errors-head,.ep4-heading,.place-heading,.rich-heading,.day-copy,.budget-visual-heading,.vcc-faq-top,.philosophy-poster-title';
  const visibleAnchor=(el)=>!!(el&&el.isConnected&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
  const editorialOverline=(target)=>{
    if(visibleAnchor(target)&&target.matches(OVERLINES))return target;
    // Si l'àncora és a un header, no agafar un altre subtítol més avall.
    const root=target.matches(HEADING_ROOTS)?target:target.querySelector(HEADING_ROOTS);
    const candidate=(root?.querySelector(OVERLINES)||target.querySelector(OVERLINES));
    if(visibleAnchor(candidate))return candidate;
    // Els 16 imprescindibles fan servir el número i el títol primer:
    // no saltar a la descripció inferior de cada lloc.
    const heading=(root&&visibleAnchor(root)?root:target.querySelector('.place-heading,header,h2,h3'));
    if(visibleAnchor(heading))return heading;
    return visibleAnchor(target)?target:null;
  };
  const scrollToOverline=(nav,target,behavior='smooth')=>{
    const anchor=editorialOverline(target);
    if(!anchor)return false;
    setTop();
    const navPosition=getComputedStyle(nav).position;
    const navHeight=navPosition==='sticky'||navPosition==='fixed'
      ?Math.ceil(nav.getBoundingClientRect().height):0;
    // 8px, no 24px: sobretítol visible just sota les dues barres fixes.
    const top=window.scrollY+anchor.getBoundingClientRect().top-headerTop()-navHeight-8;
    window.scrollTo({top:Math.max(0,Math.round(top)),behavior});
    return true;
  };
  /* Només seccions principals ancorades, no els elements interns del
   * carrusel ni els contenidors de calculadores, galeries o fitxes.
   * Els diversos punts d'una mateixa secció comparteixen una sola caixa. */
  const markSectionSpacing=(nav)=>{
    const items=itemsOf(nav);
    const roots=new Map();
    for(const item of items){
      const target=item.target;
      target.setAttribute('data-vcc-subheader-target','');
      const root=target.matches('section,article')?target:target.closest('section,article');
      if(!root||!root.closest('main')||!root.parentElement)continue;
      if(!root.parentElement.matches('main,.content-shell,.country-main,.st-main,.swb-main,.dv-main,.ci-main,.mv-container,.ql-main,.budget-main,.ep4-main,.vcc-shell,.rich-shell'))continue;
      roots.set(root,(roots.get(root)||0)+1);
    }
    for(const [root] of roots)root.classList.add('vcc-subheader-section');
  };
  const alignHashOverline=()=>{
    if(!location.hash)return;
    let id;
    try{id=decodeURIComponent(location.hash.slice(1))}catch(_){return}
    for(const nav of managed){
      if(!nav.isConnected)continue;
      const item=itemsOf(nav).find(x=>x.target.id===id);
      if(item&&scrollToOverline(nav,item.target,'auto')){paint(nav,item);break}
    }
  };
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
      const line=headerTop()+nav.getBoundingClientRect().height+56;
      let chosen=items[0];
      for(const item of items){
        if(item.target.getBoundingClientRect().top<=line)chosen=item;
      }
      // Respecta l'àncora de l'URL quan és prop de la barra.
      // El marge inclou el padding i els títols de les seccions.
      const rawHash=window.location.hash.slice(1);
      if(rawHash){
        let id=rawHash;
        try{id=decodeURIComponent(rawHash)}catch(_){}
        const anchored=items.find(item=>item.target.id===id);
        if(anchored){
          const top=anchored.target.getBoundingClientRect().top;
          if(top>=line-90&&top<=line+120)chosen=anchored;
        }
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
  // Cómo llegar incluye cinco tarjetas de transporte dentro de la portada.
  // En móvil pasan justo después de la barra para que ambas sean accesibles;
  // al volver al escritorio recuperan su posición original, sin duplicados.
  // Mantener la altura sagrada de portada: las tarjetas son contenido y
  // se muestran debajo del subheader, nunca recortadas dentro del hero.
  const relocateTransportCards=(nav,hero)=>{
    if(!nav.classList.contains('vcc-como-llegar-subnav')||!hero?.classList.contains('cl-landing-hero'))return;
    const stage=hero.querySelector('.cl-landing-stage');
    const cards=stage?.querySelector('.cl-landing-cards')||nav.nextElementSibling?.matches('.cl-landing-cards')&&nav.nextElementSibling;
    if(!stage||!cards)return;
    const mq=window.matchMedia('(max-width:720px)');
    const place=()=>{
      if(hero.classList.contains('vcc-sacred-hero')){
        if(cards.previousElementSibling!==nav)nav.insertAdjacentElement('afterend',cards);
        cards.classList.add('vcc-cl-cards-below');
        cards.classList.toggle('vcc-cl-mobile-cards',mq.matches);
      }else if(mq.matches){
        if(cards.previousElementSibling!==nav)nav.insertAdjacentElement('afterend',cards);
        cards.classList.add('vcc-cl-mobile-cards');
      }else{
        if(cards.parentElement!==stage)stage.appendChild(cards);
        cards.classList.remove('vcc-cl-mobile-cards','vcc-cl-cards-below');
      }
    };
    place();
    mq.addEventListener?.('change',place);
  };
  // Les tres opcions de «¿No sabes dónde ir?» passen sota la barra només
  // al mòbil; conserva els botons i els seus listeners originals.
  const relocateDestinationChoices=(nav,hero)=>{
    if(!nav.classList.contains('di-subnav')||!hero?.classList.contains('di-hero'))return;
    const stage=hero.querySelector('.di-hero-inner');
    const choices=stage?.querySelector('.di-choices')||nav.nextElementSibling?.matches('.di-choices')&&nav.nextElementSibling;
    if(!stage||!choices)return;
    const mq=window.matchMedia('(max-width:720px)');
    const place=()=>{
      if(mq.matches){
        if(choices.previousElementSibling!==nav)nav.insertAdjacentElement('afterend',choices);
        choices.classList.add('vcc-di-choices-below');
      }else{
        if(choices.parentElement!==stage)stage.appendChild(choices);
        choices.classList.remove('vcc-di-choices-below');
      }
    };
    place();
    mq.addEventListener?.('change',place);
  };
  const setup=(nav)=>{
    // Un subheader pot ser fill directe de <main> (p. ex. Alojamientos i
    // Dónde ir). Rebutgem només navegacions internes sense un hero germà.
    let preceding=nav.previousElementSibling;
    for(let i=0;i<3&&preceding&&preceding.matches('.country-nav-spacer,.ci-subnav-placeholder,.it-nav-placeholder');i++)
      preceding=preceding.previousElementSibling;
    if(nav.closest('main')&&!nav.classList.contains('vcc-unified-subheader')&&
       !(preceding&&preceding.matches(HEROS)))return;
    if(managed.has(nav))return;
    managed.add(nav);
    nav.classList.add('vcc-unified-subheader');
    if(eligible)nav.classList.add('vcc-sacred-subnav');
    if(nav.querySelector('.vcc-nav-inner,.ql-subnav-inner,.country-nav-inner'))
      nav.classList.add('vcc-subnav-inner-layout');
    // Algunas plantillas insertan un espaciador de la barra fija entre hero y subheader.
    // Saltar únicamente esos espaciadores, sin asociar barras con contenidos ajenos.
    const before=preceding;
    if(before&&before.matches(HEROS)){
      markHero(before);
      // Totes les portades de país o ciutat amb requadre editorial queden
      // fora de les altures interiors, encara que siguin guies en proves.
      if(!before.matches('.country-hero,.st-hero')){
        before.classList.add('vcc-subheader-hero','vcc-standardized-hero-height');
      }
      relocateTransportCards(nav,before);
      relocateDestinationChoices(nav,before);
    }
    markSectionSpacing(nav);
    {
      nav.addEventListener('click',(event)=>{
        const a=event.target.closest('a[href^="#"]');
        if(!a||!nav.contains(a))return;
        const target=linkTarget(a);
        if(target){
          // Les navegacions editorials comparteixen el mateix punt d'arribada;
          // la resta de menús conserva els seus listeners/àncores originals.
          if(nav.classList.contains('vcc-unified-subheader')&&
             event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&
             editorialOverline(target)){
            event.preventDefault();
            // Evitar que controladors antics facin un segon scroll a l'inici
            // de la secció i anul·lin l'alineament del sobretítol.
            if(!nav.classList.contains('place-nav-wrap'))event.stopImmediatePropagation();
            if(location.hash!==a.hash)history.pushState(null,'',a.hash);
            scrollToOverline(nav,target);
          }
          pending.set(nav,{a,target,until:performance.now()+1200});
          paint(nav,{a,target});
        }
        schedule();
      },true);
    }
  };
  const scan=()=>{
    document.querySelectorAll(NAVS).forEach(setup);
    for(const nav of managed){
      if(!nav.isConnected)continue;
      markSectionSpacing(nav);
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
    window.addEventListener('hashchange',()=>{alignHashOverline();schedule()});
    window.addEventListener('popstate',()=>{alignHashOverline();schedule()});
    window.addEventListener('load',()=>{scan();requestAnimationFrame(alignHashOverline)},{once:true});
    if(document.readyState==='complete')requestAnimationFrame(alignHashOverline);
    if(document.fonts?.ready)document.fonts.ready.then(()=>{alignHashOverline();schedule()}).catch(()=>{});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();