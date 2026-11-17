/* VCC · Cerca i filtres compartits per catàlegs de Planifica; fotos en el component de galeria existent. */
(() => {
 'use strict';
 const root=document.querySelector('[data-vcc-planifica-catalog]');
 if(!root)return;
 const cards=[...root.querySelectorAll('[data-it-card]')];
 // Les fitxes de Presupuestos i Qué llevar són generades automàticament.
 // Mou la tipologia sota la foto com a les Guías, sense duplicar etiquetes,
 // i manté l'estructura visual comuna després de cada regeneració.
 for(const card of cards){
   if(!card.matches('.budget-card,.packing-card'))continue;
   const picture=card.querySelector('.di-mini-photo.vcc-it-photo');
   const body=card.querySelector('.di-mini-body');
   const overline=picture?.querySelector('.di-mini-tag');
   if(body&&overline&&!body.querySelector('.vcc-card-kicker')){
     overline.classList.remove('di-mini-tag');
     overline.classList.add('vcc-card-kicker');
     body.insertBefore(overline,body.firstChild);
   }
   const cta=body?.querySelector('.vcc-it-cta');
   cta?.querySelector('[aria-hidden="true"]')?.remove();
 }

 const search=root.querySelector('[data-vcc-catalog-search]');
 const type=root.querySelector('[data-vcc-catalog-type]');
 const continent=root.querySelector('[data-vcc-catalog-continent]');
 const country=root.querySelector('[data-vcc-catalog-country]');
 const budget=root.querySelector('[data-vcc-catalog-budget]');
 const reset=root.querySelector('[data-vcc-catalog-reset]');
 const count=root.querySelector('[data-vcc-catalog-count]');
 const empty=root.querySelector('[data-vcc-catalog-empty]');
 const mode=root.dataset.vccPlanificaCatalog;
 const singular=mode==='regiones'?'región':mode==='presupuestos'?'presupuesto':mode==='itinerarios'?'itinerario':mode==='rutas'?'ruta':'guía';
 const plural=mode==='regiones'?'regiones':mode==='presupuestos'?'presupuestos':mode==='itinerarios'?'itinerarios':mode==='rutas'?'rutas':'guías';
 if(!search||!count||!empty)return;
 const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
 function matchPrice(value,band){
  if(!band||band==='all')return true;
  const price=Number(value);
  if(!Number.isFinite(price)||price<0)return false;
  if(band==='201+')return price>200;
  const [min,max]=band.split('-').map(Number);
  return Number.isFinite(min)&&Number.isFinite(max)&&price>=min&&price<=max;
 }
 function apply(){
  const q=norm(search.value);
  let visible=0;
  for(const card of cards){
   const ok=norm(card.dataset.itSearch||card.textContent).includes(q)
    &&(!type||type.value==='all'||(card.dataset.type||'').split(/\s+/).includes(type.value))
    &&(!continent||continent.value==='all'||card.dataset.continent===continent.value)
    &&(!country||country.value==='all'||(card.dataset.countries||'').split('|').includes(country.value))
    &&(!budget||matchPrice(card.dataset.daily,budget.value));
   card.hidden=!ok;
   if(ok)visible++;
  }
  count.textContent=visible+' '+(visible===1?singular:plural);
  empty.hidden=visible>0;
 }
 search.addEventListener('input',apply);
 [type,continent,country,budget].filter(Boolean).forEach(el=>el.addEventListener('change',apply));
 if(reset)reset.addEventListener('click',()=>{
  search.value='';
  [type,continent,country,budget].filter(Boolean).forEach(el=>el.value='all');
  apply();search.focus();
 });
 apply();
})();