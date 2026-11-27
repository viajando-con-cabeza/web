/* Selección de fotos de Contacto: prueba aislada, sin pedir imágenes. */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const src = fs.readFileSync("configuracion/js/contacto-fotos.js", "utf8");
const keys = [...src.matchAll(/"destinos\/[^"]+\.avif"/g)].map(m => m[0]);
assert.equal(keys.length, 9);
assert.equal(new Set(keys).size, 9);
const storage = new Map();
const render = (lang, random) => {
  const listeners = {};
  const img = { alt: "", src: "", srcset: "", sizes: "", dataset: {},
    addEventListener(name, listener) { listeners[name] = listener; } };
  const math = Object.create(Math);
  math.random = () => random;
  vm.runInNewContext(src, {
    document: { documentElement: { lang }, querySelector: () => img },
    Math: math,
    sessionStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    }
  });
  return { img, listeners };
};
const first = render("es", 0.25);
assert.match(first.img.src, /^https:\/\/img\.viajandoconcabeza\.com\/__vcc_preview\/visor\//);
assert.match(first.img.srcset, /__vcc_preview\/mini\//);
assert.ok(first.img.alt);
const next = render("es", 0.25);
assert.notEqual(next.img.src, first.img.src);
const en = render("en", 0.65);
assert.ok(en.img.alt);
en.listeners.error();
assert.match(en.img.src, /DSC08335\.avif/);
console.log("VCC Contacto fotos OK: 9 reales, rotación, accesibilidad y respaldo.");
