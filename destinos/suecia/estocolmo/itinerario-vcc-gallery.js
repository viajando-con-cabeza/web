(() => {
  /* Estilos compartidos con la guía de Estocolmo. */
  const aligned = document.createElement('link');
  aligned.rel = 'stylesheet';
  aligned.href = 'itinerario-quality-alineacion.css?v=2';
  document.head.append(aligned);
  const navRoot = document.querySelector('.vcc-nav-inner');
  if (navRoot) {
    const dayLinks = [...document.querySelectorAll('.day-section[id]')].map(section => ({href:`#${section.id}`,label:`DÍA ${section.id.replace(/^dia/, '')}`}));
    navRoot.replaceChildren();
    [{href:'#resumen',label:'INTRODUCCIÓN'}, ...dayLinks].forEach(({href,label}) => {
      const a = document.createElement('a'); a.href=href; a.textContent=label; navRoot.append(a);
    });
  }
  const notes = {
    dia1: [
      'Comienza por el palacio y su entorno histórico; consulta los horarios si quieres visitar el interior.',
      'Detente en la plaza de las fachadas de colores y descubre las callejuelas que salen de ella.',
      'Continúa a pie entre la catedral y los pasajes del casco antiguo, sin seguir una ruta rígida.',
      'Haz una pausa para comer en Gamla Stan y reponer fuerzas antes de cruzar a otra isla.',
      'Acércate a la orilla de Riddarholmen para contemplar el perfil de la ciudad desde el agua.',
      'Termina junto al Ayuntamiento y sus jardines; comprueba previamente las opciones de visita interior.'
    ],
    dia2: [
      'Dedica la mañana a conocer el barco del siglo XVII y la historia de su recuperación.',
      'Camina por los senderos y espacios verdes de la isla, dejando tiempo para disfrutar de sus rincones.',
      'Busca un lugar tranquilo para comer y descansar antes de la siguiente visita.',
      'Escoge Skansen u otro museo según tus intereses y su horario; no hace falta abarcarlo todo.',
      'Regresa disfrutando de las vistas desde el agua y comprueba previamente la frecuencia del ferry.'
    ],
    dia3: [
      'Empieza por las calles, tiendas pequeñas y plazas del barrio para conocer su ambiente.',
      'Sube al mirador y disfruta de las vistas de Gamla Stan y del lago Mälaren.',
      'Haz una pausa para un café sueco y una comida sin prisas.',
      'Elige entre una exposición de fotografía o las estaciones decoradas del metro.',
      'Cierra el día paseando por otra zona céntrica según el tiempo y tus ganas.'
    ]
  };
  const introductions = {
    dia1:'Empieza en Gamla Stan, el corazón histórico de la ciudad, entre plazas de colores, callejuelas empedradas y edificios que cuentan siglos de historia. Por la mañana descubrirás el entorno del Palacio Real y la catedral; después, un paseo junto al agua te llevará a Riddarholmen y al Ayuntamiento. Lo más especial es dejarse sorprender por los pasajes y las vistas entre islas.',
    dia2:'Hoy toca combinar una de las visitas más singulares de Estocolmo con la naturaleza de Djurgården. El Museo Vasa permite conocer de cerca un barco del siglo XVII; al salir, cambia el ritmo y disfruta de los caminos verdes de la isla. Elige otra visita cultural solo si te apetece y termina con el trayecto en ferry: las vistas desde el agua son parte de la experiencia.',
    dia3:'Dedica la última jornada a una Estocolmo más cotidiana: tiendas independientes, cafeterías y calles con personalidad en Södermalm. Asómate a Monteliusvägen para ver Gamla Stan desde otra perspectiva, reserva una pausa para el fika y completa la tarde con Fotografiska o el arte del metro. Lo mejor es combinar los miradores con tiempo libre para descubrir el barrio a tu ritmo.'
  };
  const tips = {
    dia1:'Empieza temprano en Gamla Stan para disfrutar de sus calles con menos gente. Deja margen entre paradas: los rincones que encuentras sin buscarlos suelen ser parte de lo mejor del recorrido.',
    dia2:'Elige uno o dos museos como máximo y consulta los horarios con antelación. Guarda un rato para caminar sin rumbo por Djurgården y, si encaja con tu ruta, vuelve en ferry para ver la ciudad desde el agua.',
    dia3:'Intenta llegar a Monteliusvägen con buena luz y lleva calzado cómodo para las cuestas. Si llueve, intercambia el mirador por Fotografiska o por una ruta por las estaciones artísticas del metro.'
  };
  document.querySelectorAll('.day-section[id]').forEach((section,index) => {
    const intro = section.querySelector('.day-intro');
    const kicker = intro?.querySelector('.hand');
    if (kicker) kicker.textContent=`Día ${index+1} · ${kicker.textContent.trim().replace(/\.{3}$/, '')}`;
    const paragraph = intro?.querySelector(':scope > p');
    if (paragraph && introductions[section.id]) paragraph.textContent=introductions[section.id];
    const tip = intro?.querySelector('.day-tip div');
    if (tip && tips[section.id]) {const title=tip.querySelector('strong');tip.textContent=tips[section.id];if(title) tip.prepend(title);}
    section.querySelectorAll('.timeline li').forEach((stop,stopIndex) => {
      const destination=stop.querySelector('span');
      if (!destination || destination.querySelector('.stop-detail')) return;
      const note=notes[section.id]?.[stopIndex];
      if (!note) return;
      const detail=document.createElement('small');detail.className='stop-detail';detail.textContent=note;destination.append(detail);
    });
    const route=section.querySelector('.day-schedule .map-button');
    if(route && intro){route.classList.add('day-route-link');intro.append(route);}
  });
  const modal = document.getElementById('dayLightbox');
  if (!modal) return;
  const galleryFix = document.createElement('style');
  galleryFix.textContent = '.day-mosaic.count-4{grid-template-columns:1.25fr 1fr 1fr!important;grid-template-rows:repeat(2,minmax(0,1fr))!important}.day-mosaic.count-4 button:first-child{grid-column:1;grid-row:1/3}.day-mosaic.count-4 button:nth-child(2){grid-column:2/4;grid-row:1}.day-mosaic.count-4 button:nth-child(3){grid-column:2;grid-row:2}.day-mosaic.count-4 button:nth-child(4){display:block!important;grid-column:3;grid-row:2}';
  document.head.append(galleryFix);
  const stage=modal.querySelector('.day-lightbox-stage');
  const image=modal.querySelector('.day-lightbox-stage > img');
  const counter=modal.querySelector('.day-lightbox-counter');
  const thumbs=modal.querySelector('.day-lightbox-thumbs');
  const title=modal.querySelector('.day-lightbox-info h3');
  const description=modal.querySelector('.day-lightbox-info p');
  const close=modal.querySelector('.day-lightbox-close');
  let currentImages=[],currentIndex=0,lastFocus=null,originX=null,originY=null;
  const galleries=document.querySelectorAll('.day-mosaic');
  const render=()=>{
    if(!currentImages.length)return;
    const item=currentImages[currentIndex];image.src=item.src;image.alt=item.alt;
    counter.textContent=`${currentIndex+1} / ${currentImages.length}`;
    thumbs.replaceChildren();
    currentImages.forEach((photo,index)=>{
      const button=document.createElement('button');button.type='button';button.className=index===currentIndex?'active':'';
      button.setAttribute('aria-label',`Ver foto ${index+1} de ${currentImages.length}`);
      const thumb=document.createElement('img');thumb.src=photo.src;thumb.alt=photo.alt;button.append(thumb);
      button.addEventListener('click',()=>{currentIndex=index;render();});thumbs.append(button);
      if(index===currentIndex)button.scrollIntoView({block:'nearest',inline:'nearest'});
    });
  };
  const move=delta=>{if(!currentImages.length)return;currentIndex=(currentIndex+delta+currentImages.length)%currentImages.length;render();};
  const hide=()=>{modal.hidden=true;document.body.style.overflow='';image.removeAttribute('src');if(lastFocus?.focus)lastFocus.focus();};
  galleries.forEach(gallery=>{
    const buttons=[...gallery.querySelectorAll('button[data-photo]')];
    const images=buttons.map(button=>({src:button.dataset.photo,alt:button.querySelector('img')?.alt||gallery.dataset.title||'Estocolmo'}));
    buttons.forEach((button,index)=>button.addEventListener('click',()=>{
      currentImages=images;currentIndex=index;lastFocus=button;
      title.textContent=gallery.dataset.title||'';description.textContent=gallery.dataset.description||'';
      modal.hidden=false;document.body.style.overflow='hidden';render();close.focus();
    }));
  });
  close.addEventListener('click',hide);
  modal.querySelector('.day-lightbox-prev').addEventListener('click',()=>move(-1));
  modal.querySelector('.day-lightbox-next').addEventListener('click',()=>move(1));
  modal.addEventListener('click',e=>{if(e.target===modal)hide();});
  document.addEventListener('keydown',e=>{
    if(modal.hidden)return;
    if(e.key==='Escape')hide();else if(e.key==='ArrowRight')move(1);else if(e.key==='ArrowLeft')move(-1);
    else if(e.key==='Tab'){const focusables=[...modal.querySelectorAll('button:not([disabled])')];const index=focusables.indexOf(document.activeElement);if(e.shiftKey&&index===0){e.preventDefault();focusables.at(-1).focus();}else if(!e.shiftKey&&index===focusables.length-1){e.preventDefault();focusables[0].focus();}}
  });
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;originX=e.clientX;originY=e.clientY;try{stage.setPointerCapture(e.pointerId);}catch(_){}});
  stage.addEventListener('pointerup',e=>{if(originX===null)return;const dx=e.clientX-originX,dy=e.clientY-originY;originX=originY=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)move(dx<0?1:-1);});
  stage.addEventListener('pointercancel',()=>{originX=originY=null;});
  const nav=[...document.querySelectorAll('.vcc-nav a[href^="#"]')];
  const updateNav=()=>{const hash=location.hash||'#resumen';nav.forEach(a=>a.classList.toggle('is-active',a.getAttribute('href')===hash));};
  window.addEventListener('hashchange',updateNav);updateNav();
})();