/* VCC · Cómo moverse por Suecia: calculadora de tren versus coche.
   Los precios sólo los introduce el lector; no se presentan tarifas en tiempo real. */
(() => {
  "use strict";
  function init(){
    const page=document.querySelector(".swmove-page");
    if(!page)return;

    const form=page.querySelector("#swmove-calc");
    if(!form)return;
    const field=name=>form.elements.namedItem(name);
    const resultTrain=page.querySelector("[data-sw-train-total]");
    const resultCar=page.querySelector("[data-sw-car-total]");
    const verdict=page.querySelector("[data-sw-verdict]");
    const saving=page.querySelector("[data-sw-saving]");
    const savingLabel=page.querySelector("[data-sw-saving-label]");
    const savingWith=page.querySelector("[data-sw-saving-with]");
    const savingBox=page.querySelector("[data-sw-saving-box]");
    const format=new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:2});
    const asNumber=name=>{
      const el=field(name);
      if(!el||el.value.trim()==="")return null;
      const parsed=Number(el.value);
      return Number.isFinite(parsed)&&parsed>=0?parsed:null;
    };
    const show=()=>{
      const people=asNumber("personas");
      const days=asNumber("dias");
      const train=asNumber("tren");
      const rental=asNumber("alquiler");
      const fuel=asNumber("combustible");
      const extras=asNumber("extras");
      const trainReady=people!==null&&people>=1&&train!==null;
      const carReady=days!==null&&days>=1&&rental!==null&&fuel!==null;
      const trainTotal=trainReady?train*people:null;
      const carTotal=carReady?rental*days+fuel+(extras??0):null;
      if(resultTrain)resultTrain.textContent=trainTotal===null?"—":format.format(trainTotal);
      if(resultCar)resultCar.textContent=carTotal===null?"—":format.format(carTotal);
      if(!verdict||!saving||!savingLabel||!savingWith||!savingBox)return;
      if(trainTotal===null||carTotal===null){
        savingBox.dataset.savings="pending";
        savingLabel.textContent="AHORRO";
        saving.textContent="—";
        savingWith.textContent="";
        verdict.textContent="Introduce tus precios";
        return;
      }
      const diff=Math.round(Math.abs(trainTotal-carTotal)*100)/100;
      const trainBetter=trainTotal<carTotal;
      savingBox.dataset.savings=diff<0.01?"neutral":"positive";
      savingLabel.textContent=diff<0.01?"DIFERENCIA":"TE AHORRAS";
      saving.textContent=format.format(diff);
      savingWith.textContent=diff<0.01?"mismo coste":(trainBetter?"con el tren":"con el coche");
      verdict.textContent=diff<0.01?"Empate":trainBetter?"Tren":"Coche";
    };
    form.addEventListener("input",show);
    form.addEventListener("change",show);
    const clear=page.querySelector("[data-sw-calc-reset]");
    if(clear)clear.addEventListener("click",()=>{
      ["tren","alquiler","combustible","extras"].forEach(name=>{field(name).value="";});
      field("personas").value="2";
      field("dias").value="3";
      show();
    });
    show();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
