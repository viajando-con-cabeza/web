(function(){
  const root='/';
  const isEnglish = /^\/en(?:\/|$)/i.test(window.location.pathname);
  const logo='/configuracion/imagenes/marca/logo-viajando-con-cabeza-blanco.svg';
  const socials={
    instagram:'https://www.instagram.com/viajaconcabeza/',
    tiktok:'https://www.tiktok.com/@viajaconcabeza',
    youtube:'https://www.youtube.com/@viajaconcabeza'
  };
  const icons={
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#pie-instagram"></use></svg>',
    tiktok:'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#pie-tiktok"></use></svg>',
    youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#pie-youtube"></use></svg>'
  };
  const footer = isEnglish
    ? '<footer class="vcc-global-footer"><div class="vcc-gf-inner"><div class="vcc-gf-grid"><div class="vcc-gf-brand"><a href="/en/"><img src="'+logo+'" alt="Viajando con Cabeza" width="620" height="216"></a><p>At Viajando con Cabeza, we share real travel experiences and practical advice to help you travel smarter.</p></div><nav class="vcc-gf-col"><b>EXPLORE</b><a href="/en/">Home</a><a href="/en/coming-soon/">Destinations</a><a href="/en/coming-soon/">Itineraries</a><a href="/en/coming-soon/">Plan your trip</a><a href="/en/about/">About us</a><a href="/en/contact/">Contact</a><a href="/politica-de-privacidad/">Privacy policy</a></nav><nav class="vcc-gf-col"><b>POPULAR DESTINATIONS</b><a href="/en/coming-soon/">Rome</a><a href="/en/coming-soon/">Bali</a><a href="/en/coming-soon/">Sweden</a><a href="/en/coming-soon/">Paris</a><a href="/en/coming-soon/">New York</a><a href="/en/coming-soon/">View all</a></nav><div class="vcc-gf-col"><b>FOLLOW US</b><div class="vcc-gf-social"><a href="'+socials.instagram+'" target="_blank" rel="noopener noreferrer" aria-label="Instagram">'+icons.instagram+'</a><a href="'+socials.tiktok+'" target="_blank" rel="noopener noreferrer" aria-label="TikTok">'+icons.tiktok+'</a><a href="'+socials.youtube+'" target="_blank" rel="noopener noreferrer" aria-label="YouTube">'+icons.youtube+'</a></div></div></div><div class="vcc-gf-copy">© 2026 Viajando con Cabeza. All rights reserved. ♡</div></div></footer>'
    : '<footer class="vcc-global-footer"><div class="vcc-gf-inner"><div class="vcc-gf-grid"><div class="vcc-gf-brand"><a href="/" aria-label="Viajando con Cabeza, inicio"><img src="'+logo+'" alt="Viajando con Cabeza" width="620" height="216"></a><p>En Viajando con Cabeza compartimos experiencias reales, rutas y consejos para ayudarte a viajar mejor y gastar menos.</p></div><nav class="vcc-gf-col" aria-label="Enlaces"><b>ENLACES</b><a href="/">Inicio</a><a href="/destinos/">Destinos</a><a href="/itinerarios/">Itinerarios</a><a href="/planifica/">Planifica</a><a href="/nosotros/">Nosotros</a><a href="/contacto/">Contacto</a><a href="/politica-de-privacidad/">Política de privacidad</a></nav><nav class="vcc-gf-col" aria-label="Destinos populares"><b>DESTINOS POPULARES</b><a href="/destinos/italia/roma/">Roma</a><a href="/destinos/indonesia/">Bali</a><a href="/destinos/suecia/">Suecia</a><a href="/destinos/francia/paris/">París</a><a href="/destinos/eeuu/">Nueva York</a><a href="/destinos/">Ver todos</a></nav><div class="vcc-gf-col"><b>SÍGUENOS</b><div class="vcc-gf-social"><a href="'+socials.instagram+'" target="_blank" rel="noopener noreferrer" aria-label="Instagram">'+icons.instagram+'</a><a href="'+socials.tiktok+'" target="_blank" rel="noopener noreferrer" aria-label="TikTok">'+icons.tiktok+'</a><a href="'+socials.youtube+'" target="_blank" rel="noopener noreferrer" aria-label="YouTube">'+icons.youtube+'</a></div></div></div><div class="vcc-gf-copy">© 2026 Viajando con Cabeza. Todos los derechos reservados. ♡</div></div></footer>'
  const footerCSSPath='/configuracion/css/componentes/site-footer-vcc.css?v=20261111-shared-v1';
  // Política editorial común a las páginas: fechas reales frente a tarifas orientativas.
  const inStockholm = window.location.pathname === '/destinos/suecia/estocolmo' || window.location.pathname.startsWith('/destinos/suecia/estocolmo/');
  const travelPolicy = isEnglish
    ? '<strong>OUR TRAVEL DATA ·</strong> Prices are indicative, based on trips and quoted rates—not annual averages. We review local inflation, prices, schedules, passes and availability each January 1. Check before booking.'
    : inStockholm
      ? '<strong>ESTOCOLMO · Viajamos del 24 al 26 de agosto de 2026 ·</strong> Gastos reales y tarifas consultadas para esas fechas, no medias anuales. Cada 1 de enero revisamos IPC local, precios, horarios, pases y disponibilidad. Confirma antes de reservar.'
      : '<strong>CÓMO ACTUALIZAMOS VCC ·</strong> Precios orientativos según viajes reales y tarifas consultadas, no medias anuales salvo indicación. Cada 1 de enero revisamos IPC local, precios, horarios, pases y disponibilidad. Confirma antes de reservar.';

  function render(){
    const footerWithPolicy=footer.replace('© 2026','© '+new Date().getFullYear()).replace('<div class="vcc-gf-copy">','<p class="vcc-gf-policy">'+travelPolicy+'</p><div class="vcc-gf-copy">');
    const old=document.querySelector('footer');
    if(old)old.outerHTML=footerWithPolicy;else document.body.insertAdjacentHTML('beforeend',footerWithPolicy);
    if(!document.getElementById('vcc-global-footer-css')){
      const s=document.createElement('link');
      s.id='vcc-global-footer-css';
      s.rel='stylesheet';
      s.href=footerCSSPath;
      // En Presupuesto el footer està fora del primer viewport. Evitem que el
      // CSS de peu de pàgina bloquegi l'LCP; en carregar-se recupera media=all.
      if(document.body.classList.contains('budget-vcc')){
        s.media='print';
        s.addEventListener('load',()=>{s.media='all';},{once:true});
      }
      document.head.appendChild(s);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();