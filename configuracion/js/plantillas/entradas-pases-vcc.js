/* VCC · Entradas y pases · Ranking editorial por perfil.
   Sólo navegación sticky y carouseles de entradas/consejos.
   No hay filtros ni calculadoras: la recomendación editorial es legible sin JS. */
(function() {
"use strict";
function init() {
  const root=document.querySelector(".ep-page");
  if (!root) return;
  /* Ranking VCC por perfil: paneles HTML legibles, sin dependencia de APIs.
     Click, flechas, Inicio y Fin funcionan también con teclado. */
  const profileTip=root.querySelector("#ep-ranking-advice-copy");
  const profileAdvice={
    pareja:"En pareja elegiríamos un paseo en barco o el Museo Vasa; ABBA solo si nos entusiasma su música. Con dos o tres días, preferimos una o dos entradas y tiempo para disfrutar de los barrios.",
    amigos:"Con amigos priorizaríamos una experiencia compartida: ABBA si sois fans o Gröna Lund si os gustan las atracciones y el parque está abierto. No compraríamos entradas que no interesen a todo el grupo.",
    familia:"En familia escogeríamos Skansen como primera opción. Con adolescentes curiosos añadiríamos Vasa, pero sin llenar cada día de actividades de pago. Lo importante es adaptar el viaje a todos.",
    ninos:"Con niños pequeños priorizaríamos Skansen y muchos descansos. Mejor una visita que puedan disfrutar con calma que tres entradas seguidas. Comprobad edades, horarios y restricciones de cada actividad.",
    jubilados:"Si disfrutáis del patrimonio, Palacio Real y Vasa son dos opciones estupendas; si preferís algo más relajado, valorad el barco según el recorrido y la accesibilidad. Elegid por intereses, no por edad."
  };
  const rankingTabs=[...root.querySelectorAll(".ep-ranking-tab[role='tab']")];
  if(rankingTabs.length){
    function selectProfile(next,focusTab){
      if(!next)return;
      rankingTabs.forEach(tab=>{
        const active=tab===next;
        const panel=document.getElementById(tab.getAttribute("aria-controls"));
        tab.setAttribute("aria-selected",String(active));
        tab.tabIndex=active?0:-1;
        if(panel)panel.hidden=!active;
        if(active&&profileTip){
          const key=tab.id.replace("ep-ranking-tab-","");
          if(profileAdvice[key])profileTip.textContent=profileAdvice[key];
        }
      });
      if(focusTab)next.focus();
    }
    rankingTabs.forEach((tab,index)=>{
      tab.addEventListener("click",()=>selectProfile(tab,false));
      tab.addEventListener("keydown",event=>{
        let idx;
        if(event.key==="ArrowRight")idx=(index+1)%rankingTabs.length;
        else if(event.key==="ArrowLeft")idx=(index+rankingTabs.length-1)%rankingTabs.length;
        else if(event.key==="Home")idx=0;
        else if(event.key==="End")idx=rankingTabs.length-1;
        else return;
        event.preventDefault();
        selectProfile(rankingTabs[idx],true);
      });
    });
    selectProfile(rankingTabs.find(tab=>tab.getAttribute("aria-selected")==="true")||rankingTabs[0],false);
  }
  const nav=root.querySelector(".ep-subnav");
  if(nav){
    const links=[...nav.querySelectorAll('a[href^="#"]')];
    const sections=links.map(a=>document.getElementById(a.hash.slice(1))).filter(Boolean);
    let pending=false;
    function syncNav(){
      const header=document.querySelector(".shared-header")||document.querySelector(".page-header");
      const style=header?window.getComputedStyle(header).position:"static";
      const height=header&&(style==="sticky"||style==="fixed")?Math.round(header.getBoundingClientRect().height):0;
      document.documentElement.style.setProperty("--ep-header-height",height+"px");
      const trigger=height+nav.offsetHeight+24;
      let active=sections[0];
      sections.forEach(section=>{if(section.getBoundingClientRect().top<=trigger)active=section});
      links.forEach(link=>{
        if(active&&link.hash==="#"+active.id)link.setAttribute("aria-current","location");
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
      window.requestAnimationFrame(syncNav);
    },{passive:true});
    window.addEventListener("resize",syncNav,{passive:true});
    window.addEventListener("load",syncNav,{once:true});
    syncNav();
  }
  root.querySelectorAll(".ep-scroll-track").forEach(track=>{
    const buttons=[...root.querySelectorAll('[data-ep-slide-target="'+track.id+'"]')];
    if(!buttons.length)return;
    let queued=false;
    function sync(){
      const max=Math.max(0,track.scrollWidth-track.clientWidth);
      buttons.forEach(btn=>{
        const back=btn.dataset.epSlideDir==="-1";
        btn.disabled=max<3||(back?track.scrollLeft<=2:track.scrollLeft>=max-2);
        btn.setAttribute("aria-disabled",String(btn.disabled));
      });
      queued=false;
    }
    function requestSync(){
      if(queued)return;
      queued=true;
      window.requestAnimationFrame(sync);
    }
    buttons.forEach(btn=>btn.addEventListener("click",()=>{
      if(btn.disabled)return;
      const first=track.firstElementChild;
      if(!first)return;
      const gap=parseFloat(window.getComputedStyle(track).gap)||0;
      const step=first.getBoundingClientRect().width+gap;
      const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollBy({left:Number(btn.dataset.epSlideDir)*step,behavior:reduce?"instant":"smooth"});
      requestSync();
    }));
    track.addEventListener("scroll",requestSync,{passive:true});
    window.addEventListener("resize",requestSync,{passive:true});
    window.addEventListener("load",requestSync,{once:true});
    window.requestAnimationFrame(sync);
  });
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
