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
    // Align BOTTOM of both cards with the featured guide cards.
    // Move them visibly down by shortening the panels rather than keeping a 245px minimum.
    const guideBottom=guides.getBoundingClientRect().bottom;
    const desiredHeight=210;
    // Reset before measuring to prevent accumulation during resize/observer events.
    social.style.setProperty("margin-top","0px","important");
    social.style.removeProperty("height");
    for(const panel of [insta,contact]){
      panel.style.removeProperty("height");
      panel.style.removeProperty("min-height");
    }
    const rowTop=social.getBoundingClientRect().top;
    const offset=Math.max(0,Math.round(guideBottom-rowTop-desiredHeight));
    social.style.setProperty("margin-top",offset+"px","important");
    // When the guide is smaller than expected, still prevent overflow.
    const available=Math.max(185,Math.round(guideBottom-(rowTop+offset)));
    const height=Math.min(desiredHeight,available);
    social.style.setProperty("height",height+"px","important");
    for(const panel of [insta,contact]){
      panel.style.setProperty("height",height+"px","important");
      panel.style.setProperty("min-height","0px","important");
    }
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