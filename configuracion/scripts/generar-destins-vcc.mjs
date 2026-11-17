/**
 * Motor de contingut VCC v2. Genera HTML estàtic a partir de JSON
 * sense tocar Suècia, Estocolm ni cap pàgina editada manualment.
 *
 * --write: crea/actualitza només pàgines amb data-vcc-generated-destination
 * --check: compara els fitxers generats amb les seves dades
 * crear kind country [region] [city] [slug]: afegeix un JSON de draft
 */
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib/publicacion-vcc.mjs';
import {renderDestination,routeOf,validateModel,entityTypes} from './lib/plantilles-destins-vcc.mjs';

const sourceRoot=path.join(ROOT,'configuracion/contenido/destinos');
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const args=process.argv.slice(2),action=args[0];
const validAction=['--check','--write','crear'].includes(action);
if(!validAction)throw new Error('Ús: --check | --write | crear kind país [regió] [ciutat] [slug]');
const issues=[],modified=[];
function walk(root){
  if(!fs.existsSync(root))return [];
  return fs.readdirSync(root,{withFileTypes:true}).flatMap(x=>{
    const p=path.join(root,x.name);
    if(x.isDirectory())return walk(p);
    return x.isFile()&&x.name.endsWith('.json')?[p]:[];
  });
}
function outputFor(model){
 const route=routeOf(model);
 return path.join(ROOT,route.endsWith('/')?route.slice(1)+'index.html':route.slice(1)+'.html');
}
function modelFromArgs(parts){
 const [kind,...segments]=parts;
 if(!entityTypes.includes(kind))throw new Error('Tipus desconegut: '+kind);
 const min={country:1,region:2,city:2,itinerary:3}[kind];
 const max={country:1,region:2,city:3,itinerary:4}[kind];
 if(segments.length<min||segments.length>max||segments.some(s=>!slug.test(s)))
   throw new Error('Arguments invàlids: '+kind+' requereix '+min+'–'+max+' slugs');
 const c={version:1,kind,slug:segments.at(-1),country:segments[0],
   status:'draft',editorialReviewed:false,name:'Nombre pendiente',
   seoTitle:'Guía en preparación | Viajando con Cabeza',
   tagline:'Viajando con Cabeza',description:'Información pendiente de revisar.',
   heroImage:null,heroAlt:'',facts:[],sections:[],faq:[],
   ...(kind==='itinerary'?{days:[]}:{}),
 };
 if(kind==='city'&&segments.length===3)c.region=segments[1];
 if(kind==='itinerary'){
   c.city=segments.at(-2);
   if(segments.length===4)c.region=segments[1];
 }
 return c;
}
if(action==='crear'){
 const model=modelFromArgs(args.slice(1)),route=routeOf(model);
 const file=path.join(sourceRoot,model.country,...(model.region?[model.region]:[]),
   model.kind+'-'+model.slug+'.json');
 if(fs.existsSync(file))throw new Error('El destí ja té dades: '+file);
 const output=outputFor(model);
 if(fs.existsSync(output))throw new Error('Ja existeix la pàgina: no tocar HTML actual '+route);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(model,null,2)+'\n');
 console.log('VCC: nou model de '+model.kind+' creat a '+path.relative(ROOT,file));
 process.exit(0);
}
const files=walk(sourceRoot);
const routes=new Set();
for(const file of files){
 let model;
 try{model=JSON.parse(fs.readFileSync(file,'utf8'))}
 catch(e){issues.push(path.relative(ROOT,file)+': JSON invàlid: '+e);continue}
 const errors=validateModel(model);
 if(errors.length){issues.push(path.relative(ROOT,file)+': '+errors.join(', '));continue}
 const route=routeOf(model);
 if(routes.has(route)){issues.push('Ruta repetida: '+route);continue}
 routes.add(route);
 const output=outputFor(model);
 let html;
 try{html=renderDestination(model)}catch(e){issues.push(route+': '+e.message);continue}
 if(fs.existsSync(output)){
   const previous=fs.readFileSync(output,'utf8');
   if(!previous.includes('data-vcc-generated-destination="1"')){
     issues.push('No sobreescriure pàgina editorial existent: '+route);
     continue;
   }
   if(previous===html)continue;
 } else if(action==='--check'){
   issues.push('No està generada la nova ruta '+route);
   continue;
 }
 modified.push(path.relative(ROOT,output));
 if(action==='--write'){
   fs.mkdirSync(path.dirname(output),{recursive:true});
   fs.writeFileSync(output,html);
 }
}
console.log('VCC destins v2:',files.length,'models,',routes.size,'rutes,',modified.length,'pendents de sincronització,',issues.length,'errors');
if(issues.length){for(const x of issues)console.error('VCC MODEL:',x);process.exitCode=1}
if(action==='--check'&&modified.length){for(const x of modified)console.error('VCC desactualitzat:',x);process.exitCode=1}
