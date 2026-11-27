/* VCC · Una fotografía editorial aleatoria de R2 en Contacto (ES/EN).
   Solo se descarga la fotografía elegida; nunca las otras. */
(() => {
  const img = document.querySelector(".contact-postcard img[data-vcc-contact-photo]");
  if (!img) return;

  const photos = [
    ["destinos/suecia/estocolmo-archipelago/2026-dia8/DSC08335.avif",
      "Archipiélago de Estocolmo, fotografía propia VCC",
      "Stockholm archipelago, original VCC photograph"],
    ["destinos/suecia/estocolmo/2026-dia6/DSC07952.avif",
      "Stortorget, en Gamla Stan, Estocolmo",
      "Stortorget in Stockholm's Gamla Stan"],
    ["destinos/suecia/goteborg/2026-dia1/DSC06603.avif",
      "Gotemburgo, Suecia, fotografía propia VCC",
      "Gothenburg, Sweden, original VCC photograph"],
    ["destinos/suecia/goteborg-archipelago/2026-dia3/DSC07173.avif",
      "Costa oeste de Suecia, fotografía propia VCC",
      "Sweden's west coast, original VCC photograph"],
    ["destinos/suecia/estocolmo/2026-dia7/DSC08228.avif",
      "Los muelles de Estocolmo, fotografía propia VCC",
      "Stockholm waterfront, original VCC photograph"],
    ["destinos/espana/menorca/2026-dia1/DSC05650.avif",
      "Menorca, Islas Baleares, fotografía propia VCC",
      "Menorca, Balearic Islands, original VCC photograph"],
    ["destinos/austria/hallstat/2025-dia2/DSC04005.avif",
      "Hallstatt, Austria, fotografía propia VCC",
      "Hallstatt, Austria, original VCC photograph"],
    ["destinos/alemania/konigsee/2025-dia3/DSC04219.avif",
      "Königssee, Alemania, fotografía propia VCC",
      "Königssee, Germany, original VCC photograph"],
    ["destinos/suiza/zurich/2025-dia5/DSC04703.avif",
      "Zúrich, Suiza, fotografía propia VCC",
      "Zurich, Switzerland, original VCC photograph"]
  ];

  const lang = document.documentElement.lang.toLowerCase().startsWith("en") ? 2 : 1;
  let index = Math.floor(Math.random() * photos.length);
  // Evitar repetir la misma fotografía en dos visitas seguidas en la pestaña.
  try {
    const previous = sessionStorage.getItem("vcc-contact-last-photo");
    if (previous !== null && Number(previous) === index) {
      index = (index + 1 + Math.floor(Math.random() * (photos.length - 1))) % photos.length;
    }
    sessionStorage.setItem("vcc-contact-last-photo", String(index));
  } catch { /* El navegador puede bloquear almacenamiento: la foto sigue funcionando. */ }

  const base = "https://img.viajandoconcabeza.com/__vcc_preview/";
  const fallback = photos[0];
  const apply = (photo) => {
    const original = photo[0];
    img.alt = photo[lang];
    img.srcset = base + "mini/" + original + " 480w, " + base + "visor/" + original + " 1600w";
    img.sizes = "(max-width: 650px) 92vw, (max-width: 900px) 90vw, 660px";
    img.src = base + "visor/" + original;
  };
  img.addEventListener("error", () => {
    // Si una miniatura deja de estar disponible, volver a la foto verificada.
    if (img.dataset.fallbackUsed === "1") return;
    img.dataset.fallbackUsed = "1";
    apply(fallback);
  });
  apply(photos[index]);
})();
