/* VCC — componentes reutilizables para las guías de país. */
(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const weights = {experience:25,photogenic:20,things:15,food:10,transport:10,safety:10,value:10};
  const rating = scores => Object.keys(weights).reduce((sum,key) => sum + (Number(scores && scores[key]) || 0) * weights[key] / 100, 0);
  const fmt = number => number.toFixed(1).replace('.', ',');
  const label = number => number >= 9.5 ? 'Excepcional · Espectacular' : number >= 9 ? 'Fantástico' : number >= 8.5 ? 'Fabuloso' : number >= 8 ? 'Muy bien' : number >= 7.5 ? 'Bien' : number >= 7 ? 'Agradable' : 'Mejorable';
  const image = (src, alt) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;
  function guide(g) {
    const score = rating(g.scores);
    return `<article class="country-guide-card"><div class="guide-image-wrap">${image(g.image,g.title)}<div class="guide-score"><strong>${fmt(score)}</strong><span>${label(score)}</span></div></div><div class="country-guide-copy"><span class="tag">${esc(g.tag)}</span><h3>${esc(g.title).toUpperCase()}</h3><p>${esc(g.text)}</p><div class="country-meta"><span>◷ ${esc(g.days)}</span></div>${g.available && g.href ? `<a class="country-btn" href="${esc(g.href)}">VER GUÍA →</a>` : '<a class="country-soon" href="/proximamente/">PRÓXIMAMENTE</a>'}</div></article>`;
  }
  function itinerary(item) {
    return `<article class="country-itinerary">${image(item.image,item.title)}<div class="country-itinerary-copy"><span class="tag">${esc(item.tag)}</span><h3>${esc(item.title).toUpperCase()}</h3><p>${esc(item.text)}</p>${item.available && item.href ? `<a class="country-btn" href="${esc(item.href)}">VER ITINERARIO →</a>` : '<a class="country-soon" href="/proximamente/">PRÓXIMAMENTE</a>'}</div></article>`;
  }
  function carousel(items,type) {
    return `<div class="sweden-carousel-wrap"><button class="carousel-arrow prev" data-carousel-prev aria-label="Anterior">←</button><div class="sweden-carousel" data-carousel="${esc(type)}">${items}</div><button class="carousel-arrow next" data-carousel-next aria-label="Siguiente">→</button></div>`;
  }
  function faqCard(item) {
    return `<article><div class="faq-icon">${esc(item.icon)}</div><h3>${esc(item.question).toUpperCase()}</h3><p>${esc(item.answer)}</p></article>`;
  }
  function prepCard(item) {
    const body = `<article><div class="prep-top"><div class="prep-icon">${esc(item.icon)}</div></div><span>${esc(item.eyebrow)}</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p><strong>${esc(item.recommendation)}</strong><small>${esc(item.note)}</small>${item.available && item.href ? '<span class="country-btn prep-guide-btn">VER GUÍA →</span>' : '<span class="country-soon prep-soon">PRÓXIMAMENTE</span>'}</article>`;
    return item.available && item.href ? `<a class="prep-pick is-ready" href="${esc(item.href)}">${body}</a>` : `<div class="prep-pick is-soon">${body}</div>`;
  }
  function pillGroup(step,title,name,options,multiple) {
    return `<fieldset class="planner-step planner-pill-row"><legend><b>${step}</b>${esc(title)}</legend><div class="planner-checks">${options.map((option,index) => `<label><input type="${multiple ? 'checkbox' : 'radio'}" name="${esc(name)}" value="${esc(option.value)}" ${!multiple && index === 0 ? 'checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}</div></fieldset>`;
  }
  window.VCCCountryComponents = Object.freeze({esc,guide,itinerary,carousel,faqCard,prepCard,pillGroup});
})();
