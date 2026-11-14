/* Suecia · Presupuesto por perfil y zona.
   Los valores son escenarios orientativos de planificación, nunca gasto real del país.
   Se comparte la misma matriz de precios entre tarjetas, desglose, calculadora y CSV. */
(function(){
  "use strict";
  const categories=["alojamiento","comida","transporte","actividades","extras"];
  const names={alojamiento:"Alojamiento",comida:"Comida",transporte:"Transporte",actividades:"Actividades",extras:"Extras"};
  const glyphs={alojamiento:"⌂",comida:"♨",transporte:"▤",actividades:"✧",extras:"✦"};
  const colors=["#ca765c","#e6a35a","#6ca09b","#769a70","#b79d87"];
  const styles={lujo:"Lujo",medio:"Medio",vcc:"VCC",mochilero:"Mochilero"};
  // €/persona/noche en alojamiento; €/persona/día para todas las demás categorías.
  const baseline={
    lujo:{alojamiento:120,comida:65,transporte:40,actividades:45,extras:25},
    medio:{alojamiento:68,comida:40,transporte:26,actividades:25,extras:14},
    vcc:{alojamiento:38,comida:28,transporte:18,actividades:15,extras:9},
    mochilero:{alojamiento:25,comida:18,transporte:12,actividades:6,extras:5}
  };
  // Factores ilustrativos, no índices oficiales de precios regionales.
  const zones={
    stockholm:{name:"Estocolmo",label:"Estocolmo · capital",f:{alojamiento:1.12,comida:1.07,transporte:1.04,actividades:1.08,extras:1.04},
      summary:"La capital suele concentrar opciones de alojamiento y visitas urbanas más caras.",transport:"Metro, autobuses y ferris urbanos; sin vehículo de alquiler."},
    goteborg:{name:"Gotemburgo",label:"Gotemburgo · ciudad",f:{alojamiento:1.02,comida:1.02,transporte:1,actividades:1,extras:1},
      summary:"Ciudad con tranvías y un coste de alojamiento variable según fechas.",transport:"Tranvías, buses y desplazamientos por la ciudad."},
    oeste:{name:"Costa Oeste",label:"Costa Oeste · islas",f:{alojamiento:1.12,comida:1.02,transporte:1.22,actividades:1.06,extras:1.02},
      summary:"El alojamiento costero y los ferris pueden encarecer los días de islas.",transport:"Ferries y desplazamientos entre costa, pueblos e islas."},
    dalarna:{name:"Dalarna",label:"Dalarna · interior",f:{alojamiento:.95,comida:.94,transporte:1.22,actividades:.9,extras:.95},
      summary:"Las cabañas pueden equilibrar el presupuesto, pero aumenta el peso del transporte.",transport:"Trayectos por carretera o transporte regional; coste de coche no garantizado."},
    centrosur:{name:"Centro-sur",label:"Centro-sur · ruta mixta",f:{alojamiento:.96,comida:.95,transporte:1.09,actividades:.95,extras:.95},
      summary:"Un promedio de referencia para combinar pueblos, lagos y alguna ciudad.",transport:"Combinación de tren, bus y tramos por carretera."},
    norte:{name:"Norte y Laponia",label:"Norte / Laponia · grandes distancias",f:{alojamiento:1.15,comida:1.09,transporte:1.55,actividades:1.35,extras:1.05},
      summary:"Los trayectos largos y las actividades de invierno requieren un margen mayor.",transport:"Trayectos interurbanos largos; vuelos, coche y excursiones pueden costar más."}
  };
  const profileCopy={
    lujo:"Hoteles especiales, más restaurantes y margen amplio para experiencias.",
    medio:"Una alternativa cómoda para alojarte bien y pagar algunas actividades.",
    vcc:"Equilibrio entre alojamiento funcional, buenos planes y gastos conscientes.",
    mochilero:"Hostales o cabañas económicas, comida sencilla y muchas visitas gratuitas."
  };
  const get=id=>document.getElementById(id);
  const btns=[...document.querySelectorAll(".swb-style-card[data-style]")];
  const selects=[...document.querySelectorAll("[data-category]")];
  if(!get("swb-grand-total")||!btns.length||!selects.length)return;
  const state={days:7,nights:7,people:2,region:"centrosur",openProfile:null,
    choices:{alojamiento:"vcc",comida:"vcc",transporte:"vcc",actividades:"vcc",extras:"vcc"}};
  const euro=v=>Math.round(v).toLocaleString("es-ES")+" €";
  const unit=(category,style,zone=state.region)=>Math.round(baseline[style][category]*zones[zone].f[category]);
  const profileRate=(style,zone)=>categories.reduce((sum,c)=>sum+unit(c,style,zone),0);
  const selectedRate=zone=>categories.reduce((sum,c)=>sum+unit(c,state.choices[c],zone),0);
  const currentStyle=()=>{const s=state.choices[categories[0]];return categories.every(c=>state.choices[c]===s)?s:null;};
  const categoryDetails={
    alojamiento:{"lujo":"Hotel premium o estancia especial","medio":"Hotel de gama media bien ubicado","vcc":"Hotel o cabaña funcional, compartiendo doble","mochilero":"Hostal, habitación sencilla o camping"},
    comida:{"lujo":"Restaurantes y cenas especiales","medio":"Restaurantes combinados con menús","vcc":"Cafés, supermercados y comidas locales","mochilero":"Supermercado y comidas económicas"},
    transporte:{"lujo":"Más comodidad y flexibilidad en traslados","medio":"Transporte público y trayectos puntuales","vcc":"Billetes planificados y traslados necesarios","mochilero":"Transportes económicos y trayectos a pie"},
    actividades:{"lujo":"Varias experiencias y visitas de pago","medio":"Museos y actividades seleccionadas","vcc":"Priorizar solo las experiencias que interesan","mochilero":"Paseos gratuitos y alguna entrada"},
    extras:{"lujo":"Compras, cafés y caprichos","medio":"Cafés, recuerdos y gastos imprevistos","vcc":"Pequeños gastos y margen para imprevistos","mochilero":"Margen mínimo de gastos extra"}
  };
  function calculate(){
    const totals={},prices={};
    categories.forEach(c=>{
      prices[c]=unit(c,state.choices[c]);
      totals[c]=prices[c]*(c==="alojamiento"?state.nights:state.days)*state.people;
    });
    return {prices,totals,total:categories.reduce((s,c)=>s+totals[c],0)};
  }
  function renderProfile(){
    const node=get("swb-profile-detail"),style=state.openProfile;
    node.hidden=!style;
    btns.forEach(b=>b.setAttribute("aria-expanded",String(b.dataset.style===style)));
    if(!style)return;
    get("swb-profile-title").textContent="Presupuesto "+styles[style];
    get("swb-profile-zone").textContent=zones[state.region].label;
    get("swb-profile-avg").textContent="≈ "+euro(profileRate(style,state.region));
    get("swb-profile-explain").textContent=profileCopy[style]+" "+zones[state.region].summary;
    const rows=get("swb-profile-rows");
    rows.replaceChildren();
    categories.forEach(c=>{
      const row=document.createElement("div");row.className="swb-profile-row";
      const top=document.createElement("div");top.className="swb-profile-row-head";
      const icon=document.createElement("span");icon.className="swb-profile-icon";icon.textContent=glyphs[c];
      const title=document.createElement("strong");title.textContent=names[c];
      const price=document.createElement("b");price.textContent=euro(unit(c,style));
      const text=document.createElement("p");
      text.textContent=(c==="transporte"?zones[state.region].transport:categoryDetails[c][style])+" · por persona / "+(c==="alojamiento"?"noche":"día");
      top.append(icon,title,price);row.append(top,text);rows.appendChild(row);
    });
    get("swb-profile-trip-total").textContent="≈ "+euro((unit("alojamiento",style)*7+categories.filter(c=>c!=="alojamiento").reduce((s,c)=>s+unit(c,style)*7,0))*2);
  }
  function render(){
    const values=calculate();
    get("swb-days").textContent=state.days;get("swb-nights").textContent=state.nights;get("swb-people").textContent=state.people;
    get("swb-region").value=state.region;get("swb-region-top").value=state.region;
    get("swb-overview-detail").textContent=zones[state.region].summary+" Se supone una noche por día.";
    const avg=values.total/state.people/state.days;
    get("swb-grand-total").textContent=euro(values.total);
    get("swb-result-meta").textContent=state.people+(state.people===1?" persona":" personas")+" · "+state.days+(state.days===1?" día":" días")+" · "+state.nights+(state.nights===1?" noche":" noches");
    get("swb-result-average").textContent=avg.toLocaleString("es-ES",{maximumFractionDigits:2})+" € / persona / día";
    get("swb-donut-pct").textContent=euro(avg);
    const inner=get("swb-donut-pct").nextElementSibling;if(inner)inner.textContent="pax / día";
    let arc=0;
    const segments=categories.map((c,i)=>{const start=arc;arc+=values.total?values.totals[c]/values.total*100:0;return colors[i]+" "+start.toFixed(3)+"% "+arc.toFixed(3)+"%"});
    get("swb-donut").style.background="conic-gradient("+segments.join(",")+")";
    get("swb-donut").setAttribute("aria-label",categories.map(c=>names[c]+" "+euro(values.totals[c])).join(", "));
    categories.forEach(c=>{get("swb-price-"+c).textContent=euro(values.prices[c]);get("swb-total-"+c).textContent=euro(values.totals[c]);});
    const active=currentStyle();
    btns.forEach(b=>{
      b.classList.toggle("is-active",b.dataset.style===active);
      b.setAttribute("aria-pressed",String(b.dataset.style===active));
      const label=b.querySelector(".swb-style-bottom strong");if(label)label.textContent="≈ "+euro(profileRate(b.dataset.style,state.region));
    });
    document.querySelectorAll("[data-region-card]").forEach(card=>{
      const region=card.dataset.regionCard;
      card.classList.toggle("is-current",region===state.region);
      const p=card.querySelector("[data-region-price]");if(p)p.textContent="≈ "+euro(selectedRate(region));
      const st=card.querySelector("[data-region-style]");if(st)st.textContent=active?styles[active]:"personalizado";
      const pick=card.querySelector("[data-pick-region]");if(pick)pick.setAttribute("aria-pressed",String(region===state.region));
    });
    get("swb-zone-current-style").textContent=active?"Estás viendo el perfil "+styles[active]:"Estás viendo tu selección personalizada";
    document.querySelectorAll("[data-step]").forEach(b=>{
      const key=b.dataset.step,delta=Number(b.dataset.delta);
      const min=key==="nights"?0:1,max=key==="people"?12:60;
      b.disabled=delta<0?state[key]<=min:state[key]>=max;
    });
    renderProfile();
  }
  btns.forEach(b=>b.addEventListener("click",()=>{
    const style=b.dataset.style;
    const collapse=state.openProfile===style;
    state.openProfile=collapse?null:style;
    if(!baseline[style])return;
    categories.forEach(c=>{state.choices[c]=style;get("swb-select-"+c).value=style;});
    render();
  }));
  get("swb-profile-close").addEventListener("click",()=>{state.openProfile=null;render();const selected=btns.find(b=>b.getAttribute("aria-pressed")==="true");if(selected)selected.focus();});
  selects.forEach(sel=>sel.addEventListener("change",()=>{
    const c=sel.dataset.category;if(categories.includes(c)&&baseline[sel.value]){state.choices[c]=sel.value;state.openProfile=null;render();}
  }));
  for(const id of ["swb-region","swb-region-top"])get(id).addEventListener("change",e=>{
    if(zones[e.target.value]){state.region=e.target.value;render();}
  });
  document.querySelectorAll("[data-pick-region]").forEach(b=>b.addEventListener("click",()=>{
    if(!zones[b.dataset.pickRegion])return;
    state.region=b.dataset.pickRegion;render();
    const top=get("presupuesto-diario");if(top)top.scrollIntoView({behavior:"smooth",block:"start"});
  }));
  document.querySelectorAll("[data-step]").forEach(b=>b.addEventListener("click",()=>{
    const key=b.dataset.step;if(!["days","nights","people"].includes(key))return;
    const min=key==="nights"?0:1,max=key==="people"?12:60;
    state[key]=Math.min(max,Math.max(min,state[key]+Number(b.dataset.delta)));render();
  }));
  get("swb-download").addEventListener("click",()=>{
    const values=calculate();
    const lines=[
      ["PRESUPUESTO ORIENTATIVO DE SUECIA"],
      ["Zona de referencia",zones[state.region].label],
      ["Días",state.days],["Noches",state.nights],["Viajeros",state.people],
      ["Categoría","Estilo","Precio unitario por persona (€)","Unidad","Total del grupo (€)"]
    ];
    categories.forEach(c=>lines.push([names[c],styles[state.choices[c]],values.prices[c],c==="alojamiento"?"noche":"día",values.totals[c]]));
    lines.push(["TOTAL ESTIMADO","","","",values.total]);
    lines.push(["Precios orientativos para planificación; no son medias oficiales ni tarifas de reserva."]);
    lines.push(["Sin vuelos internacionales ni traslados de entrada/salida del país."]);
    const csv=lines.map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download="presupuesto-suecia-vcc.csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  render();
})();
