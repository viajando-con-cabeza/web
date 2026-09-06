(function(){
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function cardGuide(g){const score=g.rating==null?'—':String(g.rating).replace('.',',');return `<article class="country-guide-card"><div class="guide-image-wrap"><img src="${esc(g.image)}" alt="${esc(g.title)}"><div class="guide-score"><small>NUESTRA NOTA</small><strong>${esc(score)}</strong><span>/10</span></div></div><div class="country-guide-copy"><span class="tag">${esc(g.tag)}</span><h3>${esc(g.title).toUpperCase()}</h3><p>${esc(g.text)}</p><div class="country-meta"><span>◷ ${esc(g.days)}</span></div>${g.available&&g.href?`<a class="country-btn" href="${esc(g.href)}">VER GUÍA →</a>`:'<span class="country-soon">PRÓXIMAMENTE</span>'}</div></article>`}
  function cardItinerary(i){return `<article class="country-itinerary"><img src="${esc(i.image)}" alt="${esc(i.title)}"><div class="country-itinerary-copy"><span class="tag">${esc(i.tag)}</span><h3>${esc(i.title).toUpperCase()}</h3><p>${esc(i.text)}</p>${i.available&&i.href?`<a href="${esc(i.href)}">VER ITINERARIO →</a>`:'<span class="country-soon">PRÓXIMAMENTE</span>'}</div></article>`}
  function carousel(content,type){return `<div class="sweden-carousel-wrap"><button class="carousel-arrow prev" type="button" data-carousel-prev aria-label="Anterior">←</button><div class="sweden-carousel" data-carousel="${type}">${content}</div><button class="carousel-arrow next" type="button" data-carousel-next aria-label="Siguiente">→</button></div>`}
  function render(){
    const c=window.SWEDEN_CONTENT,root=document.getElementById('country-content'); if(!c||!root)return;
    document.title='Suecia | Guías, itinerarios y planifica tu viaje | Viajando con Cabeza';
    const facts=c.facts.map(x=>`<div class="country-fact"><strong>${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('');
    const guides=c.guides.map(cardGuide).join('');
    const itineraries=c.itineraries.map(cardItinerary).join('');
    const planning=c.planning.map(p=>`<div class="country-plan-card"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div>`).join('');
    const p=c.planner;
    root.innerHTML=`
      <section class="country-hero" style="background-image:url('${esc(c.heroImage)}')">
        <div class="country-hero-inner">
          <div class="country-breadcrumb"><a href="../../index.html">Inicio</a><span>›</span><a href="../index.html">Destinos</a><span>›</span><strong>Suecia</strong></div>
          <div class="country-hero-card"><div class="country-eyebrow">📍 EUROPA</div><h1>SUECIA</h1><p class="country-script">${esc(c.tagline)}</p><p class="country-desc">${esc(c.description)}</p><div class="country-facts">${facts}</div></div>
        </div>
      </section>
      <nav class="country-nav"><div class="country-nav-inner"><a href="#guias">GUÍAS</a><a href="#itinerarios">ITINERARIOS</a><a href="#planifica">PLANIFICA</a></div></nav>
      <main class="country-main sweden-main">
        <section id="guias"><div class="country-heading"><div><p>Descubre Suecia</p><h2>GUÍAS DE SUECIA</h2></div><span>Guías por ciudades y regiones. Mostramos tres a la vez y puedes descubrir el resto deslizando o con las flechas.</span></div>${carousel(guides,'guides')}</section>
        <section id="itinerarios" class="sweden-itineraries-section"><div class="country-heading"><div><p>Combina las piezas</p><h2>ITINERARIOS EN SUECIA</h2></div><span>Rutas de una sola ciudad o región y combinaciones de varias guías. Sin valoraciones: aquí importa que la ruta encaje contigo.</span></div>${carousel(itineraries,'itineraries')}</section>
        <section id="planifica"><div class="country-heading"><div><p>Tu viaje, a tu manera</p><h2>PLANIFICA SUECIA</h2></div><span>Hemos simplificado el planificador: mes, días, intereses y transporte. El mes no excluye automáticamente una zona; simplemente valora si es ideal o posible.</span></div>
          <div class="sweden-planner" data-sweden-planner>
            <div class="planner-copy"><span>PLANIFICADOR</span><h3>¿QUÉ VIAJE TE ENCAJA MEJOR?</h3><p>Sin IA y sin presupuesto: usamos el tiempo disponible, lo que te apetece, cómo te quieres mover y si la época es especialmente recomendable.</p></div>
            <form class="planner-form">
              <label>¿En qué mes viajas?<select name="month"><option value="">Aún no lo sé</option>${p.months.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></label>
              <label>¿Cuántos días tienes?<select name="days">${p.days.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></label>
              <label>¿Cómo quieres moverte?<select name="transport">${p.transports.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></label>
              <fieldset><legend>¿Qué te apetece?</legend><div class="planner-checks">${p.interests.map(x=>`<label><input type="checkbox" name="interest" value="${esc(x.value)}"><span>${esc(x.label)}</span></label>`).join('')}</div></fieldset>
              <button type="submit">ENCONTRAR MI VIAJE →</button>
            </form>
            <div class="planner-result" hidden aria-live="polite"></div>
          </div>
          <div class="country-planning sweden-planning">${planning}</div>
        </section>
      </main>`;
    setupCarousels(); setupPlanner(c);
  }
  function setupCarousels(){document.querySelectorAll('.sweden-carousel-wrap').forEach(wrap=>{const rail=wrap.querySelector('.sweden-carousel');const step=()=>Math.max(rail.clientWidth*.72,280);wrap.querySelector('[data-carousel-prev]').addEventListener('click',()=>rail.scrollBy({left:-step(),behavior:'smooth'}));wrap.querySelector('[data-carousel-next]').addEventListener('click',()=>rail.scrollBy({left:step(),behavior:'smooth'}));});}
  function setupPlanner(c){
    const box=document.querySelector('[data-sweden-planner]'); if(!box)return;
    const form=box.querySelector('form'),out=box.querySelector('.planner-result');
    const pool=[...c.itineraries.map(x=>({...x,type:'itinerary'})),...c.guides.map(x=>({...x,type:'guide'}))];
    form.addEventListener('submit',e=>{
      e.preventDefault(); const fd=new FormData(form); const days=parseInt(fd.get('days')||'0',10); const month=parseInt(fd.get('month')||'0',10); const transport=fd.get('transport')||''; const interests=fd.getAll('interest');
      const ranked=pool.map(item=>{let score=0;let season='';if(days>=item.minDays&&days<=item.maxDays)score+=8;else score+=Math.max(0,4-Math.abs(days-((item.minDays+item.maxDays)/2)));if(month){if((item.bestMonths||[]).includes(month)){score+=5;season='Época ideal'}else if((item.possibleMonths||[]).includes(month)){score+=1;season='Se puede viajar'}else{score-=4;season='Menos recomendable'}}if(transport&&item.transports.includes(transport))score+=3;else if(transport)score-=1;score+=interests.filter(x=>item.interests.includes(x)).length*4;return {...item,score,season}}).sort((a,b)=>b.score-a.score);
      const exact=ranked.find(x=>x.type==='itinerary'&&days>=x.minDays&&days<=x.maxDays&&x.score>0);
      let picks=[];
      if(exact){picks=[exact,...ranked.filter(x=>x!==exact).slice(0,2)]}
      else {let remaining=days;for(const x of ranked.filter(x=>x.type==='guide')){if(remaining<=0||picks.length>=3)break;const use=Math.min(x.maxDays,Math.max(x.minDays,Math.min(remaining,x.maxDays)));picks.push({...x,suggestedDays:use});remaining-=use}if(!picks.length)picks=ranked.slice(0,3)}
      const title=exact?esc(exact.title):`${days} DÍAS EN SUECIA`;
      const cards=picks.map((x,i)=>`<article><span>${i===0?'MEJOR ENCAJE':'TAMBIÉN TE PUEDE ENCAJAR'}</span><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p><small>${x.suggestedDays?`${x.suggestedDays} días recomendados`:`${x.minDays===x.maxDays?x.minDays:`${x.minDays}–${x.maxDays}`} días`}</small>${x.season?`<em class="season-fit ${x.season==='Época ideal'?'ideal':x.season==='Menos recomendable'?'low':'possible'}">${esc(x.season)}</em>`:''}${x.available&&x.href?`<a href="${esc(x.href)}">VER ${x.type==='guide'?'GUÍA':'ITINERARIO'} →</a>`:'<b>PRÓXIMAMENTE</b>'}</article>`).join('');
      out.innerHTML=`<div class="planner-result-head"><p class="country-script">Nuestra recomendación ♡</p><h3>${title}</h3><p>${exact?'Tenemos un itinerario que encaja directamente con el tiempo y las preferencias elegidas.':'No hace falta que exista una ruta exacta: combinamos varias guías para construir una propuesta.'}</p></div><div class="planner-results-grid">${cards}</div>`; out.hidden=false; out.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();