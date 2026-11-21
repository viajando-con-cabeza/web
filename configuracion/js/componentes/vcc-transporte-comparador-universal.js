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
   if(!active.length&&!bonusExtras.length)return {valid:false,reason:'Añade al menos un abono o billete.'};
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
   const choice=alternatives[0],next=alternatives.find(a=>a!==choice);
   const unfinished=active.car&&(!carValid||!sameRoute)||active.bonus&&!bonus.valid;
   return {valid:true,travellers,individual,individualTotal:individual*travellers,
     bonus,publicCost,publicMode,publicTotal:publicCost===null?null:publicCost*travellers,
     carValid,carTotal,sameRoute,active,unfinished,
     choice:choice.type,choiceTotal:choice.cost,saving:next?Math.max(0,next.cost-choice.cost):null,
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
 const selected={car:true,individual:true,bonus:true};
 const basePrice=()=>valueFor(singles)??0;
 let trips=defaultDays.map((day,i)=>({id:++nextTrip,day,mode:'metro',label:'Viaje '+(i+1),price:basePrice(),time:'',included:true,userEdited:false}));
 function passFromPreset(src){
   return {id:++nextPass,kind:'abono',preset:src?.id||'custom',label:src?.label||'Abono personalizado',
     type:src?.type||'rides',quantity:Number(src?.quantity||10),
     price:src?valueFor(src):null,units:1,simulation:false};
 }
 let bonusItems=[passFromPreset(presets.find(t=>t.quantity===72&&t.type==='hours')||presets[0])];
 const bonusPasses=()=>bonusItems.filter(item=>item.kind==='abono');
 const bonusTickets=()=>bonusItems.filter(item=>item.kind==='billete');
 const findPass=id=>bonusItems.find(p=>p.id===id);
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
   set('trip-edit-count','('+trips.length+')');
 }
 function renderPassEditor(){
   const list=$('passes');list.replaceChildren();
   bonusItems.forEach((item,i)=>{
     const row=el('div','tc-trip tc-trip-simple tc-pass-row');row.dataset.id=String(item.id);
     const num=el('span','tc-trip-number',String(i+1).padStart(2,'0'));
     const kind=el('select');kind.dataset.field='kind';
     kind.setAttribute('aria-label','Tipo de entrada '+(i+1));
     for(const [value,label] of [['abono','Abono'],['billete','Billete']]){
       const opt=el('option','',label);opt.value=value;kind.append(opt);
     }
     kind.value=item.kind;
     const name=input(item.label,'text','label','Descripción de la entrada '+(i+1));
     name.maxLength=48;name.placeholder=item.kind==='billete'?'Ej. Ferry extra':'Ej. Abono 72 h';
     const price=input(item.price,'number','price','Precio de la entrada '+(i+1)+' en '+currency);
     price.placeholder='Precio';
     const remove=el('button','tc-remove','×');remove.type='button';remove.dataset.action='remove';
     remove.setAttribute('aria-label','Eliminar entrada '+(i+1));
     row.append(num,kind,name,price,remove);
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
   const populate=(id,items,empty,isBonus)=>{
     const target=$(id);target.replaceChildren();
     if(!items.length){target.append(el('span','tc-selected-empty',empty));return;}
     items.forEach((item,i)=>{
       const title=(item.label||('Entrada '+(i+1))).trim();
       const value=finite(amount(item.price))?money(Number(item.price)):'Sin precio';
       const chip=el('button','tc-selected-chip');
       chip.type='button';chip.dataset.editor=isBonus?'bonus-detail':'trip-detail';
       chip.title=String(i+1).padStart(2,'0')+' · '+(isBonus?(item.kind==='billete'?'Billete · ':'Abono · '):'')+title+' · '+value+' · Editar';
       chip.setAttribute('aria-label',chip.title);
       chip.append(
         el('span','tc-selected-index',String(i+1).padStart(2,'0')),
         ...(isBonus?[el('span','tc-selected-type',item.kind==='billete'?'B':'A')]:[]),
         el('span','tc-selected-name',title),
         el('span','tc-selected-price',value)
       );
       target.append(chip);
     });
   };
   populate('trip-preview',trips,'Sin viajes',false);
   populate('bonus-preview',bonusItems,'Sin entradas',true);
   set('trip-selected-count',trips.length+(trips.length===1?' viaje':' viajes'));
   set('bonus-selected-count',bonusItems.length+(bonusItems.length===1?' elemento':' elementos'));
 }
 // Recomanació editorial: compara el cost final de tot el grup i mostra
 // l'estalvi davant de cadascuna de les dues alternatives restants.
 // Una opció sense import complet mai es tracta com si costés 0.
 function renderComparisons(result,travellers){
   const list=$('comparison-items');list.replaceChildren();
   const candidates=[
     {type:'car',name:'Coche',total:result.carValid&&result.sameRoute?result.carTotal:null,
       issue:!result.sameRoute?'No comparable: recorrido distinto':'Pendiente: introduce alquiler y combustible'},
     {type:'individual',name:'Billetes sueltos',total:result.individualTotal,issue:''},
     {type:'bonus',name:bonusPasses().length?'Abonos y pases':'Billetes personalizados',
       total:result.bonus.valid?result.bonus.cost*travellers:null,
       issue:result.bonus.reason||'Completa los precios de la lista'}
   ];
   const best=candidates.find(candidate=>candidate.type===result.choice);
   if(!best)return;
   candidates.filter(candidate=>candidate.type!==result.choice).forEach(candidate=>{
     const row=el('div','tc-compare-item');
     const first=el('div','tc-compare-item-heading');
     first.append(el('span','tc-compare-item-name',candidate.name),
       el('strong','tc-compare-item-cost',candidate.total===null?'—':money(candidate.total/travellers)+' / persona'));
     const detail=el('div','tc-compare-item-detail');
     if(candidate.total===null){
       row.dataset.state='pending';
       detail.textContent=candidate.issue;
     }else{
       const difference=Math.max(0,candidate.total-best.total);
       row.dataset.state=difference>0.005?'positive':'equal';
       detail.textContent=difference>0.005?
         'Ahorras '+money(difference/travellers)+' / persona · '+money(difference)+' en total':
         'Mismo precio que la opción recomendada';
     }
     row.append(first,detail);
     list.append(row);
   });
   const validRivals=candidates.filter(candidate=>candidate.type!==result.choice&&candidate.total!==null)
     .sort((a,b)=>a.total-b.total);
   const closest=validRivals[0];
   const savingBox=$('saving')?.closest('.tc-saving');
   if(!closest){
     if(savingBox)savingBox.dataset.state='pending';
     set('saving-label','Ahorro pendiente de comparar');
     set('saving','—');
     set('saving-detail','Completa los importes de las otras opciones');
     return;
   }
   const saving=Math.max(0,closest.total-best.total),pending=result.unfinished;
   if(savingBox)savingBox.dataset.state=saving>0.005?'positive':'zero';
   set('saving-label',saving>0.005?(pending?'Ahorro parcial frente a '+closest.name:'Te ahorras frente a '+closest.name):'Mismo coste que '+closest.name);
   set('saving',money(saving/travellers));
   set('saving-detail',(pending?'Comparación provisional · ':'')+money(saving)+' en total');
 }
 function update(){
   renderSelectionSummaries();
   $('rental-wrap').hidden=$('car-type').value==='own';
   const travellers=clamp($('people').value,1,30);
   const car={owned:$('car-type').value==='own',
     rental:$('rental').value,fuel:$('fuel').value,parking:$('parking').value,
     tolls:$('tolls').value,extras:$('extras').value};
   const result=root.VCCTransportCompareCore.compare({
     trips,people:travellers,car,passes:bonusPasses(),bonusExtras:bonusTickets(),days:$('days').value,selected,sameRoute:$('same-route').checked});
   if(!result.valid){
     set('conclusion-label','COMPARACIÓN SIN COMPLETAR');
     set('recommend','Revisa los importes');
     const savingBox=$('saving')?.closest('.tc-saving');
     if(savingBox)savingBox.dataset.state='pending';
     set('saving-label','Ahorro pendiente de comparar');
     set('saving-detail','por persona');
     $('comparison-items').replaceChildren();
     for(const id of ['individual-person','individual-group','bonus-person','bonus-group','car-person','car-group','recommend-person','recommend-group','saving'])set(id,'—');
     set('group-label',travellers+(travellers===1?' viajero':' viajeros'));
     set('recommend-note',result.reason);return;
   }
   const validAmounts=bonusItems.length>0&&bonusItems.every(item=>finite(amount(item.price)));
   const listTotal=validAmounts?bonusItems.reduce((sum,item)=>sum+Number(item.price),0):null;
   const countBono=bonusPasses().length,countTicket=bonusTickets().length;
   const kinds=[countBono?countBono+(countBono===1?' abono':' abonos'):'',
     countTicket?countTicket+(countTicket===1?' billete':' billetes'):''].filter(Boolean).join(' + ');
   set('bonus-glance',(kinds||'Sin entradas')+' · '+(validAmounts?money(listTotal):'indica precios'));
   set('trip-count',trips.length+' viajes');
   set('individual-person',money(result.individual));set('individual-group',money(result.individualTotal));
   set('bonus-person',result.bonus.valid?money(result.bonus.cost):'—');
   set('bonus-group',result.bonus.valid?money(result.bonus.cost*travellers):'—');
   set('car-person',result.carValid?money(result.carTotal/travellers):'—');
   set('car-group',result.carValid?money(result.carTotal):'—');
   set('bonus-note',result.bonus.valid?'Importes por persona. Revisa qué cubre cada abono antes de comprar.':result.bonus.reason);
   const bestPublic=result.publicMode==='bonus'?'Bono':'Billetes';
   set('best-public',result.publicCost===null?'':('Mejor: '+bestPublic+' · '+money(result.publicCost)+' / persona'));
   const mark=(selector,chosen)=>{
     const element=container.querySelector(selector);
     if(element?.classList)element.classList.toggle('tc-winner',chosen);
   };
   mark('.tc-option-car',result.choice==='car');
   mark('.tc-option-individual',result.choice==='individual');
   mark('.tc-option-bonus',result.choice==='bonus');
   set('conclusion-label',result.unfinished?'MEJOR ENTRE LOS IMPORTES DISPONIBLES · VCC':'OPCIÓN MÁS ECONÓMICA · VCC');
   const title=result.choice==='car'?'Coche':
      result.choice==='bonus'?(bonusPasses().length?(bonusTickets().length?'Abonos y billetes':'Abonos'):'Billetes personalizados'):'Billetes sueltos';
   set('recommend',title);
   set('recommend-person',money(result.choiceTotal/travellers));
   set('recommend-group',money(result.choiceTotal));
   set('group-label',travellers+(travellers===1?' viajero':' viajeros'));
   renderComparisons(result,travellers);
   const comparableTotals=[
     result.individualTotal,
     result.bonus.valid?result.bonus.cost*travellers:null,
     result.carValid&&result.sameRoute?result.carTotal:null
   ].filter(value=>value!==null);
   const isTie=comparableTotals.filter(value=>Math.abs(value-result.choiceTotal)<0.005).length>1;
   const reason=selected.car&&!result.sameRoute?
     'El coche se excluye: no cubre el mismo recorrido.':
     selected.car&&!result.carValid?
       'Comparación provisional: informa alquiler y combustible para incluir el coche.':
     selected.bonus&&!result.bonus.valid?
       'Comparación provisional: revisa los precios y la cobertura de los abonos.':
     isTie?
       'Hay un empate en el precio más bajo; elige según comodidad y recorrido.':
     result.choice==='car'?
       'Con estos importes, el coche cuesta menos; revisa aparcamiento y accesos.':
     result.choice==='bonus'?
       'La combinación que has indicado cuesta menos. Revisa la validez y cobertura de los títulos.':
       'Los billetes individuales son la alternativa más económica.';
   set('recommend-note',reason);
   set('sim-note','SIMULACIÓN · Cada abono o billete extra se introduce por persona. Comprueba precios y cobertura antes de comprar.');
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
   const item=findPass(Number(row.dataset.id));if(!item)return;
   const field=event.target.dataset.field;
   if(field==='kind'){
     item.kind=event.target.value==='billete'?'billete':'abono';
     item.simulation=true;edited=true;
   }else if(field==='price'){
     item.price=amount(event.target.value);item.simulation=true;edited=true;
   }else if(field==='label'){
     item.label=event.target.value.slice(0,48);item.simulation=true;edited=true;
   }
   update();
 }
 // Les tres alternatives són fixes, sempre visibles i en el mateix ordre.
 // Els petits resums també permeten anar directament al registre.
 for(const id of ['trip-preview','bonus-preview']){
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
 $('trips').addEventListener('click',event=>{
   if(event.target.dataset.action!=='remove')return;
   const row=event.target.closest('.tc-trip');if(!row)return;
   trips=trips.filter(item=>item.id!==Number(row.dataset.id));
   $('trip-number').value=String(trips.length);
   renderTripEditor();update();
 });
 $('passes').addEventListener('click',event=>{
   if(event.target.dataset.action!=='remove')return;
   const row=event.target.closest('.tc-pass-row');if(!row)return;
   bonusItems=bonusItems.filter(item=>item.id!==Number(row.dataset.id));
   renderPassEditor();update();
 });
 $('add-pass').addEventListener('click',()=>{
   if(bonusItems.length>=40)return;
   bonusItems.push({id:++nextPass,kind:'abono',label:'Abono '+(bonusItems.length+1),price:null,units:1,simulation:true});
   renderPassEditor();$('bonus-detail').open=true;update();
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
   nextPass=0;bonusItems=[passFromPreset(presets.find(t=>t.quantity===72&&t.type==='hours')||presets[0])];
   edited=false;
   $('trip-detail').open=false;$('bonus-detail').open=false;
   resetTrips();renderTripEditor();renderPassEditor();renderTariffs();update();
 });
 $('trip-price').value=String(basePrice());
 renderTripEditor();renderPassEditor();renderTariffs();update();
})(window);
