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
   const pass72=root.querySelector('#mv-vcc-72');
   const pass72row=root.querySelector('#mv-vcc-72-row');
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
   const carSl=root.querySelector('#mv-vcc-car-sl');
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
     if(!carRoute)return;
     const n=readDays(),travelers=clamp(Number(people.value),1,10);
     const cars=Math.ceil(travelers/5);
     const route=carRoute.value;
     const renting=carType.value==='rent';
     carRentField.hidden=!renting;
     const price=renting?userCost(carRent):0;
     const parking=userCost(carParking);
     const extras=userCost(carExtras);
     const context={
       city:['Para el centro, normalmente no compensa','Aparcar y acceder al centro añade costes y tiempo; SL y caminar suelen ser más prácticos.'],
       road:['Puede ser útil para excursiones','La libertad de horarios puede compensar, según distancia, aparcamiento y alternativa de transporte.'],
       islands:['El coche no sustituye el ferry','En rutas por las islas y Grinda necesitarás barco; conducir no sustituye ese trayecto.']
     }[route]||['Depende de tu ruta','Revisa la conexión antes de reservar.'];
     carVerdict.textContent=context[0];
     carReason.textContent=context[1];
     if(price===null||parking===null||extras===null){
       carCosts.hidden=true;
       const missing=[];
       if(renting&&price===null)missing.push('alquiler');
       if(parking===null)missing.push('parking');
       if(extras===null)missing.push('gasolina y peajes');
       carComparison.textContent='Introduce '+missing.join(', ')+' (0 si no hay gasto) para calcular el coste del coche.';
       return;
     }
     const total=((price+parking)*n+extras)*cars;
     carCosts.hidden=false;
     carTotal.textContent=money(total)+(cars>1?' · '+cars+' coches':'');
     carSl.textContent=money(slGroup);
     if(route==='islands'){
       carComparison.textContent='No son opciones equivalentes: el coche no sustituye los barcos del archipiélago.';
     }else if(route==='road'){
       carComparison.textContent='Los billetes SL introducidos pueden no cubrir esta excursión. Compara con el precio y la duración de la ruta real.';
     }else{
       const delta=Math.abs(total-slGroup);
       carComparison.textContent=total>slGroup
         ?'SL cuesta '+money(delta)+' menos para el grupo, con estos gastos.'
         :total<slGroup
           ?'El coche cuesta '+money(delta)+' menos en este cálculo, pero en el centro puede ser menos práctico.'
           :'Empate de coste estimado; en el centro suele resultar más cómodo ir a pie y con SL.';
     }
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
   function calculate(){
     const n=readDays(),p=clamp(Number(people.value),1,10);
     const arr=counts.slice(0,n).map(v=>clamp(v,0,20));
     if(!destination||!optimizer){
       option.textContent='Tarifas no disponibles';
       cost.textContent='—';group.textContent='—';savingAmount.textContent='—';
       return;
     }
     const best=optimizer.solve({days:arr,catalog:ticketCatalog,category:category.value,people:p});
     if(!best.valid){
       option.textContent='Revisa los precios';
       cost.textContent='—';group.textContent='—';savingAmount.textContent='—';
       return;
     }
     cost.textContent=money(best.perPerson);
     group.textContent=money(best.total);
     groupLabel.textContent='Total '+p+(p===1?' viajero':' viajeros');
     singles.textContent=best.singleTotal===null?'No disponible':money(best.singleTotal);
     pass72row.hidden=n!==3||best.pass72==null;
     pass72.textContent=best.pass72==null?'No disponible':money(best.pass72);
     const activations=arr.reduce((sum,v)=>sum+v,0);
     const passUsed=best.steps.some(part=>!/Billete 75 min|billete sencillo/i.test(part));
     option.textContent=activations===0?'No necesitas billetes':passUsed?'Mejor combinación de tarifas':'Billetes sueltos';
     const reference=n===3&&best.pass72!=null?best.pass72:best.singleTotal;
     savingLabel.textContent=n===3&&best.pass72!=null?'Ahorro frente a 72 h':'Ahorro frente a billetes sueltos';
     savingAmount.textContent=money(reference===null?0:Math.max(0,reference-best.perPerson));
     savingScope.textContent='por persona';
     planEl.replaceChildren();
     best.steps.forEach(part=>{
       const li=document.createElement('li');li.textContent=part;planEl.append(li);
     });
     if(best.uncomparable.length){
       const li=document.createElement('li');
       li.textContent='No comparados: '+best.uncomparable.map(t=>t.label).join(', ')+' (necesitan horas de viaje u otras reglas).';
       planEl.append(li);
     }
     calculateCar(best.total);
   }
   [carRoute,carType,carRent,carParking,carExtras].forEach(input=>{
     if(input){
       input.addEventListener('input',calculate);
       input.addEventListener('change',calculate);
     }
   });
   days.addEventListener('change',renderDayInputs);
   people.addEventListener('input',calculate);
   people.addEventListener('change',()=>{
     people.value=String(clamp(Number(people.value),1,10));
     calculate();
   });
   category.addEventListener('change',calculate);
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
     carRoute.value='city';carType.value='own';
     carRent.value='';carParking.value='';carExtras.value='';
     [2,3,2,0,0,0,0].forEach((v,i)=>{counts[i]=v});
     renderDayInputs();
   });
   renderDayInputs();
 }
})();
