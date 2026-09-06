(function(){
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function cardGuide(g){return `<article class="country-guide-card"><img src="${esc(g.image)}" alt="${esc(g.title)}"><div class="country-guide-copy"><span class="tag">${esc(g.tag)}</span><h3>${esc(g.title).toUpperCase()}</h3><p>${esc(g.text)}</p><div class="country-meta"><span>◷ ${esc(g.days)}</span></div>${g.available&&g.href?`<a class="country-btn" href="${esc(g.href)}">VER GUÍA →</a>`:'<span class="country-soon">PRÓXIMAMENTE</span>'}</div></article>`}
  function cardItinerary(i){return `<article class="country-itinerary"><img src="${esc(i.image)}" alt="${esc(i.title)}"><div class="country-itinerary-copy"><span class="tag">${esc(i.tag)}</span><h3>${esc(i.title).toUpperCase()}</h3><p>${esc(i.text)}</p>${i.available&&i.href?`<a href="${esc(i.href)}">VER ITINERARIO →</a>`:'<span class="country-soon">PRÓXIMAMENTE</span>'}</div></article>`}
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
        <section id="guias"><div class="country-heading"><div><p>Descubre Suecia</p><h2>GUÍAS DE SUECIA</h2></div><span>Guías por ciudades y regiones. Cada una funciona de forma independiente y también puede formar parte de una ruta más larga.</span></div><div class="country-guide-grid">${guides}</div></section>
        <section id="itinerarios" class="sweden-itineraries-section"><div class="country-heading"><div><p>Combina las piezas</p><h2>ITINERARIOS EN SUECIA</h2></div><span>Rutas de una sola ciudad o región y también combinaciones de varias guías: desde Estocolmo en 3 días hasta una ruta completa por Suecia.</span></div><div class="country-itineraries">${itineraries}</div></section>
        <section id="planifica"><div class="country-heading"><div><p>Tu viaje, a tu manera</p><h2>PLANIFICA SUECIA</h2></div><span>Responde unas preguntas y te recomendamos qué guías o itinerarios encajan mejor. Si no existe una ruta exacta, combinamos varias piezas.</span></div>
          <div class="sweden-planner" data-sweden-planner>
            <div class="planner-copy"><span>PLANIFICADOR</span><h3>¿CÓMO QUIERES QUE SEA TU VIAJE?</h3><p>No utiliza IA: compara tus preferencias con nuestras guías e itinerarios.</p></div>
            <form class="planner-form">
              <label>¿Cuándo viajas?<select name="month"><option value="">Me da igual</option>${p.months.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></label>
              <label>¿Cuántos días tienes?<select name="days">${p.days.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></label>
              <label>¿Qué presupuesto tienes?<select name="budget"><option value="">Me da igual</option>${p.budgets.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></label>
              <label>¿Cómo quieres moverte?<select name="transport"><option value="">Me da igual</option>${p.transports.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></label>
              <fieldset><legend>¿Qué te apetece?</legend><div class="planner-checks">${p.interests.map(x=>`<label><input type="checkbox" name="interest" value="${esc(x.value)}"><span>${esc(x.label)}</span></label>`).join('')}</div></fieldset>
              <button type="submit">ENCONTRAR MI VIAJE →</button>
            </form>
            <div class="planner-result" hidden aria-live="polite"></div>
          </div>
          <div class="country-planning sweden-planning">${planning}</div>
        </section>
      </main>`;
    setupPlanner(c);
  }
  function setupPlanner(c){
    const box=document.querySelector('[data-sweden-planner]'); if(!box)return;
    const form=box.querySelector('form'),out=box.querySelector('.planner-result');
    const pool=[...c.itineraries.map(x=>({...x,type:'itinerary'})),...c.guides.map(x=>({...x,type:'guide'}))];
    form.addEventListener('submit',e=>{
      e.preventDefault(); const fd=new FormData(form); const days=parseInt(fd.get('days')||'0',10); const month=fd.get('month')||''; const budget=fd.get('budget')||''; const transport=fd.get('transport')||''; const interests=fd.getAll('interest');
      const ranked=pool.map(item=>{let score=0;if(days>=item.minDays&&days<=item.maxDays)score+=7;else score+=Math.max(0,4-Math.abs(days-((item.minDays+item.maxDays)/2)));if(month&&item.months.includes(month))score+=3;if(budget&&item.budgets.includes(budget))score+=2;if(transport&&item.transports.includes(transport))score+=2;score+=interests.filter(x=>item.interests.includes(x)).length*3;return {...item,score}}).sort((a,b)=>b.score-a.score);
      const exact=ranked.find(x=>x.type==='itinerary'&&days>=x.minDays&&days<=x.maxDays&&x.score>0);
      let picks=[];
      if(exact){picks=[exact,...ranked.filter(x=>x!==exact).slice(0,2)]}
      else {let remaining=days;for(const x of ranked.filter(x=>x.type==='guide')){if(remaining<=0||picks.length>=3)break;const use=Math.min(x.maxDays,Math.max(x.minDays,Math.min(remaining,x.maxDays)));picks.push({...x,suggestedDays:use});remaining-=use} if(!picks.length)picks=ranked.slice(0,3)}
      const title=exact?esc(exact.title):`${days} DÍAS EN SUECIA`;
      const cards=picks.map((x,i)=>`<article><span>${i===0?'MEJOR ENCAJE':'TAMBIÉN TE PUEDE ENCAJAR'}</span><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p><small>${x.suggestedDays?`${x.suggestedDays} días recomendados para esta combinación`:`${x.minDays===x.maxDays?x.minDays:`${x.minDays}–${x.maxDays}`} días`}</small>${x.available&&x.href?`<a href="${esc(x.href)}">VER ${x.type==='guide'?'GUÍA':'ITINERARIO'} →</a>`:'<b>PRÓXIMAMENTE</b>'}</article>`).join('');
      out.innerHTML=`<div class="planner-result-head"><p class="country-script">Nuestra recomendación ♡</p><h3>${title}</h3><p>${exact?'Tenemos un itinerario que encaja directamente con tus preferencias.':'No hace falta que exista un único itinerario exacto: puedes combinar estas guías para construir tu ruta.'}</p></div><div class="planner-results-grid">${cards}</div>`; out.hidden=false; out.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();