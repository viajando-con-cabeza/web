/**
 * VCC · Contracte visual sense navegador per a les portades de Suecia.
 * La classe unificada NOMÉS correspon a les sis subguies de Planifica.
 * Protegeix també els requadres originals de les portades principals.
 *
 * npm run ui:check
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const checks=[];
const fail=(file,message)=>checks.push(file+': '+message);
const pages=['cuando-ir','como-llegar','como-moverse','donde-dormir','que-visitar','presupuesto'];
const cssPath='/configuracion/css/componentes/portades-contracte-unic-vcc.css';
const legacyCssPath='/configuracion/css/componentes/vcc-suecia-planifica-portades.css';
const loader=read('configuracion/js/site-header.js');
const controller=read('configuracion/js/componentes/subheader-unificado-vcc.js');
if(!loader.includes(cssPath.slice(1))||!controller.includes("const HERO_CONTRACT="))fail(cssPath,'component compartit no carregat pel site-header');

const heroTag=/<(?:section|header)\b[^>]*\bvcc-suecia-planning-hero\b[^>]*>/gi;
const subnavTag=/<nav\b[^>]*\bvcc-suecia-planning-subnav\b[^>]*>/gi;
for(const slug of pages){
 const file='destinos/suecia/'+slug+'.html',html=read(file);
 if(!/<body\b[^>]*\bvcc-suecia-planifica\b/i.test(html))fail(file,'manca classe opt-in al body');
 if([...html.matchAll(heroTag)].length!==1)fail(file,'la portada ha de ser unica i compartida');
 if([...html.matchAll(subnavTag)].length!==1)fail(file,'subheader compartit absent o duplicat');
 const styles=[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi)].map(x=>x[0]);
 // El CSS únic es carrega des de site-header.js. Una segona inclusió local és una regressió.
 const legacy=styles.filter(tag=>tag.includes(legacyCssPath));
 if(legacy.length)fail(file,'CSS local antic duplicat: la font única és site-header.js');
 if(!html.includes('site-header.js'))fail(file,'carregador CSS compartit absent');
 if(!html.includes('vcc-guide-hero-kicker')||!html.includes('vcc-guide-hero-description'))
   fail(file,'sobretitol o descripcio de portada absent');
 const start=html.search(heroTag);
 const end=start>=0?html.indexOf('</section>',start): -1;
 const hero=start>=0?html.slice(start,end>start?end:start+3000):'';
 if(!/<h1\b/i.test(hero))fail(file,'títol H1 absent');
 if(!/Inicio<\/a>[\s\S]*Destinos<\/a>[\s\S]*Suecia<\/a>/i.test(hero))
   fail(file,'breadcrumb incomplet');
 if(!/<em>SUECIA<\/em>/i.test(hero))fail(file,'SUECIA ha de mantenir el ressaltat original');
}
{
 const file='destinos/suecia/index.html',html=read(file);
 const renderer='configuracion/js/paises/suecia-page.js',js=read(renderer);
 if(html.includes(legacyCssPath)||html.includes('vcc-suecia-planifica'))fail(file,'la portada general no pot carregar CSS de subguia');
 if(!/<section class="country-hero"/.test(js))fail(renderer,'portada principal no te el seu selector original');
 if(!js.includes('country-hero-card vcc-guide-hero-copy'))fail(renderer,'requadre blanc original absent');
 if(js.includes('country-hero vcc-guide-hero-unified'))fail(renderer,'unificacio global no permesa al requadre');
}
{
 const file='destinos/suecia/estocolmo/index.html',html=read(file);
 if(html.includes(legacyCssPath)||html.includes('vcc-suecia-planifica'))fail(file,'la portada d Estocolm no pot carregar CSS de subguia');
 if(!/<section class="st-hero"/.test(html))fail(file,'portada principal no te el seu selector original');
 if(!html.includes('st-card vcc-guide-hero-copy'))fail(file,'requadre original absent');
 if(html.includes('st-hero vcc-guide-hero-unified'))fail(file,'unificacio global no permesa al requadre');
}
const css=read(cssPath.slice(1));
if(!css.includes('.vcc-sacred-hero')||!css.includes('.vcc-sacred-subnav')||
   !css.includes('--vcc-contract-photo-alpha'))fail(cssPath,'contracte de portada, subheader o fade absent');
for(const forbidden of ['.country-hero.vcc-sacred-hero','.st-hero.vcc-sacred-hero']){
 if(css.includes(forbidden))fail(cssPath,'no es pot modificar la portada amb targeta central');
}
if(checks.length){console.error('VCC portades: regressions\n'+checks.map(x=>' - '+x).join('\n'));process.exitCode=1;}
else console.log('VCC portades OK: 6 guies unificades; Suecia i Estocolmo conserven el seu requadre.');
