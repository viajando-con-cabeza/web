/* VCC · Qué llevar Estocolmo · guía por mes, duración y lavado
 * Medias climatológicas WMO/SMHI 1991–2020: no son una previsión.
 * Cada cambio de días/lavado conserva las prendas marcadas del mes. */
(function(){
"use strict";
const root=document.querySelector(".ql-page");
if(!root||!document.getElementById("ql-v6-month"))return;
const $=id=>document.getElementById(id);
const monthData=[
 {name:"enero",season:"invierno",lo:-2.9,hi:1.0,focus:"Frío, posibles heladas y viento. Prioriza abrigo resistente al viento, capa térmica y botas con buen agarre.",skip:"No necesitas pantalones de esquí para visitar museos y pasear por la ciudad."},
 {name:"febrero",season:"invierno",lo:-3.2,hi:1.2,focus:"El mes más frío de media. Abrigo cálido, guantes, gorro y calzado impermeable con agarre son prioritarios.",skip:"Evita llenar la maleta de jerséis gruesos: combina capas y repite las prendas exteriores."},
 {name:"marzo",season:"invierno",lo:-1.1,hi:4.7,focus:"Marzo sigue siendo frío, especialmente por la mañana. Lleva ropa térmica ligera, abrigo y calzado resistente al agua.",skip:"No confíes solo en una chaqueta fina aunque ya sea primavera en el calendario."},
 {name:"abril",season:"primavera",lo:2.6,hi:10.7,focus:"Mañanas frescas y tardes variables. Lo más útil es una chaqueta impermeable y capas fáciles de quitar.",skip:"No hace falta llevar cuatro abrigos: uno versátil y una capa intermedia suelen rendir más."},
 {name:"mayo",season:"primavera",lo:7.1,hi:16.5,focus:"Días más suaves, aunque las mañanas y el archipiélago pueden ser frescos. Combina camisetas con sudadera y cortavientos.",skip:"Deja en casa la ropa de nieve salvo que hayas previsto actividades específicas."},
 {name:"junio",season:"verano",lo:11.6,hi:20.8,focus:"Días largos, ropa ligera y una capa extra para la noche o el ferry. Calzado cómodo y gafas de sol son útiles.",skip:"No llenes la maleta de ropa pesada: normalmente basta un jersey fino."},
 {name:"julio",season:"verano",lo:14.8,hi:23.6,focus:"Suele ser uno de los meses más cálidos. Lleva prendas transpirables, bañador si visitarás las islas y un impermeable ligero.",skip:"No asumas sol todos los días: una chaqueta plegable sigue siendo práctica."},
 {name:"agosto",season:"verano",lo:14.2,hi:22.1,focus:"Todavía es verano, pero las lluvias son habituales. Combina ropa ligera, zapatillas cómodas y protección frente al agua.",skip:"Un paraguas grande ocupa más que un impermeable ligero y compacto."},
 {name:"septiembre",season:"otono",lo:10.2,hi:16.6,focus:"Puede hacer buen tiempo durante el día y refrescar al anochecer. Lleva una capa de abrigo y calzado cómodo.",skip:"Evita preparar una maleta plenamente invernal si tu viaje es a principios de mes."},
 {name:"octubre",season:"otono",lo:5.5,hi:10.1,focus:"El aire suele ser fresco y puede llover. Prioriza chaqueta impermeable, jersey y calzado resistente al agua.",skip:"El calzado de tela y una sola capa de ropa son poco versátiles en esta época."},
 {name:"noviembre",season:"otono",lo:1.9,hi:5.4,focus:"Ya conviene preparar una maleta casi invernal: abrigo cálido, guantes finos y capas para interiores calefactados.",skip:"No necesitas llevar un jersey distinto para cada día: el abrigo y la capa base importan más."},
 {name:"diciembre",season:"invierno",lo:-1.2,hi:2.5,focus:"Pocas horas de luz y frío húmedo. Lleva abrigo, gorro, guantes y calzado que agarre bien si hay hielo.",skip:"Evita ropa demasiado voluminosa para interiores: poder quitarte capas es clave."}
];
// WMO / SMHI, Stockholm, 1991–2020; >= 0.1 mm/day, rain or snow.
const monthlyPrecipitationDays=[15.9,14,12.9,10.7,10.8,12.9,12.4,13.2,12,15,17,18.2];
const seasonNames={invierno:"invierno",primavera:"primavera",verano:"verano",otono:"otoño"};
const byId=id=>monthData[Number(id)]||monthData[1];
let state={month:1,days:5,laundry:false,done:new Set()};
const storeKey="vcc-stockholm-packing-v6";
function load(){
 try{
  const o=JSON.parse(localStorage.getItem(storeKey)||"{}");
  if(Number.isInteger(o.month)&&o.month>=0&&o.month<12)state.month=o.month;
  if(Number.isInteger(o.days)&&o.days>=1&&o.days<=30)state.days=o.days;
  if(typeof o.laundry==="boolean")state.laundry=o.laundry;
  if(Array.isArray(o.done))state.done=new Set(o.done.filter(x=>typeof x==="string").slice(0,350));
 }catch(e){}
}
function save(){try{localStorage.setItem(storeKey,JSON.stringify({month:state.month,days:state.days,laundry:state.laundry,done:[...state.done]}));}catch(e){}}
function item(id,title,icon,qty,category){return {id,title,icon,qty,category};}
function baseDays(){return Math.max(1,Math.min(state.days,state.laundry?5:10));}
function quantities(){
 const d=baseDays();
 return {tops:Math.max(2,Math.ceil(d*.75)),pants:Math.max(1,Math.ceil(d/3.5)),underwear:d+1,socks:d,mid:Math.min(3,Math.max(1,Math.ceil(d/4)))};
}
function buildItems(){
 const m=byId(state.month),q=quantities(),cold=["enero","febrero","diciembre"].includes(m.name);
 const chilly=["marzo","noviembre"].includes(m.name),medium=["abril","octubre"].includes(m.name);
 const summer=m.season==="verano";
 const clothing=[],shoes=[],accessories=[],extras=[];
 const add=(target,id,title,icon,qty=1,category="")=>target.push(item(id,title,icon,qty,category));
 if(cold||chilly){
  add(clothing,"thermal","Camisetas térmicas","shirt",Math.max(2,Math.ceil(q.tops*.75)));
  add(clothing,"jumper","Jersey de abrigo","sweater",q.mid);
  add(clothing,"outer","Abrigo cálido y resistente al viento","coat",1);
 } else if(medium){
  add(clothing,"tops","Camisetas de manga larga","shirt",q.tops);
  add(clothing,"jumper","Jersey o sudadera","sweater",q.mid);
  add(clothing,"outer","Chaqueta impermeable","coat",1);
 } else if(summer){
  add(clothing,"tops","Camisetas ligeras","shirt",q.tops);
  add(clothing,"jumper","Sudadera o jersey fino","sweater",1);
  add(clothing,"outer","Chubasquero o cortavientos plegable","coat",1);
 } else {
  add(clothing,"tops","Camisetas combinables","shirt",q.tops);
  add(clothing,"jumper","Sudadera o jersey","sweater",q.mid);
  add(clothing,"outer","Chaqueta ligera impermeable","coat",1);
 }
 add(clothing,"pants",summer?"Pantalones o faldas":"Pantalones largos","pants",q.pants);
 add(clothing,"underwear","Ropa interior","underwear",q.underwear);
 add(clothing,"sleepwear","Pijama","layer",1);
 add(shoes,"footwear",cold||chilly?"Botas impermeables con buen agarre":medium?"Calzado resistente al agua":"Zapatillas cómodas para caminar",cold||chilly?"shoe":"sneaker",1);
 add(shoes,"socks",cold||chilly?"Calcetines cálidos":"Calcetines","socks",q.socks);
 if(cold||chilly){add(accessories,"hat","Gorro","hat");add(accessories,"gloves","Guantes","gloves");add(accessories,"scarf","Bufanda","scarf");}
 else if(m.name==="octubre"){add(accessories,"scarf","Bufanda ligera","scarf");add(accessories,"umbrella","Paraguas compacto","umbrella");}
 else if(m.name==="abril"){add(accessories,"umbrella","Paraguas compacto","umbrella");add(accessories,"scarf","Pañuelo fino","scarf");}
 else if(m.name==="mayo"||summer||m.name==="septiembre"){add(accessories,"glasses","Gafas de sol","glasses");if(m.name==="agosto")add(accessories,"umbrella","Paraguas compacto","umbrella");}
 add(accessories,"daybag","Mochila de día","bag",1);
 add(extras,"bottle","Botella reutilizable","bottle",1);
 add(extras,"charger","Cargador del móvil","charger",1);
 add(extras,"battery","Batería externa","battery",1);
 add(extras,"toiletries","Neceser de viaje","toiletry",1);
 add(extras,"documents","Documentación y reservas","passport",1);
 add(extras,"meds","Medicamentos personales, si procede","meds",1);
 if(summer||m.name==="mayo"||m.name==="septiembre")add(extras,"sunscreen","Protección solar","suncream",1);
 if(summer)add(extras,"swimwear","Bañador si irás al archipiélago","swimsuit",1);
 if(cold||chilly)add(extras,"lip","Bálsamo labial y crema de manos","toiletry",1);
 return [{label:"ROPA",items:clothing},{label:"CALZADO",items:shoes},{label:"ACCESORIOS",items:accessories},{label:"EXTRAS",items:extras}];
}
const sprite="/configuracion/imagenes/iconos/equipaje-vcc-sprite.svg";
function icon(name){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 64 64");svg.classList.add("ql-v6-item-icon");svg.setAttribute("aria-hidden","true");
 const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href",sprite+"#"+name);
 svg.append(use);return svg;
}
function labelKey(id){return String(state.month)+":"+id;}

/* Recomendación orientativa de equipaje, sin asumir que las franquicias son iguales. */
const bagOptions={
 personal:{title:"Bolso o mochila de mano",location:"Debajo del asiento"},
 cabin:{title:"Maleta de cabina",location:"Compartimento superior"},
 checked:{title:"Maleta facturada",location:"Bodega del avión"}
};
function recommendedBag(){
 const m=byId(state.month);
 const cold=["enero","febrero","marzo","noviembre","diciembre"].includes(m.name);
 const cabinMax=(cold?5:8)+(state.laundry?(cold?4:6):0);
 const personalMax=cold?1:2;
 const type=state.days<=personalMax?"personal":state.days<=cabinMax?"cabin":"checked";
 const name=bagOptions[type].title;
 const why=type==="personal"?
   "Para una escapada muy corta, podrías viajar solo con un bolso o mochila bajo el asiento, si repites prendas y llevas puesta la ropa más voluminosa.":
  type==="cabin"?
   "Para "+state.days+" días, la maleta de cabina suele ofrecer el mejor equilibrio entre comodidad, espacio y evitar facturar"+(cold?". Las capas de abrigo ocupan más.":"."):
   "Con "+state.days+" días"+(cold?" y ropa de abrigo":"")+" es probable que necesites más espacio. Considera facturar, sobre todo si llevas zapatos extra o no quieres repetir prendas.";
 return {type,name,why,cold};
}
function updateBagAdvice(){
 const choice=recommendedBag();
 $("ql-v7-bag-result-name").textContent=choice.name;
 $("ql-v7-bag-result-reason").textContent=choice.why;
 $("ql-v7-bag-result-context").textContent=state.days+" "+(state.days===1?"día":"días")+" · "+byId(state.month).name+(state.laundry?" · con lavado":"");
 document.querySelectorAll(".ql-v7-bag-card").forEach(card=>{
   const selected=card.dataset.bag===choice.type;
   card.classList.toggle("is-recommended",selected);
   const badge=card.querySelector(".ql-v7-bag-badge");
   if(badge)badge.hidden=!selected;
 });
}
function render(resetListScroll=false){
 const m=byId(state.month);const groups=buildItems();
 updateBagAdvice();
 $("ql-v6-month").value=String(state.month);
 $("ql-v6-days").value=String(state.days);
 $("ql-v6-laundry").checked=state.laundry;
 $("ql-v6-month-label").textContent=m.name.charAt(0).toUpperCase()+m.name.slice(1);
 const wetDays=Math.round(monthlyPrecipitationDays[state.month]);
 $("ql-v7-rain-days").textContent="☔ "+m.name.charAt(0).toUpperCase()+m.name.slice(1)+": ≈"+wetDays+" días con lluvia o nieve/mes";

 $("ql-v6-month-season").textContent="Estación: "+seasonNames[m.season];
 $("ql-v6-temperature").textContent=m.lo.toLocaleString("es-ES")+"° / "+m.hi.toLocaleString("es-ES")+"°";
 $("ql-v6-focus").textContent=m.focus;
 $("ql-v6-avoid").textContent=m.skip;
 $("ql-v6-summary-title").textContent="Tu lista para "+m.name+" · "+state.days+(state.days===1?" día":" días");
 $("ql-v6-caveat").textContent=state.days>10&&!state.laundry?
  "Para viajes de más de 10 días, esta lista limita las mudas a 10 días: te recomendamos planificar una colada para evitar llevar "+state.days+" cambios.":
  state.laundry&&state.days>5?"Calculamos ropa para hasta cinco días, contando con que podrás lavar durante el viaje.":"Cantidades orientativas; adapta tu lista a la previsión y a tu forma de viajar.";
 const categories=$("ql-v6-categories");
 const previousScroll=resetListScroll?0:categories.scrollTop;
 categories.replaceChildren();
 const cols=[document.createElement("div"),document.createElement("div")];
 cols.forEach(col=>{col.className="ql-v6-column";categories.append(col)});
 let completed=0,total=0;
 groups.forEach((group,index)=>{
  const card=document.createElement("section");card.className="ql-v6-category";
  const h=document.createElement("h4");h.textContent=group.label;card.append(h);
  const ul=document.createElement("ul");
  group.items.forEach(x=>{
   const li=document.createElement("li");const label=document.createElement("label");
   const input=document.createElement("input");input.type="checkbox";input.dataset.packId=x.id;input.checked=state.done.has(labelKey(x.id));
   const content=document.createElement("span");content.className="ql-v6-item-content";
   const name=document.createElement("span");name.textContent=x.title;
   const qty=document.createElement("small");qty.className="ql-v6-qty";qty.textContent=x.qty+(x.qty===1?" ud.":" uds.");
   content.append(name,qty);label.append(input,icon(x.icon),content);li.append(label);ul.append(li);
   total++;if(input.checked)completed++;
  });
  card.append(ul);cols[index%2].append(card);
 });
 $("ql-v6-progress").textContent=completed+" de "+total+" preparados";
 $("ql-v6-progress-bar").style.width=(total?100*completed/total:0).toFixed(1)+"%";
 $("ql-v6-print-meta").textContent="Estocolmo · "+m.name+" · "+state.days+" días"+(state.laundry?" · con lavado":"");
 categories.scrollTop=previousScroll;
 requestPanelLayout();
}
function copiedText(){
 const m=byId(state.month);
 const lines=["QUÉ LLEVAR A ESTOCOLMO","Mes: "+m.name+" | Días: "+state.days+" | Lavado: "+(state.laundry?"Sí":"No"),"Maleta recomendada: "+recommendedBag().name,""];
 buildItems().forEach(group=>{
  lines.push(group.label);
  group.items.forEach(x=>lines.push((state.done.has(labelKey(x.id))?"[x] ":"[ ] ")+x.title+" · "+x.qty+(x.qty===1?" unidad":" unidades")));
  lines.push("");
 });
 lines.push("Consulta la previsión meteorológica antes de viajar. Guía orientativa VCC.");
 return lines.join("\n");
}
function notify(text){
 const status=$("ql-v6-action-status");status.textContent=text;
}

/* Igualar la altura real de ambas tarjetas sin ocultar ningún elemento
   de Personaliza tu lista. El panel de la derecha usa scroll interior. */
function syncPanelHeights(){
 updateScrollArrows();
}
function updateScrollArrows(){
 const list=$("ql-v6-categories"),up=$("ql-v6-scroll-up"),down=$("ql-v6-scroll-down");
 if(!list||!up||!down)return;
 const remaining=Math.max(0,list.scrollHeight-list.clientHeight);
 up.disabled=list.scrollTop<=2;
 down.disabled=remaining<=2||list.scrollTop>=remaining-2;
}
function requestPanelLayout(){
 requestAnimationFrame(()=>{syncPanelHeights();updateScrollArrows()});
}
load();render();
const scrollList=$("ql-v6-categories");
scrollList.addEventListener("scroll",updateScrollArrows,{passive:true});
$("ql-v6-scroll-up").addEventListener("click",()=>{
 const amount=Math.max(115,Math.round(scrollList.clientHeight*.7));
 scrollList.scrollBy({top:-amount,behavior:"smooth"});
});
$("ql-v6-scroll-down").addEventListener("click",()=>{
 const amount=Math.max(115,Math.round(scrollList.clientHeight*.7));
 scrollList.scrollBy({top:amount,behavior:"smooth"});
});
if(typeof ResizeObserver!=="undefined"){
 const ro=new ResizeObserver(()=>requestPanelLayout());
 ro.observe(root.querySelector(".ql-v6-list"));
}
window.addEventListener("resize",requestPanelLayout,{passive:true});
window.addEventListener("load",requestPanelLayout,{once:true});
requestPanelLayout();
$("ql-v6-month").addEventListener("change",e=>{state.month=Number(e.target.value);save();render(true)});
$("ql-v6-days").addEventListener("change",e=>{state.days=Number(e.target.value);save();render()});
$("ql-v6-laundry").addEventListener("change",e=>{state.laundry=!!e.target.checked;save();render()});
$("ql-v6-categories").addEventListener("change",e=>{
 const input=e.target;if(!input.matches('input[type="checkbox"][data-pack-id]'))return;
 input.checked?state.done.add(labelKey(input.dataset.packId)):state.done.delete(labelKey(input.dataset.packId));
 save();render();
});
$("ql-v6-clear").addEventListener("click",()=>{
 for(const x of buildItems().flatMap(g=>g.items))state.done.delete(labelKey(x.id));
 save();render();notify("Elementos desmarcados");
});
$("ql-v6-copy").addEventListener("click",async()=>{
 const contents=copiedText();
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(contents);
  else{
   const field=document.createElement("textarea");field.value=contents;document.body.append(field);field.select();
   if(!document.execCommand("copy"))throw Error("Copy not supported");field.remove();
  }
  notify("Lista copiada");
 }catch(e){notify("No se pudo copiar. Puedes imprimir la lista.");}
});
$("ql-v6-print").addEventListener("click",()=>window.print());
const nav=document.querySelector(".ql-subnav");
if(nav){
 const links=[...nav.querySelectorAll('a[href^="#"]')];
 const update=()=>{
  const header=document.querySelector(".shared-header");
  const headerH=header?Math.round(header.getBoundingClientRect().height):50;
  root.style.setProperty("--ql-sticky-header-height",headerH+"px");
  let active=links[0];
  links.forEach(a=>{const node=document.getElementById(a.hash.slice(1));if(node&&node.getBoundingClientRect().top<=headerH+100)active=a});
  links.forEach(a=>{a.classList.toggle("is-active",a===active);if(a===active)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current");});
 };
 window.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update,{passive:true});update();
}
const track=$("ql-advice-track"),prev=$("ql-advice-prev"),next=$("ql-advice-next");
if(track&&prev&&next){
 const refresh=()=>{prev.disabled=track.scrollLeft<=3;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-3;};
 const slide=direction=>{const card=track.querySelector(".ql-advice-card");const gap=parseFloat(getComputedStyle(track).gap)||14;track.scrollBy({left:direction*((card?.getBoundingClientRect().width||300)+gap),behavior:"smooth"});};
 prev.addEventListener("click",()=>slide(-1));next.addEventListener("click",()=>slide(1));
 track.addEventListener("scroll",refresh,{passive:true});window.addEventListener("resize",refresh,{passive:true});refresh();
}
})();