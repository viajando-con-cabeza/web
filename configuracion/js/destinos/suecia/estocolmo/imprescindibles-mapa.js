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
      const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduceMotion)map.setView(marker.getLatLng(),Math.max(map.getZoom(),14),{animate:false});
      else map.flyTo(marker.getLatLng(),Math.max(map.getZoom(),14),{duration:.5});
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

  // Si no carga Leaflet, no incorporar mapas externos de otro itinerario.
  if (!window.L) {
    const note=target.querySelector('.imp-map-unavailable');
    if (note) note.textContent='El mapa interactivo no está disponible en este momento.';
    const exportButton=document.getElementById('imp-export-pdf');
    if (exportButton) exportButton.disabled=true;
    return;
  }
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
    const note=document.createElement('p');
    note.className='imp-map-unavailable';
    note.textContent='El mapa interactivo no está disponible en este momento.';
    target.append(note);
    const exportButton=document.getElementById('imp-export-pdf');
    if (exportButton) exportButton.disabled=true;
  }

  // Única salida del mapa: PDF descargable del propio mapa numerado y su
  // leyenda. No enlaza con Google My Maps ni con archivos KML.
  const exportButton=document.getElementById('imp-export-pdf');
  const exportStatus=document.getElementById('imp-export-status');
  const loadPDFLibrary=(url,check)=>new Promise((resolve,reject)=>{
    if(check()) {resolve();return;}
    const script=document.createElement('script');
    script.src=url;
    script.async=true;
    script.onload=()=>check()?resolve():reject(new Error('No se pudo cargar la biblioteca del PDF.'));
    script.onerror=()=>reject(new Error('No se pudo cargar la biblioteca del PDF.'));
    document.head.append(script);
  });
  // Iconos VCC ya presentes en /configuracion/imagenes/iconos, sin nuevos archivos.
  const pdfIconType={
    'gamla-stan':'historia','vasa':'museo','djurgarden':'naturaleza',
    'ayuntamiento':'historia','sodermalm':'paseo','montelius':'mirador',
    'stortorget':'historia','riddarholmen':'historia','metro':'metro',
    'ferry':'ferry','palacio':'historia','skansen':'museo',
    'fotografiska':'museo','kungstradgarden':'naturaleza','stromkajen':'ferry'
  };
  const pdfIconFiles={
    historia:'/configuracion/imagenes/iconos/entradas-y-pases/landmark.svg',
    museo:'/configuracion/imagenes/iconos/entradas-y-pases/ticket.svg',
    naturaleza:'/configuracion/imagenes/iconos/iconos-naturaleza.svg',
    paseo:'/configuracion/imagenes/iconos/como-moverse/iconos-lucide/apie.svg',
    mirador:'/configuracion/imagenes/iconos/inicio-mapa-vcc.svg',
    metro:'/configuracion/imagenes/iconos/como-moverse/iconos-lucide/metro.svg',
    ferry:'/configuracion/imagenes/iconos/como-moverse/iconos-lucide/ferry.svg'
  };
  const pdfLogoPath='/configuracion/imagenes/marca/logo-vcc.svg';
  // SVG de GitHub/R2 convertido a PNG exclusivamente en el navegador cuando
  // el usuario pulsa Exportar. No envia fotos ni datos personales a terceros.
  async function svgToPdfImage(path,{color=null,size=220}={}) {
    const response=await fetch(path,{credentials:'same-origin'});
    if(!response.ok) throw new Error('Icono no disponible: '+path);
    let svg=await response.text();
    if(color){
      svg=svg.replace(/stroke="(?:currentColor|#[a-f0-9]{3,8})"/gi,'stroke="'+color+'"');
    }
    const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
    const source=URL.createObjectURL(blob);
    try {
      const img=new Image();
      await new Promise((resolve,reject)=>{
        img.onload=resolve;
        img.onerror=()=>reject(new Error('No se pudo decodificar '+path));
        img.src=source;
      });
      const canvas=document.createElement('canvas');
      canvas.width=canvas.height=size;
      const ctx=canvas.getContext('2d');
      if(!ctx)throw new Error('Canvas no disponible');
      ctx.clearRect(0,0,size,size);
      ctx.drawImage(img,0,0,size,size);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(source);
    }
  }
  async function loadPdfBranding(){
    const keys=Object.keys(pdfIconFiles);
    const images=await Promise.all(keys.map(async key=>{
      try {return [key,await svgToPdfImage(pdfIconFiles[key],{color:'#b65b35'})];}
      catch(error){console.warn('Icono VCC no disponible para PDF:',key,error);return [key,null];}
    }));
    let logo=null;
    try {logo=await svgToPdfImage(pdfLogoPath,{size:320});}
    catch(error){console.warn('Logo VCC no disponible para PDF:',error);}
    return {icons:new Map(images),logo};
  }

  async function exportMapPDF() {
    if (!exportButton || exportButton.disabled || !window.L || !spots.length || !map) return;
    exportButton.disabled=true;
    exportButton.setAttribute('aria-busy','true');
    if(exportStatus) exportStatus.textContent='Preparando PDF…';
    let pdfMap=null,host=null;
    try {
      // Librerías descargadas solo al solicitar el PDF.
      await Promise.all([
        loadPDFLibrary('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',()=>typeof window.html2canvas==='function'),
        loadPDFLibrary('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',()=>Boolean(window.jspdf?.jsPDF))
      ]);
      const L=window.L;
      // Mapa independiente con tamaño fijo: misma calidad también en móvil,
      // sin modificar la vista ni el zoom del usuario.
      host=document.createElement('div');
      host.className='imp-pdf-map-host';
      host.setAttribute('aria-hidden','true');
      host.style.cssText='position:fixed;left:-3000px;top:0;width:1040px;height:440px;z-index:-1;pointer-events:none;background:#f3f1ec;';
      (document.querySelector('.imp-page')||document.body).append(host);
      pdfMap=L.map(host,{scrollWheelZoom:false,zoomControl:false,attributionControl:true});
      const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        crossOrigin:'anonymous',minZoom:11,maxZoom:18,
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(pdfMap);
      const loaded=new Promise(resolve=>{
        let finished=false;
        const finish=()=>{if(!finished){finished=true;resolve();}};
        tiles.once('load',finish);
        setTimeout(finish,4500);
      });
      spots.forEach((spot,i)=>{
        const offset=spot.id==='gamla-stan'?16:spot.id==='stortorget'?-16:0;
        L.marker(spot.latlng,{
          icon:L.divIcon({
            className:'imp-map-number-marker',
            html:'<span class="imp-map-pin-number">'+(i+1)+'</span>',
            iconSize:[28,28],iconAnchor:[14+offset,14]
          }),
          keyboard:false
        }).addTo(pdfMap);
      });
      pdfMap.fitBounds(spots.map(spot=>spot.latlng),{
        padding:[36,36],maxZoom:13,animate:false
      });
      await loaded;
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const canvas=await window.html2canvas(host,{
        backgroundColor:'#f3f1ec',useCORS:true,allowTaint:false,
        scale:1.65,logging:false,scrollX:0,scrollY:0
      });
      if(!canvas.width || !canvas.height) throw new Error('No se ha podido capturar el mapa.');
      const {icons,logo}=await loadPdfBranding();
      // Contraste extra ligero en el PDF para que no quede deslavado al imprimir.
      const vivid=document.createElement('canvas');
      vivid.width=canvas.width;vivid.height=canvas.height;
      const vividContext=vivid.getContext('2d');
      if(!vividContext)throw new Error('Canvas del PDF no disponible');
      vividContext.filter='contrast(1.06) saturate(1.07)';
      vividContext.drawImage(canvas,0,0);
      const PDF=window.jspdf.jsPDF;
      const pdf=new PDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
      const ink=[40,39,37],orange=[200,91,48];
      pdf.setFont('helvetica','bold');pdf.setFontSize(19);pdf.setTextColor(...ink);
      pdf.text('ESTOCOLMO · 15 IMPRESCINDIBLES',12,18);
      pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(110,104,99);
      pdf.text('Mapa numerado para planificar tu visita',12,25);
      // Logo circular oficial de Viajando con Cabeza.
      if(logo)pdf.addImage(logo,'PNG',268,5,18,18);
      pdf.setFont('helvetica','bold');pdf.setFontSize(7.8);
      pdf.setTextColor(...orange);
      pdf.text('VIAJANDO CON CABEZA',285,28,{align:'right'});
      pdf.setDrawColor(224,213,204);pdf.setLineWidth(.4);pdf.line(12,31,285,31);
      pdf.addImage(vivid.toDataURL('image/jpeg',.91),'JPEG',12,34,273,113.5);
      pdf.setFont('helvetica','bold');pdf.setFontSize(10);
      pdf.setTextColor(...ink);pdf.text('LOS 15 LUGARES',12,157);
      // Número en el mapa + icono oficial VCC de cada categoría en la leyenda.
      spots.forEach((spot,i)=>{
        const col=Math.floor(i/5),row=i%5;
        const x=12+col*92;
        const y=166+row*7.4;
        pdf.setFillColor(...orange);pdf.circle(x+3,y-1.6,3.1,'F');
        pdf.setFont('helvetica','bold');pdf.setFontSize(8);
        pdf.setTextColor(255,255,255);
        pdf.text(String(i+1),x+3,y-.7,{align:'center'});
        const icon=icons.get(pdfIconType[spot.id]);
        if(icon)pdf.addImage(icon,'PNG',x+8.9,y-4.8,5.1,5.1);
        pdf.setFont('helvetica','normal');pdf.setFontSize(9);
        pdf.setTextColor(...ink);
        pdf.text(spot.title,x+16,y,{maxWidth:75});
      });
      pdf.setFont('helvetica','normal');pdf.setFontSize(7.5);
      pdf.setTextColor(111,106,102);
      pdf.text('Los puntos de barrios, metro y ferris son orientativos. Mapa: © OpenStreetMap contributors.',12,204);
      pdf.save('estocolmo-15-imprescindibles-vcc.pdf');
      if(exportStatus) exportStatus.textContent='PDF descargado';
    } catch(error) {
      console.error('No se pudo exportar el mapa a PDF.',error);
      if(exportStatus) exportStatus.textContent='No se pudo generar el PDF. Inténtalo de nuevo.';
    } finally {
      if(pdfMap) pdfMap.remove();
      if(host) host.remove();
      exportButton.removeAttribute('aria-busy');
      exportButton.disabled=!map;
    }
  }
  exportButton?.addEventListener('click',exportMapPDF);
})();
