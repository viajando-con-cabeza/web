/* VCC · Planificador de entradas Estocolmo · 2026-11-09
 * Referencias por adulto consultadas en webs oficiales; siempre editables.
 * Sólo guarda en ESTE navegador y crea enlaces compartibles al pedirlo.
 * Nunca consulta ni promete disponibilidad, tarifas futuras ni entradas reales. */
(function(){
 "use strict";
 const mount=document.getElementById("ep-planner");
 if(!mount)return;
 const key="vcc_stockholm_tickets_plan_v1";
 const master={
   vasa:{name:"Museo Vasa",low:195,high:240,kind:"main",hours:1.75,priority:"flex",link:"https://www.vasamuseet.se/en/visit/hours--admission",advice:"No necesitas reservar: la compra anticipada no da prioridad en la cola."},
   skansen:{name:"Skansen",low:240,high:240,kind:"main",hours:3,priority:"online",link:"https://www.skansen.se/en/plan-your-visit/opening-hours-and-prices/",advice:"Compra online para mejor precio; confirma la tarifa del día. Si vas con niños, revisa el billete gratuito."},
   palacio:{name:"Palacio Real",low:220,high:240,kind:"main",hours:1.5,priority:"check",link:"https://www.kungligaslotten.se/english/royal-palaces-and-sites/admission-charges.html",advice:"Comprueba cierres y horarios antes de organizar Gamla Stan."},
   abba:{name:"ABBA The Museum",low:269,high:349,kind:"outside",hours:1.75,priority:"before",link:"https://abbathemuseum.com/en/prices-opening-hours",advice:"Compra online con franja horaria; la tarifa depende de la fecha."},
   foto:{name:"Fotografiska",low:230,high:230,kind:"extra",hours:1.5,priority:"check",link:"https://stockholm.fotografiska.com/en/",advice:"Comprueba exposiciones, horario y tarifa de tu fecha."},
   barco:{name:"Crucero Highlights (2 h 15)",low:385,high:385,kind:"extra",hours:2.25,priority:"before",link:"https://gocity.com/en/stockholm/attractions",advice:"Consulta la temporada, salidas y condiciones de reserva del barco concreto."},
   nobel:{name:"Museo Nobel",low:160,high:160,kind:"extra",hours:1.25,priority:"check",link:"https://nobelprizemuseum.se/en/",advice:"Verifica el horario y si te interesa la exposición vigente."}
 };
 const passes={1:949,2:1349,3:1699,4:1949,5:1999};
 const $=id=>mount.querySelector("#"+id);
 const controls={adults:$("ep-pl-adults"),children:$("ep-pl-children"),date:$("ep-pl-date"),season:$("ep-pl-season"),days:$("ep-pl-days"),ess:$("ep-pl-ess"),all:$("ep-pl-all"),rows:[...mount.querySelectorAll("[data-ep-choice]")],prices:[...mount.querySelectorAll("[data-ep-price]")],tasklist:$("ep-pl-tasklist"),status:$("ep-pl-status")};
 const names=Object.keys(master);
 const safeInt=(v,min,max,otherwise)=>{const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?Math.round(n):otherwise};
 const money=n=>new Intl.NumberFormat("es-ES",{maximumFractionDigits:0}).format(n)+" SEK";
 const selected=()=>controls.rows.filter(el=>el.checked).map(el=>el.dataset.epChoice);
 const getPrice=id=>safeInt(mount.querySelector('[data-ep-price="'+id+'"]').value,1,10000,null);
 const setHtml=(id,text)=>{const e=$(id);if(e)e.textContent=text};
 const defaultPrice=(id,season)=>master[id][season];
 const state=()=>({a:controls.adults.value,c:controls.children.value,date:controls.date.value,s:controls.season.value,d:controls.days.value,i:selected(),p:Object.fromEntries(names.map(id=>[id,mount.querySelector('[data-ep-price="'+id+'"]').value])),e:controls.ess.value,al:controls.all.value,done:[...controls.tasklist.querySelectorAll("input[data-ep-complete]:checked")].map(x=>x.dataset.epComplete)});
 let doneItems=new Set();
 let lastSave=false;
 const safeStore=obj=>{try{window.localStorage.setItem(key,JSON.stringify(obj));lastSave=true;}catch(e){lastSave=false;}};
 const readStore=()=>{try{return JSON.parse(window.localStorage.getItem(key)||"null")}catch(e){return null}};
 const readLink=()=>{try{const raw=new URL(window.location.href).searchParams.get("vccplan");return raw?JSON.parse(raw):null}catch(e){return null}};
 const validState=o=>o&&typeof o==="object"&&Array.isArray(o.i)&&o.i.length<=names.length&&o.i.every(id=>names.includes(id));
 function apply(o){
   if(!validState(o))return false;
   controls.adults.value=String(safeInt(o.a,1,6,2));
   controls.children.value=String(safeInt(o.c,0,6,0));
   controls.date.value=/^\d{4}-\d{2}-\d{2}$/.test(String(o.date||""))?String(o.date):"";
   controls.season.value=o.s==="high"?"high":"low";
   controls.days.value=String(safeInt(o.d,1,5,2));
   controls.rows.forEach(x=>{x.checked=o.i.includes(x.dataset.epChoice)});
   controls.prices.forEach(x=>{
     const v=o.p?.[x.dataset.epPrice];
     const def=defaultPrice(x.dataset.epPrice,controls.season.value);
     x.value=String(safeInt(v,1,10000,def));
   });
   controls.ess.value=String(safeInt(o.e,1,10000,649));
   controls.all.value=String(safeInt(o.al,1,10000,passes[Number(controls.days.value)]));
   doneItems=new Set(Array.isArray(o.done)?o.done.filter(x=>names.includes(x)||x==="pass_ess"||x==="pass_all"):[]);
   return true;
 }
 function resetPrices(){
   controls.prices.forEach(x=>{x.value=String(defaultPrice(x.dataset.epPrice,controls.season.value))});
 }
 function status(text){if(controls.status)controls.status.textContent=text}
 function calculate(){
   const ids=selected(),p=Object.fromEntries(ids.map(id=>[id,getPrice(id)]));
   const ok=ids.every(id=>p[id]!==null);
   const adults=Number(controls.adults.value),days=Number(controls.days.value);
   const total=ok?ids.reduce((n,id)=>n+p[id],0):null;
   const main=ids.filter(id=>master[id].kind==="main").sort((a,b)=>p[b]-p[a]);
   const extra=ids.filter(id=>master[id].kind==="extra").sort((a,b)=>p[b]-p[a]);
   const covered=main.length&&extra.length>=2?[main[0],...extra.slice(0,2)]:[];
   const essentials=ids.length>0&&ok&&covered.length===3&&safeInt(controls.ess.value,1,10000,null)!==null?Number(controls.ess.value)+ids.filter(id=>!covered.includes(id)).reduce((n,id)=>n+p[id],0):null;
   const inPass=ids.filter(id=>master[id].kind!=="outside");
   const hours=ids.reduce((n,id)=>n+master[id].hours,0)+Math.max(0,ids.length-1)*0.45;
   const feasible=hours<=days*6.25;
   const all=ids.length>0&&ok&&feasible&&safeInt(controls.all.value,1,10000,null)!==null?Number(controls.all.value)+ids.filter(id=>master[id].kind==="outside").reduce((n,id)=>n+p[id],0):null;
   const options=[{id:"single",name:"ENTRADAS SUELTAS",cost:total},{id:"ess",name:"GO CITY ESSENTIALS + EXTRAS",cost:essentials},{id:"all",name:"GO CITY ALL-INCLUSIVE + EXTRAS",cost:all}];
   const available=options.filter(x=>x.cost!==null&&Number.isFinite(x.cost));
   const best=available.sort((a,b)=>a.cost-b.cost)[0]||null;
   setHtml("ep-pl-price",total===null?"—":money(total*adults));
   setHtml("ep-pl-per",total===null?"—":money(total));
   setHtml("ep-pl-single",total===null?"—":money(total*adults));
   setHtml("ep-pl-ess-total",essentials===null?"No comparable":money(essentials*adults));
   setHtml("ep-pl-all-total",all===null?"No comparable":money(all*adults));
   mount.querySelectorAll("[data-ep-plan-option]").forEach(el=>el.setAttribute("aria-current",String(!!best&&best.id===el.dataset.epPlanOption)));
   if(!ids.length){
     setHtml("ep-pl-reco-title","ELIGE TUS VISITAS");
     setHtml("ep-pl-reco-copy","Marca solo las atracciones que realmente quieres visitar. Verás qué comprar, en qué orden y cuánto costaría para tu grupo.");
   }else if(!ok){
     setHtml("ep-pl-reco-title","REVISA LOS PRECIOS");
     setHtml("ep-pl-reco-copy","Introduce un precio positivo para cada visita seleccionada y podrás comparar. Son cifras por adulto, no disponibilidad en tiempo real.");
   }else if(best){
     setHtml("ep-pl-reco-title",best.name);
     const savings=total-best.cost;
     const text=best.id==="single"?"Con esta selección, comprar por separado parece lo más económico. No necesitas un pase para disfrutar de Estocolmo.":best.id==="ess"?"Essentials cubriría una atracción principal y otras dos elegibles; suma aparte las demás visitas. Confirma la lista oficial.":"All-Inclusive podría compensar si concentras estas visitas en los días seleccionados. Comprueba la logística y las reservas.";
     setHtml("ep-pl-reco-copy",text+(savings>0?" Ahorro simulado frente a entradas sueltas: "+money(savings*adults)+" para "+adults+" adulto"+(adults===1?"":"s")+".":""));
   }
   const hint=ids.length&&hours>days*6.25?"Atención: has seleccionado unas "+Math.ceil(hours)+" horas de visitas incluidas para "+days+" día(s) de pase. No compararemos All-Inclusive hasta que el plan sea más realista o amplíes días.":"Los tiempos de visita son orientativos; añade desplazamientos, pausas y horarios reales.";
   setHtml("ep-pl-feasibility",hint+(Number(controls.children.value)>0?" · Atención: el comparador calcula únicamente los adultos; las tarifas de menores, sus pases y gratuidades deben comprobarse por edad.":""));
   renderTasks(ids,best,covered);
   const serialized=state();
   safeStore(serialized);
   setHtml("ep-pl-saved",lastSave?"Guardado en este navegador":"Copia tu plan para conservarlo");
   return {ids,adults,days,total,best,essentials,all,p,serialized};
 }
 function renderTasks(ids,best,covered){
   const tasks=ids.map(id=>({id,...master[id]})).sort((a,b)=>({before:0,online:1,check:2,flex:3}[a.priority]-{before:0,online:1,check:2,flex:3}[b.priority]));
   const type=best?.id||"single";
   if(type==="ess"){
     tasks.unshift({id:"pass_ess",name:"Go City Essentials",kind:"pass",priority:"before",link:"https://gocity.com/en/stockholm/passes/essentials",advice:"Comprar un pase por adulto. En tu selección se usaría para: "+covered.map(id=>master[id].name).join(", ")+". Revisa la lista elegible y si exige reservas."});
   }else if(type==="all"){
     tasks.unshift({id:"pass_all",name:"Go City All-Inclusive",kind:"pass",priority:"before",link:"https://gocity.com/en/stockholm/passes/all-inclusive",advice:"Comprar un pase por adulto para "+controls.days.value+" día(s). Comprueba horario, reservas y disponibilidad de cada actividad incluida."});
   }
   controls.tasklist.textContent="";
   if(!tasks.length){const li=document.createElement("li");li.textContent="Selecciona alguna visita para crear tu lista de reservas.";controls.tasklist.append(li);return;}
   tasks.forEach(task=>{
     const li=document.createElement("li");
     const check=document.createElement("input");check.type="checkbox";check.dataset.epComplete=task.id;check.checked=doneItems.has(task.id);
     check.setAttribute("aria-label","Marcar como revisado: "+task.name);
     const desc=document.createElement("span");desc.className="ep-task-body";
     const b=document.createElement("strong");b.textContent=task.name+": ";desc.append(b);
     let advice=task.advice;
     if(task.kind!=="pass"&&type==="ess"){
       advice=(covered.includes(task.id)?"Incluida en Essentials. ":"ENTRADA INDIVIDUAL ADICIONAL. ")+task.advice;
     }else if(task.kind!=="pass"&&type==="all"){
       advice=(task.kind==="outside"?"NO INCLUIDA EN GO CITY. Compra aparte. ":"Incluida en All-Inclusive (verifica condiciones). ")+task.advice;
     }else if(task.kind!=="pass"){
       advice="ENTRADA INDIVIDUAL. "+task.advice;
     }
     desc.append(document.createTextNode(advice));
     const a=document.createElement("a");a.href=task.link;a.target="_blank";a.rel="noopener noreferrer";
     a.textContent=task.kind==="pass"?"Ver pase ↗":"Web oficial ↗";
     a.setAttribute("aria-label","Consultar "+task.name+" en su web oficial");
     li.append(check,desc,a);if(check.checked)li.classList.add("is-done");controls.tasklist.append(li);
   });
 }
 function summary(){
   const o=calculate();
   const lines=["MI PLAN DE ENTRADAS · ESTOCOLMO · VCC","Adultos: "+o.adults+" | Menores (sin calcular): "+controls.children.value+" | Días de pase: "+o.days+" | Fecha: "+(controls.date.value||"por decidir")+" | Tarifa base: "+(controls.season.value==="high"?"mayo–septiembre":"octubre–abril"),""];
   o.ids.forEach(id=>lines.push((doneItems.has(id)?"[x] ":"[ ] ")+master[id].name+": "+(o.p[id]===null?"precio por confirmar":money(o.p[id]))+" por adulto · "+master[id].link));
   lines.push("",o.total===null?"Revisa los importes":("Entradas individuales estimadas: "+money(o.total*o.adults)));
   if(o.best){
     lines.push("Opción más económica en la simulación: "+o.best.name+" (no es un presupuesto garantizado).");
     if(o.best.id==="ess")lines.push("Para Essentials: una principal + dos actividades elegibles. Comprueba inclusiones reales en https://gocity.com/en/stockholm/passes/essentials");
     else if(o.best.id==="all")lines.push("Para All-Inclusive: confirma actividades, duración consecutiva y reservas en https://gocity.com/en/stockholm/passes/all-inclusive");
   }
   lines.push("Verifica fechas, precios, inclusión y reservas en las webs oficiales.","Guía VCC: https://www.viajandoconcabeza.com/destinos/suecia/estocolmo/entradas-y-pases.html");
   return lines.join("\n");
 }
 async function copy(text,success){
   try{await navigator.clipboard.writeText(text);status(success)}catch(e){status("No se pudo copiar automáticamente. Selecciona el texto del plan y cópialo manualmente.");const box=$("ep-pl-copied-text");box.hidden=false;box.value=text;box.focus();box.select();}
 }
 controls.rows.forEach(x=>x.addEventListener("change",()=>{if(!x.checked)doneItems.delete(x.dataset.epChoice);calculate()}));
 controls.prices.forEach(x=>x.addEventListener("change",calculate));
 controls.adults.addEventListener("change",calculate);
 controls.children.addEventListener("change",calculate);
 controls.date.addEventListener("change",()=>{
   const str=controls.date.value;
   if(/^\d{4}-\d{2}-\d{2}$/.test(str)){
     const month=Number(str.slice(5,7));
     controls.season.value=month>=5&&month<=9?"high":"low";
     resetPrices();
     status("Fecha aplicada: referencias de temporada recalculadas. Comprueba siempre tu día y las posibles promociones.");
   }
   calculate();
 });
 controls.season.addEventListener("change",()=>{resetPrices();calculate();status("Precios de referencia ajustados; comprueba los de tu fecha.")});
 controls.days.addEventListener("change",()=>{controls.all.value=String(passes[Number(controls.days.value)]);calculate()});
 controls.ess.addEventListener("change",calculate);
 controls.all.addEventListener("change",calculate);
 controls.tasklist.addEventListener("change",event=>{
   const el=event.target;if(!el.matches("input[data-ep-complete]"))return;
   if(el.checked)doneItems.add(el.dataset.epComplete);else doneItems.delete(el.dataset.epComplete);
   el.closest("li").classList.toggle("is-done",el.checked);
   calculate();
 });
 mount.querySelectorAll("[data-ep-plan-preset]").forEach(btn=>btn.addEventListener("click",()=>{
   const sets={vcc:["vasa","palacio"],calma:["vasa"],intenso:["vasa","skansen","foto","barco","nobel"],familia:["skansen","vasa"]};
   const target=sets[btn.dataset.epPlanPreset]||[];
   const presetDays={vcc:3,calma:1,intenso:2,familia:2}[btn.dataset.epPlanPreset];
   if(presetDays){controls.days.value=String(presetDays);controls.all.value=String(passes[presetDays]);}
   controls.rows.forEach(r=>{r.checked=target.includes(r.dataset.epChoice)});
   doneItems.clear();calculate();
   status("Propuesta cargada. Edita la selección según lo que te apetezca visitar.");
 }));
 $("ep-pl-copy").addEventListener("click",()=>copy(summary(),"Lista copiada. Puedes guardarla en tus notas o enviarla a tus acompañantes."));
 $("ep-pl-share").addEventListener("click",()=>{
   const o=calculate().serialized;
   const url=new URL(window.location.href);url.searchParams.set("vccplan",JSON.stringify(o));
   copy(url.toString(),"Enlace copiado. Al abrirlo, se recuperará este plan.");
 });
 $("ep-pl-reset").addEventListener("click",()=>{
   controls.adults.value="2";controls.children.value="0";controls.date.value="";controls.season.value="low";controls.days.value="2";controls.ess.value="649";controls.all.value="1349";
   controls.rows.forEach(x=>{x.checked=["vasa","palacio"].includes(x.dataset.epChoice)});
   doneItems.clear();resetPrices();
   try{window.localStorage.removeItem(key)}catch(e){}
   calculate();status("Plan restablecido. Los precios son orientativos.");
 });

 function downloadPlan(){
   const lines=summary();
   try{
     const blob=new Blob([lines],{type:"text/plain;charset=utf-8"});
     const link=URL.createObjectURL(blob);
     const a=document.createElement("a");
     a.href=link;a.download="vcc-estocolmo-mi-plan-de-entradas.txt";
     document.body.appendChild(a);a.click();a.remove();
     window.setTimeout(()=>URL.revokeObjectURL(link),1500);
     status("Lista personalizada descargada. Comprueba los precios oficiales.");
     return true;
   }catch(e){status("No se ha podido descargar en este navegador. Usa «COPIAR MI LISTA».");return false;}
 }
 $("ep-pl-download").addEventListener("click",downloadPlan);
 window.VCCEntradasPlanner={download:downloadPlan,summary};

 const restored=apply(readLink())||apply(readStore());
 if(!restored)resetPrices();
 calculate();
 if(restored)status("Tu plan anterior está recuperado y puedes seguir editándolo.");
})();
