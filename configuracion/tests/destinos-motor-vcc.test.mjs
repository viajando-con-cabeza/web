import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDestination,routeOf,validateModel} from '../scripts/lib/plantilles-destins-vcc.mjs';

const base=()=>({
 version:1,kind:'country',country:'noruega',slug:'noruega',name:'Noruega',
 seoTitle:'Guía de Noruega | Viajando con Cabeza',
 description:'Descripción editorial en preparación sobre Noruega.',
 tagline:'Naturaleza y ciudades',status:'draft',editorialReviewed:false,
 heroImage:null,heroAlt:'',facts:[{label:'CAPITAL',value:'Oslo'}],
 sections:[{id:'rutas',title:'RUTAS',kicker:'Elige tu viaje',
   cards:[{title:'Oslo',description:'Una ciudad por preparar',href:'/destinos/noruega/oslo/'}]}],
 faq:[{question:'¿Qué veremos?',answer:'Guía en preparación.'}]
});
test('País noindex, components i capçalera sense duplicar CSS',()=>{
 const html=renderDestination(base());
 assert.match(html,/data-vcc-generated-destination="1"/);
 assert.match(html,/class="vcc-destino-card vcc-guide-hero-copy"/);
 assert.match(html,/class="vcc-destino-facts"/);
 assert.match(html,/noindex,follow/);
 assert.doesNotMatch(html,/rel="canonical"/);
 assert.match(html,/PRÓXIMAMENTE/);
 assert.equal((html.match(/fonts.googleapis.com\/css2/g)||[]).length,1);
 assert.equal((html.match(/destinos-genericos-vcc\.css/g)||[]).length,1);
 assert.equal(routeOf(base()),'/destinos/noruega/');
});
test('Regió i ciutat amb itinerari a la mateixa jerarquia de rutes',()=>{
 const region={...base(),kind:'region',slug:'fiordos',name:'Fiordos'};
 const city={...base(),kind:'city',region:'fiordos',slug:'bergen',name:'Bergen'};
 const route={...base(),kind:'itinerary',region:'fiordos',city:'bergen',slug:'itinerario',
  name:'Bergen en 3 días',days:[{title:'Día 1',stops:['Bryggen','Puerto']}],facts:[]};
 assert.equal(routeOf(region),'/destinos/noruega/fiordos/');
 assert.equal(routeOf(city),'/destinos/noruega/fiordos/bergen/');
 assert.equal(routeOf(route),'/destinos/noruega/fiordos/bergen/itinerario');
 assert.match(renderDestination(route),/Día 1/);
 assert.match(renderDestination(route),/Bryggen/);
});
test('No accepta fotos alienes ni dades aprovades sense revisió',()=>{
 const thirdParty={...base(),heroImage:['https:/','/tercers.invalid/photo-1.jpg'].join('')};
 assert.ok(validateModel(thirdParty).some(x=>x.includes('Imatge no autoritzada')));
 const fraudulent={...base(),status:'reviewed',heroImage:null};
 assert.ok(validateModel(fraudulent).length>=2);
 assert.throws(()=>renderDestination(fraudulent),/Dades invàlides/);
});
test('Pàgina espanyola aprovada rep canonical i schema real sense inventar reviews',()=>{
 const sw={...base(),kind:'city',country:'suecia',slug:'estocolmo',name:'Estocolmo',
  status:'reviewed',editorialReviewed:true,heroImage:'https://img.viajandoconcabeza.com/destinos/suecia/estocolmo/2026-dia6/DSC07935-VSCO.avif'};
 const html=renderDestination(sw);
 assert.match(html,/rel="canonical" href="https:\/\/viajandoconcabeza.com\/destinos\/suecia\/estocolmo\/"/);
 assert.match(html,/"@type":"BreadcrumbList"/);
 assert.match(html,/"@type":"WebPage"/);
 assert.doesNotMatch(html,/aggregateRating|reviewRating|dateModified/);
 assert.doesNotMatch(html,/noindex/);
});
