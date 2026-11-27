/* VCC · Núcleo de comparación de transporte multidestino (sin DOM ni red).
   Datos: catálogo de cada destino, separados del cálculo y de la presentación.
   Entradas: VALIDACIONES de billete por día, NO transbordos físicos.
   Un título por horas >=24h se aproxima a días completos, nunca a horas reales.
   Abonos de menos de 24h: se listan, pero SIN compararlos automáticamente porque
   requieren las horas reales de cada trayecto. Paquetes por viajes: por persona,
   sin caducidad dentro de la estancia y no transferibles, salvo nuevo modelado.
   Esta aproximación se comunica en la interfaz. */
(function (root) {
 'use strict';
 const integer=(value,min,max)=>{
  const n=Number(value);
  return Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):min;
 };
 function normalize(catalog,category){
  const candidates=[],uncomparable=[];
  for(const raw of Array.isArray(catalog)?catalog:[]){
   const price=raw&&raw.price&&raw.price[category]!=null&&raw.price[category]!==''?Number(raw.price[category]):NaN;
   const quantity=Number(raw&&raw.quantity);
   if(!raw||!raw.id||!raw.label||!Number.isFinite(price)||price<0||
      !Number.isInteger(quantity)||quantity<1||quantity>365)continue;
   const product={id:raw.id,label:String(raw.label),type:raw.type,
      quantity,price,scope:raw.scope||'person'};
   if(product.scope!=='person'){
    uncomparable.push({...product,reason:'Este título se comparte entre viajeros: requiere reglas específicas'});
    continue;
   }
   if(raw.type==='rides'){
    candidates.push({...product,days:0});
   }else if(raw.type==='days'){
    candidates.push({...product,days:quantity});
   }else if(raw.type==='hours'&&quantity>=24&&quantity%24===0){
    candidates.push({...product,days:quantity/24});
   }else{
    uncomparable.push({...product,reason:'Requiere las horas reales de salida y validación'});
   }
  }
  return {candidates,uncomparable};
 }
 function solve({days=[],catalog=[],category='adult',people=1,requireBundle=false}={}){
  const counts=days.slice(0,31).map(v=>integer(v,0,40));
  const n=counts.length,travellers=integer(people,1,100);
  const {candidates,uncomparable}=normalize(catalog,category);
  const rides=candidates.filter(p=>p.type==='rides');
  const timed=candidates.filter(p=>p.days>0);
  if(!rides.length&&!timed.length)return {valid:false,reason:'No hay títulos válidos para esta tarifa',uncomparable};
  // Estado [sin bono/con bono] para evitar presentar billetes sueltos como "abonamiento".
  const largestPack=Math.max(1,...rides.map(r=>r.quantity));
  const maxDemand=Math.max(0,...counts);
  const maxPurchase=maxDemand+largestPack-1;
  const prices=Array.from({length:maxPurchase+1},()=>[Infinity,Infinity]);
  const paths=Array.from({length:maxPurchase+1},()=>[null,null]);
  prices[0][0]=0;paths[0][0]=[];
  for(let q=1;q<=maxPurchase;q++){
   for(const fare of rides){
    const prev=q-fare.quantity;
    if(prev<0)continue;
    const isBundle=fare.quantity>1?1:0;
    for(let state=0;state<=1;state++){
     if(!Number.isFinite(prices[prev][state]))continue;
     const dest=state|isBundle,price=prices[prev][state]+fare.price;
     if(price<prices[q][dest]-0.000001){
      prices[q][dest]=price;paths[q][dest]=[...paths[prev][state],fare.label];
     }
    }
   }
  }
  const memo=new Map();
  const dayName=(start,span)=>span>1?'Días '+(start+1)+'–'+(start+span):'Día '+(start+1);
  const invalid=()=>({cost:Infinity,steps:[],passCount:Infinity,hasBundle:false});
  function recur(day,credit,needBundle){
   if(day>=n)return needBundle?invalid():{cost:0,steps:[],passCount:0,hasBundle:false};
   const key=day+'|'+credit+'|'+Number(needBundle);
   if(memo.has(key))return memo.get(key);
   const demand=counts[day];
   let best=invalid();
   const offer=(price,count,steps,hasBundle)=>{
    if(price<best.cost-0.000001||
      (Math.abs(price-best.cost)<0.000001&&count<best.passCount)){
      best={cost:price,steps,passCount:count,hasBundle};
    }
   };
   if(demand===0){
    const after=recur(day+1,credit,needBundle);
    if(Number.isFinite(after.cost))offer(after.cost,after.passCount,after.steps,after.hasBundle);
   }else{
    const required=Math.max(0,demand-credit);
    for(let q=required;q<=required+largestPack-1;q++){
     if(q>maxPurchase)continue;
     const rest=credit+q-demand;
     if(rest<0||rest>=largestPack)continue;
     for(let boughtBundle=0;boughtBundle<=1;boughtBundle++){
      if(!Number.isFinite(prices[q][boughtBundle]))continue;
      const after=recur(day+1,rest,needBundle&&!boughtBundle);
      if(!Number.isFinite(after.cost))continue;
      const coinPath=paths[q][boughtBundle]||[];
      const group=new Map();
      for(const label of coinPath)group.set(label,(group.get(label)||0)+1);
      const purchased=[...group].map(([label,quantity])=>quantity+' × '+label).join(' + ');
      offer(prices[q][boughtBundle]+after.cost,coinPath.length+after.passCount,[
       ...(q?[dayName(day,1)+': '+purchased+(credit?' (saldo anterior: '+credit+')':'')]
           :credit?[dayName(day,1)+': saldo de viajes']:[]),
       ...after.steps
      ],Boolean(boughtBundle)||after.hasBundle);
     }
    }
   }
   // Un bono válido puede cubrir varios días; el coste no depende de pasajeros,
   // porque cada uno necesita su propio título (scope:person).
   for(const ticket of timed){
    const span=Math.min(n-day,ticket.days);
    if(!counts.slice(day,day+span).some(Boolean))continue;
    const after=recur(day+span,credit,false);
    if(!Number.isFinite(after.cost))continue;
    offer(ticket.price+after.cost,1+after.passCount,
      [dayName(day,span)+': '+ticket.label,...after.steps],true);
   }
   memo.set(key,best);
   return best;
  }
  const best=recur(0,0,Boolean(requireBundle));
  const singles=rides.filter(p=>p.quantity===1).sort((a,b)=>a.price-b.price)[0];
  const singleTotal=singles?counts.reduce((s,v)=>s+v,0)*singles.price:null;
  return {
   valid:Number.isFinite(best.cost),perPerson:best.cost,total:best.cost*travellers,
   people:travellers,steps:best.steps,hasBundle:best.hasBundle,
   singleTotal,singleUnit:singles?.price??null,
   pass72:timed.filter(p=>p.type==='hours'&&p.quantity===72).map(p=>p.price).sort((a,b)=>a-b)[0]??null,
   uncomparable,products:candidates,category,
   approximation:'Los abonos por horas se calculan por bloques de días, no con horas de activación.'
  };
 }
 root.VCCTransportOptimizer={solve,normalize};
})(typeof window!=='undefined'?window:globalThis);
