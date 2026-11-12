/**
 * Regenera el CSS visual compartit sense duplicar la font de manteniment.
 * Executa: node configuracion/scripts/generar-ui-compartida.mjs
 * Comprova: node configuracion/scripts/generar-ui-compartida.mjs --check
 * Els fitxers de components són els originals i han de continuar sent editats allí.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const files = [
  "configuracion/css/componentes/carruseles-flechas-movil-vcc.css",
  "configuracion/css/componentes/portadas-transparencia.css",
  "configuracion/css/componentes/numeros-consejos-vcc.css"
];
const destination = "configuracion/css/componentes/vcc-ui-compartida.css";
const header = "/*\n * VCC · Paquet de components visuals compartits.\n * Generat des de tres fitxers canonics a /configuracion/css/componentes/.\n * NO EDITAR A MA: node configuracion/scripts/generar-ui-compartida.mjs\n * Ordre identic a les guies originals per mantenir la cascada CSS.\n */\n\n";
const text = header + files.map(file =>
  '/* === ORIGEN: ' + file + ' === */\\n'.replace('\\n','\n') +
  readFileSync(resolve(file),'utf8').trimEnd() + '\n'
).join('\n');
const current = (()=>{try{return readFileSync(resolve(destination),'utf8');}catch{return '';}})();
if (process.argv.includes('--check')) {
  if (current !== text) { console.error('CSS compartit desactualitzat. Executa el generador.'); process.exitCode = 1; }
  else console.log('CSS compartit actualitzat.');
} else {
  writeFileSync(resolve(destination), text, 'utf8');
  console.log('Generat:', destination);
}
