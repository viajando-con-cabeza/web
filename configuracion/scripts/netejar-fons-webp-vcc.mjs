#!/usr/bin/env node
// Neteja única de configuracion/imagenes/fondos a quality: només WebP, sense subcarpetes.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BASE = "configuracion/imagenes/fondos";
const SVG_BASE = "configuracion/imagenes/iconos/fondos";
const workflow = ".github/workflows/netejar-fons-webp-vcc.yml";
const scriptPath = "configuracion/scripts/netejar-fons-webp-vcc.mjs";
const subfolders = ["old", "previews-moderns", "previews-neutres"];
const rewrite = new Map();
let converted = 0;
let moved = 0;
let rewritten = 0;

const rootFiles = await fs.readdir(BASE, {withFileTypes:true});
const avif = rootFiles.filter(e => e.isFile() && e.name.endsWith(".avif"));
const svg = rootFiles.filter(e => e.isFile() && e.name.endsWith(".svg"));

for (const e of avif) {
  const from=path.posix.join(BASE,e.name);
  const to=from.replace(/\.avif$/, ".webp");
  try { await fs.access(to); throw new Error("Ja existeix el WebP destí: "+to); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  const input=await sharp(from).metadata();
  await sharp(from).webp({quality:91,effort:6,smartSubsample:true}).toFile(to);
  const output=await sharp(to).metadata();
  if(input.width!==output.width || input.height!==output.height) throw new Error("Dimensions alterades: "+from);
  await fs.rm(from);
  rewrite.set(e.name, path.posix.basename(to));
  converted++;
}
await fs.mkdir(SVG_BASE,{recursive:true});
for (const e of svg) {
  const from=path.posix.join(BASE,e.name);
  const to=path.posix.join(SVG_BASE,e.name);
  try { await fs.access(to); throw new Error("Conflicte SVG: "+to); }
  catch (error) { if (error.code!=="ENOENT") throw error; }
  await fs.rename(from,to);
  rewrite.set("configuracion/imagenes/fondos/"+e.name, "configuracion/imagenes/iconos/fondos/"+e.name);
  moved++;
}

// Per mantenir els alias antics del manifest, els relacionem amb els WebP actius.
const manifestFile="configuracion/rutas-recursos.json";
const routes=JSON.parse(await fs.readFile(manifestFile,"utf8"));
const legacyPaths={
 "presupuesto-vcc-background.jpg":"fondos-presupuesto.webp",
 "presupuesto-vcc-background.svg":"fondos-presupuesto.webp",
 "background_itinerarios_vcc.svg":"fondos-itinerario.webp",
 "proximamente-vcc.svg":"fondos-proximamente.webp",
 "hero-inicio-original.jpg":"fondos-inicio.webp",
 "itinerarios-background.svg":"fondos-itinerario.webp"
};
for (const [key, value] of Object.entries(routes)) {
  if (!value.startsWith(BASE+"/old/")) continue;
  const name=path.posix.basename(value);
  const replacement=legacyPaths[name];
  if(!replacement) throw new Error("Alias antic sense destí WebP: "+key+" => "+value);
  routes[key]=BASE+"/"+replacement;
}
await fs.writeFile(manifestFile,JSON.stringify(routes,null,2)+"\n");

// Esmena les eines de generació perquè no recreïn subcarpetes a fondos.
{
 const target="configuracion/scripts/modernitzar-portades-vcc.py";
 const before=await fs.readFile(target,"utf8");
 const needle='OUT = ROOT / "previews-neutres"';
 if(!before.includes(needle)) throw new Error("No s'ha trobat la ruta de previews-neutres");
 await fs.writeFile(target,before.replace(needle,'OUT = Path("configuracion/imagenes/previews-neutres")'));
}
{
 const target="configuracion/scripts/normalizar-fondos-vcc.py";
 const before=await fs.readFile(target,"utf8");
 const needle='OLD = BASE / "old"';
 if(!before.includes(needle)) throw new Error("No s'ha trobat la ruta antiga old");
 await fs.writeFile(target,before.replace(needle,'OLD = ROOT / "configuracion/imagenes/archivo-fondos"'));
}

// Llegim els fitxers de la web abans d'eliminar qualsevol arxiu per detectar
// possibles referències encara actives a subcarpetes.
const textExtensions=/\.(?:html?|css|js|mjs|json|md|xml|py|txt|yml|yaml)$/i;
const activeExtensions=/\.(?:html?|css|js|mjs|json)$/i;
const ignore=new Set([".git","node_modules","dist","build",".wrangler"]);
async function walk(dir=".") {
  let out=[];
  for(const e of await fs.readdir(dir,{withFileTypes:true})) {
    if(ignore.has(e.name))continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory()) {
      if(path.normalize(p)===path.normalize(BASE+"/old") ||
         path.normalize(p)===path.normalize(BASE+"/previews-moderns") ||
         path.normalize(p)===path.normalize(BASE+"/previews-neutres")) continue;
      out.push(...await walk(p));
    } else if(e.isFile() && textExtensions.test(e.name)) out.push(p);
  }
  return out;
}
const sourceFiles=await walk();
for(const file of sourceFiles) {
  const input=await fs.readFile(file,"utf8");
  let output=input;
  // Rutes heretades que assenyalaven backups a old: ara apunten al fons vigent.
  for(const [legacy, replacement] of Object.entries(legacyPaths)) {
    output=output.split(BASE+"/old/"+legacy).join(BASE+"/"+replacement);
  }
  if(activeExtensions.test(file)) {
    const actualOld=output.match(/(?:\/?configuracion\/imagenes\/fondos\/|\/fondos\/)(?:old|previews-moderns|previews-neutres)\/[A-Za-z0-9_.-]+\.(?:webp|avif|svg|png|jpe?g)/g)||[];
    if(actualOld.length) throw new Error("Hi ha referències a subcarpetes a "+file+": "+actualOld.slice(0,5));
  }
  // Primer reemplaçar referències completes a SVG moguts.
  for(const [oldName,newName] of rewrite) {
    if(!oldName.endsWith(".svg"))continue;
    output=output.split(oldName).join(newName);
  }
  // Els nous WebP mantenen la mateixa denominació, canvia només l'extensió.
  for(const [oldName,newName] of rewrite) {
    if(!oldName.endsWith(".avif"))continue;
    output=output.split(oldName).join(newName);
  }
  if(output!==input) {
    await fs.writeFile(file,output);
    rewritten++;
  }
}

// Valida que les 6 imatges convertides existeixen i que tots els formats al
// primer nivell són WebP. Elimina backups i previews quan la validació és segura.
for(const e of avif) {
  await fs.access(path.posix.join(BASE,e.name.replace(/\.avif$/, ".webp")));
}
for (const name of subfolders) await fs.rm(path.posix.join(BASE,name),{recursive:true,force:true});

const final=await fs.readdir(BASE,{withFileTypes:true});
const invalid=final.filter(e=>!e.isFile()||!e.name.endsWith(".webp"));
if(invalid.length)throw new Error("Hi ha recursos no WebP o subcarpetes: "+invalid.map(e=>e.name).join(", "));
const unreadable=[];
for(const e of final) {
  const filename=path.posix.join(BASE,e.name);
  const info=await sharp(filename).metadata();
  if(info.format!=="webp") unreadable.push(e.name);
}
if(unreadable.length)throw new Error("WebP no vàlids: "+unreadable.join(", "));

// Evita deixar automatismes permanents que reprodueixin la neteja.
await fs.rm(workflow,{force:true});
await fs.rm(scriptPath,{force:true});
console.log(JSON.stringify({success:true,webp:final.length,subfoldersRemoved:subfolders,convertedAvif:converted,movedSvg:moved,changedTextFiles:rewritten},null,2));
