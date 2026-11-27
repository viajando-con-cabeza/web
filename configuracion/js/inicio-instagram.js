/* VCC · feed de Instagram autorizado. Sin tokens ni llamadas a Meta desde el navegador.
 * El fichero público lo genera el servidor mediante Instagram API.
 * Sin datos reales se mantiene la vista editorial de inspiración.
 */
(() => {
  "use strict";
  const image = document.querySelector("[data-instagram-image]");
  const card = document.querySelector("[data-instagram-post]");
  const caption = document.querySelector("[data-instagram-caption]");
  const placeholder = document.querySelector("[data-instagram-placeholder]");
  const nav = document.querySelector("[data-instagram-navigation]");
  const counter = document.querySelector("[data-instagram-counter]");
  if (!image || !card || !caption) return;

  const profileUrl = "https://www.instagram.com/viajaconcabeza/";
  const originalImage = image.getAttribute("src");
  const previous = nav?.querySelector("[data-instagram-prev]");
  const next = nav?.querySelector("[data-instagram-next]");
  let posts = [];
  let active = 0;
  let failed = 0;
  let connected = false;

  function validPostUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        ["instagram.com", "www.instagram.com"].includes(url.hostname) &&
        /^\/(?:p|reel|tv)\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname);
    } catch { return false; }
  }

  function validPhotoUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !!url.hostname &&
        !["localhost", "127.0.0.1"].includes(url.hostname) &&
        !url.username && !url.password;
    } catch { return false; }
  }

  function render(index) {
    active = (index + posts.length) % posts.length;
    const post = posts[active];
    card.href = post.permalink;
    card.setAttribute("aria-label", "Ver publicación " + (active + 1) + " de " + posts.length + " en Instagram");
    image.alt = typeof post.alt === "string" && post.alt.trim()
      ? post.alt.slice(0, 180)
      : "Publicación de @viajaconcabeza en Instagram";
    caption.textContent = typeof post.caption === "string" && post.caption.trim()
      ? post.caption.trim().slice(0, 160)
      : "Ver la publicación en Instagram";
    if (counter) {
      counter.hidden = posts.length < 2;
      counter.textContent = (active + 1) + " / " + posts.length;
    }
    image.src = post.thumbnail_url;
  }

  function restoreFallback() {
    connected = false;
    posts = [];
    image.src = originalImage;
    image.alt = "Imagen de inspiración de Viajando con Cabeza";
    card.href = profileUrl;
    card.setAttribute("aria-label", "Abrir el perfil de Viajando con Cabeza en Instagram");
    caption.textContent = "Descubre nuestras publicaciones y rutas en Instagram.";
    if (nav) nav.hidden = true;
    if (counter) counter.hidden = true;
    if (placeholder) placeholder.hidden = false;
  }

  // Las imágenes CDN de Meta pueden caducar; nunca dejar una foto rota.
  image.addEventListener("error", () => {
    if (!connected) return;
    failed += 1;
    if (failed < posts.length) render(active + 1);
    else restoreFallback();
  });

  async function init() {
    try {
      const response = await fetch("/configuracion/datos/instagram-ultimo.json", {
        cache: "no-cache",
        credentials: "same-origin"
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.connected !== true || data.account !== "viajaconcabeza") return;
      const candidates = Array.isArray(data.posts) ? data.posts : (data.post ? [data.post] : []);
      posts = candidates.filter(post => post && validPostUrl(post.permalink) &&
        validPhotoUrl(post.thumbnail_url)).slice(0, 5);
      if (!posts.length) return;
      connected = true;
      failed = 0;
      if (placeholder) placeholder.hidden = true;
      if (nav) nav.hidden = posts.length < 2;
      render(0);
    } catch {
      // Sin conexión se conserva la maqueta existente, sin fingir publicaciones reales.
    }
  }

  previous?.addEventListener("click", () => {
    if (posts.length < 2) return;
    failed = 0;
    render(active - 1);
  });
  next?.addEventListener("click", () => {
    if (posts.length < 2) return;
    failed = 0;
    render(active + 1);
  });
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
