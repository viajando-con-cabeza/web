/* VCC · Comparador universal y compacto: coche vs transporte público.
   Fuente de tarifas: window.VCCTransportDestination (por destino).
   Los precios individuales editados y los abonos personalizados son simulaciones.
   El coste de varios abonos seleccionados es una estimación de cobertura sin
   doble contabilizar viajes; no es un optimizador exhaustivo de horarios. */
(function(root){
 'use strict';
 const finite=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
 const amount=value=>value===''||value===undefined||value===null?null:Number(value);
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(value))?Math.trunc(Number(value)):min));
 const format=(value,currency)=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(value)+' '+currency;
 const minute=trip=>trip.day*1440+(trip.time?Number(trip.time.slice(0,2))*60+Number(trip.time.slice(3,5)):0);
 const timeValid=time=>/^([01]\d|2[0-3]):[0-5]\d$/.test(time||'');
 const priceTotal=trips=>trips.reduce((sum,t)=>sum+t.price,0);
 function planBonuses(trips,passes){
   const active=(passes||[]).filter(p=>Number(p.units)>0);
   if(!active.length)return {valid:false,reason:'Añade al menos un abono para comparar.'};
   if(active.length>10||active.some(p=>!finite(amount(p.price))||!Number.isInteger(Number(p.quantity))||Number(p.quantity)<1||Number(p.quantity)>365||!Number.isInteger(Number(p.units))||Number(p.units)>8||!['rides','hours','days'].includes(p.type))){
     return {valid:false,reason:'Revisa tipo, duración, precio y número de abonos.'};
   }
   const eligible=trips.filter(t=>t.included);
   if(!eligible.length)return {valid:false,reason:'Marca los trayectos que cubre el abono en «Editar trayectos».'};
   const instances=[];
   let purchased=0,approximate=false;
   for(const p of active){
     const units=Number(p.units),q=Number(p.quantity);
     if(p.type==='hours'){
       const allTimes=eligible.every(t=>timeValid(t.time));
       if(!allTimes)approximate=true; // Horas omitidas deliberadamente en la interfaz compacta.
     }
     purchased+=Number(p.price)*units;
     for(let i=0;i<units;i++)instances.push({name:p.label||'Bono',price:Number(p.price),type:p.type,quantity:q});
   }
   const uncovered=new Set(trips.map((t,i)=>i));
   const perTrip=(indices)=>indices.reduce((sum,i)=>sum+trips[i].price,0);
   function coverage(pass){
     const candidates=[...uncovered].filter(i=>trips[i].included);
     if(!candidates.length)return [];
     if(pass.type==='rides')return candidates.sort((a,b)=>trips[b].price-trips[a].price).slice(0,pass.quantity);
     const hasTimes=pass.type==='hours'&&candidates.every(i=>timeValid(trips[i].time));
     const coords=i=>hasTimes?minute(trips[i]):trips[i].day*1440;
     const span=(pass.type==='days'?pass.quantity*1440:
       hasTimes?pass.quantity*60:Math.max(1440,pass.quantity/24*1440));
     let best=[];
     for(const i of candidates){
       const at=coords(i),covered=candidates.filter(j=>coords(j)>=at&&coords(j)<at+span);
       if(perTrip(covered)>perTrip(best))best=covered;
     }
     return best;
   }
   const usage=[];
   // Ordenación por ahorro marginal; respeta todas las unidades compradas.
   // Cuando hay muchos abonos/horarios solapados, el resultado es una estimación.
   while(instances.length){
     let candidate=-1,covered=[],maximum=-1;
     for(let j=0;j<instances.length;j++){
       const ids=coverage(instances[j]),score=perTrip(ids);
       if(score>maximum){maximum=score;candidate=j;covered=ids;}
     }
     const pass=instances.splice(candidate,1)[0];
     for(const id of covered)uncovered.delete(id);
     usage.push({label:pass.name,covered:covered.length});
   }
   const remaining=[...uncovered].reduce((sum,i)=>sum+trips[i].price,0);
   return {valid:true,cost:purchased+remaining,prepaid:purchased,remaining,
     covered:trips.length-uncovered.size,units:usage.length,approximate,
     description:usage.length+' bono(s), '+(trips.length-uncovered.size)+' trayectos cubiertos'+(approximate?' · duración aproximada':''),
     note:'Estimación según los bonos seleccionados; revisa horarios, zonas y condiciones del operador.'};
 }
 function compare({trips=[],people=2,car={},passes=[],days=3,sameRoute=true,selected={car:true,individual:true,bonus:true}}={}){
   if(trips.some(t=>!finite(t.price)||!Number.isInteger(t.day)||t.day<1||t.day>31))
     return {valid:false,reason:'Revisa los importes y días de los trayectos.'};
   const active={car:!!selected.car,individual:!!selected.individual,bonus:!!selected.bonus};
   if(Object.values(active).filter(Boolean).length<2)
     return {valid:false,reason:'Elige al menos dos opciones para comparar.'};
   const travellers=clamp(people,1,30),duration=clamp(days,1,14);
   const individual=priceTotal(trips);
   const bonus=planBonuses(trips,active.bonus?passes:[]);
   const publicOffers=[
     ...(active.individual?[{type:'individual',cost:individual}]:[]),
     ...(active.bonus&&bonus.valid?[{type:'bonus',cost:bonus.cost}]:[])
   ].sort((a,b)=>a.cost-b.cost);
   const publicMode=publicOffers[0]?.type||null;
   const publicCost=publicOffers[0]?.cost??null;
   // Todos los importes de coche son totales del grupo, aunque alquilen varios vehículos.
   const rent=car.owned?0:amount(car.rental),fuel=amount(car.fuel);
   const parking=amount(car.parking)??0,tolls=amount(car.tolls)??0,extras=amount(car.extras)??0;
   const carValid=[rent,fuel,parking,tolls,extras].every(finite);
   // Parquing per dia, lloguer/combustible/peatges/extres per itinerari.
   const carTotal=carValid?rent+fuel+parking*duration+tolls+extras:null;
   const alternatives=[
     ...(active.individual?[{type:'individual',cost:individual*travellers}]:[]),
     ...(active.bonus&&bonus.valid?[{type:'bonus',cost:bonus.cost*travellers}]:[]),
     ...(active.car&&carValid&&sameRoute?[{type:'car',cost:carTotal}]:[])
   ].sort((a,b)=>a.cost-b.cost||(a.type==='car'?1:-1));
   if(!alternatives.length)return {valid:false,reason:'Introduce los importes para comparar las opciones seleccionadas.'};
   const choice=alternatives[0],next=alternatives.find(a=>a!==choice&&a.cost>choice.cost+0.001);
   const unfinished=active.car&&(!carValid||!sameRoute)||
     active.bonus&&!bonus.valid||
     active.bonus&&bonus.approximate&&passes.some(p=>p.type==='hours'&&p.quantity<24);
   return {valid:true,travellers,individual,individualTotal:individual*travellers,
     bonus,publicCost,publicMode,publicTotal:publicCost===null?null:publicCost*travellers,
     carValid,carTotal,sameRoute,active,unfinished,
     choice:choice.type,choiceTotal:choice.cost,saving:next?next.cost-choice.cost:0,
     needsCarInputs:active.car&&!carValid};
 }
 root.VCCTransportCompareCore={compare,planBonuses};
 const container=document.getElementById('vcc-transporte-comparador');
 if(!container)return;
 const catalogue=root.VCCTransportDestination||{},currency=catalogue.currency||'SEK';
 const official=Array.isArray(catalogue.tickets)?catalogue.tickets:[];
 const presets=official.filter(t=>t.type!=='rides'||Number(t.quantity)>1);
 const singles=official.find(t=>t.type==='rides'&&Number(t.quantity)===1);
 const $=name=>container.querySelector('#tc-'+name);
 const money=value=>format(value,currency);
 const valueFor=t=>{
   const value=t?.price?.adult;
   return value==null||value===''?null:Number(value);
 };
 const el=(tag,cls,label)=>{
   const node=document.createElement(tag);
   if(cls)node.className=cls;
   if(label!==undefined)node.textContent=label;
   return node;
 };
 const set=(id,label)=>{const node=$(id);if(node)node.textContent=label;};
 const defaultDays=[1,1,2,2,2,3,3];
 let nextTrip=0,nextPass=0,edited=false;
 let optionOrder=['car','individual','bonus'];
 let selected={car:true,individual:true,bonus:true};
 const basePrice=()=>valueFor(singles)??0;
 let trips=defaultDays.map((day,i)=>({id:++nextTrip,day,mode:'metro',label:'Viaje '+(i+1),price:basePrice(),time:'',included:true,userEdited:false}));
 function passFromPreset(src){
   return {id:++nextPass,preset:src?.id||'custom',label:src?.label||'Bono personalizado',
     type:src?.type||'rides',quantity:Number(src?.quantity||10),
     price:src?valueFor(src):null,units:1,simulation:false};
 }
 let passes=[passFromPreset(presets.find(t=>t.quantity===72&&t.type==='hours')||presets[0])];
 const findPass=id=>passes.find(p=>p.id===id);
 const findTrip=id=>trips.find(t=>t.id===id);
 const resetTrips=()=>{nextTrip=0;trips=defaultDays.map((day,i)=>({id:++nextTrip,day,mode:'metro',label:'Viaje '+(i+1),price:basePrice(),time:'',included:true,userEdited:false}));};
 const field=(label,node)=>{
   const wrapper=el('label','tc-field');wrapper.append(el('span','',label),node);return wrapper;
 };
 const choice=(selected,items,attr,aria)=>{
   const select=el('select');select.dataset.field=attr;select.setAttribute('aria-label',aria);
   for(const [value,label] of items){const option=el('option','',label);option.value=value;select.append(option);}
   select.value=selected;
   return select;
 };
 const input=(val,kind,attr,aria)=>{
   const node=el('input');node.type=kind;node.dataset.field=attr;
   node.setAttribute('aria-label',aria);
   if(kind==='number'){node.min='0';node.max='1000000';node.step=attr==='units'||attr==='quantity'?'1':'0.01';node.inputMode='decimal';}
   node.value=val==null?'':String(val);return node;
 };
 function renderTripEditor(){
   const list=$('trips');list.replaceChildren();
   trips.forEach((trip,i)=>{
     const row=el('div','tc-trip tc-trip-simple');row.dataset.id=String(trip.id);
     const number=el('span','tc-trip-number',String(i+1).padStart(2,'0'));
     const name=input(trip.label,'text','label','Descripción breve del viaje '+(i+1));
     name.maxLength=42;name.placeholder='Ej. Hotel → centro';
     const price=input(trip.price,'number','price','Precio del viaje '+(i+1)+' en '+currency);
     price.placeholder='Precio';
     const remove=el('button','tc-remove','×');remove.type='button';remove.dataset.action='remove';
     remove.setAttribute('aria-label','Eliminar viaje '+(i+1));
     row.append(number,name,price,remove);
     list.append(row);
   });
   set('trip-edit-count',trips.length+(trips.length===1?' viaje':' viajes'));
 }
 function renderPassEditor(){
   const list=$('passes');list.replaceChildren();
   passes.forEach((pass,i)=>{
     const row=el('div','tc-pass-row');row.dataset.id=String(pass.id);
     const name=input(pass.label,'text','label','Descripción del abono '+(i+1));
     name.maxLength=48;name.placeholder='Ej. Pase 48 horas, bono 10 viajes';
     const quantity=input(pass.quantity,'number','quantity','Duración o número de viajes del abono '+(i+1));
     const type=choice(pass.type,[['hours','Horas'],['days','Días'],['rides','Viajes']],'type','Tipo de duración del abono '+(i+1));
     const price=input(pass.price,'number','price','Precio del abono '+(i+1)+' en '+currency);
     const units=input(pass.units,'number','units','Abonos por persona '+(i+1));units.max='8';
     const remove=el('button','tc-remove','×');remove.type='button';remove.dataset.action='remove';
     remove.setAttribute('aria-label','Eliminar abono '+(i+1));
     row.append(
       field('Abono '+(i+1)+' · Descripción',name),
       field('Duración',quantity),
       field('Tipo',type),
       field('Precio '+currency,price),
       field('Cantidad',units),
       remove
     );
     list.append(row);
   });
   set('pass-count',passes.length+(passes.length===1?' abono':' abonos'));
 }
 function renderTariffs(){
   const list=$('tariffs');list.replaceChildren();
   official.forEach(ticket=>{
     const p=el('p');p.append(el('span','',ticket.label),el('strong','',
       valueFor(ticket)==null?'—':money(valueFor(ticket))));
     list.append(p);
   });
 }
 function update(){
   $('rental-wrap').hidden=$('car-type').value==='own';
   const travellers=clamp($('people').value,1,30);
   const car={owned:$('car-type').value==='own',
     rental:$('rental').value,fuel:$('fuel').value,parking:$('parking').value,
     tolls:$('tolls').value,extras:$('extras').value};
   const result=root.VCCTransportCompareCore.compare({
     trips,people:travellers,car,passes,days:$('days').value,selected,sameRoute:$('same-route').checked});
   if(!result.valid){
     set('conclusion-label','COMPARACIÓN SIN COMPLETAR');
     set('recommend','Revisa los importes');
     const savingBox=$('saving')?.closest('.tc-saving');
     if(savingBox)savingBox.dataset.state='pending';
     set('saving-label','Ahorro por persona');
     for(const id of ['individual-person','individual-group','bonus-person','bonus-group','car-person','car-group','recommend-person','recommend-group','saving'])set(id,'—');
     set('recommend-note',result.reason);return;
   }
   const purchased=passes.filter(pass=>Number(pass.units)>0);
   const passCount=purchased.reduce((sum,pass)=>sum+Number(pass.units),0);
   const passAmount=purchased.every(pass=>Number.isFinite(pass.price)&&pass.price>=0)
     ?purchased.reduce((sum,pass)=>sum+pass.price*Number(pass.units),0):null;
   const passTitle=passCount===0?'Sin abonos':passCount===1?purchased[0].label:passCount+' abonos';
   set('bonus-glance',passAmount===null?passTitle+' · indica precio':passTitle+' · '+money(passAmount));
   set('trip-count',trips.length+' viajes');
   set('individual-person',money(result.individual));set('individual-group',money(result.individualTotal));
   set('bonus-person',result.bonus.valid?money(result.bonus.cost):'—');
   set('bonus-group',result.bonus.valid?money(result.bonus.cost*travellers):'—');
   set('car-person',result.carValid?money(result.carTotal/travellers):'—');
   set('car-group',result.carValid?money(result.carTotal):'—');
   set('cars','Total de todos los coches');
   set('bonus-note',result.bonus.valid?
     result.bonus.approximate?'Estimación por días, sin horas exactas: comprueba la validez de cada pase':
     result.bonus.remaining>0?'Incluye billetes sueltos para viajes no cubiertos':
     'Abono aplicado a los viajes indicados':
     result.bonus.reason);
   const bestPublic=result.publicMode==='bonus'?'Bono':'Billetes';
   set('best-public',result.publicCost===null?'':('Mejor: '+bestPublic+' · '+money(result.publicCost)+' / persona'));
   const mark=(selector,chosen)=>{
     const element=container.querySelector(selector);
     if(element?.classList)element.classList.toggle('tc-winner',chosen);
   };
   mark('.tc-option-car',result.choice==='car');
   mark('.tc-option-individual',result.choice==='individual');
   mark('.tc-option-bonus',result.choice==='bonus');
   set('conclusion-label',result.unfinished?'MEJOR OPCIÓN CON TUS DATOS · VCC':'CONCLUSIÓN VCC · MEJOR OPCIÓN');
   const title=result.choice==='car'?'Coche':
      result.choice==='bonus'?'Abonos + billetes':'Billetes sueltos';
   set('recommend',title);
   set('recommend-person',money(result.choiceTotal/travellers));
   set('recommend-group',money(result.choiceTotal));
   const savingBox=$('saving')?.closest('.tc-saving');
   const savingPerPerson=result.saving/travellers;
   const savingState=result.unfinished?'pending':savingPerPerson>0.005?'positive':'zero';
   if(savingBox)savingBox.dataset.state=savingState;
   set('saving-label',savingState==='zero'?'Sin ahorro': 'Ahorro por persona');
   set('saving',savingState==='pending'?'—':money(savingPerPerson));
   set('group-label',travellers+(travellers===1?' viajero':' viajeros'));
   const reason=selected.car&&!result.sameRoute?
     'El coche se excluye: no cubre el mismo recorrido.':
     selected.car&&!result.carValid?
       'Comparación provisional: informa alquiler y combustible para incluir el coche.':
     selected.bonus&&!result.bonus.valid?
       'Comparación provisional: revisa los precios y la cobertura de los abonos.':
     selected.bonus&&result.bonus.approximate&&passes.some(p=>p.type==='hours'&&p.quantity<24)?
       'Solo una estimación: un bono de menos de 24 horas necesita comprobar los horarios.':
     result.choice==='car'?
       'Con estos importes, el coche cuesta menos; revisa aparcamiento y accesos.':
     result.choice==='bonus'?
       'La combinación de abonos y billetes complementarios cuesta menos.':
       'Los billetes individuales son la alternativa más económica.';
   set('recommend-note',reason);
   set('sim-note',edited||passes.some(p=>p.preset==='custom'||p.simulation)?
     'SIMULACIÓN PERSONAL · Comprueba precios, horarios y cobertura de los títulos.':
     'Precios orientativos del catálogo SL; revisa las condiciones oficiales.');
 }
 function adjustTripCount(){
   const n=clamp($('trip-number').value,0,40);
   $('trip-number').value=String(n);
   while(trips.length<n)trips.push({id:++nextTrip,day:Math.min(clamp($('days').value,1,14),1+Math.floor(trips.length/3)),
     mode:'metro',label:'Viaje '+(trips.length+1),price:amount($('trip-price').value)??basePrice(),
     time:'',included:true,userEdited:false});
   if(trips.length>n)trips=trips.slice(0,n);
   renderTripEditor();update();
 }
 function adjustBasePrice(){
   const next=amount($('trip-price').value);
   if(!finite(next)){
     for(const t of trips)if(!t.userEdited)t.price=NaN;
     update();return;
   }
   for(const trip of trips)if(!trip.userEdited)trip.price=next;
   edited=next!==basePrice()||trips.some(t=>t.userEdited);
   renderTripEditor();update();
 }
 function handleTrip(event){
   const row=event.target.closest('.tc-trip');if(!row)return;
   const trip=findTrip(Number(row.dataset.id));if(!trip)return;
   const f=event.target.dataset.field;
   if(f==='price'){
     const p=amount(event.target.value);
     trip.price=finite(p)?p:NaN;
     trip.userEdited=true;edited=true;
   }else if(f==='label'){
     trip.label=event.target.value.slice(0,42);
   }
   update();
 }
 function handlePass(event){
   const row=event.target.closest('.tc-pass-row');if(!row)return;
   const pass=findPass(Number(row.dataset.id));if(!pass)return;
   const f=event.target.dataset.field;
   if(f==='units'){
     pass.units=clamp(event.target.value,0,8);if(event.type==='change')event.target.value=String(pass.units);
   }else if(f==='price'){
     const p=amount(event.target.value);pass.price=p;
     pass.simulation=true;edited=true;
   }else if(f==='quantity'){
     pass.quantity=clamp(event.target.value,1,365);if(event.type==='change')event.target.value=String(pass.quantity);pass.simulation=true;edited=true;
   }else if(f==='type'){
     pass.type=event.target.value;pass.simulation=true;edited=true;
   }else if(f==='label'){
     pass.label=event.target.value.trim().slice(0,48)||'Bono personalizado';
     pass.simulation=true;edited=true;
   }
   update();
 }
 // Se pueden comparar 2 o 3 alternativas y cambiar su orden sin borrar datos.
 function syncOptions(){
   const visible=optionOrder.filter(name=>selected[name]);
   const grid=$('options');
   grid.dataset.count=String(visible.length);
   grid.querySelectorAll('.tc-option').forEach(card=>{
     const name=card.dataset.option,position=visible.indexOf(name);
     card.hidden=position<0;
     card.style.order=position<0?99:position;
     card.querySelectorAll('.tc-order-btn').forEach(button=>{
       const direction=Number(button.dataset.move);
       button.disabled=position<0||position+direction<0||position+direction>=visible.length;
     });
   });
   container.querySelectorAll('.tc-select-option input[data-option]').forEach(input=>{
     input.checked=selected[input.dataset.option];
   });
   const equivalent=$('same-route').closest('.tc-compare-checkbox');
   if(equivalent)equivalent.hidden=!selected.car;
   set('select-status',visible.length+' opciones · usa ‹ › para cambiar el orden');
 }
 container.querySelectorAll('.tc-select-option input[data-option]').forEach(input=>{
   input.addEventListener('change',()=>{
     const name=input.dataset.option;
     const count=Object.values(selected).filter(Boolean).length;
     if(!input.checked&&count<=2){
       input.checked=true;
       set('select-status','Selecciona al menos 2 alternativas.');
       return;
     }
     selected[name]=input.checked;
     syncOptions();update();
   });
 });
 $('options').addEventListener('click',event=>{
   const button=event.target.closest('.tc-order-btn');
   if(!button||button.disabled)return;
   const card=button.closest('.tc-option');
   if(!card)return;
   const visible=optionOrder.filter(name=>selected[name]);
   const pos=visible.indexOf(card.dataset.option),target=pos+Number(button.dataset.move);
   if(pos<0||target<0||target>=visible.length)return;
   [visible[pos],visible[target]]=[visible[target],visible[pos]];
   optionOrder=[...visible,...optionOrder.filter(name=>!selected[name])];
   syncOptions();update();
 });
 $('open-trips').addEventListener('click',()=>{
   const details=$('trip-detail');
   details.open=!details.open;
   if(details.open)details.scrollIntoView({block:'nearest',behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 });
 $('trips').addEventListener('input',handleTrip);
 $('trips').addEventListener('change',handleTrip);
 $('passes').addEventListener('input',handlePass);
 $('passes').addEventListener('change',handlePass);
 for(const [list,items,removeFn,render] of [
   ['trips',()=>trips,id=>{trips=trips.filter(t=>t.id!==id);$('trip-number').value=String(trips.length);},renderTripEditor],
   ['passes',()=>passes,id=>{passes=passes.filter(t=>t.id!==id);},renderPassEditor]
 ]){
   $(list).addEventListener('click',event=>{
     if(event.target.dataset.action!=='remove')return;
     const row=event.target.closest('.tc-'+(list==='trips'?'trip':'pass-row'));
     if(!row)return;removeFn(Number(row.dataset.id));render();update();
   });
 }
 $('add-pass').addEventListener('click',()=>{
   if(passes.length>=10)return;
   passes.push(passFromPreset(null));renderPassEditor();update();
 });
 $('add-trip').addEventListener('click',()=>{
   if(trips.length>=40)return;
   $('trip-number').value=String(trips.length+1);
   adjustTripCount();
   $('trip-detail').open=true;
 });
 $('trip-number').addEventListener('input',adjustTripCount);
 $('trip-number').addEventListener('change',adjustTripCount);
 $('trip-price').addEventListener('change',adjustBasePrice);
 $('trip-price').addEventListener('input',adjustBasePrice);
 for(const id of ['people','days','car-type','rental','fuel','parking','tolls','extras','same-route']){
   $(id).addEventListener('input',()=>{
     if(id==='days'){
       const n=clamp($('days').value,1,14);
       for(const trip of trips)trip.day=Math.min(trip.day,n);
       renderTripEditor();
     }
     update();
   });
 }
 $('reset').addEventListener('click',()=>{
   $('days').value='3';$('people').value='2';
   $('car-type').value='rent';
   for(const id of ['rental','fuel','parking','tolls','extras'])$(id).value='';
   $('same-route').checked=true;
   $('trip-number').value='7';$('trip-price').value=String(basePrice());
   nextPass=0;passes=[passFromPreset(presets.find(t=>t.quantity===72&&t.type==='hours')||presets[0])];
   edited=false;selected={car:true,individual:true,bonus:true};optionOrder=['car','individual','bonus'];
   $('trip-detail').open=false;
   resetTrips();renderTripEditor();renderPassEditor();renderTariffs();syncOptions();update();
 });
 $('trip-price').value=String(basePrice());
 renderTripEditor();renderPassEditor();renderTariffs();syncOptions();update();
})(window);
