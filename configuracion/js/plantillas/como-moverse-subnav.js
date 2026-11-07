/* VCC · navegación interior de Cómo moverse: barra corporativa y sección activa */
(function () {
  "use strict";
  function init() {
    const nav = document.querySelector(".mv-subnav");
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const targets = links.map(link => document.getElementById(link.hash.slice(1)));
    const sections = targets.filter(Boolean);
    if (!sections.length) return;
    function updateHeaderHeight() {
      const header = document.querySelector(".shared-header") || document.querySelector(".page-header");
      const headerPosition = header ? window.getComputedStyle(header).position : "static";
      const height = header && (headerPosition === "sticky" || headerPosition === "fixed")
        ? Math.round(header.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty("--mv-header-height", height + "px");
      return height;
    }
    function activate(id) {
      links.forEach(link => {
        const active = link.hash === "#" + id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    let ticking = false;
    function sync() {
      const headerHeight = updateHeaderHeight();
      const line = headerHeight + nav.offsetHeight + 28;
      let active = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) active = section;
      }
      activate(active.id);
      ticking = false;
    }
    links.forEach(link => link.addEventListener("click", () => activate(link.hash.slice(1))));
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    }, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("load", sync, { once: true });
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
