/* Pruebas aisladas: nunca envían correos reales. */
import assert from "node:assert/strict";
import worker from "../workers/web-vcc.js";

const origin = "https://www.quality.viajandoconcabeza.com";
let sent = [];
let allow = true;
let fail = false;
const env = {
  ASSETS: { fetch: async () => new Response("static", { status: 200 }) },
  CONTACT_RATE_LIMIT: { limit: async () => ({ success: allow }) },
  CONTACT_EMAIL: { send: async (email) => {
    if (fail) throw new Error("mock delivery failure");
    sent.push(email);
    return { messageId: "mock-id" };
  } }
};
const fields = {
  nombre: "Persona de prueba",
  email: "persona@example.com",
  asunto: "Dudas sobre un viaje",
  mensaje: "Hola, tengo una pregunta sobre el itinerario.",
  idioma: "es",
  website: ""
};
function request(data = fields, from = origin) {
  return new Request(origin + "/api/contact", {
    method: "POST",
    headers: { Origin: from, "CF-Connecting-IP": "192.0.2.1" },
    body: new URLSearchParams(data)
  });
}

let response = await worker.fetch(request(), env);
assert.equal(response.status, 200);
assert.equal((await response.json()).success, true);
assert.equal(sent.length, 1);
assert.equal(sent[0].to, "adminviajandoconcabeza@gmail.com");
assert.equal(sent[0].from, "info@viajandoconcabeza.com");
assert.equal(sent[0].replyTo, fields.email);
assert.match(sent[0].text, /Persona de prueba/);

response = await worker.fetch(request({ ...fields, website: "spam.example" }), env);
assert.equal(response.status, 200);
assert.equal(sent.length, 1, "honeypot nunca debe mandar correo");

response = await worker.fetch(request(fields, "https://example.com"), env);
assert.equal(response.status, 403);

response = await worker.fetch(request({ ...fields, email: "invalido" }), env);
assert.equal(response.status, 400);

allow = false;
response = await worker.fetch(request(), env);
assert.equal(response.status, 429);
allow = true;
fail = true;
response = await worker.fetch(request(), env);
assert.equal(response.status, 502);
fail = false;

response = await worker.fetch(new Request(origin + "/contacto/"), env);
assert.equal(await response.text(), "static");
response = await worker.fetch(new Request(origin + "/api/contact"), env);
assert.equal(response.status, 405);

console.log("VCC contact API OK: recepción simulada, antispam, origen, validación y errores.");
