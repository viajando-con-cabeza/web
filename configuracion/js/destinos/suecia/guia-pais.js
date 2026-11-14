/* Navegació compartida de les guies generals de Suècia.
   Manté el subheader coherent amb les pàgines d'Estocolm. */
(()=>{
  function init(){
    const nav=document.querySelector('.sw-guide-subnav');
    if(!nav)return;
    const links=[...nav.querySelectorAll('a[href^="#"]')];
    const targets=links.map(a=>({a,el:document.getElementById(a.hash.slice(1))})).filter(x=>x.el);
    if(!targets.length)return;
    const activate=(a)=>{
      links.forEach(link=>{
        if(link===a)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    };
    links.forEach(a=>a.addEventListener('click',()=>activate(a)));
    let ticking=false;
    function onScroll(){
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(()=>{
        ticking=false;
        const limit=window.innerWidth<768?180:145;
        let current=targets[0].a;
        for(const item of targets)if(item.el.getBoundingClientRect().top<=limit)current=item.a;
        activate(current);
      });
    }
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    onScroll();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
