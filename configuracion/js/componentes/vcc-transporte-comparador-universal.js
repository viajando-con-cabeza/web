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
 // La cobertura de un título no se infiere de su descripción:
 // el usuario introduce el precio de cada abono y los billetes no cubiertos.
 function planBonuses(trips,passes,bonusExtras=[]){
   const active=(passes||[]).filter(pass=>pass.units!==0);
   if(!active.length)return {valid:false,reason:'Añade al menos un abono.'};
   if(active.length>30||active.some(pass=>!finite(amount(pass.price))))
     return {valid:false,reason:'Indica el precio de cada abono.'};
   if(bonusExtras.some(ticket=>!finite(ticket.price)))
     return {valid:false,reason:'Revisa el precio de los billetes complementarios.'};
   const prepaid=active.reduce((sum,pass)=>sum+Number(pass.price),0);
   const remaining=bonusExtras.reduce((sum,ticket)=>sum+ticket.price,0);
   return {valid:true,cost:prepaid+remaining,prepaid,remaining,covered:null,units:active.length,
     approximate:false,manual:true,description:active.length+' abono(s) más '+bonusExtras.length+' billete(s) extra'};
 }
 function compare({trips=[],people=2,car={},passes=[],bonusExtras=[],days=3,sameRoute=true,selected={car:true,individual:true,bonus:true}}={}){
   if(trips.some(t=>!finite(t.price)||!Number.isInteger(t.day)||t.day<1||t.day>31))
     return {valid:false,reason:'Revisa los importes y días de los trayectos.'};
   const active={car:!!selected.car,individual:!!selected.individual,bonus:!!selected.bonus};
   if(Object.values(active).filter(Boolean).length<2)
     return {valid:false,reason:'Elige al menos dos opciones para comparar.'};
   const travellers=clamp(people,1,30),duration=clamp(days,1,14);
   const individual=priceTotal(trips);
   const bonus=planBonuses(trips,active.bonus?passes:[],active.bonus?bonusExtras:[]);
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
   const unfinished=active.car&&(!carValid||!sameRoute)||active.bonus&&!bonus.valid;
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
 let bonusExtras=[],nextBonusExtra=0;
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
     const row=el('div','tc-trip tc-trip-simple tc-pass-row');row.dataset.id=String(pass.id);
     const num=el('span','tc-trip-number',String(i+1).padStart(2,'0'));
     const name=input(pass.label,'text','label','Descripción del abono '+(i+1));
     name.maxLength=48;name.placeholder='Ej. Pase 72 h';
     const price=input(pass.price,'number','price','Precio del abono '+(i+1)+' en '+currency);
     price.placeholder='Precio';
     const remove=el('button','tc-remove','×');remove.type='button';remove.dataset.action='remove';
     remove.setAttribute('aria-label','Eliminar abono '+(i+1));
     row.append(num,name,price,remove);
     list.append(row);
   });
 }
 function renderBonusExtras(){
   const list=$('bonus-extras');list.replaceChildren();
   bonusExtras.forEach((ticket,i)=>{
     const row=el('div','tc-trip tc-trip-simple tc-bonus-extra');row.dataset.id=String(ticket.id);
     const num=el('span','tc-trip-number',String(i+1).padStart(2,'0'));
     const name=input(ticket.label,'text','label','Descripción del billete adicional '+(i+1));
     name.maxLength=48;name.placeholder='Ej. Trayecto extra';
     const price=input(ticket.price,'number','price','Precio del billete adicional '+(i+1)+' en '+currency);
     price.placeholder='Precio';
     const remove=el('button','tc-remove','×');remove.type='button';remove.dataset.action='remove';
     remove.setAttribute('aria-label','Eliminar billete adicional '+(i+1));
     row.append(num,name,price,remove);
     list.append(row);
   });
 }
 function renderTariffs(){
   const list=$('tariffs');list.replaceChildren();
   official.forEach(ticket=>{
     const p=el('p');p.append(el('span','',ticket.label),el('strong','',
       valueFor(ticket)==null?'—':money(valueFor(ticket))));
     list.append(p);
   });
 }
 // Els noms i preus seleccionats apareixen dins de requadres de tres
 // elements per fila. La graella es desplaça verticalment a partir de dues
 // files, sense fer créixer la targeta ni canviar els càlculs.
 function renderSelectionSummaries(){
   const populate=(id,items,empty,kind)=>{
     const target=$(id);if(!target)return;
     target.replaceChildren();
     target.dataset.count=String(items.length);
     if(!items.length){target.append(el('span','tc-selected-empty',empty));return;}
     items.forEach((item,i)=>{
       const text=(item.label||((kind==='bonus'?'Abono ':'Viaje ')+(i+1))).trim();
       const price=finite(amount(item.price))?money(Number(item.price)):'Sin precio';
       const chip=el('button','tc-selected-chip');
       chip.type='button';
       chip.dataset.editor=kind==='trip'?'trip-detail':'bonus-detail';
       chip.title=String(i+1).padStart(2,'0')+' · '+text+' · '+price+' · Editar';
       chip.setAttribute('aria-label',chip.title);
       chip.append(
         el('span','tc-selected-index',String(i+1).padStart(2,'0')),
         el('span','tc-selected-name',text),
         el('span','tc-selected-price',price)
       );
       target.append(chip);
     });
   };
   populate('trip-preview',trips,'Sin viajes','trip');
   populate('bonus-preview',passes,'Sin abonos','bonus');
   populate('extra-preview',bonusExtras,'Sin billetes extra','bonus');
   set('trip-selected-count',trips.length+(trips.length===1?' viaje':' viajes'));
   set('bonus-selected-count',passes.length+(passes.length===1?' abono':' abonos'));
   set('extra-selected-count',bonusExtras.length+(bonusExtras.length===1?' billete':' billetes'));
   const extraSection=$('bonus-extra-summary');
   if(extraSection)extraSection.hidden=bonusExtras.length===0;
 }
 function update(){
   renderSelectionSummaries();
   $('rental-wrap').hidden=$('car-type').value==='own';
   const travellers=clamp($('people').value,1,30);
   const car={owned:$('car-type').value==='own',
     rental:$('rental').value,fuel:$('fuel').value,parking:$('parking').value,
     tolls:$('tolls').value,extras:$('extras').value};
   const result=root.VCCTransportCompareCore.compare({
     trips,people:travellers,car,passes,bonusExtras,days:$('days').value,selected,sameRoute:$('same-route').checked});
   if(!result.valid){
     set('conclusion-label','COMPARACIÓN SIN COMPLETAR');
     set('recommend','Revisa los importes');
     const savingBox=$('saving')?.closest('.tc-saving');
     if(savingBox)savingBox.dataset.state='pending';
     set('saving-label','Ahorro por persona');
     for(const id of ['individual-person','individual-group','bonus-person','bonus-group','car-person','car-group','recommend-person','recommend-group','saving'])set(id,'—');
     set('recommend-note',result.reason);return;
   }
   const validAmounts=passes.length>0&&passes.every(pass=>finite(amount(pass.price)))&&bonusExtras.every(extra=>finite(extra.price));
   const passSum=validAmounts?passes.reduce((sum,pass)=>sum+Number(pass.price),0):null;
   const extraSum=validAmounts?bonusExtras.reduce((sum,extra)=>sum+extra.price,0):null;
   set('bonus-glance',passes.length+(passes.length===1?' abono':' abonos')+
       ' · '+(validAmounts?money(passSum+extraSum):'indica precio')+
       (bonusExtras.length?' · '+bonusExtras.length+' extra'+(bonusExtras.length===1?'':'s'):''));
   set('trip-count',trips.length+' viajes');
   set('individual-person',money(result.individual));set('individual-group',money(result.individualTotal));
   set('bonus-person',result.bonus.valid?money(result.bonus.cost):'—');
   set('bonus-group',result.bonus.valid?money(result.bonus.cost*travellers):'—');
   set('car-person',result.carValid?money(result.carTotal/travellers):'—');
   set('car-group',result.carValid?money(result.carTotal):'—');
   set('cars','Total de todos los coches');
   set('bonus-note',result.bonus.valid?
     (bonusExtras.length?'Abonos + '+bonusExtras.length+' billete(s) extra; cobertura indicada por ti.':
       'Añade los billetes que el abono no cubra.') :
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
      result.choice==='bonus'?'Abonos + extras':'Billetes sueltos';
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
     result.choice==='car'?
       'Con estos importes, el coche cuesta menos; revisa aparcamiento y accesos.':
     result.choice==='bonus'?
       'Con los abonos y billetes extra indicados, esta opción cuesta menos. Verifica qué cubre cada pase.':
       'Los billetes individuales son la alternativa más económica.';
   set('recommend-note',reason);
   set('sim-note','SIMULACIÓN · Los bonos no incluyen billetes automáticamente: añade aparte los trayectos no cubiertos. Comprueba condiciones.');
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
   if(f==='price'){pass.price=amount(event.target.value);pass.simulation=true;edited=true;}
   else if(f==='label'){pass.label=event.target.value.slice(0,48);pass.simulation=true;edited=true;}
   update();
 }
 function handleBonusExtra(event){
   const row=event.target.closest('.tc-bonus-extra');if(!row)return;
   const extra=bonusExtras.find(t=>t.id===Number(row.dataset.id));if(!extra)return;
   const f=event.target.dataset.field;
   if(f==='price'){const v=amount(event.target.value);extra.price=finite(v)?v:NaN;edited=true;}
   else if(f==='label')extra.label=event.target.value.slice(0,48);
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
 // Els petits resums també permeten anar directament al registre.
 for(const id of ['trip-preview','bonus-preview','extra-preview']){
   $(id).addEventListener('click',event=>{
     const chip=event.target.closest('.tc-selected-chip');
     if(!chip)return;
     const detail=$(chip.dataset.editor);
     if(detail)detail.open=true;
   });
 }
 $('close-trips').addEventListener('click',()=>{$('trip-detail').open=false;});
 $('close-bonuses').addEventListener('click',()=>{$('bonus-detail').open=false;});
 document.addEventListener?.('keydown',event=>{
   if(event.key==='Escape'){$('trip-detail').open=false;$('bonus-detail').open=false;}
 });
 $('trips').addEventListener('input',handleTrip);
 $('trips').addEventListener('change',handleTrip);
 $('passes').addEventListener('input',handlePass);
 $('passes').addEventListener('change',handlePass);
 $('bonus-extras').addEventListener('input',handleBonusExtra);
 $('bonus-extras').addEventListener('change',handleBonusExtra);
 $('bonus-extras').addEventListener('click',event=>{
   if(event.target.dataset.action!=='remove')return;
   const row=event.target.closest('.tc-bonus-extra');if(!row)return;
   bonusExtras=bonusExtras.filter(t=>t.id!==Number(row.dataset.id));renderBonusExtras();update();
 });
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
   if(passes.length>=30)return;
   passes.push(passFromPreset(null));renderPassEditor();$('bonus-detail').open=true;update();
 });
 $('add-bonus-extra').addEventListener('click',()=>{
   if(bonusExtras.length>=40)return;
   bonusExtras.push({id:++nextBonusExtra,label:'Billete '+(bonusExtras.length+1),price:NaN});
   renderBonusExtras();$('bonus-detail').open=true;update();
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
   bonusExtras=[];nextBonusExtra=0;
   edited=false;selected={car:true,individual:true,bonus:true};optionOrder=['car','individual','bonus'];
   $('trip-detail').open=false;$('bonus-detail').open=false;
   resetTrips();renderTripEditor();renderPassEditor();renderBonusExtras();renderTariffs();syncOptions();update();
 });
 $('trip-price').value=String(basePrice());
 renderTripEditor();renderPassEditor();renderBonusExtras();renderTariffs();syncOptions();update();
})(window);
