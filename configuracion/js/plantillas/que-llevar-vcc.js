
/* Plantilla reutilizable: adaptar el objeto de destino y los textos estacionales. */
(function(){
"use strict";
const root=document.querySelector(".ql-page");if(!root)return;
const seasons={
primavera:{name:"primavera",months:"marzo a mayo",icon:"🌷",intro:"Entre mañanas frescas y tardes suaves, lleva capas ligeras y protección para la lluvia.",
note:"Una chaqueta impermeable te ahorrará mucho espacio.",items:[
["ROPA","🧥",[["Camisetas cómodas","tops",1],["Jersey o sudadera ligera","fixed",1],["Chaqueta de entretiempo","fixed",1],["Pantalones largos","trousers",1]]],
["CALZADO","👟",[["Zapatillas cómodas","fixed",1],["Calcetines","socks",1]]],
["ACCESORIOS","🧣",[["Pañuelo ligero","fixed",1],["Gafas de sol","fixed",1],["Paraguas compacto","fixed",1]]],
["EXTRAS","✚",[["Crema solar","fixed",1],["Batería externa","fixed",1],["Documentación válida","fixed",1]]]
],visual:[["🧥","Chaqueta ligera"],["👕","Camisetas"],["👖","Pantalón largo"],["👟","Zapatillas"],["☂️","Paraguas"],["🧣","Pañuelo"]]},
verano:{name:"verano",months:"junio a agosto",icon:"☀️",intro:"Días largos y temperaturas generalmente agradables. No olvides una capa ligera para la tarde.",
note:"Aunque sea verano, lleva una capa para el viento.",items:[
["ROPA","👕",[["Camisetas transpirables","tops",1],["Pantalón o falda","trousers",1],["Sudadera o jersey fino","fixed",1],["Chubasquero ligero","fixed",1]]],
["CALZADO","👟",[["Zapatillas de caminar","fixed",1],["Calcetines","socks",1]]],
["ACCESORIOS","🕶️",[["Gafas de sol","fixed",1],["Gorra","fixed",1],["Bañador (opcional)","fixed",1]]],
["EXTRAS","✚",[["Protector solar","fixed",1],["Batería externa","fixed",1],["Documentación válida","fixed",1]]]
],visual:[["👕","Camisetas"],["🧥","Capa ligera"],["👟","Zapatillas"],["🕶️","Gafas de sol"],["🧢","Gorra"],["☂️","Impermeable"]]},
otono:{name:"otoño",months:"septiembre a noviembre",icon:"🍂",intro:"El frío gana terreno y el tiempo cambia rápido. Combina un jersey cálido con impermeable.",
note:"Prioriza tejidos que sequen rápido y viste por capas.",items:[
["ROPA","🧥",[["Camisetas de manga larga","tops",1],["Jersey de abrigo","fixed",2],["Abrigo o chaqueta impermeable","fixed",1],["Pantalones largos","trousers",1]]],
["CALZADO","🥾",[["Calzado resistente al agua","fixed",1],["Calcetines","socks",1]]],
["ACCESORIOS","🧣",[["Bufanda","fixed",1],["Gorro fino","fixed",1],["Paraguas compacto","fixed",1]]],
["EXTRAS","✚",[["Bálsamo labial","fixed",1],["Batería externa","fixed",1],["Documentación válida","fixed",1]]]
],visual:[["🧥","Abrigo"],["🧶","Jersey"],["🥾","Botines"],["🧣","Bufanda"],["☂️","Impermeable"],["🎒","Mochila"]]},
invierno:{name:"invierno",months:"diciembre a febrero",icon:"❄️",intro:"Capas térmicas, abrigo impermeable y calzado con buen agarre para el frío y la humedad.",
note:"No olvides vestirte por capas.",items:[
["ROPA","🧥",[["Camisetas térmicas","tops",1],["Jersey de lana","fixed",2],["Abrigo cálido e impermeable","fixed",1],["Pantalones largos","trousers",1]]],
["CALZADO","🥾",[["Botas impermeables con agarre","fixed",1],["Calcetines térmicos","socks",1]]],
["ACCESORIOS","🧤",[["Gorro de abrigo","fixed",1],["Guantes cálidos","fixed",1],["Bufanda","fixed",1]]],
["EXTRAS","✚",[["Batería externa","fixed",1],["Crema de manos y bálsamo","fixed",1],["Documentación válida","fixed",1]]]
],visual:[["🧥","Abrigo impermeable"],["🧶","Jersey de lana"],["🧢","Gorro"],["🧤","Guantes"],["🥾","Botas"],["🎒","Mochila"]]}
};
const el=id=>document.getElementById(id);
const state={season:"invierno",days:3,luggage:"cabina",done:new Set()};
function amount(kind,mult){
 if(kind==="fixed")return mult;
 if(kind==="tops")return Math.max(2,Math.min(state.days,10));
 if(kind==="trousers")return state.days<=4?1:state.days<=7?2:3;
 if(kind==="socks")return state.days;
 return mult;
}
function key(category,title){return state.season+"|"+state.days+"|"+state.luggage+"|"+category+"|"+title}
function render(){
 const s=seasons[state.season];
 document.querySelectorAll(".ql-season").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.season===state.season)));
 el("ql-season-title").textContent="Tu lista para el "+s.name;
 el("ql-intro").textContent=s.intro;
 el("ql-visual-title").textContent="La maleta VCC · "+s.name.toUpperCase();
 el("ql-note").textContent=s.note;
 el("ql-dates").textContent=s.months;
 const cats=el("ql-categories");cats.replaceChildren();
 let total=0,completed=0;
 s.items.forEach(c=>{
  const article=document.createElement("article");article.className="ql-category";
  const h=document.createElement("h3"),ic=document.createElement("span");ic.textContent=c[1];ic.setAttribute("aria-hidden","true");h.append(ic,document.createTextNode(c[0]));article.append(h);
  const ul=document.createElement("ul");
  c[2].forEach(item=>{
   const li=document.createElement("li"),label=document.createElement("label"),input=document.createElement("input"),span=document.createElement("span");
   input.type="checkbox";const id=key(c[0],item[0]);input.checked=state.done.has(id);input.dataset.item=id;
   const n=amount(item[1],item[2]);span.textContent=item[0];
   if(n>1){const quantity=document.createElement("small");quantity.className="ql-amount";quantity.textContent=" · "+n+" uds.";span.append(quantity)}
   label.append(input,span);li.append(label);ul.append(li);total++;if(input.checked)completed++;
  });
  article.append(ul);cats.append(article);
 });
 el("ql-progress").textContent=completed+" de "+total+" preparados";
 const flatlay=el("ql-flatlay");flatlay.replaceChildren();
 s.visual.forEach(p=>{const obj=document.createElement("div");obj.className="ql-object";const icon=document.createElement("span"),name=document.createElement("span");icon.className="ql-object-icon";icon.setAttribute("aria-hidden","true");icon.textContent=p[0];name.className="ql-object-name";name.textContent=p[1];obj.append(icon,name);flatlay.append(obj)});
 el("ql-tip-luggage").textContent=state.luggage==="cabina"?"Prioriza prendas versátiles si viajas solo con equipaje de mano.":"Aprovecha el espacio extra sin cargar ropa innecesaria.";
}
function currentList(){
 const s=seasons[state.season];const lines=["QUÉ LLEVAR A ESTOCOLMO","Estación: "+s.name+" · "+state.days+" días · "+(state.luggage==="cabina"?"equipaje de mano":"equipaje facturado"),""];
 s.items.forEach(c=>{lines.push(c[0]+":");c[2].forEach(item=>lines.push((state.done.has(key(c[0],item[0]))?"[x] ":"[ ] ")+item[0]+(amount(item[1],item[2])>1?" ("+amount(item[1],item[2])+" unidades)":"")));lines.push("")});
 return lines.join("\n");
}
function restore(){
 try{const o=JSON.parse(localStorage.getItem("vcc-packing-stockholm-v1")||"{}");if(seasons[o.season])state.season=o.season;if([3,5,7,10].includes(o.days))state.days=o.days;if(["cabina","facturado"].includes(o.luggage))state.luggage=o.luggage;if(Array.isArray(o.done))state.done=new Set(o.done.filter(x=>typeof x==="string").slice(0,120))}catch(e){}
}
function persist(){try{localStorage.setItem("vcc-packing-stockholm-v1",JSON.stringify({season:state.season,days:state.days,luggage:state.luggage,done:[...state.done]}))}catch(e){}}
restore();
el("ql-days").value=state.days;el("ql-luggage").value=state.luggage;render();
document.querySelectorAll(".ql-season").forEach(b=>b.addEventListener("click",()=>{state.season=b.dataset.season;persist();render()}));
el("ql-days").addEventListener("change",e=>{state.days=Number(e.target.value);persist();render()});
el("ql-luggage").addEventListener("change",e=>{state.luggage=e.target.value;persist();render()});
el("ql-categories").addEventListener("change",e=>{const input=e.target;if(input.matches('input[type="checkbox"][data-item]')){input.checked?state.done.add(input.dataset.item):state.done.delete(input.dataset.item);persist();render()}});
el("ql-reset").addEventListener("click",()=>{const prefix=state.season+"|"+state.days+"|"+state.luggage+"|";state.done.forEach(x=>{if(x.startsWith(prefix))state.done.delete(x)});persist();render()});
el("ql-copy").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(currentList());el("ql-copy").textContent="✓ LISTA COPIADA";setTimeout(()=>el("ql-copy").textContent="COPIAR LISTA",1700)}
 catch(e){const textarea=document.createElement("textarea");textarea.value=currentList();document.body.append(textarea);textarea.select();try{document.execCommand("copy");el("ql-copy").textContent="✓ LISTA COPIADA"}catch(_) {el("ql-copy").textContent="NO SE PUDO COPIAR"}textarea.remove();setTimeout(()=>el("ql-copy").textContent="COPIAR LISTA",1700)}
});
})();
