(function () {
  const script = document.currentScript;
  const siteRoot = script ? new URL('../../', script.src) : new URL('./', window.location.href);
  const url = (path) => new URL(path, siteRoot).href;

  // Design tokens: una única paleta i font de tipografia per a tot el blog.
  if(!document.querySelector('link[data-vcc-design-tokens]')){
    const designTokens=document.createElement('link');
    designTokens.rel='stylesheet';
    designTokens.href=url('configuracion/css/base/tokens-vcc.css?v=20261111-sistema-v1');
    designTokens.dataset.vccDesignTokens='true';
    document.head.appendChild(designTokens);
  }

  // Subheader editorial único en todas las páginas que lo incluyen (sin alterar el menú principal).
  const subheaderCss=document.createElement('link');
  subheaderCss.rel='stylesheet';
  subheaderCss.href=url('configuracion/css/componentes/subheader-unificado-vcc.css?v=20261110-mobile-firstscreen-v1');
  subheaderCss.dataset.vccSharedSubheader='true';
  document.head.appendChild(subheaderCss);
  const subheaderJs=document.createElement('script');
  subheaderJs.src=url('configuracion/js/componentes/subheader-unificado-vcc.js?v=20261110-mobile-firstscreen-v1');
  subheaderJs.async=true;
  document.head.appendChild(subheaderJs);
  // Un único estilo para la ruta de navegación (Inicio > Destinos > país > ciudad > guía).
  // Cada página conserva sus enlaces, mientras se unifican tamaños y espacios.
  const breadcrumbSharedHref=url('configuracion/css/componentes/breadcrumb-vcc-global.css?v=20261110-tarjetas-v2');
  const breadcrumbSharedLink=document.querySelector('link[data-vcc-shared-breadcrumb],link[href*="breadcrumb-vcc-global.css"]');
  if(breadcrumbSharedLink){
    // También actualiza las guías que ya cargaban una versión antigua explícita.
    if(breadcrumbSharedLink.href!==breadcrumbSharedHref)breadcrumbSharedLink.href=breadcrumbSharedHref;
    breadcrumbSharedLink.dataset.vccSharedBreadcrumb='true';
  }else{
    const breadcrumbStyle=document.createElement('link');
    breadcrumbStyle.rel='stylesheet';
    breadcrumbStyle.dataset.vccSharedBreadcrumb='true';
    breadcrumbStyle.href=breadcrumbSharedHref;
    document.head.appendChild(breadcrumbStyle);
  }
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
      'donde-dormir':'Dónde alojarse','donde-comer':'Dónde comer',
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
    [instagramIcon,tiktokIcon,youtubeIcon].forEach((svg,i)=>{
      if(socialLinks[i]) socialLinks[i].innerHTML=svg;
    });
    // Static header stays visible and functional even if this script fails later.
  } else if (existing) {
    existing.outerHTML=header;
  } else {
    document.body.insertAdjacentHTML('afterbegin',header);
  }
  if(!document.getElementById('shared-header-style')){const style=document.createElement('style');style.id='shared-header-style';style.textContent='.shared-header{height:50px;background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:1000;width:100%;font-family:"DM Sans",sans-serif}.shared-nav{width:min(1180px,calc(100% - 48px));height:50px;margin:auto;display:grid;grid-template-columns:138px 1fr 92px 52px;align-items:center;column-gap:16px}.shared-brand{display:flex;align-items:center;width:134px;height:44px}.shared-brand img{display:block;width:128px;height:42px;object-fit:contain;object-position:left center}.shared-menu{display:flex;align-items:center;justify-content:center;gap:25px;font-size:9.3px;font-weight:800}.shared-menu a{color:#111315;text-decoration:none;padding:18px 0 16px;position:relative;white-space:nowrap}.shared-menu a:hover{color:#ef7168}.shared-menu a.active:after{content:"";position:absolute;left:0;right:0;bottom:9px;height:2px;background:#ef7168}.shared-social{display:flex;justify-content:flex-end;align-items:center;gap:12px}.shared-language{display:flex;align-items:center;justify-content:flex-end;gap:5px;font:800 10px/1 "DM Sans",sans-serif;white-space:nowrap}.shared-language a{color:#777;text-decoration:none;padding:7px 2px}.shared-language a.active,.shared-language a:hover{color:#ef7168}.shared-social a{display:grid;place-items:center;width:22px;height:22px;color:#0f1113;text-decoration:none}.shared-social a:hover{color:#ef7168}.shared-social svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.shared-social .shared-solid{fill:currentColor;stroke:none}@media(max-width:720px){.shared-header{height:auto;position:relative}.shared-nav{width:calc(100% - 28px);height:auto;grid-template-columns:minmax(0,1fr) auto;padding:4px 0}.shared-brand{width:122px;height:41px}.shared-brand img{width:118px;height:39px}.shared-social{display:flex;gap:10px;justify-self:end;flex-shrink:0}.shared-language{grid-column:2;grid-row:1;align-self:start;margin-top:4px;justify-self:end}.shared-social a{width:28px;height:28px}.shared-social svg{width:19px;height:19px}.shared-menu{grid-column:1/3;order:3;overflow-x:auto;justify-content:flex-start;gap:18px;padding:2px 0 1px;scrollbar-width:none}.shared-menu::-webkit-scrollbar{display:none}.shared-menu a{padding:4px 0}.shared-menu a.active:after{bottom:0}}@media(max-width:380px){.shared-nav{width:calc(100% - 20px)}.shared-language{grid-column:2;grid-row:1;margin-right:0}.shared-brand{width:108px}.shared-brand img{width:104px}.shared-social{gap:6px}.shared-social a{width:26px;height:26px}.shared-social svg{width:18px;height:18px}}';document.head.appendChild(style);}

  // Social icons: consistent 24px hit area and optically matched 19px drawings.
  if (!document.getElementById('vcc-header-social-icons')) {
    const socialStyle=document.createElement('style');
    socialStyle.id='vcc-header-social-icons';
    socialStyle.textContent=`
      html body > .shared-header .shared-social a {
        box-sizing:border-box!important;
        display:grid!important;
        place-items:center!important;
        width:25px!important;
        height:25px!important;
        flex:0 0 25px!important;
        padding:0!important;
        margin:0!important;
      }
      html body > .shared-header .shared-social svg {
        display:block!important;
        width:19px!important;
        height:19px!important;
        fill:none!important;
        stroke:currentColor!important;
        stroke-width:1.8!important;
        stroke-linecap:round!important;
        stroke-linejoin:round!important;
      }
      html body > .shared-header .shared-social svg .shared-solid {
        fill:currentColor!important;
        stroke:none!important;
      }
      @media(max-width:380px) {
        html body > .shared-header .shared-social a {
          width:22px!important;height:22px!important;flex-basis:22px!important;
        }
        html body > .shared-header .shared-social svg {width:17px!important;height:17px!important}
      }
    `;
    document.head.appendChild(socialStyle);
  }
  // Single source of truth for the main navigation across every page.
  // Match the type scale used by the Sweden/Stockholm guides without changing secondary tabs.
  if(!document.getElementById('vcc-global-navigation-unified')){
    const unified=document.createElement('style');
    unified.id='vcc-global-navigation-unified';
    unified.textContent=`
      html body > .shared-header .shared-nav { width:calc(100% - 80px)!important; max-width:none!important; margin-inline:auto!important; }
      html body > .shared-header .shared-menu { font-family:'DM Sans',sans-serif!important; font-size:12px!important; font-weight:800!important; line-height:1.15!important; letter-spacing:0!important; text-transform:uppercase!important; gap:25px!important; }
      html body > .shared-header .shared-menu a { font:inherit!important; font-size:12px!important; font-weight:800!important; line-height:1.15!important; letter-spacing:0!important; text-transform:uppercase!important; }
      @media(max-width:720px) {
        html body > .shared-header .shared-nav { display:grid!important; grid-template-columns:minmax(0,1fr) auto auto!important; grid-template-rows:auto auto!important; align-items:center!important; column-gap:10px!important; row-gap:2px!important; padding:4px 0!important; width:calc(100% - 28px)!important; }
        html body > .shared-header .shared-brand { grid-column:1!important; grid-row:1!important; justify-self:start!important; }
        html body > .shared-header .shared-social { grid-column:2!important; grid-row:1!important; display:flex!important; justify-self:end!important; align-self:center!important; align-items:center!important; gap:8px!important; margin:0!important; }
        html body > .shared-header .shared-language { grid-column:3!important; grid-row:1!important; justify-self:end!important; align-self:center!important; margin:0!important; white-space:nowrap!important; }
        html body > .shared-header .shared-menu { grid-column:1/4!important; grid-row:2!important; width:100%!important; min-width:0!important; display:flex!important; overflow-x:auto!important; justify-content:flex-start!important; gap:18px!important; padding:3px 0 2px!important; }
        html body > .shared-header .shared-social a { display:grid!important; place-items:center!important; width:25px!important; height:25px!important; flex:0 0 25px!important; }
        html body > .shared-header .shared-social svg { display:block!important; width:18px!important; height:18px!important; }
      }
      @media(max-width:380px) {
        html body > .shared-header .shared-nav { width:calc(100% - 20px)!important; column-gap:7px!important; }
        html body > .shared-header .shared-brand { width:104px!important; }
        html body > .shared-header .shared-brand img { width:100px!important; }
        html body > .shared-header .shared-social { gap:5px!important; }
        html body > .shared-header .shared-social a { width:22px!important; height:22px!important; flex-basis:22px!important; }
        html body > .shared-header .shared-social svg { width:17px!important; height:17px!important; }
      }
    `;
    unified.textContent += `

      html body > .shared-header .shared-nav { width:calc(100% - 80px)!important; max-width:none!important; margin-inline:auto!important; }
      html body > .shared-header .shared-menu { font-family:'DM Sans',sans-serif!important; font-size:12px!important; font-weight:800!important; line-height:1.15!important; letter-spacing:0!important; text-transform:uppercase!important; gap:25px!important; }
      html body > .shared-header .shared-menu a { font:inherit!important; font-size:12px!important; font-weight:800!important; line-height:1.15!important; letter-spacing:0!important; text-transform:uppercase!important; }
      @media(max-width:720px) {
        html body > .shared-header .shared-nav { width:calc(100% - 28px)!important; }
        html body > .shared-header .shared-menu { gap:18px!important; }
        html body > .shared-header .shared-menu a { font-size:11px!important; }
      }
      @media(max-width:380px) { html body > .shared-header .shared-nav { width:calc(100% - 20px)!important; } }
    `;
    document.head.appendChild(unified);
  }
  // Normalize the exact same full-width mobile header on every page.
  // The menu alone scrolls; the white header and underline span the viewport.
  if (!document.getElementById('vcc-mobile-header-edge-fix')) {
    const fix=document.createElement('style');
    fix.id='vcc-mobile-header-edge-fix';
    fix.textContent=`
      @media(max-width:720px) {
        html body > .shared-header {
          box-sizing:border-box!important;
          display:block!important;
          width:100%!important;
          max-width:100%!important;
          min-width:0!important;
          margin:0!important;
          overflow:visible!important;
          background:#fff!important;
          border-bottom:1px solid #eee!important;
        }
        html body > .shared-header > .shared-nav {
          box-sizing:border-box!important;
          display:grid!important;
          width:100%!important;
          max-width:100%!important;
          min-width:0!important;
          margin:0!important;
          padding:4px 0 0!important;
          grid-template-columns:minmax(0,1fr) auto auto!important;
          grid-template-rows:50px 37px!important;
          column-gap:8px!important;
          row-gap:0!important;
        }
        html body > .shared-header .shared-brand {
          grid-column:1!important;
          grid-row:1!important;
          justify-self:start!important;
          margin-left:14px!important;
        }
        html body > .shared-header .shared-social {
          grid-column:2!important;
          grid-row:1!important;
          justify-self:end!important;
        }
        html body > .shared-header .shared-language {
          grid-column:3!important;
          grid-row:1!important;
          justify-self:end!important;
          margin-right:14px!important;
        }
        html body > .shared-header .shared-menu {
          box-sizing:border-box!important;
          display:flex!important;
          grid-column:1 / -1!important;
          grid-row:2!important;
          width:100%!important;
          max-width:100%!important;
          min-width:0!important;
          margin:0!important;
          padding:0 14px!important;
          gap:20px!important;
          justify-content:flex-start!important;
          flex-wrap:nowrap!important;
          white-space:nowrap!important;
          overflow-x:auto!important;
          overflow-y:hidden!important;
          scrollbar-width:none!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior-x:contain!important;
        }
        html body > .shared-header .shared-menu::-webkit-scrollbar{display:none!important}
        html body > .shared-header .shared-menu a{
          display:inline-flex!important;
          align-items:center!important;
          flex:0 0 auto!important;
          padding:8px 0 10px!important;
          font:800 12px/1.15 "DM Sans",sans-serif!important;
          white-space:nowrap!important;
        }
        html body > .shared-header .shared-menu a.active::after {
          bottom:2px!important;
        }
      }
      @media(max-width:380px){
        html body > .shared-header .shared-brand{margin-left:10px!important}
        html body > .shared-header .shared-language{margin-right:10px!important}
        html body > .shared-header .shared-menu{padding-inline:10px!important;gap:17px!important}
      }
    `;
    document.head.appendChild(fix);
  }

  // Desktop header: reserve explicit room for language controls on every page.
  // Override page-specific legacy header grids without changing mobile layout.
  if (!document.getElementById('vcc-header-desktop-language-fix')) {
    const style=document.createElement('style');
    style.id='vcc-header-desktop-language-fix';
    style.textContent=`
      @media(min-width:721px) {
        html body > .shared-header { width:100%!important; max-width:100%!important; }
        html body > .shared-header > .shared-nav {
          box-sizing:border-box!important;
          display:grid!important;
          width:calc(100% - 80px)!important;
          max-width:none!important;
          min-width:0!important;
          grid-template-columns:140px minmax(0,1fr) 100px 65px!important;
          align-items:center!important;
          column-gap:16px!important;
          margin-inline:auto!important;
        }
        html body > .shared-header .shared-brand { grid-column:1!important; min-width:0!important; }
        html body > .shared-header .shared-menu { grid-column:2!important; min-width:0!important; }
        html body > .shared-header .shared-social { grid-column:3!important; min-width:0!important; justify-content:flex-end!important; }
        html body > .shared-header .shared-language {
          grid-column:4!important;
          display:flex!important;
          visibility:visible!important;
          opacity:1!important;
          min-width:0!important;
          justify-content:flex-end!important;
          align-items:center!important;
          white-space:nowrap!important;
          margin:0!important;
          position:static!important;
        }
        html body > .shared-header .shared-language a { display:inline-block!important; }
      }
      @media(min-width:721px) and (max-width:1050px) {
        html body > .shared-header > .shared-nav {
          width:calc(100% - 32px)!important;
          grid-template-columns:120px minmax(0,1fr) 82px 55px!important;
          column-gap:9px!important;
        }
        html body > .shared-header .shared-menu { gap:12px!important; }
        html body > .shared-header .shared-menu a { font-size:10px!important; }
        html body > .shared-header .shared-social { gap:5px!important; }
      }
    `;
    document.head.appendChild(style);
  }

  // Stable navigation position across pages and browser back/forward cache.
  // This must NOT run on scroll, only when the page is entered/restored.
  if (!document.getElementById('vcc-menu-scroll-stability')) {
    const style=document.createElement('style');
    style.id='vcc-menu-scroll-stability';
    style.textContent=`
      @media(max-width:720px){
        html body > .shared-header .shared-menu{
          scroll-behavior:auto!important;
          scroll-snap-type:x proximity!important;
          scroll-padding-inline:14px!important;
          touch-action:pan-x!important;
        }
        html body > .shared-header .shared-menu a{
          scroll-snap-align:start!important;
          scroll-snap-stop:normal!important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  const resetHeaderMenu=()=>{
    const menu=document.querySelector('body > .shared-header .shared-menu');
    if (!menu) return;
    menu.scrollLeft=0;
  };
  // pageshow also fires when the browser restores a page from cache.
  window.addEventListener('pageshow',()=>{
    resetHeaderMenu();
    requestAnimationFrame(()=>requestAnimationFrame(resetHeaderMenu));
  });
  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', resetHeaderMenu, {once:true});
  } else {
    resetHeaderMenu();
  }

  // Final layout guard: the header is sized to the visual viewport, not
  // to overflowing country-page content. Only the second-row menu scrolls.
  if (!document.getElementById('vcc-header-viewport-guard')) {
    const guard=document.createElement('style');
    guard.id='vcc-header-viewport-guard';
    guard.textContent=`
      @media(max-width:720px){
        html,body{max-width:100%!important;overflow-x:clip!important}
        html body > .shared-header{
          position:sticky!important;
          top:0!important;
          left:0!important;
          right:0!important;
          display:block!important;
          width:100%!important;
          max-width:100%!important;
          min-width:0!important;
          margin:0!important;
          padding:0!important;
          border:0!important;
          border-bottom:1px solid #e7ddd4!important;
          background:#fff!important;
          box-sizing:border-box!important;
          overflow:hidden!important;
          z-index:1100!important;
        }
        html body > .shared-header > .shared-nav{
          width:100%!important;
          max-width:100%!important;
          min-width:0!important;
          margin:0!important;
          box-sizing:border-box!important;
          padding:0!important;
          height:auto!important;
          min-height:0!important;
          display:grid!important;
          grid-template-columns:minmax(0,1fr) auto auto!important;
          grid-template-rows:45px 33px!important;
          column-gap:8px!important;
          row-gap:0!important;
        }
        html body > .shared-header .shared-brand{
          grid-column:1!important;grid-row:1!important;
          margin:0 0 0 14px!important;
          min-width:0!important;
        }
        html body > .shared-header .shared-social{
          grid-column:2!important;grid-row:1!important;
          margin:0!important;justify-self:end!important;
        }
        html body > .shared-header .shared-language{
          grid-column:3!important;grid-row:1!important;
          margin:0 14px 0 0!important;justify-self:end!important;
        }
        html body > .shared-header .shared-menu{
          grid-column:1/-1!important;grid-row:2!important;
          width:100%!important;max-width:100%!important;min-width:0!important;
          box-sizing:border-box!important;
          margin:0!important;
          padding:0 14px!important;
          display:flex!important;
          flex-wrap:nowrap!important;
          gap:20px!important;
          align-items:center!important;
          justify-content:flex-start!important;
          white-space:nowrap!important;
          overflow-x:auto!important;
          overflow-y:hidden!important;
          scrollbar-width:none!important;
          overscroll-behavior-x:contain!important;
          -webkit-overflow-scrolling:touch!important;
          scroll-snap-type:none!important;
          scroll-padding:0!important;
        }
        html body > .shared-header .shared-menu a{
          flex:0 0 auto!important;
          padding:9px 0 11px!important;
          font:800 12px/1.15 "DM Sans",sans-serif!important;
          scroll-snap-align:none!important;
        }
        html body > .shared-header .shared-menu a.active::after{bottom:3px!important}
      }
      @media(max-width:380px){
        html body > .shared-header .shared-brand{margin-left:10px!important}
        html body > .shared-header .shared-language{margin-right:10px!important}
        html body > .shared-header .shared-menu{padding-inline:10px!important;gap:17px!important}
      }
    `;
    document.head.appendChild(guard);
  }
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
  // Privacy pass: keep the public site free of home-town names and calendar years.
  const cleanPublicText=()=>{
    const rePlaces=/Olost|Prats de Lluçanès|Prats del Lluçanès/gi;
    const reYears=/\b(?:19|20)\d{2}\b/g;
    // Els anys de preus i reserves són dades útils, no informació personal.
    // Manté-los en aquesta guia; continua ocultant els noms de poblacions privades.
    // Dónde ir publica editorials anuals (Navidad 2026, playas 2027).
    // Els anys formen part del títol, de la cerca i del SEO; preserva'ls només
    // en aquesta pàgina i en Entradas y pases, sense exposar noms privats.
    const preserveYearsHere=/^\/destinos\/suecia\/estocolmo\/entradas-y-pases(?:\.html)?\/?$/i.test(location.pathname)
      || /^\/planifica\/donde-ir\/?(?:index\.html)?$/i.test(location.pathname);
    const clean=s=>{
      const withoutPlaces=s.replace(rePlaces,'');
      return (preserveYearsHere ? withoutPlaces : withoutPlaces.replace(reYears,'')).replace(/ {2,}/g,' ');
    };
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
          isUnpublishedGuide=target.origin===location.origin && (
            (route.startsWith('/destinos/') && !route.startsWith('/destinos/suecia/')) ||
            (route.startsWith('/itinerarios/') && route!=='/itinerarios/')
          );
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
  normalizePending(document.body);
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>normalizePending(n)))).observe(document.body,{childList:true,subtree:true});
})();

/* VCC shared Consejo component loader 2026-11-08 */
(function () {
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
