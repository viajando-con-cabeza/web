(function(){
function init(){
  const nav=document.querySelector('.country-nav');
  const links=[...document.querySelectorAll('.country-nav a')];
  const sections=['guias','itinerarios','planifica'].map(id=>document.getElementById(id)).filter(Boolean);
  const planLink=links.find(a=>a.getAttribute('href')==='#planifica');
  if(planLink) planLink.textContent='PREPARA TU VIAJE';

  links.forEach(a=>a.addEventListener('click',()=>{
    links.forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
  }));
  if(links[0]) links[0].classList.add('active');

  const setActive=()=>{
    const y=(nav?nav.getBoundingClientRect().height:0)+120;
    let current=sections[0];
    sections.forEach(s=>{if(s.getBoundingClientRect().top<=y) current=s});
    links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+current.id));
  };
  window.addEventListener('scroll',setActive,{passive:true});
  window.addEventListener('resize',setActive);
  setActive();

  const section=document.getElementById('planifica');
  if(!section) return;
  const planner=section.querySelector('.sweden-planner');
  section.innerHTML=`
    <div class="country-heading prep-heading">
      <div><p>Organiza Suecia a tu manera ♡</p><h2>PREPARA TU VIAJE</h2></div>
      <span>Las decisiones prácticas que necesitas antes de reservar, con nuestra recomendación para una primera ruta por Suecia.</span>
    </div>
    <div class="prep-grid">
      <article class="prep-pick"><div class="prep-icon">☀️</div><span>CUÁNDO IR</span><h3>Verano</h3><p>Días larguísimos, mejor ritmo para carretera, costa y naturaleza.</p><strong>VCC RECOMIENDA · JUNIO–AGOSTO</strong><small>Invierno si buscas nieve y un viaje completamente distinto.</small></article>
      <article class="prep-pick"><div class="prep-icon">🗓️</div><span>CUÁNTOS DÍAS</span><h3>7–10 días</h3><p>Para una primera vez, permite combinar Estocolmo con otra zona sin ir corriendo.</p><strong>VCC RECOMIENDA · 7–10 DÍAS</strong><small>Con 14 días, el road trip gana muchísimo.</small></article>
      <article class="prep-pick"><div class="prep-icon">🚗</div><span>CÓMO RECORRERLA</span><h3>Coche + ciudad</h3><p>Transporte público en las ciudades y coche cuando empiezan costa, lagos y pueblos.</p><strong>VCC RECOMIENDA · COMBINAR</strong><small>Solo Estocolmo: no alquilaríamos coche.</small></article>
      <article class="prep-pick"><div class="prep-icon">📍</div><span>QUÉ ZONAS ELEGIR</span><h3>Ciudad + naturaleza</h3><p>Para una primera ruta, no intentaríamos verlo todo: contrastar dos Suecias funciona mejor.</p><strong>VCC RECOMIENDA · ESTOCOLMO + 1 ZONA</strong><small>Costa Oeste o Dalarna según el tipo de viaje.</small></article>
    </div>
    <div class="prep-tool-intro">
      <p class="country-script">¿No sabes qué ruta elegir? ♡</p>
      <h3>ENCUENTRA TU RUTA</h3>
      <p>Cuatro decisiones rápidas. Nosotros cruzamos tus preferencias y te proponemos la ruta que mejor encaja.</p>
    </div>`;
  if(planner){
    section.appendChild(planner);
    const copy=planner.querySelector('.planner-copy');
    if(copy){copy.innerHTML='<span>PLANIFICADOR VCC</span><h3>DISEÑA TU SUECIA IDEAL</h3><p>Sin veinte preguntas: solo lo que realmente cambia una ruta.</p>';}
    const form=planner.querySelector('.planner-form');
    if(form){
      const transport=form.querySelector('select[name="transport"]');
      const transportLabel=transport&&transport.closest('label');
      const fieldset=form.querySelector('fieldset');
      if(transportLabel) transportLabel.classList.add('planner-step','step-transport');
      if(fieldset) fieldset.classList.add('planner-step','step-interests');
      const days=form.querySelector('select[name="days"]');
      const daysLabel=days&&days.closest('label');
      if(daysLabel) daysLabel.classList.add('planner-step','step-days');
      if(fieldset&&transportLabel) form.insertBefore(fieldset,transportLabel);
      const season=document.createElement('label');
      season.className='planner-step step-season';
      season.innerHTML='<b>4</b> ¿En qué época viajarás?<select name="season"><option value="verano">☀️ Verano</option><option value="primavera">🌷 Primavera</option><option value="otono">🍂 Otoño</option><option value="invierno">❄️ Invierno</option><option value="">Todavía no lo sé</option></select>';
      const button=form.querySelector('button');
      form.insertBefore(season,button);
      if(daysLabel) daysLabel.querySelector('b').textContent='1';
      if(fieldset) fieldset.querySelector('legend b').textContent='2';
      if(transportLabel) transportLabel.querySelector('b').textContent='3';
      if(button) button.textContent='DESCUBRIR MI RUTA →';
      setupSeasonAwarePlanner(planner,form);
    }
  }
}

function setupSeasonAwarePlanner(box,form){
  const c=window.SWEDEN_CONTENT;
  const out=box.querySelector('.planner-result');
  if(!c||!out)return;
  const pool=[...c.itineraries,...c.guides];
  const seasonFit={
    'Estocolmo':{verano:4,primavera:3,otono:2,invierno:3},
    'Gotemburgo':{verano:4,primavera:3,otono:2,invierno:1},
    'Costa Oeste':{verano:6,primavera:2,otono:0,invierno:-9},
    'Dalarna':{verano:4,primavera:2,otono:3,invierno:2},
    'Zona de los Lagos':{verano:5,primavera:2,otono:2,invierno:-5},
    'Estocolmo en 3 días':{verano:4,primavera:3,otono:2,invierno:3},
    'Estocolmo + Dalarna en 7 días':{verano:6,primavera:2,otono:3,invierno:1},
    'Suecia en 14 días':{verano:7,primavera:1,otono:1,invierno:-10}
  };
  const seasonNote=(title,season)=>{
    if(!season)return 'La época no ha condicionado esta recomendación.';
    if(season==='invierno'&&(title==='Costa Oeste'||title==='Zona de los Lagos'||title==='Suecia en 14 días'))return 'En invierno no priorizaríamos esta ruta: pierde puntos por época.';
    if(season==='verano'&&(title==='Costa Oeste'||title==='Zona de los Lagos'||title==='Suecia en 14 días'))return 'El verano favorece especialmente esta ruta.';
    return 'La época elegida encaja razonablemente con esta opción.';
  };
  form.onsubmit=e=>{
    e.preventDefault();
    const fd=new FormData(form),days=+fd.get('days'),move=fd.get('transport'),season=fd.get('season'),likes=fd.getAll('interest');
    const ranked=pool.map(x=>{
      let s=days>=x.minDays&&days<=x.maxDays?8:Math.max(0,5-Math.abs(days-(x.minDays+x.maxDays)/2));
      if(move)s+=x.transports.includes(move)?4:-2;
      s+=likes.filter(v=>x.interests.includes(v)).length*4;
      if(season&&seasonFit[x.title])s+=seasonFit[x.title][season]||0;
      if(season==='invierno'&&x.interests.includes('costa'))s-=3;
      if(season==='invierno'&&x.interests.includes('roadtrip')&&x.title!=='Dalarna')s-=2;
      return{x,s};
    }).sort((a,b)=>b.s-a.s).slice(0,3);
    const top=ranked[0].x;
    out.innerHTML=`<div class="planner-result-head"><p class="country-script">Tu Suecia empieza a tomar forma ♡</p><h3>${top.title.toUpperCase()}</h3><p>Hemos cruzado días, intereses, transporte y época del año. La estación ahora sí cambia el resultado cuando una ruta pierde sentido fuera de temporada.</p></div><div class="planner-results-grid">${ranked.map((r,i)=>`<article><span>${i?'TAMBIÉN TE PUEDE ENCAJAR':'TU MEJOR ENCAJE'}</span><h4>${r.x.title}</h4><p>${r.x.text}</p><small>${seasonNote(r.x.title,season)}</small><b>${r.x.minDays===r.x.maxDays?r.x.minDays:r.x.minDays+'–'+r.x.maxDays} DÍAS · ${i?'ALTERNATIVA':'RECOMENDADA'}</b></article>`).join('')}</div>`;
    out.hidden=false;out.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();