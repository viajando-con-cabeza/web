/* VCC: bundlear el CSS de Imprenscindibles sense duplicar la font de veritat.
 * Executar des de l'arrel del repositori: node configuracion/scripts/build-imprescindibles-css.mjs
 * Editar sempre els CSS originals de configuracion/css/plantillas/.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const main=resolve(root,'configuracion/css/plantillas/imprescindibles.css');
const source=readFileSync(main,'utf8');
const urls=[...source.matchAll(/^@import\s+url\('([^']+)'\);\s*$/gm)].map(match=>match[1]);
if(urls.length!==8)throw Error('Se esperaban 8 imports CSS, obtenidos '+urls.length);
const sections=urls.map((url,i)=>{
 const file=url.split('?')[0];
 if(!file.startsWith('/configuracion/css/plantillas/'))throw Error('Import inesperado: '+url);
 return '\n/* ===== FUENTE '+(i+1)+': '+url+' ===== */\n'+readFileSync(resolve(root,'.'+file),'utf8').trimEnd()+'\n';
});
const output='/* VCC · Imprescindibles · CSS compilado (NO EDITAR DIRECTAMENTE).\n'+
 ' * Origen: configuracion/css/plantillas/imprescindibles.css\n'+
 ' * Regenerar: node configuracion/scripts/build-imprescindibles-css.mjs\n'+
 ' * Todos los estilos conservan el orden de cascada original. */\n'+
 sections.join('')+'\n/* ===== REGLAS FINALES: imprescindibles.css ===== */\n'+
 source.replace(/^@import\s+url\('[^']+'\);\s*$/gm,'').trim()+'\n';
writeFileSync(resolve(root,'configuracion/css/plantillas/imprescindibles-bundle.css'),output);
console.log('Bundle CSS actualizado: '+output.length+' caracteres; '+urls.length+' fuentes.');
