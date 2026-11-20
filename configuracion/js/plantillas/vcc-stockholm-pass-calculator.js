/* VCC · comparador de entradas sencillo: el visitante introduce nombre y precio.
   Solo se compara con el pase si cubre TODAS las visitas de la lista.
   Sin bases de datos de tarifas ni inclusión automática de atracciones. */
(function(){
  "use strict";
  function init(){
    const root=document.getElementById("ep4-vcc-calculator");if(!root)return;
    const en=(document.documentElement.lang||"").toLowerCase().startsWith("en");
    const $=id=>root.querySelector("#"+id);
    const list=$("ep4-calc-visits"),add=$("ep4-calc-add"),duration=$("ep4-calc-pass-duration");
    const customWrap=$("ep4-calc-custom-wrap"),custom=$("ep4-calc-custom-duration"),passPrice=$("ep4-calc-pass-price");
    const individual=$("ep4-calc-individual-total"),withPass=$("ep4-calc-pass-total"),verdict=$("ep4-calc-verdict");
    const saving=$("ep4-calc-saving"),savingNumber=$("ep4-calc-saving-number");
    if(!list||!add||!duration||!customWrap||!passPrice||!individual||!withPass||!verdict||!saving||!savingNumber)return;
    const format=n=>Math.round(n).toLocaleString(en?"en-GB":"es-ES")+" SEK";
    const asNumber=s=>{
      const raw=String(s).trim().replace(",",".");
      if(!raw||!/^\d+(?:\.\d{1,2})?$/.test(raw))return null;
      const n=Number(raw);return Number.isFinite(n)&&n>=0?n:null;
    };
    const t=en?{
      name:"Attraction name",price:"Price per person (SEK)",covered:"Included in pass",remove:"Remove ticket",
      placeholder:"Museum, attraction…",empty:"Add a ticket and its price to start.",
      incomplete:"Complete the name and price of every added ticket.",missing:"Enter the pass price.",
      pass:"The pass is cheaper.",tickets:"Individual tickets are cheaper.",same:"Both options cost the same."
    }:{
      name:"Nombre de la visita",price:"Precio por persona (SEK)",covered:"Incluida en el pase",remove:"Eliminar entrada",
      placeholder:"Museo, visita…",empty:"Añade una entrada y su precio para empezar.",
      incomplete:"Completa el nombre y precio de cada entrada.",missing:"Introduce el precio del pase.",
      pass:"Te conviene el pase.",tickets:"Te convienen las entradas sueltas.",same:"Ambas opciones cuestan lo mismo."
    };
    const pricesByDuration=new Map();
    let nextId=1;
    function row(){
      const li=document.createElement("li");li.className="ep4-calc-row vcc-ticket-entry";
      const n=nextId++;
      li.innerHTML='<div class="vcc-ticket-main">'
       +'<label class="vcc-ticket-name"><input type="text" maxlength="70" autocomplete="off" placeholder="'+t.placeholder+'" aria-label="'+t.name+' '+n+'"></label>'
       +'<label class="vcc-ticket-price"><input type="number" min="0" step="1" inputmode="decimal" placeholder="0" aria-label="'+t.price+' '+n+'"><span>SEK</span></label>'
       +'<button type="button" class="vcc-ticket-remove" aria-label="'+t.remove+' '+n+'" title="'+t.remove+'">×</button></div>'
       +'<label class="vcc-ticket-included"><input type="checkbox" class="vcc-ticket-covered"><span>'+t.covered+'</span></label>';
      return li;
    }
    function renumber(){
      [...list.querySelectorAll(".vcc-ticket-entry")].forEach((li,i)=>{
        li.querySelector(".vcc-ticket-name input").setAttribute("aria-label",t.name+" "+(i+1));
        li.querySelector(".vcc-ticket-price input").setAttribute("aria-label",t.price+" "+(i+1));
        li.querySelector(".vcc-ticket-remove").setAttribute("aria-label",t.remove+" "+(i+1));
      });
    }
    function render(){
      let entries=0,all=0,outside=0,incomplete=false;
      list.querySelectorAll(".vcc-ticket-entry").forEach(li=>{
        const name=li.querySelector(".vcc-ticket-name input").value.trim();
        const raw=li.querySelector(".vcc-ticket-price input").value.trim();
        if(!name&&!raw)return;
        const price=asNumber(raw);
        if(!name||price===null){incomplete=true;return}
        entries++;all+=price;
        if(!li.querySelector(".vcc-ticket-covered").checked)outside+=price;
      });
      individual.textContent=entries?format(all):"—";
      withPass.textContent="—";saving.hidden=true;savingNumber.textContent="—";
      root.dataset.result="pending";
      if(!entries){verdict.textContent=incomplete?t.incomplete:t.empty;return;}
      if(incomplete){verdict.textContent=t.incomplete;return;}
      const pass=asNumber(passPrice.value);
      if(pass===null){verdict.textContent=t.missing;return;}
      const combo=pass+outside;
      withPass.textContent=format(combo);
      const difference=Math.round((all-combo)*100)/100;
      root.dataset.result=difference>0?"pass":difference<0?"tickets":"same";
      verdict.textContent=difference>0?t.pass:difference<0?t.tickets:t.same;
      saving.hidden=false;savingNumber.textContent=format(Math.abs(difference));
    }
    function addRow(focus){
      const li=row();list.append(li);renumber();render();
      if(focus)li.querySelector(".vcc-ticket-name input").focus();
    }
    add.addEventListener("click",()=>addRow(true));
    list.addEventListener("click",event=>{
      const button=event.target.closest(".vcc-ticket-remove");if(!button)return;
      const li=button.closest(".vcc-ticket-entry"),prev=li.previousElementSibling;
      li.remove();if(!list.children.length)addRow(false);
      renumber();render();
      (prev?.querySelector(".vcc-ticket-name input")||list.querySelector(".vcc-ticket-name input"))?.focus();
    });
    list.addEventListener("input",render);
    list.addEventListener("change",render);
    duration.addEventListener("change",()=>{
      const key=duration.value;
      customWrap.hidden=key!=="custom";
      passPrice.value=pricesByDuration.get(key)||"";
      render();
      if(key==="custom")custom?.focus();
    });
    passPrice.addEventListener("input",()=>{
      pricesByDuration.set(duration.value,passPrice.value);render();
    });
    custom?.addEventListener("input",render);
    addRow(false);addRow(false);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
