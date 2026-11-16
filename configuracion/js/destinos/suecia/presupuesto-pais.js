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
    days:7,nights:7,people:2,zone:"centrosur",activeStop:0,
    stops:[{zone:"centrosur",days:7,nights:7,choice:{alojamiento:"vcc",comida:"vcc",transporte:"vcc",actividades:"vcc",extras:"vcc"}}],
    choice:{alojamiento:"vcc",comida:"vcc",transporte:"vcc",actividades:"vcc",extras:"vcc"}
  };
  let data=null;
  if(!el("grand-total")||!el("swb-route-rows")||!el("swb-region-top")||!source)return;
  const controls=[...document.querySelectorAll(
    "[data-budget-mode],.calculator-card [data-step],#swb-region-top,[data-vcc-download-excel],[data-swb-add-stop],#swb-route-prev,#swb-route-next"
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
  const routeCount=(type)=>state.stops.reduce((sum,stop)=>sum+stop[type],0);
  function totals(){
    state.days=routeCount("days");state.nights=routeCount("nights");
    const categoryTotals={};
    for(const k of cats)categoryTotals[k]=state.people*state.stops.reduce((sum,stop)=>
      sum+amount(stop.choice[k],k,stop.zone)*(k==="alojamiento"?stop.nights:stop.days),0);
    return {categoryTotals,total:cats.reduce((sum,k)=>sum+categoryTotals[k],0)};
  }
  function hydrateSelects(){
    for(const id of ["swb-region-top"]){
      const select=el(id);
      select.replaceChildren();
      for(const [key,zone] of Object.entries(data.zones)){
        const option=document.createElement("option");
        option.value=key;
        option.textContent=zone.name;
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
      // La ficha identifica el destino por su nombre: sin categorías
      // genéricas "ciudades", "ruta", "islas", etc.
      card.querySelector(".vcc-card-kicker")?.remove();
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
      if(info)info.textContent=meta.description||zone.detail;
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
  const integer=(value,min,max,def)=>Number.isFinite(Number(value))?
    Math.max(min,Math.min(max,Math.trunc(Number(value)))):def;
  const categoryIcons={alojamiento:"🛏",comida:"♨",transporte:"▤",actividades:"✧",extras:"✦"};
  const categoryNames={alojamiento:"Alojamiento",comida:"Comida",transporte:"Transporte",actividades:"Actividades",extras:"Extras"};
  const styleNames={mochilero:"Mochilero",vcc:"VCC",medio:"Medio",lujo:"Lujo"};
  const maxStages=8;
  function showStop(index){
    state.activeStop=Math.max(0,Math.min(state.stops.length-1,index));
    document.querySelectorAll("#swb-route-rows .vcc-budget-route-row").forEach((node,i)=>{
      node.hidden=i!==state.activeStop;
    });
    document.querySelectorAll("#swb-route-chips button").forEach((node,i)=>
      node.setAttribute("aria-pressed",String(i===state.activeStop)));
    const prev=el("swb-route-prev"),next=el("swb-route-next");
    if(prev)prev.disabled=state.activeStop===0;
    if(next)next.disabled=state.activeStop===state.stops.length-1;
    // Si hi ha moltes etapes, la seleccionada no pot quedar tallada del carrusel.
    requestAnimationFrame(()=>{
      const strip=el("swb-route-chips");
      const selected=strip?.children[state.activeStop];
      if(!strip||!selected)return;
      const bounds=strip.getBoundingClientRect();
      const item=selected.getBoundingClientRect();
      if(bounds.width===0||item.width===0)return;
      const margin=9;
      let delta=0;
      if(item.left<bounds.left+margin)delta=item.left-bounds.left-margin;
      else if(item.right>bounds.right-margin)delta=item.right-bounds.right+margin;
      if(Math.abs(delta)>1)strip.scrollTo({
        left:Math.max(0,strip.scrollLeft+delta),
        behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"
      });
    });
  }
  function renderRouteSummary(){
    const days=routeCount("days"),nights=routeCount("nights"),count=state.stops.length;
    const summary=el("swb-route-summary");
    if(summary)summary.textContent=days+" "+(days===1?"día":"días")+" · "+nights+" "+(nights===1?"noche":"noches")+" · "+count+" "+(count===1?"zona":"zonas");
    const chips=el("swb-route-chips");if(!chips)return;
    if(chips.children.length!==count){
      chips.replaceChildren();
      state.stops.forEach((_,i)=>{
        const chip=document.createElement("button");chip.type="button";chip.className="vcc-budget-stage-chip";
        const name=document.createElement("strong"),detail=document.createElement("small");
        chip.append(name,detail);chip.addEventListener("click",()=>showStop(i));chips.append(chip);
      });
    }
    [...chips.children].forEach((chip,i)=>{
      const stop=state.stops[i];
      chip.querySelector("strong").textContent=data.zones[stop.zone].name;
      chip.querySelector("small").textContent=stop.days+" d · "+stop.nights+" n";
      chip.dataset.stageNumber=String(i+1);
      chip.title="Zona "+(i+1)+": "+data.zones[stop.zone].name+" · "+stop.days+" días · "+stop.nights+" noches";
      chip.setAttribute("aria-label","Ver zona "+(i+1)+": "+data.zones[stop.zone].name+", "+stop.days+" días y "+stop.nights+" noches");
      chip.setAttribute("aria-pressed",String(i===state.activeStop));
    });
  }
  function updateStagePrices(){
    document.querySelectorAll("#swb-route-rows .vcc-budget-route-row").forEach((slide,i)=>{
      const stop=state.stops[i];if(!stop)return;
      let cost=0;
      for(const k of cats){
        const rate=amount(stop.choice[k],k,stop.zone);
        const field=slide.querySelector('[data-zone-price="'+k+'"]');
        if(field)field.textContent=euro(rate);
        cost+=rate*(k==="alojamiento"?stop.nights:stop.days)*state.people;
      }
      const total=slide.querySelector("[data-zone-total]");
      if(total)total.textContent=euro(cost);
    });
  }
  function renderRoute(){
    const container=el("swb-route-rows");if(!container)return;
    container.replaceChildren();
    state.activeStop=Math.min(state.activeStop,state.stops.length-1);
    state.stops.forEach((stop,i)=>{
      const slide=document.createElement("article");slide.className="vcc-budget-route-row";slide.dataset.stopIndex=i;
      slide.setAttribute("aria-label","Presupuesto de la zona "+(i+1));
      const rows=cats.map(k=>`<div class="category-row">
        <span class="vcc-category-name"><span class="vcc-category-icon" aria-hidden="true">${categoryIcons[k]}</span><span>${categoryNames[k]}</span></span>
        <select data-zone-category="${k}" aria-label="Estilo de ${categoryNames[k].toLowerCase()} para zona ${i+1}"></select>
        <span class="vcc-price-block"><strong class="vcc-budget-price" data-zone-price="${k}">—</strong><small>por persona / ${k==="alojamiento"?"noche":"día"}</small></span></div>`).join("");
      slide.innerHTML=`<div class="vcc-budget-stage-heading"><span>ZONA ${i+1} DE ${state.stops.length}</span><span class="vcc-budget-stage-subtotal"><span>Subtotal</span><strong data-zone-total>—</strong></span><button type="button" data-remove-stop aria-label="Eliminar etapa ${i+1}">× Quitar</button></div>
        <div class="vcc-budget-stage-controls">
         <label class="vcc-budget-stage-region"><span class="vcc-budget-stage-label">REGIÓN</span><span class="vcc-budget-stage-select-wrap"><svg class="vcc-budget-stage-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg><select data-zone-name aria-label="Región de la zona ${i+1}"></select></span></label>
         ${["days","nights"].map(unit=>`<div class="vcc-budget-stage-unit"><span class="vcc-budget-stage-label">${unit==="days"?"DÍAS":"NOCHES"}</span><div class="vcc-budget-stage-step"><span class="vcc-ctrl-icon vcc-budget-stage-step-icon" aria-hidden="true">${unit==="days"?"▦":"☾"}</span><button type="button" data-stage-step="${unit}" data-stage-delta="-1" aria-label="Restar ${unit==="days"?"día":"noche"} en la zona ${i+1}">−</button><input type="number" data-stage-input="${unit}" min="${unit==="days"?1:0}" max="60" step="1" inputmode="numeric" aria-label="${unit==="days"?"Días":"Noches"} en la zona ${i+1}" value="${stop[unit]}"><button type="button" data-stage-step="${unit}" data-stage-delta="1" aria-label="Añadir ${unit==="days"?"día":"noche"} en la zona ${i+1}">+</button></div></div>`).join("")}
        </div><div class="vcc-budget-stage-categories">${rows}</div>`;
      const selector=slide.querySelector("[data-zone-name]");
      for(const [key,zone] of Object.entries(data.zones)){
        const opt=document.createElement("option");opt.value=key;opt.textContent=zone.name;selector.append(opt);
      }
      selector.value=stop.zone;
      selector.addEventListener("change",()=>{
        if(!data.zones[selector.value])return;
        stop.zone=selector.value;renderRouteSummary();renderCalculator();
      });
      slide.querySelectorAll("[data-stage-input]").forEach(input=>{
        const unit=input.dataset.stageInput;
        input.addEventListener("input",()=>{
          if(input.value==="")return;
          stop[unit]=integer(input.value,unit==="days"?1:0,60,stop[unit]);
          renderRouteSummary();renderCalculator();
        });
        input.addEventListener("change",()=>{
          stop[unit]=integer(input.value,unit==="days"?1:0,60,stop[unit]);
          input.value=stop[unit];renderRouteSummary();renderCalculator();
        });
      });
      slide.querySelectorAll("[data-stage-step]").forEach(button=>button.addEventListener("click",()=>{
        const unit=button.dataset.stageStep;
        stop[unit]=integer(stop[unit]+Number(button.dataset.stageDelta),unit==="days"?1:0,60,stop[unit]);
        slide.querySelector('[data-stage-input="'+unit+'"]').value=stop[unit];
        renderRouteSummary();renderCalculator();
      }));
      slide.querySelectorAll("[data-zone-category]").forEach(select=>{
        const k=select.dataset.zoneCategory;
        for(const style of ["mochilero","vcc","medio","lujo"]){
          const opt=document.createElement("option");opt.value=style;opt.textContent=styleNames[style];select.append(opt);
        }
        select.value=stop.choice[k];
        select.addEventListener("change",()=>{if(styles.includes(select.value)){stop.choice[k]=select.value;renderCalculator();}});
      });
      const remove=slide.querySelector("[data-remove-stop]");
      remove.disabled=state.stops.length===1;
      remove.addEventListener("click",()=>{
        if(state.stops.length===1)return;
        state.stops.splice(i,1);state.activeStop=Math.min(i,state.stops.length-1);
        renderRoute();renderCalculator();
      });
      container.append(slide);
    });
    const add=document.querySelector("[data-swb-add-stop]");if(add)add.disabled=state.stops.length>=maxStages;
    renderRouteSummary();showStop(state.activeStop);
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
    for(const category of cats)el("legend-"+category).textContent=euro(result.categoryTotals[category]);
    updateStagePrices();
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
    // No fingir que los escenarios del simulador son tarifas reales por zona.
    // El único gasto VCC verificado de las fichas es Estocolmo.
    const indicator=el("swb-zone-current-style");
    if(indicator)indicator.textContent="Presupuesto disponible: Estocolmo";
    document.querySelectorAll("[data-region-card]").forEach(card=>{
      const key=card.dataset.regionCard;
      const cell=card.querySelector("[data-zone-daily]");
      if(cell){
        const isReal=key==="stockholm";
        cell.textContent=isReal?"110 €/pax/día":"";
        cell.closest(".di-budget-row")?.setAttribute("title",isReal?
          "Gasto real VCC: 660 € / 2 viajeros / 3 días, sin vuelos ni traslados de entrada y salida":
          "Próximamente: presupuesto de esta zona en preparación");
      }
      card.classList.toggle("is-current",key===state.zone);
    });
  }
  function render(){
    el("swb-region-top").value=state.zone;
    renderProfiles();renderRoute();renderCalculator();renderRegions();
  }
  function wire(){
    document.querySelectorAll("[data-budget-mode]").forEach(button=>{
      button.addEventListener("click",()=>{
        const style=button.dataset.budgetMode;
        if(!styles.includes(style))return;
        cats.forEach(category=>{state.choice[category]=style;});
        state.stops.forEach(stop=>{cats.forEach(category=>{stop.choice[category]=style;});});
        render();
      });
    });
    document.querySelectorAll("[data-step]").forEach(button=>button.addEventListener("click",()=>{
      const key=button.dataset.step;
      if(key!=="people")return;
      state.people=Math.max(1,Math.min(12,state.people+Number(button.dataset.delta)));
      renderCalculator();
    }));
    for(const id of ["swb-region-top"]){
      el(id).addEventListener("change",event=>{
        if(data.zones[event.target.value]){state.zone=event.target.value;render();}
      });
    }
    document.querySelector("[data-swb-add-stop]")?.addEventListener("click",()=>{
      if(state.stops.length>=8)return;
      const next=Object.keys(data.zones).find(key=>!state.stops.some(s=>s.zone===key))||state.zone;
      state.stops.push({zone:next,days:1,nights:1,choice:{...state.choice}});
      state.activeStop=state.stops.length-1;
      renderRoute();renderCalculator();
    });
    el("swb-route-prev")?.addEventListener("click",()=>showStop(state.activeStop-1));
    el("swb-route-next")?.addEventListener("click",()=>showStop(state.activeStop+1));
    const track=el("swb-route-rows");
    track?.addEventListener("keydown",event=>{
      if(event.target!==track||!["ArrowLeft","ArrowRight"].includes(event.key))return;
      event.preventDefault();showStop(state.activeStop+(event.key==="ArrowRight"?1:-1));
    });
    let touchStart=null;
    track?.addEventListener("touchstart",event=>{
      touchStart=event.target.closest("button,select,input")?null:event.touches[0]?.clientX??null;
    },{passive:true});
    track?.addEventListener("touchend",event=>{
      if(touchStart===null)return;
      const dx=(event.changedTouches[0]?.clientX??touchStart)-touchStart;
      touchStart=null;if(Math.abs(dx)>45)showStop(state.activeStop+(dx<0?1:-1));
    },{passive:true});
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

  function initZoneCarousel(){
    const track=el("swbRegionTrack"), prev=el("swbRegionPrev"), next=el("swbRegionNext");
    if(!track||!prev||!next)return;
    const step=()=>{
      const cards=track.querySelectorAll(".swb-zone-card");
      return cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:(cards[0]?.getBoundingClientRect().width||1);
    };
    const sync=()=>{
      const end=Math.max(0,track.scrollWidth-track.clientWidth);
      prev.disabled=track.scrollLeft<=2;
      next.disabled=track.scrollLeft>=end-2;
    };
    const move=direction=>{
      const width=step();if(width<=0)return;
      const end=Math.max(0,track.scrollWidth-track.clientWidth);
      const left=Math.max(0,Math.min(end,(Math.round(track.scrollLeft/width)+direction)*width));
      track.scrollTo({left,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    };
    prev.addEventListener("click",()=>move(-1));
    next.addEventListener("click",()=>move(1));
    track.addEventListener("scroll",sync,{passive:true});
    track.addEventListener("keydown",event=>{
      if(event.target===track&&(event.key==="ArrowLeft"||event.key==="ArrowRight")){
        event.preventDefault();move(event.key==="ArrowRight"?1:-1);
      }
    });
    window.addEventListener("resize",sync,{passive:true});
    sync();
  }
  async function init(){
    try{
      const response=await fetch(source);
      if(!response.ok)throw new Error("HTTP "+response.status);
      data=validate(await response.json());
      state.zone=data.defaultZone;
      state.stops=[{zone:data.defaultZone,days:7,nights:7,choice:{...state.choice}}];
      hydrateSelects();
      hydrateRegionCards();
      initZoneCarousel();
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