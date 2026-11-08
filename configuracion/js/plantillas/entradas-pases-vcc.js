/* VCC | Guía de entradas atemporal: sin tarifas, nombres comerciales ni
   cálculos de ahorro. Orientación basada en intención, ritmo e inclusiones. */
(function(){
  "use strict";
  function init(){
    const root=document.querySelector(".ep-page");
    if(!root)return;
    const selections={visits:"few",pace:"relaxed",coverage:"unknown"};
    const choices=[...root.querySelectorAll("[data-ep-quiz]")];
    const title=root.querySelector("#ep-quiz-title");
    const message=root.querySelector("#ep-quiz-message");
    const next=root.querySelector("#ep-quiz-next");
    function advice(){
      let headline,description,step;
      if(selections.visits==="few"){
        headline="PROBABLEMENTE NO TE COMPENSA";
        description="Con una o dos visitas de pago suele ser más práctico comprar entradas individuales y dedicar el resto del tiempo a explorar la ciudad.";
        step="Consulta la entrada oficial de cada visita que hayas elegido.";
      }else if(selections.coverage==="no"){
        headline="MEJOR VALORAR ENTRADAS SUELTAS";
        description="Si el pase deja fuera la mayoría de las visitas que te interesan, podrías pagar dos veces: por el pase y por entradas adicionales.";
        step="Comprueba qué está incluido antes de comprar nada.";
      }else if(selections.coverage==="unknown"){
        headline="PRIMERO, REVISA LO QUE INCLUYE";
        description="Un pase solo es útil si cubre varias atracciones que realmente quieres visitar. La lista y las condiciones pueden cambiar.";
        step="Consulta las inclusiones actuales del pase y vuelve a elegir una respuesta.";
      }else if(selections.pace==="packed" && selections.visits==="many"){
        headline="PUEDE MERECER LA PENA";
        description="Tienes muchas visitas de pago previstas, la mayoría están incluidas y quieres concentrarlas en pocos días. Es el escenario más favorable para comparar un pase.";
        step="Suma los precios oficiales de tus visitas y compáralos con el pase vigente.";
      }else if(selections.pace==="packed"){
        headline="COMPARA: PODRÍA COMPENSAR";
        description="Si vas a hacer varias visitas de pago incluidas en pocos días, un pase podría salirte a cuenta. Pero no siempre: depende de la tarifa vigente.";
        step="Revisa la duración del pase, las reservas y los precios oficiales.";
      }else{
        headline="DEPENDE DE TU RITMO";
        description="Aunque muchas visitas estén incluidas, ir sin prisas puede hacer más prácticas las entradas sueltas. No te fuerces a visitar lugares solo para amortizar un pase.";
        step="Compara las entradas por separado con el pase que exista cuando viajes.";
      }
      title.textContent=headline;
      message.textContent=description;
      next.textContent=step;
    }
    choices.forEach(btn=>btn.addEventListener("click",()=>{
      const kind=btn.dataset.epQuiz;
      selections[kind]=btn.dataset.value;
      choices.filter(other=>other.dataset.epQuiz===kind).forEach(other=>{
        other.setAttribute("aria-pressed",String(other===btn));
      });
      advice();
    }));
    advice();

    /* Subheader corporativo: sección activa y offset real del header. */
    const nav=root.querySelector(".ep-subnav");
    if(!nav)return;
    const links=[...nav.querySelectorAll('a[href^="#"]')];
    const sections=links.map(a=>document.getElementById(a.hash.slice(1))).filter(Boolean);
    if(!sections.length)return;
    let ticking=false;
    function sync(){
      const header=document.querySelector(".shared-header")||document.querySelector(".page-header");
      const position=header?window.getComputedStyle(header).position:"static";
      const height=header&&(position==="fixed"||position==="sticky")?
        Math.round(header.getBoundingClientRect().height):0;
      document.documentElement.style.setProperty("--ep-header-height",height+"px");
      const offset=height+nav.offsetHeight+28;
      let active=sections[0];
      for(const section of sections)if(section.getBoundingClientRect().top<=offset)active=section;
      links.forEach(link=>{
        if(link.hash==="#"+active.id)link.setAttribute("aria-current","location");
        else link.removeAttribute("aria-current");
      });
      ticking=false;
    }
    links.forEach(link=>link.addEventListener("click",()=>{
      links.forEach(other=>other.removeAttribute("aria-current"));
      link.setAttribute("aria-current","location");
    }));
    window.addEventListener("scroll",()=>{
      if(ticking)return;
      ticking=true;
      window.requestAnimationFrame(sync);
    },{passive:true});
    window.addEventListener("resize",sync,{passive:true});
    window.addEventListener("load",sync,{once:true});
    sync();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

/* VCC · Carruseles accesibles de Entradas y Según tus días. El consejo VCC es estático.
   Mantiene el desplazamiento táctil nativo; las flechas muestran su estado real. */
(function(){
  "use strict";
  function init(){
    const root=document.querySelector(".ep-page");
    if(!root)return;
    const tracks=[...root.querySelectorAll(".ep-scroll-track")];
    tracks.forEach(track=>{
      const controls=[...root.querySelectorAll('[data-ep-slide-target="'+track.id+'"]')];
      if(!controls.length)return;
      let queued=false;
      function sync(){
        const max=track.scrollWidth-track.clientWidth;
        const overflow=max>3;
        controls.forEach(btn=>{
          const back=btn.dataset.epSlideDir==="-1";
          btn.disabled=!overflow||(back?track.scrollLeft<=2:track.scrollLeft>=max-2);
          btn.setAttribute("aria-disabled",String(btn.disabled));
        });
        queued=false;
      }
      function queue(){
        if(queued)return;
        queued=true;
        window.requestAnimationFrame(sync);
      }
      controls.forEach(btn=>btn.addEventListener("click",()=>{
        const first=track.firstElementChild;
        if(!first||btn.disabled)return;
        const gap=parseFloat(window.getComputedStyle(track).gap)||0;
        const step=first.getBoundingClientRect().width+gap;
        const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        track.scrollBy({left:Number(btn.dataset.epSlideDir)*step,behavior:reduced?"instant":"smooth"});
        queue();
      }));
      track.addEventListener("scroll",queue,{passive:true});
      window.addEventListener("resize",queue,{passive:true});
      window.addEventListener("load",queue,{once:true});
      window.requestAnimationFrame(sync);
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
