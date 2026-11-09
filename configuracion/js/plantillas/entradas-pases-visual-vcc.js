/* VCC · Estocolmo · Checklist sencilla de entradas, sin precios ni APIs.
   Mantener con los IDs y enlaces oficiales de la guía. */
(function(){
 "use strict";
 function init(){
   const root=document.querySelector(".ep-page");
   if(!root)return;
   const items=[...root.querySelectorAll("[data-ep3-ticket]")];
   const addButtons=[...root.querySelectorAll("[data-ep3-add]")];
   const save=root.querySelector("#ep3-save");
   const copy=root.querySelector("#ep3-copy");
   const status=root.querySelector("#ep3-status");
   const count=root.querySelector("#ep3-count");
   const storeKey="vcc_stockholm_ticket_checklist_v2";
   if(!items.length||!save||!copy)return;
   const itemsById=new Map(items.map(i=>[i.dataset.ep3Ticket,i]));
   const selected=()=>items.filter(input=>input.checked);
   function announce(message){if(status)status.textContent=message;}
   function update(){
     const n=selected().length;
     if(count)count.textContent=n===0?"Ninguna visita seleccionada":n+" visita"+(n===1?"":"s")+" seleccionada"+(n===1?"":"s");
     addButtons.forEach(b=>{
       const checked=!!itemsById.get(b.dataset.ep3Add)?.checked;
       b.setAttribute("aria-pressed",String(checked));
       b.textContent=checked?"✓ AÑADIDA A LA LISTA":"+ AÑADIR A MI LISTA";
     });
   }
   try{
     const prev=JSON.parse(localStorage.getItem(storeKey)||"null");
     if(Array.isArray(prev)){
       items.forEach(input=>{input.checked=prev.includes(input.dataset.ep3Ticket)});
     }
   }catch(error){}
   items.forEach(input=>input.addEventListener("change",()=>{update();announce("Lista actualizada. Pulsa «Guardar lista» para conservarla en este navegador.")}));
   addButtons.forEach(button=>button.addEventListener("click",()=>{
     const checkbox=itemsById.get(button.dataset.ep3Add);
     if(!checkbox)return;
     checkbox.checked=!checkbox.checked;
     update();
     announce(checkbox.checked?"Añadido a tu lista: "+checkbox.dataset.ep3Name:"Eliminado de tu lista: "+checkbox.dataset.ep3Name);
   }));
   save.addEventListener("click",()=>{
     try{
       localStorage.setItem(storeKey,JSON.stringify(selected().map(e=>e.dataset.ep3Ticket)));
       announce("Lista guardada en este navegador. Podrás recuperarla aquí.");
     }catch(error){announce("No se pudo guardar en este navegador. Usa «Copiar lista» para conservarla.");}
   });
   function makeText(){
     const entries=selected();
     const lines=["VIAJANDO CON CABEZA · ESTOCOLMO","MI LISTA DE ENTRADAS",""];
     if(!entries.length)lines.push("Todavía no has seleccionado ninguna visita.");
     for(const input of entries){
       lines.push("[ ] "+input.dataset.ep3Name);
       const link=input.dataset.ep3Url||"";
       if(link)lines.push("     Entrada e información oficial: "+link);
       if(input.dataset.ep3Note)lines.push("     "+input.dataset.ep3Note);
     }
     lines.push("","Consulta horarios, disponibilidad, condiciones y tarifas actualizadas en cada web oficial.","Guía VCC: https://www.viajandoconcabeza.com/destinos/suecia/estocolmo/entradas-y-pases.html");
     return lines.join("\n");
   }
   copy.addEventListener("click",async()=>{
     const text=makeText();
     try{
       if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error("Clipboard no disponible");
       await navigator.clipboard.writeText(text);
       announce("Lista copiada: puedes enviarla o guardarla en tus notas.");
     }catch(error){
       const field=root.querySelector("#ep3-copy-fallback");
       if(field){field.hidden=false;field.value=text;field.focus();field.select();announce("Selecciona y copia el texto que aparece debajo de los botones.");}
       else announce("No se pudo copiar automáticamente.");
     }
   });
   update();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
})();