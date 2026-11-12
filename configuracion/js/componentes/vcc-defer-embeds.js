/* VCC · Load costly third-party maps shortly before they enter the viewport.
   Keeps their place in the layout and preserves the existing interactive embed. */
(() => {
  'use strict';
  const frames=[...document.querySelectorAll('iframe[data-vcc-deferred-src]')];
  if(!frames.length)return;
  const load=frame=>{
    const src=frame.dataset.vccDeferredSrc;
    if(!src)return;
    frame.src=src;
    frame.removeAttribute('data-vcc-deferred-src');
  };
  if(!('IntersectionObserver' in window)){
    frames.forEach(load);
    return;
  }
  const observer=new IntersectionObserver((entries)=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      load(entry.target);
      observer.unobserve(entry.target);
    }
  },{rootMargin:'180px 0px',threshold:0});
  frames.forEach(frame=>observer.observe(frame));
})();
