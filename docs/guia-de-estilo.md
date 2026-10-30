# Guía de estilo y tono de voz · Altiva Essentia

## Principios
- Exclusividad sin frialdad: elegante y cercano, nunca pretencioso.
- Describimos sensaciones y momentos, no listas de ingredientes.
- Voseo rioplatense en todo lo que habla al cliente ("Probá", "Escribí", "Contale").
- Honestidad sobre precios, stock y estado de pago: nunca prometer lo que la tienda no confirmó.

## Nombres oficiales
| Concepto | Nombre a usar | Evitar |
|---|---|---|
| Programa de puntos | **Pase Altiva** | Cofre de Puntos, Cofre Altiva |
| Asesora olfativa (IA) | **Nez** | Soraya, Aura |
| Sección de IA | **Laboratorio** | Estudio, Estudio IA |
| Catálogo | Catálogo | Tienda masiva, outlet |

## Botones y acciones
| No usar | Usar |
|---|---|
| Añadir | Agregar al carrito |
| Comprar ya | Agregar al carrito |
| Reservar fragancia | (no aplica: no hay flujo de reserva) |

## Títulos
- Cada página tiene un único H1 y un título propio en la pestaña del navegador ("Catálogo · Altiva Essentia").
- La meta description de la portada debe nombrar a la asesora vigente (Nez).

## Textos sensoriales de familia
Cada familia tiene un texto en `src/lib.jsx` (`FAMILY_COPY`) que se muestra en la ficha de producto. Describe la familia, no el perfume puntual: antes de publicar un texto para una casa o un producto, validarlo contra la descripción real de la casa.

Ejemplo (Oud): "Madera oscura, resina y un humo suave: una presencia profunda que se abre despacio y permanece en la ropa."

## Errores y mensajes
- Explicar qué pasó y cómo resolverlo, sin disculpas excesivas.
- Ejemplo: "Escribí qué fragancia estás buscando." (bien) / "Error de entrada." (evitar)

## Legal y comprobantes
- El ticket aclara que no es factura y que el pago puede estar pendiente de confirmación.
- Las políticas de privacidad y devoluciones deben enlazarse desde los formularios que piden datos (pendiente).
