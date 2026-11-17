(function () {
  // Component singleton: una segona inclusió no crea menús ni descarrega CSS duplicat.
  if(window.__VCC_SHARED_HEADER_STARTED__)return;
  window.__VCC_SHARED_HEADER_STARTED__=true;
  // Manté els carrusels sense scroll automàtic fins a la primera interacció.
  // Després, les transicions CSS originals tornen sense cap recàrrega.
  if(document.documentElement.classList.contains('vcc-lcp-scroll-stable')){
    const activateScroll=()=>document.documentElement.classList.remove('vcc-lcp-scroll-stable');
    for(const eventName of ['pointerdown','touchstart','wheel','keydown']){
      window.addEventListener(eventName,activateScroll,{once:true,capture:true,passive:true});
    }
  }

  const script = document.currentScript;
  const siteRoot = script ? new URL('../../', script.src) : new URL('./', window.location.href);
  const url = (path) => new URL(path, siteRoot).href;

  // Carregador únic dels recursos compartits: evita repetir el mateix
  // patró de creació en cada secció i manté el mateix ordre d'inserció.
  // Els selectors i URLs originals es preserven per no canviar la cascada.
  const ensureSharedResource=(kind,selector,path,marker)=>{
    if(document.querySelector(selector))return;
    const node=document.createElement(kind);
    if(kind==='link'){
      node.rel='stylesheet';
      node.href=url(path);
    }else{
      node.src=url(path);
      node.async=true;
    }
    if(marker)node.dataset[marker]='true';
    document.head.appendChild(node);
  };

  // Tokens, carrusels, subheader, breadcrumb i header en un sol CSS.
  ensureSharedResource('link',
    'link[data-vcc-core-styles], link[href*="/configuracion/css/componentes/vcc-core-compartit.css"]',
    'configuracion/css/componentes/vcc-core-compartit.css?v=20261117-breadcrumb-universal-v2','vccCoreStyles');

  // Related només es carrega en pàgines amb targetes relacionades.
  const mountRelatedSectionStyles=()=>{
    if(!document.querySelector('section:is(.related-section,.vcc-discover-section) .vcc-related-cards'))return;
    ensureSharedResource('link','link[data-vcc-related-unified]',
      'configuracion/css/componentes/sigue-descubriendo-vcc.css?v=20261116-compacte-global-v4','vccRelatedUnified');
  };
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mountRelatedSectionStyles,{once:true});
  }else{
    mountRelatedSectionStyles();
  }

  // Components reutilitzats a tot el web (mateixos fitxers i marcadors).
  ensureSharedResource('link','link[data-vcc-arrows-global]',
    'configuracion/css/componentes/vcc-fletxes-carrusels-global.css?v=20261115-error-grid-arrows-v5','vccArrowsGlobal');
  ensureSharedResource('link','link[data-vcc-disclosures-global]',
    'configuracion/css/componentes/desglose-compartit-vcc.css?v=20261115-exacte-v3','vccDisclosuresGlobal');
  ensureSharedResource('script','script[data-vcc-scroll-arrows]',
    'configuracion/js/componentes/vcc-carruseles-visibilidad.js?v=20261114-v1','vccScrollArrows');
  ensureSharedResource('link','link[data-vcc-discreet-actions]',
    'configuracion/css/componentes/enlaces-discretos-vcc.css?v=20261115-card-ctas-unificats-v4','vccDiscreetActions');
  ensureSharedResource('script','script[data-vcc-discreet-actions]',
    'configuracion/js/componentes/enlaces-discretos-vcc.js?v=20261114-card-ctas-verificats-v2','vccDiscreetActions');
  // Contracte interior: les pàgines publicades el carreguen al <head>,
  // abans de pintar, i no fan cap petició duplicada. Per a futures guies
  // mantenim un fallback només si REALMENT existeix un subheader editorial.
  const mountInteriorContractFallback=()=>{
    const route=location.pathname.replace(/\/index\.html$/i,'/').replace(/\/$/,'')||'/';
    const exception=new Set(['/','/destinos','/itinerarios','/planifica',
      '/nosotros','/contacto','/destinos/suecia','/destinos/suecia/estocolmo']);
    if(exception.has(route)||document.querySelector('link[data-vcc-sacred-covers]'))return;
    if(!document.querySelector('nav.st-tabs,nav.vcc-nav,nav.place-nav-wrap,nav.mv-subnav,nav.dv-subnav,nav.ep-subnav,nav.ql-subnav,nav.ci-subnav,nav.content-nav,nav.rich-tabs,nav.av-subnav,nav.sv-tabs,nav.di-subnav,nav.tv-tabs,nav.vcc-unified-subheader'))return;
    ensureSharedResource('link','link[data-vcc-sacred-covers]',
      'configuracion/css/componentes/portades-contracte-unic-vcc.css?v=20261116-sagrat-v2','vccSacredCovers');
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountInteriorContractFallback,{once:true});
  else mountInteriorContractFallback();
  ensureSharedResource('script','script[src*="subheader-unificado-vcc.js"]',
    'configuracion/js/componentes/subheader-unificado-vcc.js?v=20261117-sobretitol-anchor-v1');

  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');

  /* VCC · Breadcrumb universal de destinos. Un único DOM + un único CSS.
     Las plantillas antiguas conservan su miga invisible como espacio de
     reserva para evitar desplazar el hero; no existen dos rutas accesibles. */
  (function initGlobalBreadcrumb() {
    // Mantener el breadcrumb único también en Vuelos, sin alterar otras páginas de Planifica.
    const isSharedPlanificaPage = /^\/planifica\/(?:tarjetas-de-viaje|vuelos|donde-ir)\/?$/i.test(currentPath);
    if (!/^\/destinos\//i.test(currentPath) && !isSharedPlanificaPage) return;
    const labels = {
      suecia:'Suecia',italia:'Italia',francia:'Francia',espana:'España',
      alemania:'Alemania',austria:'Austria',andorra:'Andorra',suiza:'Suiza',
      estonia:'Estonia',letonia:'Letonia',lituania:'Lituania',
      indonesia:'Indonesia',malasia:'Malasia',singapur:'Singapur',
      mexico:'México',turquia:'Turquía',hungria:'Hungría',
      'reino-unido':'Reino Unido',eeuu:'Estados Unidos',
      'emiratos-arabes-unidos':'Emiratos Árabes Unidos',
      andalucia:'Andalucía',canarias:'Islas Canarias',navarra:'Navarra',
      'pais-vasco':'País Vasco','pais-vasco-frances':'País Vasco francés',
      estocolmo:'Estocolmo',roma:'Roma',paris:'París',madrid:'Madrid',
      almeria:'Almería',cadiz:'Cádiz',cordoba:'Córdoba',sevilla:'Sevilla',
      fuerteventura:'Fuerteventura','st-wolfgang':'St. Wolfgang',
      berchtesgaden:'Berchtesgaden',konigssee:'Königssee',
      hallstatt:'Hallstatt',innsbruck:'Innsbruck',salzburg:'Salzburgo',
      zurich:'Zúrich','que-ver':'Qué ver',imprescindibles:'Qué ver',
      itinerario:'Itinerario',presupuesto:'Presupuesto',
      'cuando-ir':'Cuándo ir','como-llegar':'Cómo llegar',
      'como-moverse':'Cómo moverse','que-llevar':'Qué llevar',
      'donde-dormir':'Dónde dormir','donde-comer':'Dónde comer',
      consejos:'Consejos','barrios-miradores':'Barrios y miradores',
      'islas-ferris':'Islas y ferris','museos':'Museos',
      'parques-naturaleza':'Parques y naturaleza',
      'arlanda-centro':'Arlanda (ARN)','bromma-centro':'Bromma (BMA)',
      'skavsta-centro':'Skavsta (NYO)',
      'stockholm-central-centro':'Stockholm Central',
      'trenes-a-estocolmo':'Trenes a Estocolmo',
      'terminales-ferry-centro':'Terminales de ferry',
      'ferry-baltico-estocolmo':'Ferry desde el Báltico',
      'cityterminalen-centro':'Cityterminalen',
      'autobuses-a-estocolmo':'Autobuses a Estocolmo',
      'aparcar-barato-estocolmo':'Dónde aparcar',
      'parking-disuasorio-estocolmo':'Parkings disuasorios',
      'alquilar-coche-estocolmo':'Alquilar coche',
      avion:'Avión',tren:'Tren',ferry:'Ferry',autobus:'Autobús',coche:'Coche',
      'ruta-andalucia-madrid':'Andalucía y Madrid',
      'dia-1':'Día 1','dia-2':'Día 2','dia-3':'Día 3',
      'tarjetas-de-viaje':'Tarjetas de viaje',vuelos:'Vuelos','donde-ir':'Dónde ir'
    };
    const heroSelector = [
      '.st-hero','.imp-hero','.vcc-hero','.budget-hero','.ci-hero',
      '.cl-landing-hero','.cl-hero','.mv-hero','.dv-hero','.ql-hero',
      '.country-hero','.content-hero','.rich-hero','.cm-hero',
      '.page-hero','.tv-hero','.di-hero','[data-vcc-hero]'
    ].join(',');
    const originalSelector = [
      '.st-crumb','.imp-crumb','.vcc-crumb','.budget-crumb','.ci-crumb',
      '.cl-crumb','.mv-crumb','.dv-breadcrumb','.ql-crumb',
      '.country-breadcrumb','.rich-crumb','.cm-crumb','.crumb',
      'nav[aria-label="Ruta de navegación"]'
    ].join(',');
    const displayName = (slug) => labels[slug] ||
      slug.replace(/-/g,' ').replace(/^./,c=>c.toLocaleUpperCase('es'));
    function render() {
      if (document.getElementById('vcc-global-breadcrumb')) return true;
      const path=decodeURIComponent(location.pathname).replace(/\/index\.html$/i,'/');
      const parts=path.split('/').filter(Boolean);
      if((parts[0]!=='destinos' && parts[0]!=='planifica')||parts.length<2)return false;
      let original=null,hero=null;
      for(const candidate of document.querySelectorAll(originalSelector)){
        if(candidate.id==='vcc-global-breadcrumb')continue;
        const root=candidate.closest(heroSelector);
        if(root){original=candidate;hero=root;break}
      }
      if(!hero) {
        // Países (country-page.js) crean su hero después de la cabecera.
        hero=document.querySelector(heroSelector);
      }
      if(!hero) return false;
      // Los enlaces se deducen de la URL, no de las distintas plantillas.
      const route=parts.slice(1);
      if(route[route.length-1]==='index.html')route.pop();
      if(!route.length)return false;
      const finalStrong=original?.querySelector('strong')?.textContent?.trim()||'';
      const nav=document.createElement('nav');
      nav.id='vcc-global-breadcrumb';
      nav.className='vcc-breadcrumb-unified';
      nav.setAttribute('aria-label','Ruta de navegación');
      const sectionRoot=parts[0];
      const crumbs=[{label:'Inicio',href:'/'},{label:sectionRoot==='planifica'?'Planifica':'Destinos',href:'/'+sectionRoot+'/'}];
      route.forEach((segment,i)=>{
        const isHtml=/\.html$/i.test(segment);
        const slug=segment.replace(/\.html$/i,'');
        const terminal=i===route.length-1;
        let href='/'+sectionRoot+'/'+route.slice(0,i+1).join('/');
        if(!isHtml){
          // La portada "Cómo llegar" es un .html; no existe /como-llegar/.
          if(!terminal&&slug==='como-llegar'&&route[i-1]==='estocolmo'){
            href+='.html';
          }else{
            href+='/';
          }
        }
        crumbs.push({label:terminal&&finalStrong||displayName(slug),href});
      });
      crumbs.forEach((crumb,i)=>{
        if(i){
          const sep=document.createElement('span');
          sep.className='vcc-bc-sep';
          sep.setAttribute('aria-hidden','true');
          sep.textContent='›';
          nav.appendChild(sep);
        }
        const isLast=i===crumbs.length-1;
        const el=document.createElement(isLast?'strong':'a');
        if(!isLast)el.setAttribute('href',crumb.href);
        el.textContent=crumb.label;
        if(isLast)el.setAttribute('aria-current','page');
        nav.appendChild(el);
      });
      if(original){
        original.classList.add('vcc-original-breadcrumb');
        original.setAttribute('aria-hidden','true');
        original.setAttribute('inert','');
        original.style.setProperty('visibility','hidden','important');
      }
      hero.classList.add('vcc-has-global-breadcrumb');
      if(sectionRoot==='planifica')hero.classList.add('vcc-breadcrumb-on-dark');
      hero.insertBefore(nav,hero.firstChild);
      return true;
    }
    function init(){
      if(render())return;
      // Algunos países generan el hero de manera síncrona o diferida.
      const container=document.getElementById('country-content');
      if(!container)return;
      const observer=new MutationObserver(()=>{
        if(render())observer.disconnect();
      });
      observer.observe(container,{childList:true,subtree:true});
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',init,{once:true});
    }else{init();}
  })();

  function getSection() {
    if (/\/destinos\//.test(currentPath)) return 'destinos';
    if (/\/itinerarios\//.test(currentPath)) return 'itinerarios';
    if (/\/planifica\//.test(currentPath)) return 'planifica';
    if (/\/nosotros\//.test(currentPath) || /\/en\/about\//.test(currentPath)) return 'nosotros';
    if (/\/contacto\//.test(currentPath) || /\/en\/contact\//.test(currentPath)) return 'contacto';
    return 'inicio';
  }
  const section = getSection();
  const isEnglish = /^\/en(?:\/|$)/i.test(currentPath);
  const links = isEnglish ? {
    inicio:url('en/index.html'),destinos:url('en/not-available/'),itinerarios:url('en/not-available/'),planifica:url('en/not-available/'),nosotros:url('en/about/index.html'),contacto:url('en/contact/index.html'),logo:url('/configuracion/imagenes/marca/logo-viajando-con-cabeza.svg'),
    instagram:'https://www.instagram.com/viajaconcabeza/',tiktok:'https://www.tiktok.com/@viajaconcabeza',youtube:'https://www.youtube.com/@viajaconcabeza'
  } : {
    inicio:url('index.html'),destinos:url('destinos/index.html'),itinerarios:url('itinerarios/index.html'),planifica:url('planifica/index.html'),nosotros:url('nosotros/index.html'),contacto:url('contacto/index.html'),logo:url('/configuracion/imagenes/marca/logo-viajando-con-cabeza.svg'),
    instagram:'https://www.instagram.com/viajaconcabeza/',tiktok:'https://www.tiktok.com/@viajaconcabeza',youtube:'https://www.youtube.com/@viajaconcabeza'
  };
  const menu = isEnglish ? [['inicio','HOME'],['destinos','DESTINATIONS'],['itinerarios','ITINERARIES'],['planifica','PLAN'],['nosotros','ABOUT'],['contacto','CONTACT']] : [['inicio','INICIO'],['destinos','DESTINOS'],['itinerarios','ITINERARIOS'],['planifica','PLANIFICA'],['nosotros','NOSOTROS'],['contacto','CONTACTO']];
  const instagramIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#cabecera-instagram"></use></svg>';
  const tiktokIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#cabecera-tiktok"></use></svg>';
  const youtubeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#cabecera-youtube"></use></svg>'
  const languageTargets = { inicio:{es:'/',en:'/en/'}, nosotros:{es:'/nosotros/',en:'/en/about/'}, contacto:{es:'/contacto/',en:'/en/contact/'} };
  const isSoonPage = /^(\/proximamente(?:\.html|\/)?|\/en\/(?:not-available|coming-soon)\/?)$/.test(currentPath);
  const languageTarget = isSoonPage ? {es:'/proximamente/',en:'/en/coming-soon/'} : (languageTargets[section] || {es:currentPath,en:'/en/coming-soon/'});
  const languageSwitch=`<div class="shared-language" aria-label="Language"><a href="${languageTarget.es}" lang="es" class="${isEnglish?"":"active"}" aria-label="Español">ES</a><span aria-hidden="true">|</span><a href="${languageTarget.en}" lang="en" class="${isEnglish?"active":""}" aria-label="English">EN</a></div>`;
  const header=`<header class="shared-header"><div class="shared-nav"><a class="shared-brand" href="${links.inicio}" aria-label="Viajando con Cabeza - Inicio"><img src="${links.logo}" alt="Viajando con Cabeza"></a><nav class="shared-menu" aria-label="Navegación principal">${menu.map(([key,label])=>`<a href="${links[key]}" class="${section===key?'active':''}">${label}</a>`).join('')}</nav><div class="shared-social" aria-label="Redes sociales"><a href="${links.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram @viajaconcabeza">${instagramIcon}</a><a href="${links.tiktok}" target="_blank" rel="noopener noreferrer" aria-label="TikTok @viajaconcabeza">${tiktokIcon}</a><a href="${links.youtube}" target="_blank" rel="noopener noreferrer" aria-label="YouTube @viajaconcabeza">${youtubeIcon}</a></div>${languageSwitch}</div></header>`;
  // Preserve already-rendered HTML navigation; only fill legacy empty placeholders.
  const existing=document.querySelector('.site-header, .page-header, .shared-header');
  if (existing?.matches('.shared-header') && existing.querySelector('.shared-menu a')) {
    // Refresh the three icons without replacing the working shared header.
    const socialLinks=existing.querySelectorAll('.shared-social a');
    const iconSources=[
      '/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#cabecera-instagram',
      '/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#cabecera-tiktok',
      '/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#cabecera-youtube'
    ];
    [instagramIcon,tiktokIcon,youtubeIcon].forEach((svg,i)=>{
      // La capçalera ja arriba preparada en HTML a les guies optimitzades.
      // Evitem reemplaçar SVG idèntics i invalidar el layout abans del LCP.
      const anchor=socialLinks[i];
      if(anchor && anchor.querySelector('use')?.getAttribute('href')!==iconSources[i])
        anchor.innerHTML=svg;
    });
    // Static header stays visible and functional even if this script fails later.
  } else if (existing) {
    existing.outerHTML=header;
  } else {
    document.body.insertAdjacentHTML('afterbegin',header);
  }
  // header-vcc-global.css és part del paquet vcc-core-compartit.css.

  // Els estils de la capçalera i del menú es mantenen a la font CSS global.
  const resetHeaderMenu=()=>{
    const menu=document.querySelector('body > .shared-header .shared-menu');
    if (!menu) return;
    menu.scrollLeft=0;
  };
  // En navegació nova el menú ja comença a l'esquerra per defecte.
  // Escriure scrollLeft=0 durant el primer render forçava una consulta de
  // layout costosa en mòbil; només cal normalitzar en restaurar la BFCache.
  window.addEventListener('pageshow',(event)=>{
    if(event.persisted) requestAnimationFrame(()=>requestAnimationFrame(resetHeaderMenu));
  });

  // Final layout guard: the header is sized to the visual viewport, not
  // to overflowing country-page content. Only the second-row menu scrolls.
  if(section==='destinos'){
    const fix=document.createElement('style');
    fix.id='destinos-approved-hero-fix';
    fix.textContent=`.destinos-hero::after{background-image:url("${url('/configuracion/imagenes/continentes/hero-map-approved-inline.svg?v=2')}")!important;background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important}`;
    document.head.appendChild(fix);
  }
  // El catálogo de Itinerarios se gestiona solo desde itinerarios/index.html.
  // No insertar rutas automáticamente desde el encabezado global.
  if(location.pathname.includes('/destinos/espana') && !location.pathname.includes('/madrid/')){
    const card=document.querySelector('#madrid');
    if(card){card.classList.add('available');const copy=card.querySelector('.region-copy');if(copy){const l=copy.querySelector('span'),p=copy.querySelector('p'),a=copy.querySelector('.region-action');if(l)l.textContent='COMUNIDAD AUTÓNOMA · 2 ITINERARIOS';if(p)p.textContent='Madrid en tres días y la extensión final de la gran ruta por Andalucía.';if(a)a.innerHTML='<span class="vcc-pending">PRÓXIMAMENTE</span>';}}
    const regions=[['#pais-vasco','COMUNIDAD AUTÓNOMA · 1 RUTA','San Sebastián, costa vasca y conexiones con Francia y Navarra.','pais-vasco/','EXPLORAR PAÍS VASCO →'],['#navarra','COMUNIDAD FORAL · 1 RUTA','Valle del Baztán y la jornada navarra de nuestra ruta del norte.','navarra/','EXPLORAR NAVARRA →']];
    regions.forEach(([sel,label,desc,href,cta])=>{const card=document.querySelector(sel);if(!card)return;card.classList.add('available');const copy=card.querySelector('.region-copy');if(!copy)return;const l=copy.querySelector('span'),p=copy.querySelector('p'),a=copy.querySelector('.region-action');if(l)l.textContent=label;if(p)p.textContent=desc;if(a)a.innerHTML='<span class="vcc-pending">PRÓXIMAMENTE</span>';});
  }
  // Fallback for slow/cached country scripts: keep Andalucía's itinerary links visible.
  if(location.pathname.includes('/destinos/espana/andalucia/'))setTimeout(()=>{
    const root=document.querySelector('#country-content');
    if(root&&!root.querySelector('#itinerarios'))root.insertAdjacentHTML('beforeend','<section id="itinerarios" class="sweden-itineraries-section country-main"><div class="country-heading"><div><p>Nuestras rutas reales</p><h2>ITINERARIOS EN ANDALUCÍA</h2></div><span>Rutas independientes y la gran ruta combinada.</span></div><div class="sweden-carousel vcc-fallback-itineraries"><article class="country-itinerary"><img src="/configuracion/imagenes/externas/unsplash/photo-1617469165786-8007eda3caa7.webp" alt="Córdoba en 2 días"><div class="country-itinerary-copy"><span class="tag">2 DÍAS · CIUDAD</span><h3>CÓRDOBA EN 2 DÍAS</h3><p>Mezquita-Catedral, Judería, puente romano y centro histórico.</p><span class="country-soon">PRÓXIMAMENTE</span></div></article><article class="country-itinerary"><img src="/configuracion/imagenes/externas/unsplash/photo-1543783207-ec64e4d95325.webp" alt="Provincia de Cádiz en 7 días"><div class="country-itinerary-copy"><span class="tag">7 DÍAS · COSTA</span><h3>PROVINCIA DE CÁDIZ EN 7 DÍAS</h3><p>Cádiz, Conil, Gibraltar, Tarifa, pueblos blancos y playas.</p><span class="country-soon">PRÓXIMAMENTE</span></div></article><article class="country-itinerary"><img src="/configuracion/imagenes/externas/unsplash/photo-1559564484-e48b3e040ff4.webp" alt="Sevilla en 2 días"><div class="country-itinerary-copy"><span class="tag">2 DÍAS · CIUDAD</span><h3>SEVILLA EN 2 DÍAS</h3><p>Catedral, Plaza de España, Arenal, Triana y Guadalquivir.</p><span class="country-soon">PRÓXIMAMENTE</span></div></article></div></section>');
  },1200);
  // Solo se eliminan nombres de localidades privadas. Los años son datos
  // editoriales necesarios para fechas de viaje, precios, itinerarios y SEO.
  const cleanPublicText=()=>{
    const rePlaces=/Olost|Prats de Lluçanès|Prats del Lluçanès/gi;
    const clean=s=>s.replace(rePlaces,'').replace(/ {2,}/g,' ');
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];let n;while(n=walker.nextNode())nodes.push(n);
    nodes.forEach(x=>{const v=clean(x.nodeValue);if(v!==x.nodeValue)x.nodeValue=v});
    document.querySelectorAll('title,meta[ name="description" ],meta[property="og:title"],meta[property="og:description"]').forEach(x=>{if(x.textContent){const v=clean(x.textContent);if(v!==x.textContent)x.textContent=v}if(x.content){const v=clean(x.content);if(v!==x.content)x.content=v}});
    document.querySelectorAll('[href]').forEach(x=>{const h=x.getAttribute('href')||'';if(/Olost|Prats de Lluçanès|Prats del Lluçanès/i.test(h))x.setAttribute('href',h.replace(/Olost|Prats de Lluçanès|Prats del Lluçanès/gi,'Barcelona'))});
  };
  cleanPublicText();
  new MutationObserver(cleanPublicText).observe(document.body,{subtree:true,childList:true,characterData:true});

  // Estado editorial global: "Próximamente" siempre deshabilitado y gris.
  const vccPendingStyle=document.createElement('style');
  vccPendingStyle.textContent='.vcc-pending,.home-feature-pending,body.inicio-vcc .home-feature-pending,.it-card .it-cta.vcc-pending,.vcc-route-link.vcc-pending{color:#b6aaa1!important;text-decoration:none!important;cursor:default!important;pointer-events:none!important}.vcc-country.vcc-pending-country{opacity:.58;cursor:default!important;pointer-events:none!important}.vcc-country.vcc-pending-country .vcc-country-arrow{display:none!important}.country-btn.vcc-pending,.vcc-card-action .vcc-pending,.it-cta.vcc-pending{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;color:#aaa29c!important;pointer-events:none!important}';
  document.head.appendChild(vccPendingStyle);
  /* VCC_PUBLIC_ROUTES_START */
  const publicRoutes=new Set(["/","/contacto/","/destinos/","/destinos/suecia/estocolmo/","/destinos/suecia/estocolmo/como-llegar","/destinos/suecia/estocolmo/como-moverse","/destinos/suecia/estocolmo/cuando-ir","/destinos/suecia/estocolmo/donde-dormir","/destinos/suecia/estocolmo/entradas-y-pases","/destinos/suecia/estocolmo/imprescindibles","/destinos/suecia/estocolmo/itinerario","/destinos/suecia/estocolmo/presupuesto","/destinos/suecia/estocolmo/que-llevar","/destinos/suecia/estocolmo/que-ver","/itinerarios/","/nosotros/","/planifica/","/planifica/alojamientos/","/planifica/calcula-tu-viaje/","/planifica/donde-ir/","/planifica/mapas/","/planifica/presupuesto/","/planifica/que-llevar/","/planifica/tarjetas-de-viaje/","/planifica/vuelos/"]);
  /* VCC_PUBLIC_ROUTES_END */
  const normalizePending=(root)=>{
    const candidates=[];
    if(root.nodeType===1&&root.matches('a'))candidates.push(root);
    if(root.querySelectorAll)candidates.push(...root.querySelectorAll('a'));
    candidates.forEach(a=>{
      const href=a.getAttribute('href')||'';
      const label=(a.textContent||'').trim();
      const isPending=/^PR[ÓO]XIMAMENTE\s*(?:→|›)?$/i.test(label);
      const isPendingDestination=/\/proximamente\/?(?:[?#].*)?$|\/coming-soon\/?(?:[?#].*)?$/i.test(href);
      // Las guías e itinerarios de países sin publicar nunca deben abrir páginas antiguas.
      let isUnpublishedGuide=false;
      if (/^VER\s+(?:ITINERARIO|GU[IÍ]A)(?:\s|$)/i.test(label)) {
        try {
          const target=new URL(href,location.href);
          const route=target.pathname;
          const canonicalRoute=route.replace(/\/index\.html$/i,'/').replace(/\.html$/i,'');
          isUnpublishedGuide=target.origin===location.origin &&
            (canonicalRoute.startsWith('/destinos/')||canonicalRoute.startsWith('/itinerarios/')) &&
            !publicRoutes.has(canonicalRoute);
        } catch(e) { /* URL inválida: no cambiar enlace */ }
      }
      if(!isPending&&!isPendingDestination&&!isUnpublishedGuide)return;
      const span=document.createElement('span');
      span.className=a.className||'';
      span.classList.add((isPending||isUnpublishedGuide)?'vcc-pending':'vcc-pending-country');
      if(isPending||isUnpublishedGuide){span.textContent='PRÓXIMAMENTE';}else{span.innerHTML=a.innerHTML;}
      for(const attr of a.attributes){if(attr.name.startsWith('data-'))span.setAttribute(attr.name,attr.value)}
      a.replaceWith(span);
    });
  };
  // VCC · Contrato editorial ÚNICO para las tarjetas de guías/itinerarios:
  //   VER ITINERARIO = itinerarios; VER GUÍA = todas las demás guías;
  //   PRÓXIMAMENTE = ficha sin contenido publicado.
  // No tocar enlaces funcionales que ejecutan acciones, p. ej. VER ZONA.
  const normalizeCatalogCardLabels=(root)=>{
    const selector='.vcc-it-card .vcc-it-cta,.vcc-it-card .vcc-it-upcoming,.vcc-it-card .di-upcoming-status';
    const nodes=[];
    if(root.nodeType===1&&root.matches(selector))nodes.push(root);
    if(root.querySelectorAll)nodes.push(...root.querySelectorAll(selector));
    for(const node of nodes){
      const card=node.closest('.vcc-it-card');
      if(!card)continue;
      // El estado de publicación manda: una guía borrador NO puede
      // conservar VER GUÍA ni crear una segunda etiqueta por CSS.
      if(card.getAttribute('data-vcc-publication')==='draft'){
        if(node.textContent.trim()!=='PRÓXIMAMENTE')node.textContent='PRÓXIMAMENTE';
        node.classList.remove('vcc-it-cta');
        node.classList.add('vcc-it-upcoming');
        continue;
      }
      const label=(node.textContent||'').trim();
      if((node.matches('.vcc-it-upcoming,.di-upcoming-status')||node.classList.contains('vcc-pending'))&&
         /PR[ÓO]XIMAMENTE/i.test(label)){
        if(label!=='PRÓXIMAMENTE')node.textContent='PRÓXIMAMENTE';
        continue;
      }
      if(!node.classList.contains('vcc-it-cta')||node.classList.contains('vcc-pending'))continue;
      const link=node.matches('a[href]')?node:node.closest('a[href]');
      if(!link||node.hasAttribute('data-choose-zone')||link.hasAttribute('data-choose-zone'))continue;
      const href=link.getAttribute('href')||'';
      if(!href||href[0]==='#')continue;
      let path;
      try{
        const target=new URL(href,location.href);
        if(target.origin!==location.origin)continue;
        path=target.pathname;
      }catch(_){continue}
      if(!/^\/(?:destinos|itinerarios)\//i.test(path))continue;
      const isItinerary=card.matches('.di-itinerary-card,.vcc-itinerary-card,.vcc-itin-card')||
        !!card.closest('#di-panel-itinerarios,.home-featured-itineraries')||
        /\/itinerario(?:\.html|\/|$)|^\/itinerarios\/[^/]/i.test(path);
      const expected=isItinerary?'VER ITINERARIO':'VER GUÍA';
      if(label!==expected)node.textContent=expected;
    }
  };
  normalizePending(document.body);
  normalizeCatalogCardLabels(document.body);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
    normalizePending(node);
    normalizeCatalogCardLabels(node);
  }))).observe(document.body,{childList:true,subtree:true});
})();

/* VCC shared Consejo component loader 2026-11-08 */
(function () {
  // Presupuesto no conté targetes Consejo VCC: evita el CSS i el JS
  // dinàmics que Lighthouse situa dins la cadena crítica en mòbil.
  if (document.body?.classList.contains('budget-vcc')) return;
  const current = document.currentScript;
  const base = current && current.src ? new URL('../../', current.src) : new URL('/', window.location.href);
  if (!document.getElementById('vcc-consejo-global-css')) {
    const css = document.createElement('link');
    css.id = 'vcc-consejo-global-css';
    css.rel = 'stylesheet';
    css.href = new URL('configuracion/css/componentes/consejo-vcc-global.css?v=20261108-sizing-v4', base).href;
    document.head.appendChild(css);
  }
  if (!document.getElementById('vcc-consejo-global-js')) {
    const js = document.createElement('script');
    js.id = 'vcc-consejo-global-js';
    js.src = new URL('configuracion/js/consejo-vcc-global.js?v=20261108-unificado', base).href;
    document.head.appendChild(js);
  }
})();
