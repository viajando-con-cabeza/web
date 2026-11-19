(function(){
  const root='/';
  const isEnglish = /^\/en(?:\/|$)/i.test(window.location.pathname);
  const logo='/configuracion/imagenes/marca/logo-viajando-con-cabeza-blanco.svg';
  const socials={
    instagram:'https://www.instagram.com/viajaconcabeza/',
    tiktok:'https://www.tiktok.com/@viajandoconcabeza'
  };
  const icons={
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#pie-instagram"></use></svg>',
    tiktok:'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#pie-tiktok"></use></svg>',
    youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/compartidos/redes-sociales.svg#pie-youtube"></use></svg>'
  };
  const footer = isEnglish
    ? '<footer class="vcc-global-footer"><div class="vcc-gf-inner"><div class="vcc-gf-grid"><div class="vcc-gf-brand"><a href="/en/"><img src="'+logo+'" alt="Viajando con Cabeza" width="620" height="216"></a><p>At Viajando con Cabeza, we share real travel experiences and practical advice to help you travel smarter.</p></div><nav class="vcc-gf-col"><b>EXPLORE</b><a href="/en/">Home</a><a href="/en/destinos/">Destinations</a><a href="/en/itinerarios/">Itineraries</a><a href="/en/planifica/">Plan your trip</a><a href="/en/nosotros/">About us</a><a href="/en/contacto/">Contact</a><a href="/en/politica-de-privacidad/">Privacy policy</a></nav><nav class="vcc-gf-col"><b>POPULAR DESTINATIONS</b><a href="/en/destinos/italia/roma/">Rome</a><a href="/en/destinos/indonesia/">Bali</a><a href="/en/destinos/suecia/">Sweden</a><a href="/en/destinos/francia/paris/">Paris</a><a href="/en/destinos/eeuu/">New York</a><a href="/en/destinos/">View all</a></nav><div class="vcc-gf-col"><b>FOLLOW US</b><div class="vcc-gf-social"><a href="'+socials.instagram+'" target="_blank" rel="noopener noreferrer" aria-label="Instagram">'+icons.instagram+'</a><a href="'+socials.tiktok+'" target="_blank" rel="noopener noreferrer" aria-label="TikTok">'+icons.tiktok+'</a><span class="vcc-social-unavailable" role="img" aria-label="YouTube Shorts, link unavailable">'+icons.youtube+'</span></div></div></div><div class="vcc-gf-copy">© 2026 Viajando con Cabeza. All rights reserved. ♡</div></div></footer>'
    : '<footer class="vcc-global-footer"><div class="vcc-gf-inner"><div class="vcc-gf-grid"><div class="vcc-gf-brand"><a href="/" aria-label="Viajando con Cabeza, inicio"><img src="'+logo+'" alt="Viajando con Cabeza" width="620" height="216"></a><p>En Viajando con Cabeza compartimos experiencias reales, rutas y consejos para ayudarte a viajar mejor y gastar menos.</p></div><nav class="vcc-gf-col" aria-label="Enlaces"><b>ENLACES</b><a href="/">Inicio</a><a href="/destinos/">Destinos</a><a href="/itinerarios/">Itinerarios</a><a href="/planifica/">Planifica</a><a href="/nosotros/">Nosotros</a><a href="/contacto/">Contacto</a><a href="/politica-de-privacidad/">Política de privacidad</a></nav><nav class="vcc-gf-col" aria-label="Destinos populares"><b>DESTINOS POPULARES</b><a href="/destinos/italia/roma/">Roma</a><a href="/destinos/indonesia/">Bali</a><a href="/destinos/suecia/">Suecia</a><a href="/destinos/francia/paris/">París</a><a href="/destinos/eeuu/">Nueva York</a><a href="/destinos/">Ver todos</a></nav><div class="vcc-gf-col"><b>SÍGUENOS</b><div class="vcc-gf-social"><a href="'+socials.instagram+'" target="_blank" rel="noopener noreferrer" aria-label="Instagram">'+icons.instagram+'</a><a href="'+socials.tiktok+'" target="_blank" rel="noopener noreferrer" aria-label="TikTok">'+icons.tiktok+'</a><span class="vcc-social-unavailable" role="img" aria-label="YouTube Shorts, sin enlace">'+icons.youtube+'</span></div></div></div><div class="vcc-gf-copy">© 2026 Viajando con Cabeza. Todos los derechos reservados. ♡</div></div></footer>'
  const footerCSSPath='/configuracion/css/componentes/site-footer-vcc.css?v=20261118-social-shorts-v2';
  function render(){
    const footerUpdated=footer.replace('© 2026','© '+new Date().getFullYear());
    const old=document.querySelector('footer');
    if(old)old.outerHTML=footerUpdated;else document.body.insertAdjacentHTML('beforeend',footerUpdated);
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