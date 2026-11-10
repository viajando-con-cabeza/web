/* Viajando con Cabeza · Vuelos: filtros, carrusel y cálculo manual de precios. */
(()=>{
  'use strict';
  const root=document.querySelector('.vl-page');
  if(!root)return;
  const money=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track=root.querySelector('[data-air-track]');
  const cards=Array.from(root.querySelectorAll('[data-airline-card]'));
  const filterButtons=Array.from(root.querySelectorAll('[data-continent-filter]'));
  const count=root.querySelector('[data-visible-count]');
  const title=root.querySelector('[data-region-title]');
  const description=root.querySelector('[data-region-description]');
  const position=root.querySelector('[data-carousel-position]');
  const prev=root.querySelector('[data-carousel-prev]');
  const next=root.querySelector('[data-carousel-next]');
  const regionLabels={all:'todas las regiones',europa:'Europa',america:'América',asia:'Asia',oceania:'Oceanía'};
  let current='all';
  function visibleCards(){return cards.filter(card=>!card.hidden)}
  function updateArrows(){
    if(!track)return;
    const list=visibleCards();
    const max=Math.max(0,track.scrollWidth-track.clientWidth);
    if(prev)prev.disabled=track.scrollLeft<3;
    if(next)next.disabled=track.scrollLeft>=max-3;
    if(position){
      if(!list.length){position.textContent='0 / 0';return;}
      const first=list.findIndex(card=>card.getBoundingClientRect().right>track.getBoundingClientRect().left+5);
      position.textContent=String(Math.max(0,first)+1)+' / '+String(list.length);
    }
  }
  function applyFilter(key,scrollToReviews){
    if(!Object.hasOwn(regionLabels,key))key='all';
    current=key;
    filterButtons.forEach(btn=>{
      const selected=btn.dataset.continentFilter===key;
      btn.setAttribute('aria-pressed',String(selected));
      btn.classList.toggle('active',selected);
    });
    cards.forEach(card=>{
      const parts=card.dataset.continents.split(' ');
      card.hidden=key!=='all'&&!parts.includes(key);
    });
    const shown=visibleCards().length;
    if(count)count.textContent=shown;
    if(title)title.textContent=key==='all'?'Nuestra experiencia con las aerolíneas':'Nuestra experiencia en '+regionLabels[key];
    if(description)description.textContent=key==='all'?'Las 16 aerolíneas diferentes con las que hemos volado, sin puntuaciones ni rankings.':'Compañías que hemos utilizado en viajes relacionados con '+regionLabels[key]+'. Algunas aparecen en más de un continente.';
    if(track)track.scrollLeft=0;
    requestAnimationFrame(updateArrows);
    if(scrollToReviews)root.querySelector('#aerolineas')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
  }
  filterButtons.forEach(button=>button.addEventListener('click',()=>applyFilter(button.dataset.continentFilter,button.hasAttribute('data-continent-card'))));
  function page(step){
    if(!track)return;
    const card=visibleCards()[0];
    const distance=card?card.getBoundingClientRect().width+13:track.clientWidth;
    track.scrollBy({left:distance*step,behavior:reduced?'instant':'smooth'});
  }
  prev?.addEventListener('click',()=>page(-1));
  next?.addEventListener('click',()=>page(1));
  track?.addEventListener('scroll',updateArrows,{passive:true});
  window.addEventListener('resize',updateArrows,{passive:true});

  const panelA=root.querySelector('[data-flight="a"]');
  const panelB=root.querySelector('[data-flight="b"]');
  const compareToggle=root.querySelector('[data-compare-toggle]');
  const compareResult=root.querySelector('[data-compare-result]');
  const costs=['base','baggage','seat','transfer','food'];
  const number=(str)=>Math.max(0,Number(str)||0);
  const totals={a:0,b:0};
  const hasBase=(panel)=>panel.querySelector('[data-cost="base"]').value.trim()!=='';
  function compute(panel){
    if(!panel)return 0;
    const breakdown=costs.map(key=>{
      const control=panel.querySelector('[data-cost="'+key+'"]');
      const value=number(control?.value);
      const output=panel.querySelector('[data-breakdown="'+key+'"]');
      if(output)output.textContent=money.format(value);
      return value;
    });
    const value=breakdown.reduce((a,b)=>a+b,0);
    const total=panel.querySelector('[data-total]');
    if(total)total.textContent=money.format(value);
    return value;
  }
  function updateCalculator(){
    totals.a=compute(panelA);
    totals.b=compute(panelB);
    if(!compareResult||!panelB)return;
    if(panelB.hidden){compareResult.hidden=true;return;}
    compareResult.hidden=false;
    if(!hasBase(panelA)||!hasBase(panelB)){
      compareResult.textContent='Introduce el precio de los dos billetes para ver la diferencia.';
      return;
    }
    const difference=Math.abs(totals.a-totals.b);
    if(difference<0.005){
      compareResult.textContent='Las dos opciones tienen el mismo coste total con los importes introducidos.';
    }else{
      const cheaper=totals.a<totals.b?'A':'B';
      compareResult.textContent='El vuelo '+cheaper+' resulta '+money.format(difference)+' más económico por persona con estos importes.';
    }
  }
  root.querySelectorAll('[data-flight] input,[data-flight] select').forEach(el=>{
    el.addEventListener(el.tagName==='SELECT'?'change':'input',updateCalculator);
  });
  compareToggle?.addEventListener('click',()=>{
    const show=panelB.hidden;
    panelB.hidden=!show;
    compareToggle.setAttribute('aria-expanded',String(show));
    compareToggle.textContent=show?'Quitar segundo vuelo':'Comparar con otro vuelo';
    updateCalculator();
    if(show)panelB.querySelector('select')?.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-remove-second]').forEach(btn=>btn.addEventListener('click',()=>{
    panelB.hidden=true;
    compareToggle.setAttribute('aria-expanded','false');
    compareToggle.textContent='Comparar con otro vuelo';
    updateCalculator();
    compareToggle.focus({preventScroll:true});
  }));
  root.querySelectorAll('[data-use-airline]').forEach(btn=>btn.addEventListener('click',()=>{
    const select=panelA?.querySelector('[data-airline-select]');
    if(!select)return;
    select.value=btn.dataset.useAirline;
    updateCalculator();
    root.querySelector('#calculadora')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
  }));
  applyFilter('all',false);
  updateCalculator();
})();