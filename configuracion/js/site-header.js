(function () {
  const script = document.currentScript;
  const siteRoot = script ? new URL('../../', script.src) : new URL('./', window.location.href);
  const url = (path) => new URL(path, siteRoot).href;
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
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
  const instagramIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="shared-solid"/></svg>';
  const tiktokIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4v10.1a4.4 4.4 0 1 1-3.7-4.3v3a1.7 1.7 0 1 0 1 1.6V4h2.7c.3 2.3 1.7 3.8 4.2 4.2v2.7a7.6 7.6 0 0 1-4.2-1.6"/></svg>';
  const youtubeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path class="shared-solid" d="m10 9 5 3-5 3Z"/></svg>'
  const languageTargets = { inicio:{es:'/',en:'/en/'}, nosotros:{es:'/nosotros/',en:'/en/about/'}, contacto:{es:'/contacto/',en:'/en/contact/'} };
  const languageTarget = languageTargets[section] || {es:currentPath,en:'/en/not-available/'};
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
    fix.textContent=`.destinos-hero::after{background-image:url("${url('/destinos/imagenes/hero-map-approved-inline.svg?v=2')}")!important;background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important}`;
    document.head.appendChild(fix);
  }
  if(section==='itinerarios' && /\/itinerarios\/?$/.test(currentPath)){
    const list=document.querySelector('.itinerarios-list-new'),empty=list&&list.querySelector('.it-empty');
    if(list && empty && !list.dataset.catalogExpanded){
      const cards=[
        ['FUERTEVENTURA EN 4 DÍAS','europa','4','playas naturaleza','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85','Playas, dunas, volcanes y pueblos de Fuerteventura en coche.','../destinos/espana/fuerteventura/itinerario.html'],
        ['CÓRDOBA EN 2 DÍAS','europa','2','ciudades','https://images.unsplash.com/photo-1577334928618-2ff68906bb5e?auto=format&fit=crop&w=1200&q=85','Mezquita-Catedral, Judería, puente romano, Alcázar y centro histórico.','../destinos/espana/andalucia/cordoba/itinerario.html'],
        ['PROVINCIA DE CÁDIZ EN 7 DÍAS','europa','7','playas ciudades naturaleza combinados','https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=85','Cádiz, Conil, pueblos blancos, Gibraltar, Tarifa y playas atlánticas.','../destinos/espana/andalucia/cadiz/itinerario.html'],
        ['SEVILLA EN 2 DÍAS','europa','2','ciudades','https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=1200&q=85','Catedral, Giralda, Alcázar, Santa Cruz, Plaza de España, Arenal y Triana.','../destinos/espana/andalucia/sevilla/itinerario.html'],
        ['MADRID EN 3 DÍAS','europa','3','ciudades','https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=85','Centro histórico, Retiro, museos, Bernabéu, Gran Vía y barrios.','../destinos/espana/madrid/itinerario.html'],
        ['COSTA VASCA FRANCESA EN 1 DÍA','europa','1','playas ciudades','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85','Biarritz, San Juan de Luz, Hendaya y Hondarribia en una escapada costera.','../destinos/francia/pais-vasco-frances/itinerario.html'],
        ['SALZBURG EN 1 DÍA','europa','1','ciudades navidad','https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&w=1200&q=85','Centro histórico, miradores, fortaleza y mercados de Navidad.','navidad-austria-alemania-suiza/dia-1-salzburg/'],
        ['ST. WOLFGANG + HALLSTATT EN 1 DÍA','europa','1','naturaleza ciudades navidad combinados','https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?auto=format&fit=crop&w=1200&q=85','Dos pueblos alpinos y sus lagos en una excursión desde Salzburg.','navidad-austria-alemania-suiza/dia-2-st-wolfgang-hallstatt/'],
        ['KÖNIGSSEE + BERCHTESGADEN EN 1 DÍA','europa','1','naturaleza ciudades navidad combinados','https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1200&q=85','Lago alpino, mina de sal y centro histórico en Baviera.','navidad-austria-alemania-suiza/dia-3-berchtesgaden-innsbruck/'],
        ['INNSBRUCK EN 1 DÍA','europa','1','ciudades montanas navidad','https://images.unsplash.com/photo-1596394723269-b2cbca4e6313?auto=format&fit=crop&w=1200&q=85','Centro histórico, Bergisel, Schloss Ambras y Hungerburg.','navidad-austria-alemania-suiza/dia-4-innsbruck-zurich/'],
        ['ZÚRICH EN 1 DÍA','europa','1','ciudades navidad','https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=1200&q=85','Free tour y paseo por el centro de Zúrich para cerrar la ruta.','navidad-austria-alemania-suiza/dia-5-zurich/']
        ,['PAÍS VASCO, FRANCIA Y BAZTÁN EN 5 DÍAS','europa','5','combinados naturaleza ciudades','https://images.unsplash.com/photo-1566577371609-48e5f7081b20?auto=format&fit=crop&w=1200&q=85','San Sebastián, costa vasca, País Vasco francés y Valle del Baztán.','../destinos/espana/pais-vasco/itinerario.html']
        ,['VALLE DEL BAZTÁN EN 1 DÍA','europa','1','naturaleza','https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85','Mirador, pueblos del Baztán y Señorío de Bertiz.','../destinos/espana/navarra/itinerario.html']
      ];
      const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
      cards.forEach(([title,continent,days,type,img,desc,href])=>{const a=document.createElement('article');a.className='it-card';a.dataset.continent=continent;a.dataset.days=days;a.dataset.type=type;a.innerHTML=`<img src="${img}" alt="${esc(title)}"><div class="it-card-copy"><h2>${esc(title)}</h2><p>${esc(desc)}</p><div class="it-meta"><span>◷ ${days} ${days==='1'?'día':'días'}</span><span>⌖ Ruta VCC</span><span>♡ VCC</span></div><a href="${href}" class="it-cta">VER ITINERARIO →</a></div>`;list.insertBefore(a,empty)});
      const paris=[...list.querySelectorAll('.it-card')].find(x=>x.querySelector('h2')?.textContent.includes('PARÍS'));if(paris){paris.dataset.days='4';paris.dataset.type='ciudades navidad';const a=paris.querySelector('.it-cta');if(a){a.href='../destinos/francia/paris/itinerario.html';a.textContent='VER ITINERARIO →'}}
      list.dataset.catalogExpanded='true';
    }
  }
  if(location.pathname.includes('/destinos/espana') && !location.pathname.includes('/madrid/')){
    const card=document.querySelector('#madrid');
    if(card){card.classList.add('available');const copy=card.querySelector('.region-copy');if(copy){const l=copy.querySelector('span'),p=copy.querySelector('p'),a=copy.querySelector('.region-action');if(l)l.textContent='COMUNIDAD AUTÓNOMA · 2 ITINERARIOS';if(p)p.textContent='Madrid en tres días y la extensión final de la gran ruta por Andalucía.';if(a)a.innerHTML='<a href="madrid/">EXPLORAR MADRID →</a>';}}
    const regions=[['#pais-vasco','COMUNIDAD AUTÓNOMA · 1 RUTA','San Sebastián, costa vasca y conexiones con Francia y Navarra.','pais-vasco/','EXPLORAR PAÍS VASCO →'],['#navarra','COMUNIDAD FORAL · 1 RUTA','Valle del Baztán y la jornada navarra de nuestra ruta del norte.','navarra/','EXPLORAR NAVARRA →']];
    regions.forEach(([sel,label,desc,href,cta])=>{const card=document.querySelector(sel);if(!card)return;card.classList.add('available');const copy=card.querySelector('.region-copy');if(!copy)return;const l=copy.querySelector('span'),p=copy.querySelector('p'),a=copy.querySelector('.region-action');if(l)l.textContent=label;if(p)p.textContent=desc;if(a)a.innerHTML=`<a href="${href}">${cta}</a>`;});
  }
  // Fallback for slow/cached country scripts: keep Andalucía's itinerary links visible.
  if(location.pathname.includes('/destinos/espana/andalucia/'))setTimeout(()=>{
    const root=document.querySelector('#country-content');
    if(root&&!root.querySelector('#itinerarios'))root.insertAdjacentHTML('beforeend','<section id="itinerarios" class="sweden-itineraries-section country-main"><div class="country-heading"><div><p>Nuestras rutas reales</p><h2>ITINERARIOS EN ANDALUCÍA</h2></div><span>Rutas independientes y la gran ruta combinada.</span></div><div class="sweden-carousel vcc-fallback-itineraries"><article class="country-itinerary"><img src="https://images.unsplash.com/photo-1577334928618-2ff68906bb5e?auto=format&fit=crop&w=1000&q=85" alt="Córdoba en 2 días"><div class="country-itinerary-copy"><span class="tag">2 DÍAS · CIUDAD</span><h3>CÓRDOBA EN 2 DÍAS</h3><p>Mezquita-Catedral, Judería, puente romano y centro histórico.</p><a class="country-btn" href="cordoba/itinerario.html">VER ITINERARIO →</a></div></article><article class="country-itinerary"><img src="https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1000&q=85" alt="Provincia de Cádiz en 7 días"><div class="country-itinerary-copy"><span class="tag">7 DÍAS · COSTA</span><h3>PROVINCIA DE CÁDIZ EN 7 DÍAS</h3><p>Cádiz, Conil, Gibraltar, Tarifa, pueblos blancos y playas.</p><a class="country-btn" href="cadiz/itinerario.html">VER ITINERARIO →</a></div></article><article class="country-itinerary"><img src="https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=1000&q=85" alt="Sevilla en 2 días"><div class="country-itinerary-copy"><span class="tag">2 DÍAS · CIUDAD</span><h3>SEVILLA EN 2 DÍAS</h3><p>Catedral, Plaza de España, Arenal, Triana y Guadalquivir.</p><a class="country-btn" href="sevilla/itinerario.html">VER ITINERARIO →</a></div></article></div></section>');
  },1200);
  // Privacy pass: keep the public site free of home-town names and calendar years.
  const cleanPublicText=()=>{
    const rePlaces=/Olost|Prats de Lluçanès|Prats del Lluçanès/gi;
    const reYears=/\b(?:19|20)\d{2}\b/g;
    const clean=s=>s.replace(rePlaces,'').replace(reYears,'').replace(/ {2,}/g,' ');
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];let n;while(n=walker.nextNode())nodes.push(n);
    nodes.forEach(x=>{const v=clean(x.nodeValue);if(v!==x.nodeValue)x.nodeValue=v});
    document.querySelectorAll('title,meta[ name="description" ],meta[property="og:title"],meta[property="og:description"]').forEach(x=>{if(x.textContent){const v=clean(x.textContent);if(v!==x.textContent)x.textContent=v}if(x.content){const v=clean(x.content);if(v!==x.content)x.content=v}});
    document.querySelectorAll('[href]').forEach(x=>{const h=x.getAttribute('href')||'';if(/Olost|Prats de Lluçanès|Prats del Lluçanès/i.test(h))x.setAttribute('href',h.replace(/Olost|Prats de Lluçanès|Prats del Lluçanès/gi,'Barcelona'))});
  };
  cleanPublicText();
  new MutationObserver(cleanPublicText).observe(document.body,{subtree:true,childList:true,characterData:true});
})();