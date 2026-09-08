/*
  VCC COUNTRY CONFIG TEMPLATE
  Copy this file to js/paises/<pais>.js and replace the example values.
  The page renderer reads window.COUNTRY_CONFIG.

  Images are always configured here. For cards, imageHref is optional:
  - if imageHref exists, clicking the image uses it;
  - otherwise the image uses href;
  - if available:false, the image is not linked.
*/
window.COUNTRY_CONFIG={
  slug:"pais",
  name:"País",
  continent:"Europa",
  tagline:"Frase editorial del destino",
  description:"Descripción breve de la página del país.",
  heroImage:"https://...",
  inspirationImage:"https://...",
  paths:{home:"../../index.html",destinations:"../index.html"},
  sections:{
    guides:{kicker:"Descubre País",title:"GUÍAS DE VIAJE",description:"Texto de introducción a las guías."},
    itineraries:{kicker:"Combina las piezas",title:"ITINERARIOS EN PAÍS",description:"Texto de introducción a los itinerarios.",minimumCards:4},
    preparation:{kicker:"Antes de viajar a País",title:"PLANIFICA TU VIAJE",description:"Información práctica para preparar el viaje."},
    inspiration:{line1:"Viaja mejor,",line2:"viaja con cabeza"},
    faq:{kicker:"Antes de viajar",title:"PREGUNTAS FRECUENTES",description:"Preguntas frecuentes del destino.",sideLine1:"Viajar mejor",sideLine2:"empieza con",sideLine3:"buenas preguntas"}
  },
  facts:[['CAPITAL','...'],['IDIOMA','...'],['MONEDA','...'],['POBLACIÓN','...']],
  guides:[
    {title:'Ciudad',tag:'CIUDAD',image:'https://...',imageHref:'ciudad/index.html',text:'Descripción de la guía.',days:'3 días',scores:{experience:9,photogenic:9,things:9,food:9,transport:9,safety:9,value:9},available:true,href:'ciudad/index.html'}
  ],
  itineraries:[
    {title:'País en 7 días',tag:'7 DÍAS · RUTA',text:'Descripción del itinerario.',image:'https://...',imageHref:'ruta-7-dias/index.html',available:true,href:'ruta-7-dias/index.html'}
  ],
  preparation:[
    {icon:'◷',title:'Cuándo ir',text:'Consejo específico de este país.',image:'https://...',imageHref:'../../planifica/cuando-ir-pais/index.html',available:true,href:'../../planifica/cuando-ir-pais/index.html',ctaLabel:'VER DETALLE'},
    {icon:'✈',title:'Cómo llegar',text:'Consejo específico de este país.',image:'https://...',available:false},
    {icon:'🚆',title:'Moverse por el país',text:'Consejo específico de este país.',image:'https://...',available:false},
    {icon:'⌖',title:'Qué zona elegir',text:'Consejo específico de este país.',image:'https://...',available:false},
    {icon:'⌂',title:'Alojamiento',text:'Consejo específico de este país.',image:'https://...',available:false},
    {icon:'€',title:'Presupuesto',text:'Consejo específico de este país.',image:'https://...',available:false}
  ],
  faq:[
    {category:'SEGURIDAD',icon:'♢',question:'¿Es seguro viajar?',answer:'Respuesta específica del país.'},
    {category:'MEJOR ÉPOCA',icon:'▣',question:'¿Cuál es la mejor época?',answer:'Respuesta específica del país.'}
  ]
};