/* VCC — Scripts no críticos después del primer elemento de contenido.
   Preserva el primer pintado (LCP) sin retrasar componentes visuales del HTML. */
(function () {
  'use strict';
  const own = document.currentScript;
  if (!own) return;
  const urls = (own.getAttribute('data-vcc-scripts') || '')
    .split(';').map(value => value.trim()).filter(Boolean);
  if (!urls.length) return;

  let started = false;
  let observer = null;
  let fallbackTimer = null;

  function loadScripts() {
    const next = (index) => {
      if (index >= urls.length) return;
      const script = document.createElement('script');
      script.src = urls[index];
      // Carga secuencial: dependencias compartidas antes de componentes de página.
      script.async = false;
      script.onload = () => next(index + 1);
      script.onerror = () => {
        console.warn('[VCC] No se pudo cargar el script:', urls[index]);
        next(index + 1);
      };
      document.body.appendChild(script);
    };
    next(0);
  }

  function proceed() {
    if (started) return;
    started = true;
    if (observer) observer.disconnect();
    if (fallbackTimer !== null) clearTimeout(fallbackTimer);
    // El observador de LCP se notifica después de un pintado.
    requestAnimationFrame(() => requestAnimationFrame(loadScripts));
  }

  // Como máximo 3 s: evita dejar inactivas las calculadoras/carruseles
  // si el navegador no emite LCP, por ejemplo en pestañas ocultas.
  fallbackTimer = setTimeout(proceed, 3000);
  if (typeof PerformanceObserver === 'function' &&
      PerformanceObserver.supportedEntryTypes &&
      PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
    try {
      observer = new PerformanceObserver(list => {
        if (list.getEntries().length) proceed();
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      // El fallback de tiempo sigue activo.
    }
  } else {
    // Sin API de LCP, preservar el primer renderizado y activar las interacciones.
    const onLoad = () => requestAnimationFrame(() => requestAnimationFrame(proceed));
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
  }
})();
