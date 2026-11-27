/* Quality: barra sincronitzada, mosaic Booking i visor accessible amb comptador. */
(() => {
  const nav = document.getElementById('placeNav');
  const sections = [...document.querySelectorAll('.imp-main .place[id]')];
  const links = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  if (nav && sections.length && links.length) {
    let active = '', queued = false;
    const highlight = id => {
      if (active === id) return;
      active = id;
      const chosen = links.find(a => a.getAttribute('href') === '#' + id);
      links.forEach(a => {
        a.classList.toggle('active', a === chosen);
        if (a === chosen) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
      if (chosen) nav.scrollTo({left: Math.max(0, chosen.offsetLeft - nav.offsetLeft - (nav.clientWidth - chosen.offsetWidth) / 2), behavior:'smooth'});
    };
    const sync = () => {
      queued = false;
      const header = document.querySelector('.shared-header');
      const bar = document.querySelector('.place-nav-wrap');
      const limit = (header?.offsetHeight || 50) + (bar?.offsetHeight || 43) + 45;
      let id = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= limit) id = section.id;
        else break;
      }
      highlight(id);
    };
    const queue = () => {if (!queued) {queued = true; requestAnimationFrame(sync);}};
    links.forEach(a => a.addEventListener('click', () => highlight(a.hash.slice(1))));
    window.addEventListener('scroll', queue, {passive:true});
    window.addEventListener('resize', queue);
    window.addEventListener('hashchange', queue);
    queue();
  }

  const overlay = document.getElementById('lightbox');
  const stage = overlay?.querySelector('.lb-stage');
  const image = stage?.querySelector(':scope > img');
  const thumbnails = stage?.querySelector('.lb-thumbs');
  const caption = stage?.querySelector('.lb-caption');
  const previous = stage?.querySelector('.lb-prev');
  const next = stage?.querySelector('.lb-next');
  const close = stage?.querySelector('.lb-close');
  let counter = stage?.querySelector('.lb-counter');
  if (stage && thumbnails && !counter) {
    counter = document.createElement('div');
    counter.className = 'lb-counter';
    counter.setAttribute('role', 'status');
    counter.setAttribute('aria-live', 'polite');
    stage.insertBefore(counter, thumbnails);
  }
  /* Reutilitzem la descripció editorial que ja apareix a cada fitxa. */
  let placeInfo = stage?.querySelector('.lb-place-info');
  let placeDescription = placeInfo?.querySelector('p');
  if (stage && !placeInfo) {
    placeInfo = document.createElement('aside');
    placeInfo.className = 'lb-place-info';
    placeInfo.setAttribute('aria-label', 'Descripción del lugar');
    const heading = document.createElement('h3');
    placeDescription = document.createElement('p');
    placeInfo.append(heading, placeDescription);
    stage.append(placeInfo);
  }
  const placeHeading = placeInfo?.querySelector('h3');
  let album = [], current = 0, focusBefore = null;
  const show = i => {
    if (!album.length || !image) return;
    current = (i + album.length) % album.length;
    image.src = album[current];
    image.alt = `${placeHeading?.textContent || 'Destino'} · fotografía ${current + 1} de ${album.length}`;
    if (counter) counter.textContent = `${current + 1} / ${album.length}`;
    [...thumbnails.children].forEach((button,j) => {
      button.classList.toggle('active',j === current);
      button.setAttribute('aria-pressed', String(j === current));
    });
    const selected = thumbnails.children[current];
    if (selected) thumbnails.scrollTo({left:Math.max(0,selected.offsetLeft - thumbnails.offsetLeft - (thumbnails.clientWidth - selected.offsetWidth)/2),behavior:'smooth'});
    previous.hidden = next.hidden = album.length < 2;
  };
  const dismiss = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    image.removeAttribute('src');
    if (counter) counter.textContent = '';
    focusBefore?.focus?.();
  };
  const open = (gallery, index) => {
    if (!overlay || !image || !thumbnails || !close) return;
    try {album = JSON.parse(gallery.dataset.images || '[]');} catch {album = [];}
    if (!album.length) return;
    focusBefore = document.activeElement;
    const place = gallery.closest('.place');
    const placeName = place?.querySelector('h2')?.textContent?.trim() || 'Destino';
    if (caption) caption.textContent = '';
    if (placeHeading) placeHeading.textContent = placeName;
    if (placeDescription) placeDescription.textContent = place?.querySelector('.place-copy > p')?.textContent?.trim() || '';
    if (placeInfo) placeInfo.scrollTop = 0;
    thumbnails.replaceChildren();
    album.forEach((src,j) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label',`Ver fotografía ${j+1} de ${album.length}`);
      const thumb = document.createElement('img'); thumb.src = src; thumb.alt = '';
      button.append(thumb);
      button.addEventListener('click',() => show(j));
      thumbnails.append(button);
    });
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    show(index);
    close.focus();
  };
  document.querySelectorAll('.imp-main .gallery').forEach((gallery, placeIndex) => {
    const original = gallery.querySelector('.gallery-main');
    let own = [];
    try {own = JSON.parse(original?.dataset.images || '[]');} catch {own = [];}
    const photos = [...new Set(own.filter(Boolean))];
    if (!photos.length) return;
    gallery.dataset.images = JSON.stringify(photos);
    gallery.dataset.count = String(photos.length);
    const mosaic = document.createElement('div');
    mosaic.className = `gallery-mosaic count-${Math.min(photos.length,5)}`;
    photos.slice(0,5).forEach((src,index) => {
      const tile = document.createElement('button');
      tile.type='button'; tile.className='gallery-tile'; tile.dataset.i=String(index);
      tile.setAttribute('aria-label',`Ampliar fotografía ${index+1} de ${photos.length}`);
      const img=document.createElement('img'); img.src=src;
      img.alt=`${gallery.closest('.place')?.querySelector('h2')?.textContent || 'Destino'} · fotografía ${index+1}`;
      img.loading='lazy';
      tile.append(img);
      if (index === 4 && photos.length > 5) {
        const more=document.createElement('span'); more.className='gallery-more';
        more.textContent=`+${photos.length-5} fotos más`;
        tile.append(more);
      }
      tile.addEventListener('click',() => open(gallery,index));
      mosaic.append(tile);
    });
    gallery.replaceChildren(mosaic);
  });
})();
