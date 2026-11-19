/* VCC · Selector compartit de mesos visitats per a les guies "Cuándo ir".
 * La font de veritat són els panells editorials [data-vcc-visit-panel][data-vcc-visit-month].
 * Per afegir una nova visita, afegir el seu panell (1-12) amb text i fotos reals.
 * Els filtres i les etiquetes ES/EN es generen sense duplicar dades ni inventar visites. */
(() => {
  'use strict';
  function init() {
    const section = document.getElementById('experiencia');
    const tabs = section && section.querySelector('[data-vcc-visit-tabs]');
    if (!tabs) return;

    const lang = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'es';
    const locale = lang === 'en' ? 'en-GB' : 'es-ES';
    const rawPanels = [...section.querySelectorAll('[data-vcc-visit-panel][data-vcc-visit-month]')];
    const seen = new Set();
    const visits = rawPanels.map(panel => {
      const month = Number(panel.dataset.vccVisitMonth);
      if (!Number.isInteger(month) || month < 1 || month > 12 || seen.has(month)) return null;
      seen.add(month);
      const label = new Intl.DateTimeFormat(locale, {month:'long'}).format(new Date(2026, month-1, 1));
      return {month, label, panel};
    }).filter(Boolean);
    if (!visits.length) return;

    const monthText = visits.map(v => v.label);
    const monthList = new Intl.ListFormat(locale, {style:'long', type:'conjunction'}).format(monthText);
    // Explicació editorial: una visita es redacta al HTML per garantir SEO i lectura
    // sense JS. Amb diverses visites s'actualitza amb les èpoques i els motius
    // documentats en cada panell (data-vcc-visit-purpose), sense inventar viatges.
    const intro = section.querySelector('[data-vcc-visit-intro]');
    const destination = (section.dataset.vccVisitDestination || '').trim();
    if (intro && destination && visits.length > 1) {
      const visitDetails = visits.map(({label, panel}) => {
        const purpose = (panel.dataset.vccVisitPurpose || '').trim();
        return lang === 'en'
          ? 'in ' + label + (purpose ? ' to ' + purpose : '')
          : 'en ' + label + (purpose ? ' para ' + purpose : '');
      });
      const details = new Intl.ListFormat(locale, {style:'long', type:'conjunction'}).format(visitDetails);
      intro.textContent = lang === 'en'
        ? "We've visited " + destination + ' ' + details + '. Choose a month to see our own photos, experiences and tips.'
        : 'Hemos visitado ' + destination + ' ' + details + '. Elige un mes para descubrir nuestras fotos, vivencias y consejos reales de cada viaje.';
    }
    if (visits.length > 1) {
      const chip = document.querySelector('.ci-visit-chip');
      if (chip) {
        const strong = chip.querySelector('strong');
        if (strong) strong.textContent = monthList.toUpperCase();
        const plane = chip.querySelector('span[aria-hidden]');
        if (plane && plane.nextSibling) plane.nextSibling.textContent = lang === 'en' ? ' WE VISITED IN ' : ' VIAJAMOS EN ';
      }
      const mobileNote = document.querySelector('.ci-visit-mobile-note strong');
      if (mobileNote) mobileNote.textContent = (lang === 'en' ? 'We visited in ' : 'Viajamos en ') + monthList;
    }

    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', lang === 'en' ? 'Months we visited' : 'Meses en los que viajamos');
    tabs.replaceChildren();
    const buttons = visits.map(({month, label, panel}) => {
      const id = 'vcc-visit-month-' + month;
      if (!panel.id) panel.id = 'vcc-visit-panel-' + month;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', id);
      panel.setAttribute('tabindex', '0');
      const button = document.createElement('button');
      button.type = 'button';
      button.id = id;
      button.className = 'vcc-visit-tab';
      button.dataset.vccVisitMonth = String(month);
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', panel.id);
      button.textContent = label;
      tabs.append(button);
      return button;
    });

    function show(index, focus) {
      visits.forEach((visit, i) => {
        const active = index === i;
        visit.panel.hidden = !active;
        buttons[i].setAttribute('aria-selected', String(active));
        buttons[i].tabIndex = active ? 0 : -1;
      });
      if (focus) buttons[index].focus({preventScroll:true});
    }
    tabs.addEventListener('click', event => {
      const button = event.target.closest('button[data-vcc-visit-month]');
      const index = buttons.indexOf(button);
      if (index >= 0) show(index, false);
    });
    tabs.addEventListener('keydown', event => {
      const index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      show(next, true);
    });

    // Les pestanyes del calendari d'altres mesos només es marquen si hi ha relat real.
    if (visits.length > 1) {
      document.querySelectorAll('.ci-month-result[data-month-panel]').forEach(monthPanel => {
        const month = Number(monthPanel.dataset.monthPanel) + 1;
        if (!seen.has(month) || monthPanel.querySelector('.ci-month-visited')) return;
        const left = monthPanel.querySelector('.ci-month-left');
        if (!left) return;
        const note = document.createElement('p');
        note.className = 'ci-month-visited';
        note.textContent = lang === 'en' ? '✈ We visited in this month. See our experience below.' : '✈ Viajamos en este mes. Descubre nuestra experiencia debajo.';
        left.append(note);
      });
    }
    show(0, false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
