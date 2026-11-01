(function(){
  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  const SCORE_WEIGHTS={experience:25,photogenic:20,things:15,food:10,transport:10,safety:10,value:10};
  function rating(scores){return Object.keys(SCORE_WEIGHTS).reduce((n,k)=>n+(Number(scores&&scores[k])||0)*SCORE_WEIGHTS[k]/100,0)}
  function fmt(n){return n.toFixed(1).replace('.',',')}
  function scoreLabel(n){return n>=9.5?'Excepcional · Espectacular':n>=9?'Fantástico':n>=8.5?'Fabuloso':n>=8?'Muy bien':n>=7.5?'Bien':n>=7?'Agradable':'Mejorable'}
  function imageMarkup(item,className){
    const image=`<img src="${esc(item.image)}" alt="${esc(item.imageAlt||item.title||'')}" loading="lazy">`;
    const href=item.imageHref||item.href;
    return href&&item.available!==false?`<a class="${className||'country-image-link'}" href="${esc(href)}" aria-label="${esc(item.imageLabel||item.title||'Ver detalle')}" style="display:block;width:100%;color:inherit;text-decoration:none">${image}</a>`:image;
  }
  function guide(g){
    const r=rating(g.scores||{}),action=g.available&&g.href?`<a class="country-btn" href="${esc(g.href)}">${esc(g.ctaLabel||'VER GUÍA')} →</a>`:'<span class="country-soon">PRÓXIMAMENTE</span>';
    return `<article class="country-guide-card"><div class="guide-image-wrap">${imageMarkup(g,'country-card-image-link')}<div class="guide-score"><strong>${fmt(r)}</strong><span>${scoreLabel(r)}</span></div></div><div class="country-guide-copy"><span class="tag">${esc(g.tag)}</span><h3>${esc(g.title).toUpperCase()}</h3><p>${esc(g.text)}</p>${g.days?`<div class="country-meta"><span>◷ ${esc(g.days)}</span></div>`:''}<div class="vcc-card-action">${action}</div></div></article>`;
  }
  function itinerary(i){
    const action=i.available&&i.href?`<a class="country-btn" href="${esc(i.href)}">${esc(i.ctaLabel||'VER ITINERARIO')} →</a>`:'<span class="country-soon">PRÓXIMAMENTE</span>';
    return `<article class="country-itinerary">${imageMarkup(i,'country-card-image-link')}<div class="country-itinerary-copy"><span class="tag">${esc(i.tag)}</span><h3>${esc(i.title).toUpperCase()}</h3><p>${esc(i.text)}</p><div class="vcc-card-action">${action}</div></div></article>`;
  }
  function itineraryPlaceholder(c){return `<article class="country-itinerary vcc-placeholder"><div class="vcc-placeholder-image"><span>VCC</span></div><div class="country-itinerary-copy"><span class="tag">NUEVA RUTA</span><h3>PRÓXIMO ITINERARIO</h3><p>${esc(c.placeholderItineraryText||`Estamos preparando una nueva ruta por ${c.name} para ampliar las opciones de viaje.`)}</p><div class="vcc-card-action"><span class="country-soon">PRÓXIMAMENTE</span></div></div></article>`}
  function carousel(items,type){return `<div class="country-carousel-wrap sweden-carousel-wrap vcc-four-carousel"><button class="carousel-arrow prev" data-carousel-prev aria-label="Anterior">←</button><div class="country-carousel sweden-carousel" data-carousel="${esc(type)}">${items}</div><button class="carousel-arrow next" data-carousel-next aria-label="Siguiente">→</button></div>`}
  function prepCard(x){
    const action=x.available&&x.href?`<a class="vcc-prep-action" href="${esc(x.href)}">${esc(x.ctaLabel||'VER MÁS')} →</a>`:'<span class="vcc-soon">PRÓXIMAMENTE</span>';
    return `<article class="vcc-prep-card"><div class="vcc-prep-image">${imageMarkup(x,'country-card-image-link')}<span>${esc(x.icon)}</span></div><div class="vcc-prep-copy"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><div class="vcc-card-action">${action}</div></div></article>`;
  }
  function faq(x){return `<details class="vcc-faq-item"><summary aria-expanded="false"><span class="vcc-faq-icon" aria-hidden="true">${esc(x.icon||'＋')}</span><span class="vcc-faq-category">${esc(x.category||'INFORMACIÓN')}</span><span class="vcc-faq-question">${esc(x.question)}</span><b aria-hidden="true">+</b></summary><div class="vcc-faq-answer"><p>${esc(x.answer)}</p></div></details>`}
  function enabled(section){return section!==false&&(!section||section.enabled!==false)}
  function render(){
    const c=window.COUNTRY_CONFIG,root=document.getElementById('country-content');
    if(!c||!root)return;
    document.body.dataset.country=c.slug||'';
    const s=c.sections||{};
    const facts=(c.facts||[]).map(x=>`<div class="country-fact"><strong>${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('');
    const nav=[];
    if(enabled(s.guides)&&c.guides?.length)nav.push(['guias',s.guides?.navLabel||'GUÍAS']);
    if(enabled(s.itineraries)&&c.itineraries?.length)nav.push(['itinerarios',s.itineraries?.navLabel||'ITINERARIOS']);
    if(enabled(s.preparation)&&c.preparation?.length)nav.push(['planifica',s.preparation?.navLabel||'PLANIFICA TU VIAJE']);
    if(enabled(s.faq)&&c.faq?.length)nav.push(['faq',s.faq?.navLabel||'PREGUNTAS FRECUENTES']);
    const parts=[];
    parts.push(`<section class="country-hero" style="background-image:url('${esc(c.heroImage)}')"><div class="country-hero-inner"><div class="country-breadcrumb"><a href="${esc(c.paths?.home||'../../index.html')}">Inicio</a><span>›</span><a href="${esc(c.paths?.destinations||'../index.html')}">Destinos</a><span>›</span><strong>${esc(c.name)}</strong></div><div class="country-hero-card"><div class="country-eyebrow">📍 ${esc((c.continent||'').toUpperCase())}</div><h1>${esc(c.name.toUpperCase())}</h1><p class="country-script">${esc(c.tagline)}</p><p class="country-desc">${esc(c.description)}</p><div class="country-facts">${facts}</div><a class="hero-start" href="#${nav[0]?.[0]||'guias'}">${esc(c.heroCta||'EMPIEZA A EXPLORAR ↓')}</a></div></div></section>`);
    if(nav.length)parts.push(`<nav class="country-nav"><div class="country-nav-inner">${nav.map(([id,label])=>`<a href="#${id}">${esc(label)}</a>`).join('')}</div></nav>`);
    const main=[];
    if(enabled(s.guides)&&c.guides?.length){const x=s.guides||{};main.push(`<section id="guias"><div class="country-heading"><div><p>${esc(x.kicker||`Descubre ${c.name}`)}</p><h2>${esc(x.title||'GUÍAS DE VIAJE')}</h2></div><span>${esc(x.description||`Ciudades, regiones y rincones para encontrar el ${c.name} que mejor encaja contigo.`)}</span></div>${carousel(c.guides.map(guide).join(''),'guides')}<button class="vcc-rating-info" type="button" data-rating-info aria-expanded="false">${esc(x.ratingLabel||'¿Cómo calculamos la Nota VCC?')} <span>＋</span></button><div class="vcc-rating-note" data-rating-note hidden><strong>${esc(x.ratingTitle||'Una nota editorial VCC.')}</strong> ${esc(x.ratingText||'Valoramos qué ver y hacer, gastronomía, transporte, seguridad, calidad-precio, fotogenia y experiencia global.')}</div></section>`)}
    if(enabled(s.itineraries)&&c.itineraries?.length){const x=s.itineraries||{},itin=[...c.itineraries];while(itin.length<(x.minimumCards||4))itin.push(null);main.push(`<section id="itinerarios" class="sweden-itineraries-section"><div class="country-heading"><div><p>${esc(x.kicker||'Combina las piezas')}</p><h2>${esc(x.title||`ITINERARIOS EN ${c.name.toUpperCase()}`)}</h2></div><span>${esc(x.description||'Rutas listas para organizar el viaje según los días que tengas.')}</span></div>${carousel(itin.map(i=>i?itinerary(i):itineraryPlaceholder(c)).join(''),'itineraries')}</section>`)}
    if(enabled(s.preparation)&&c.preparation?.length){const x=s.preparation||{};main.push(`<section id="planifica" class="vcc-plan-section"><div class="country-heading"><div><p>${esc(x.kicker||`Antes de viajar a ${c.name}`)}</p><h2>${esc(x.title||'PLANIFICA TU VIAJE')}</h2></div><span>${esc(x.description||`Información práctica y nuestra opinión para preparar ${c.name} sin perder tiempo en lo que realmente importa.`)}</span></div><div class="vcc-prep-grid">${c.preparation.map(prepCard).join('')}</div></section>`)}
    if(enabled(s.inspiration)&&c.inspirationImage){const x=s.inspiration||{};main.push(`<section class="vcc-inspiration" style="background-image:url('${esc(c.inspirationImage)}')"><div><p>${esc(x.line1||'Viaja mejor,')}</p><strong>${esc(x.line2||'viaja con cabeza')}</strong></div></section>`)}
    if(enabled(s.faq)&&c.faq?.length){const x=s.faq||{};main.push(`<section id="faq" class="vcc-faq-section"><div class="vcc-faq-top"><div><p class="vcc-faq-kicker">${esc(x.kicker||'Antes de viajar')}</p><h2>${esc(x.title||'PREGUNTAS FRECUENTES')}</h2><p class="vcc-faq-intro">${esc(x.description||`Todo lo que necesitas saber para viajar a ${c.name} con tranquilidad.`)}</p></div><div class="vcc-faq-side"><p>${esc(x.sideLine1||'Viajar mejor')}<br>${esc(x.sideLine2||'empieza con')}<br>${esc(x.sideLine3||'buenas preguntas')}</p><div class="vcc-faq-brandmark" aria-hidden="true"></div></div></div><div class="vcc-faq-grid">${c.faq.map(faq).join('')}</div></section>`)}
    parts.push(`<main class="country-main country-template-main sweden-main vcc-sweden-page">${main.join('')}</main>`);
    root.innerHTML=parts.join('');
    window.dispatchEvent(new CustomEvent('vcc:country-rendered',{detail:{country:c.slug||c.name}}));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();