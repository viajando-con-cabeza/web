window.SWEDEN_CONTENT={
  name:"Suecia",
  continent:"Europa",
  tagline:"Ciudades tranquilas, naturaleza y diseño nórdico ♡",
  description:"Guías por ciudades y regiones, itinerarios de una sola zona o combinados y un planificador para encontrar la ruta que mejor encaja contigo.",
  heroImage:"https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1800&q=88",
  facts:[
    ['5 ZONAS','Ciudades, costa, lagos y naturaleza'],
    ['14 DÍAS','Nuestra ruta completa'],
    ['GUÍAS + RUTAS','Combínalas a tu manera'],
    ['PLANIFICADOR','Según días, mes y estilo']
  ],
  guides:[
    {title:'Estocolmo',tag:'CIUDAD',image:'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1000&q=88',text:'Qué ver, barrios, transporte, gastronomía y consejos para descubrir la capital sueca.',days:'3 días',available:false,interests:['ciudad','cultura','gastronomia'],months:['primavera','verano','otono','invierno'],budgets:['medio','comodo'],transports:['publico'],minDays:2,maxDays:4},
    {title:'Gotemburgo',tag:'CIUDAD',image:'https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=1000&q=88',text:'Una guía práctica para conocer Gotemburgo, sus barrios, ambiente portuario y alrededores.',days:'Flexible',available:false,interests:['ciudad','gastronomia','costa'],months:['primavera','verano','otono'],budgets:['ajustado','medio','comodo'],transports:['publico'],minDays:2,maxDays:3},
    {title:'Costa Oeste',tag:'REGIÓN',image:'https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=1000&q=88',text:'Pueblos costeros, islas, carreteras panorámicas y rincones del oeste de Suecia.',days:'Flexible',available:false,interests:['costa','naturaleza','roadtrip'],months:['primavera','verano','otono'],budgets:['medio','comodo'],transports:['coche'],minDays:2,maxDays:4},
    {title:'Dalarna',tag:'REGIÓN',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=88',text:'Naturaleza, pueblos, tradición sueca y paisajes para bajar el ritmo y recorrer con calma.',days:'Flexible',available:false,interests:['naturaleza','lagos','pueblos','roadtrip'],months:['primavera','verano','otono'],budgets:['ajustado','medio','comodo'],transports:['coche'],minDays:3,maxDays:5},
    {title:'Zona de los Lagos',tag:'NATURALEZA',image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=88',text:'Una escapada entre lagos, bosques y paisajes tranquilos para combinar con otras regiones.',days:'2 días',available:false,interests:['naturaleza','lagos','roadtrip'],months:['primavera','verano','otono'],budgets:['ajustado','medio','comodo'],transports:['coche'],minDays:2,maxDays:2}
  ],
  itineraries:[
    {title:'Estocolmo en 3 días',tag:'3 DÍAS · CIUDAD',text:'Nuestro recorrido de 3 días por Estocolmo, organizado día a día.',image:'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1000&q=88',available:false,interests:['ciudad','cultura','gastronomia'],months:['primavera','verano','otono','invierno'],budgets:['medio','comodo'],transports:['publico'],minDays:3,maxDays:3},
    {title:'Estocolmo + Dalarna en 7 días',tag:'7 DÍAS · COMBINADO',text:'Una combinación de ciudad y naturaleza: Estocolmo y Dalarna en una sola ruta.',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=88',available:false,interests:['ciudad','naturaleza','lagos','pueblos'],months:['primavera','verano','otono'],budgets:['medio','comodo'],transports:['coche'],minDays:7,maxDays:7},
    {title:'Suecia en 14 días',tag:'14 DÍAS · NUESTRA RUTA',text:'Nuestra ruta completa por Gotemburgo, Costa Oeste, Dalarna, zona de los lagos y Estocolmo.',image:'https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=1000&q=88',available:false,interests:['ciudad','naturaleza','costa','lagos','roadtrip','pueblos'],months:['primavera','verano','otono'],budgets:['medio','comodo'],transports:['coche'],minDays:14,maxDays:14}
  ],
  planning:[
    ['📅 CUÁNDO VIAJAS','El mes condiciona horas de luz, clima y qué regiones encajan mejor.'],
    ['⏱ CUÁNTOS DÍAS','El planificador combina guías e itinerarios según el tiempo disponible.'],
    ['€ PRESUPUESTO','Filtra entre opciones ajustadas, medias o más cómodas.'],
    ['♡ QUÉ TE APETECE','Ciudad, naturaleza, costa, lagos, cultura, gastronomía o road trip.']
  ],
  planner:{
    months:[
      {value:'invierno',label:'Invierno'},
      {value:'primavera',label:'Primavera'},
      {value:'verano',label:'Verano'},
      {value:'otono',label:'Otoño'}
    ],
    days:[
      {value:'3',label:'2–3 días'},
      {value:'5',label:'4–5 días'},
      {value:'7',label:'6–7 días'},
      {value:'10',label:'8–10 días'},
      {value:'14',label:'11–14 días'}
    ],
    budgets:[
      {value:'ajustado',label:'€ Ajustado'},
      {value:'medio',label:'€€ Medio'},
      {value:'comodo',label:'€€€ Cómodo'}
    ],
    interests:[
      {value:'ciudad',label:'🏙 Ciudades'},
      {value:'naturaleza',label:'🌲 Naturaleza'},
      {value:'costa',label:'🌊 Costa'},
      {value:'lagos',label:'🏞 Lagos'},
      {value:'cultura',label:'🎨 Cultura'},
      {value:'gastronomia',label:'🍴 Gastronomía'},
      {value:'roadtrip',label:'🚗 Road trip'},
      {value:'pueblos',label:'🏡 Pueblos'}
    ],
    transports:[
      {value:'publico',label:'🚆 Transporte público'},
      {value:'coche',label:'🚗 Coche'}
    ]
  }
};