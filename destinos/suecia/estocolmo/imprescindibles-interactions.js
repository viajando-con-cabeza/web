/* Navegació sincronitzada i mosaic de fotos tipus Booking. Només imprescindibles. */
(() => {
  const nav = document.getElementById('placeNav');
  const sections = [...document.querySelectorAll('.imp-main .place[id]')];
  const links = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  if (nav && sections.length && links.length) {
    let activeId = '';
    let ticking = false;
    const setActive = (id) => {
      if (!id || activeId === id) return;
      activeId = id;
      const active = links.find(link => link.getAttribute('href') === '#' + id);
      links.forEach(link => {
        const selected = link === active;
        link.classList.toggle('active', selected);
        if (selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (active) {
        const left = active.offsetLeft - nav.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
        nav.scrollTo({left: Math.max(0, left), behavior: 'smooth'});
      }
    };
    const sync = () => {
      ticking = false;
      const header = document.querySelector('.shared-header');
      const bar = document.querySelector('.place-nav-wrap');
      const threshold = (header?.getBoundingClientRect().height || 50) + (bar?.getBoundingClientRect().height || 43) + 45;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= threshold) current = section.id;
        else break;
      }
      setActive(current);
    };
    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sync);
    };
    links.forEach(link => link.addEventListener('click', () => setActive(link.getAttribute('href').slice(1))));
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    schedule();
  }

  /* Convertim la galeria antiga (principal + selectors repetits) en un únic mosaic.
     Conservem la llista original d'imatges i no alterem el contingut dels llocs. */
  document.querySelectorAll('.imp-main .gallery').forEach(gallery => {
    const original = gallery.querySelector('.gallery-main');
    if (!original) return;
    let sources = [];
    try { sources = JSON.parse(original.dataset.images || '[]'); } catch { sources = []; }
    if (!Array.isArray(sources)) return;
    const photos = [...new Set(sources.filter(src => typeof src === 'string' && src))];
    if (!photos.length) return;
    gallery.dataset.images = JSON.stringify(photos);
    gallery.dataset.count = String(photos.length);
    const mosaic = document.createElement('div');
    mosaic.className = `gallery-mosaic count-${Math.min(photos.length, 4)}`;
    photos.forEach((src, index) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'gallery-tile';
      tile.dataset.i = String(index);
      tile.setAttribute('aria-label', `Ampliar fotografía ${index + 1} de ${photos.length}`);
      const img = document.createElement('img');
      img.src = src;
      img.alt = gallery.closest('.place')?.querySelector('h2')?.textContent || 'Estocolmo';
      img.loading = 'lazy';
      tile.append(img);
      mosaic.append(tile);
    });
    gallery.replaceChildren(mosaic);
  });

  const overlay = document.getElementById('lightbox');
  const stage = overlay?.querySelector('.lb-stage');
  const image = stage?.querySelector(':scope > img');
  const thumbnails = stage?.querySelector('.lb-thumbs');
  const caption = stage?.querySelector('.lb-caption');
  const previous = stage?.querySelector('.lb-prev');
  const next = stage?.querySelector('.lb-next');
  const close = stage?.querySelector('.lb-close');
  if (!overlay || !image || !thumbnails || !previous || !next || !close) return;
  let photos = [];
  let index = 0;
  let lastFocus = null;
  const show = (i) => {
    if (!photos.length) return;
    index = (i + photos.length) % photos.length;
    image.src = photos[index];
    image.alt = caption?.textContent || 'Fotografía de Estocolmo';
    [...thumbnails.children].forEach((button, j) => {
      button.classList.toggle('active', j === index);
      button.setAttribute('aria-pressed', String(j === index));
    });
    const active = thumbnails.children[index];
    if (active) thumbnails.scrollTo({left: active.offsetLeft - thumbnails.offsetLeft - (thumbnails.clientWidth - active.clientWidth) / 2, behavior: 'smooth'});
    previous.hidden = next.hidden = photos.length < 2;
  };
  const dismiss = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    image.removeAttribute('src');
    lastFocus?.focus?.();
  };
  document.querySelectorAll('.imp-main .gallery').forEach(gallery => {
    let urls = [];
    try { urls = JSON.parse(gallery.dataset.images || '[]'); } catch { urls = []; }
    if (!Array.isArray(urls) || !urls.length) return;
    gallery.querySelectorAll('.gallery-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        photos = urls;
        lastFocus = tile;
        if (caption) caption.textContent = gallery.closest('.place')?.querySelector('h2')?.textContent || 'Estocolmo';
        thumbnails.replaceChildren();
        photos.forEach((src, j) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.setAttribute('aria-label', `Ver fotografía ${j + 1} de ${photos.length}`);
          const thumb = document.createElement('img');
          thumb.src = src;
          thumb.alt = '';
          button.append(thumb);
          button.addEventListener('click', () => show(j));
          thumbnails.append(button);
        });
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        show(Number(tile.dataset.i) || 0);
        close.focus();
      });
    });
  });
  previous.addEventListener('click', () => photos.length && show(index - 1));
  next.addEventListener('click', () => photos.length && show(index + 1));
  close.addEventListener('click', dismiss);
  overlay.addEventListener('click', e => {if (e.target === overlay) dismiss();});
  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') dismiss();
    if (e.key === 'ArrowLeft' && photos.length > 1) show(index - 1);
    if (e.key === 'ArrowRight' && photos.length > 1) show(index + 1);
  });
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Galería de fotografías');
  overlay.setAttribute('aria-hidden', 'true');
})();
