/* VCC · Envío de contacto compartido ES/EN, sin dependencias externas. */
(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const success = document.getElementById("contactSuccess");
  const feedback = document.getElementById("contactFeedback");
  const button = form.querySelector('button[type="submit"]');
  const original = button.innerHTML;
  const en = document.documentElement.lang.toLowerCase().startsWith("en");
  const copy = en ? {
    sending: "Sending your message…",
    button: "SENDING…",
    error: "We couldn't confirm delivery. Your message is still here. Please try again or email info@viajandoconcabeza.com.",
    time: "The server is taking too long. We couldn't confirm delivery; please check before retrying or email info@viajandoconcabeza.com.",
    rate: "Too many attempts. Please try again in a minute."
  } : {
    sending: "Estamos enviando tu mensaje…",
    button: "ENVIANDO…",
    error: "No hemos podido confirmar el envío. Tu mensaje sigue aquí. Inténtalo de nuevo o escríbenos a info@viajandoconcabeza.com.",
    time: "El servidor está tardando demasiado. No podemos confirmar el envío; compruébalo antes de reintentar o escríbenos a info@viajandoconcabeza.com.",
    rate: "Demasiados intentos. Prueba de nuevo dentro de un minuto."
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    button.textContent = copy.button;
    feedback.hidden = false;
    feedback.textContent = copy.sending;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let delivered = false;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      const data = await response.json();
      if (response.status === 429) {
        feedback.textContent = copy.rate;
      } else if (!response.ok || data.success !== true) {
        feedback.textContent = copy.error;
      } else {
        delivered = true;
        success.hidden = false;
        form.hidden = true;
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch (error) {
      feedback.textContent = error?.name === "AbortError" ? copy.time : copy.error;
    } finally {
      clearTimeout(timeout);
      if (!delivered) {
        button.disabled = false;
        button.innerHTML = original;
      }
    }
  });
})();
