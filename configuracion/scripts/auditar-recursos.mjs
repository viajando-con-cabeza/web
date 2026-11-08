#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(),ignore=new Set(['.git','node_modules','dist','build']);
const image=/\.(?:svg|png|jpe?g|webp|avif|gif|ico)$/i;
function walk(dir=''){let out=[];for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){if(ignore.has(e.name))continue;const p=path.posix.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else if(e.isFile())out.push(p)}return out}
const all=walk(),exists=new Set(all),code=all.filter(p=>/\.(html|css|js|mjs|json)$/i.test(p)),assets=all.filter(p=>image.test(p));
let missing=new Set(),external=new Set(),usage=new Set();
for(const file of code){
if(file==='configuracion/rutas-recursos.json'||file.endsWith('auditar-recursos.mjs'))continue;
const src=fs.readFileSync(path.join(root,file),'utf8');
const re=/(?:https?:\/\/[^\s"'<>)]*|\/?(?:configuracion|destinos|inicio)\/imagenes\/[a-zA-Z0-9_./-]+\.(?:svg|png|jpe?g|webp|avif|gif|ico))(?:\?[^\s"'<>)]*)?/gi;
for(const m of src.matchAll(re)){
const ref=m[0].split('?')[0];
if(/^https?:\/\//i.test(ref)){
 if(/^https:\/\/img\.viajandoconcabeza\.com\//.test(ref)||/^https:\/\/(?:www\.)?viajandoconcabeza\.com\//.test(ref)||/^https:\/\/raw\.githubusercontent\.com\/viajando-con-cabeza\/web\//.test(ref))continue;
 if(image.test(ref)||/images\.unsplash\.com\/photo-/.test(ref))external.add(file+' => '+ref);
}else{
const target=ref.replace(/^\//,'');
if(exists.has(target))usage.add(target);else missing.add(file+' => '+target);
}}}
const routes=JSON.parse(fs.readFileSync('configuracion/rutas-recursos.json','utf8'));
for(const [a,b] of Object.entries(routes))if(!exists.has(b))missing.add('rutas-recursos.json: '+a+' => '+b);
const hashes=new Map(),duplicates=[];
for(const p of assets){const hash=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(hashes.has(hash))duplicates.push([hashes.get(hash),p]);else hashes.set(hash,p)}
const report={files:code.length,images:assets.length,used:usage.size,missing:[...missing],external:[...external],duplicates,possiblyUnused:assets.filter(p=>!usage.has(p))};
if(!process.argv.includes('--no-write')){fs.mkdirSync('configuracion/datos',{recursive:true});fs.writeFileSync('configuracion/datos/auditoria-recursos.json',JSON.stringify(report,null,2)+'\n')}
console.log('Auditoria VCC: '+code.length+' fitxers, '+assets.length+' imatges, '+missing.size+' referencies absents, '+external.size+' externes, '+duplicates.length+' duplicats');
for(const p of [...missing].slice(0,40))console.error('RUTA INEXISTENT',p);
if(process.argv.includes('--strict-external'))for(const p of [...external].slice(0,40))console.error('FOTO EXTERNA',p);
if(missing.size||(process.argv.includes('--strict-external')&&external.size))process.exitCode=1;
