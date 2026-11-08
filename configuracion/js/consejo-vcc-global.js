/* VCC · normalización central de los cuadros "Consejo VCC".
   No altera el texto editorial ni los bloques sin la etiqueta VCC. */
(function () {
  'use strict';

  const selector = [
    '.ci-recommendation',
    '.day-tip',
    '.dv-advice',
    '.cl-landing-recommendation',
    '.ep-vcc-advice',
    '.imp-page .advice',
    '.cl-vcc',
    '.cl-panel.cl-tip',
    '.box.tip'
  ].join(', ');

  const officialLogo = '/configuracion/imagenes/marca/logo-vcc.svg';
  const labelPattern = /^(?:(?:NUESTRO|NUESTRA)\s+)?CONSEJOS?\s+VCC$/i;

  function isAdviceLabel(node) {
    if (!node || !node.textContent || node.closest('a, button, nav')) return false;
    const clean = node.textContent.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    return labelPattern.test(clean);
  }

  function normalize(root) {
    if (!root || root.dataset.vccConsejoUniforme === '1') return;
    const label = Array.from(root.querySelectorAll('strong, b, small, h2, h3, h4, span'))
      .find(isAdviceLabel);
    if (!label) return;
    root.dataset.vccConsejoUniforme = '1';

    let brand = root.querySelector(':scope > .ci-recommendation-brand, :scope > .dv-advice-head, :scope > .vcc-consejo-marca');
    if (!brand) {
      brand = document.createElement('div');
      root.insertBefore(brand, root.firstChild);
    }
    brand.classList.add('vcc-consejo-marca');

    let logo = root.querySelector('img[src*="logo-vcc"], img.vcc-advice-logo, img.cl-advice-logo, img.ep-vcc-advice-logo');
    if (!logo) {
      logo = document.createElement('img');
    }
    logo.src = officialLogo;
    logo.alt = '';
    logo.width = 52;
    logo.height = 52;
    logo.decoding = 'async';
    brand.appendChild(logo);

    // Una única etiqueta consistente, siempre debajo de la imagen.
    label.remove();
    const caption = document.createElement('strong');
    caption.textContent = 'CONSEJO VCC';
    brand.appendChild(caption);

    root.classList.add('vcc-consejo-unificado');
    if (!root.hasAttribute('aria-label')) {
      root.setAttribute('aria-label', 'Consejo VCC');
    }

    // El bloque "Cuándo ir" ya tiene una estructura editorial de 3 columnas.
    // Conservamos título, descripción y motivos en sus columnas originales.
    if (root.classList.contains('ci-recommendation')) return;

    const oldPlane = root.querySelector(':scope > .cl-vcc-icon, :scope > .paper-plane');
    if (oldPlane) oldPlane.remove();

    // El resto de tarjetas usa dos columnas: marca y contenido flexible.
    // Agrupar los nodos evita que una segunda línea desplace la marca.
    const copy = document.createElement('div');
    copy.className = 'vcc-consejo-texto';
    for (const child of Array.from(root.childNodes)) {
      if (child !== brand) copy.appendChild(child);
    }
    root.appendChild(copy);
  }

  function scan(container) {
    if (!container || !container.querySelectorAll) return;
    if (container.nodeType === 1 && container.matches(selector)) normalize(container);
    container.querySelectorAll(selector).forEach(normalize);
  }

  function start() {
    scan(document);
    // La galería de imprescindibles crea fichas dinámicamente.
    // Observar solo esa zona evita trabajo continuo en el resto del blog.
    const gallery = document.querySelector('.imp-page');
    if (!gallery || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(function (records) {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches('.advice') || node.querySelector('.advice')) scan(node);
        }
      }
    });
    observer.observe(gallery, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }
})();