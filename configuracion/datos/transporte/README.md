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

## Comparador universal VCC · tres alternativas configurables

**Piloto:** `destinos/suecia/estocolmo/como-moverse.html` (rama `quality`).
No aplicar el rediseño a la guía general de Suecia sin aprobación.

- Motor: `configuracion/js/componentes/vcc-transporte-comparador-universal.js`
- CSS: `configuracion/css/componentes/vcc-transporte-comparador-universal.css`
- Referencia de precios iniciales: `configuracion/datos/transporte/estocolmo-sl-2026.js`

### Interfaz

Dos filtros comunes: **días** y **viajeros**. Tres tarjetas independientes
seleccionables y ordenables: coche, billetes sueltos y abonos.
Al cambiar el orden no se pierden datos. La comparación exige dos opciones
activadas como mínimo. Los márgenes exteriores los define la página.

- **Coche:** coche propio o alquilado, alquiler total de todos los coches,
  combustible total, párquing por día (de todo el grupo), peajes totales,
  extras y confirmación de que la ruta sea comparable. No se pregunta por
  plazas ni se multiplican automáticamente los gastos por número de coches.
- **Billetes individuales:** número de billetes por persona y precio
  habitual, con botón para añadir. El editor flotante se abre bajo
  «Editar» y permite cambiar cada fila: **01 · descripción · precio · ×**.
  No se pide el medio de transporte ni las horas.
- **Abonos:** misma estructura de fila numerada (**01 · descripción ·
  precio · ×**). La descripción es libre: `72 horas`, `10 viajes`,
  etcétera. El usuario añade tantas filas como abonos necesite (máximo
  30). No se infiere automáticamente la cobertura del nombre del bono.
  En el mismo panel puede añadir **billetes complementarios**: también
  tienen número, descripción y precio.

Los editores de billetes y abonos son **paneles flotantes** colocados fuera
del flujo vertical (`position:absolute` escritorio, `fixed` en móvil).
Abrirlos no aumenta la altura de las tarjetas; cada panel dispone de cierre,
su propio desplazamiento y un alto máximo. Se mantienen las tres tarjetas
con fondos neutros y una conclusión sobre naranja translúcido.

### Lógica de cálculo

- **Coche:** `alquiler + combustible + párquing_diario × días + peajes + extras`.
  Los importes son **totales del grupo**; se dividen por viajeros solo para
  mostrar el coste individual.
- **Billetes sueltos:** suma de precios de cada trayecto por persona;
  el total de grupo multiplica por viajeros. Los viajes pueden tener
  precios distintos.
- **Abonos:** suma de precios de abonos informados + suma de billetes
  adicionales informados, **por persona**. No se asignan viajes a bonos
  ni se predice si un pase de 24/72 h cubre trayectos: el viajero
  debe introducir los billetes no cubiertos y consultar las condiciones
  del operador. Un importe sin rellenar invalida esa alternativa,
  sin considerarlo cero. Los bonos personalizados son simulaciones,
  no tarifas oficiales reconocidas.

La recomendación evalúa solamente las alternativas seleccionadas con
datos válidos. Si faltan importes de otras opciones seleccionadas,
se indica que el resultado es provisional. Los precios y los descuentos
son orientativos y deben contrastarse con el operador.

### Galería editorial

`Elige tu transporte` tiene dos tarjetas navegables y, a la derecha,
un mosaico fijo de 15 fotos compartido con `vcc-gallery-booking`,
sin tarjeta exterior. Solo navegan las fichas; la galería conserva
etiquetas y visor. En ordenador el mosaico queda 12 px más bajo
(6 px arriba y abajo); en móvil sigue una proporción adaptable.

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
