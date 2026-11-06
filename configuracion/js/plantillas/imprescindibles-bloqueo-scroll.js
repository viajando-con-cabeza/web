/* VCC · Bloqueo compartido del desplazamiento exterior a la galería.
   Conserva exactamente la posición anterior de la guía al cerrar el visor.
   Las zonas internas con scroll siguen funcionando. */
(() => {
  'use strict';
  if (window.VCCGalleryScrollLock) return;
  const owners = new Set();
  let saved = null;
  const html = document.documentElement;
  const body = document.body;
  const bodyProps = ['position','top','left','right','width','overflow','overscrollBehavior'];
  const htmlProps = ['overflow','overscrollBehavior','scrollBehavior'];
  const capture = (element, names) => Object.fromEntries(names.map(name => [name,element.style[name]]));
  const restore = (element, props) => Object.entries(props).forEach(([name,value]) => {element.style[name]=value;});

  function acquire(owner) {
    if (owners.has(owner)) return;
    if (!owners.size) {
      saved = {
        y: window.scrollY,
        x: window.scrollX,
        html: capture(html,htmlProps),
        body: capture(body,bodyProps)
      };
      html.style.scrollBehavior = 'auto';
      html.style.overflow = 'hidden';
      html.style.overscrollBehavior = 'none';
      body.style.position = 'fixed';
      body.style.top = '-' + saved.y + 'px';
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
    }
    owners.add(owner);
  }
  function release(owner) {
    if (!owners.delete(owner) || owners.size || !saved) return;
    const previous=saved;
    saved=null;
    restore(body,previous.body);
    restore(html,previous.html);
    window.scrollTo(previous.x,previous.y);
  }
  /* Fuera de los paneles que deben desplazarse no permitimos que la rueda
     llegue a la página de fondo ni al backdrop del modal. */
  document.addEventListener('wheel',event => {
    if (!owners.size) return;
    // Ctrl + rodeta (Windows/Edge) i gest de pinça del trackpad:
    // mai interceptem el zoom natiu del navegador, tampoc sobre la foto.
    if (event.ctrlKey || event.metaKey) return;
    const scrollable = event.target instanceof Element && event.target.closest(
      '#vcc-desktop-gallery .vcc-dg-scroll,'+
      '#vcc-desktop-gallery .vcc-dg-sidebar,'+
      '#vcc-mobile-gallery .vcc-mobile-gallery-scroll,'+
      '#lightbox .lb-place-info,'+
      '#lightbox .lb-thumbs'
    );
    if (!scrollable) event.preventDefault();
  }, {capture:true,passive:false});
  window.VCCGalleryScrollLock = {acquire,release};
})();
