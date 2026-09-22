/* VCC — plantilla común de país. El contenido vive en web/content/. */
(function () {
  'use strict';
  function render() {
    const country = window.VCC_COUNTRY_CONTENT || window.SWEDEN_CONTENT;
    const parts = window.VCCCountryComponents;
    const root = document.getElementById('country-content');
    if (!root || !country || !parts) {
      console.error('VCC: faltan el contenido, los componentes o el contenedor de la guía de país.');
      return;
    }
    const {esc,guide,itinerary,carousel,faqCard,prepCard,pillGroup} = parts;
    const name = esc(country.name);
    const facts = (country.facts || []).map(item => `<div class="country-fact"><strong>${esc(item[0])}</strong><span>${esc(item[1])}</span></div>`).join('');
    const guides = (country.guides || []).map(guide).join('');
    const itineraries = (country.itineraries || []).map(itinerary).join('');
    const faq = (country.faq || []).map(faqCard).join('');
    const prep = (country.preparation || []).map(prepCard).join('');
    const planner = country.planner;
    const plannerHtml = planner ? `<section id="planificador" class="sweden-route-tool"><div class="route-tool-kicker">PLANIFICADOR VCC</div><div class="country-heading tool-heading"><div><p>Tu viaje, a tu medida</p><h2>ENCUENTRA TU RUTA IDEAL</h2></div><span>Elige cuatro cosas y te proponemos una ruta para empezar a organizar el viaje.</span></div><div class="sweden-planner" data-sweden-planner><form class="planner-form">${pillGroup(1,'¿Cuántos días quieres dedicar?','days',planner.days || [],false)}${pillGroup(2,'¿Qué quieres encontrar en el viaje?','interest',planner.interests || [],true)}${pillGroup(3,'¿Cómo prefieres moverte?','transport',planner.transports || [],false)}${pillGroup(4,'¿En qué época viajarás?','season',planner.seasons || [],false)}<div class="planner-submit-row"><button type="submit">VER MI RUTA →</button><span>Tarda menos de un minuto</span></div></form><div class="planner-result" hidden></div></div></section>` : '';
    root.innerHTML = `
<section class="country-hero" style="background-image:url('${esc(country.heroImage)}')"><div class="country-hero-inner"><div class="country-breadcrumb"><a href="/">Inicio</a><span>›</span><a href="/destinos/">Destinos</a><span>›</span><strong>${name}</strong></div><div class="country-hero-card"><div class="country-eyebrow">📍 ${esc(country.continent).toUpperCase()}</div><h1>${name.toUpperCase()}</h1><p class="country-script">${esc(country.tagline)}</p><p class="country-desc">${esc(country.description)}</p><div class="country-facts">${facts}</div><a class="hero-start" href="#guias">EMPIEZA A EXPLORAR ↓</a></div></div></section>
<nav class="country-nav"><div class="country-nav-inner"><a href="#guias">GUÍAS</a><a href="#itinerarios">ITINERARIOS</a><a href="#faq">FAQ</a><a href="#planifica">PREPARA TU VIAJE</a>${planner ? '<a href="#planificador" class="nav-planner">TU RUTA</a>' : ''}</div></nav>
<main class="country-main sweden-main">
<section id="guias"><div class="country-heading"><div><p>Descubre ${name}</p><h2>GUÍAS DE VIAJE</h2></div><span>Ciudades, regiones y rincones para encontrar la ${name} que mejor encaja contigo.</span></div>${carousel(guides,'guides')}<button class="vcc-rating-info" type="button" data-rating-info aria-expanded="false">¿Cómo calculamos la Nota VCC? <span>＋</span></button><div class="vcc-rating-note" data-rating-note hidden><strong>Una nota editorial VCC.</strong> Valoramos qué ver y hacer, gastronomía, transporte, seguridad, calidad-precio, fotogenia y experiencia global. No es una puntuación de usuarios.</div></section>
<section id="itinerarios" class="sweden-itineraries-section"><div class="country-heading"><div><p>Combina las piezas</p><h2>ITINERARIOS EN ${name.toUpperCase()}</h2></div><span>Rutas listas para organizar el viaje según los días que tengas.</span></div>${carousel(itineraries,'itineraries')}</section>
<section id="faq" class="sweden-faq-section"><div class="country-heading"><div><p>Antes de viajar</p><h2>PREGUNTAS FRECUENTES</h2></div><span>Siete respuestas rápidas a las dudas prácticas más habituales antes de viajar.</span></div><div class="faq-carousel-wrap"><button class="carousel-arrow prev" data-faq-prev aria-label="Pregunta anterior">←</button><div class="faq-carousel" data-faq-carousel>${faq}</div><button class="carousel-arrow next" data-faq-next aria-label="Pregunta siguiente">→</button></div></section>
<section id="planifica" class="sweden-plan-section"><div class="country-heading prep-heading"><div><p>Organiza ${name} a tu manera</p><h2>PREPARA TU VIAJE</h2></div><span>Nuestra respuesta corta para las decisiones que más cambian una ruta por ${name}.</span></div><div class="prep-grid">${prep}</div></section>
${plannerHtml}
</main>`;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',render);
  else render();
})();
