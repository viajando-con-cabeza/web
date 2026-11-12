import fs from 'node:fs';
import crypto from 'node:crypto';
import {ROOT,approvedFiles} from './lib/publicacion-vcc.mjs';
const read=p=>fs.readFileSync(ROOT+'/'+p,'utf8');
const registry=JSON.parse(read('configuracion/datos/portadas-vcc.json')).pages;
const fondos=JSON.parse(read('configuracion/imagenes/fondos/optimizadas/manifest.json')).images;
const externas=JSON.parse(read('configuracion/imagenes/externas/unsplash/optimizadas/manifest.json')).images;
const css=read('configuracion/css/componentes/portadas-rapidas-vcc.css');
const problems=[],used=new Set();
const check=(yes,message)=>{if(!yes)problems.push(message);};
for(const {page,image,selector,kind,source,r2} of registry){
  const external=source==='externas',info=(external?externas:fondos)[image];
  check(!used.has(page),page+': duplicat al registre');
  used.add(page);
  check(approvedFiles.includes(page),page+': no és un HTML aprovat');
  if(!info){problems.push(page+': font d'+'imatge absent');continue;}
  const src=ROOT+info.source;
  const sha=crypto.createHash('sha256').update(fs.readFileSync(src)).digest('hex').slice(0,12);
  check(sha===info.fingerprint,page+': variants desactualitzades');
  const versions=[960,external?1600:1920];
  const urls=versions.map(w=>{
    const v=info.variants[String(w)];
    check(!!v,page+': falta la variant '+w);
    if(!v)return '';
    check(fs.existsSync(ROOT+v.path),page+': manca '+v.path);
    if(w===960)check(v.bytes<275000,page+': foto mòbil massa pesada');
    return v.path+'?v='+info.fingerprint;
  });
  const html=read(page),head=html.split(/<\/head\s*>/i)[0];
  const preloads=[...head.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0])
    .filter(tag=>tag.includes('rel="preload"')&&tag.includes('as="image"'));
  if(r2){
    // Una portada real del visor R2 utilitza UN preload AVIF. No iniciar
    // també els WebP antics, que duplicarien la descàrrega de la fotografia.
    check(preloads.length===1,page+': cal un únic preload AVIF R2');
    check(preloads.some(t=>t.includes('href="'+r2+'"')&&t.includes('type="image/avif"')&&t.includes('fetchpriority="high"')),
      page+': preload AVIF no coincideix amb la portada R2');
  }else{
    check(preloads.length===2,page+': dos preloads WebP responsius');
    for(const [i,media] of ['(max-width: 767px)','(min-width: 768px)'].entries())
      check(preloads.some(t=>t.includes('media="'+media+'"')&&t.includes('href="'+urls[i]+'"')&&t.includes('fetchpriority="high"')),
        page+': preload '+media+' no coincideix');
  }
  const viewport=head.search(/<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*>/i);
  check(viewport>=0&&viewport<head.indexOf(preloads[0]),
    page+': el viewport ha de precedir els preloads per evitar la foto desktop en mòbil');
  const cssFirst=head.search(/<link\b[^>]*rel="stylesheet"/i);
  check(cssFirst<0||head.indexOf(preloads[0])<cssFirst,page+': preload LCP darrere CSS');
  check(html.includes('data-vcc-fast-heroes'),page+': manca CSS comú');
  if(kind==='img'){
    const tag=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]).find(t=>t.includes(selector))||'';
    check((r2?tag.includes(r2):urls.every(u=>tag.includes(u)))&&tag.includes('fetchpriority="high"'),
      page+': imatge <img> inconsistent');
  }else{
    check(css.includes(selector+'{')&&(r2?css.includes(r2):urls.every(u=>css.includes(u))),
      page+': foto de CSS diferent de preload');
  }
  if(external)check(!preloads.some(t=>t.includes('fondos-presupuesto')),
    page+': preload de foto equivocada');
}

// No tornar a introduir canvis tardans d'alçada als herois que van donar NO_LCP.
const stableLcpPages=[
  'destinos/suecia/estocolmo/presupuesto.html',
  'destinos/suecia/estocolmo/como-llegar.html',
  'destinos/suecia/estocolmo/como-moverse.html',
  'destinos/suecia/estocolmo/donde-dormir.html',
  'destinos/suecia/estocolmo/que-llevar.html'
];
const sharedSubheader=read('configuracion/css/componentes/subheader-unificado-vcc.css');
check(sharedSubheader.includes('#vcc-lcp-hero')&&sharedSubheader.includes('--vcc-lcp-stable-height'),
  'Manca la mida de portada mòbil estable per al LCP');
for(const page of stableLcpPages){
  const html=read(page);
  const matches=[...html.matchAll(/\bid="vcc-lcp-hero"/g)];
  check(matches.length===1,page+': manca identificador únic del hero LCP');
  const head=html.split(/<\/head\s*>/i)[0];
  const r2=registry.find(item=>item.page===page)?.r2;
  const wanted=r2?1:2;
  check((head.match(/rel="preload" as="image"/g)||[]).length===wanted,
    page+': el nombre de preloads ha de coincidir amb el tipus de portada');
}

check(registry.length===19,'El registre ha de tenir 19 portades');
if(problems.length){problems.forEach(x=>console.error('HERO VCC:',x));process.exitCode=1;}
else console.log('HERO VCC OK: 19 portades, mateixa fotografia, càrrega LCP primerenca.');
