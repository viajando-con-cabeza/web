/* Valida que totes les guies publicades facin servir el visor VCC únic.
 * Executar: node configuracion/scripts/validar-galeries.mjs
 * Només revisa URL del sitemap: una pàgina sense galeria no carrega res extra.
 */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve('.');
const sitemap=readFileSync(join(root,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
const errors=[];
let checked=0,withGallery=0;
const sharedCSS='/configuracion/css/componentes/vcc-gallery-booking.css';
const sharedJS='/configuracion/js/componentes/vcc-gallery-booking.js';

for(const url of urls){
 const pathname=new URL(url).pathname;
 const filePath=pathname.endsWith('/')?pathname+'index.html':
   pathname.endsWith('.html')?pathname:pathname+'.html';
 const local=join(root,filePath.replace(/^\/+/, ''));
 if(!existsSync(local)){errors.push(filePath+': fitxer del sitemap no trobat');continue;}
 ++checked;
 const html=readFileSync(local,'utf8');
 // Modal declarat o galeria visible al document (incloses les generades per JS).
 const gallery=/data-vcc-booking-gallery\b|\bclass=["'][^"']*\b(?:gallery|day-gallery|gallery-mosaic|vcc-booking-gallery)\b[^"']*["']/i.test(html);
 const legacy=/<script\b[^>]+src=["'][^"']*imprescindibles-galeria-(?:movil|escritorio)\.js/i.test(html)
  ||/<link\b[^>]+href=["'][^"']*imprescindibles-galeria-(?:movil|escritorio)\.css/i.test(html)
  ||/\bid=["']lightbox["']/i.test(html);
 if(!gallery&&!legacy)continue;
 ++withGallery;
 const check=(valid,msg)=>{if(!valid)errors.push(filePath+': '+msg);};
 check(!legacy,'visor antic detectat');
 check(html.includes(sharedCSS),'falta el CSS de la galeria compartida');
 check(html.includes(sharedJS),'falta el controlador JS de la galeria compartida');
 check((html.match(/data-vcc-booking-gallery\b/g)||[]).length===1,
  'ha de tenir un únic modal [data-vcc-booking-gallery]');
 check(/data-vcc-gallery-selector=["'][^"']+["']/.test(html),
  'falta indicar els mosaics amb data-vcc-gallery-selector');
}
if(errors.length){
 console.error('Galeries VCC: '+errors.length+' incidència/es\n'+errors.map(e=>' - '+e).join('\n'));
 process.exitCode=1;
}else{
 console.log('Galeries VCC correctes: '+withGallery+' pàgines amb visor compartit de '+checked+' URL comprovades.');
}
