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
  const afterPaint = () => requestAnimationFrame(() => requestAnimationFrame(start));
  if (document.readyState === 'complete') afterPaint();
  else window.addEventListener('load', afterPaint, { once: true });
})();
