/* VCC · comparador de entradas sencillo: el visitante introduce nombre y precio.
   Solo se compara con el pase si cubre TODAS las visitas de la lista.
   Sin bases de datos de tarifas ni inclusión automática de atracciones. */
(function(){
  "use strict";
  function init(){
    const root=document.getElementById("ep4-vcc-calculator");
    if(!root)return;
    const en=(document.documentElement.lang||"").toLowerCase().startsWith("en");
    const list=root.querySelector("#ep4-calc-visits");
    const add=root.querySelector("#ep4-calc-add");
    const adults=root.querySelector("#ep4-calc-adults");
    const passPrice=root.querySelector("#ep4-calc-pass-price");
    const individual=root.querySelector("#ep4-calc-individual-total");
    const withPass=root.querySelector("#ep4-calc-pass-total");
    const verdict=root.querySelector("#ep4-calc-verdict");
    const savingBadge=root.querySelector("#ep4-calc-saving");
    if(!list||!add||!adults||!passPrice||!individual||!withPass||!verdict)return;
    const format=n=>Math.round(n).toLocaleString(en?"en-GB":"es-ES")+" SEK";
    const asNumber=s=>{const n=Number(String(s).trim().replace(",","."));return Number.isFinite(n)&&n>=0?n:null};
    const icon="/configuracion/imagenes/iconos/entradas-y-pases/ticket.svg";
    let nextId=1;
    const row=()=>{
      const li=document.createElement("li");
      li.className="ep4-calc-row vcc-ticket-entry";
      const id=nextId++;
      li.innerHTML='<label class="vcc-ticket-name"><img src="'+icon+'" alt="" aria-hidden="true" width="14" height="14"><input type="text" maxlength="70" autocomplete="off" aria-label="'+(en?"Attraction name":"Nombre de la visita")+'" placeholder="'+(en?"Museum, attraction…":"Museo, visita…")+'"></label>'
      +'<label class="vcc-ticket-price"><input type="number" min="0" step="1" inputmode="decimal" aria-label="'+(en?"Ticket price in SEK for attraction":"Precio de la entrada en SEK")+' '+id+'" placeholder="0"><span>SEK</span></label>'
      +'<button type="button" class="vcc-ticket-remove" aria-label="'+(en?"Remove this visit":"Eliminar esta visita")+'" title="'+(en?"Remove":"Eliminar")+'">×</button>';
      return li;
    };
    const renumber=()=>{
      [...list.querySelectorAll(".vcc-ticket-entry")].forEach((r,i)=>{
        const input=r.querySelector(".vcc-ticket-name input");
        const cost=r.querySelector(".vcc-ticket-price input");
        input.setAttribute("aria-label",(en?"Attraction name":"Nombre de la visita")+" "+(i+1));
        cost.setAttribute("aria-label",(en?"Ticket price in SEK":"Precio de la entrada en SEK")+" "+(i+1));
      });
    };
    function render(){
      const people=Math.max(1,Math.min(20,Math.round(asNumber(adults.value)||1)));
      const rows=[...list.querySelectorAll(".vcc-ticket-entry")];
      let count=0,total=0,unfinished=false;
      for(const r of rows){
        const name=r.querySelector(".vcc-ticket-name input").value.trim();
        const raw=r.querySelector(".vcc-ticket-price input").value.trim();
        if(!name&&!raw)continue;
        if(!name||raw===""||asNumber(raw)===null){unfinished=true;continue}
        count++;
        total+=asNumber(raw);
      }
      const noPrices=count===0;
      individual.textContent=noPrices?"—":format(total*people);
      withPass.textContent="—";
      if(savingBadge){savingBadge.hidden=true;savingBadge.textContent=""}
      root.dataset.result="pending";
      if(noPrices){
        verdict.textContent=en?"Add a visit and its ticket price to start.":"Añade una visita y su precio para empezar.";
        return;
      }
      if(unfinished){
        verdict.textContent=en?"Complete the name and price of every visit you added.":"Completa el nombre y el precio de todas las visitas añadidas.";
        return;
      }
      if(passPrice.value.trim()===""||asNumber(passPrice.value)===null){
        verdict.textContent=en?"Enter the pass price per person to compare.":"Introduce el precio del pase por persona para comparar.";
        return;
      }
      const passTotal=asNumber(passPrice.value)*people;
      withPass.textContent=format(passTotal);
      const diff=total*people-passTotal;
      root.dataset.result=diff>0?"pass":diff<0?"tickets":"same";
      if(diff>0){
        if(savingBadge){savingBadge.hidden=false;savingBadge.textContent=(en?"Pass saves ":"El pase ahorra ")+format(diff)}
        verdict.textContent=en?"The pass is cheaper only if it covers every visit listed.":"El pase solo sale mejor si incluye todas las visitas añadidas.";
      }else if(diff<0){
        if(savingBadge){savingBadge.hidden=false;savingBadge.textContent=(en?"Tickets save ":"Las entradas ahorran ")+format(-diff)}
        verdict.textContent=en?"Separate tickets are cheaper at the prices entered.":"Las entradas sueltas son más económicas con estos precios.";
      }else{
        verdict.textContent=en?"Both options cost the same, if the pass covers every visit.":"Ambas opciones cuestan lo mismo si el pase incluye todas las visitas.";
      }
    }
    function addRow(focus){
      const item=row();
      list.append(item);
      renumber();
      render();
      if(focus)item.querySelector(".vcc-ticket-name input").focus();
    }
    add.addEventListener("click",()=>addRow(true));
    list.addEventListener("click",e=>{
      const remove=e.target.closest(".vcc-ticket-remove");
      if(!remove)return;
      const r=remove.closest(".vcc-ticket-entry");
      const previous=r.previousElementSibling;
      r.remove();
      if(!list.children.length)addRow(false);
      renumber();render();
      (previous?.querySelector(".vcc-ticket-name input")||list.querySelector(".vcc-ticket-name input"))?.focus();
    });
    root.addEventListener("input",render);
    root.addEventListener("change",render);
    if(!list.children.length){addRow(false);addRow(false)}
    else {renumber();render()}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
