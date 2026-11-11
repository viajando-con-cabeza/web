/* Cuándo ir · Estocolmo | Fuente única de la lógica de página.
   Mantener en configuracion para permitir ajustes sin editar el HTML editorial. */
(()=>{
  // Los datos de los doce meses se mantienen únicamente en el HTML, para SEO y coherencia.
  const objectives=[
    {id:'clima',icon:'/configuracion/imagenes/iconos/tabler/mejor-clima.svg',label:'Mejor clima',months:[5,6,7],title:'JUNIO – AGOSTO',description:'Días largos, temperaturas agradables y mucha vida en la ciudad.',reasons:['Hasta unas 18 horas de luz','Paseos y actividades al aire libre','Más ambiente, pero también más visitantes']},
    {id:'calma',icon:'/configuracion/imagenes/iconos/tabler/menos-turistas.svg',label:'Menos turistas',months:[2,3,9,10],title:'MARZO – ABRIL · OCTUBRE – NOVIEMBRE',description:'Una experiencia más tranquila, aceptando un tiempo más frío y variable.',reasons:['Menos aglomeraciones habituales','Más calma en calles y museos','Días más cortos que en verano']},
    {id:'ahorro',icon:'/configuracion/imagenes/iconos/tabler/ahorrar.svg',label:'Ahorrar',months:[0,1,10],title:'ENERO – FEBRERO · NOVIEMBRE',description:'Meses que suelen ofrecer oportunidades para reducir gastos en alojamiento y transporte.',reasons:['Demanda generalmente menor','Compara tarifas antes de reservar','Más frío y menos horas de luz']},
    {id:'navidad',icon:'/configuracion/imagenes/iconos/tabler/mercados-navidad.svg',label:'Mercados de Navidad',months:[11],title:'DICIEMBRE',description:'La mejor opción si tu objetivo es disfrutar del ambiente y los mercados navideños.',reasons:['Mercadillos y decoración navideña','Atardeceres tempranos y luces','Consulta las fechas concretas de apertura']},
    {id:'nieve',icon:'/configuracion/imagenes/iconos/tabler/nieve-paisajes.svg',label:'Nieve y paisajes',months:[0,1],title:'ENERO – FEBRERO',description:'Los meses más fríos son los más adecuados para buscar paisajes de invierno.',reasons:['Más posibilidades de frío y nieve','Ambiente nórdico invernal','La nieve nunca está garantizada']},
    {id:'primavera',icon:'/configuracion/imagenes/iconos/tabler/primavera.svg',label:'Primavera con encanto',months:[4],title:'MAYO',description:'Una gran alternativa si quieres parques florecidos, luz y temperaturas suaves.',reasons:['Naturaleza y jardines en primavera','Días cada vez más largos','Menos afluencia que en pleno verano']}
  ];
  const calendar=document.getElementById('yearCalendar'),choices=document.getElementById('objectiveChoices');
  let selected='clima',selectedMonth=5;
  choices.innerHTML=objectives.map(o=>'<button type="button" class="ci-objective" data-id="'+o.id+'" aria-pressed="false"><span class="ci-objective-icon" aria-hidden="true"><img src="'+o.icon+'" alt="" width="26" height="26" decoding="async"></span><strong>'+o.label+'</strong></button>').join('');
  // Calendario prerenderizado en HTML, visible para lectores y rastreadores sin ejecutar JavaScript.
  const monthPanels=Array.from(document.querySelectorAll('.ci-month-result[data-month-panel]'));
  // Los paneles de los 12 meses están en el HTML; se alterna únicamente su visibilidad.
  const detail=(i)=>{
    selectedMonth=i;
    monthPanels.forEach((panel,j)=>{panel.hidden=j!==i});
    calendar.querySelectorAll('button[data-month]').forEach((btn,j)=>{
      btn.setAttribute('aria-pressed',String(j===i));
    });
  };
  const select=(id)=>{selected=id;const o=objectives.find(x=>x.id===id);choices.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));document.getElementById('recommendationMonths').textContent=o.title;document.getElementById('recommendationWhy').textContent=o.description;document.getElementById('recommendationReasons').innerHTML=o.reasons.map(r=>'<li>'+r+'</li>').join('');calendar.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('recommended',o.months.includes(i)));detail(o.months[0])};
  choices.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(b)select(b.dataset.id)});
  const calendarScroll=calendar.closest('.ci-calendar-scroll');
  const scrollToMonth=button=>{
    if(!calendarScroll||!button)return;
    const pos=button.offsetLeft-calendarScroll.clientWidth/2+button.clientWidth/2;
    calendarScroll.scrollTo({left:Math.max(0,pos),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  };
  calendar.addEventListener('click',e=>{
    const b=e.target.closest('button[data-month]');
    if(!b)return;
    detail(Number(b.dataset.month));
    if(window.matchMedia('(max-width: 750px)').matches)scrollToMonth(b);
  });
  // El calendario también se puede recorrer con las flechas del teclado.
  calendar.addEventListener('keydown',e=>{
    if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
    const currentButton=e.target.closest('button[data-month]');
    if(!currentButton)return;
    e.preventDefault();
    const next=Math.min(11,Math.max(0,Number(currentButton.dataset.month)+(e.key==='ArrowRight'?1:-1)));
    detail(next);
    const button=calendar.querySelector('button[data-month="'+next+'"]');
    button?.focus();
    if(window.matchMedia('(max-width: 750px)').matches)scrollToMonth(button);
  });
  select('clima');
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
