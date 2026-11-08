/* VCC · Entradas y pases / Estocolmo · 2026-11-08
   Recomendaciones editoriales según días y perfil, sin cálculos de precios.
   Subheader corporativo y carruseles de entradas / ahorro. */
(function(){
"use strict";
function init(){
  const root=document.querySelector(".ep-page");
  if(!root)return;
  const state={days:3,profile:"vcc"};
  const daysButtons=[...root.querySelectorAll("[data-ep-day]")];
  const profileButtons=[...root.querySelectorAll("[data-ep-profile]")];
  const title=root.querySelector("#ep-choose-title");
  const buy=root.querySelector("#ep-reco-buy");
  const optional=root.querySelector("#ep-reco-optional");
  const skip=root.querySelector("#ep-reco-skip");
  const free=root.querySelector("#ep-reco-free");
  const note=root.querySelector("#ep-reco-note");
  const profiles={
    vcc:{
      label:"A TU RITMO",
      plans:{
        1:{buy:["Una sola entrada: Museo Vasa si te gusta la historia."],free:"Recorre Gamla Stan y uno de los miradores sin pagar más visitas.",note:"No intentaríamos encajar tres museos en un día."},
        2:{buy:["Museo Vasa como visita principal.","Palacio Real solo si realmente te apetece entrar."],free:"Deja tiempo para Gamla Stan, Djurgården y paseos junto al agua.",note:"Una o dos entradas son suficientes para nuestro ritmo de viaje."},
        3:{buy:["Museo Vasa como visita principal.","Palacio Real si te interesa: es opcional."],free:"Reservaríamos el resto para Gamla Stan, Södermalm, miradores y paseos sin entrada.",note:"Esta selección encaja con nuestro itinerario de tres días."},
        4:{buy:["Museo Vasa y una segunda visita a tu gusto.","Fotografiska o un paseo en barco solo si te interesan especialmente."],free:"Aprovecha el tiempo extra para explorar barrios, parques e islas.",note:"Tener más días no significa tener que comprar más entradas."}
      }
    },
    couple:{
      label:"EN PAREJA",
      plans:{
        1:{buy:["ABBA The Museum solo si os gusta mucho su música."],free:"Pasaríamos el resto del día entre Gamla Stan y el paseo junto al agua.",note:"Como alternativa, elegid Vasa si os atrae más la historia."},
        2:{buy:["ABBA The Museum si sois fans.","Museo Vasa como segunda opción, no como obligación."],free:"Fika, miradores y paseo por Södermalm sin más entradas.",note:"Priorizaríamos dos experiencias distintas, no una carrera de museos."},
        3:{buy:["Museo Vasa si os interesa la historia.","ABBA The Museum como plan diferente si sois fans."],free:"Gamla Stan, Djurgården, Södermalm y tiempo para un atardecer.",note:"No compraríamos ABBA por costumbre: solo si os ilusiona."},
        4:{buy:["Museo Vasa o ABBA según gustos.","Crucero por los canales como alternativa para un día relajado."],free:"Más barrios y paseos junto al agua, sin añadir museos por añadir.",note:"Comprobad que el crucero opere en la época en que viajáis."}
      }
    },
    family:{
      label:"CON NIÑOS",
      plans:{
        1:{buy:["Skansen: animales, tradiciones y actividades para pequeños."],free:"Disfrutad de Djurgården sin encadenar otros museos.",note:"Para un solo día priorizaríamos una visita adaptable a los niños."},
        2:{buy:["Skansen como entrada principal.","Museo Vasa solo si la edad y el interés acompañan."],free:"Juegos, parques y paseos fáciles entre actividades.",note:"No reservaríamos demasiadas horas seguidas en museos."},
        3:{buy:["Skansen, que suele encajar muy bien con familias.","Gröna Lund como alternativa si está abierto y os gustan las atracciones."],free:"Incluid Gamla Stan y un día flexible sin tickets.",note:"Skansen y Gröna Lund son alternativas; no hace falta comprar ambas."},
        4:{buy:["Skansen como experiencia principal.","Gröna Lund si viajáis en temporada y encaja con sus edades."],free:"Parques, muelles, paseos cortos y descansos entre visitas.",note:"Antes de reservar Gröna Lund, comprobad apertura y restricciones de altura."}
      }
    },
    culture:{
      label:"CULTURAL",
      plans:{
        1:{buy:["Museo Vasa si quieres conocer una pieza única de historia sueca."],free:"Gamla Stan y sus calles históricas se disfrutan gratis.",note:"Si prefieres arquitectura, cambia Vasa por el Palacio Real."},
        2:{buy:["Museo Vasa.","Palacio Real como segunda visita, si te apasiona la historia."],free:"Paseos históricos por Gamla Stan y Djurgården.",note:"Mejor dos visitas con tiempo que cuatro a toda velocidad."},
        3:{buy:["Museo Vasa y Palacio Real.","Museo Nobel o Fotografiska como alternativa a uno de ellos."],free:"Noches y tardes para barrios, miradores y cultura callejera.",note:"Elige solo los dos museos que más encajen con tus intereses."},
        4:{buy:["Vasa y Palacio Real como base histórica.","Fotografiska o Museo Nobel si te apetece un tercer museo."],free:"Explora librerías, arquitectura y paseos junto al agua.",note:"Con más días puedes repartir las visitas sin necesitar un pase."}
      }
    }
  };
  const alternative={
    vcc:"Palacio Real si te interesa la historia, o Skansen si viajas con niños.",
    couple:"Museo Vasa si os interesa la historia; no hace falta comprar ambas entradas.",
    family:"Gröna Lund si está abierto y encaja con la edad y la altura de los niños.",
    culture:"Palacio Real si te apetece conocer sus interiores."
  };
  const deprioritize={
    vcc:"Acumular entradas para amortizar un pase turístico. Preferimos explorar barrios y miradores.",
    couple:"Comprar entradas por rutina, especialmente ABBA si no os gusta su música.",
    family:"Tres museos seguidos o visitas demasiado largas que cansen a los pequeños.",
    culture:"Pagar por todos los museos sin tiempo para disfrutar de cada uno."
  };
  function syncRecommendation(){
    const profile=profiles[state.profile]||profiles.vcc;
    const p=profile.plans[state.days]||profile.plans[3];
    const dayText=state.days===4?"4 O MÁS DÍAS":state.days+" DÍA"+(state.days===1?"":"S");
    title.textContent="CON "+dayText+" · "+profile.label;
    buy.textContent=p.buy[0]||"Una entrada elegida según tus intereses.";
    optional.textContent=p.buy[1]||alternative[state.profile]||alternative.vcc;
    skip.textContent=deprioritize[state.profile]||deprioritize.vcc;
    free.textContent=p.free;
    note.textContent=p.note;
    daysButtons.forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.epDay)===state.days)));
    profileButtons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.epProfile===state.profile)));
  }
  daysButtons.forEach(btn=>btn.addEventListener("click",()=>{
    const days=Number(btn.dataset.epDay);
    if(days>=1&&days<=4){state.days=days;syncRecommendation()}
  }));
  profileButtons.forEach(btn=>btn.addEventListener("click",()=>{
    if(profiles[btn.dataset.epProfile]){state.profile=btn.dataset.epProfile;syncRecommendation()}
  }));
  if(title&&buy&&optional&&skip&&free&&note)syncRecommendation();

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
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();