/* VCC · Comparador universal de transporte privado vs transporte público.
   Motor independiente del destino: tarifas en window.VCCTransportDestination.
   Precios variables por trayecto, billetes compartibles SOLO si existe una regla
   expresa (por defecto: todos por persona), abonos por viajes/días/horas.
   Ningún precio de coche es inventado; no recomendar sin costes suficientes. */
(function(root){
 'use strict';
 const fmt=(n,currency)=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(n)+' '+currency;
 const finite=n=>Number.isFinite(n)&&n>=0;
 const moneyValue=value=>value===''||value==null?null:Number(value);
 const toInt=(value,min,max)=>Math.max(min,Math.min(max,Math.trunc(Number(value)||min)));
 const tripCost=trips=>trips.reduce((sum,t)=>sum+t.price,0);
 const timeMinutes=t=>t.day*1440+(t.time?Number(t.time.split(':')[0])*60+Number(t.time.split(':')[1]):0);
 function evaluatePass(trips,bonus){
   if(!bonus||!finite(bonus.price)||!Number.isInteger(bonus.quantity)||bonus.quantity<1)return {valid:false,reason:'Completa el precio y duración del abono.'};
   const eligible=trips.filter(t=>t.included),outside=trips.filter(t=>!t.included);
   if(!eligible.length)return {valid:false,reason:'Marca al menos un trayecto cubierto por el abono.'};
   const notCovered=tripCost(outside);
   const p=bonus.price,q=bonus.quantity;
   if(bonus.type==='rides'){
     const ordered=eligible.map(t=>t.price).sort((a,b)=>b-a);
     const total=ordered.reduce((a,b)=>a+b,0);
     let best={valid:false,cost:Infinity};
     for(let packs=1;packs<=Math.ceil(ordered.length/q);packs++){
       const covered=ordered.slice(0,packs*q).reduce((a,b)=>a+b,0);
       const subtotal=packs*p+total-covered+notCovered;
       if(subtotal<best.cost)best={valid:true,cost:subtotal,packs,covered:Math.min(packs*q,ordered.length),description:packs+' × '+bonus.label+(ordered.length>packs*q?' + viajes no cubiertos':'')};
     }
     return best;
   }
   if(!['hours','days'].includes(bonus.type))return {valid:false,reason:'Indica si el abono es por horas, días o viajes.'};
   const timed=bonus.type==='hours';
   const precise=timed&&eligible.every(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time||''));
   if(timed&&!precise&&(q<24||q%24!==0))return {valid:false,reason:'Para este abono necesitas indicar la hora de salida en todos los trayectos cubiertos.'};
   const span=timed?(precise?q*60:q/24*1440):q*1440;
   const ordered=[...eligible].sort((a,b)=>{
     const da=precise?timeMinutes(a):a.day*1440;
     const db=precise?timeMinutes(b):b.day*1440;
     return da-db;
   });
   const coords=ordered.map(t=>precise?timeMinutes(t):t.day*1440);
   const memo=new Map();
   const solve=(i,used)=>{
     if(i>=ordered.length)return used?{cost:0,packs:0,covered:0}:null;
     const key=i+'-'+Number(used);
     if(memo.has(key))return memo.get(key);
     const skip=solve(i+1,used);
     let best=skip?{cost:ordered[i].price+skip.cost,packs:skip.packs,covered:skip.covered}:null;
     let j=i+1;
     while(j<ordered.length&&coords[j]<coords[i]+span)j++;
     const after=solve(j,true);
     if(after){
       const withPass={cost:p+after.cost,packs:1+after.packs,covered:j-i+after.covered};
       if(!best||withPass.cost<best.cost-1e-7||Math.abs(withPass.cost-best.cost)<1e-7&&withPass.packs<best.packs)best=withPass;
     }
     memo.set(key,best);
     return best;
   };
   const result=solve(0,false);
   if(!result)return {valid:false,reason:'No se puede usar este abono en la ruta indicada.'};
   return {valid:true,cost:result.cost+notCovered,packs:result.packs,covered:result.covered,description:result.packs+' × '+bonus.label+(result.covered<ordered.length||outside.length?' + billetes adicionales':''),
     approximate:timed&&!precise};
 }
 function compare({trips,people,car,bonuses,comparable=true}){
   const travellers=toInt(people,1,30);
   if(!Array.isArray(trips)||trips.some(t=>!finite(t.price)||!Number.isInteger(Number(t.day))||Number(t.day)<1||Number(t.day)>31))return {valid:false,reason:'Revisa el día y el importe de cada trayecto.'};
   const individual=tripCost(trips),validBonuses=(bonuses||[]).map(b=>evaluatePass(trips,b)).filter(b=>b.valid);
   const bestBonus=validBonuses.sort((a,b)=>a.cost-b.cost)[0]||null;
   const publicBest=bestBonus&&bestBonus.cost<individual?bestBonus.cost:individual;
   const mode=bestBonus&&bestBonus.cost<individual?'bonus':'individual';
   const vehicles=toInt(car?.seats||5,1,15);
   const cars=Math.ceil(travellers/vehicles);
   const rent=car?.owned?0:moneyValue(car?.rental);
   const fuel=moneyValue(car?.fuel);
   const parking=moneyValue(car?.parking)??0;
   const insurance=moneyValue(car?.insurance)??0;
   const extras=moneyValue(car?.extras)??0;
   const carValid=finite(rent)&&finite(fuel)&&finite(parking)&&finite(insurance)&&finite(extras);
   const carTotal=carValid?(rent+fuel+parking+insurance+extras)*cars:null;
   const chooseCar=carValid&&comparable&&carTotal<publicBest*travellers;
   const choice=chooseCar?'car':mode;
   const choiceTotal=chooseCar?carTotal:publicBest*travellers;
   const comparisonAlternatives=[
     {mode:'individual',cost:individual*travellers},
     ...(bestBonus?[{mode:'bonus',cost:bestBonus.cost*travellers}]:[]),
     ...(carValid&&comparable?[{mode:'car',cost:carTotal}]:[])
   ].sort((a,b)=>a.cost-b.cost);
   const second=comparisonAlternatives.find(a=>a.cost>choiceTotal+0.00001);
   return {valid:true,travellers,individual,individualTotal:individual*travellers,bestBonus,
    publicBest,publicTotal:publicBest*travellers,mode,
    carValid,carTotal,cars,comparable,choice,choiceTotal,
    saving:second?second.cost-choiceTotal:0,
    needsCarInputs:!carValid};
 }
 root.VCCTransportCompareCore={compare,evaluatePass};
 const container=document.getElementById('vcc-transporte-comparador');
 if(!container)return;
 const catalogue=root.VCCTransportDestination||{};
 const currency=catalogue.currency||'SEK';
 const passSource=(catalogue.tickets||[]).filter(t=>t.quantity>1||t.type!=='rides');
 const single=(catalogue.tickets||[]).find(t=>t.type==='rides'&&t.quantity===1);
 const getPrice=t=>{
   const value=t?.price?.[form('fare').value];
   return value==null||value===''?null:Number(value);
 };
 const form=id=>container.querySelector('#tc-'+id);
 let nextId=0;
 const dates=[1,1,2,2,2,3,3];
 let trips=dates.map((day,i)=>({id:++nextId,day,label:'Trayecto '+(i+1),price:Number(single?.price?.adult||0),included:true,time:''}));
 const model={modified:false};
 const money=n=>fmt(n,currency);
 const element=(tag,cls,txt)=>{
   const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;
 };
 const set=(id,txt)=>{const el=form(id);if(el)el.textContent=txt};
 function fillPassSelect(){
   const sel=form('pass');
   sel.replaceChildren();
   const make=(value,label)=>{const opt=element('option','',label);opt.value=value;sel.append(opt)};
   make('auto','Mejor abono disponible');
   passSource.forEach(t=>make(t.id,t.label));
   make('custom','Abono personalizado');
   sel.value='auto';
 }
 function currentBonus(t){
   return {type:t.type,quantity:Number(t.quantity),label:t.label||'Abono personalizado',price:getPrice(t)};
 }
 function readCustom(){
   const type=form('bonus-type').value,q=Number(form('bonus-quantity').value);
   const price=moneyValue(form('bonus-price').value);
   return {type,quantity:q,price,label:form('bonus-name').value.trim()||'Abono personalizado'};
 }
 function displayBonusEditor(){
   const id=form('pass').value,custom=id==='custom';
   form('pass-editor').hidden=id==='auto';
   if(!custom&&id!=='auto'){
     const src=passSource.find(t=>t.id===id);
     if(src){form('bonus-name').value=src.label;form('bonus-type').value=src.type;form('bonus-quantity').value=src.quantity;form('bonus-price').value=getPrice(src)??'';}
   }else if(custom&&!model.customSet){
     form('bonus-name').value='Bono 10 viajes';form('bonus-type').value='rides';form('bonus-quantity').value=10;form('bonus-price').value='';
     model.customSet=true;
   }
   model.modified=false;
   update();
 }
 function renderTrips(){
   const list=form('trips');list.replaceChildren();
   trips.forEach((trip,i)=>{
     const row=element('div','tc-trip');
     row.dataset.id=String(trip.id);
     const label=element('input','tc-trip-label');
     label.type='text';label.maxLength=36;label.value=trip.label;
     label.dataset.field='label';label.setAttribute('aria-label','Nombre del viaje '+(i+1));
     const day=element('select','tc-trip-day');
     day.dataset.field='day';day.setAttribute('aria-label','Día del viaje '+(i+1));
     const totalDays=Number(form('days').value);
     for(let v=1;v<=totalDays;v++){
       const option=element('option','',String(v));option.value=String(v);day.append(option);
     }
     day.value=String(Math.min(trip.day,totalDays));
     const price=element('input','tc-trip-price');
     price.type='number';price.min='0';price.step='0.01';price.inputMode='decimal';price.value=String(trip.price);
     price.dataset.field='price';price.setAttribute('aria-label','Precio individual del viaje '+(i+1)+' en '+currency);
     const time=element('input','tc-trip-time');
     time.type='time';time.value=trip.time||'';time.dataset.field='time';
     time.setAttribute('aria-label','Hora opcional del viaje '+(i+1));
     const included=element('input','tc-trip-included');
     included.type='checkbox';included.checked=trip.included;
     included.dataset.field='included';included.setAttribute('aria-label','Este viaje está incluido en el abono');
     const cover=element('label','tc-cover');cover.append(included,element('span','','Bono'));
     const del=element('button','tc-trip-delete','×');del.type='button';del.dataset.action='remove';
     del.setAttribute('aria-label','Eliminar viaje '+(i+1));
     row.append(label,day,price,time,cover,del);list.append(row);
   });
   form('trip-count').textContent=trips.length+' viajes';
 }
 function renderTariffs(){
   const box=form('official-tariffs');
   box.replaceChildren();
   const row=(label,value)=>{const p=element('p');p.append(element('span','',label),element('b','',finite(value)?money(value):'No disponible'));box.append(p)};
   if(single)row(single.label,getPrice(single));
   passSource.forEach(t=>row(t.label,getPrice(t)));
 }
 function viewBonus(){
   if(form('pass').value==='auto'){
     const opts=passSource.map(t=>({source:t,result:root.VCCTransportCompareCore.evaluatePass(trips,currentBonus(t))}));
     const available=opts.filter(x=>x.result.valid).sort((a,b)=>a.result.cost-b.result.cost);
     const best=available[0];
     return {options:passSource.map(t=>currentBonus(t)),chosen:best?.result||null,source:best?.source||null,errors:opts.filter(x=>!x.result.valid)};
   }
   const t=readCustom(),r=root.VCCTransportCompareCore.evaluatePass(trips,t);
   return {options:[t],chosen:r.valid?r:null,source:null,errors:r.valid?[]:[r]};
 }
 function update(){
   const people=toInt(form('people').value,1,30);
   const mode=form('pass').value;
   const pass=viewBonus();
   const owned=form('car-kind').value==='owned';
   form('rental-wrap').hidden=owned;
   const car={
     owned,seats:form('seats').value,rental:form('rental').value,
     fuel:form('fuel').value,parking:form('parking').value,
     insurance:form('insurance').value,extras:form('extras').value
   };
   const comparable=form('same-route').checked;
   const result=root.VCCTransportCompareCore.compare({trips,people,car,bonuses:pass.options,comparable});
   if(!result.valid){set('recommend','Revisa los importes');set('recommend-note',result.reason);return}
   set('individual-pp',money(result.individual));set('individual-total',money(result.individualTotal));
   set('bonus-pp',pass.chosen?money(pass.chosen.cost):'—');
   set('bonus-total',pass.chosen?money(pass.chosen.cost*people):'—');
   set('bonus-note',pass.chosen?
     (pass.source?pass.source.label+': ':'')+pass.chosen.description+(pass.chosen.approximate?' · Horarios aproximados':'')
      :pass.errors[0]?.result?.reason||pass.errors[0]?.reason||'Este bono requiere datos adicionales');
   set('car-pp',result.carValid?money(result.carTotal/people):'—');
   set('car-total',result.carValid?money(result.carTotal):'—');
   set('vehicles',result.cars+(result.cars===1?' coche':' coches')+' para '+people+' viajeros');
   let label=result.choice==='car'?'Coche':result.choice==='bonus'?'Bono de transporte':'Billetes individuales';
   if((model.modified||mode==='custom')&&result.choice!=='car')label+=' · Simulación';
   set('recommend',label);set('result-pp',money(result.choiceTotal/people));set('result-total',money(result.choiceTotal));
   set('saving',money(result.saving/people));set('people-label',people+(people===1?' viajero':' viajeros'));
   const note=result.choice==='car'
     ?'Más barato con tus importes; confirma el coste del seguro, aparcamiento y la viabilidad de la ruta.'
     :!comparable?'No se compara el coche porque no cubre el mismo recorrido.'
      :result.needsCarInputs?'Introduce alquiler y combustible para incluir el coche en la recomendación.'
       :result.choice==='bonus'?'El bono se aplica solo a los viajes marcados como cubiertos.':'Los billetes individuales salen más económicos con los importes indicados.';
   set('recommend-note',note);
   set('sim-note',model.modified||mode==='custom'?'SIMULACIÓN PERSONAL · No representa tarifas oficiales.':'Importes de referencia del operador, editables por ti.');
 }
 form('trips').addEventListener('input',event=>{
   const row=event.target.closest('.tc-trip'),trip=trips.find(t=>t.id===Number(row?.dataset.id));
   if(!trip)return;
   const field=event.target.dataset.field;
   if(field==='label')trip.label=event.target.value;
   if(field==='time')trip.time=event.target.value;
   if(field==='price'){
     const value=moneyValue(event.target.value);
     if(value===null||!finite(value))return;
     trip.price=value;trip.userEdited=true;model.modified=true;
   }
   if(field==='included')trip.included=event.target.checked;
   update();
 });
 form('trips').addEventListener('change',event=>{
   const row=event.target.closest('.tc-trip'),trip=trips.find(t=>t.id===Number(row?.dataset.id));
   if(!trip)return;
   if(event.target.dataset.field==='day')trip.day=Number(event.target.value);
   if(event.target.dataset.field==='included')trip.included=event.target.checked;
   update();
 });
 form('trips').addEventListener('click',event=>{
   if(event.target.dataset.action!=='remove')return;
   const row=event.target.closest('.tc-trip');
   trips=trips.filter(t=>t.id!==Number(row?.dataset.id));
   renderTrips();update();
 });
 form('add-trip').addEventListener('click',()=>{
   if(trips.length>=40)return;
   trips.push({id:++nextId,label:'Trayecto '+(trips.length+1),day:1,
     price:Number(single?.price?.[form('fare').value]??single?.price?.adult??0),included:true,time:''});
   renderTrips();update();
 });
 form('days').addEventListener('change',()=>{
   const n=toInt(form('days').value,1,14);
   trips.forEach(t=>{if(t.day>n)t.day=n});
   renderTrips();update();
 });
 form('pass').addEventListener('change',displayBonusEditor);
 form('fare').addEventListener('change',()=>{
   if(single){
     const updated=getPrice(single);
     if(updated!==null)trips.forEach(t=>{if(!t.userEdited)t.price=updated;});
   }
   renderTrips();renderTariffs();displayBonusEditor();
 });
 for(const id of ['people','car-kind','seats','rental','fuel','parking','insurance','extras','same-route']){
   form(id).addEventListener('input',update);
   form(id).addEventListener('change',update);
 }
 for(const id of ['bonus-name','bonus-type','bonus-quantity','bonus-price']){
   form(id).addEventListener('input',()=>{model.modified=true;update()});
   form(id).addEventListener('change',()=>{model.modified=true;update()});
 }
 form('reset').addEventListener('click',()=>{
   form('days').value='3';form('people').value='2';form('fare').value='adult';
   form('car-kind').value='rent';form('seats').value='5';
   for(const id of ['rental','fuel','parking','insurance','extras'])form(id).value='';
   form('same-route').checked=true;form('pass').value='auto';
   model.modified=false;model.customSet=false;
   nextId=0;
   trips=dates.map((day,i)=>({id:++nextId,day,label:'Trayecto '+(i+1),price:Number(single?.price?.adult||0),included:true,time:''}));
   renderTrips();renderTariffs();displayBonusEditor();
 });
 fillPassSelect();renderTrips();renderTariffs();displayBonusEditor();
})(window);
