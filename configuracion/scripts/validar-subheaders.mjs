/* VCC · Comprovació d'integració dels subheaders publicats.
 * Executar: node configuracion/scripts/validar-subheaders.mjs
 * Verifica les URL del sitemap sense modificar cap pàgina.
 */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve('.');
const read=path=>readFileSync(join(root,path),'utf8');
const sitemap=read('sitemap.xml');
const style=read('configuracion/css/componentes/subheader-unificado-vcc.css');
const script=read('configuracion/js/componentes/subheader-unificado-vcc.js');
const header=read('configuracion/js/site-header.js');
const supported=new Set('st-tabs vcc-nav place-nav-wrap country-nav mv-subnav dv-subnav ep-subnav ql-subnav ci-subnav content-nav rich-tabs cl-subnav tv-tabs'.split(' '));
const errors=[];
let checked=0,withSubheader=0;
for(const [match,url] of [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>[m,m[1]])){
 const pathname=new URL(url).pathname;
 const localPath=pathname.endsWith('/')?pathname+'index.html':pathname.endsWith('.html')?pathname:pathname+'.html';
 const local=localPath.replace(/^\/+/, '');
 if(!existsSync(join(root,local))){errors.push(local+': no existeix');continue;}
 checked++;
 const html=read(local);
 const navs=[...html.matchAll(/<nav\b[^>]*class=["']([^"']+)["'][^>]*>/gi)];
 let detected=false;
 for(const [tag,cls] of navs){
  // Las pestañas/filtros internos no son barras de anclas al contenido.
  if (/\bdata-vcc-filter-nav\b/.test(tag)) continue;
  const classes=cls.split(/\s+/);
  const eligible=classes.filter(x=>/subnav|(?:^|-)tabs$|^vcc-nav$|^country-nav$|^place-nav-wrap$|^content-nav$/.test(x));
  if(!eligible.length)continue;
  detected=true;
  if(!eligible.some(x=>supported.has(x))){
   errors.push(local+': subheader fora del component compartit: '+eligible.join(', '));
  }
  for(const name of eligible.filter(x=>supported.has(x))){
   if(!script.includes('nav.'+name)){
    errors.push(local+': subheader no reconegut pel controlador: '+name);
   }
  }
  if(classes.includes('place-nav-wrap')&&
    (html.match(/class=["']place-nav-arrow["']/g)||[]).length!==2)
   errors.push(local+': les dues fletxes de la navegació de llocs són obligatòries');
 }
 // A Suècia el subheader country-nav es crea dinàmicament.
 if(html.includes('/configuracion/js/paises/suecia-page.js'))detected=true;
 if(!detected)continue;
 withSubheader++;
 if(!html.includes('/configuracion/js/site-header.js'))
  errors.push(local+': falta el carregador global site-header.js');
}
const requirements=[
 [style.includes('--vcc-component-subheader-height,39px'),'alçada estàndard 39 px'],
 [style.includes('font:800 var(--vcc-component-subheader-desktop-font,11.5px)/1.15 var(--vcc-font-body'),'tipografia estàndard DM Sans 11.5 px'],
 [style.includes('font-size:var(--vcc-component-subheader-mobile-font,11px)!important'),'tipografia mòbil 11 px'],
 [style.includes('border-color .16s ease'),'animació coherent del subratllat'],
 [style.includes('.place-nav-arrow'),'fletxes integrades al CSS global'],
 [style.includes('prefers-reduced-motion:reduce'),'accessibilitat: moviment reduït'],
 [header.includes('configuracion/css/componentes/subheader-unificado-vcc.css'),'CSS global carregat'],
 [header.includes('configuracion/js/componentes/subheader-unificado-vcc.js'),'JS global carregat']
];
for(const [ok,label] of requirements)if(!ok)errors.push('Component global: falta '+label);
if(errors.length){
 console.error('Subheaders VCC: '+errors.length+' error(s)\n'+errors.map(x=>' - '+x).join('\n'));
 process.exitCode=1;
}else{
 console.log('Subheaders VCC coherents: '+withSubheader+' pàgines amb subheader de '+checked+' URL del sitemap.');
}
