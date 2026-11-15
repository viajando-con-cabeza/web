/* VCC presupuesto Suecia.
   Los precios y textos por zona viven SOLO en /configuracion/datos/presupuestos/suecia.json.
   La plantilla nunca calcula promedios con factores propios: consulta el JSON.
   Alojamiento = EUR/pax/noche. El resto = EUR/pax/día.
   Precios estimativos, no datos oficiales ni el gasto real de Estocolmo. */
(function(){
  "use strict";
  const el=id=>document.getElementById(id);
  const root=document.body;
  const source=root.dataset.budgetPrices;
  const status=el("swb-data-status");
  const cats=["alojamiento","comida","transporte","actividades","extras"];
  const styles=["lujo","medio","vcc","mochilero"];
  const palette=["#cf705c","#e4a65a","#5ca5a2","#6e9e77","#c9ad7b"];
  const euro=n=>Math.round(n).toLocaleString("es-ES")+" €";
  const state={
    days:7,nights:7,people:2,zone:"centrosur",
    choice:{alojamiento:"vcc",comida:"vcc",transporte:"vcc",actividades:"vcc",extras:"vcc"}
  };
  let data=null;
  if(!el("grand-total")||!el("swb-region")||!el("swb-region-top")||!source)return;
  const controls=[...document.querySelectorAll(
    "[data-budget-mode],.calculator-card [data-step],.calculator-card [data-category],#swb-region,#swb-region-top,[data-vcc-download-excel]"
  )];
  const lock=locked=>controls.forEach(node=>{node.disabled=locked;});
  root.dataset.budgetStatus="loading";
  if(status)status.textContent="Cargando precios orientativos por zonas…";
  lock(true);
  function validate(payload){
    if(!payload||payload.version!==1||payload.country!=="suecia"||!payload.zones||
       !payload.categories||payload.source!=="estimaciones_orientativas")throw new Error("Datos de presupuesto incompatibles");
    if(!payload.zones[payload.defaultZone])throw new Error("Falta la zona predeterminada");
    for(const category of cats)if(!payload.categories[category])throw new Error("Falta categoría "+category);
    for(const [key,zone] of Object.entries(payload.zones)){
      if(!/^[a-z0-9-]+$/.test(key)||!zone.name||!zone.prices)throw new Error("Zona incorrecta: "+key);
      for(const style of styles)for(const category of cats){
        const amount=zone.prices?.[style]?.[category];
        if(!Number.isInteger(amount)||amount<0||amount>100000)throw new Error("Precio incorrecto en "+key+"/"+style+"/"+category);
      }
    }
    return payload;
  }
  const amount=(style,category,zone=state.zone)=>data.zones[zone].prices[style][category];
  const dayRate=(style,zone)=>cats.reduce((sum,category)=>sum+amount(style,category,zone),0);
  const selectedStyle=()=>cats.every(category=>state.choice[category]===state.choice.alojamiento)?state.choice.alojamiento:null;
  function totals(){
    const prices={},categoryTotals={};
    for(const category of cats){
      prices[category]=amount(state.choice[category],category);
      categoryTotals[category]=prices[category]*(category==="alojamiento"?state.nights:state.days)*state.people;
    }
    return {prices,categoryTotals,total:cats.reduce((sum,category)=>sum+categoryTotals[category],0)};
  }
  function hydrateSelects(){
    for(const id of ["swb-region","swb-region-top"]){
      const select=el(id);
      select.replaceChildren();
      for(const [key,zone] of Object.entries(data.zones)){
        const option=document.createElement("option");
        option.value=key;
        option.textContent=zone.selectLabel||zone.name;
        select.appendChild(option);
      }
      select.value=state.zone;
    }
  }
  function hydrateRegionCards(){
    const grid=document.querySelector("#zonas .swb-regions-grid");
    if(!grid)return;
    const template=grid.querySelector('[data-region-card="goteborg"]')?.cloneNode(true);
    const existing=new Map([...grid.querySelectorAll("[data-region-card]")].map(card=>[card.dataset.regionCard,card]));
    if(!template)return;
    for(const [key,zone] of Object.entries(data.zones)){
      const meta=zone.card||{};
      let card=existing.get(key);
      if(!card){
        card=template.cloneNode(true);
        card.dataset.regionCard=key;
        grid.appendChild(card);
      }
      const title=card.querySelector(".vcc-it-title");
      if(title)title.textContent=zone.name;
      const kicker=card.querySelector(".vcc-card-kicker");
      if(kicker){
        const icon=kicker.querySelector("use");
        if(icon&&/^it-category-[a-z-]+$/.test(meta.symbol||""))icon.setAttribute("href","/configuracion/imagenes/iconos/paginas/itinerarios-iconos.svg#"+meta.symbol);
        const text=[...kicker.childNodes].find(n=>n.nodeType===3);
        if(text)text.nodeValue=meta.type||"DESTINOS";
        else kicker.appendChild(document.createTextNode(meta.type||"DESTINOS"));
      }
      const photo=card.querySelector(".di-mini-photo");
      if(photo){
        if(meta.image&&meta.image.startsWith("https://img.viajandoconcabeza.com/")){
          let image=photo.querySelector("img");
          if(!image){photo.replaceChildren();image=document.createElement("img");photo.appendChild(image);}
          image.className="vcc-card-cover-photo";
          image.src=meta.image;image.alt=zone.name;image.loading="lazy";image.decoding="async";image.width=640;image.height=380;
        }else{
          const placeholder=document.createElement("span");
          placeholder.className="swb-zone-placeholder";
          placeholder.textContent="❄ ";
          const small=document.createElement("small");small.textContent=zone.name.toUpperCase();placeholder.appendChild(small);
          photo.replaceChildren(placeholder);
        }
      }
      const info=card.querySelector(".di-mini-desc");
      if(info)info.textContent=(meta.description||zone.detail)+". Precios orientativos.";
      const cta=card.querySelector(".vcc-it-cta");
      if(cta){
        if(meta.realBudgetUrl&&meta.realBudgetUrl.startsWith("/destinos/")){
          cta.removeAttribute("data-choose-zone");
          cta.href=meta.realBudgetUrl;
          cta.textContent="VER PRESUPUESTO";
        }else{
          cta.dataset.chooseZone=key;
          cta.href="#filosofia";
          cta.textContent="VER ZONA";
        }
      }
      const daily=card.querySelector("[data-zone-daily]");
      if(daily)daily.dataset.zoneDaily=key;
    }
    existing.forEach((card,key)=>{if(!data.zones[key])card.remove();});
  }
  function renderProfiles(){
    const zone=data.zones[state.zone];
    for(const style of styles){
      const avg=dayRate(style,state.zone);
      const cardRate=document.querySelector('[data-budget-rate="'+style+'"]');
      if(cardRate)cardRate.textContent="≈ "+euro(avg);
      const panel=document.querySelector('[data-budget-panel="'+style+'"]');
      if(!panel)continue;
      const headline=panel.querySelector("[data-panel-daily]");
      if(headline)headline.textContent="≈ "+euro(avg);
      const label=panel.querySelector("[data-panel-zone]");
      if(label)label.textContent=zone.name;
      panel.querySelectorAll("[data-panel-category]").forEach(node=>{
        node.textContent=euro(amount(style,node.dataset.panelCategory));
      });
      panel.querySelectorAll("[data-panel-category-desc]").forEach(node=>{
        const category=node.dataset.panelCategoryDesc;
        const explanation=category==="transporte"?zone.transport:data.categories[category].descriptions[style];
        node.textContent=explanation+" · pax/"+(category==="alojamiento"?"noche":"día");
      });
    }
    const overview=el("swb-overview-detail");
    if(overview)overview.textContent=zone.detail+" Una noche por día para comparar perfiles.";
  }
  function renderCalculator(){
    const result=totals(),daily=result.total/state.people/state.days;
    let offset=0;
    const arcs=cats.map((category,i)=>{
      const start=offset;
      offset+=result.total?result.categoryTotals[category]/result.total*100:0;
      return palette[i]+" "+start.toFixed(3)+"% "+offset.toFixed(3)+"%";
    });
    const donut=document.querySelector(".calculator-section .donut");
    if(donut)donut.style.background="conic-gradient("+arcs.join(",")+")";
    for(const category of cats){
      el("price-"+category).textContent=euro(result.prices[category]);
      el("legend-"+category).textContent=euro(result.categoryTotals[category]);
    }
    el("days-output").textContent=state.days;
    el("nights-output").textContent=state.nights;
    el("people-output").textContent=state.people;
    el("grand-total").textContent=euro(result.total);
    el("donut-daily").textContent=daily.toLocaleString("es-ES",{maximumFractionDigits:2})+" €";
    el("trip-total").textContent=state.people+" "+(state.people===1?"viajero":"viajeros")+" · "+
      state.days+" "+(state.days===1?"día":"días")+" · "+state.nights+" "+(state.nights===1?"noche":"noches");
    document.querySelectorAll("[data-step]").forEach(button=>{
      const key=button.dataset.step,delta=Number(button.dataset.delta),min=key==="nights"?0:1,max=key==="people"?12:60;
      button.disabled=delta<0?state[key]<=min:state[key]>=max;
    });
  }
  function renderRegions(){
    const selected=selectedStyle();
    const indicator=el("swb-zone-current-style");
    if(indicator)indicator.textContent=selected?"Perfil "+data.styleLabels[selected]:"Perfil personalizado";
    document.querySelectorAll("[data-region-card]").forEach(card=>{
      const key=card.dataset.regionCard;
      const price=selected?dayRate(selected,key):cats.reduce((sum,category)=>sum+amount(state.choice[category],category,key),0);
      const cell=card.querySelector("[data-zone-daily]");
      if(cell)cell.textContent="≈ "+price.toLocaleString("es-ES")+" €/pax/día";
      card.classList.toggle("is-current",key===state.zone);
    });
  }
  function render(){
    el("swb-region").value=state.zone;
    el("swb-region-top").value=state.zone;
    renderProfiles();renderCalculator();renderRegions();
  }
  function wire(){
    document.querySelectorAll("[data-budget-mode]").forEach(button=>{
      button.addEventListener("click",()=>{
        const style=button.dataset.budgetMode;
        if(!styles.includes(style))return;
        cats.forEach(category=>{
          state.choice[category]=style;
          const input=document.querySelector('.calculator-card [data-category="'+category+'"]');
          if(input)input.value=style;
        });
        render();
      });
    });
    document.querySelectorAll(".calculator-card [data-category]").forEach(input=>{
      input.addEventListener("change",()=>{
        if(styles.includes(input.value)&&cats.includes(input.dataset.category)){
          state.choice[input.dataset.category]=input.value;render();
        }
      });
    });
    document.querySelectorAll("[data-step]").forEach(button=>button.addEventListener("click",()=>{
      const key=button.dataset.step;
      if(!["days","nights","people"].includes(key))return;
      const min=key==="nights"?0:1,max=key==="people"?12:60;
      state[key]=Math.max(min,Math.min(max,state[key]+Number(button.dataset.delta)));
      render();
    }));
    for(const id of ["swb-region","swb-region-top"]){
      el(id).addEventListener("change",event=>{
        if(data.zones[event.target.value]){state.zone=event.target.value;render();}
      });
    }
    document.querySelectorAll("#zonas [data-choose-zone]").forEach(anchor=>anchor.addEventListener("click",()=>{
      const key=anchor.dataset.chooseZone;
      if(data.zones[key]){state.zone=key;render();}
    }));
    document.querySelectorAll(".carousel-shell").forEach(carousel=>{
      const track=carousel.querySelector(".tips-track");
      const prev=carousel.querySelector(".prev"),next=carousel.querySelector(".next");
      if(!track||!prev||!next)return;
      const move=direction=>{
        const first=track.firstElementChild;if(!first)return;
        const gap=parseFloat(getComputedStyle(track).gap)||0;
        track.scrollBy({left:direction*(first.getBoundingClientRect().width+gap),behavior:"smooth"});
      };
      prev.addEventListener("click",()=>move(-1));
      next.addEventListener("click",()=>move(1));
    });
  }
  async function init(){
    try{
      const response=await fetch(source,{cache:"no-cache"});
      if(!response.ok)throw new Error("HTTP "+response.status);
      data=validate(await response.json());
      state.zone=data.defaultZone;
      hydrateSelects();
      hydrateRegionCards();
      wire();
      lock(false);
      root.dataset.budgetStatus="ready";
      if(status)status.textContent="";
      render();
    }catch(error){
      root.dataset.budgetStatus="error";
      if(status)status.textContent="No se han podido actualizar los precios por zonas. Recarga la página para volver a intentarlo.";
      console.error("VCC presupuesto Suecia: datos de zona no disponibles",error);
    }
  }
  init();
})();