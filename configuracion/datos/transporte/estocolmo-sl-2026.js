/* Catálogo VCC · Estocolmo · transporte público. Precios oficiales SL 2026.
   No inventar abonos de 48 horas ni paquetes de 10 viajes: cada destino carga
   únicamente los títulos que el operador ofrece. Un lector puede simular otros
   productos por separado, marcados como estimación, sin alterar este catálogo. */
window.VCCTransportDestination={
  "schemaVersion": 1,
  "destination": "estocolmo",
  "city": "Estocolmo",
  "operator": "SL",
  "currency": "SEK",
  "updated": "2026-01-08",
  "source": "https://sl.se/en/fares-and-tickets",
  "sourceReference": "Tarifas oficiales SL 2026 (8 enero 2026)",
  "modes": [
    "metro",
    "autobus",
    "tranvia",
    "tren de cercanias",
    "ferries SL incluidos"
  ],
  "categories": [
    {
      "id": "adult",
      "label": "Adulto"
    },
    {
      "id": "reduced",
      "label": "Reducida (solo personas elegibles)"
    }
  ],
  "tickets": [
    {
      "id": "sl-single",
      "label": "Billete 75 min",
      "type": "rides",
      "quantity": 1,
      "minutesValidity": 75,
      "price": {
        "adult": 43,
        "reduced": 26
      },
      "scope": "person",
      "modes": "SL"
    },
    {
      "id": "sl-24h",
      "label": "Abono 24 horas",
      "type": "hours",
      "quantity": 24,
      "price": {
        "adult": 180,
        "reduced": 110
      },
      "scope": "person",
      "modes": "SL"
    },
    {
      "id": "sl-72h",
      "label": "Abono 72 horas",
      "type": "hours",
      "quantity": 72,
      "price": {
        "adult": 360,
        "reduced": 220
      },
      "scope": "person",
      "modes": "SL"
    },
    {
      "id": "sl-7d",
      "label": "Abono 7 días",
      "type": "days",
      "quantity": 7,
      "price": {
        "adult": 470,
        "reduced": 290
      },
      "scope": "person",
      "modes": "SL"
    }
  ],
  "notes": "Los billetes de 75 min pueden cubrir varios transbordos dentro de su validez. Los abonos por horas se activan por horas reales; el cálculo simplificado usa días completos. El 7 días sigue su propia regla de días naturales. El precio del coche se introduce por el viajero. No son tarifas del mismo operador los ferris no incluidos."
};
