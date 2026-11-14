/* VCC · Cómo moverse por Suecia: calculadora de transporte público o avión versus coche.
   Los precios sólo los introduce el lector; no se presentan tarifas en tiempo real. */
(() => {
  "use strict";
  function init(){
    const page=document.querySelector(".swmove-page");
    if(!page)return;

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
