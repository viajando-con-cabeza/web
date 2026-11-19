# Comparador universal de transporte · VCC

**Fuente de verdad del cálculo:** `/configuracion/js/componentes/vcc-transporte-optimizador.js`
**Primer catálogo publicado:** `/configuracion/datos/transporte/estocolmo-sl-2026.js`
**Primera integración visual:** `/destinos/suecia/estocolmo/como-moverse.html`

## Objetivo

Comparar, por destino y moneda, transporte público (billetes y abonos de horas,
días o número de viajes) con el coste introducido de transporte privado.
La persona lectora informa días, VALIDACIONES DE BILLETE POR PERSONA/día,
número de viajeros, tarifa aplicable y, si procede, costes de coche.
El precio oficial lo carga VCC desde la ficha del destino; el lector puede
modificarlo para SIMULAR, sin alterar nunca la ficha oficial.

## Comparador universal · 2 columnas compactas

**Piloto:** `/destinos/suecia/estocolmo/como-moverse.html` (rama `quality`).
La guía de Suecia **no se modifica** hasta que se apruebe el diseño.

Motor/UI compartido: `/configuracion/js/componentes/vcc-transporte-comparador-universal.js`.
CSS compartido: `/configuracion/css/componentes/vcc-transporte-comparador-universal.css`.
Catálogo de referencia: `/configuracion/datos/transporte/estocolmo-sl-2026.js`.

### Diseño y datos

Una franja superior compacta permite cambiar días, viajeros y tarifa.
Debajo hay dos columnas y una recomendación horizontal con logo VCC.

- **Coche:** propiedad o alquiler, plazas por vehículo, alquiler,
  combustible/carga, párquing, peajes y extras. Son importes del
  itinerario **por vehículo**. `ceil(viajeros / plazas)` determina
  la cantidad estimada de coches; todos los gastos se multiplican
  por esa cantidad. Alquiler y combustible son obligatorios
  para poder comparar, salvo que el coche ya esté disponible.
- **Transporte público:** número de viajes y precio individual
  habitual, por persona. El desglose se abre solamente cuando
  interesa editar el transporte (metro, autobús, tren, tranvía,
  ferry), el nombre, día, precio, hora o inclusión en el bono
  de cada trayecto. Así pueden existir viajes de **precios distintos**
  sin ocupar altura por defecto.
- **Bonos:** lista de títulos editables con tipo (horas, días o
  viajes), duración/cantidad, precio por bono y **número de unidades
  por persona**. El botón «Añadir bono» permite combinar distintos
  títulos; máximo 10 tipos, 8 unidades por tipo para mantener
  controlado el coste de cálculo. Los bonos nuevos que el viajero
  inventa son una **simulación**, nunca tarifas oficiales.
- Se muestran en la misma columna el total de **billetes sueltos**
  y el total **con los bonos seleccionados**, ambos por persona
  y por grupo. El resultado inferior recomienda la opción más
  barata de las comparables y muestra el ahorro por persona.

### Precisión y límites

Los bonos seleccionados se tratan como **comprados**; se suma su
coste completo, incluso si no se usan todos sus viajes. Los
viajes no cubiertos siguen facturándose como billetes sueltos.
Para paquetes por número de viajes, el precio individual variable
hace que convenga cubrir los viajes elegibles más caros primero.
Para combinar distintos bonos temporales se usa una asignación
por **ahorro marginal**, que es una estimación y no garantiza el
óptimo exhaustivo. No se debe afirmar una optimización exacta.

En bonos horarios de menos de 24 h la interfaz **exige la hora**
de cada trayecto incluido; si faltan, el resultado del bono
aparece como no calculable. En bonos de 24 h o más se puede
aproximar por días completos, indicado con una advertencia.
Para ferry que no acepte el bono se debe desmarcar «Bono»
en el trayecto. La cobertura depende del operador, zona y ruta.

Se necesitan costes del coche y confirmación de que ambos medios
cubren el mismo recorrido para recomendar coche por precio.
No comparar automáticamente viajes urbanos con excursiones
sin transporte alternativo real.

Los precios SL se cargan desde el catálogo 2026. El usuario
puede introducir una simulación sin modificar los datos fuente.

## Alta de un nuevo destino

1. Crear `configuracion/datos/transporte/<destino>-<ano>.js` y publicar
   `window.VCCTransportDestination` con schemaVersion, destination, city,
   operator, currency, updated, source, categories, modes y tickets.
2. Cada billete incluye `id`, `label`, `type`, `quantity`, `scope: "person"`
   y `price: { adult: ..., reduced: ... }`, si esos grupos existen.
3. `type:"rides"` indica un billete o bono para N VALIDACIONES. Una
   transferencia que sigue dentro de la validez del billete sencillo NO se
   introduce como otra validación pagada. Ejemplo: `quantity:10` significa
   bono de diez usos, no diez días.
4. `type:"hours"` y `type:"days"` representan uso ilimitado durante
   esas horas o días. 48 horas = `type:"hours", quantity:48`.
5. Solo introducir títulos comercializados de verdad, con origen oficial,
   categoría elegible, zonas y fecha de validez. **No inventar** un bono de
   48 horas o de diez viajes si la red no lo ofrece.
6. En una nueva página, reutilizar el mismo motor (no copiar su algoritmo).
   El HTML debe incluir el catálogo del destino, el optimizador común y la
   presentación de calculadora, con scripts `defer` en ese orden.
7. Las tarifas del operador deben revisarse al actualizar la guía; no hay
   sincronización automática con los precios oficiales.

## Advertencias importantes

- El cálculo diario NO incluye horarios exactos de cada trayecto.
  Los abonos de 24, 48, 72 horas y de varios días se comparan en BLOQUES
  DE DÍAS como aproximación conservadora. Una activación a las 16:00 puede
  dar cobertura real al día siguiente. Para ofrecer exactitud hace falta
  indicar fecha y hora de los trayectos.
- Un billete de 75 minutos cuenta como una validación pagada. Los transbordos
  dentro de su vigencia pueden no requerir otro billete.
- Un abono de 2 horas u otro inferior a 24 horas puede aparecer en el editor,
  pero el motor lo **excluye de la optimización** si no existe un horario de
  trayectos. No se debe fingir una comparación numérica exacta.
- Los bonos de N viajes se calculan por persona, sin caducidad dentro del
  itinerario y no transferibles. Si en otro destino se permiten bonos
  compartidos, caducidades, tarifas por zonas, viajeros mixtos o límites
  de transbordos, esos casos necesitan reglas adicionales antes de publicar
  el resultado como concluyente.
- El cotxe usa SOLO los importes introducidos por el visitante. Deben
  considerarse alquiler, aparcamiento, combustible, peajes/congestión,
  seguro y plazas. Los trayectos con ferry y los recorridos interurbanos
  pueden NO ser comparables a los billetes urbanos elegidos.
- Dejar los precios simulados claramente marcados como SIMULACIÓN PERSONAL.
  No guardarlos como si fueran oficiales.

## Datos de Estocolmo (SL, 2026)

Fuentes oficiales: https://sl.se/en/fares-and-tickets
y tarifa 2026 de SL, vigente desde el 8 de enero de 2026.
Billete 75 minutos: 43/26 SEK; 24 h: 180/110; 72 h: 360/220;
7 días: 470/290 (adulto/reducida, si procede).
SL integra metro, autobús, tranvía y parte de los ferris; por tanto no
debe inventarse un abono de autobús distinto cuando todos comparten título.

## Próximos desarrollos

- Horarios concretos de cada trayecto para títulos de menos de 24 horas,
  activaciones por horas reales y días mixtos.
- Cálculo de múltiples categorías de viajeros en un mismo grupo.
- Reglas de bonos compartidos, zonas y tarifas por franjas/horas.
- Extraer toda la plantilla visual a componente genérico cuando exista un
  segundo destino; preservar márgenes y CSS de la guía compartida.
