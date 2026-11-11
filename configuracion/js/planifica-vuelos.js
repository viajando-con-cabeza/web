/* VCC · Vuelos · Un único filtro y calculadora compacta de hasta 5 vuelos. */
(()=>{
 'use strict';
 const root=document.querySelector('.vl-page');
 if(!root)return;
 const money=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const motion=reduceMotion?'auto':'smooth';
 const regionLabels={all:'todas las regiones',europa:'Europa',america:'América',asia:'Asia',oceania:'Oceanía'};
 const airlineTrack=root.querySelector('[data-air-track]');
 const airlineCards=Array.from(root.querySelectorAll('[data-airline-card]'));
 const filters=Array.from(root.querySelectorAll('[data-continent-filter]'));
 const reset=root.querySelector('.vl-reset-filter');
 const regionCopy=root.querySelector('[data-region-description]');

 function carousel(track,prev,next,items){
   if(!track)return()=>{};
   const update=()=>{
     const visible=items().filter(el=>!el.hidden);
     const max=Math.max(0,track.scrollWidth-track.clientWidth);
     if(prev)prev.disabled=track.scrollLeft<=3;
     if(next)next.disabled=track.scrollLeft>=max-3;
     return visible;
   };
   const advance=step=>{
     const first=items().find(el=>!el.hidden);
     const gap=parseFloat(getComputedStyle(track).columnGap)||0;
     track.scrollBy({left:step*(first?first.getBoundingClientRect().width+gap:track.clientWidth),behavior:motion});
   };
   prev?.addEventListener('click',()=>advance(-1));
   next?.addEventListener('click',()=>advance(1));
   track.addEventListener('scroll',update,{passive:true});
   track.addEventListener('keydown',event=>{
     if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
       event.preventDefault();
       advance(event.key==='ArrowRight'?1:-1);
     }
   });
   window.addEventListener('resize',update,{passive:true});
   requestAnimationFrame(update);
   return update;
 }
 const airPrev=root.querySelector('[data-carousel-prev]');
 const airNext=root.querySelector('[data-carousel-next]');
 const updateAir=carousel(airlineTrack,airPrev,airNext,()=>airlineCards);
 function filterRegion(key,scroll){
   if(!Object.prototype.hasOwnProperty.call(regionLabels,key))key='all';
   filters.forEach(button=>{
     const active=button.dataset.continentFilter===key;
     button.setAttribute('aria-pressed',String(active));
     button.classList.toggle('active',active);
   });
   airlineCards.forEach(card=>card.hidden=key!=='all'&&!card.dataset.continents.split(' ').includes(key));
   if(reset)reset.hidden=key==='all';
   const visible=airlineCards.filter(card=>!card.hidden).length;
   if(regionCopy)regionCopy.textContent=key==='all'?'16 aerolíneas con pros y puntos a revisar. Selecciona un continente arriba.':visible+' aerolínea'+(visible===1?'':'s')+' de nuestros viajes por '+regionLabels[key]+'.';
   if(airlineTrack)airlineTrack.scrollLeft=0;
   requestAnimationFrame(updateAir);

 }
 filters.forEach(btn=>btn.addEventListener('click',()=>filterRegion(btn.dataset.continentFilter)));
 filterRegion('all',false);

 const tips=root.querySelector('[data-tip-track]');
 carousel(tips,root.querySelector('[data-tip-prev]'),root.querySelector('[data-tip-next]'),()=>Array.from(tips?.children||[]));

 const stack=root.querySelector('[data-flight-stack]');
 const firstFlight=stack?.querySelector('[data-flight]');
 const add=root.querySelector('[data-add-flight]');
 const flightCount=root.querySelector('[data-flight-count]');
 const summary=root.querySelector('[data-compare-summary]');
 const list=root.querySelector('[data-compare-list]');
 const result=root.querySelector('[data-compare-result]');
 const letter=['A','B','C','D','E'];
 const costs=['base','baggage','seat','transfer','food'];
 const positiveValue=value=>Math.max(0,Number(value)||0);
 const flights=()=>Array.from(stack?.querySelectorAll('[data-flight]')||[]);
 function createFlight(){
   if(!firstFlight||flights().length>=5)return null;
   const panel=firstFlight.cloneNode(true);
   const index=flights().length;
   const label=letter[index];
   panel.dataset.flight=label.toLowerCase();
   panel.setAttribute('aria-label','Opción '+label);
   panel.querySelector('.vl-flight-title h3').textContent='Vuelo '+label;
   const remove=panel.querySelector('[data-remove-flight]');
   if(remove){remove.hidden=false;remove.setAttribute('aria-label','Quitar vuelo '+label)}
   panel.querySelectorAll('input').forEach(input=>input.value='');
   panel.querySelectorAll('select').forEach(select=>select.selectedIndex=0);
   panel.querySelectorAll('[aria-label]').forEach(el=>{
     if(el!==panel&&el!==remove)el.setAttribute('aria-label',el.getAttribute('aria-label').replace(/vuelo [A-E]/gi,'vuelo '+label));
   });
   panel.querySelectorAll('[data-total],[data-breakdown]').forEach(el=>el.textContent='0,00 €');
   stack.appendChild(panel);
   return panel;
 }
 function updateCalculator(){
   const panels=flights();
   if(stack){
     stack.dataset.columns=String(panels.length);
     stack.style.setProperty('--flight-count',String(panels.length));
   }
   if(add){
     add.disabled=panels.length>=5;
     add.textContent=panels.length>=5?'Máximo de 5 vuelos':'+ Añadir otro vuelo';
   }
   if(flightCount)flightCount.textContent=panels.length+' de 5 vuelos';
   const completed=[];
   panels.forEach((panel,index)=>{
     const amounts=costs.map(key=>{
       const input=panel.querySelector('[data-cost="'+key+'"]');
       const value=positiveValue(input?.value);
       const output=panel.querySelector('[data-breakdown="'+key+'"]');
       if(output)output.textContent=money.format(value);
       return value;
     });
     const total=amounts.reduce((a,b)=>a+b,0);
     const output=panel.querySelector('[data-total]');
     if(output)output.textContent=money.format(total);
     const price=panel.querySelector('[data-cost="base"]')?.value.trim();
     const select=panel.querySelector('[data-airline-select]');
     const airline=select?.selectedOptions[0]?.textContent?.trim()||'';
     if(price!==''&&price!=null){
       completed.push({total,index,code:letter[index],airline:select?.value?airline:'Aerolínea sin elegir',base:amounts[0],transfer:amounts[3]});
     }
   });
   if(!summary||!list||!result)return;
   summary.hidden=panels.length<2;
   if(summary.hidden)return;
   list.replaceChildren();
   if(!completed.length){
     result.hidden=false;
     result.textContent='Introduce al menos dos precios de billete para comparar las opciones.';
     return;
   }
   completed.sort((a,b)=>a.total-b.total);
   const min=completed[0].total;
   completed.forEach(item=>{
     const row=document.createElement('div');
     row.className='vl-result-row';
     const best=Math.abs(item.total-min)<0.005&&completed.length>1;
     if(best){
       row.classList.add('is-cheapest');
       const badge=document.createElement('small');
       badge.className='vl-best-tag';
       badge.textContent='Mejor precio real';
       row.appendChild(badge);
     }
     const label=document.createElement('span');
     label.textContent='Vuelo '+item.code+' · '+item.airline;
     const price=document.createElement('strong');
     price.textContent=money.format(item.total);
     row.append(label,price);
     if(!best&&completed.length>1&&item.total-min>0.005){
       const difference=document.createElement('small');
       difference.className='vl-result-difference';
       difference.textContent='+'+money.format(item.total-min)+' respecto al más barato';
       row.appendChild(difference);
     }
     list.appendChild(row);
   });
   result.hidden=false;
   if(completed.length<2){
     result.textContent='Añade el precio del billete de otro vuelo para ver cuál sale más económico.';
   }else{
     const max=completed[completed.length-1].total;
     const cheaper=completed.filter(x=>Math.abs(x.total-min)<0.005);
     if(Math.abs(max-min)<0.005){
       result.textContent='Los vuelos comparados tienen el mismo precio final.';
     }else{
       const cheapestTicket=completed.reduce((a,b)=>b.base<a.base?b:a);
       const ticketWarning=cheapestTicket.total>min+0.005
         ? ' El billete más barato (vuelo '+cheapestTicket.code+') no es la opción más económica cuando sumas los extras y el traslado.'
         : '';
       result.textContent='Mejor precio real: '+cheaper.map(x=>'vuelo '+x.code).join(' y ')+' · hasta '+money.format(max-min)+' menos que la opción más cara.'+ticketWarning;
     }
   }
 }
 add?.addEventListener('click',()=>{
   const panel=createFlight();
   if(panel){
     updateCalculator();
     panel.querySelector('[data-airline-select]')?.focus({preventScroll:true});
     panel.scrollIntoView({behavior:motion,block:'nearest'});
   }
 });
 stack?.addEventListener('input',updateCalculator);
 stack?.addEventListener('change',updateCalculator);
 stack?.addEventListener('click',event=>{
   const button=event.target.closest('[data-remove-flight]');
   if(!button)return;
   const panel=button.closest('[data-flight]');
   if(panel===firstFlight)return;
   panel?.remove();
   flights().forEach((p,i)=>{
     const value=letter[i];
     p.dataset.flight=value.toLowerCase();
     p.setAttribute('aria-label','Opción '+value);
     p.querySelector('.vl-flight-title h3').textContent='Vuelo '+value;
     p.querySelector('[data-remove-flight]')?.setAttribute('aria-label','Quitar vuelo '+value);
     p.querySelectorAll('input[aria-label],select[aria-label]').forEach(input=>input.setAttribute('aria-label',input.getAttribute('aria-label').replace(/vuelo [A-E]/gi,'vuelo '+value)));
   });
   updateCalculator();
   add?.focus({preventScroll:true});
 });
 root.querySelectorAll('[data-use-airline]').forEach(button=>button.addEventListener('click',()=>{
   let panel=flights().find(p=>!p.querySelector('[data-airline-select]')?.value);
   if(!panel)panel=createFlight();
   if(!panel){
     if(flightCount)flightCount.textContent='Máximo de 5 vuelos. Quita uno para añadir otra aerolínea.';
     root.querySelector('#calculadora')?.scrollIntoView({behavior:motion,block:'start'});
     return;
   }
   const select=panel.querySelector('[data-airline-select]');
   select.value=button.dataset.useAirline;
   updateCalculator();
   root.querySelector('#calculadora')?.scrollIntoView({behavior:motion,block:'start'});
   select.focus({preventScroll:true});
 }));
 updateCalculator();
})();
