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
      <span>Las decisiones prácticas que necesitas antes de reservar, sin convertir la planificación en otro viaje.</span>
    </div>
    <div class="prep-grid">
      <article><i>☀️</i><span>CUÁNDO IR</span><h3>Elige la época</h3><p>Luz, clima y ambiente cambian mucho según la estación.</p></article>
      <article><i>🗓️</i><span>CUÁNTOS DÍAS</span><h3>Ajusta la duración</h3><p>Desde una escapada a Estocolmo hasta una ruta completa por el país.</p></article>
      <article><i>🚗</i><span>CÓMO RECORRERLA</span><h3>Coche, tren o city break</h3><p>La mejor opción depende de las zonas que quieras combinar.</p></article>
      <article><i>📍</i><span>QUÉ ZONAS ELEGIR</span><h3>Prioriza bien</h3><p>No necesitas verlo todo: elige según tu ritmo y tipo de viaje.</p></article>
    </div>
    <div class="prep-tool-intro">
      <p class="country-script">¿No sabes qué ruta elegir? ♡</p>
      <h3>ENCUENTRA TU RUTA</h3>
      <p>Dinos cuántos días tienes, qué te apetece encontrar y cómo quieres moverte.</p>
    </div>`;
  if(planner){
    section.appendChild(planner);
    const copy=planner.querySelector('.planner-copy');
    if(copy){copy.innerHTML='<span>PLANIFICADOR VCC</span><h3>TE AYUDAMOS A ENCAJAR LAS PIEZAS</h3>';}
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();