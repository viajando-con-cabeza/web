/* VCC · Cómo moverse por Suecia: calculadora de transporte público o avión versus coche.
   Los precios sólo los introduce el lector; no se presentan tarifas en tiempo real. */
(() => {
  "use strict";
  function init(){
    const page=document.querySelector(".swmove-page");
    if(!page)return;

    // Manté el text fix igual que a Presupuesto Estocolmo, també amb el detall obert.
    const disclosureText="VER DESGLOSE";
    const keepDisclosureText=(label)=>{if(label&&label.textContent!==disclosureText)label.textContent=disclosureText;};

    // Només un transport obert cada vegada.
    const infraArea=page.querySelector(".swmove-infra-area");
    const infraButtons=Array.from(page.querySelectorAll("[data-sw-infra-toggle]"));
    const infraClose=page.querySelector("[data-sw-infra-close]");
    const setInfra=(method,scroll)=>{
      const isOpen=Boolean(method);
      if(infraArea)infraArea.hidden=!isOpen;
      infraButtons.forEach(button=>{
        const selected=isOpen&&button.dataset.swInfraToggle===method;
        button.setAttribute("aria-expanded",String(selected));
        const label=button.querySelector("[data-sw-infra-label]");
        keepDisclosureText(label);
        const panel=page.querySelector("#red-"+button.dataset.swInfraToggle);
        if(panel)panel.hidden=!selected;
      });
      if(isOpen&&scroll&&infraArea){
        infraArea.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
      }
    };
    setInfra(null,false);
    infraButtons.forEach(button=>button.addEventListener("click",()=>{
      const selected=button.getAttribute("aria-expanded")==="true";
      setInfra(selected?null:button.dataset.swInfraToggle,!selected);
    }));
    if(infraClose)infraClose.addEventListener("click",()=>{
      const active=infraButtons.find(button=>button.getAttribute("aria-expanded")==="true");
      setInfra(null,false);
      if(active)active.focus();
    });

    // El resum de la calculadora sempre visible; detall i inputs només en obrir.
    const calcDisclosure=page.querySelector("#swmove-calc-details");
    const calcToggle=page.querySelector("[data-sw-calc-toggle]");
    const calcToggleLabel=page.querySelector("[data-sw-calc-toggle-label]");
    if(calcToggle&&calcDisclosure){
      calcToggle.addEventListener("click",()=>{
        const open=calcToggle.getAttribute("aria-expanded")!=="true";
        calcDisclosure.hidden=!open;
        calcToggle.setAttribute("aria-expanded",String(open));
        keepDisclosureText(calcToggleLabel);
      });
      keepDisclosureText(calcToggleLabel);
    }
    const form=page.querySelector("#swmove-calc");
    if(!form)return;
    const field=name=>form.elements.namedItem(name);
    const resultPublic=page.querySelector("[data-sw-public-total]");
    const resultCar=page.querySelector("[data-sw-car-total]");
    const verdict=page.querySelector("[data-sw-verdict]");
    const saving=page.querySelector("[data-sw-saving]");
    const savingLabel=page.querySelector("[data-sw-saving-label]");
    const savingWith=page.querySelector("[data-sw-saving-with]");
    const savingBox=page.querySelector("[data-sw-saving-box]");
    const breakdownNodes={
      publicFare:page.querySelector("[data-sw-detail-public-fare]"),
      people:page.querySelector("[data-sw-detail-people]"),
      publicTotal:page.querySelector("[data-sw-detail-public-total]"),
      rentalDay:page.querySelector("[data-sw-detail-rental-day]"),
      days:page.querySelector("[data-sw-detail-days]"),
      rentalTotal:page.querySelector("[data-sw-detail-rental-total]"),
      fuel:page.querySelector("[data-sw-detail-fuel]"),
      insurance:page.querySelector("[data-sw-detail-insurance]"),
      carTotal:page.querySelector("[data-sw-detail-car-total]")
    };
    const setDetail=(key,value)=>{if(breakdownNodes[key])breakdownNodes[key].textContent=value;};

    const format=new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0});
    const asNumber=name=>{
      const el=field(name);
      if(!el||el.value.trim()==="")return null;
      const parsed=Number(el.value);
      return Number.isFinite(parsed)&&parsed>=0?parsed:null;
    };
    const show=()=>{
      const people=asNumber("personas");
      const days=asNumber("dias");
      const publicFare=asNumber("publico");
      const rental=asNumber("alquiler");
      const fuel=asNumber("combustible");
      const insurance=asNumber("seguro");
      const publicReady=people!==null&&people>=1&&Number.isInteger(people)&&publicFare!==null;
      const carReady=days!==null&&days>=1&&Number.isInteger(days)&&rental!==null&&fuel!==null;
      const publicTotal=publicReady?publicFare*people:null;
      const carTotal=carReady?rental*days+fuel+(insurance??0):null;
      const euros=value=>value===null?"—":format.format(Math.round(value));
      setDetail("publicFare",euros(publicFare));
      setDetail("people",people===null?"—":String(people));
      setDetail("publicTotal",euros(publicTotal));
      setDetail("rentalDay",euros(rental));
      setDetail("days",days===null?"—":String(days));
      setDetail("rentalTotal",euros(carReady?rental*days:null));
      setDetail("fuel",euros(fuel));
      setDetail("insurance",euros(insurance));
      setDetail("carTotal",euros(carTotal));
      if(resultPublic)resultPublic.textContent=publicTotal===null?"—":format.format(Math.round(publicTotal));
      if(resultCar)resultCar.textContent=carTotal===null?"—":format.format(Math.round(carTotal));
      if(!verdict||!saving||!savingLabel||!savingWith||!savingBox)return;
      if(publicTotal===null||carTotal===null){
        savingBox.dataset.savings="pending";
        savingLabel.textContent="AHORRO";
        saving.textContent="—";
        savingWith.textContent="";
        verdict.textContent="Introduce tus precios";
        return;
      }
      // Signed comparison: >0 means public transport / plane is cheaper than renting.
      const signedSaving=Math.round(carTotal-publicTotal);
      const savingAmount=Math.abs(signedSaving);
      const tie=savingAmount===0;
      savingBox.dataset.savings=tie?"neutral":signedSaving>0?"positive":"negative";
      savingLabel.textContent=tie?"MISMO COSTE":"TE AHORRAS";
      saving.textContent=format.format(savingAmount);
      savingWith.textContent=tie?"en ambas opciones":signedSaving>0?"con transporte público / avión":"con coche de alquiler";
      verdict.textContent=tie?"Empate":signedSaving>0?"Transporte público / avión":"Coche";
    };
    form.addEventListener("input",show);
    form.addEventListener("change",show);
    const clear=page.querySelector("[data-sw-calc-reset]");
    if(clear)clear.addEventListener("click",()=>{
      ["publico","alquiler","combustible","seguro"].forEach(name=>{field(name).value="";});
      field("personas").value="2";
      field("dias").value="3";
      show();
    });
    show();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

/* Carrusel de regiones: 4 visibles en escritorio, 3/2/1 según el ancho;
   flechas y gestos, sin contador ni duplicación de tarjetas. */
(() => {
  "use strict";
  function initSwedenRegions() {
    const track = document.getElementById("swmove-region-track");
    if (!track) return;
    const section = track.closest(".swmove-region-carousel");
    if (!section) return;
    const prev = section.querySelector(".swmove-region-prev");
    const next = section.querySelector(".swmove-region-next");
    const cards = Array.from(track.querySelectorAll(".swmove-region-card"));
    if (!prev || !next || cards.length < 2) return;
    const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pitch = () => cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    function update() {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    function move(direction) {
      const step = pitch();
      if (step <= 0) return;
      const current = Math.round(track.scrollLeft / step);
      const targetIndex = Math.max(0, Math.min(cards.length-1, current + direction));
      const left = cards[targetIndex].offsetLeft - cards[0].offsetLeft;
      track.scrollTo({left, behavior: reduceMotion() ? "auto" : "smooth"});
    }
    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("keydown", event => {
      if (event.target !== track || !["ArrowLeft","ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    });
    track.addEventListener("scroll", update, {passive:true});
    window.addEventListener("resize", update, {passive:true});
    update();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSwedenRegions, {once:true});
  else initSwedenRegions();
})();
