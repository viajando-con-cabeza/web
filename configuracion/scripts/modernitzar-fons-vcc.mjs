/**
 * Modernització conservadora dels fons VCC, sense afegir llocs ni objectes.
 *
 * Conserva exactament la composició original: corregeix la dominant sèpia,
 * millora el rang tonal i la definició, mantenint la proporció i els elements.
 * Desa sempre els originals a configuracion/imagenes/fondos/old.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const base = "configuracion/imagenes/fondos";
const old = path.join(base, "old");
const originals = [
  ["fondos-donde-dormir-editorial.webp", "fondos-donde-dormir.webp"],
  ["fondos-que-llevar-editorial.webp", "fondos-que-llevar.webp"],
  ["fondos-entradas-y-pases-editorial.webp", "fondos-entradas-y-pases.webp"],
  ["fondos-como-moverse-editorial.webp", "fondos-como-moverse.webp"],
  ["fondos-cuando-ir.webp", "fondos-cuando-ir.webp"],
  ["fondos-como-llegar.webp", "fondos-como-llegar.webp"],
  ["fondos-cuando-ir-mobile.webp", "fondos-cuando-ir-mobile.webp"]
];

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}
async function archive(src, name) {
  const dest = path.join(old, name);
  if (await exists(dest)) {
    const source = await fs.readFile(src);
    const backup = await fs.readFile(dest);
    if (!source.equals(backup)) throw new Error("El backup existent és diferent: " + dest);
    return;
  }
  await fs.copyFile(src, dest);
}

async function modernize(from, to) {
  const inputInfo = await sharp(from).metadata();
  if (inputInfo.format !== "webp" || !inputInfo.width || !inputInfo.height) {
    throw new Error("Imatge d'origen no vàlida: " + from);
  }
  const temporary = to + ".vcc-modern-temp.webp";
  // Nou acabat fotogràfic: blancs menys groguencs, to neutre, més detall.
  // No recrea elements ni altera l'enquadrament original.
  await sharp(from)
    .rotate()
    .modulate({ brightness: 1.045, saturation: 0.98 })
    .linear([1.025, 1.032, 1.065], [-6, -5, -4])
    .sharpen({ sigma: 0.9, m1: 1, m2: 2 })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(temporary);
  const outputInfo = await sharp(temporary).metadata();
  if (inputInfo.width !== outputInfo.width || inputInfo.height !== outputInfo.height) {
    await fs.unlink(temporary);
    throw new Error("Canvi de dimensions no previst: " + to);
  }
  await fs.rename(temporary, to);
  console.log("Modernitzat:", to, outputInfo.width + "x" + outputInfo.height);
}

async function updateLinks() {
  const changes = [
    ["fondos-donde-dormir-editorial.webp", "fondos-donde-dormir.webp"],
    ["fondos-que-llevar-editorial.webp", "fondos-que-llevar.webp"],
    ["fondos-entradas-y-pases-editorial.webp", "fondos-entradas-y-pases.webp"],
    ["fondos-como-moverse-editorial.webp", "fondos-como-moverse.webp"]
  ];
  const changed = [];
  async function walk(dir) {
    for (const file of await fs.readdir(dir, { withFileTypes: true })) {
      if (file.name === ".git" || file.name === "node_modules" ||
          file.name === ".github" || file.name === "old" ||
          file.name === "previews-moderns" || file.name === "previews-neutres") continue;
      const absolute = path.join(dir, file.name);
      if (file.isDirectory()) { await walk(absolute); continue; }
      if (!file.isFile() || !/\.(?:html?|css|js|mjs|json)$/i.test(file.name)) continue;
      if (absolute.includes("configuracion/scripts/modernitzar-fons-vcc.mjs")) continue;
      let text = await fs.readFile(absolute, "utf8");
      let updated = text;
      for (const [from, to] of changes) updated = updated.split(from).join(to);
      if (updated !== text) {
        await fs.writeFile(absolute, updated);
        changed.push(absolute);
      }
    }
  }
  await walk(".");
  console.log("Referències actualitzades:", changed.length);
  for (const file of changed) console.log("  ", file);
}

await fs.mkdir(old, { recursive: true });
for (const [sourceName, targetName] of originals) {
  const source = path.join(base, sourceName);
  const target = path.join(base, targetName);
  // Quan es torna a executar, si ja no hi ha editorial és perquè s'ha completat.
  if (sourceName !== targetName && !await exists(source)) {
    if (!await exists(target)) throw new Error("Falta el fons " + target);
    continue;
  }
  if (!await exists(source)) throw new Error("Falta l'origen " + source);
  await archive(source, sourceName);
  if (source !== target) {
    if (!await exists(target)) throw new Error("Falta l'original anterior " + target);
    await archive(target, targetName);
    await modernize(source, target);
    await fs.unlink(source);
  } else {
    // Evita processar per segona vegada el fitxer original.
    const backupFile = path.join(old, targetName);
    const current = await fs.readFile(source);
    const archived = await fs.readFile(backupFile);
    if (current.equals(archived)) await modernize(source, target);
    else console.log("Ja modernitzat (backup conservat):", target);
  }
}
await updateLinks();
for (const [, target] of originals) {
  if (!await exists(path.join(base, target))) throw new Error("Ruta final absent: " + target);
}
console.log("Fons VCC modernitzats i rutes finals verificades.");
