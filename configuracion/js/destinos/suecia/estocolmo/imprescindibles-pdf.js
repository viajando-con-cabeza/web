/* Exportación real de los imprescindibles que aparecen en la página.
 * Datos extraídos de las 16 fichas visibles, sin copiar otra guía ni inventar costes. */
(() => {
  "use strict";
  const button=document.getElementById("imp-export-pdf");
  const status=document.getElementById("imp-export-status");
  if(!button)return;
  const plain=node=>String(node?.textContent||"").replace(/\s+/g," ").trim();
  button.addEventListener("click",()=>{
    try{
      if(!window.VCCPDF)throw Error("El exportador de VCC no se ha cargado");
      const places=[...document.querySelectorAll(".imp-main .place[id]")];
      if(!places.length)throw Error("No se han encontrado lugares para exportar");
      const sections=[
        {heading:"Tu guía de Estocolmo",lines:[
          places.length+" lugares imprescindibles, en el mismo orden que la guía web",
          "Incluye tiempo orientativo, coste y valoración cuando figuran en la ficha, descripción y Consejo VCC."
        ]}
      ];
      places.forEach((place,index)=>{
        const name=plain(place.querySelector(".place-heading h2, h2"))||"Lugar "+(index+1);
        const subtitle=plain(place.querySelector(".place-kicker"));
        const description=plain(place.querySelector(".place-info-card > p, .place-copy > p:not(.place-kicker):not(.imp-static-summary)"));
        const facts=[...place.querySelectorAll(".place-info-card .facts > span, .place-copy > .facts > span")]
          .map(plain).filter(Boolean);
        const fallback=plain(place.querySelector(".imp-static-summary"));
        const advice=plain(place.querySelector(".advice p"));
        const map=place.querySelector('a.imp-static-map-link, .fact-map a[href]');
        const lines=[];
        if(subtitle)lines.push(subtitle);
        if(description)lines.push(description);
        if(facts.length)lines.push("Datos de la visita: "+facts.join(" · "));
        else if(fallback)lines.push("Datos de la visita: "+fallback);
        if(advice)lines.push("CONSEJO VCC: "+advice);
        if(map?.href)lines.push("Ubicación en Google Maps: "+map.href);
        sections.push({heading:String(index+1).padStart(2,"0")+" · "+name,lines});
      });
      window.VCCPDF.download({
        filename:"imprescindibles-estocolmo-VCC.pdf",
        title:"Qué ver en Estocolmo",
        subtitle:"Los "+places.length+" imprescindibles de nuestra guía",
        meta:["Guía Viajando con Cabeza · información tomada de las fichas actuales de la web"],
        sections,
        note:"Los tiempos, costes y horarios pueden cambiar. Consulta la ficha web y los enlaces oficiales antes de la visita."
      });
      if(status)status.textContent="PDF descargado con los "+places.length+" lugares y sus consejos VCC.";
    }catch(error){
      console.error("VCC: error al exportar imprescindibles",error);
      if(status)status.textContent="No se pudo generar el PDF. Vuelve a intentarlo.";
    }
  });
})();
