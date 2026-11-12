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
  const html=read(file);
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0])
    .filter(tag=>/\brel=["']stylesheet["']/i.test(tag))
    .map(tag=>tag.match(/\bhref=["']([^"']+)["']/i)?.[1]||'').filter(Boolean);
  // L'hero i el core es gestionen de manera compartida i no són CSS de pàgina.
  const shared=new Set(['/componentes/portadas-rapidas-vcc.css','/componentes/vcc-core-compartit.css']);
  const local=links.filter(url=>url.startsWith('/configuracion/css/') &&
    ![...shared].some(suffix=>url.split('?')[0].endsWith(suffix)));
  if(local.length>maxLocalCss)
    failures.push(file+': '+local.length+' CSS propis (límit actual '+maxLocalCss+')');
  const urls=links.filter(url=>url.startsWith('/configuracion/css/')).map(url=>url.split('?')[0]);
  if(new Set(urls).size!==urls.length)
    failures.push(file+': mateix CSS enllaçat més d’una vegada');
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
 const html=read(file);
 const localCSS=[...html.matchAll(/<link\b[^>]*>/gi)]
   .map(m=>m[0]).filter(tag=>/\brel=["']stylesheet["']/i.test(tag))
   .map(tag=>tag.match(/\bhref=["']([^"']+)/i)?.[1]?.split('?')[0]||'')
   .filter(url=>url.startsWith('/configuracion/css/'));
 if(localCSS.length>16)failures.push(file+': '+localCSS.length+' CSS locals (màxim 16, agrupa components)');
 if(new Set(localCSS).size!==localCSS.length)failures.push(file+': fulls CSS duplicats');
 if(/<style\b/i.test(html))failures.push(file+': no incloure blocs <style> a HTML publicat');
 const logos=[...html.matchAll(/<img\b(?=[^>]*\bsrc=["']\/configuracion\/imagenes\/marca\/logo-viajando-con-cabeza\.svg["'])[^>]*>/gi)];
 if(logos.some(m=>!/\bwidth=["']620["']/.test(m[0])||!/\bheight=["']216["']/.test(m[0])))
   failures.push(file+': logotip sense proporció intrínseca 620×216');

 // CSS base disponible abans d'executar JavaScript: evita reflows del menú.
 const coreTags=[...html.matchAll(/<link\b[^>]*data-vcc-core-styles[^>]*>/gi)];
 if(coreTags.length!==1 || !coreTags[0][0].includes('/configuracion/css/componentes/vcc-core-compartit.css'))
   failures.push(file+': falta un únic enllaç estàtic al CSS global VCC');
}

if(failures.length){
 for(const failure of failures)console.error('VCC CSS compartit:',failure);
 process.exitCode=1;
}else console.log('VCC CSS compartit OK: dependències, estils inline i utilitats coherents.');
