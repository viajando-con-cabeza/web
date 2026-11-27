/* Cuándo ir · Suecia | Fuente única de la lógica de página.
   Mantener en configuracion para permitir ajustes sin editar el HTML editorial. */
(()=>{
  // Cada objetivo muestra su recomendación de temporada; el detalle depende de la región.
  const objectives=[
    {id:'clima',icon:'/configuracion/imagenes/iconos/tabler/mejor-clima.svg',label:'Mejor clima',title:'Junio a Agosto',description:'Días largos, rutas por ciudades, lagos y costa; recuerda las diferencias regionales.',reasons:['Muchas horas de luz en el centro, todavía más al norte','Excursiones, ferris y naturaleza','Demanda elevada en destinos de verano']},
    {id:'calma',icon:'/configuracion/imagenes/iconos/tabler/menos-turistas.svg',label:'Menos turistas',title:'Marzo a Abril · Octubre a Noviembre',description:'Viaje más tranquilo por el sur y las ciudades, con tiempo más cambiante.',reasons:['Menos aglomeraciones habituales','Menos movimiento en varios destinos','Servicios de temporada más limitados']},
    {id:'ahorro',icon:'/configuracion/imagenes/iconos/tabler/ahorrar.svg',label:'Ahorrar',title:'Enero a Febrero · Noviembre',description:'Meses que suelen ofrecer oportunidades para reducir gastos en alojamiento y transporte.',reasons:['Demanda generalmente menor','Compara tarifas antes de reservar','Más frío y menos horas de luz']},
    {id:'navidad',icon:'/configuracion/imagenes/iconos/tabler/mercados-navidad.svg',label:'Mercados de Navidad',title:'Diciembre',description:'La mejor opción si tu objetivo es disfrutar del ambiente y los mercados navideños.',reasons:['Mercadillos y decoración navideña','Atardeceres tempranos y luces','Consulta las fechas concretas de apertura']},
    {id:'nieve',icon:'/configuracion/imagenes/iconos/tabler/nieve-paisajes.svg',label:'Nieve y paisajes',title:'Enero a Febrero',description:'Los meses más fríos son los más adecuados para buscar paisajes de invierno.',reasons:['Más posibilidades de frío y nieve','Ambiente nórdico invernal','La nieve nunca está garantizada']},
    {id:'primavera',icon:'/configuracion/imagenes/iconos/tabler/primavera.svg',label:'Primavera con encanto',title:'Mayo',description:'Una gran alternativa si quieres parques florecidos, luz y temperaturas suaves.',reasons:['Naturaleza y jardines en primavera','Días cada vez más largos','Menos afluencia que en pleno verano']}
  ];
  // Índice regional: no mezclar el clima de Estocolmo con datos del país.
  // Se conservan los objetivos y el Consejo VCC, sin calendario genérico.
  const choices=document.getElementById('objectiveChoices');
  if(choices){
    choices.innerHTML=objectives.map(o=>'<button type="button" class="ci-objective" data-id="'+o.id+'" aria-pressed="false"><span class="ci-objective-icon" aria-hidden="true"><img src="'+o.icon+'" alt="" width="26" height="26" decoding="async"></span><strong>'+o.label+'</strong></button>').join('');
    const select=id=>{
      const obj=objectives.find(o=>o.id===id);
      if(!obj)return;
      choices.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));
      document.getElementById('recommendationMonths').textContent=obj.title;
      document.getElementById('recommendationWhy').textContent=obj.description;
      document.getElementById('recommendationReasons').replaceChildren(...obj.reasons.map(reason=>{
        const li=document.createElement('li');li.textContent=reason;return li;
      }));
    };
    choices.addEventListener('click',event=>{
      const button=event.target.closest('button[data-id]');
      if(button&&choices.contains(button))select(button.dataset.id);
    });
    select('clima');
  }
  // Carrusel regional: cuatro tarjetas de ancho completo en escritorio.
  const regionTrack=document.getElementById('ciRegionTrack');
  const regionPrev=document.getElementById('ciRegionPrev');
  const regionNext=document.getElementById('ciRegionNext');
  if(regionTrack&&regionPrev&&regionNext){
    const cards=[...regionTrack.querySelectorAll('.ci-region-card')];
    const step=()=>cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:(cards[0]?.getBoundingClientRect().width||1);
    const sync=()=>{
      const end=Math.max(0,regionTrack.scrollWidth-regionTrack.clientWidth);
      regionPrev.disabled=regionTrack.scrollLeft<=2;
      regionNext.disabled=regionTrack.scrollLeft>=end-2;
    };
    const move=direction=>{
      const width=step();
      if(width<=0)return;
      const end=Math.max(0,regionTrack.scrollWidth-regionTrack.clientWidth);
      const left=Math.max(0,Math.min(end,(Math.round(regionTrack.scrollLeft/width)+direction)*width));
      regionTrack.scrollTo({left,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    };
    regionPrev.addEventListener('click',()=>move(-1));
    regionNext.addEventListener('click',()=>move(1));
    regionTrack.addEventListener('scroll',sync,{passive:true});
    regionTrack.addEventListener('keydown',event=>{
      if(event.target===regionTrack&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){
        event.preventDefault();move(event.key==='ArrowRight'?1:-1);
      }
    });
    window.addEventListener('resize',sync,{passive:true});
    sync();
  }

  const tipsTrack=document.getElementById('ciTipsTrack');
  const tipsPrev=document.getElementById('ciTipsPrev');
  const tipsNext=document.getElementById('ciTipsNext');
  const syncTips=()=>{
    const end=Math.max(0,tipsTrack.scrollWidth-tipsTrack.clientWidth);
    tipsPrev.disabled=tipsTrack.scrollLeft<=2;
    tipsNext.disabled=tipsTrack.scrollLeft>=end-2;
  };
  const moveTips=direction=>{
    const item=tipsTrack.querySelector('.ci-tip-card');
    if(!item)return;
    const gap=parseFloat(getComputedStyle(tipsTrack).gap)||14;
    tipsTrack.scrollBy({left:direction*(item.getBoundingClientRect().width+gap),behavior:'smooth'});
  };
  tipsPrev.addEventListener('click',()=>moveTips(-1));
  tipsNext.addEventListener('click',()=>moveTips(1));
  tipsTrack.addEventListener('scroll',syncTips,{passive:true});
  window.addEventListener('resize',syncTips);
  syncTips();

  // Nuestra experiencia: un consejo completo por pantalla pequeña.
  // Las flechas acompañan al desplazamiento táctil y no alteran el escritorio.
  const weatherTrack=document.querySelector('.ci-august-weather-options');
  const weatherPrev=document.querySelector('.ci-august-weather-prev');
  const weatherNext=document.querySelector('.ci-august-weather-next');
  if(weatherTrack&&weatherPrev&&weatherNext){
    const cards=[...weatherTrack.querySelectorAll('.ci-august-plan')];
    const currentWeatherIndex=()=>{
      if(cards.length<2)return 0;
      const step=cards[1].offsetLeft-cards[0].offsetLeft;
      return step>0?Math.min(cards.length-1,Math.max(0,Math.round(weatherTrack.scrollLeft/step))):0;
    };
    const syncWeather=()=>{
      const index=currentWeatherIndex();
      weatherPrev.disabled=index===0;
      weatherNext.disabled=index===cards.length-1;
    };
    const moveWeather=direction=>{
      const index=Math.min(cards.length-1,Math.max(0,currentWeatherIndex()+direction));
      if(!cards[index])return;
      const left=cards[index].offsetLeft-cards[0].offsetLeft;
      weatherTrack.scrollTo({
        left,
        behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'
      });
    };
    weatherPrev.addEventListener('click',()=>moveWeather(-1));
    weatherNext.addEventListener('click',()=>moveWeather(1));
    weatherTrack.addEventListener('scroll',syncWeather,{passive:true});
    weatherTrack.addEventListener('keydown',e=>{
      if(e.target!==weatherTrack)return;
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        e.preventDefault();moveWeather(e.key==='ArrowRight'?1:-1);
      }
    });
    window.addEventListener('resize',syncWeather,{passive:true});
    syncWeather();
  }

})();
