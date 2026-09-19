/* Mejoras progresivas sobre la página existente: conservar carruseles y datos. */
(() => {
  const nav = document.getElementById('placeNav');
  const sections = [...document.querySelectorAll('.imp-main .place[id]')];
  const links = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  if (nav && sections.length && links.length) {
    let activeId = '';
    let scheduled = false;
    const setActive = (id, center = true) => {
      if (activeId === id) return;
      activeId = id;
      const active = links.find(a => a.getAttribute('href') === '#' + id);
      links.forEach(a => {
        const selected = a === active;
        a.classList.toggle('active', selected);
        if (selected) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
      if (active && center) {
        const left = active.offsetLeft - nav.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
        nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    };
    const sync = () => {
      scheduled = false;
      const bar = document.querySelector('.place-nav-wrap');
      const header = document.querySelector('.shared-header');
      const threshold = (header?.getBoundingClientRect().height || 50) + (bar?.getBoundingClientRect().height || 43) + 95;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= threshold) current = section.id;
        else break;
      }
      setActive(current);
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(sync);
    };
    links.forEach(a => a.addEventListener('click', () => setActive(a.getAttribute('href').slice(1))));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    schedule();
  }

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
    index = (i + photos.length) % photos.length;
    image.src = photos[index];
    image.alt = caption?.textContent || 'Fotografía de Estocolmo';
    [...thumbnails.children].forEach((button, j) => {
      button.classList.toggle('active', j === index);
      button.setAttribute('aria-pressed', String(j === index));
    });
    const active = thumbnails.children[index];
    if (active) thumbnails.scrollTo({left: active.offsetLeft - thumbnails.offsetLeft - (thumbnails.clientWidth - active.clientWidth)/2,behavior:'smooth'});
    previous.hidden = next.hidden = photos.length < 2;
  };
  const dismiss = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    image.removeAttribute('src');
    lastFocus?.focus?.();
  };
  document.querySelectorAll('.imp-main .gallery').forEach(gallery => {
    const main = gallery.querySelector('.gallery-main');
    if (!main) return;
    let urls;
    try { urls = JSON.parse(main.dataset.images || '[]'); } catch { urls = []; }
    if (!Array.isArray(urls) || !urls.length) return;
    const open = () => {
      photos = urls;
      lastFocus = document.activeElement;
      if (caption) caption.textContent = gallery.closest('.place')?.querySelector('h2')?.textContent || 'Estocolmo';
      thumbnails.replaceChildren();
      photos.forEach((src,j) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `Ver fotografía ${j+1} de ${photos.length}`);
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.alt = '';
        button.append(thumb);
        button.addEventListener('click', () => show(j));
        thumbnails.append(button);
      });
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden','false');
      show(Math.max(0, urls.indexOf(main.querySelector('img')?.src)));
      close.focus();
    };
    main.setAttribute('role','button');
    main.setAttribute('tabindex','0');
    main.setAttribute('aria-label','Ampliar fotografías');
    main.addEventListener('click', open);
    main.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();open();}
    });
  });
  previous.addEventListener('click', () => photos.length && show(index-1));
  next.addEventListener('click', () => photos.length && show(index+1));
  close.addEventListener('click', dismiss);
  overlay.addEventListener('click', e => {if (e.target === overlay) dismiss();});
  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') dismiss();
    if (e.key === 'ArrowLeft' && photos.length > 1) show(index-1);
    if (e.key === 'ArrowRight' && photos.length > 1) show(index+1);
  });
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Galería de fotografías');
  overlay.setAttribute('aria-hidden','true');
})();
