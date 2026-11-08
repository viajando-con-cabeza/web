import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const EXTS=/\.(?:svg|webp|avif|jpe?g|png|gif|ico)$/i;
const BLOCKED=new Set(['.git','node_modules','dist','build','.wrangler']);
function walk(dir=''){
  const ret=[];
  for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){
    if(BLOCKED.has(e.name))continue;
    const p=path.posix.join(dir,e.name);
    if(e.isDirectory())ret.push(...walk(p));
    else if(e.isFile())ret.push(p);
  }
  return ret;
}
const images=walk().filter(p=>EXTS.test(p));
const loose=images.filter(p=>/^configuracion\/imagenes\/[^/]+\.[^.]+$/.test(p));
const outside=images.filter(p=>!p.startsWith('configuracion/')&&!/^destinos\/[^/]+\/[^/]+\/imagenes\//.test(p));
const stale=images.filter(p=>p.startsWith('configuracion/imagenes/como-moverse/')||p.startsWith('configuracion/iconos/'));
const misplacedGlobals=images.filter(p=>p.startsWith('configuracion/')&&!p.startsWith('configuracion/imagenes/'));
for(const p of loose)console.error('Imatge fora de categoria:',p);
for(const p of outside)console.error('Imatge corporativa fora de configuracio:',p);
for(const p of stale)console.error('Carpeta obsoleta:',p);
for(const p of misplacedGlobals)console.error('Recurs fora de configuracion/imagenes:',p);
console.log('VCC assets: '+images.length+' imatges · '+loose.length+' soltes · '+outside.length+' mal ubicades · '+stale.length+' antigues');
if(loose.length+outside.length+stale.length+misplacedGlobals.length)process.exitCode=1;
