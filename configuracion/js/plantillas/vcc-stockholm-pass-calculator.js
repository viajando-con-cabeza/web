/* VCC · comparador visual de entradas y pases.
   El usuario indica entradas, precios y coberturas verificadas; el cálculo es por persona.
   Sin suponer inclusiones ni precios externos. */
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
    const winner=$("ep4-calc-winner"),rightIndividual=$("ep4-calc-result-individual");
    const rightPass=$("ep4-calc-result-pass"),rightIndividualLabel=$("ep4-calc-result-individual-label");
    const rightPassLabel=$("ep4-calc-result-pass-label"),savingLabel=$("ep4-calc-saving-label");
    if(!list||!add||!duration||!customWrap||!passPrice||!individual||!withPass||!verdict||!saving||!savingNumber||!winner||!rightIndividual||!rightPass||!rightIndividualLabel||!rightPassLabel||!savingLabel)return;
    const formatter=new Intl.NumberFormat(en?"en-GB":"es-ES",{maximumFractionDigits:2});
    const format=n=>formatter.format(n)+" SEK";
    const asNumber=s=>{
      const raw=String(s).trim().replace(",",".");
      if(!raw||!/^\d+(?:\.\d{1,2})?$/.test(raw))return null;
      const n=Number(raw);return Number.isFinite(n)&&n>=0?n:null;
    };
    const t=en?{
      name:"Attraction name",price:"Price per person (SEK)",covered:"Included in the pass",shortCovered:"In pass",remove:"Remove ticket",
      placeholder:"Museum, attraction…",empty:"Add a ticket and its price to start.",
      incomplete:"Complete each ticket's name and price.",missing:"Enter the pass price.",
      initialWinner:"Your best option",passWinner:"Tourist pass",ticketsWinner:"Individual tickets",sameWinner:"Same price",
      pass:"For these visits, the pass is cheaper than separate tickets.",tickets:"These individual tickets cost less than the pass.",same:"Both options cost the same for these visits.",
      individualLabel:"Individual tickets",passLabel:"Pass",extras:" + extras",save:"You save",equalSave:"No difference"
    }:{
      name:"Nombre de la visita",price:"Precio por persona (SEK)",covered:"Incluida en el pase",shortCovered:"En pase",remove:"Eliminar entrada",
      placeholder:"Museo, visita…",empty:"Añade una entrada y su precio para empezar.",
      incomplete:"Completa el nombre y precio de cada entrada.",missing:"Introduce el precio del pase.",
      initialWinner:"Tu mejor opción",passWinner:"Pase turístico",ticketsWinner:"Entradas sueltas",sameWinner:"Mismo precio",
      pass:"Para estas visitas, el pase cuesta menos que las entradas sueltas.",tickets:"La suma de tus entradas sale más barata que el pase.",same:"Ambas opciones cuestan lo mismo para estas visitas.",
      individualLabel:"Entradas sueltas",passLabel:"Pase",extras:" + extras",save:"Te ahorras",equalSave:"Sin diferencia"
    };
    const pricesByDuration=new Map();
    let nextId=1;
    function row(){
      const li=document.createElement("li");li.className="ep4-calc-row vcc-ticket-entry";
      const n=nextId++;
      li.innerHTML='<div class="vcc-ticket-main">'
       +'<label class="vcc-ticket-name"><img class="vcc-calc-filter-icon" src="/configuracion/imagenes/iconos/entradas-y-pases/ticket.svg" alt="" aria-hidden="true" width="13" height="13" loading="lazy"><input type="text" maxlength="70" autocomplete="off" placeholder="'+t.placeholder+'" aria-label="'+t.name+' '+n+'"></label>'
       +'<label class="vcc-ticket-price"><img class="vcc-calc-filter-icon" src="/configuracion/imagenes/iconos/entradas-y-pases/coins.svg" alt="" aria-hidden="true" width="13" height="13" loading="lazy"><input type="number" min="0" step="1" inputmode="decimal" placeholder="0" aria-label="'+t.price+' '+n+'"><span>SEK</span></label>'
       +'<label class="vcc-ticket-included" title="'+t.covered+'"><input type="checkbox" class="vcc-ticket-covered" aria-label="'+t.covered+' '+n+'"><span>'+t.shortCovered+'</span></label>'
       +'<button type="button" class="vcc-ticket-remove" aria-label="'+t.remove+' '+n+'" title="'+t.remove+'">×</button></div>';
      return li;
    }
    function renumber(){
      [...list.querySelectorAll(".vcc-ticket-entry")].forEach((li,i)=>{
        li.querySelector(".vcc-ticket-name input").setAttribute("aria-label",t.name+" "+(i+1));
        li.querySelector(".vcc-ticket-price input").setAttribute("aria-label",t.price+" "+(i+1));
        li.querySelector(".vcc-ticket-remove").setAttribute("aria-label",t.remove+" "+(i+1));
      });
    }
    function updateScrollState(){
      // A partir de la cinquena entrada, només barra de desplaçament vertical.
      const crowded=list.querySelectorAll(".vcc-ticket-entry").length>4;
      list.classList.toggle("is-scrollable",crowded);
      if(!crowded)list.scrollTop=0;
    }
    function render(){
      updateScrollState();
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
      const passOption=duration.options[duration.selectedIndex];
      const passName=duration.value==="custom"?(custom?.value.trim()||(en?"custom pass":"pase personalizado")):(passOption?.textContent.trim()||"");
      const title=t.passLabel+(duration.value==="custom"?" · ":" · ")+passName;
      rightIndividualLabel.textContent=t.individualLabel+(entries?" · "+entries:"");
      rightPassLabel.textContent=title+(outside>0?t.extras:"");
      individual.textContent=entries?format(all):"—";
      rightIndividual.textContent=individual.textContent;
      withPass.textContent="—";rightPass.textContent="—";
      saving.hidden=true;savingNumber.textContent="—";savingLabel.textContent=t.save;
      winner.textContent=t.initialWinner;
      root.dataset.result="pending";
      if(!entries){verdict.textContent=incomplete?t.incomplete:t.empty;return;}
      if(incomplete){verdict.textContent=t.incomplete;return;}
      const pass=asNumber(passPrice.value);
      if(pass===null){verdict.textContent=t.missing;return;}
      const combo=pass+outside;
      withPass.textContent=format(combo);rightPass.textContent=withPass.textContent;
      const difference=Math.round((all-combo)*100)/100;
      root.dataset.result=difference>0?"pass":difference<0?"tickets":"same";
      winner.textContent=difference>0?t.passWinner:difference<0?t.ticketsWinner:t.sameWinner;
      verdict.textContent=difference>0?t.pass:difference<0?t.tickets:t.same;
      saving.hidden=false;savingNumber.textContent=format(Math.abs(difference));
      savingLabel.textContent=difference===0?t.equalSave:t.save;
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
