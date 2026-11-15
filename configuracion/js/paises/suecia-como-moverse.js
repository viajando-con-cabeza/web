/* VCC · Cómo moverse por Suecia: calculadora de transporte público o avión versus coche.
   Los precios sólo los introduce el lector; no se presentan tarifas en tiempo real. */
(() => {
  "use strict";
  function init(){
    const page=document.querySelector(".swmove-page");
    if(!page)return;

    // Igual que els desplegables del pressupost: només un transport obert cada vegada.
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
        if(label)label.textContent=selected?"OCULTAR DESGLOSE":"VER DESGLOSE";
        const panel=page.querySelector("#red-"+button.dataset.swInfraToggle);
        if(panel)panel.hidden=!selected;
      });
      if(isOpen&&scroll&&infraArea){
        infraArea.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
      }
    };
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
        if(calcToggleLabel)calcToggleLabel.textContent=open?"OCULTAR DESGLOSE":"VER DESGLOSE";
      });
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
      savingLabel.textContent=tie?"MISMO COSTE":signedSaving>0?"TE AHORRAS":"PAGAS DE MÁS";
      saving.textContent=format.format(savingAmount);
      savingWith.textContent=tie?"en ambas opciones":"con transporte público / avión";
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
