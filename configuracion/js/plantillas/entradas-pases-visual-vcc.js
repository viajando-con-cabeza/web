/* VCC · Entradas y pases · checklist editorial, sin registro ni APIs */
(function(){
 "use strict";
 function init(){
   const btn=document.getElementById("ep-v2-download-btn");
   const status=document.getElementById("ep-v2-download-status");
   if(!btn)return;
   btn.addEventListener("click",()=>{
     const lines=[
       "VIAJANDO CON CABEZA · ESTOCOLMO",
       "CHECKLIST DE ENTRADAS Y RESERVAS",
       "",
       "ANTES DEL VIAJE",
       "[ ] ABBA The Museum: reservar franja horaria si te interesa. https://abbathemuseum.com/en/prices-opening-hours",
       "[ ] Skansen: comprobar precio de tu fecha y comprar online si lo eliges. https://www.skansen.se/en/plan-your-visit/opening-hours-and-prices/",
       "[ ] Crucero: confirmar rutas, temporada y reserva. https://www.stromma.com/en-se/stockholm/sightseeing/sightseeing-by-boat/",
       "",
       "ENTRADAS FLEXIBLES",
       "[ ] Museo Vasa: comprobar precio (195–240 SEK / adulto); la compra anticipada no salta la cola. https://www.vasamuseet.se/en/visit/hours--admission",
       "[ ] Palacio Real: comprobar aperturas y precio (220–240 SEK / adulto). https://www.kungligaslotten.se/english/royal-palaces-and-sites/admission-charges.html",
       "[ ] Fotografiska: revisar exposiciones y promociones. https://stockholm.fotografiska.com/en/",
       "[ ] Museo Nobel: mirar horarios y exposiciones. https://nobelprizemuseum.se/en/",
       "",
       "PASES TURÍSTICOS",
       "[ ] Solo comprar un pase si las atracciones incluidas cuestan más por separado.",
       "[ ] Revisar Go City Essentials y All-Inclusive. https://gocity.com/en/stockholm",
       "[ ] Recordar que el transporte público SL NO está incluido.",
       "",
       "CONSEJOS VCC",
       "Día 1 · Gamla Stan: historia y paseos; Palacio Real opcional.",
       "Día 2 · Djurgården: escoger Vasa y/o Skansen según intereses.",
       "Día 3 · Södermalm: calles, miradores y planes gratuitos.",
       "",
       "Los precios son orientativos. Verifica tarifas, fechas y reservas en la web oficial antes de comprar.",
       "Guía: https://viajandoconcabeza.com/destinos/suecia/estocolmo/entradas-y-pases.html"
     ];
     try{
       const file=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});
       const url=URL.createObjectURL(file);
       const a=document.createElement("a");
       a.href=url;a.download="vcc-estocolmo-lista-entradas.txt";
       document.body.appendChild(a);a.click();a.remove();
       window.setTimeout(()=>URL.revokeObjectURL(url),1500);
       if(status)status.textContent="Checklist preparada para descargar. Comprueba los precios antes de comprar.";
     }catch(error){
       if(status)status.textContent="No se ha podido descargar la checklist en este navegador.";
     }
   });
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();