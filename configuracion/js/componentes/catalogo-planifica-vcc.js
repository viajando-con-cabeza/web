/* VCC · Cerca i filtres compartits per catàlegs de Planifica; fotos en el component de galeria existent. */
(() => {
 'use strict';
 const root=document.querySelector('[data-vcc-planifica-catalog]');
 if(!root)return;
 const cards=[...root.querySelectorAll('[data-it-card]')];
 const search=root.querySelector('[data-vcc-catalog-search]');
 const type=root.querySelector('[data-vcc-catalog-type]');
 const continent=root.querySelector('[data-vcc-catalog-continent]');
 const budget=root.querySelector('[data-vcc-catalog-budget]');
 const reset=root.querySelector('[data-vcc-catalog-reset]');
 const count=root.querySelector('[data-vcc-catalog-count]');
 const empty=root.querySelector('[data-vcc-catalog-empty]');
 const kind=root.dataset.vccPlanificaCatalog==='presupuestos'?'presupuesto':'guía';
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
    &&(!budget||matchPrice(card.dataset.daily,budget.value));
   card.hidden=!ok;
   if(ok)visible++;
  }
  count.textContent=visible+' '+kind+(visible===1?'':kind==='guía'?'s':'s');
  empty.hidden=visible>0;
 }
 search.addEventListener('input',apply);
 [type,continent,budget].filter(Boolean).forEach(el=>el.addEventListener('change',apply));
 if(reset)reset.addEventListener('click',()=>{
  search.value='';
  [type,continent,budget].filter(Boolean).forEach(el=>el.value='all');
  apply();search.focus();
 });
 apply();
})();