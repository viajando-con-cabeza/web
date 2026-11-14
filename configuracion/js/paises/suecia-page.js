(function(){
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
const W={experience:25,photogenic:20,things:15,food:10,transport:10,safety:10,value:10};
function rating(s){return Object.keys(W).reduce((n,k)=>n+(Number(s&&s[k])||0)*W[k]/100,0)}
function fmt(n){return n.toFixed(1).replace('.',',')}
function label(n){return n>=9.5?'Excepcional · Espectacular':n>=9?'Fantástico':n>=8.5?'Fabuloso':n>=8?'Muy bien':n>=7.5?'Bien':n>=7?'Agradable':'Mejorable'}

const VCC_ICONS='/configuracion/imagenes/iconos/paginas/itinerarios-iconos.svg';
const VCC_FLAG='/configuracion/imagenes/banderas/suecia.svg';
function cardIcon(type,extra){
 return '<svg'+(extra?' class="'+extra+'"':'')+' viewBox="0 0 24 24" aria-hidden="true"><use href="'+VCC_ICONS+'#it-'+type+'"></use></svg>';
}
function category(x,isGuide){
 if(x.cardCategory)return x.cardCategory;
 if(isGuide)return x.tag==='CIUDAD'?'CIUDADES':'REGIÓN';
 const value=String(x.tag||'').split('·').pop().trim();
 return value==='CIUDAD'?'CIUDADES':value==='GRAN RUTA'?'RUTA COMBINADA':value||'RUTA';
}
function itineraryDays(i){
 if(i.days)return i.days;
 const match=String(i.tag||'').match(/^(\d+)\s+D[IÍ]AS?/i);
 return match?match[1]+' '+(Number(match[1])===1?'día':'días'):'Duración pendiente';
}
function scoreMarkup(destination){
 if(!destination||!(destination.scores||Number.isFinite(destination.rating)))return '';
 const score=Number.isFinite(destination.rating)?destination.rating:rating(destination.scores);
 const n=fmt(score),word=label(score),name=destination.title;
 return '<span class="vcc-card-score" role="img" aria-label="Nota VCC del destino '+esc(name)+': '+n+' sobre 10, '+esc(word)+'"><strong>'+n+'</strong><small>'+esc(word)+'</small></span>';
}
function countryCard(x,isGuide){
 const published=!!(x.available&&x.href);
 const title=x.cardTitle||x.title,tag=category(x,isGuide);
 const duration=isGuide?x.days:itineraryDays(x);
 const price=x.budget||'Pendiente';
 const dest=isGuide?x:(window.COUNTRY_CONFIG&&window.COUNTRY_CONFIG.guides||[]).find(g=>g.title===x.scoreDestination);
 const score=published?scoreMarkup(dest):'';
 const photo=String(x.image||'/configuracion/imagenes/marca/logo-vcc.svg');
 const optimized=photo.includes('/__vcc_preview/visor/');
 const srcset=optimized?' srcset="'+esc(photo.replace('/__vcc_preview/visor/','/__vcc_preview/mini/'))+' 480w, '+esc(photo)+' 1800w" sizes="(max-width: 760px) 86vw, (max-width: 1100px) 48vw, 380px"':'';
 const icon=tag==='CIUDADES'?'category-city':'category-islands';
 const labelText=isGuide?'guía':'itinerario';
 const actionText=isGuide?'VER GUÍA':'VER ITINERARIO';
 const priceTitle=isGuide?'Presupuesto orientativo por persona y día':'Presupuesto total por persona';
 return '<article class="home-feature-card '+(isGuide?'home-guide-card':'home-route-card')+' vcc-it-card vcc-card-shared'+(isGuide?' vcc-guide-card':'')+'">'+
   '<div class="home-feature-photo vcc-it-photo">'+
     '<img class="vcc-card-cover-photo" src="'+esc(photo)+'"'+srcset+' alt="'+esc(title)+'" width="640" height="380" loading="lazy" decoding="async">'+score+
   '</div>'+
   '<div class="home-feature-details di-mini-body">'+
     '<span class="vcc-card-kicker">'+cardIcon(icon)+esc(tag)+'</span>'+
     '<h3 class="vcc-it-title">'+esc(title)+'</h3>'+
     '<div class="vcc-it-facts'+(isGuide?' vcc-it-guide-facts':'')+'">'+
       (isGuide?'':'<span class="di-route-stats">'+cardIcon('clock')+esc(duration)+'</span>'+
         '<span class="di-budget-row" title="'+priceTitle+'">'+cardIcon('coins','vcc-it-coins')+'<span class="di-price'+(x.budget?'':' di-price-pending')+'">'+esc(price)+'</span></span>')+
       '<span class="di-country-line home-card-country" title="Suecia"><img class="vcc-it-country-flag" src="'+VCC_FLAG+'" alt="Suecia" width="16" height="12"><span>Suecia</span></span>'+
     '</div>'+
     '<p class="home-card-desc di-mini-desc">'+esc(x.text||'Próximamente más detalles de esta ruta.')+'</p>'+
     (published?'<a class="home-feature-link vcc-it-cta" href="'+esc(x.href)+'" aria-label="Ver '+labelText+' de '+esc(title)+'">'+actionText+' →</a>':'<span class="home-feature-pending vcc-it-upcoming">PRÓXIMAMENTE</span>')+
   '</div></article>';
}
function guide(g){return countryCard(g,true)}
function itinerary(i){return countryCard(i,false)}
function itineraryPlaceholder(name){return countryCard({title:'Próximo itinerario',cardCategory:'NUEVA RUTA',text:'Estamos preparando una nueva ruta por '+name+'.',days:'Pendiente',available:false},false)}
function carousel(items,type){return `<div class="sweden-carousel-wrap vcc-four-carousel"><button class="carousel-arrow prev" data-carousel-prev aria-label="Anterior"><svg class="vcc-sweden-arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button><div class="sweden-carousel vcc-card-collection" data-carousel="${type}">${items}</div><button class="carousel-arrow next" data-carousel-next aria-label="Siguiente"><svg class="vcc-sweden-arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></div>`}
function prepCard(x){return `<article class="vcc-prep-card"><div class="vcc-prep-image"><img src="${esc(x.image)}" alt="${esc(x.alt||x.title)}" width="480" height="240" loading="lazy" decoding="async" data-fallback="${esc(String(x.image).replace('/__vcc_preview/mini/','/'))}"><span aria-hidden="true">${esc(x.icon)}</span></div><div class="vcc-prep-copy"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><div class="vcc-card-action">${x.available&&x.href?`<a class="vcc-prep-action" href="${esc(x.href)}">${esc(x.ctaLabel||'VER MÁS')}</a>`:'<span class="vcc-soon">PRÓXIMAMENTE</span>'}</div></div></article>`}
const FAQ_META=[['SEGURIDAD','♢'],['MEJOR ÉPOCA','▣'],['REQUISITOS','▤'],['CLIMA','☼'],['PAGOS','▱'],['CÓMO MOVERSE','✈'],['ENCHUFES','⌁'],['QUÉ LLEVAR','♙'],['PRESUPUESTO','€'],['CONECTIVIDAD','⌁']];
function faq(x,n){const m=x.category?[x.category,x.icon||'＋']:(FAQ_META[n]||['VCC','＋']);return `<details class="vcc-faq-item"><summary aria-expanded="false"><span class="vcc-faq-icon" aria-hidden="true">${esc(m[1])}</span><span class="vcc-faq-category">${esc(m[0])}</span><span class="vcc-faq-question">${esc(x.question)}</span><b aria-hidden="true">+</b></summary><div class="vcc-faq-answer"><p>${esc(x.answer)}</p></div></details>`}
function render(){const c=window.COUNTRY_CONFIG||window.SWEDEN_CONTENT,root=document.getElementById('country-content');if(!c||!root)return;const name=c.name||'Destino',upper=name.toUpperCase(),continent=(c.continent||'Europa').toUpperCase(),s=c.sections||{},guides=s.guides||{},its=s.itineraries||{},prep=s.preparation||{},insp=s.inspiration||{},fq=s.faq||{};const facts=(c.facts||[]).map(x=>`<div class="country-fact"><strong>${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('');const itin=[...(c.itineraries||[])];const min=its.minimumCards||4;while(itin.length<min)itin.push(null);root.innerHTML=`
<section class="country-hero" style="background-image:url('${esc(c.heroImage)}')"><div class="country-hero-inner"><div class="country-breadcrumb"><a href="${esc(c.paths&&c.paths.home||'../../index.html')}">Inicio</a><span>›</span><a href="${esc(c.paths&&c.paths.destinations||'../index.html')}">Destinos</a><span>›</span><strong>${esc(name)}</strong></div><div class="country-hero-card"><div class="country-eyebrow">📍 ${esc(continent)}</div><h1>${esc(upper)}</h1><p class="country-script">${esc(c.tagline)}</p><p class="country-desc">${esc(c.description)}</p><div class="country-facts">${facts}</div><a class="hero-start" href="#guias">EMPIEZA A EXPLORAR ↓</a></div></div></section>
<nav class="country-nav"><div class="country-nav-inner"><a href="#guias">GUÍAS</a><a href="#itinerarios">ITINERARIOS</a><a href="#planifica">PLANIFICA TU VIAJE</a><a href="#faq">PREGUNTAS FRECUENTES</a></div></nav>
<main class="country-main sweden-main vcc-sweden-page">
<section id="guias"><div class="country-heading"><div><p>${esc(guides.kicker||`Descubre ${name}`)}</p><h2>${esc(guides.title||'GUÍAS DE VIAJE')}</h2></div><span>${esc(guides.description||`Ciudades, regiones y rincones para descubrir ${name}.`)}</span></div>${carousel((c.guides||[]).map(guide).join(''),'guides')}${c.slug==='suecia'?'<div class="vcc-country-visit-cta"><a href="/destinos/suecia/que-visitar">VER TODOS LOS LUGARES QUE VISITAR <span aria-hidden="true">→</span></a></div>':''}</section>
<section id="itinerarios" class="sweden-itineraries-section"><div class="country-heading"><div><p>${esc(its.kicker||'Combina las piezas')}</p><h2>${esc(its.title||`ITINERARIOS EN ${upper}`)}</h2></div><span>${esc(its.description||`Rutas para organizar tu viaje por ${name}.`)}</span></div>${carousel(itin.map(x=>x?itinerary(x):itineraryPlaceholder(name)).join(''),'itineraries')}</section>
<section id="planifica" class="vcc-plan-section"><div class="country-heading"><div><p>${esc(prep.kicker||`Antes de viajar a ${name}`)}</p><h2>${esc(prep.title||'PLANIFICA TU VIAJE')}</h2></div><span>${esc(prep.description||`Información práctica para preparar tu viaje a ${name}.`)}</span></div><div class="vcc-prep-grid">${(c.preparation||[]).map(prepCard).join('')}</div></section>
</main>
<section class="vcc-inspiration"><img class="vcc-inspiration-photo" src="${esc(c.inspirationImage)}" alt="Fotografía de Gotemburgo, Suecia" loading="lazy" decoding="async" width="1600" height="600"><div><p>${esc(insp.line1||'Viaja mejor,')}</p><strong>${esc(insp.line2||'viaja con cabeza')}</strong></div></section>
<main class="country-main sweden-main vcc-sweden-page after-inspiration">
<section id="faq" class="vcc-faq-section"><div class="vcc-faq-top"><div><p class="vcc-faq-kicker">${esc(fq.kicker||'Antes de viajar')}</p><h2>${esc(fq.title||'PREGUNTAS FRECUENTES')}</h2><p class="vcc-faq-intro">${esc(fq.description||`Todo lo que necesitas saber para viajar a ${name} con tranquilidad.`)}</p></div><div class="vcc-faq-side"><p>${esc(fq.sideLine1||'Viajar mejor')}<br>${esc(fq.sideLine2||'empieza con')}<br>${esc(fq.sideLine3||'buenas preguntas')}</p><div class="vcc-faq-brandmark" aria-hidden="true"></div></div></div><div class="vcc-faq-grid">${(c.faq||[]).map(faq).join('')}</div></section>
</main>`;
root.querySelectorAll('#planifica .vcc-prep-image img[data-fallback]').forEach(img=>{
 img.addEventListener('error',()=>{
  const fallback=img.getAttribute('data-fallback');
  if(!fallback||img.getAttribute('src')===fallback)return;
  img.removeAttribute('data-fallback');
  img.src=fallback;
 });
});
const faqItems=[...root.querySelectorAll('.vcc-faq-item')];faqItems.forEach(item=>item.addEventListener('toggle',()=>{if(item.open)faqItems.forEach(other=>{if(other!==item&&other.open)other.open=false});const summary=item.querySelector('summary');const b=summary&&summary.querySelector('b');if(summary)summary.setAttribute('aria-expanded',item.open?'true':'false');if(b)b.textContent=item.open?'−':'+';}));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();