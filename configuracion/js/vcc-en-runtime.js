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
    'Ver todos':'See all','Ver más':'See more'
  };
  const spanishBase=location.pathname.replace(/^\/en(?=\/|$)/,'')||'/';
  let dictionary=new Map(Object.entries(common)),routes=new Map();
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
  const translateText=node=>{
    if(!node?.parentElement||node.parentElement.closest(skipSelector))return;
    const original=node.nodeValue||'',key=normal(original),translation=dictionary.get(key);
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
    for(const key of ['alt','title','placeholder','aria-label']){
      const value=el.getAttribute(key);
      if(value==null)continue;
      const translated=dictionary.get(normal(value));
      if(translated&&translated!==value)el.setAttribute(key,translated);
    }
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode()))translateText(node);
    for(const inner of el.querySelectorAll('a[href],img[alt],[title],[placeholder],[aria-label]')){
      if(inner.closest(skipSelector))continue;
      if(inner.matches('a[href]')){
        const mapped=localPath(inner.getAttribute('href')||'');
        if(mapped)inner.setAttribute('href',mapped);
      }
      for(const key of ['alt','title','placeholder','aria-label']){
        const value=inner.getAttribute(key);
        if(value==null)continue;
        const translated=dictionary.get(normal(value));
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
      dictionary=new Map([...Object.entries(common),...Object.entries(json.dictionary||{})]);
      routes=new Map(Object.entries(json.routes||{}));
    }catch(error){
      console.warn('VCC EN translations unavailable; retained shared interface.',error);
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