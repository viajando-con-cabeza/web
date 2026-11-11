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

  // Catàlegs reals de pàgines: cerca immediata, independent per pestanya.
  // Les miniatures i els enllaços són HTML estàtic perquè siguin accessibles i indexables.
  const clean=(value)=>String(value||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('es').trim();
  const plurals={
    itinerarios:['itinerario','itinerarios'],
    guias:['guía','guías'],
    consejos:['consejo','consejos']
  };
  validModes.forEach(mode=>{
    const input=document.querySelector('[data-di-search-input="'+mode+'"]');
    const root=document.querySelector('[data-di-list="'+mode+'"]');
    const count=document.querySelector('[data-di-count="'+mode+'"]');
    const empty=document.querySelector('[data-di-empty="'+mode+'"]');
    if(!input||!root||!count||!empty)return;
    const cards=[...root.querySelectorAll('[data-di-item]')];
    const update=()=>{
      const query=clean(input.value);
      let matches=0;
      cards.forEach(card=>{
        const found=!query||clean(card.dataset.diSearch).includes(query);
        card.hidden=!found;
        if(found)matches++;
      });
      const unit=plurals[mode][matches===1?0:1];
      count.textContent=matches+' '+unit;
      empty.hidden=matches!==0;
    };
    input.addEventListener('input',update);
    input.addEventListener('search',update);
    update();
  });

  // Propostes orientatives de destí, sense atribuir experiències no verificades.
  // Cada opció apunta a una guia publicada o a una pàgina de país disponible.
  const ideas={
    ciudad:{
      corto:{place:'ESTOCOLMO, SUECIA',description:'Para unos días de ciudad, combinar barrios, museos y paseos junto al agua es un plan muy completo.',link:'/destinos/suecia/estocolmo/',label:'VER GUÍA DE ESTOCOLMO'},
      medio:{place:'ESTOCOLMO Y SUS ALREDEDORES',description:'Con más días, disfrutaríamos de Estocolmo con calma y dejaríamos tiempo para alguna excursión.',link:'/destinos/suecia/estocolmo/',label:'VER GUÍA DE ESTOCOLMO'},
      largo:{place:'SUECIA, SIN PRISAS',description:'Si tienes más de una semana, combinaríamos ciudad y paisajes, con tiempo para explorar distintos rincones del país.',link:'/destinos/suecia/',label:'DESCUBRIR SUECIA'}
    },
    naturaleza:{
      corto:{place:'SUECIA: PAISAJES Y PASEOS',description:'Para pocos días, elegiríamos una base cómoda y alternaríamos visitas urbanas con naturaleza cercana.',link:'/destinos/suecia/',label:'DESCUBRIR SUECIA'},
      medio:{place:'SUIZA Y SUS MONTAÑAS',description:'Con una semana, apostaríamos por paisajes alpinos, lagos y pequeñas excursiones adaptadas a tu ritmo.',link:'/destinos/suiza/',label:'DESCUBRIR SUIZA'},
      largo:{place:'SUIZA: RUTA ENTRE PAISAJES',description:'Con tiempo, combinaríamos varios valles y zonas de montaña, dejando margen para disfrutar de cada parada.',link:'/destinos/suiza/',label:'DESCUBRIR SUIZA'}
    },
    playa:{
      corto:{place:'ISLAS CANARIAS',description:'Para una escapada de sol, buscaríamos una isla que permita combinar playa y planes sin grandes desplazamientos.',link:'/destinos/espana/',label:'VER DESTINOS DE ESPAÑA'},
      medio:{place:'ISLAS CANARIAS CON CALMA',description:'Una semana invita a combinar playas, paisajes y pueblos, sin cambiar de alojamiento constantemente.',link:'/destinos/espana/',label:'VER DESTINOS DE ESPAÑA'},
      largo:{place:'INDONESIA: PLAYAS Y CULTURA',description:'Con más días, valoraríamos un viaje que combine costa, cultura y naturaleza, planificando bien los traslados.',link:'/destinos/indonesia/',label:'DESCUBRIR INDONESIA'}
    },
    navidad:{
      corto:{place:'AUSTRIA EN ADVIENTO',description:'Una escapada a una ciudad austríaca puede ser una buena opción para disfrutar del ambiente y los mercados.',link:'/destinos/austria/',label:'DESCUBRIR AUSTRIA'},
      medio:{place:'AUSTRIA Y ALEMANIA EN NAVIDAD',description:'Con cinco o siete días, elegiríamos un par de ciudades y las conectaríamos en una ruta navideña sin prisas.',link:'/destinos/austria/',label:'DESCUBRIR AUSTRIA'},
      largo:{place:'UNA RUTA NAVIDEÑA POR EUROPA',description:'Con más de una semana, combinaríamos ciudades, mercados y paisajes alpinos, adaptando el recorrido a las fechas.',link:'/destinos/',label:'EXPLORAR DESTINOS'}
    }
  };
  const interest=document.getElementById('di-interest');
  const days=document.getElementById('di-days');
  const place=document.getElementById('di-advice-place');
  const message=document.getElementById('di-advice-text');
  const link=document.getElementById('di-advice-link');
  function updateAdvice(){
    const idea=ideas[interest.value]?.[days.value];
    if(!idea)return;
    place.textContent=idea.place;
    message.textContent=idea.description;
    link.href=idea.link;
    link.firstChild.textContent=idea.label+' ';
  }
  interest.addEventListener('change',updateAdvice);
  days.addEventListener('change',updateAdvice);
  const hash=window.location.hash.replace('#','');
  setMode(validModes.includes(hash)?hash:'itinerarios');
  updateAdvice();
})();
