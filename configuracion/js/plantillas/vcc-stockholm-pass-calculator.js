/* VCC Stockholm · Comparador de entradas, sin inventar precios ni inclusiones.
   Los precios iniciales son los orientativos de la tabla editorial (2026);
   el viajero puede ajustarlos y confirmar manualmente qué cubre su pase. */
(function(){
  "use strict";
  function init(){
    const root=document.getElementById("ep4-vcc-calculator");
    if(!root)return;
    const en=(document.documentElement.lang||"").toLowerCase().startsWith("en");
    const rows=Array.from(root.querySelectorAll(".ep4-calc-row"));
    const adults=root.querySelector("#ep4-calc-adults");
    const passPrice=root.querySelector("#ep4-calc-pass-price");
    const individual=root.querySelector("#ep4-calc-individual-total");
    const withPass=root.querySelector("#ep4-calc-pass-total");
    const verdict=root.querySelector("#ep4-calc-verdict");
    const savingBadge=root.querySelector("#ep4-calc-saving");
    const format=n=>Math.round(n).toLocaleString(en?"en-GB":"es-ES")+" SEK";
    const num=s=>{const n=Number(String(s).trim().replace(",","."));return Number.isFinite(n)?Math.max(0,n):0;};
    function render(){
      root.dataset.result="pending";
      if(savingBadge){savingBadge.hidden=true;savingBadge.textContent="";}
      const people=Math.max(1,Math.min(6,Math.round(num(adults.value))||1));
      let entry=0,remaining=0,count=0,covered=0;
      rows.forEach(row=>{
        const visit=row.querySelector(".ep4-calc-visit input");
        const cover=row.querySelector(".ep4-calc-included input");
        const price=row.querySelector(".ep4-calc-ticket input");
        const selected=visit.checked;
        price.disabled=!selected;
        cover.disabled=!selected;
        if(!selected){cover.checked=false;return;}
        const amount=num(price.value);
        entry+=amount;
        count++;
        if(cover.checked)covered++;else remaining+=amount;
      });
      individual.textContent=format(entry*people);
      const cost=passPrice.value.trim()===""?null:num(passPrice.value);
      if(count===0){
        withPass.textContent="—";
        verdict.textContent=en?"Choose at least one attraction to compare.":"Selecciona al menos una visita para comparar.";
      }else if(cost===null){
        withPass.textContent="—";
        verdict.textContent=en?"Enter the current pass price and tick only the attractions it really includes.":"Introduce el precio actual del pase y marca solo las visitas que realmente incluye.";
      }else if(covered===0){
        withPass.textContent="—";
        verdict.textContent=en?"Check which selected attractions your pass covers. We do not assume any inclusions.":"Marca qué visitas seleccionadas cubre tu pase. No suponemos ninguna inclusión.";
      }else{
        const total=(cost+remaining)*people;
        const delta=entry*people-total;
        withPass.textContent=format(total);
        const saving=format(Math.abs(delta));
        root.dataset.result=delta>0?"pass":delta<0?"tickets":"same";
        if(savingBadge&&delta!==0){
          savingBadge.textContent=(en?"You save ":"Ahorras ")+saving;
          savingBadge.hidden=false;
        }
        if(delta>0)verdict.textContent=en?"For the prices you entered, the pass saves "+saving+". Check its validity, bookings and limitations.":"Con los importes introducidos, el pase ahorra "+saving+". Comprueba validez, reservas y límites.";
        else if(delta<0)verdict.textContent=en?"For the prices you entered, separate tickets save "+saving+".":"Con los importes introducidos, comprar entradas sueltas ahorra "+saving+".";
        else verdict.textContent=en?"Both options cost the same with the prices entered.":"Ambas opciones cuestan lo mismo con los importes introducidos.";
      }
    }
    root.addEventListener("input",render);
    root.addEventListener("change",render);
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
