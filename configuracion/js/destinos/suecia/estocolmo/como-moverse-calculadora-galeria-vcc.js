/* Viajando con Cabeza · calculadora SL. Galería: visor universal compartido.
   Sin dependencias ni llamadas de red. Tarifas declaradas en la página para 2026. */
(() => {
 'use strict';
 const root=document.getElementById('mv-vcc-ticket-calculator');
 if(root){
   const days=root.querySelector('#mv-vcc-days');
   const people=root.querySelector('#mv-vcc-people');
   const category=root.querySelector('#mv-vcc-fare');
   const dayInputs=root.querySelector('#mv-vcc-day-inputs');
   const cost=root.querySelector('#mv-vcc-optimal');
   const group=root.querySelector('#mv-vcc-group');
   const groupLabel=root.querySelector('#mv-vcc-group-label');
   const option=root.querySelector('#mv-vcc-recommend');
   const savingLabel=root.querySelector('#mv-vcc-saving-label');
   const savingAmount=root.querySelector('#mv-vcc-saving-amount');
   const savingScope=root.querySelector('#mv-vcc-saving-scope');
   const singles=root.querySelector('#mv-vcc-singles');
   const singleUnit=root.querySelector('#mv-vcc-single-unit');
   const singleGroup=root.querySelector('#mv-vcc-single-group');
   const singleCount=root.querySelector('#mv-vcc-single-count');
   const passRates=root.querySelector('#mv-vcc-pass-rates');
   const passCosts=root.querySelector('#mv-vcc-pass-costs');
   const passPerson=root.querySelector('#mv-vcc-pass-person');
   const passGroup=root.querySelector('#mv-vcc-pass-group');
   const passDescription=root.querySelector('#mv-vcc-pass-description');
   const recommendationNote=root.querySelector('#mv-vcc-recommend-note');
   const planEl=root.querySelector('#mv-vcc-plan');
   const carRoute=root.querySelector('#mv-vcc-car-route');
   const carType=root.querySelector('#mv-vcc-car-type');
   const carRentField=root.querySelector('#mv-vcc-car-rent-field');
   const carRent=root.querySelector('#mv-vcc-car-rent');
   const carParking=root.querySelector('#mv-vcc-car-parking');
   const carExtras=root.querySelector('#mv-vcc-car-extras');
   const carVerdict=root.querySelector('#mv-vcc-car-verdict');
   const carReason=root.querySelector('#mv-vcc-car-reason');
   const carCosts=root.querySelector('#mv-vcc-car-costs');
   const carTotal=root.querySelector('#mv-vcc-car-total');
   const carPerson=root.querySelector('#mv-vcc-car-person');
   const carComparison=root.querySelector('#mv-vcc-car-comparison');
   const counts=[2,3,2,0,0,0,0];
   const destination=window.VCCTransportDestination;
   const optimizer=window.VCCTransportOptimizer;
   const originalTickets=(destination&&destination.tickets||[]).map(x=>JSON.parse(JSON.stringify(x)));
   let ticketCatalog=originalTickets.map(x=>JSON.parse(JSON.stringify(x)));
   let simulationChanged=false;
   const currency=destination&&destination.currency||'SEK';
   const fareList=root.querySelector('#mv-vcc-fare-list');
   const fareName=root.querySelector('#mv-vcc-fare-name');
   const fareKind=root.querySelector('#mv-vcc-fare-kind');
   const fareQuantity=root.querySelector('#mv-vcc-fare-quantity');
   const farePrice=root.querySelector('#mv-vcc-fare-price');
   const fareNote=root.querySelector('#mv-vcc-fare-note');
   const modesCaption=root.querySelector('#mv-vcc-fare-modes');
   if(modesCaption){
     const modes=(destination&&Array.isArray(destination.modes)?destination.modes:[]);
     modesCaption.textContent='Red '+(destination?.operator||'pública')+
       (modes.length?' · Incluye '+modes.join(', '):'')+'.';
   }
   // La moneda i l'operador depenen del catàleg; la plantilla no necessita
   // una còpia de les tarifes o de les etiquetes per a cada ciutat.
   const currencyCaption=root.querySelector('#mv-vcc-fare-currency');
   if(currencyCaption)currencyCaption.textContent='PRECIO · '+currency;

   const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
   const money=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(n)+' '+currency;
   // El preu del cotxe només es calcula amb costos facilitats pel viatger.
   // No inferim tarifes de lloguer ni peatges: varien segons reserva i trajecte.
   const userCost=input=>{
     const value=input.value.trim();
     if(value===''||!Number.isFinite(Number(value))||Number(value)<0)return null;
     return clamp(Number(value),0,100000);
   };
   function calculateCar(slGroup){
     const n=readDays(),travellers=clamp(Number(people.value),1,10);
     // Capacidad orientativa; puede variarse en otros catálogos por destino.
     const cars=Math.ceil(travellers/5);
     const route=carRoute.value;
     const renting=carType.value==='rent';
     carRentField.hidden=!renting;
     const price=renting?userCost(carRent):0;
     const parking=userCost(carParking);
     const extras=userCost(carExtras);
     const context={
       city:['En el centro, valora el tráfico','Aparcar, tráfico y accesos pueden hacerlo menos práctico que caminar y usar SL.'],
       road:['Puede convenir en carretera','La flexibilidad ayuda fuera de la ciudad. Compara la ruta real y los gastos.'],
       islands:['El coche no sustituye el ferry','Para ciertas islas necesitas barco; conducir no equivale al trayecto en ferry.']
     }[route]||['Depende de la ruta','Comprueba el destino y los accesos.'];
     carVerdict.textContent=context[0];
     carReason.textContent=context[1];
     if(price===null||parking===null||extras===null){
       carCosts.hidden=true;
       carTotal.textContent='—';carPerson.textContent='—';
       const missing=[];
       if(renting&&price===null)missing.push('alquiler');
       if(parking===null)missing.push('parking');
       if(extras===null)missing.push('combustible y peajes');
       carComparison.textContent='Indica '+missing.join(', ')+' (0 si no hay gasto).';
       return {valid:false,route,cars};
     }
     const total=((price+parking)*n+extras)*cars;
     carCosts.hidden=false;
     carTotal.textContent=money(total);
     carPerson.textContent=money(total/travellers);
     if(route==='city'){
       const delta=Math.abs(total-slGroup);
       carComparison.textContent=total<slGroup
         ?'Según estos gastos, '+money(delta)+' menos que el mejor transporte público para el grupo.'
         :total>slGroup
           ?'El transporte público ahorra '+money(delta)+' al grupo con estos costes.'
           :'Coste similar; valora accesos y comodidad.';
     }else{
       carComparison.textContent=route==='islands'
         ?'No comparable: el ferry puede ser imprescindible.'
         :'No comparable directamente con billetes urbanos SL.';
     }
     return {valid:true,total,perPerson:total/travellers,route,cars,comparable:route==='city'};
   }
   const readDays=()=>clamp(Number(days.value),1,7);
   const renderDayInputs=()=>{
     const total=readDays();
     dayInputs.replaceChildren();
     for(let i=0;i<total;i++){
       const field=document.createElement('label');
       field.className='mv-vcc-field';
       const title=document.createElement('span');
       title.textContent='Día '+(i+1);
       const input=document.createElement('input');
       input.type='number';input.min='0';input.max='20';input.step='1';
       input.inputMode='numeric';input.value=String(counts[i]);input.dataset.day=String(i);
       input.setAttribute('aria-label','Billetes de 75 minutos por persona el día '+(i+1));
       field.append(title,input);
       dayInputs.append(field);
     }
     calculate();
   };
   // UI de catàleg: mateix component per a qualsevol destí.
   // Els canvis del lector no modifiquen el catàleg oficial al repositori.
   function renderFareEditor(){
     if(!fareList)return;
     const fragment=document.createDocumentFragment();
     ticketCatalog.forEach((ticket,index)=>{
       const row=document.createElement('div');
       row.className='mv-vcc-fare-row';
       const name=document.createElement('div');name.className='mv-vcc-fare-row-name';
       const title=document.createElement('strong');title.textContent=ticket.label;
       const status=document.createElement('small');
       status.textContent=ticket.simulation?'SIMULACIÓN':(destination?.operator||'Red')+' · OFICIAL';
       name.append(title,status);
       const fields=document.createElement('div');fields.className='mv-vcc-fare-row-fields';
       const wrap=(label,node)=>{
         const field=document.createElement('label');field.className='mv-vcc-field';
         const caption=document.createElement('span');caption.textContent=label;
         field.append(caption,node);return field;
       };
       const select=document.createElement('select');
       for(const [key,label] of [['rides','Viajes'],['hours','Horas'],['days','Días']]){
         const option=document.createElement('option');
         option.value=key;option.textContent=label;select.append(option);
       }
       select.value=ticket.type;
       select.dataset.index=String(index);select.dataset.field='type';
       select.setAttribute('aria-label','Tipo de abono · '+ticket.label);
       fields.append(wrap('TIPO',select));
       for(const [field,label,value] of [
         ['quantity','CANTIDAD',ticket.quantity],
         ['price','PRECIO '+currency,ticket.price&&ticket.price[category.value]]
       ]){
         const input=document.createElement('input');
         input.type='number';input.inputMode='decimal';
         input.min=field==='quantity'?'1':'0';input.max='100000';
         input.step=field==='price'?'0.01':'1';
         input.value=value===undefined?'':String(value);
         input.dataset.index=String(index);input.dataset.field=field;
         input.setAttribute('aria-label',label+' · '+ticket.label);
         fields.append(wrap(label,input));
       }
       row.append(name,fields);fragment.append(row);
     });
     fareList.replaceChildren(fragment);
     fareNote.textContent=simulationChanged
       ?'SIMULACIÓN PERSONAL · Los precios o abonos editados no son tarifas oficiales. Para títulos de menos de 24 h, hacen falta los horarios de viaje.'
       :'Precios de '+(destination?.operator||'la red')+' ('+(destination?.updated||'fecha de referencia')+'). Puedes simular otras tarifas, pero no son productos oficiales. Los títulos de menos de 24 h necesitan los horarios reales.';
   }
   function editFare(event){
     const input=event.target;
     const i=Number(input.dataset.index),field=input.dataset.field;
     const ticket=ticketCatalog[i];
     if(!ticket||!['type','quantity','price'].includes(field))return;
     if(field==='type')ticket.type=input.value;
     if(field==='quantity'){
       const value=Number(input.value);
       if(!Number.isInteger(value)||value<1||value>365)return;
       ticket.quantity=value;
     }
     if(field==='price'){
       const value=Number(input.value);
       if(input.value.trim()===''||!Number.isFinite(value)||value<0||value>100000)return;
       ticket.price[category.value]=value;
     }
     simulationChanged=true;
     ticket.simulation=true;
     fareNote.textContent='SIMULACIÓN PERSONAL · Has cambiado un abono o su precio; verifica las tarifas reales antes de comprar.';
     calculate();
   }
   function renderPassRates(){
     passRates.replaceChildren();
     const list=ticketCatalog.filter(t=>t.type!=='rides'||Number(t.quantity)>1);
     if(!list.length){
       const span=document.createElement('p');
       span.textContent='No hay abonos configurados';
       passRates.append(span);return;
     }
     const fragment=document.createDocumentFragment();
     list.forEach(ticket=>{
       const row=document.createElement('p');
       const caption=document.createElement('span');
       const amount=document.createElement('b');
       const price=ticket.price?.[category.value];
       caption.textContent=ticket.label+(ticket.simulation?' · Simulación':'');
       amount.textContent=price===undefined||price===null||price===''?'—':money(Number(price));
       row.append(caption,amount);fragment.append(row);
     });
     passRates.append(fragment);
   }
   function calculate(){
     const n=readDays(),travellers=clamp(Number(people.value),1,10);
     const arr=counts.slice(0,n).map(v=>clamp(v,0,20));
     const activations=arr.reduce((sum,v)=>sum+v,0);
     singleCount.textContent=activations+' '+(activations===1?'validación':'validaciones')+' por persona';
     renderPassRates();
     if(!destination||!optimizer){
       option.textContent='Tarifas no disponibles';
       cost.textContent='—';group.textContent='—';savingAmount.textContent='—';
       return;
     }
     const request={days:arr,catalog:ticketCatalog,category:category.value,people:travellers};
     const best=optimizer.solve(request);
     const passes=optimizer.solve({...request,requireBundle:true});
     const unit=best.singleUnit;
     singleUnit.textContent=unit===null?'—':money(unit);
     const singlePrice=best.singleTotal;
     singles.textContent=singlePrice===null?'—':money(singlePrice);
     singleGroup.textContent=singlePrice===null?'—':money(singlePrice*travellers);
     passCosts.hidden=!passes.valid;
     passPerson.textContent=passes.valid?money(passes.perPerson):'—';
     passGroup.textContent=passes.valid?money(passes.total):'—';
     passDescription.textContent=passes.valid
       ?'Mejor combinación con abono: '+passes.steps.join(' · ')
       :'No hay abonos comparables para los trayectos elegidos.';
     if(!best.valid){
       option.textContent='Revisa las tarifas';
       cost.textContent='—';group.textContent='—';savingAmount.textContent='—';
       recommendationNote.textContent='No hay datos suficientes para comparar.';
       return;
     }
     const car=calculateCar(best.total);
     const possibilities=[];
     if(singlePrice!==null)possibilities.push({kind:'single',cost:singlePrice*travellers,label:'Billetes sueltos'});
     if(passes.valid)possibilities.push({kind:'pass',cost:passes.total,label:'Abonos y bonos'});
     if(car.valid&&car.comparable)possibilities.push({kind:'car',cost:car.total,label:'Coche'});
     possibilities.sort((a,b)=>a.cost-b.cost);
     // En caso de empate preferir transporte público. El coche no reemplaza ferris
     // ni rutas suburbanas no cubiertas por los billetes indicados.
     const chosen=possibilities[0]||{kind:'best',cost:best.total,label:'Mejor opción pública'};
     option.textContent=activations===0&&chosen.kind!=='car'
       ?'No necesitas billetes'
       :chosen.kind==='pass'?'Abonos y bonos'
        :chosen.kind==='car'?'Coche · según tus gastos'
        :'Billetes sueltos';
     cost.textContent=money(chosen.cost/travellers);
     group.textContent=money(chosen.cost);
     groupLabel.textContent='Total '+travellers+(travellers===1?' viajero':' viajeros');
     if(possibilities.length>=2){
       const second=possibilities.find(p=>p.cost>chosen.cost+0.000001);
       const difference=second?second.cost-chosen.cost:0;
       savingLabel.textContent=second?'Frente a '+second.label:'Coste equivalente';
       savingAmount.textContent=money(difference/travellers);
     }else{
       savingLabel.textContent='Sin otra opción comparable';
       savingAmount.textContent='—';
     }
     savingScope.textContent='por persona';
     if(chosen.kind==='car'){
       recommendationNote.textContent='Coste inferior con tus cifras, pero conducir por el centro puede ser menos práctico. Revisa seguro, accesos y aparcamiento.';
     }else if(carRoute.value==='islands'){
       recommendationNote.textContent='Los trayectos en ferry del archipiélago pueden requerir un título adicional; el coche no los sustituye.';
     }else if(carRoute.value==='road'){
       recommendationNote.textContent='Comparación de transporte urbano. Para excursiones por carretera, calcula una ruta específica.';
     }else{
       recommendationNote.textContent=car.valid
         ?'Comparación de costes para '+travellers+(travellers===1?' viajero.':' viajeros.')+' En el centro valora también los tiempos y el aparcamiento.'
         :'Introduce los costes del coche para incluirlo en la comparación.';
     }
     planEl.replaceChildren();
     const parts=chosen.kind==='pass'?passes.steps:chosen.kind==='single'
       ?arr.map((q,i)=>q>0?'Día '+(i+1)+': '+q+' × billete sencillo':'').filter(Boolean)
       :chosen.kind==='car'?['Coche: alquiler, parking, combustible y peajes'] :best.steps;
     parts.forEach(part=>{
       const li=document.createElement('li');li.textContent=part;planEl.append(li);
     });
     if(best.uncomparable.length){
       const li=document.createElement('li');
       li.textContent='Sin comparar por horarios: '+best.uncomparable.map(t=>t.label).join(', ')+'.';
       planEl.append(li);
     }
   }
   [carRoute,carType,carRent,carParking,carExtras].forEach(input=>{
     if(input){
       input.addEventListener('input',calculate);
       input.addEventListener('change',calculate);
     }
   });
   fareList.addEventListener('input',editFare);
   fareList.addEventListener('change',editFare);
   root.querySelector('#mv-vcc-add-fare').addEventListener('click',()=>{
     const title=fareName.value.trim().slice(0,38),type=fareKind.value;
     const quantity=Number(fareQuantity.value),price=Number(farePrice.value);
     if(!title||!['rides','days','hours'].includes(type)||
        !Number.isInteger(quantity)||quantity<1||quantity>365||
        farePrice.value.trim()===''||!Number.isFinite(price)||price<0||price>100000){
       fareNote.textContent='Introduce nombre, tipo, cantidad y precio para simular un abono.';
       return;
     }
     const priceByCategory={};
     priceByCategory[category.value]=price;
     ticketCatalog.push({
       id:'simulated-'+ticketCatalog.length,label:title,type,
       quantity,price:priceByCategory,scope:'person',simulation:true
     });
     simulationChanged=true;fareName.value='';farePrice.value='';
     renderFareEditor();calculate();
   });
   root.querySelector('#mv-vcc-reset-fares').addEventListener('click',()=>{
     ticketCatalog=originalTickets.map(x=>JSON.parse(JSON.stringify(x)));
     simulationChanged=false;
     renderFareEditor();calculate();
   });
   days.addEventListener('change',renderDayInputs);
   people.addEventListener('input',calculate);
   people.addEventListener('change',()=>{
     people.value=String(clamp(Number(people.value),1,10));
     calculate();
   });
   category.addEventListener('change',()=>{renderFareEditor();calculate()});
   dayInputs.addEventListener('input',e=>{
     const i=Number(e.target.dataset.day);
     if(!Number.isInteger(i)||i<0||i>=7)return;
     counts[i]=clamp(Number(e.target.value),0,20);
     calculate();
   });
   dayInputs.addEventListener('change',e=>{
     const i=Number(e.target.dataset.day);
     if(!Number.isInteger(i)||i<0||i>=7)return;
     e.target.value=String(counts[i]);
     calculate();
   });
   root.querySelector('#mv-vcc-reset').addEventListener('click',()=>{
     days.value='3';people.value='2';category.value='adult';
     ticketCatalog=originalTickets.map(x=>JSON.parse(JSON.stringify(x)));
     simulationChanged=false;renderFareEditor();
     carRoute.value='city';carType.value='own';
     carRent.value='';carParking.value='';carExtras.value='';
     [2,3,2,0,0,0,0].forEach((v,i)=>{counts[i]=v});
     renderDayInputs();
   });
   renderFareEditor();
   renderDayInputs();
 }
})();
