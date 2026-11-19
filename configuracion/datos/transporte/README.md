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

## Comparador universal de transporte privado vs público (dos columnas)

**Primera implantación:** `/destinos/suecia/estocolmo/como-moverse.html`, rama quality.

- Interfaz universal: `/configuracion/js/componentes/vcc-transporte-comparador-universal.js` y `/configuracion/css/componentes/vcc-transporte-comparador-universal.css`.
- El contenido de los precios oficiales se obtiene del catálogo de destino: `/configuracion/datos/transporte/estocolmo-sl-2026.js`.
- La guía de **Suecia** no se modifica hasta aprobar el diseño de Estocolmo.

### Transporte privado

Se introduce el coste total por VEHÍCULO para todo el itinerario:
alquiler (si corresponde), combustible/carga, aparcamiento y peajes,
seguro y otros gastos. Los dos costes principales se exigen para
recomendar el coche; los opcionales vacíos equivalen a cero y se
explica al usuario. La capacidad por vehículo es editable
(predeterminada: 5 plazas) y `ceil(viajeros/plazas)` calcula
los coches necesarios. Se muestran coste por persona y por grupo.

### Transporte público

Cada viaje es editable por separado: nombre, día, precio individual
por pasajero, hora opcional e indicación de si el bono lo cubre.
Pueden existir diez viajes de precios diferentes (por ejemplo uno
de 5 y otro de 7) y se suman individualmente.

Se permite comparar SIN bono o CON bono, por duración de N horas,
N días o N viajes. Se pueden elegir los bonos oficiales del catálogo
o introducir uno personalizado. Los bonos se calculan por persona,
no compartidos, y solo cubren los trayectos marcados por el usuario.
Para paquetes de N viajes, se cubren hasta N trayectos válidos por
bono; el optimizador escoge los de precio más alto entre los elegibles
para evitar sobrecostes. Para bonos temporales, se busca la compra
más económica entre el bono y los trayectos individuales.

**Horas reales:** en pases de menos de 24 horas se requieren horas
para todas las salidas cubiertas; de lo contrario se indica
que el cálculo no está disponible. Para 24 horas o más sin horas
específicas se aproxima por bloques de días, visible como
advertencia. No se presupone que los bonos de 10 viajes o 48 h
se vendan realmente en Estocolmo: son **SIMULACIONES** si los
introduce el usuario.

### Recomendación VCC

Se comparan costes totales para el mismo número de viajeros, dando
la opción de menor coste entre billetes sueltos, la mejor combinación
que incluye bono y coche. **El coche solo participa cuando hay
costes introducidos y el usuario confirma que cubre la misma ruta**.
La diferencia con la siguiente alternativa se expresa por persona.
Si no coinciden los trayectos (ej. islas que requieren ferry), no
se recomienda el coche por un importe irrelevante.

### Adaptación a un destino nuevo

No duplicar el motor ni el CSS. Usar el mismo componente y
un catálogo por destino (operador, divisa, categorías, tipos de
bono, precios y ámbito de cobertura), junto con el HTML de
la calculadora. Las etiquetas específicas de moneda y operador
deben configurarse desde la ficha correspondiente.

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
