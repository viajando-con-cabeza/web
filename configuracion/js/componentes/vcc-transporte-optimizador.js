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
   const price=raw&&raw.price&&Number(raw.price[category]);
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
 function solve({days=[],catalog=[],category='adult',people=1}={}){
  const counts=days.slice(0,31).map(v=>integer(v,0,40));
  const n=counts.length,travellers=integer(people,1,100);
  const {candidates,uncomparable}=normalize(catalog,category);
  const rides=candidates.filter(p=>p.type==='rides');
  const timed=candidates.filter(p=>p.days>0);
  if(!rides.length&& !timed.length)return {valid:false,reason:'No hay títulos válidos para esta tarifa',uncomparable};
  const largestPack=Math.max(1,...rides.map(r=>r.quantity));
  const maxDemand=Math.max(0,...counts);
  const maxPurchase=maxDemand+largestPack-1;
  const costs=Array(maxPurchase+1).fill(Infinity);
  const coinPath=Array(maxPurchase+1).fill(null);
  costs[0]=0;coinPath[0]=[];
  // Cantidad comprada exacta en cada día (unbounded knapsack).
  for(let q=1;q<=maxPurchase;q++){
   for(const fare of rides){
    const prev=q-fare.quantity;
    if(prev<0||!Number.isFinite(costs[prev]))continue;
    const val=costs[prev]+fare.price;
    if(val<costs[q]-0.000001){
     costs[q]=val;
     coinPath[q]=[...coinPath[prev],fare.label];
    }
   }
  }
  const cache=new Map();
  const dayName=(start,span)=>span>1?'Días '+(start+1)+'–'+(start+span):'Día '+(start+1);
  function recur(day,credit){
   if(day>=n)return {cost:0,steps:[],passCount:0};
   const key=day+'|'+credit;
   if(cache.has(key))return cache.get(key);
   const demand=counts[day];
   let best={cost:Infinity,steps:[],passCount:Infinity};
   // Si aquí no se necesita transporte, conservar el saldo de viajes.
   if(demand===0){
    const after=recur(day+1,credit);
    best={cost:after.cost,steps:after.steps,passCount:after.passCount};
   }else{
    const required=Math.max(0,demand-credit);
    // Nunca es óptimo comprar más de un paquete extra sin descuento:
    // puede dejarse esa compra para un día posterior.
    for(let q=required;q<=required+largestPack-1;q++){
     if(q>maxPurchase||!Number.isFinite(costs[q]))continue;
     const rest=credit+q-demand;
     if(rest<0||rest>=largestPack)continue;
     const after=recur(day+1,rest);
     const price=costs[q]+after.cost;
     const count=(coinPath[q]?.length||0)+after.passCount;
     if(price<best.cost-0.000001||(Math.abs(price-best.cost)<0.000001&&count<best.passCount)){
      const combo=new Map();
      for(const title of coinPath[q]||[])combo.set(title,(combo.get(title)||0)+1);
      const bought=[...combo].map(([label,amount])=>amount+' × '+label).join(' + ');
      best={
       cost:price,passCount:count,
       steps:[
        ...(q? [dayName(day,1)+': '+bought+(credit?' (saldo anterior: '+credit+')':'')]
              : credit? [dayName(day,1)+': saldo de viajes']: []),
        ...after.steps
       ]
      };
     }
    }
   }
   for(const ticket of timed){
    const span=Math.min(n-day,ticket.days);
    // Evitar comprar abonos en días enteros sin trayectos.
    if(!counts.slice(day,day+span).some(Boolean))continue;
    const after=recur(day+span,credit);
    const price=ticket.price+after.cost;
    const passes=1+after.passCount;
    if(price<best.cost-0.000001||(Math.abs(price-best.cost)<0.000001&&passes<best.passCount)){
     best={cost:price,passCount:passes,steps:[dayName(day,span)+': '+ticket.label,...after.steps]};
    }
   }
   cache.set(key,best);
   return best;
  }
  const best=recur(0,0);
  const singles=rides.filter(p=>p.quantity===1).sort((a,b)=>a.price-b.price)[0];
  const singleTotal=singles?counts.reduce((s,v)=>s+v,0)*singles.price:null;
  return {
   valid:Number.isFinite(best.cost),perPerson:best.cost,total:best.cost*travellers,
   people:travellers,steps:best.steps,
   singleTotal,pass72:timed.filter(p=>p.type==='hours'&&p.quantity===72)
     .map(p=>p.price).sort((a,b)=>a-b)[0]??null,
   uncomparable,products:candidates,category,
   approximation:'Los abonos por horas se calculan por bloques de días, no con horas de activación.'
  };
 }
 root.VCCTransportOptimizer={solve,normalize};
})(typeof window!=='undefined'?window:globalThis);
