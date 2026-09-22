(function () {
  const script = document.currentScript;
  const siteRoot = script ? new URL('../', script.src) : new URL('./', window.location.href);
  const url = (path) => new URL(path, siteRoot).href;
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
  function getSection() {
    if (/\/destinos\//.test(currentPath)) return 'destinos';
    if (/\/itinerarios\//.test(currentPath)) return 'itinerarios';
    if (/\/planifica\//.test(currentPath)) return 'planifica';
    if (/\/nosotros\//.test(currentPath)) return 'nosotros';
    if (/\/contacto\//.test(currentPath)) return 'contacto';
    return 'inicio';
  }
  const section = getSection();
  const links = {
    inicio: url('index.html'), destinos: url('destinos/index.html'), itinerarios: url('itinerarios/index.html'), planifica: url('planifica/index.html'), nosotros: url('nosotros/index.html'), contacto: url('contacto/index.html'), logo: url('assets/branding/logo-viajando-con-cabeza.svg'),
    instagram: 'https://www.instagram.com/viajaconcabeza/',
    tiktok: 'https://www.tiktok.com/@viajaconcabeza',
    youtube: 'https://www.youtube.com/@viajaconcabeza'
  };
  const menu = [['inicio','INICIO'],['destinos','DESTINOS'],['itinerarios','ITINERARIOS'],['planifica','PLANIFICA'],['nosotros','NOSOTROS'],['contacto','CONTACTO']];
  const instagramIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="shared-solid"/></svg>';
  const tiktokIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4v10.1a4.4 4.4 0 1 1-3.7-4.3v3a1.7 1.7 0 1 0 1 1.6V4h2.7c.3 2.3 1.7 3.8 4.2 4.2v2.7a7.6 7.6 0 0 1-4.2-1.6"/></svg>';
  const youtubeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.5 12 5.5 12 5.5s-5 0-6.9.6A3 3 0 0 0 3 8.2 31 31 0 0 0 2.5 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.6 6.9.6 6.9.6s5 0 6.9-.6a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-3.8 31 31 0 0 0-.5-3.8Z"/><path class="shared-solid" d="m10 9 5 3-5 3Z"/></svg>';
  const header=`<header class="shared-header"><div class="shared-nav"><a class="shared-brand" href="${links.inicio}" aria-label="Viajando con Cabeza - Inicio"><img src="${links.logo}" alt="Viajando con Cabeza"></a><nav class="shared-menu" aria-label="Navegación principal">${menu.map(([key,label])=>`<a href="${links[key]}" class="${section===key?'active':''}">${label}</a>`).join('')}</nav><div class="shared-social" aria-label="Redes sociales"><a href="${links.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram @viajaconcabeza">${instagramIcon}</a><a href="${links.tiktok}" target="_blank" rel="noopener noreferrer" aria-label="TikTok @viajaconcabeza">${tiktokIcon}</a><a href="${links.youtube}" target="_blank" rel="noopener noreferrer" aria-label="YouTube @viajaconcabeza">${youtubeIcon}</a></div></div></header>`;
  const existing=document.querySelector('.site-header, .page-header, .shared-header'); if(existing) existing.outerHTML=header; else document.body.insertAdjacentHTML('afterbegin',header);
  if(!document.getElementById('shared-header-style')){const style=document.createElement('style');style.id='shared-header-style';style.textContent='.shared-header{height:50px;background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:1000;width:100%;font-family:"DM Sans",sans-serif}.shared-nav{width:min(1180px,calc(100% - 48px));height:50px;margin:auto;display:grid;grid-template-columns:138px 1fr 92px;align-items:center;column-gap:16px}.shared-brand{display:flex;align-items:center;width:134px;height:44px}.shared-brand img{display:block;width:128px;height:42px;object-fit:contain;object-position:left center}.shared-menu{display:flex;align-items:center;justify-content:center;gap:25px;font-size:9.3px;font-weight:800}.shared-menu a{color:#111315;text-decoration:none;padding:18px 0 16px;position:relative;white-space:nowrap}.shared-menu a:hover{color:#ef7168}.shared-menu a.active:after{content:"";position:absolute;left:0;right:0;bottom:9px;height:2px;background:#ef7168}.shared-social{display:flex;justify-content:flex-end;align-items:center;gap:12px}.shared-social a{display:grid;place-items:center;width:22px;height:22px;color:#0f1113;text-decoration:none}.shared-social a:hover{color:#ef7168}.shared-social svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.shared-social .shared-solid{fill:currentColor;stroke:none}@media(max-width:720px){.shared-header{height:auto;position:relative}.shared-nav{width:calc(100% - 28px);height:auto;grid-template-columns:minmax(0,1fr) auto;padding:4px 0}.shared-brand{width:122px;height:41px}.shared-brand img{width:118px;height:39px}.shared-social{display:flex;gap:10px;justify-self:end;flex-shrink:0}.shared-social a{width:28px;height:28px}.shared-social svg{width:19px;height:19px}.shared-menu{grid-column:1/3;order:3;overflow-x:auto;justify-content:flex-start;gap:18px;padding:2px 0 1px;scrollbar-width:none}.shared-menu::-webkit-scrollbar{display:none}.shared-menu a{padding:4px 0}.shared-menu a.active:after{bottom:0}}@media(max-width:380px){.shared-nav{width:calc(100% - 20px)}.shared-brand{width:108px}.shared-brand img{width:104px}.shared-social{gap:6px}.shared-social a{width:26px;height:26px}.shared-social svg{width:18px;height:18px}}';document.head.appendChild(style);}
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
        html body > .shared-header .shared-nav { width:calc(100% - 28px)!important; }
        html body > .shared-header .shared-menu { gap:18px!important; }
        html body > .shared-header .shared-menu a { font-size:11px!important; }
      }
      @media(max-width:380px) { html body > .shared-header .shared-nav { width:calc(100% - 20px)!important; } }
    `;
    document.head.appendChild(unified);
  }
  if(section==='destinos'){
    const fix=document.createElement('style');
    fix.id='destinos-approved-hero-fix';
    fix.textContent=`.destinos-hero::after{background-image:url("${url('assets/images/destinos/hero-map-approved-inline.svg?v=2')}")!important;background-position:center!important;background-size:contain!important;background-repeat:no-repeat!important}`;
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