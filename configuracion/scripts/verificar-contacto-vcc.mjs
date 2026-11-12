/* Valida el mismo contacto ES/EN y la entrega nativa a Gmail (sin FormSubmit). */
import fs from "node:fs";
const read = (path) => fs.readFileSync(path, "utf8");
const contact = read("contacto/index.html");
const english = read("en/contact/index.html");
const privacy = read("politica-de-privacidad/index.html");
const client = read("configuracion/js/contacto-enviar.js");
const worker = read("configuracion/workers/web-vcc.js");
const right = "info@viajandoconcabeza.com";
const gmail = "adminviajandoconcabeza@gmail.com";
const issues = [];
for (const [name, html] of [["Contacto", contact], ["Contact EN", english], ["Privacidad", privacy]]) {
  if (html.includes("info@viajaconcabeza.com")) issues.push(name + ": dominio de correo incorrecto");
  if (!html.includes(right)) issues.push(name + ": falta email corporativo");
  if (/FormSubmit|formsubmit\.co/i.test(html)) issues.push(name + ": aún depende de FormSubmit");
}
for (const [name, html] of [["Contacto", contact], ["Contact EN", english]]) {
  if (!html.includes('action="/api/contact"')) issues.push(name + ": falta ruta local /api/contact");
  if (!html.includes("/configuracion/js/contacto-enviar.js")) issues.push(name + ": falta JS compartido");
  if (!html.includes('name="website"')) issues.push(name + ": falta campo antispam");
}
if (!client.includes("AbortController")) issues.push("Falta límite de espera del cliente");
if (!worker.includes("await env.CONTACT_EMAIL.send(") || !worker.includes(gmail) || !worker.includes(right))
  issues.push("Worker no usa destinatario Gmail confirmado");
for (const path of ["wrangler.jsonc", "wrangler.production.jsonc"]) {
  const cfg = JSON.parse(read(path));
  if (cfg.main !== "./configuracion/workers/web-vcc.js" ||
      !cfg.assets?.run_worker_first?.includes("/api/contact") ||
      cfg.assets?.binding !== "ASSETS") issues.push(path + ": falta ruta Worker");
  if (!cfg.send_email?.some(b => b.name === "CONTACT_EMAIL" && b.destination_address === gmail))
    issues.push(path + ": falta binding al Gmail verificado");
  if (!cfg.ratelimits?.some(b => b.name === "CONTACT_RATE_LIMIT"))
    issues.push(path + ": falta límite antispam");
}
if (issues.length) {
  issues.forEach(x => console.error("CONTACTO:", x));
  process.exitCode = 1;
} else {
  console.log("VCC contacto OK: ES/EN envían por Cloudflare al Gmail verificado.");
  await import("../tests/contacto-api.mjs");
}
