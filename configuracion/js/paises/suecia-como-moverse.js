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
        button.setAttribute("aria-label",(selected?"Ocultar":"Ver")+" desglose del transporte "+button.dataset.swInfraToggle);
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

    // Los datos de ambas alternativas siempre están visibles. Se introducen
    // importes totales del viaje (grupo y trayectos completos), no tarifas/pax/día.
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
    const format=new Intl.NumberFormat("es-ES",{useGrouping:"always",style:"currency",currency:"EUR",maximumFractionDigits:2});
    const asAmount=name=>{
      const el=field(name);
      if(!el||el.value.trim()===""||!el.validity.valid)return null;
      const num=Number(el.value);
      return Number.isFinite(num)&&num>=0?num:null;
    };
    function recalculate(){
      const publicFare=asAmount("publico");
      const publicExtra=asAmount("extra_publico");
      const rental=asAmount("alquiler");
      const fuel=asAmount("combustible");
      const insurance=asAmount("seguro");
      const parking=asAmount("parking");
      // Solo son obligatorios los dos importes principales; extras vacíos = 0.
      const publicTotal=publicFare===null?null:publicFare+(publicExtra??0);
      const carTotal=rental===null?null:rental+(fuel??0)+(insurance??0)+(parking??0);
      if(resultPublic)resultPublic.textContent=publicTotal===null?"—":format.format(publicTotal);
      if(resultCar)resultCar.textContent=carTotal===null?"—":format.format(carTotal);
      if(!verdict||!saving||!savingLabel||!savingWith||!savingBox)return;
      if(publicTotal===null||carTotal===null){
        savingBox.dataset.savings="pending";
        savingLabel.textContent="AHORRO ESTIMADO";
        saving.textContent="—";
        savingWith.textContent="Completa el precio de ambas opciones";
        verdict.textContent="Introduce los importes";
        return;
      }
      const difference=Math.round((carTotal-publicTotal)*100)/100;
      if(difference===0){
        savingBox.dataset.savings="neutral";
        savingLabel.textContent="MISMO COSTE";
        saving.textContent=format.format(0);
        savingWith.textContent="en ambas opciones";
        verdict.textContent="Empate";
      } else {
        savingBox.dataset.savings=difference>0?"positive":"negative";
        savingLabel.textContent="TE AHORRAS";
        saving.textContent=format.format(Math.abs(difference));
        savingWith.textContent=difference>0?"si eliges transporte alternativo":"si eliges coche de alquiler";
        verdict.textContent=difference>0?"Transporte alternativo":"Coche de alquiler";
      }
    }
    form.addEventListener("submit",event=>event.preventDefault());
    form.addEventListener("input",recalculate);
    form.addEventListener("change",recalculate);
    const clear=page.querySelector("[data-sw-calc-reset]");
    if(clear)clear.addEventListener("click",()=>{form.reset();recalculate();field("alquiler")?.focus();});
    recalculate();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

