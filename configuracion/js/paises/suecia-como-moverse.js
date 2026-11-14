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
      if(!verdict)return;
      if(trainTotal===null||carTotal===null){
        verdict.textContent="Introduce los precios de ambos transportes para compararlos.";
        return;
      }
      const diff=Math.abs(trainTotal-carTotal);
      if(diff<1){
        verdict.textContent="El coste introducido es prácticamente igual.";
      }else{
        verdict.textContent=(trainTotal<carTotal?"El tren":"El coche")+" sale "+format.format(diff)+" más barato en total.";
      }
    };
    form.addEventListener("input",show);
    form.addEventListener("change",show);
    const clear=page.querySelector("[data-sw-calc-reset]");
    if(clear)clear.addEventListener("click",()=>{form.reset();show();});
    show();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
