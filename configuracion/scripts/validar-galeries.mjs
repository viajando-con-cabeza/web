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
 // Un carrusel inline (p. ej. vcc-it-gallery) no es el modal de galeria.
 // Comprobar el nombre COMPLETO de clase para evitar falsos positivos.
 const gallery=/data-vcc-booking-gallery\b/.test(html) ||
   [...html.matchAll(/\bclass=["']([^"']+)["']/gi)].some(m =>
     m[1].split(/\s+/).some(name =>
       ["gallery","day-gallery","gallery-mosaic","vcc-booking-gallery"].includes(name)));
 const legacy=/<script\b[^>]+src=["'][^"']*imprescindibles-galeria-(?:movil|escritorio)\.js/i.test(html)
  ||/<link\b[^>]+href=["'][^"']*imprescindibles-galeria-(?:movil|escritorio)\.css/i.test(html)
  ||/\bid=["']lightbox["']/i.test(html);
 if(!gallery&&!legacy)continue;
 ++withGallery;
 const check=(valid,msg)=>{if(!valid)errors.push(filePath+': '+msg);};
 check(!legacy,'visor antic detectat');
 // Cuándo ir difiere CSS/JS hasta acercarse el mosaico; comprobar el cargador
 // en lugar de exigir enlaces bloqueantes en el HTML inicial.
 const lazyPath='configuracion/js/componentes/vcc-gallery-lazy-loader.js';
 const lazy=html.includes('/'+lazyPath)&&html.includes('data-vcc-lazy-gallery');
 const lazySource=lazy&&existsSync(join(root,lazyPath))
   ?readFileSync(join(root,lazyPath),'utf8'):'';
 check(lazy ? lazySource.includes(sharedCSS) : html.includes(sharedCSS),
   'falta el CSS de la galeria compartida');
 check(lazy ? lazySource.includes(sharedJS) : html.includes(sharedJS),
   'falta el controlador JS de la galeria compartida');
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
