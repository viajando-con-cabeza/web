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
 const priceTotal=trips=>trips.reduce((sum,t)=>sum+Number(t.price)*clamp(t.people??1,1,30),0);
 // La cobertura de un título no se infiere de su descripción:
 // el usuario introduce el precio de cada abono y los billetes no cubiertos.
 function planBonuses(trips,passes,bonusExtras=[]){
   const active=(passes||[]).filter(pass=>pass.units!==0);
   if(!active.length&&!bonusExtras.length)return {valid:false,reason:'Añade al menos un abono o billete.'};
   if(active.length>30||active.some(pass=>!finite(amount(pass.price))||!Number.isInteger(Number(pass.people??1))||Number(pass.people??1)<1||Number(pass.people??1)>30))
     return {valid:false,reason:'Indica el precio de cada abono.'};
   if(bonusExtras.some(ticket=>!finite(ticket.price)||!Number.isInteger(Number(ticket.people??1))||Number(ticket.people??1)<1||Number(ticket.people??1)>30))
     return {valid:false,reason:'Revisa el precio de los billetes complementarios.'};
   const prepaid=active.reduce((sum,pass)=>sum+Number(pass.price)*Number(pass.people??1),0);
   const remaining=bonusExtras.reduce((sum,ticket)=>sum+Number(ticket.price)*Number(ticket.people??1),0);
   return {valid:true,cost:prepaid+remaining,prepaid,remaining,covered:null,units:active.length,
     approximate:false,manual:true,description:active.length+' abono(s) más '+bonusExtras.length+' billete(s) extra'};
 }
 function compare({trips=[],people=2,car={},passes=[],bonusExtras=[],days=3}={}){
   const travellers=clamp(people,1,30),duration=clamp(days,1,14);
   const individualValid=trips.length>0&&trips.every(t=>finite(t.price)&&Number.isInteger(t.day)&&t.day>=1&&t.day<=31&&Number.isInteger(Number(t.people??1))&&Number(t.people??1)>=1&&Number(t.people??1)<=30);
   const individual=individualValid?priceTotal(trips):null;
   const bonus=planBonuses(trips,passes,bonusExtras);
   const offers=[...(individualValid?[{type:'individual',cost:individual}]:[]),...(bonus.valid?[{type:'bonus',cost:bonus.cost}]:[])].sort((a,b)=>a.cost-b.cost);
   const publicMode=offers[0]?.type||null,publicTotal=offers[0]?.cost??null,publicCost=publicTotal===null?null:publicTotal/travellers;
   const rent=car.owned?0:amount(car.rental),fuel=amount(car.fuel),parking=amount(car.parking)??0,tolls=amount(car.tolls)??0,extras=amount(car.extras)??0;
   const carValid=[rent,fuel,parking,tolls,extras].every(finite);
   const carTotal=carValid?rent+fuel+parking*duration+tolls+extras:null;
   const alternatives=[
     ...(individualValid?[{type:'individual',cost:individual}]:[]),
     ...(bonus.valid?[{type:'bonus',cost:bonus.cost}]:[]),
     ...(carValid?[{type:'car',cost:carTotal}]:[])
   ].sort((a,b)=>a.cost-b.cost||(a.type==='car'?1:-1));
   if(!alternatives.length)return {valid:false,reason:'Añade viajes, abonos o costes del coche para empezar.'};
   const best=alternatives[0],next=alternatives[1];
   return {valid:true,travellers,individualValid,individual:individualValid?individual/travellers:null,individualTotal:individualValid?individual:null,
     bonus,publicCost,publicMode,publicTotal,
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
 let trips=defaultDays.map((day,i)=>({id:++nextTrip,day,label:'Viaje '+(i+1),people:2,price:basePrice()}));
 function passFromPreset(src){
   return {id:++nextPass,kind:'abono',preset:src?.id||'custom',label:src?.label||'Abono personalizado',
     type:src?.type||'rides',quantity:Number(src?.quantity||10),
     price:src?valueFor(src):null,people:2,units:1,simulation:false};
 }
 let bonusItems=[passFromPreset(presets.find(t=>t.quantity===72&&t.type==='hours')||presets[0])];
 const bonusPasses=()=>bonusItems.filter(item=>item.kind==='abono');
 const bonusTickets=()=>bonusItems.filter(item=>item.kind==='billete');
 const findPass=id=>bonusItems.find(p=>p.id===id);
 const findTrip=id=>trips.find(t=>t.id===id);
 const rowsCount=items=>items.reduce((sum,item)=>sum+Number(item.people||0),0);
 // Entradas editables siempre visibles: descripción, personas e importe por persona.
 // La lista admite borrado directo sin ventanas flotantes.
 function renderSelectionSummaries(){
   const populate=(id,items,empty,isBonus)=>{
     const target=$(id),scroll=target.scrollTop||0;
     target.replaceChildren();
     if(!items.length){target.append(el('span','tc-selected-empty',empty));return;}
     items.forEach((item,i)=>{
       const row=el('div','tc-entry-row'+(isBonus?' tc-entry-bonus':''));row.dataset.id=String(item.id);
       const field=(label,name,value,inputType)=>{
         const wrap=el('label','tc-entry-field tc-entry-'+name),title=el('span','',label);
         const input=el('input','tc-entry-input');input.dataset.field=name;
         input.type=inputType;input.value=value===null||value===undefined||Number.isNaN(value)?'':String(value);
         if(inputType==='number'){
           input.min=name==='people'?'1':'0';input.max=name==='people'?'30':'1000000';
           input.step=name==='people'?'1':'0.01';input.inputMode=name==='people'?'numeric':'decimal';
         }else{input.maxLength=isBonus?48:42;input.autocomplete='off';}
         input.setAttribute('aria-label',label+' '+(i+1));
         wrap.append(title,input);return wrap;
       };
       if(isBonus){
         const kind=el('label','tc-entry-field tc-entry-kind');
         const select=el('select','tc-entry-input');select.dataset.field='kind';
         for(const [value,title] of [['abono','Abono'],['billete','Billete']]){
           const option=el('option','',title);option.value=value;select.append(option);
         }
         select.value=item.kind;kind.append(el('span','','Tipo'),select);row.append(kind);
       }
       row.append(field('Descripción','label',item.label||'','text'),
         field('Personas','people',item.people??1,'number'),
         field('Importe · '+currency,'price',item.price,'number'));
       const del=el('button','tc-entry-delete','×');del.type='button';
       del.dataset.action='delete';del.title='Eliminar '+(item.label||'entrada');
       del.setAttribute('aria-label',del.title);
       row.append(del);target.append(row);
     });
     target.scrollTop=scroll;
   };
   populate('trip-preview',trips,'Añade un viaje para empezar',false);
   populate('bonus-preview',bonusItems,'Añade un abono o billete para empezar',true);
   set('trip-selected-count',trips.length+(trips.length===1?' viaje':' viajes'));
   set('bonus-selected-count',bonusItems.length+(bonusItems.length===1?' elemento':' elementos'));
 }
 for(const type of ['trip','bonus']){
   const list=$(type+'-preview');
   list.addEventListener('input',event=>{
     const row=event.target.closest('.tc-entry-row');
     if(!row)return;
     const item=type==='trip'?findTrip(Number(row.dataset.id)):findPass(Number(row.dataset.id));
     if(!item)return;
     const field=event.target.dataset.field;
     if(field==='label')item.label=event.target.value.slice(0,type==='trip'?42:48);
     if(field==='price')item.price=event.target.value===''?NaN:Number(event.target.value);
     if(field==='people')item.people=event.target.value===''?NaN:Number(event.target.value);
     update(true);
   });
   list.addEventListener('change',event=>{
     if(event.target.dataset.field!=='kind')return;
     const row=event.target.closest('.tc-entry-row'),item=findPass(Number(row?.dataset.id));
     if(item){item.kind=event.target.value==='billete'?'billete':'abono';update(true);}
   });
   list.addEventListener('click',event=>{
     const remove=event.target.closest('.tc-entry-delete');
     if(!remove)return;
     const row=remove.closest('.tc-entry-row'),id=Number(row?.dataset.id);
     if(type==='trip')trips=trips.filter(item=>item.id!==id);
     else bonusItems=bonusItems.filter(item=>item.id!==id);
     update();
   });
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
       total:result.bonus.valid?result.bonus.cost:null,
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
 function update(skipRows=false){
   if(!skipRows)renderSelectionSummaries();
   $('rental-wrap').hidden=$('car-type').value==='own';
   const travellers=clamp($('people').value,1,30);
   const car={owned:$('car-type').value==='own',
     rental:$('rental').value,fuel:$('fuel').value,parking:$('parking').value,
     tolls:$('tolls').value,extras:$('extras').value};
   const result=root.VCCTransportCompareCore.compare({
     trips,people:travellers,car,passes:bonusPasses(),bonusExtras:bonusTickets(),days:$('days').value});
   // Resums encara que no hi hagi una alternativa completa.
   const validAmounts=bonusItems.length>0&&bonusItems.every(item=>finite(amount(item.price))&&Number.isInteger(Number(item.people))&&Number(item.people)>=1&&Number(item.people)<=30);
   const listTotal=validAmounts?bonusItems.reduce((sum,item)=>sum+Number(item.price)*Number(item.people),0):null;
   const countBono=bonusPasses().length,countTicket=bonusTickets().length;
   const kinds=[countBono?countBono+(countBono===1?' abono':' abonos'):'',
     countTicket?countTicket+(countTicket===1?' billete':' billetes'):''].filter(Boolean).join(' + ');
   set('bonus-glance',(kinds||'Sin entradas')+' · '+(validAmounts?money(listTotal)+' en total':'indica precios'));
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
   set('bonus-person',result.bonus.valid?money(result.bonus.cost/travellers):'—');
   set('bonus-group',result.bonus.valid?money(result.bonus.cost):'—');
   set('car-person',result.carValid?money(result.carTotal/travellers):'—');
   set('car-group',result.carValid?money(result.carTotal):'—');
   set('bonus-note',result.bonus.valid?'Cada importe es por persona y título. Revisa qué cubre cada abono.':result.bonus.reason);
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
     result.bonus.valid?result.bonus.cost:null,
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
   set('sim-note','SIMULACIÓN · Multiplicamos el importe por el número de personas indicado en cada entrada. Comprueba precios y cobertura.');
 }
 $('add-pass').addEventListener('click',()=>{
   if(bonusItems.length>=40)return;
   bonusItems.push({id:++nextPass,kind:'abono',label:'Abono '+(bonusItems.length+1),
     price:null,people:clamp($('people').value,1,30),units:1,simulation:true});
   update();
   const list=$('bonus-preview');list.scrollTop=list.scrollHeight;
 });
 $('add-trip').addEventListener('click',()=>{
   if(trips.length>=40)return;
   trips.push({id:++nextTrip,day:1,label:'Viaje '+(trips.length+1),
     price:basePrice(),people:clamp($('people').value,1,30)});
   update();
   const list=$('trip-preview');list.scrollTop=list.scrollHeight;
 });
 for(const id of ['people','days','car-type','rental','fuel','parking','tolls','extras']){
   $(id).addEventListener('input',()=>{
     if(id==='days'){
       const n=clamp($('days').value,1,14);
       for(const trip of trips)trip.day=Math.min(trip.day,n);
     }
     update(true);
   });
 }
 $('reset').addEventListener('click',()=>{
   $('days').value='3';$('people').value='2';$('car-type').value='rent';
   for(const id of ['rental','fuel','parking','tolls','extras'])$(id).value='';
   trips=[];nextTrip=0;bonusItems=[];nextPass=0;
   update();
 });
 update();
})(window);
