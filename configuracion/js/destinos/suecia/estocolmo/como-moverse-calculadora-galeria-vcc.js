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
   const tariffs={adult:{single:43,h24:180,h72:360},reduced:{single:26,h24:110,h72:220}};
   const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
   const money=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(n)+' SEK';
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
   const findBest=(arr,t)=>{
     const n=arr.length,dp=new Array(n+1);
     dp[n]={cost:0,step:1,type:'end'};
     for(let i=n-1;i>=0;i--){
       let best={cost:arr[i]*t.single+dp[i+1].cost,step:1,type:'single'};
       const day={cost:t.h24+dp[i+1].cost,step:1,type:'24'};
       const end=Math.min(n,i+3);
       const period={cost:t.h72+dp[end].cost,step:end-i,type:'72'};
       if(day.cost<best.cost)best=day;
       if(period.cost<best.cost)best=period;
       dp[i]=best;
     }
     const parts=[];
     for(let i=0;i<n;){
       const v=dp[i],end=i+v.step;
       const prefix=v.step>1?'Días '+(i+1)+'–'+end:'Día '+(i+1);
       let label;
       if(v.type==='single')label=arr[i]+' '+(arr[i]===1?'billete sencillo':'billetes sencillos');
       else if(v.type==='24')label='abono de 24 h';
       else label='abono de 72 h';
       parts.push(prefix+': '+label);
       i=end;
     }
     return {cost:dp[0].cost,parts};
   };
   function calculate(){
     const n=readDays();
     const p=clamp(Number(people.value),1,10);
     const fare=tariffs[category.value]||tariffs.adult;
     const arr=counts.slice(0,n).map(v=>clamp(v,0,20));
     const best=findBest(arr,fare);
     const alone=arr.reduce((s,v)=>s+v*fare.single,0);
     cost.textContent=money(best.cost);
     group.textContent=money(best.cost*p);
     groupLabel.textContent='Total '+p+(p===1?' viajero':' viajeros');
     singles.textContent=money(alone);
     pass72row.hidden=n!==3;
     pass72.textContent=money(fare.h72);
     const usingPass=best.parts.some(part=>part.includes('abono'));
     option.textContent=best.cost===0?'No necesitas billetes':usingPass?'Combinación de billetes y abonos':'Billetes sueltos';
     const reference=n===3?fare.h72:alone;
     const saving=Math.max(0,reference-best.cost);
     savingLabel.textContent=n===3?'Te ahorras':'Ahorro frente a billetes sueltos';
     savingAmount.textContent=money(saving);
     savingScope.textContent='por persona';
     planEl.replaceChildren();
     best.parts.forEach(part=>{const li=document.createElement('li');li.textContent=part;planEl.append(li)});
     calculateCar(best.cost*p);
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
