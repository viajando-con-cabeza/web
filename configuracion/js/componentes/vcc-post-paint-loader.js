/* VCC - Carga secuencial de scripts no críticos tras la primera pintura.
   Los componentes HTML/CSS visibles siguen disponibles antes de activar interacciones. */
(function () {
  'use strict';
  const own = document.currentScript;
  if (!own) return;
  const urls = (own.getAttribute('data-vcc-scripts') || '')
    .split(';').map(value => value.trim()).filter(Boolean);
  if (!urls.length) return;
  const start = () => {
    const next = (index) => {
      if (index >= urls.length) return;
      const script = document.createElement('script');
      script.src = urls[index];
      script.async = false;
      script.onload = () => next(index + 1);
      script.onerror = () => {
        console.warn('[VCC] No se pudo cargar el script:', urls[index]);
        next(index + 1);
      };
      document.body.appendChild(script);
    };
    next(0);
  };
  const afterPaint = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    // Diagnóstico opt-in: permite aislar efectos de JS sin modificar la carga habitual.
    const probeDelay = Number(new URLSearchParams(location.search).get('__vcc_script_delay'));
    if(probeDelay > 0 && probeDelay <= 10000) setTimeout(start,probeDelay);
    else start();
  }));
  if (document.readyState === 'complete') afterPaint();
  else window.addEventListener('load', afterPaint, { once: true });
})();
