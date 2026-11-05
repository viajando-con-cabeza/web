/* VCC homepage · exact right/left card-edge alignment.
   The offsets are measured from the actual rendered cards instead of guessed pixels. */
(()=>{
  "use strict";
  const planning=document.querySelector(".home-planning");
  const itins=document.querySelector(".home-featured-itineraries .home-feature-card");
  const guides=document.querySelector(".home-featured-guide .home-feature-card");
  const featureGrid=document.querySelector(".home-feature-grid");
  const social=document.querySelector(".home-social-contact");
  const insta=document.querySelector(".home-social-contact .home-instagram");
  const contact=document.querySelector(".home-social-contact .home-contact");
  if(!planning||!itins||!guides||!featureGrid||!social||!insta||!contact)return;
  let raf=0;
  function sync(){
    if(window.innerWidth<=900){
      planning.style.removeProperty("margin-top");
      insta.style.removeProperty("height");
      insta.style.removeProperty("min-height");
      contact.style.removeProperty("height");
      contact.style.removeProperty("min-height");
      social.style.removeProperty("height");
      social.style.removeProperty("margin-top");
      return;
    }
    const first=itins.getBoundingClientRect(), grid=featureGrid.getBoundingClientRect();
    const top=Math.max(0,Math.round(first.top-grid.top));
    planning.style.setProperty("margin-top",top+"px","important");
    // Align the TOP of both social/contact cards with the guide cards,
    // rather than using a barely visible fixed 9px margin.
    const guideTop=guides.getBoundingClientRect().top;
    const previousMargin=parseFloat(window.getComputedStyle(social).marginTop)||0;
    const socialUnshiftedTop=social.getBoundingClientRect().top-previousMargin;
    const offset=Math.max(0,Math.round(guideTop-socialUnshiftedTop));
    social.style.setProperty("margin-top",offset+"px","important");
    const guideEnd=guides.getBoundingClientRect().bottom;
    const socialTop=social.getBoundingClientRect().top;
    const target=Math.max(180,Math.round(guideEnd-socialTop));
    for(const panel of [insta,contact]){
      panel.style.setProperty("height",target+"px","important");
      panel.style.setProperty("min-height",target+"px","important");
    }
    social.style.setProperty("height",target+"px","important");
  }
  function schedule(){
    if(raf)cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{raf=0;sync();});
  }
  window.addEventListener("resize",schedule,{passive:true});
  window.addEventListener("load",schedule,{once:true});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);
  if("ResizeObserver" in window){
    const observer=new ResizeObserver(schedule);
    observer.observe(featureGrid);
    observer.observe(itins);
    observer.observe(guides);
  }
  schedule();
})();