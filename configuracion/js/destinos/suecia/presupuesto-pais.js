/* Suecia · Calculadora de presupuesto de país.
   Un modelo orientativo separado del presupuesto REAL de Estocolmo.
   Mantiene las cinco categorías y controles de la calculadora VCC. */
(function(){
  "use strict";
  const categories=["alojamiento","comida","transporte","actividades","extras"];
  const names={alojamiento:"Alojamiento",comida:"Comida",transporte:"Transporte",actividades:"Actividades",extras:"Extras"};
  const colors=["#ca765c","#e6a35a","#6ca09b","#769a70","#b79d87"];
  // Euros de ejemplo por persona/noche (alojamiento) y persona/día (resto).
  // No son precios de una reserva ni importes reales para todo Suecia.
  const baseline={
    mochilero:{alojamiento:22,comida:15,transporte:10,actividades:8,extras:5},
    vcc:{alojamiento:35,comida:25,transporte:15,actividades:12,extras:8},
    medio:{alojamiento:60,comida:35,transporte:20,actividades:15,extras:10},
    lujo:{alojamiento:105,comida:60,transporte:30,actividades:20,extras:15}
  };
  // Ajustes heurísticos para simular rutas, no estadísticas regionales.
  const regionalFactors={
    sur:{alojamiento:.93,comida:.95,transporte:1.05,actividades:1,extras:1},
    centro:{alojamiento:1,comida:1,transporte:1,actividades:1,extras:1},
    norte:{alojamiento:1.13,comida:1.06,transporte:1.30,actividades:1.25,extras:1.05}
  };
  const state={days:7,nights:7,people:2,region:"centro",choices:{alojamiento:"vcc",comida:"vcc",transporte:"vcc",actividades:"vcc",extras:"vcc"}};
  const euro=(value)=>Math.round(value).toLocaleString("es-ES")+" €";
  const unit=(category,style)=>Math.round(baseline[style][category]*regionalFactors[state.region][category]);
  const get=(id)=>document.getElementById(id);
  const buttons=[...document.querySelectorAll(".swb-style-card[data-style]")];
  const categorySelects=[...document.querySelectorAll("[data-category]")];
  if(!get("swb-grand-total")||!buttons.length||!categorySelects.length)return;
  function selectedStyle(){
    const values=categories.map(category=>state.choices[category]);
    return values.every(style=>style===values[0])?values[0]:null;
  }
  function calculate(){
    const totals={};
    categories.forEach(category=>{
      const amount=unit(category,state.choices[category]);
      totals[category]=amount*(category==="alojamiento"?state.nights:state.days)*state.people;
      get("swb-price-"+category).textContent=euro(amount);
      get("swb-total-"+category).textContent=euro(totals[category]);
    });
    return {totals,total:categories.reduce((sum,category)=>sum+totals[category],0)};
  }
  function render(){
    const values=calculate();
    const avg=values.total/state.people/state.days;
    get("swb-days").textContent=state.days;
    get("swb-nights").textContent=state.nights;
    get("swb-people").textContent=state.people;
    get("swb-grand-total").textContent=euro(values.total);
    get("swb-result-meta").textContent=state.people+(state.people===1?" persona":" personas")+" · "+state.days+(state.days===1?" día":" días")+" · "+state.nights+(state.nights===1?" noche":" noches");
    get("swb-result-average").textContent=avg.toLocaleString("es-ES",{maximumFractionDigits:2})+" € / persona / día";
    get("swb-donut-pct").textContent=euro(avg);
    const donutInner=get("swb-donut-pct").nextElementSibling;
    if(donutInner)donutInner.textContent="pax / día";
    let arc=0;
    const segments=categories.map((category,index)=>{
      const start=arc;
      arc+=values.total?values.totals[category]/values.total*100:0;
      return colors[index]+" "+start.toFixed(3)+"% "+arc.toFixed(3)+"%";
    });
    get("swb-donut").style.background="conic-gradient("+segments.join(",")+")";
    get("swb-donut").setAttribute("aria-label","Desglose estimado: "+categories.map(category=>names[category]+" "+euro(values.totals[category])).join(", "));
    const current=selectedStyle();
    buttons.forEach(button=>{
      const style=button.dataset.style;
      const active=style===current;
      button.classList.toggle("is-active",active);
      button.setAttribute("aria-pressed",String(active));
      const amount=categories.reduce((sum,category)=>sum+unit(category,style),0);
      const label=button.querySelector(".swb-style-bottom strong");
      if(label)label.textContent="≈ "+euro(amount);
    });
    document.querySelectorAll("[data-step]").forEach(button=>{
      const key=button.dataset.step;
      const delta=Number(button.dataset.delta);
      const min=key==="nights"?0:1;
      const max=key==="people"?12:60;
      button.disabled=delta<0?state[key]<=min:state[key]>=max;
    });
  }
  buttons.forEach(button=>button.addEventListener("click",()=>{
    const style=button.dataset.style;
    if(!baseline[style])return;
    categories.forEach(category=>{
      state.choices[category]=style;
      const select=get("swb-select-"+category);
      if(select)select.value=style;
    });
    render();
  }));
  categorySelects.forEach(select=>select.addEventListener("change",()=>{
    const category=select.dataset.category;
    if(categories.includes(category)&&baseline[select.value]){
      state.choices[category]=select.value;
      render();
    }
  }));
  get("swb-region").addEventListener("change",event=>{
    if(regionalFactors[event.target.value]){
      state.region=event.target.value;
      render();
    }
  });
  document.querySelectorAll("[data-step]").forEach(button=>button.addEventListener("click",()=>{
    const key=button.dataset.step;
    if(!["days","nights","people"].includes(key))return;
    const delta=Number(button.dataset.delta);
    const min=key==="nights"?0:1;
    const max=key==="people"?12:60;
    state[key]=Math.min(max,Math.max(min,state[key]+delta));
    render();
  }));
  get("swb-download").addEventListener("click",()=>{
    const values=calculate();
    const lines=[
      ["PRESUPUESTO ORIENTATIVO DE SUECIA",""],
      ["Zona de referencia",{"sur":"Sur","centro":"Centro","norte":"Norte"}[state.region]],
      ["Días",String(state.days)],
      ["Noches",String(state.nights)],
      ["Viajeros",String(state.people)],
      ["Categoría","Estilo","Precio unitario por persona (€)","Unidad","Total del grupo (€)"]
    ];
    categories.forEach(category=>{
      lines.push([names[category],state.choices[category],String(unit(category,state.choices[category])),"alojamiento"===category?"noche":"día",String(values.totals[category])]);
    });
    lines.push(["TOTAL ESTIMADO","","","",String(values.total)]);
    lines.push(["Estimación ilustrativa sin vuelos internacionales ni traslados de entrada/salida."]);
    lines.push(["Consulta presupuestos reales por destino en viajandoconcabeza.com"]);
    const escaped=lines.map(row=>row.map(item=>'"'+String(item).replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const blob=new Blob(["\uFEFF"+escaped],{type:"text/csv;charset=utf-8"});
    const address=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=address;
    link.download="presupuesto-suecia-vcc.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(address),1500);
  });
  render();
})();
