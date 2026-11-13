/* VCC · Enllaços d'acció: text net i color original a tot el blog.
   S'eliminen NOMÉS fletxes ornamentals de links amb etiqueta verbal.
   Cap canvi a carrusels, fletxes de navegació o botons icon-only. */
(()=>{
  "use strict";
  if(window.__vccEnlacesDiscretos)return;
  window.__vccEnlacesDiscretos=true;
  const action=/^(?:VER\b|WEB\b|DESCUBRIR\b|INSP[IÍ]RATE\b|EXPLORAR\b|CON[OÓ]CENOS\b|IR A\b|ABRIR\b|VISITAR\b|CONSULTAR\b|COMPARAR\b|RESERVAR\b|LEER\b|SABER M[AÁ]S\b|MOSTRAR M[AÁ]S\b|PONERLO EN ORDEN\b|TODAS LAS HERRAMIENTAS\b)/iu;
  const tail=/[\s\u00a0]*(?:[→↗›➜➝])+[\s\u00a0]*$/u;
  const arrowOnly=/^[→↗›➜➝]+$/u;
  const skip=/(?:carousel|carrusel|gallery|galeria|arrow|flecha|next|prev|subnav|breadcrumb|menu|paginacion|pagination)/i;
  const known=/\b(?:vcc-it-cta|home-feature-link|home-section-more|home-about-link|vcc-prep-action|vl-air-action|al-action|sv-insurer-action|sv-insurer-link|ep4-day-link|av-button|subtle-link|vcc-map-open-link|vcc-itinerary-budget__link)\b/;
  function clean(link){
    if(!link || link.tagName!=="A" || !link.hasAttribute("href"))return;
    if(skip.test(link.className||""))return;
    const label=(link.textContent||"").replace(/\s+/g," ").trim();
    if(!action.test(label) && !known.test(link.className||""))return;
    link.classList.add("vcc-accion-discreta");
    // Eliminar fletxes de text, sense tocar els SVG ni els controls funcionals.
    const nodes=[...link.childNodes];
    for(let i=nodes.length-1;i>=0;i--){
      const node=nodes[i];
      if(node.nodeType===3){
        if(!node.textContent.trim())continue;
        if(tail.test(node.textContent))node.textContent=node.textContent.replace(tail,"");
        break;
      }
      if(node.nodeType===1){
        const isDecorative=node.getAttribute("aria-hidden")==="true";
        if(isDecorative&&arrowOnly.test(node.textContent.trim())){
          node.hidden=true;
          continue;
        }
        if(node.matches("span,b,small,em") && !node.querySelector("a,button,svg")){
          const txt=node.textContent.trim();
          if(tail.test(txt)&&action.test(txt)){
            for(const textNode of node.childNodes){
              if(textNode.nodeType===3 && tail.test(textNode.textContent)){
                textNode.textContent=textNode.textContent.replace(tail,"");
              }
            }
          }
        }
        break;
      }
    }
  }
  function scan(root){
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1 && root.matches?.("a[href]"))clean(root);
    root.querySelectorAll?.("a[href]").forEach(clean);
  }
  const init=()=>{
    scan(document);
    const root=document.body;
    if(!root)return;
    // Només processa nodes nous, mai torna a recorrer tota la pàgina a cada canvi.
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes)scan(node);
      }
    });
    observer.observe(root,{childList:true,subtree:true});
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();