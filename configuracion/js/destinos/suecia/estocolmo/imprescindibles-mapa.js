/* Estocolmo: mapa de los 15 imprescindibles.
   No modifica el visor fotografico, la barra sticky ni el My Maps de los tres dias. */
(() => {
  'use strict';
  const target = document.getElementById('imp-all-map');
  const index = document.getElementById('imp-map-index');
  if (!target || !index) return;

  // Puntos de referencia: en barrios e islas, el pin indica la zona;
  // para el metro se usa T-Centralen y para el ferry el embarque de Slussen.
  const geo = {
    'gamla-stan':[59.32495,18.07064],
    'vasa':[59.328023,18.091396],
    'djurgarden':[59.32667,18.11514],
    'ayuntamiento':[59.3275,18.055],
    'sodermalm':[59.31595,18.07799],
    'montelius':[59.32075,18.06041],
    'stortorget':[59.325,18.0708],
    'riddarholmen':[59.32505,18.06365],
    'metro':[59.33189,18.06094],
    'ferry':[59.3203,18.0725],
    'palacio':[59.326822,18.071719],
    'skansen':[59.32822,18.10676],
    'fotografiska':[59.317995,18.08465],
    'kungstradgarden':[59.3311,18.07161],
    'stromkajen':[59.329,18.075893]
  };
  const caveats = {
    'gamla-stan':'Punto de referencia del barrio',
    'djurgarden':'Punto de referencia de la isla',
    'sodermalm':'Punto de referencia del barrio',
    'metro':'T-Centralen, una de las estaciones destacadas',
    'ferry':'Embarque de Slussen, ferry público hacia Djurgården'
  };
  const spots = [...document.querySelectorAll('.imp-main .place[id]')]
    .filter(section => Object.prototype.hasOwnProperty.call(geo, section.id))
    .map(section => ({
      id:section.id,
      title:section.querySelector('.place-heading h2')?.textContent?.trim() || section.id,
      latlng:geo[section.id]
    }));
  if (!spots.length) return;

  const buttons = new Map();
  let map = null;
  const markers = new Map();
  function choose(id, center) {
    for (const [key,button] of buttons) {
      button.classList.toggle('is-selected', key === id);
      button.setAttribute('aria-pressed',String(key === id));
    }
    if (center && map && markers.has(id)) {
      const marker = markers.get(id);
      map.flyTo(marker.getLatLng(),Math.max(map.getZoom(),14),{duration:.5});
      marker.openPopup();
    }
  }
  for (const [i,spot] of spots.entries()) {
    const button=document.createElement('button');
    button.type='button';
    button.className='imp-map-index-item';
    button.dataset.placeId=spot.id;
    button.setAttribute('aria-label','Localizar '+spot.title+' en el mapa');
    button.setAttribute('aria-pressed','false');
    const number=document.createElement('small');
    number.textContent=String(i+1).padStart(2,'0');
    number.setAttribute('aria-hidden','true');
    const label=document.createElement('span');
    label.textContent=spot.title;
    button.append(number,label);
    button.addEventListener('click',()=>{
      choose(spot.id,true);
      if (!map) document.getElementById(spot.id)?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    buttons.set(spot.id,button);
    index.append(button);
  }

  // Si falla la CDN o el mapa vectorial, el Google My Maps del HTML sigue disponible.
  if (!window.L) return;
  try {
    const leaflet = window.L;
    target.replaceChildren();
    map=leaflet.map(target,{
      scrollWheelZoom:false,
      zoomControl:true,
      attributionControl:true
    });
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      minZoom:11,maxZoom:18,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);
    const bounds=[];
    for(const [i,spot] of spots.entries()){
      // Puntos numerados en el mismo orden que las fichas.
      // Separacion visual minima en Gamla Stan/Stortorget (coordenadas vecinas).
      const offset=spot.id==='gamla-stan'?16:spot.id==='stortorget'?-16:0;
      const marker=leaflet.marker(spot.latlng,{
        icon:leaflet.divIcon({
          className:'imp-map-number-marker',
          html:'<span class="imp-map-pin-number">'+(i+1)+'</span>',
          iconSize:[28,28],
          iconAnchor:[14+offset,14],
          popupAnchor:[0,-13]
        }),
        keyboard:true,
        riseOnHover:true,
        title:(i+1)+' · '+spot.title
      }).addTo(map);
      const popup=document.createElement('div');
      const title=document.createElement('strong');
      title.textContent=String(i+1).padStart(2,'0')+' · '+spot.title;
      popup.append(title);
      if (caveats[spot.id]){
        const detail=document.createElement('p');
        detail.style.margin='5px 0';
        detail.textContent=caveats[spot.id];
        popup.append(detail);
      }
      const link=document.createElement('a');
      link.href='#'+spot.id;
      link.textContent='Ver ficha y Consejo VCC';
      popup.append(document.createElement('br'),link);
      marker.bindPopup(popup,{minWidth:155,maxWidth:240});
      marker.bindTooltip(spot.title,{direction:'top',offset:[0,-6]});
      marker.on('click',()=>choose(spot.id,false));
      markers.set(spot.id,marker);
      bounds.push(spot.latlng);
    }
    map.fitBounds(bounds,{padding:[26,26],maxZoom:13});
    window.requestAnimationFrame(()=>map.invalidateSize());
  } catch(error) {
    // La lista de puntos y su enlace a las fichas sigue siendo operativa.
    console.warn('No se ha podido inicializar el mapa de imprescindibles.',error);
    if (map) {map.remove();map=null;}
    target.replaceChildren();
    const fallback=document.createElement('iframe');
    fallback.title='Nuestro Google My Maps de Estocolmo por días';
    fallback.loading='lazy';
    fallback.referrerPolicy='no-referrer-when-downgrade';
    fallback.src='https://www.google.com/maps/d/embed?mid=1ztVh-2ldEsCBTyzNSMH3Qm4_Pxqdxno';
    target.append(fallback);
  }
})();
