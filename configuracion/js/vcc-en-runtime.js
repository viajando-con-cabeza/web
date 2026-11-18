/* VCC · Shared ES→EN DOM adapter for content inserted by existing JS.
 * Never translates via API on a visitor request; all translations are prepared
 * by GitHub Actions. Same components and scripts are used for both languages.
 */
(()=>{
  if(!/^\/en(?:\/|$)/i.test(location.pathname))return;
  const normal=s=>String(s||'').replace(/\s+/g,' ').trim();
  const skipSelector='script,style,svg,noscript,template,code,pre,.shared-language,.home-language,.shared-menu,[translate="no"],[data-translate="no"]';
  const common={
    'INICIO':'HOME','Inicio':'Home','DESTINOS':'DESTINATIONS','Destinos':'Destinations',
    'ITINERARIOS':'ITINERARIES','Itinerarios':'Itineraries','PLANIFICA':'PLAN',
    'Planifica':'Plan your trip','NOSOTROS':'ABOUT','Nosotros':'About us',
    'CONTACTO':'CONTACT','Contacto':'Contact','PRÓXIMAMENTE':'COMING SOON',
    'Próximamente':'Coming soon','VOLVER':'BACK','VER MÁS':'SEE MORE',
    'Ruta de navegación':'Breadcrumb','Navegación principal':'Main navigation',
    'Redes sociales':'Social media','SÍGUENOS':'FOLLOW US',
    'Ver todos':'See all','Ver más':'See more',
    'Mosaico completo de fotografías':'Full photo gallery','Volver a la guía':'Back to the guide',
    'Cerrar galería':'Close gallery','Galería':'Gallery','Fotografía ampliada':'Enlarged photo',
    'Volver al mosaico completo':'Back to the photo grid','Todas las fotografías del día':'All photos from the day',
    'Foto anterior':'Previous photo','Foto siguiente':'Next photo',
    'Miniaturas de la galería':'Gallery thumbnails',
    'Galería de fotografías':'Photo gallery',
    'Volver a las tres fotos por fila':'Back to the three-column photo grid',
    'Abrir en Google Maps':'Open in Google Maps',
    'Fotografías de nuestro primer día en Estocolmo':'Photos from our first day in Stockholm',
    'Fotografías de nuestro segundo día en Estocolmo':'Photos from our second day in Stockholm',
    'Fotografías del viaje por el archipiélago de Estocolmo':'Photos from our Stockholm archipelago trip'
  };
  // Stable fallback for Sweden's JS-rendered card titles, categories and short metadata.
  // The generated translation dictionary remains authoritative when it contains a key.
  const swedenCardText={
      "ITINERARIOS EN SUECIA": "ITINERARIES IN SWEDEN",
      "Goteborg": "Gothenburg",
      "Goteborg y su costa": "Gothenburg and its coast",
      "Goteborg, su costa y lagos": "Gothenburg, coast & lakes",
      "Estocolmo y Dalarna": "Stockholm and Dalarna",
      "Vuelta a Suecia": "Tour of Sweden",
      "Imprescindibles de Estocolmo": "Stockholm must-sees",
      "Lo imprescindible": "Must-see places",
      "Mejores parques": "Best parks",
      "Mejores lagos": "Best lakes",
      "Joyas ocultas": "Hidden gems",
      "CIUDAD": "CITY",
      "CIUDADES": "CITIES",
      "COSTA": "COAST",
      "MONTAÑA": "MOUNTAINS",
      "NATURALEZA": "NATURE",
      "COMBINADO": "COMBINED",
      "RUTA EN COCHE": "ROAD TRIP",
      "RUTA COMBINADA": "COMBINED ROUTE",
      "IMPRESCINDIBLES": "MUST-SEES",
      "FOTOGRAFÍA": "PHOTOGRAPHY",
      "LAGOS": "LAKES",
      "JOYAS OCULTAS": "HIDDEN GEMS",
      "PRIMERA VISITA": "FIRST VISIT",
      "LAGOS Y PAISAJES": "LAKES & LANDSCAPES",
      "RINCONES ESPECIALES": "SPECIAL PLACES",
      "1 día": "1 day",
      "2 días": "2 days",
      "3 días": "3 days",
      "5 días": "5 days",
      "6 días": "6 days",
      "14 días": "14 days",
      "Pendiente": "TBC",
      "Duración pendiente": "Duration TBC",
      "Próximo itinerario": "Upcoming itinerary",
      "NUEVA RUTA": "NEW ROUTE",
      "Qué visitar": "What to see",
      "Presupuesto": "Budget",
      "Experiencias": "Experiences",
      "Canales, paseos y lugares interesantes para descubrir Gotemburgo.": "Canals, walks and interesting places to discover Gothenburg.",
      "Islas, ferris y pueblos marineros de la costa oeste sueca.": "Islands, ferries and seaside villages along Sweden’s west coast.",
      "Pueblos, lagos y rincones entre Småland, Örebro y Östergötland.": "Towns, lakes and hidden corners between Småland, Örebro and Östergötland.",
      "Parques nacionales, senderos y bosques para explorar a tu ritmo.": "National parks, trails and forests to explore at your own pace.",
      "Gamla Stan, museos y barrios en una ruta por horas.": "Gamla Stan, museums and neighborhoods on an hour-by-hour route.",
      "Guías completas y lugares que ver y hacer por todo el país.": "Detailed guides and places to see and explore across the country.",
      "Compara estilos, calcula tu viaje y consulta presupuestos por destino.": "Compare travel styles, plan your costs and explore destination budgets."
  };
  const spanishBase=location.pathname.replace(/^\/en(?=\/|$)/,'')||'/';
  let dictionary=new Map([...Object.entries(common),...Object.entries(swedenCardText)]),routes=new Map();
  let queued=false;
  const localPath=href=>{
    try{
      if(!href.startsWith('/')||href.startsWith('//'))return null;
      const u=new URL(href,location.origin);
      if(u.origin!==location.origin||/^\/en(?:\/|$)/.test(u.pathname))return null;
      const route=u.pathname.replace(/\/index\.html$/i,'/').replace(/\.html$/i,'');
      const mapped=routes.get(route);
      return mapped?mapped+u.search+u.hash:null;
    }catch{return null;}
  };
  // Numeric mosaic badges, photo counters and image alt text are created at
  // runtime, so exact-match translation memories cannot cover every value.
  const translateValue=value=>{
    const key=normal(value);
    const direct=dictionary.get(key);
    if(direct)return direct;
    const photosOnly=key.match(/^(\d+)\s+fotografías$/i);
    if(photosOnly)return photosOnly[1]+' photos';
    const budget=key.match(/^(\d+)\s+viajeros\s+·\s+(\d+)\s+días\s+·\s+(\d+)\s+noches$/i);
    if(budget)return budget[1]+' travelers · '+budget[2]+' days · '+budget[3]+' nights';
    const barePhoto=key.match(/^Fotografía\s+(\d+)$/i);
    if(barePhoto)return 'Photo '+barePhoto[1];
    const mosaic=key.match(/^\+(\d+)\s+fotos?(?:\s+m[aá]s)?$/i);
    if(mosaic)return '+'+mosaic[1]+' '+(mosaic[1]==='1'?'photo':'photos');
    const counter=key.match(/^(Ampliar fotografía|Abrir fotografía|Ver foto|Fotografía|Foto)\s+(\d+)\s+de\s+(\d+)$/i);
    if(counter)return (counter[1].startsWith('Ampliar')?'Enlarge photo':counter[1].startsWith('Abrir')?'Open photo':counter[1].startsWith('Ver')?'View photo':'Photo')+' '+counter[2]+' of '+counter[3];
    if(/ · imagen \d+ de \d+$/i.test(key))return key.replace(/ · imagen (\d+) de (\d+)$/i,' · image $1 of $2').replace(' · paisaje forestal',' · forest landscape').replace(' · costa y mar',' · coast and sea').replace(/^Estocolmo/,'Stockholm');
    return null;
  };
  const translateText=node=>{
    if(!node?.parentElement||node.parentElement.closest(skipSelector))return;
    const original=node.nodeValue||'',key=normal(original),translation=translateValue(key);
    if(!translation||translation===key)return;
    const match=original.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const next=match?match[1]+translation+match[3]:translation;
    if(next!==original)node.nodeValue=next;
  };
  function translateElement(el){
    if(!el||el.nodeType!==1||el.closest(skipSelector))return;
    if(el.matches('a[href]')){
      const mapped=localPath(el.getAttribute('href')||'');
      if(mapped)el.setAttribute('href',mapped);
    }
    for(const key of ['alt','title','placeholder','aria-label','data-description']){
      const value=el.getAttribute(key);
      if(value==null)continue;
      const translated=translateValue(value);
      if(translated&&translated!==value)el.setAttribute(key,translated);
    }
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode()))translateText(node);
    for(const inner of el.querySelectorAll('a[href],img[alt],[title],[placeholder],[aria-label],.day-mosaic[data-description]')){
      if(inner.closest(skipSelector))continue;
      if(inner.matches('a[href]')){
        const mapped=localPath(inner.getAttribute('href')||'');
        if(mapped)inner.setAttribute('href',mapped);
      }
      for(const key of ['alt','title','placeholder','aria-label','data-description']){
        const value=inner.getAttribute(key);
        if(value==null)continue;
        const translated=translateValue(value);
        if(translated&&translated!==value)inner.setAttribute(key,translated);
      }
    }
  }
  let observer;
  const changes=new Set();
  const observerOptions={
    subtree:true,childList:true,characterData:true,attributes:true,
    attributeFilter:['href','alt','title','placeholder','aria-label']
  };
  const flush=()=>{
    queued=false;
    if(!document.body)return;
    observer?.disconnect();
    const pending=[...changes];changes.clear();
    // Avoid rescanning the entire long guide every time a single card changes.
    for(const el of pending)if(el?.isConnected)translateElement(el.nodeType===1?el:el.parentElement);
    observer?.observe(document.body,observerOptions);
  };
  const schedule=(root=document.body)=>{
    if(root)changes.add(root);
    if(queued)return;queued=true;
    queueMicrotask(flush);
  };
  async function load(){
    try{
      const version=document.documentElement.getAttribute('data-vcc-i18n-version')||'1';
      const res=await fetch('/configuracion/datos/i18n/en-runtime.json?v='+encodeURIComponent(version),{cache:'default'});
      if(!res.ok)throw Error('dictionary-'+res.status);
      const json=await res.json();
      dictionary=new Map([...Object.entries(common),...Object.entries(swedenCardText),...Object.entries(json.dictionary||{})]);
      routes=new Map(Object.entries(json.routes||{}));
    }catch(error){
      console.warn('VCC EN translations unavailable; retained shared interface.',error);
    }
    // Script-generated Stockholm cards are not part of the HTML translation
    // extractor: load their editorial glossary only on the relevant guide.
    if(/^\/en\/destinos\/suecia\/estocolmo\/imprescindibles(?:\.html|\/)?$/i.test(location.pathname)){
      try{
        const response=await fetch('/configuracion/datos/i18n/stockholm-essentials-en.json?v=20261118-v1',{cache:'default'});
        if(!response.ok)throw Error('stockholm-'+response.status);
        const extra=await response.json();
        dictionary=new Map([...dictionary,...Object.entries(extra.dictionary||{})]);
      }catch(error){ console.warn('VCC Stockholm English card glossary unavailable',error); }
    }
    document.documentElement.lang='en';
    schedule();
    observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='childList'){
          for(const node of record.addedNodes) {
            if(node.nodeType===1)changes.add(node);
            else if(node.parentElement)changes.add(node.parentElement);
          }
        }else if(record.target?.nodeType===1)changes.add(record.target);
        else if(record.target?.parentElement)changes.add(record.target.parentElement);
      }
      if(changes.size)schedule(null);
    });
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();