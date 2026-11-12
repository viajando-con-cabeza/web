/* VCC · Comprovació de CSS compartit a les pàgines publicables.
 * No modifica fitxers; falla si es reintrodueixen dependències o estils inline ja centralitzats.
 */
import fs from 'node:fs';

const failures=[];
const read=file=>fs.readFileSync(file,'utf8');
const targets={
  'index.html':4,
  'destinos/suecia/estocolmo/entradas-y-pases.html':9,
  'destinos/suecia/estocolmo/presupuesto.html':16
};
for(const [file,maxLocalCss] of Object.entries(targets)){
  // Les fulles dins <noscript> només es carreguen sense JS, no són peticions normals.
  const html=read(file).replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,'');
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0])
    .filter(tag=>/\brel=["']stylesheet["']/i.test(tag))
    .map(tag=>tag.match(/\bhref=["']([^"']+)["']/i)?.[1]||'').filter(Boolean);
  // Components realment compartits entre diversos hubs o amb la capçalera global.
  // No són CSS exclusius de la pàgina i no han de penalitzar el pressupost local.
  const shared=new Set([
    '/componentes/portadas-rapidas-vcc.css',
    '/componentes/vcc-core-compartit.css',
    '/componentes/header-fallback-vcc.css',
    '/componentes/portadas-transparencia.css',
    '/componentes/vcc-tipologia-targetes.css'
  ]);
  const local=links.filter(url=>url.startsWith('/configuracion/css/') &&
    ![...shared].some(suffix=>url.split('?')[0].endsWith(suffix)));
  if(local.length>maxLocalCss)
    failures.push(file+': '+local.length+' CSS propis (límit actual '+maxLocalCss+')');
  const urls=links.filter(url=>url.startsWith('/configuracion/css/')).map(url=>url.split('?')[0]);
  if(new Set(urls).size!==urls.length)
    failures.push(file+': mateix CSS enllaçat més d’una vegada');
  if(file==='destinos/suecia/estocolmo/presupuesto.html'){
    const bundle='/configuracion/css/plantillas/presupuesto-compilado-vcc.css';
    if(urls.length!==1||urls[0]!==bundle)
      failures.push(file+': ha de carregar un únic CSS local amb tots els components');
    const css=read(bundle.slice(1));
    for(const component of ['.vcc-editorial-carousel','.vcc-editorial-numbered-card','.vcc-editorial-error-card']){
      if(!css.includes(component))failures.push(file+': falta '+component+' al CSS compartit');
    }
  }
  for(const url of urls)if(!fs.existsSync(url.slice(1)))failures.push(file+': no existeix '+url);
}
for(const file of ['index.html','planifica/index.html','destinos/suecia/estocolmo/que-ver.html']){
  if(/<style\b/i.test(read(file)))failures.push(file+': hi ha CSS inline a <style>; cal centralitzar-lo');
}
for(const [file,pattern] of [
 ['destinos/suecia/estocolmo/cuando-ir.html',/class="ci-score-fill[^"]*"[^>]*style=["']width:/],
 ['destinos/suecia/estocolmo/donde-dormir.html',/<i\s+style=["']width:/],
 ['destinos/index.html',/style=["']cursor:default;opacity:\.58/],
 ['contacto/index.html',/style=["']/]
]){
  if(pattern.test(read(file)))failures.push(file+': estils inline que han de ser classes compartides');
}
const core=read('configuracion/css/paginas.css');
for(const file of ['destinos/suecia/estocolmo/cuando-ir.html','destinos/suecia/estocolmo/donde-dormir.html']){
  const html=read(file);
  for(const [,num] of html.matchAll(/\bvcc-bar-w(\d+)\b/g))
    if(!core.includes('.vcc-bar-w'+num+'{width:'+num+'%}'))
      failures.push(file+': no existeix utilitat compartida vcc-bar-w'+num);
}
if(!read('planifica/index.html').includes('componentes/header-fallback-vcc.css'))
  failures.push('Planifica: cal reutilitzar el CSS de capçalera compartit');
for(const [file,retired] of [
 ['index.html',/\/configuracion\/css\/inicio-(?:ajustos-quality|alineacio|iconos-instagram|tarjetas|maqueta-aprobada|social-compact|instagram-feed|hero-vcc-webp|paises-temas)/],
 ['destinos/suecia/estocolmo/entradas-y-pases.html',/entradas-pases-(?:ahorrar|editorial)-vcc\.css/],
 ['destinos/suecia/estocolmo/presupuesto.html',/presupuesto-armonia\.css/]
]){
  if(retired.test(read(file)))failures.push(file+': es carreguen CSS antics ja consolidats');
}

/* Contracte general per a totes les pàgines aprovades.
 * Els esborranys poden conservar CSS antic mentre no estiguin publicats.
 */
const published=JSON.parse(read('configuracion/datos/publicacion-vcc.json')).approved;
for(const file of published){
 const html=read(file).replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,'');
 const localCSS=[...html.matchAll(/<link\b[^>]*>/gi)]
   .map(m=>m[0]).filter(tag=>/\brel=["']stylesheet["']/i.test(tag))
   .map(tag=>tag.match(/\bhref=["']([^"']+)/i)?.[1]?.split('?')[0]||'')
   .filter(url=>url.startsWith('/configuracion/css/'));
 if(localCSS.length>16)failures.push(file+': '+localCSS.length+' CSS locals (màxim 16, agrupa components)');
 if(new Set(localCSS).size!==localCSS.length)failures.push(file+': fulls CSS duplicats');
 // Única excepció crítica: pressupost encapsula el primer fragment del
 // CSS canonitzat per evitar un full render-blocking durant el LCP mòbil.
 // Se'n valida el contingut 1:1 contra la font, sense permetre CSS arbitrari.
 const inlineBlocks=[...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)];
 for(const style of inlineBlocks){
   const critical=file==='destinos/suecia/estocolmo/presupuesto.html'&&
      style[1].includes('data-vcc-budget-critical')&&
      read('configuracion/css/destinos/suecia/estocolmo/presupuesto-perfiles-desplegables.css').startsWith(style[2]);
   if(!critical)failures.push(file+': estils inline no governats per CSS central');
 }
 const logos=[...html.matchAll(/<img\b(?=[^>]*\bsrc=["']\/configuracion\/imagenes\/marca\/logo-viajando-con-cabeza\.svg["'])[^>]*>/gi)];
 // Acceptar dimensions editorials existents; només exigir l'espai reservat.
 if(logos.some(m=>!/\bwidth=["']\d+["']/.test(m[0])||!/\bheight=["']\d+["']/.test(m[0])))
   failures.push(file+': logotip sense width/height intrínsecs');

 // CSS base disponible abans d'executar JavaScript: evita reflows del menú.
 const coreTags=[...html.matchAll(/<link\b[^>]*data-vcc-core-styles[^>]*>/gi)];
 const coreHref=coreTags[0]?.[0]||'';
 const isBudgetBundle=file==='destinos/suecia/estocolmo/presupuesto.html' &&
   coreHref.includes('/configuracion/css/plantillas/presupuesto-compilado-vcc.css') &&
   coreHref.includes('data-vcc-fast-heroes') &&
   coreHref.includes('data-vcc-budget-css');
 if(coreTags.length!==1 ||
   !(coreHref.includes('/configuracion/css/componentes/vcc-core-compartit.css')||isBudgetBundle))
   failures.push(file+': falta un únic enllaç estàtic al CSS global VCC');
}

if(failures.length){
 for(const failure of failures)console.error('VCC CSS compartit:',failure);
 process.exitCode=1;
}else console.log('VCC CSS compartit OK: dependències, estils inline i utilitats coherents.');
