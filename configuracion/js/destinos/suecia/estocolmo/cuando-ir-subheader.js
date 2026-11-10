/* Cuándo ir · Estocolmo | Fuente única de la lógica de página.
   Mantener en configuracion para permitir ajustes sin editar el HTML editorial. */
/* Mantener el subheader visible bajo la cabecera incluso al desplazarse. */
(function(){
  function init(){
    const nav=document.querySelector('.ci-subnav');
    if(!nav)return;
    const anchor=document.createElement('div');
    anchor.className='ci-subnav-placeholder';
    anchor.setAttribute('aria-hidden','true');
    nav.parentNode.insertBefore(anchor,nav);
    const header=document.querySelector('.shared-header, .page-header');
    let base=0,scrollFrame=0;
    const root=document.documentElement;
    function refreshBase(){
      if(scrollFrame){cancelAnimationFrame(scrollFrame);scrollFrame=0;}
      nav.classList.remove('ci-subnav-pinned');
      anchor.style.height='0px';
      base=nav.getBoundingClientRect().top+window.scrollY;
      sync();
    }
    function sync(){
      const headerBottom=header?Math.max(0,header.getBoundingClientRect().bottom):0;
      const shouldPin=window.scrollY+headerBottom>=base;
      const top=headerBottom+'px';
      if(nav.style.getPropertyValue('--ci-nav-top')!==top)
        nav.style.setProperty('--ci-nav-top',top);
      if(nav.classList.contains('ci-subnav-pinned')!==shouldPin)
        nav.classList.toggle('ci-subnav-pinned',shouldPin);
      const navHeight=nav.offsetHeight;
      const placeholderHeight=shouldPin?navHeight+'px':'0px';
      if(anchor.style.height!==placeholderHeight)anchor.style.height=placeholderHeight;
      const stickyOffset=(headerBottom+navHeight+14)+'px';
      if(root.style.getPropertyValue('--ci-sticky-offset')!==stickyOffset)
        root.style.setProperty('--ci-sticky-offset',stickyOffset);
    }
    // Evitar lecturas de layout y escrituras repetidas por cada evento de rueda,
    // gesto de trackpad o desplazamiento: un cálculo máximo por frame.
    function scheduleSync(){
      if(scrollFrame)return;
      scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;sync();});
    }
    // Anclajes precisos: el sobretítulo de estas dos secciones debe quedar
    // justo debajo del header y la barra blanca, no a mitad de pantalla.
    // No cambiamos los demás enlaces ni el scrollspy compartido.
    nav.addEventListener('click',event=>{
      const link=event.target.closest('a[href="#experiencia"],a[href="#errores"]');
      if(!link||!nav.contains(link))return;
      const section=document.getElementById(link.hash.slice(1));
      const heading=section?.querySelector(':scope > .ci-heading');
      if(!heading)return;
      event.preventDefault();
      const headerBottom=header?Math.max(0,header.getBoundingClientRect().bottom):0;
      const clearTop=headerBottom+nav.getBoundingClientRect().height+12;
      const y=Math.max(0,window.scrollY+heading.getBoundingClientRect().top-clearTop);
      window.scrollTo({top:y,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      history.replaceState(null,'',link.hash);
    });
    window.addEventListener('scroll',scheduleSync,{passive:true});
    window.addEventListener('resize',refreshBase,{passive:true});
    window.addEventListener('load',refreshBase,{once:true});
    requestAnimationFrame(refreshBase);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
