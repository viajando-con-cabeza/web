/* VCC · Comparador compacto: coche, billetes individuales y abonos.
   Tarifas orientativas: window.VCCTransportDestination (por destino).
   Los abonos y billetes extra se introducen por persona; el motor no
   deduce su cobertura ni exige horarios. Edición directa en cada ficha. */
(function(root){
 'use strict';
 const finite=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
 const amount=value=>value===''||value===undefined||value===null?null:Number(value);
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(value))?Math.trunc(Number(value)):min));
 const format=(value,currency)=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(value)+' '+currency;
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
 function compare({trips=[],people=2,car={},passes=[],bonusExtras=[],days=3}={}){
   const travellers=clamp(people,1,30),duration=clamp(days,1,14);
   const individualValid=trips.length>0&&trips.every(t=>finite(t.price)&&Number.isInteger(t.day)&&t.day>=1&&t.day<=31);
   const individual=individualValid?priceTotal(trips):null;
   const bonus=planBonuses(trips,passes,bonusExtras);
   const offers=[...(individualValid?[{type:'individual',cost:individual}]:[]),...(bonus.valid?[{type:'bonus',cost:bonus.cost}]:[])].sort((a,b)=>a.cost-b.cost);
   const publicMode=offers[0]?.type||null,publicCost=offers[0]?.cost??null;
   const rent=car.owned?0:amount(car.rental),fuel=amount(car.fuel),parking=amount(car.parking)??0,tolls=amount(car.tolls)??0,extras=amount(car.extras)??0;
   const carValid=[rent,fuel,parking,tolls,extras].every(finite);
   const carTotal=carValid?rent+fuel+parking*duration+tolls+extras:null;
   const alternatives=[
     ...(individualValid?[{type:'individual',cost:individual*travellers}]:[]),
     ...(bonus.valid?[{type:'bonus',cost:bonus.cost*travellers}]:[]),
     ...(carValid?[{type:'car',cost:carTotal}]:[])
   ].sort((a,b)=>a.cost-b.cost||(a.type==='car'?1:-1));
   if(!alternatives.length)return {valid:false,reason:'Añade viajes, abonos o costes del coche para empezar.'};
   const best=alternatives[0],next=alternatives[1];
   return {valid:true,travellers,individualValid,individual,individualTotal:individualValid?individual*travellers:null,
     bonus,publicCost,publicMode,publicTotal:publicCost===null?null:publicCost*travellers,
     carValid,carTotal,unfinished:!individualValid||!bonus.valid||!carValid,
     choice:best.type,choiceTotal:best.cost,saving:next?Math.max(0,next.cost-best.cost):null,needsCarInputs:!carValid};
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
 let nextTrip=0,nextPass=0;
 const basePrice=()=>valueFor(singles)??0;
 let trips=defaultDays.map((day,i)=>({id:++nextTrip,day,mode:'metro',label:'Viaje '+(i+1),price:basePrice(),time:'',included:true,userEdited:false}));
 function passFromPreset(src){
   return {id:++nextPass,kind:'abono',preset:src?.id||'custom',label:src?.label||'Abono personalizado',
     type:src?.type||'rides',quantity:Number(src?.quantity||10),
     price:src?valueFor(src):null,units:1,simulation:false};
 }
 let bonusItems=[passFromPreset(presets.find(t=>t.quantity===72&&t.type==='hours')||presets[0])];
 let activeEdit=null;
 const bonusPasses=()=>bonusItems.filter(item=>item.kind==='abono');
 const bonusTickets=()=>bonusItems.filter(item=>item.kind==='billete');
 const findPass=id=>bonusItems.find(p=>p.id===id);
 const findTrip=id=>trips.find(t=>t.id===id);

 function closeQuickEditor(){
   activeEdit=null;
   $('trip-editor').hidden=true;$('bonus-editor').hidden=true;
 }
 function openQuickEditor(type,id){
   const item=type==='trip'?findTrip(id):findPass(id);
   if(!item)return;
   closeQuickEditor();activeEdit={type,id};
   const prefix=type==='trip'?'trip':'bonus';
   $(prefix+'-editor').hidden=false;
   const index=(type==='trip'?trips:bonusItems).findIndex(x=>x.id===id)+1;
   set(prefix+'-editor-title','Editar '+(type==='trip'?'viaje ':'entrada ')+String(index).padStart(2,'0'));
   $(prefix+'-editor-label').value=item.label||'';
   $(prefix+'-editor-price').value=finite(amount(item.price))?String(item.price):'';
   if(type==='bonus')$('bonus-editor-kind').value=item.kind;
   $(prefix+'-editor-label').focus?.();
 }
 function renderSelectionSummaries(){
   const populate=(id,items,empty,isBonus)=>{
     const target=$(id),scroll=target.scrollTop||0;
     target.replaceChildren();
     if(!items.length){target.append(el('span','tc-selected-empty',empty));return;}
     items.forEach((item,i)=>{
       const type=isBonus?'bonus':'trip',title=(item.label||('Entrada '+(i+1))).trim(),
         value=finite(amount(item.price))?money(Number(item.price)):'Sin precio';
       const chip=el('button','tc-selected-chip');chip.type='button';
       chip.dataset.type=type;chip.dataset.id=String(item.id);
       chip.title=String(i+1).padStart(2,'0')+' · '+(isBonus?(item.kind==='billete'?'Billete · ':'Abono · '):'')+title+' · '+value+' · Editar';
       chip.setAttribute('aria-label',chip.title);
       chip.append(el('span','tc-selected-index',String(i+1).padStart(2,'0')),
         ...(isBonus?[el('span','tc-selected-type',item.kind==='billete'?'B':'A')]:[]),
         el('span','tc-selected-name',title),el('span','tc-selected-price',value));
       target.append(chip);
     });
     target.scrollTop=scroll;
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
     {type:'car',name:'Coche',total:result.carValid?result.carTotal:null,
       issue:'Pendiente: introduce alquiler y combustible'},
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
     trips,people:travellers,car,passes:bonusPasses(),bonusExtras:bonusTickets(),days:$('days').value});
   // Resums encara que no hi hagi una alternativa completa.
   const validAmounts=bonusItems.length>0&&bonusItems.every(item=>finite(amount(item.price)));
   const listTotal=validAmounts?bonusItems.reduce((sum,item)=>sum+Number(item.price),0):null;
   const countBono=bonusPasses().length,countTicket=bonusTickets().length;
   const kinds=[countBono?countBono+(countBono===1?' abono':' abonos'):'',
     countTicket?countTicket+(countTicket===1?' billete':' billetes'):''].filter(Boolean).join(' + ');
   set('bonus-glance',(kinds||'Sin entradas')+' · '+(validAmounts?money(listTotal):'indica precios'));
   set('trip-count',trips.length+' viajes');
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
   set('individual-person',result.individualValid?money(result.individual):'—');
   set('individual-group',result.individualValid?money(result.individualTotal):'—');
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
     result.carValid?result.carTotal:null
   ].filter(value=>value!==null);
   const isTie=comparableTotals.filter(value=>Math.abs(value-result.choiceTotal)<0.005).length>1;
   const reason=!result.carValid?
     'Comparación provisional: informa alquiler y combustible para incluir el coche.':
     !result.individualValid?
       'Comparación provisional: añade viajes y precios para incluir los billetes.':
     !result.bonus.valid?
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
   update();
 }
 function adjustBasePrice(){
   const next=amount($('trip-price').value);
   if(!finite(next)){
     for(const t of trips)if(!t.userEdited)t.price=NaN;
     update();return;
   }
   for(const trip of trips)if(!trip.userEdited)trip.price=next;
   update();
 }
 function editCurrent(field,value){
   if(!activeEdit)return;
   const item=activeEdit.type==='trip'?findTrip(activeEdit.id):findPass(activeEdit.id);
   if(!item){closeQuickEditor();return;}
   if(field==='label')item.label=value.slice(0,activeEdit.type==='trip'?42:48);
   else if(field==='price'){
     const parsed=amount(value);
     item.price=finite(parsed)?parsed:NaN;
     if(activeEdit.type==='trip')item.userEdited=true;
   }else if(field==='kind'&&activeEdit.type==='bonus')item.kind=value==='billete'?'billete':'abono';
 }
 for(const type of ['trip','bonus']){
   $(type+'-preview').addEventListener('click',event=>{
     const chip=event.target.closest('.tc-selected-chip');if(!chip)return;
     openQuickEditor(type,Number(chip.dataset.id));
   });
   $(type+'-editor-label').addEventListener('input',event=>editCurrent('label',event.target.value));
   $(type+'-editor-price').addEventListener('input',event=>editCurrent('price',event.target.value));
   $(type+'-editor-close').addEventListener('click',closeQuickEditor);
   $(type+'-editor-done').addEventListener('click',closeQuickEditor);
   $(type+'-editor-delete').addEventListener('click',()=>{
     if(!activeEdit||activeEdit.type!==type)return;
     if(type==='trip'){
       trips=trips.filter(t=>t.id!==activeEdit.id);
       $('trip-number').value=String(trips.length);
     }else bonusItems=bonusItems.filter(t=>t.id!==activeEdit.id);
     closeQuickEditor();update();
   });
 }
 $('bonus-editor-kind').addEventListener('change',event=>editCurrent('kind',event.target.value));
 document.addEventListener?.('keydown',event=>{
   if(event.key==='Escape')closeQuickEditor();
   else if(event.key==='Enter'&&activeEdit&&event.target?.closest?.('.tc-quick-editor'))closeQuickEditor();
 });
 $('add-pass').addEventListener('click',()=>{
   if(bonusItems.length>=40)return;
   bonusItems.push({id:++nextPass,kind:'abono',label:'Abono '+(bonusItems.length+1),price:null,units:1,simulation:true});
   update();
   const list=$('bonus-preview');list.scrollTop=list.scrollHeight;
 });
 $('add-trip').addEventListener('click',()=>{
   if(trips.length>=40)return;
   $('trip-number').value=String(trips.length+1);
   adjustTripCount();
   const list=$('trip-preview');list.scrollTop=list.scrollHeight;
 });
 $('trip-number').addEventListener('input',adjustTripCount);
 $('trip-number').addEventListener('change',adjustTripCount);
 $('trip-price').addEventListener('change',adjustBasePrice);
 $('trip-price').addEventListener('input',adjustBasePrice);
 for(const id of ['people','days','car-type','rental','fuel','parking','tolls','extras']){
   $(id).addEventListener('input',()=>{
     if(id==='days'){
       const n=clamp($('days').value,1,14);
       for(const trip of trips)trip.day=Math.min(trip.day,n);
     }
     update();
   });
 }
 $('reset').addEventListener('click',()=>{
   $('days').value='3';$('people').value='2';$('car-type').value='rent';
   for(const id of ['rental','fuel','parking','tolls','extras'])$(id).value='';
   $('trip-number').value='0';$('trip-price').value=String(basePrice());
   trips=[];nextTrip=0;bonusItems=[];nextPass=0;
   closeQuickEditor();update();
 });
 $('trip-price').value=String(basePrice());
 update();
})(window);
