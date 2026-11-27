/* Inicio VCC: carruseles accesibles de guías e itinerarios destacados. */
(function(){
  "use strict";
  function initCarousel(wrap){
    const track=wrap.querySelector(".home-carousel-track");
    const prev=wrap.querySelector("[data-home-prev]");
    const next=wrap.querySelector("[data-home-next]");
    if(!track||!prev||!next)return;
    const cards=Array.from(track.children);
    function step(){
      if(cards.length<2)return track.clientWidth;
      const box=cards[0].getBoundingClientRect();
      const nextBox=cards[1].getBoundingClientRect();
      return Math.max(1,nextBox.left-box.left);
    }
    function update(){
      const max=track.scrollWidth-track.clientWidth;
      prev.disabled=track.scrollLeft<4;
      next.disabled=track.scrollLeft>=max-4||max<=3;
      wrap.classList.toggle("home-carousel-has-overflow",max>3);
    }
    prev.addEventListener("click",()=>track.scrollBy({left:-step(),behavior:"smooth"}));
    next.addEventListener("click",()=>track.scrollBy({left:step(),behavior:"smooth"}));
    track.addEventListener("scroll",update,{passive:true});
    track.addEventListener("keydown",e=>{
      if(e.key!=="ArrowRight"&&e.key!=="ArrowLeft")return;
      e.preventDefault();
      track.scrollBy({left:e.key==="ArrowRight"?step():-step(),behavior:"smooth"});
    });
    if("ResizeObserver" in window)new ResizeObserver(update).observe(track);
    else window.addEventListener("resize",update,{passive:true});
    requestAnimationFrame(update);
  }
  // Font unica de categoria: qualsevol variant antiga de ruta combinada
  // es visualitza sempre amb el mateix nom i la mateixa icona SVG.
  function normalizeCombinedCategories(){
    const icon="/configuracion/imagenes/iconos/paginas/itinerarios-iconos.svg?v=20261114#it-category-combined";
    document.querySelectorAll("#home-track-itinerarios .vcc-card-kicker").forEach(kicker=>{
      const parts=kicker.querySelectorAll(".vcc-card-kicker-part");
      (parts.length?Array.from(parts):[kicker]).forEach(part=>{
        if(!/^(?:RUTA COMBINADA|COMBINADO|COMBINADOS)$/.test(part.textContent.trim().toUpperCase()))return;
        const use=part.querySelector("svg use");
        if(use)use.setAttribute("href",icon);
        const label=Array.from(part.childNodes).find(node=>node.nodeType===3&&node.textContent.trim());
        if(label)label.textContent="COMBINADOS";
        else part.appendChild(document.createTextNode("COMBINADOS"));
      });
    });
  }
  function init(){normalizeCombinedCategories();document.querySelectorAll("[data-home-carousel]").forEach(initCarousel)};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
