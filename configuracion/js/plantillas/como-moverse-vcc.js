/* VCC · Selector de zonas y comparación de transportes · configurable para otras ciudades/regiones. */
(function(){
"use strict";
const modes=[
 {id:"walk",name:"A pie",symbol:"🚶",cost:"GRATIS"},
 {id:"bike",name:"Bicicleta",symbol:"🚲",cost:"ALQUILER · precio variable"},
 {id:"metro",name:"Metro (T-bana)",symbol:"🚇",cost:"43 SEK · billete SL 75 min"},
 {id:"bus",name:"Autobús",symbol:"🚌",cost:"43 SEK · billete SL 75 min"},
 {id:"tram",name:"Tranvía",symbol:"🚊",cost:"43 SEK · billete SL 75 min"},
 {id:"ferry",name:"Ferry",symbol:"⛴️",cost:"SL 43 SEK / otros variable"},
 {id:"car",name:"Coche",symbol:"🚗",cost:"PARKING + combustible"}
];
const areas=[
{id:"gamla",name:"Gamla Stan",sub:"Casco antiguo",summary:"Calles empedradas, plazas con encanto y el corazón histórico de la ciudad.",reach:"Si tu alojamiento está cerca, ve caminando. Desde zonas más alejadas, usa el metro hasta Gamla stan o un autobús cercano y termina andando.",car:"No recomendamos entrar con el coche en el casco antiguo. Comprueba un aparcamiento autorizado fuera de las calles peatonales y continúa a pie.",tip:"Aquí ahorrar es fácil: una vez en Gamla Stan, no pagues más desplazamientos. Sus callejuelas se disfrutan caminando.",best:["walk"],methods:{
walk:{yes:["La mejor forma de descubrir cada calle y plaza.","Gratis y sin depender de horarios."],no:"Desde hoteles lejanos conviene combinarlo con metro o bus."},
bike:{yes:["Útil para acercarte desde otros barrios.","Alquiler flexible para combinar varias zonas."],no:"Calles estrechas y adoquines: mejor aparcarla y seguir a pie."},
metro:{yes:["La estación Gamla stan deja cerca del casco antiguo.","Rápido para llegar desde barrios más alejados."],no:"Una vez dentro de la zona apenas lo necesitarás."},
bus:{yes:["Alternativa al metro según la ubicación del hotel.","El billete SL permite combinar transbordos durante su validez."],no:"El tráfico y las paradas pueden hacerlo menos directo."},
tram:{yes:["Puede ayudarte en otro tramo de tu ruta urbana.","Se integra con los billetes habituales de SL."],no:"No es el transporte principal para entrar en Gamla Stan."},
ferry:{yes:["Ofrece vistas del agua y conexiones cercanas.","Puede encajar en una ruta combinada por las islas."],no:"No lo necesitas para recorrer el casco antiguo."},
car:{yes:["Puede servir si llegas de una ruta por carretera.","Da flexibilidad para continuar hacia otras zonas."],no:"Aparcar en el centro suele ser caro y poco práctico."}
}},
{id:"djurgarden",name:"Djurgården y museos",sub:"Museos y parques",summary:"Vasa, Skansen, ABBA The Museum, paseos verdes y el entorno de la isla.",reach:"Desde el centro, el tranvía 7 es especialmente práctico. Otra alternativa agradable es el ferry SL 82 desde Slussen; el autobús 67 también conecta con la zona.",car:"Aparcar puede ser limitado y de pago. Para un día de museos preferimos el tranvía o el ferry y después caminar.",tip:"Agrupa los museos y jardines cercanos en el mismo día. Ahorrarás desplazamientos y aprovecharás mucho más el tiempo.",best:["tram","walk"],methods:{
walk:{yes:["Ideal para conectar museos y paseos dentro de la isla.","Es gratis y permite parar donde quieras."],no:"Desde el centro el acceso andando puede ser largo."},
bike:{yes:["Rutas agradables para recorrer zonas verdes.","Buena opción con buen tiempo."],no:"Debes dejarla aparcada para entrar en los museos."},
metro:{yes:["Útil para acercarte desde barrios alejados.","Permite combinar con autobús o tranvía."],no:"No hay una estación de metro en los museos principales."},
bus:{yes:["La línea 67 sirve varios puntos de Djurgården.","Práctico cuando el hotel conecta mejor con autobús."],no:"Según la ruta puede requerir más tiempo o transbordos."},
tram:{yes:["La línea 7 pasa por varios museos principales.","Cómodo para llegar desde el centro sin coche."],no:"Puede ir lleno en temporada alta."},
ferry:{yes:["El SL 82 comunica Slussen con Djurgården.","Trayecto agradable con vistas y tarifa SL."],no:"Debes revisar los horarios y el embarcadero."},
car:{yes:["Útil si llevas equipaje o vas de paso.","Independencia para continuar fuera de la ciudad."],no:"Aparcamiento limitado y poco competitivo frente a SL."}
}},
{id:"archipielago",name:"Archipiélago",sub:"Islas y excursiones",summary:"Islas, pequeños puertos y escapadas que dependen de cuál elijas visitar.",reach:"Primero elige la isla: algunas requieren barco, otras admiten autobús o carretera. Los ferris SL y algunos servicios Waxholmsbolaget cubren rutas distintas.",car:"El coche puede servir para islas conectadas por carretera, pero no llega a muchas de las islas más interesantes. Revisa el destino antes de alquilar.",tip:"No compres un barco turístico sin comprobar antes si existe una ruta pública válida con tu billete SL. Atención: no todos los barcos tienen la misma tarifa.",best:["ferry","walk"],methods:{
walk:{yes:["Perfecto para explorar las islas después de desembarcar.","Sin coste adicional y a tu ritmo."],no:"Para llegar a muchas islas necesitarás barco."},
bike:{yes:["Buena opción para islas con rutas ciclables.","Permite cubrir más terreno que caminando."],no:"No todos los barcos aceptan bicicletas o tienen espacio."},
metro:{yes:["Te acerca a estaciones con conexión a muelles.","Útil como primer tramo desde tu alojamiento."],no:"El metro no conecta directamente con las islas exteriores."},
bus:{yes:["Algunas excursiones se alcanzan por carretera.","Puede complementar trayectos de barco o metro."],no:"No sirve para todas las islas y algunas frecuencias son bajas."},
tram:{yes:["En la ciudad puede ayudarte a conectar transportes.","Se combina con el billete SL habitual."],no:"No es el transporte para llegar al archipiélago."},
ferry:{yes:["Es el medio clave para visitar muchas islas.","Hay servicios públicos que pueden ahorrar frente a excursiones."],no:"Hay operadores y trayectos fuera de la tarifa SL."},
car:{yes:["Útil para zonas del archipiélago conectadas por puente.","Da flexibilidad si visitas varias áreas terrestres."],no:"No llega a muchas islas y añade combustible o aparcamiento."}
}},
{id:"city",name:"City / Norrmalm",sub:"Centro y compras",summary:"La zona comercial, plazas del centro y excelentes conexiones de transporte.",reach:"Si duermes en el centro, caminar suele ser suficiente. Desde otros barrios, T-Centralen y estaciones próximas son puntos de llegada muy cómodos.",car:"Por tráfico, restricciones y aparcamiento, no lo elegiríamos para hacer turismo por esta zona.",tip:"Visita las calles comerciales y las plazas a pie y usa un billete de metro solo cuando te ahorre un trayecto realmente largo.",best:["walk","metro"],methods:{
walk:{yes:["La mejor manera de enlazar tiendas y plazas.","Gratis y sin esperas."],no:"Para llegar desde barrios periféricos puede ser largo."},
bike:{yes:["Útil para tramos urbanos de distancia media.","Puedes combinar visitas en poco tiempo."],no:"El tráfico del centro requiere precaución."},
metro:{yes:["T-Centralen conecta con diversas líneas.","Muy útil para llegar desde otras zonas."],no:"Para calles próximas suele salir mejor caminar."},
bus:{yes:["Complementa el metro y tiene paradas céntricas.","Sirve si tu hotel queda lejos del metro."],no:"El tráfico puede hacer el trayecto más lento."},
tram:{yes:["La línea 7 conecta el centro con Djurgården.","Buena opción para prolongar un día de visitas."],no:"No cubre todos los puntos del centro comercial."},
ferry:{yes:["Puede formar parte de una ruta panorámica.","Conecta algunas áreas próximas al agua."],no:"No es necesario para visitar Norrmalm."},
car:{yes:["Útil para llevar equipaje entre alojamientos.","Da autonomía para continuar un road trip."],no:"Aparcar en pleno centro suele ser caro."}
}},
{id:"sodermalm",name:"Södermalm",sub:"Miradores y barrios",summary:"Calles con ambiente, cafeterías, parques y excelentes miradores.",reach:"Desde Gamla Stan puedes entrar caminando por Slussen. Si estás más lejos, llega en metro a la estación más cercana a tu ruta por Södermalm.",car:"Hay aparcamientos, pero para sus calles y miradores no suele compensar pagar uno. Apuesta por metro y paseos.",tip:"Hay cuestas y miradores: empieza por el punto más lejano en metro y vuelve caminando por el barrio si tu ruta lo permite.",best:["walk","metro"],methods:{
walk:{yes:["Ideal para detenerte en cafés y miradores.","Permite descubrir rincones sin gastar."],no:"Las pendientes pueden cansar en un recorrido largo."},
bike:{yes:["Permite visitar varias áreas del barrio.","Opción flexible en días agradables."],no:"Hay pendientes que restan comodidad."},
metro:{yes:["Práctico para entrar desde barrios lejanos.","Varias estaciones facilitan diseñar la ruta."],no:"No te lleva a cada mirador: tendrás que caminar."},
bus:{yes:["Puede acercarte a lugares sin estación próxima.","Complementa bien recorridos a pie."],no:"Suele ser menos directo que el metro para ciertas rutas."},
tram:{yes:["Puede servir en otras partes de tu itinerario.","Se integra con billetes SL."],no:"No es la forma principal de recorrer Södermalm."},
ferry:{yes:["Algunas líneas conectan áreas frente al agua.","Vistas distintas de la ciudad."],no:"No es imprescindible para visitar los miradores."},
car:{yes:["Podría servir en una ruta más amplia.","Te permite transportar equipaje."],no:"Parking y calles estrechas encarecen la visita."}
}}
];
const pictograms={
gamla:'<rect x="10" y="26" width="18" height="34"/><path d="M10 26l9-12 9 12M16 34v9m6-9v9"/><rect x="31" y="17" width="18" height="43"/><path d="M31 17l9-12 9 12M37 26v11m6-11v11"/><rect x="52" y="32" width="18" height="28"/><path d="M52 32l9-10 9 10M58 39v9"/>',
djurgarden:'<path d="M8 60h65M22 58V29l16-12 17 12v29M17 30h42M37 18V6M28 39h6v10h-6zm16 0h6v10h-6z"/><path d="M4 56q8-14 12 0M64 56q8-14 12 0"/>',
archipielago:'<path d="M6 50q13-8 26-1t27-1 16 1M7 57q13-8 26-1t27-1 16 1"/><path d="M9 43l13-16 18 15M19 27l4-9 8 10M51 42l11-20 11 20"/><rect x="42" y="27" width="12" height="13"/><path d="M42 27l6-7 6 7"/>',
city:'<rect x="8" y="31" width="19" height="29"/><rect x="29" y="16" width="20" height="44"/><rect x="51" y="26" width="21" height="34"/><path d="M15 38v6m7-6v6m13-20v8m8-8v8m-8 5v8m8-8v8m16-11v7m7-7v7"/>',
sodermalm:'<path d="M7 60h69M10 37l12-14 12 14v23H10zM36 29l13-17 13 17v31H36zM61 43l8-11 8 11v17H61z"/><path d="M18 43v7m29-14v9m6-9v9M69 47v8"/>'};
const root=document.getElementById("cm-root");if(!root)return;
const tabs=root.querySelector("#cm-zone-tabs"),title=root.querySelector("#cm-area-title"),summary=root.querySelector("#cm-area-summary"),reach=root.querySelector("#cm-area-reach"),car=root.querySelector("#cm-area-car"),tip=root.querySelector("#cm-area-tip"),rows=root.querySelector("#cm-modes");
function escapeHtml(str){return String(str).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
tabs.innerHTML=areas.map(a=>'<button type="button" id="tab-'+a.id+'" class="cm-zone" role="tab" aria-selected="false" aria-controls="cm-area-panel" data-area="'+a.id+'"><span class="cm-zone-art" aria-hidden="true"><svg viewBox="0 0 80 70">'+pictograms[a.id]+'</svg></span><strong>'+escapeHtml(a.name)+'</strong><small>'+escapeHtml(a.sub)+'</small></button>').join("");
function render(id){
const area=areas.find(a=>a.id===id)||areas[0];
tabs.querySelectorAll("[data-area]").forEach(b=>{const active=b.dataset.area===area.id;b.setAttribute("aria-selected",String(active));b.setAttribute("tabindex",active?"0":"-1");});
title.textContent=area.name;summary.textContent=area.summary;reach.textContent=area.reach;car.textContent=area.car;tip.textContent=area.tip;
rows.innerHTML=modes.map(m=>{
const item=area.methods[m.id],pick=area.best.includes(m.id);
return '<article class="cm-mode'+(pick?' is-best':'')+'"><div class="cm-mode-choice"><span class="cm-mode-symbol" aria-hidden="true">'+m.symbol+'</span><span class="cm-mode-title"><strong>'+escapeHtml(m.name)+'</strong><small>'+escapeHtml(m.cost)+'</small></span></div><div class="cm-mode-list">'+item.yes.map(p=>'<span class="cm-line"><b aria-label="A favor">✓</b><span>'+escapeHtml(p)+'</span></span>').join('')+'</div><div class="cm-mode-list"><span class="cm-line negative"><b aria-label="En contra">✕</b><span>'+escapeHtml(item.no)+'</span></span></div></article>';
}).join("");
try{const u=new URL(location.href);u.searchParams.set("zona",area.id);history.replaceState(null,"",u.pathname+u.search+u.hash);}catch(e){}
}
tabs.addEventListener("click",e=>{const b=e.target.closest("[data-area]");if(b)render(b.dataset.area);});
tabs.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;const btns=[...tabs.querySelectorAll("[data-area]")],idx=btns.indexOf(document.activeElement);if(idx<0)return;e.preventDefault();let next=e.key==="Home"?0:e.key==="End"?btns.length-1:(idx+(e.key==="ArrowRight"?1:-1)+btns.length)%btns.length;btns[next].focus();render(btns[next].dataset.area);});
const first=new URLSearchParams(location.search).get("zona");render(areas.some(a=>a.id===first)?first:"gamla");
})();