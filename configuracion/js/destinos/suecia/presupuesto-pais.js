/* Presupuesto de Suecia: misma UI y nombres de campo que Estocolmo.
   IMPORTES ORIENTATIVOS: no son medias oficiales ni nuestro gasto real.
   Todas las vistas (perfiles, desglose, cálculo y regiones) usan una matriz única. */
(function(){
  "use strict";
  const cats=["alojamiento","comida","transporte","actividades","extras"];
  const labels={alojamiento:"Alojamiento",comida:"Comida",transporte:"Transporte",actividades:"Actividades",extras:"Extras"};
  const palette=["#cf705c","#e4a65a","#5ca5a2","#6e9e77","#c9ad7b"];
  const names={lujo:"Lujo",medio:"Medio",vcc:"VCC",mochilero:"Mochilero"};
  const rates={
    lujo:{alojamiento:120,comida:65,transporte:40,actividades:45,extras:25},
    medio:{alojamiento:68,comida:40,transporte:26,actividades:25,extras:14},
    vcc:{alojamiento:38,comida:28,transporte:18,actividades:15,extras:9},
    mochilero:{alojamiento:25,comida:18,transporte:12,actividades:6,extras:5}
  };
  const zones={
    centrosur:{name:"Centro-sur",factor:{alojamiento:.96,comida:.95,transporte:1.09,actividades:.95,extras:.95},
      detail:"Ruta de pueblos, lagos y alguna ciudad; se combinan varios transportes.",
      transport:"Tren, buses y desplazamientos por carretera"},
    stockholm:{name:"Estocolmo",factor:{alojamiento:1.12,comida:1.07,transporte:1.04,actividades:1.08,extras:1.04},
      detail:"Capital con mucha oferta de hoteles y visitas urbanas.",
      transport:"Metro, autobuses y ferries urbanos"},
    goteborg:{name:"Gotemburgo",factor:{alojamiento:1.02,comida:1.02,transporte:1,actividades:1,extras:1},
      detail:"Ciudad cómoda para caminar y moverse en tranvía.",
      transport:"Tranvías, buses y transporte urbano"},
    oeste:{name:"Costa Oeste",factor:{alojamiento:1.12,comida:1.02,transporte:1.22,actividades:1.06,extras:1.02},
      detail:"Ferries, islas y alojamientos muy afectados por temporada.",
      transport:"Ferries y conexiones entre pueblos de costa e islas"},
    dalarna:{name:"Dalarna",factor:{alojamiento:.95,comida:.94,transporte:1.22,actividades:.9,extras:.95},
      detail:"Cabañas y entornos naturales; pueden aumentar los trayectos.",
      transport:"Transporte regional y recorridos por carretera"},
    norte:{name:"Norte y Laponia",factor:{alojamiento:1.15,comida:1.09,transporte:1.55,actividades:1.35,extras:1.05},
      detail:"Distancias largas y actividades invernales con posibles suplementos.",
      transport:"Trenes nocturnos, coche o vuelos entre grandes distancias"}
  };
  const descriptions={
    alojamiento:{lujo:"Hotel superior o alojamiento especial",medio:"Hotel de gama media, bien comunicado",vcc:"Hotel o cabaña cómoda compartiendo doble",mochilero:"Hostal, habitación económica o camping"},
    comida:{lujo:"Restaurantes y comidas especiales",medio:"Comidas fuera y opciones sencillas",vcc:"Cafés y combinaciones con supermercado",mochilero:"Comida económica y supermercado"},
    transporte:{lujo:"Traslados más cómodos",medio:"Tren, bus y trayectos elegidos",vcc:"Transporte ajustado a la ruta",mochilero:"Transporte económico y trayectos a pie"},
    actividades:{lujo:"Experiencias y entradas de pago",medio:"Museos y entradas seleccionadas",vcc:"Las experiencias que más interesan",mochilero:"Paseos gratis y alguna visita"},
    extras:{lujo:"Cafés, compras y caprichos",medio:"Recuerdos y gastos puntuales",vcc:"Pequeños gastos e imprevistos",mochilero:"Gasto extra mínimo"}
  };
  const state={days:7,nights:7,people:2,zone:"centrosur",choice:{
    alojamiento:"vcc",comida:"vcc",transporte:"vcc",actividades:"vcc",extras:"vcc"
  }};
  const el=id=>document.getElementById(id);
  const euro=n=>Math.round(n).toLocaleString("es-ES")+" €";
  const round=(style,category,zone)=>Math.round(rates[style][category]*zones[zone].factor[category]);
  const dayRate=(style,zone)=>cats.reduce((sum,c)=>sum+round(style,c,zone),0);
  const currentStyle=()=>cats.every(c=>state.choice[c]===state.choice.alojamiento)?state.choice.alojamiento:null;
  if(!el("grand-total")||!el("swb-region")||!el("swb-region-top"))return;
  function categoryTotals(){
    const prices={},totals={};
    for(const c of cats){
      prices[c]=round(state.choice[c],c,state.zone);
      totals[c]=prices[c]*(c==="alojamiento"?state.nights:state.days)*state.people;
    }
    const total=cats.reduce((sum,c)=>sum+totals[c],0);
    return {prices,totals,total};
  }
  function updateProfiles(){
    for(const style of Object.keys(rates)){
      const average=dayRate(style,state.zone);
      const price=document.querySelector('[data-budget-rate="'+style+'"]');
      if(price)price.textContent="≈ "+euro(average);
      const panel=document.querySelector('[data-budget-panel="'+style+'"]');
      if(!panel)continue;
      const daily=panel.querySelector('[data-panel-daily]');
      if(daily)daily.textContent="≈ "+euro(average);
      const panelZone=panel.querySelector('[data-panel-zone]');
      if(panelZone)panelZone.textContent=zones[state.zone].name;
      panel.querySelectorAll("[data-panel-category]").forEach(node=>{
        const category=node.dataset.panelCategory;
        node.textContent=euro(round(style,category,state.zone));
      });
      panel.querySelectorAll("[data-panel-category-desc]").forEach(node=>{
        const category=node.dataset.panelCategoryDesc;
        const value=round(style,category,state.zone);
        const explanation=category==="transporte"?zones[state.zone].transport:descriptions[category][style];
        node.textContent=explanation+" · "+euro(value)+"/pax/"+(category==="alojamiento"?"noche":"día");
      });
    }
    const description=el("swb-overview-detail");
    if(description)description.textContent=zones[state.zone].detail+" Una noche por día para comparar perfiles.";
  }
  function updateCalculator(){
    const {prices,totals,total}=categoryTotals();
    const daily=total/state.people/state.days;
    let offset=0;
    const arcs=cats.map((c,i)=>{
      const start=offset;offset+=total?totals[c]/total*100:0;
      return palette[i]+" "+start.toFixed(3)+"% "+offset.toFixed(3)+"%";
    });
    const donut=document.querySelector(".calculator-section .donut");
    if(donut)donut.style.background="conic-gradient("+arcs.join(",")+")";
    for(const c of cats){
      el("price-"+c).textContent=euro(prices[c]);
      el("legend-"+c).textContent=euro(totals[c]);
    }
    el("days-output").textContent=state.days;
    el("nights-output").textContent=state.nights;
    el("people-output").textContent=state.people;
    el("grand-total").textContent=euro(total);
    el("donut-daily").textContent=daily.toLocaleString("es-ES",{maximumFractionDigits:2})+" €";
    el("trip-total").textContent=state.people+" "+(state.people===1?"viajero":"viajeros")+" · "+state.days+" "+(state.days===1?"día":"días")+" · "+state.nights+" "+(state.nights===1?"noche":"noches");
    document.querySelectorAll("[data-step]").forEach(button=>{
      const key=button.dataset.step,delta=Number(button.dataset.delta);
      const min=key==="nights"?0:1,max=key==="people"?12:60;
      button.disabled=delta<0?state[key]<=min:state[key]>=max;
    });
  }
  function updateRegions(){
    const selected=currentStyle();
    const indicator=el("swb-zone-current-style");
    if(indicator)indicator.textContent=selected?"Perfil "+names[selected]:"Perfil personalizado";
    document.querySelectorAll("[data-region-card]").forEach(card=>{
      const zone=card.dataset.regionCard;
      card.classList.toggle("is-current",zone===state.zone);
      const rateEl=card.querySelector("[data-zone-daily]");
      const value=selected?dayRate(selected,zone):cats.reduce((sum,c)=>sum+round(state.choice[c],c,zone),0);
      if(rateEl)rateEl.textContent="≈ "+value.toLocaleString("es-ES")+" €/pax/día";
      const cta=card.querySelector("[data-choose-zone]");
      if(cta)cta.setAttribute("aria-label","Usar zona "+zones[zone].name);
    });
  }
  function render(){
    el("swb-region").value=state.zone;
    el("swb-region-top").value=state.zone;
    updateProfiles();updateCalculator();updateRegions();
  }
  document.querySelectorAll("[data-budget-mode]").forEach(button=>{
    button.addEventListener("click",()=>{
      const style=button.dataset.budgetMode;
      if(!rates[style])return;
      cats.forEach(c=>{
        state.choice[c]=style;
        const select=document.querySelector('.calculator-card [data-category="'+c+'"]');
        if(select)select.value=style;
      });
      render();
    });
  });
  document.querySelectorAll(".calculator-card [data-category]").forEach(select=>{
    select.addEventListener("change",()=>{
      const category=select.dataset.category;
      if(rates[select.value]&&cats.includes(category)){state.choice[category]=select.value;render();}
    });
  });
  document.querySelectorAll("[data-step]").forEach(button=>{
    button.addEventListener("click",()=>{
      const key=button.dataset.step;
      if(!["days","nights","people"].includes(key))return;
      const min=key==="nights"?0:1,max=key==="people"?12:60;
      state[key]=Math.max(min,Math.min(max,state[key]+Number(button.dataset.delta)));
      render();
    });
  });
  for(const id of ["swb-region","swb-region-top"]){
    el(id).addEventListener("change",event=>{
      if(zones[event.target.value]){state.zone=event.target.value;render();}
    });
  }
  document.querySelectorAll("[data-choose-zone]").forEach(a=>{
    a.addEventListener("click",()=>{
      const z=a.dataset.chooseZone;if(zones[z]){state.zone=z;render();}
    });
  });
  // Exact same non-autoplay arrows as in the Stockholm budget page.
  document.querySelectorAll(".carousel-shell").forEach(carousel=>{
    const track=carousel.querySelector(".tips-track");
    const previous=carousel.querySelector(".prev"),next=carousel.querySelector(".next");
    if(!track||!previous||!next)return;
    const move=direction=>{
      const item=track.firstElementChild;
      if(!item)return;
      const gap=parseFloat(getComputedStyle(track).gap)||0;
      track.scrollBy({left:direction*(item.getBoundingClientRect().width+gap),behavior:"smooth"});
    };
    previous.addEventListener("click",()=>move(-1));
    next.addEventListener("click",()=>move(1));
  });
  render();
})();