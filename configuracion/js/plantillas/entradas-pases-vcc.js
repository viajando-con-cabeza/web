/* VCC · Entradas y pases en Estocolmo · revisión 2026-11-07
   Calculadora de referencias: no promete disponibilidad ni ahorro garantizado.
   Essentials cubre UNA principal elegible y hasta DOS extras de su selección.
   All-Inclusive cubre las incluidas durante días consecutivos. */
(function () {
  "use strict";
  function init() {
    const root=document.querySelector(".ep-page");
    if (!root)return;
    const official={
      vasa:{low:195,high:240,category:"main"},
      skansen:{low:240,high:240,category:"main"}, // referencia: tarifa dinámica, consultar fecha
      palacio:{low:220,high:240,category:"main"},
      abba:{low:269,high:349,category:"excluded"},
      foto:{low:230,high:230,category:"extra"},
      barco:{low:385,high:385,category:"extra"}, // Stockholm Highlights Boat Tour; disponibilidad estacional
      nobel:{low:160,high:160,category:"extra"}
    };
    const allInclusivePrices={1:949,2:1349,3:1699,4:1949,5:1999};
    const essentialsPrice=649;
    const checks=[...root.querySelectorAll("[data-ep-attraction]")];
    const durations=[...root.querySelectorAll("[data-ep-days]")];
    const rate=root.querySelector("#ep-season");
    const view={
      single:root.querySelector("#ep-price-single"),
      essentials:root.querySelector("#ep-price-essentials"),
      inclusive:root.querySelector("#ep-price-all"),
      essentialsDetail:root.querySelector("#ep-ess-detail"),
      inclusiveDetail:root.querySelector("#ep-all-detail"),
      bestTitle:root.querySelector("#ep-best-title"),
      bestCopy:root.querySelector("#ep-best-copy"),
      saving:root.querySelector("#ep-saving"),
      cards:[...root.querySelectorAll(".ep-price-card")]
    };
    let days=1;
    function money(amount){
      return new Intl.NumberFormat("es-ES",{maximumFractionDigits:0}).format(amount)+" SEK";
    }
    function price(id){const item=official[id];return item[rate.value==="high"?"high":"low"];}
    function render(){
      const ids=checks.filter(c=>c.checked).map(c=>c.dataset.epAttraction);
      checks.forEach(c=>{
        const label=root.querySelector('[data-ep-price-for="'+c.dataset.epAttraction+'"]');
        if(label)label.textContent="≈"+price(c.dataset.epAttraction)+" kr";
      });
      view.cards.forEach(c=>c.removeAttribute("data-winning"));
      if(!ids.length){
        view.single.textContent="—";view.essentials.textContent="—";view.inclusive.textContent="—";
        view.essentialsDetail.textContent="1 principal + 2 extras";
        view.inclusiveDetail.textContent=days+" día"+(days===1?"":"s")+" consecutivos";
        view.bestTitle.textContent="ELIGE TUS VISITAS";
        view.bestCopy.textContent="Selecciona los lugares que quieres visitar para calcular qué opción sale más económica.";
        view.saving.textContent="";
        return;
      }
      const individual=ids.reduce((a,id)=>a+price(id),0);
      const mains=ids.filter(id=>official[id].category==="main").sort((a,b)=>price(b)-price(a));
      const extras=ids.filter(id=>official[id].category==="extra").sort((a,b)=>price(b)-price(a));
      const covered=mains.length?[mains[0],...extras.slice(0,2)]:[];
      const essentials=mains.length?essentialsPrice+
        ids.filter(id=>!covered.includes(id)).reduce((a,id)=>a+price(id),0):Infinity;
      const outside=ids.filter(id=>official[id].category==="excluded");
      const inclusive=allInclusivePrices[days]+outside.reduce((a,id)=>a+price(id),0);
      const results=[
        {id:"single",title:"ENTRADAS INDIVIDUALES",cost:individual},
        {id:"essentials",title:"GO CITY ESSENTIALS",cost:essentials},
        {id:"inclusive",title:"GO CITY ALL-INCLUSIVE",cost:inclusive}
      ];
      const winner=results.reduce((best,next)=>next.cost<best.cost?next:best);
      view.single.textContent=money(individual);
      view.essentials.textContent=Number.isFinite(essentials)?money(essentials):"NO APLICA";
      view.inclusive.textContent=money(inclusive);
      view.essentialsDetail.textContent=mains.length?
        covered.length+" visita"+(covered.length===1?"":"s")+" elegible"+(covered.length===1?"":"s"):
        "Requiere una principal";
      view.inclusiveDetail.textContent=days+" día"+(days===1?"":"s")+" consecutivo"+(days===1?"":"s");
      const choice=view.cards.find(c=>c.dataset.option===winner.id);
      if(choice)choice.setAttribute("data-winning","true");
      view.bestTitle.textContent=winner.title;
      if(winner.id==="single"){
        view.bestCopy.textContent="Para estas visitas y precios de referencia, las entradas sueltas son la opción más económica. No compres un pase si no vas a aprovecharlo.";
      }else if(winner.id==="essentials"){
        view.bestCopy.textContent="Essentials puede salir mejor: cuenta una atracción principal y hasta dos extras elegibles. El resto se paga por separado.";
      }else{
        view.bestCopy.textContent="All-Inclusive puede convenirte si haces todas estas visitas incluidas en "+days+" día"+(days===1?"":"s")+" consecutivo"+(days===1?"":"s")+". Verifica los horarios y las reservas.";
      }
      const saving=individual-winner.cost;
      view.saving.textContent=saving>0?
        "Ahorro orientativo frente a entradas sueltas: "+money(saving):
        "Ningún pase resulta más barato en esta simulación.";
    }
    durations.forEach(btn=>btn.addEventListener("click",()=>{
      days=Number(btn.dataset.epDays);
      durations.forEach(other=>other.setAttribute("aria-pressed",String(other===btn)));
      render();
    }));
    checks.forEach(c=>c.addEventListener("change",render));
    if(rate)rate.addEventListener("change",render);
    render();

    /* Barra corporativa: cabecera real + sección activa sin saltos de scroll. */
    const nav=root.querySelector(".ep-subnav");
    if(!nav)return;
    const links=[...nav.querySelectorAll('a[href^="#"]')];
    const sections=links.map(a=>document.getElementById(a.hash.slice(1))).filter(Boolean);
    if(!sections.length)return;
    let pending=false;
    function update(){
      const header=document.querySelector(".shared-header")||document.querySelector(".page-header");
      const position=header?window.getComputedStyle(header).position:"static";
      const height=header&&(position==="fixed"||position==="sticky")?
        Math.round(header.getBoundingClientRect().height):0;
      document.documentElement.style.setProperty("--ep-header-height",height+"px");
      const threshold=height+nav.offsetHeight+28;
      let active=sections[0];
      for(const section of sections)if(section.getBoundingClientRect().top<=threshold)active=section;
      links.forEach(link=>{
        if(link.hash==="#"+active.id)link.setAttribute("aria-current","location");
        else link.removeAttribute("aria-current");
      });
      pending=false;
    }
    links.forEach(link=>link.addEventListener("click",()=>{
      links.forEach(other=>other.removeAttribute("aria-current"));
      link.setAttribute("aria-current","location");
    }));
    window.addEventListener("scroll",()=>{
      if(pending)return;
      pending=true;
      window.requestAnimationFrame(update);
    },{passive:true});
    window.addEventListener("resize",update,{passive:true});
    window.addEventListener("load",update,{once:true});
    update();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

/* VCC · Caruseles accesibles de Entradas, Según tus días y Consejo VCC.
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
