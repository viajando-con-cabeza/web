/* VCC: one canonical URL per itinerary. Legacy ?dias=2/3/4 is not a distinct page. */
(() => {
  const path = window.location.pathname;
  if (!/\/itinerario(?:\.html)?\/?$/.test(path)) return;
  const url = new URL(window.location.href);
  const legacyDays = url.searchParams.has('dias');
  const legacyHtml = /\/itinerario\.html\/?$/.test(path);
  if (!legacyDays && !legacyHtml) return;
  url.searchParams.delete('dias');
  const target = (legacyHtml ? path.replace(/\/itinerario\.html\/?$/, '/itinerario') : path)
    + url.search + url.hash;
  window.history.replaceState(window.history.state, '', target);
})();
