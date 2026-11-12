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
   if(reset)reset.hidden=false;
   const visible=airlineCards.filter(card=>!card.hidden).length;
   if(regionCopy)regionCopy.textContent=key==='all'?airlineCards.length+' aerolíneas con pros y puntos a revisar. Selecciona un continente arriba.':visible+' aerolínea'+(visible===1?'':'s')+' de nuestros viajes por '+regionLabels[key]+'.';
   if(airlineTrack)airlineTrack.scrollLeft=0;
   requestAnimationFrame(updateAir);

 }
 filters.forEach(btn=>btn.addEventListener('click',()=>filterRegion(btn.dataset.continentFilter)));
 filterRegion('all',false);

 const tips=root.querySelector('[data-tip-track]');
 carousel(tips,root.querySelector('[data-tip-prev]'),root.querySelector('[data-tip-next]'),()=>Array.from(tips?.children||[]));


 // Comparador auténtico: las opciones son columnas y los conceptos, filas.
 const iconRoot='/configuracion/imagenes/iconos/paginas/planifica-vuelos-comparador-iconos.svg#';
 const letters=['A','B','C','D','E'];
 const airlines=[
  ['ryanair','Ryanair'],['vueling','Vueling'],['turkish','Turkish Airlines'],
  ['swiss','SWISS'],['wizz','Wizz Air'],['easyjet','easyJet'],
  ['brussels','Brussels Airlines'],['lufthansa','Lufthansa'],
  ['american','American Airlines'],['etihad','Etihad Airways'],
  ['emirates','Emirates'],['lion','Lion Air'],['scoot','Scoot'],
  ['batik','Batik Air'],['virgin','Virgin Australia'],['jetstar','Jetstar']
 ];
 const concepts=[
  {key:'airline',label:'Aerolínea',icon:'avion',type:'select'},
  {key:'route',label:'Trayecto / aeropuerto',icon:'ruta',type:'text'},
  {key:'base',label:'Billete',icon:'billete',type:'number'},
  {key:'baggage',label:'Equipaje',icon:'equipaje',type:'number'},
  {key:'seat',label:'Asiento',icon:'asiento',type:'number'},
  {key:'food',label:'Comida y bebida',icon:'comida',type:'number'},
  {key:'transfer',label:'Traslado aeropuerto',icon:'traslado',type:'number'}
 ];
 const costKeys=['base','baggage','seat','food','transfer'];
 const flightScroll=root.querySelector('[data-flight-scroll]');
 const tableHead=root.querySelector('[data-flight-head]');
 const tableBody=root.querySelector('[data-flight-body]');
 const addFlight=root.querySelector('[data-add-flight]');
 const countFlight=root.querySelector('[data-flight-count]');
 const bestEmpty=root.querySelector('[data-best-empty]');
 const bestSelection=root.querySelector('[data-best-selection]');
 const bestComparison=root.querySelector('[data-best-comparison]');
 const bestName=root.querySelector('[data-best-name]');
 const bestPrice=root.querySelector('[data-best-price]');
 const bestSavings=root.querySelector('[data-best-savings]');
 const exportButton=root.querySelector('[data-export-pdf]');
 const clearButton=root.querySelector('[data-clear-comparison]');
 const calcStatus=root.querySelector('[data-calc-status]');
 const setStatus=message=>{if(calcStatus)calcStatus.textContent=message;};
 const emptyFlight=()=>({airline:'',route:'',base:'',baggage:'',seat:'',food:'',transfer:''});
 const flights=[emptyFlight(),emptyFlight(),emptyFlight()];
 const number=value=>{const parsed=Number(value);return Number.isFinite(parsed)&&parsed>0?Math.min(parsed,10000000):0;};
 const total=flight=>Math.round(costKeys.reduce((sum,key)=>sum+number(flight[key]),0)*100)/100;
 const labelAirline=id=>(airlines.find(item=>item[0]===id)||[])[1]||'Aerolínea sin elegir';
 const icon=id=>'<svg class="vl-compare-icon" aria-hidden="true"><use href="'+iconRoot+id+'"></use></svg>';
 function renderCalculator(){
   if(!tableHead||!tableBody)return;
   flightScroll?.style.setProperty('--vl-flight-count',String(flights.length));
   const top=document.createElement('tr');
   const conceptHeader=document.createElement('th');
   conceptHeader.scope='col';conceptHeader.textContent='Concepto';
   top.appendChild(conceptHeader);
   flights.forEach((flight,i)=>{
     const th=document.createElement('th');
     th.scope='col';
     const title=document.createElement('span');
     title.className='vl-option-heading';
     title.textContent='Opción '+letters[i];
     th.appendChild(title);
     if(flights.length>1){
       const button=document.createElement('button');
       button.type='button';button.className='vl-remove-option';
       button.dataset.removeFlight=String(i);
       button.setAttribute('aria-label','Quitar opción '+letters[i]);
       button.title='Quitar opción '+letters[i];
       button.innerHTML=icon('cerrar');
       th.appendChild(button);
     }
     top.appendChild(th);
   });
   tableHead.replaceChildren(top);
   const rows=[];
   concepts.forEach(concept=>{
     const tr=document.createElement('tr');
     tr.className='vl-row-'+concept.key;
     const th=document.createElement('th');th.scope='row';
     th.innerHTML=icon(concept.icon);
     const label=document.createElement('span');label.textContent=concept.label;
     th.appendChild(label);tr.appendChild(th);
     flights.forEach((flight,i)=>{
       const td=document.createElement('td');
       let control;
       if(concept.type==='select'){
         control=document.createElement('select');
         const prompt=document.createElement('option');
         prompt.value='';prompt.textContent='Elige aerolínea';
         control.appendChild(prompt);
         airlines.forEach(pair=>{
           const option=document.createElement('option');
           option.value=pair[0];option.textContent=pair[1];
           control.appendChild(option);
         });
       }else{
         control=document.createElement('input');
         control.type=concept.type;
         if(concept.type==='number'){
           control.min='0';control.max='10000000';control.step='0.01';control.inputMode='decimal';
           control.placeholder='0,00';
         }else{
           control.maxLength=85;
           control.placeholder='Ej. BCN → ARN';
           control.autocomplete='off';
         }
       }
       control.value=flight[concept.key];
       control.dataset.flightIndex=String(i);
       control.dataset.field=concept.key;
       control.setAttribute('aria-label',concept.label+' de la opción '+letters[i]);
       td.appendChild(control);tr.appendChild(td);
     });
     rows.push(tr);
   });
   const totals=document.createElement('tr');
   totals.className='vl-row-total';
   const totalLabel=document.createElement('th');
   totalLabel.scope='row';totalLabel.innerHTML=icon('total');
   const label=document.createElement('span');label.textContent='TOTAL POR OPCIÓN';
   totalLabel.appendChild(label);totals.appendChild(totalLabel);
   flights.forEach((flight,i)=>{
     const td=document.createElement('td');
     const pill=document.createElement('span');
     pill.className='vl-total-pill';
     const strong=document.createElement('strong');
     strong.dataset.flightTotal=String(i);
     pill.appendChild(strong);
     td.appendChild(pill);
     totals.appendChild(td);
   });
   rows.push(totals);
   tableBody.replaceChildren(...rows);
   if(addFlight){
     addFlight.disabled=flights.length>=5;
     addFlight.setAttribute('aria-label',flights.length>=5?'Máximo de cinco opciones':'Añadir otra opción de vuelo');
   }
   if(countFlight)countFlight.textContent=flights.length+' de 5 opciones';
   updateCalculator();
 }
 function updateCalculator(){
   if(!tableBody)return;
   const compared=flights.map((flight,i)=>({flight,i,amount:total(flight)}))
     .filter(item=>flightHasPrice(item.flight));
   const valid=compared.length>=2;
   const min=valid?Math.min(...compared.map(item=>item.amount)):null;
   const winners=valid?compared.filter(item=>Math.abs(item.amount-min)<.005):[];
   tableHead.querySelectorAll('th[data-best-option]').forEach(th=>th.removeAttribute('data-best-option'));
   tableBody.querySelectorAll('td[data-best-option]').forEach(td=>td.removeAttribute('data-best-option'));
   tableBody.querySelectorAll('tr').forEach(row=>row.querySelectorAll('td').forEach((td,i)=>{
     if(winners.some(item=>item.i===i))td.dataset.bestOption='true';
   }));
   tableHead.querySelectorAll('th').forEach((th,i)=>{
     if(i>0&&winners.some(item=>item.i===i-1))th.dataset.bestOption='true';
   });
   flights.forEach((flight,i)=>{
     const cell=tableBody.querySelector('[data-flight-total="'+i+'"]');
     if(cell)cell.textContent=flightHasPrice(flight)?money.format(total(flight)):'—';
   });
   if(bestEmpty)bestEmpty.hidden=valid;
   if(bestSelection)bestSelection.hidden=!valid;
   if(bestComparison)bestComparison.hidden=!valid;
   if(!valid||!bestName||!bestPrice||!bestSavings)return;
   const winner=winners[0], winnerFlight=winner.flight;
   const optionNames=winners.map(item=>letters[item.i]).join(' y ');
   bestName.textContent=(winners.length>1?'Empate: opciones ':'Opción ')+optionNames+
     (winnerFlight.airline?' · '+labelAirline(winnerFlight.airline):'')+
     (winnerFlight.route?' · '+winnerFlight.route:'');
   bestPrice.textContent=money.format(min);
   bestSavings.replaceChildren();
   compared.filter(item=>item.amount>min+.005).forEach(item=>{
     const li=document.createElement('li');
     const intro=document.createElement('span');intro.textContent='Te ahorras ';
     const amount=document.createElement('strong');amount.textContent=money.format(item.amount-min);
     const other=document.createElement('span');
     other.textContent=' frente a la opción '+letters[item.i];
     li.append(intro,amount,other);bestSavings.appendChild(li);
   });
   if(winners.length>1){
     const li=document.createElement('li');
     li.textContent='Hay '+winners.length+' opciones empatadas al mismo precio total.';
     bestSavings.appendChild(li);
   }
   if(!bestSavings.children.length){
     const li=document.createElement('li');
     li.textContent='Las opciones introducidas tienen el mismo precio total.';
     bestSavings.appendChild(li);
   }
 }
 function flightHasPrice(flight){const raw=String(flight.base).trim();const price=Number(raw);return raw!==''&&Number.isFinite(price)&&price>=0&&price<=10000000;}

 // Exportació PDF sense emmagatzematge ni URL compartida:
 // jsPDF es carrega només després del clic, no en el renderitzat inicial.
 exportButton?.addEventListener('click',async()=>{
   if(!flights.some(flightHasPrice)){
     setStatus('Introduce al menos el precio de un billete antes de guardar el PDF.');
     return;
   }
   exportButton.disabled=true;
   setStatus('Preparando tu PDF de VCC...');
   try{
     const {exportarComparacionPDF}=await import('/configuracion/js/componentes/vcc-vuelos-pdf.js?v=20261112-v1');
     const file=await exportarComparacionPDF(flights.map(f=>({...f})),airlines);
     setStatus('PDF descargado: '+file);
   }catch(error){
     setStatus(error?.message||'No se pudo generar el PDF. Inténtalo de nuevo.');
   }finally{exportButton.disabled=false;}
 });
 clearButton?.addEventListener('click',()=>{
   if(flights.some(f=>Object.values(f).some(value=>value!==''))&&
      !window.confirm('¿Borrar los vuelos introducidos?'))return;
   flights.splice(0,flights.length,emptyFlight(),emptyFlight(),emptyFlight());
   renderCalculator();
   setStatus('Comparación vacía. Puedes empezar de nuevo.');
 });
 function addOption(){
   if(flights.length>=5)return null;
   flights.push(emptyFlight());
   renderCalculator();
   return flights.length-1;
 }
 flightScroll?.addEventListener('input',event=>{
   const control=event.target.closest('[data-flight-index][data-field]');
   if(!control)return;
   const i=Number(control.dataset.flightIndex);
   const key=control.dataset.field;
   if(!flights[i]||!Object.prototype.hasOwnProperty.call(flights[i],key))return;
   flights[i][key]=control.value;
   updateCalculator();
 });
 flightScroll?.addEventListener('change',event=>{
   const control=event.target.closest('[data-flight-index][data-field]');
   if(!control)return;
   const i=Number(control.dataset.flightIndex);
   const key=control.dataset.field;
   if(!flights[i]||!Object.prototype.hasOwnProperty.call(flights[i],key))return;
   if(costKeys.includes(key)&&control.value!==''){
     const amount=Number(control.value);
     if(!Number.isFinite(amount)||amount<0)control.value='0';
     else if(amount>10000000)control.value='10000000';
   }
   flights[i][key]=control.value;
   updateCalculator();
 });
 flightScroll?.addEventListener('click',event=>{
   const button=event.target.closest('[data-remove-flight]');
   if(!button||flights.length<=1)return;
   const i=Number(button.dataset.removeFlight);
   if(!Number.isInteger(i)||i<0||i>=flights.length)return;
   flights.splice(i,1);
   renderCalculator();
 });
 addFlight?.addEventListener('click',()=>{
   const i=addOption();
   if(i!==null){
     flightScroll?.querySelector('[data-flight-index="'+i+'"][data-field="airline"]')?.focus({preventScroll:true});
   }
 });
 renderCalculator();
})();
