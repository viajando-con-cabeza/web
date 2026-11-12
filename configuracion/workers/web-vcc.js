/* VCC · Contact API, compartida por las páginas ES y EN.
   Solo se ejecuta en /api/contact; el resto permanece en static assets. */
const DESTINATION = "adminviajandoconcabeza@gmail.com";
const SENDER = "info@viajandoconcabeza.com";
const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/contact") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return json({ success: false, error: "method" }, 405);
    // El formulario siempre usa fetch same-origin; no aceptar envíos entre sitios.
    if (request.headers.get("Origin") !== url.origin) {
      return json({ success: false, error: "origin" }, 403);
    }
    const type = request.headers.get("Content-Type") || "";
    const size = Number(request.headers.get("Content-Length") || 0);
    if ((!type.includes("multipart/form-data") && !type.includes("application/x-www-form-urlencoded")) ||
        size > 12000) {
      return json({ success: false, error: "format" }, 413);
    }

    let form;
    try { form = await request.formData(); }
    catch { return json({ success: false, error: "format" }, 400); }
    const field = (name) => {
      const v = form.get(name);
      return typeof v === "string" ? v.trim() : "";
    };
    // Honeypot: los visitantes reales no ven ni rellenan este campo.
    if (field("website")) return json({ success: true });

    const name = field("nombre");
    const email = field("email");
    const subject = field("asunto").replace(/[\r\n]+/g, " ").slice(0, 120);
    const message = field("mensaje");
    const lang = field("idioma") === "en" ? "EN" : "ES";
    if (name.length < 2 || name.length > 100 || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        message.length < 5 || message.length > 4000 || subject.length > 120) {
      return json({ success: false, error: "validation" }, 400);
    }

    // 5 intentos por minuto/IP. La limitación se comparte entre ambas versiones.
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    try {
      const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: ip });
      if (!success) return json({ success: false, error: "rate_limit" }, 429);
    } catch (error) {
      console.error("VCC contact rate limit unavailable", error?.message);
      return json({ success: false, error: "temporary" }, 503);
    }

    const body = [
      "Nuevo mensaje desde Viajando con Cabeza", "",
      "Nombre: " + name.replace(/[\r\n]/g, " "),
      "Email: " + email,
      "Asunto: " + (subject || "Sin especificar"),
      "Idioma: " + lang, "",
      "Mensaje:", message
    ].join("\n");

    try {
      await env.CONTACT_EMAIL.send({
        to: DESTINATION,
        from: SENDER,
        replyTo: email,
        subject: "Nuevo mensaje desde Viajando con Cabeza",
        text: body
      });
      // Confirmar solo cuando Cloudflare acepta el mensaje para entrega.
      return json({ success: true });
    } catch (error) {
      console.error("VCC contact email failed", error?.code || error?.message);
      return json({ success: false, error: "delivery" }, 502);
    }
  }
};
