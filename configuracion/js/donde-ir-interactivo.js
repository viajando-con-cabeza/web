/* Dónde ir · VCC · Selector de inspiració, sense dependències. */
(() => {
  'use strict';
  // A quality, els esborranys segueixen accessibles per revisar-los.
  // A producció no tenen href fins que s'aproven al registre editorial.
  const hostname=location.hostname.toLowerCase();
  const isQualityPreview=hostname.includes('quality.viajandoconcabeza.com')||
    hostname.endsWith('.workers.dev');
  if(isQualityPreview){
    document.querySelectorAll('.di-mini-card[data-vcc-publication="draft"]').forEach(card=>{
      if(!card.dataset.vccOriginalHref)return;
      card.setAttribute('href',card.dataset.vccOriginalHref);
      card.removeAttribute('aria-disabled');
      card.title='Borrador · vista de pruebas';
    });
  }

  const validModes=['itinerarios','guias','consejos'];
  const choiceButtons=[...document.querySelectorAll('[data-di-mode]')];
  const tabs=[...document.querySelectorAll('[data-di-tab]')];
  const panels=new Map(validModes.map(mode=>[mode,document.getElementById('di-panel-'+mode)]));
  const destination=document.getElementById('di-explorar');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentMode='itinerarios';
  function setMode(mode,{scroll=false,focus=false}={}){
    if(!panels.has(mode))return;
    currentMode=mode;
    choiceButtons.forEach(button=>{
      const selected=button.dataset.diMode===mode;
      button.classList.toggle('is-active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    tabs.forEach(tab=>{
      const selected=tab.dataset.diTab===mode;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex=selected?0:-1;
    });
    panels.forEach((panel,key)=>{panel.hidden=key!==mode});
    if(scroll)destination.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
    if(focus)tabs.find(tab=>tab.dataset.diTab===mode)?.focus({preventScroll:true});
  }
  choiceButtons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.diMode,{scroll:true})));
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>setMode(tab.dataset.diTab));
    tab.addEventListener('keydown',event=>{
      let next=null;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
      if(event.key==='Home')next=0;
      if(event.key==='End')next=tabs.length-1;
      if(next!==null){event.preventDefault();setMode(tabs[next].dataset.diTab,{focus:true})}
    });
  });

  // Els tres catàlegs comparteixen el controlador de cerca. Les opcions de país
  // es generen de les metadades de les targetes (incloent itineraris multipaís).
  const clean=value=>String(value||'').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
  const plurals={
    itinerarios:['itinerario','itinerarios'],
    guias:['guía','guías'],
    consejos:['consejo','consejos']
  };
  validModes.forEach(mode=>{
    const panel=panels.get(mode);
    const input=panel.querySelector('[data-di-search-input="'+mode+'"]');
    const grid=panel.querySelector('[data-di-list="'+mode+'"]');
    const type=panel.querySelector('[data-di-filter-type="'+mode+'"]');
    const continent=panel.querySelector('[data-di-filter-continent="'+mode+'"]');
    const country=panel.querySelector('[data-di-filter-country="'+mode+'"]');
    const reset=panel.querySelector('[data-di-reset="'+mode+'"]');
    const count=panel.querySelector('[data-di-count="'+mode+'"]');
    const empty=panel.querySelector('[data-di-empty="'+mode+'"]');
    if(!grid||!input||!count||!empty)return;
    const cards=[...grid.querySelectorAll('[data-di-item]')];

    if(country){
      const names=new Map();
      for(const card of cards){
        const codes=(card.dataset.country||'').split(/\s+/).filter(Boolean);
        const line=card.querySelector('.di-country-line');
        const labels=(line?.lastElementChild?.textContent||'').split(' · ').map(s=>s.trim());
        codes.forEach((code,i)=>{
          if(code&&labels[i]&&!names.has(code))names.set(code,labels[i]);
        });
      }
      [...names].sort((a,b)=>a[1].localeCompare(b[1],'es'))
        .forEach(([code,label])=>{
          const option=document.createElement('option');
          option.value=code;option.textContent=label;country.appendChild(option);
        });
    }
    const matchTokens=(attribute,selected)=>{
      if(!selected||selected==='all')return true;
      return String(attribute||'').split(/\s+/).includes(selected);
    };
    const update=()=>{
      const q=clean(input.value);
      let visible=0;
      for(const card of cards){
        const haystack=clean((card.dataset.diSearch||'')+' '+card.textContent);
        const show=haystack.includes(q)
          &&(!type||matchTokens(card.dataset.type,type.value))
          &&(!continent||matchTokens(card.dataset.continent,continent.value))
          &&(!country||matchTokens(card.dataset.country,country.value));
        card.hidden=!show;
        if(show)visible++;
      }
      const unit=plurals[mode][visible===1?0:1];
      count.textContent=visible+' '+unit;
      empty.hidden=visible!==0;
    };
    input.addEventListener('input',update);
    input.addEventListener('search',update);
    [type,continent,country].filter(Boolean).forEach(el=>el.addEventListener('change',update));
    reset?.addEventListener('click',()=>{
      input.value='';
      [type,continent,country].filter(Boolean).forEach(el=>{el.value='all'});
      update();
      input.focus();
    });
    update();
  });

  const hash=window.location.hash.replace('#','');
  setMode(validModes.includes(hash)?hash:'itinerarios');
})();
