# Plan de implementación — Altiva Essentia: experiencia de perfumería y servicios

## Alcance y decisiones

Refactorizar el sitio existente (React 18 + Vite + Express 4, ES modules) sin sustituir el catálogo ni la identidad oscura y dorada. La especificación vigente nombra a la asesora conversacional **Soraya**; este nombre sustituye la etiqueta anterior **Nez** en las superficies visibles de IA. “Curaduría” se reemplazará según contexto por **Selección Reservada**, **Selección del Mes**, **Colección de Autor** o **Compendio Olfativo**.

El prompt adjunto actualiza la navegación anterior: el header global será único, con búsqueda central en escritorio y una lupa que abre la búsqueda modal en pantallas menores de 1024 px. Desde 1024 px, el sidebar es una cápsula glass flotante (left 16 px, centro vertical, ancho 68 px, altura máxima 85 vh), con los puntos anclados en la base y espaciado que se compacta en viewports bajos para que no se corten. Sus tooltips dependen solo de hover/foco; el estado de ruta no los mantiene abiertos. Por debajo de 1024 px, desaparece el rail vertical y se usa una isla fija centrada (`bottom:20px`, `width:90%`, `max-width:32rem`) con siete accesos equitativos (Inicio, Catálogo, **Colecciones**, Quiz, Soraya, Cofre y Más). Colecciones abre directamente `#/collections` en la sección de familias —sin animación de scroll que pueda dejar el hero en pantalla—; cada familia conserva su filtro. Más da acceso a Diario, Casa, Ayuda y tema. La ruta activa se señala con una línea dorada bajo el icono. Se conserva el header único de búsqueda.

La nueva fuente es `altiva_essentia_catalogo.xlsx`: **147 referencias**, **16 registros de casa/línea** y **14 etiquetas exactas de familia olfativa**. Incluye 145 perfumes y dos productos complementarios declarados como `DEO` y `SET`; estos se conservan en el catálogo, pero Soraya no los recomienda como perfumes salvo que la persona pida desodorantes, miniaturas o accesorios. La planilla reemplaza las 38 fichas ficticias. Se conservan producto, casa, género, familia, notas, presentación, tipo, volumen, año, precio y duración; `Consultar` y celdas vacías siguen desconocidos. “Colecciones olfativas” y “Explorá por familia” derivan directamente de la columna **Familia olfativa**, con conteos y filtros exactos. Soraya recibe los campos en cada consulta —sin ajuste de pesos del modelo— y no inventa datos faltantes ni pirámides olfativas.

El Excel contiene rutas/nombres de archivo para imágenes, pero no se adjuntó la carpeta de fotos: hay 132 referencias en la hoja y 15 filas sin nombre de foto; ninguno de esos archivos está disponible en el proyecto. Para evitar imágenes rotas, las 147 tarjetas conservarán la puesta visual existente de frasco Altiva y fondo por familia (`BottleStage`/`public/img`); se guardará la referencia de foto para poder enlazar assets reales cuando se aporten.

Las familias Gourmand/Oriental Vainilla, Ámbar Oriental/Oriental y Amaderado/Oud/Oriental Amaderado comparten sus assets canónicos (`gourmand.webp`, `amber.webp` y `oud.webp`) porque representan el mismo eje visual. Frutal y Floral Almizclado recibirán imágenes editoriales nuevas y distintas de la rosa/floral. El hero conserva espacio negativo izquierdo para la tipografía y el frasco focal en la derecha; su fondo se alineará de forma responsiva sin desplazar el sujeto ni recortar el CTA. La ruta estable `#/collections` mostrará directamente las familias, y tendrá un icono propio y visible en la isla tablet/móvil. La ficha de producto debe renderizar correctamente; se corregirá la referencia al icono `Heart` no importado que causa una excepción al pulsar una fragancia.

El prompt exige puntos, OTP y recuperación persistente de tickets. Para que el servidor —y no el navegador— sea la fuente de saldo, desafíos y órdenes, se usa la base MySQL administrada del proyecto con migraciones aditivas, transacciones y consultas parametrizadas. **La base está habilitada** tras la aprobación del usuario; el endpoint de salud confirma conectividad. Al abrir Preview, la app puede inicializar una sesión anónima de Pase Altiva con saldo cero; en esta verificación no se crearon pedidos ni movimientos de puntos y no se ingresaron datos personales.

### Límites de datos y operaciones

- La planilla incluye **125 duraciones textuales** y **22 vacías o `Consultar`**. Se conserva el dato literal por producto y se agrupa para filtros/quiz en tres niveles —Moderada (aprox. 3–8 h), Notoria/Larga (aprox. 5–9 h) e Intensa (8–12+ h)— sin convertirlos en garantía; los faltantes siguen desconocidos. Soraya no deriva horas de familia ni de notas.
- El prompt pide una leyenda **oficial** de conservación térmica y garantía olfativa, pero no incluye su texto. Se añadió el área de ayuda con recomendaciones generales claramente no contractuales y un contacto para consultar; no se atribuye una garantía ni una política oficial sin el texto aprobado.
- No se indicó el costo en puntos ni el stock de decants/kits VIP. Se muestran como recompensas sujetas a consulta, sin inventar equivalencias ni disponibilidad. El canje monetario sigue la regla dada: **500 puntos = ARS 5.000**, limitado al total aplicable.
- El checkout actual no verifica un pago: su integración de Mercado Pago está comentada y la ruta `/create-preference` no existe en este servidor. Por seguridad, el endpoint no confiará en el total, los precios, un ID de ticket ni un estado de pago enviados por el navegador. Hasta contar con verificación del proveedor, se emitirán **resúmenes de pedido pendientes**, no comprobantes de venta pagada ni facturas. No se conectará una pasarela ni se afirmará que un pago fue aprobado.
- Nodemailer se implementó con `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASS`; los valores se ingresaron mediante el canal seguro del proyecto. El hostname crudo llevaba espacios exteriores y provocaba `ENOTFOUND`; el backend ahora recorta solo esos espacios y el DNS resuelve. El transporte aún devuelve `EAUTH` con las credenciales actuales, por lo que OTP/tickets por correo siguen bloqueados. No se mandaron correos reales durante las pruebas. WhatsApp se usa mediante enlaces directos prellenados, sin automatizar mensajes.
- El identificador aleatorio `altiva_client_token` se guarda en `localStorage`, pero el saldo y los eventos residen en el servidor. No hay contraseñas ni login. Si la persona borra los datos del navegador, pierde el identificador anónimo y no hay recuperación entre dispositivos.
- Entrega de esta iteración: solo la Preview; no generar un ZIP ni publicar el sitio.

## Iteración vigente: inteligencia olfativa contextual

- La asesora conversacional se presenta como Soraya y usa el endpoint existente `POST /api/ai`, el catálogo normalizado y el modelo gestionado `gpt-5-mini`, disponible en el catálogo LLM en vivo; no se exponen claves en el navegador.
- El contexto de producto procede de `src/data.js` y `server/services/catalogService.js`. El servidor filtra y valida los IDs contra el catálogo; los atributos desconocidos permanecen desconocidos y ningún texto importado puede redefinir instrucciones del sistema.
- El buscador recibe lenguaje natural sobre ocasión, notas, familia, estación y presupuesto. Estaciones, estilos y ocasiones son afinidades editoriales derivadas únicamente de familia/notas, no hechos del proveedor ni garantías.
- El quiz transforma sus cinco respuestas en perfil y productos reales. El comparador trabaja con dos o tres perfumes seleccionados del catálogo y separa datos informados de interpretación editorial. Layering propone pares del catálogo y explica el efecto esperado como hipótesis creativa, no como garantía.
- El estado del Estudio IA y del quiz se mantiene en `AppProvider` durante los cambios de ruta hash para que, al abrir una ficha, la persona pueda volver a la consulta o comparación. Es memoria efímera de la sesión; no se crean perfiles persistentes ni se guardan consultas personales en el servidor.
- Reutilizar tarjetas, ficha, carrito y diseño Dark Luxury existentes. Búsqueda, quiz, comparación, chat y layering conservan loading, error/reintento y estado explícito de no coincidencia.

## Implementación y módulos

1. **Marca, navegación y responsive:** actualizar los textos a Soraya; usar `FlaskConical` para el quiz y `Sparkles` para el Estudio IA; usar una cápsula flotante de iconos en desktop con tooltips solo hover/foco, y una isla inferior centrada con accesos equilibrados en tablet/móvil (<1024 px), con menú “Más” para rutas secundarias; conservar el header único de búsqueda. Ajustar cristal, sombra y contraste al tema activo, sin cortes ambientales ni solapamiento con contenido. Los filtros generales reunirán “Destacados”, presupuesto y duración; el selector se renderizará como dropdown Dark Luxury accesible.
2. **Exploración del catálogo:** compartir desde tarjetas y fichas con `navigator.share` y fallback a enlace/WhatsApp; presentar las notas como lista fiel a la planilla y no inferir etapas de pirámide. Añadir filtros/quiz de duración en tres niveles amplios; cada ficha conserva el valor literal y aclara su carácter orientativo/no garantizado. El catálogo presenta 24 tarjetas inicialmente con “Mostrar más” para mantener ligera la carga móvil.
3. **Soraya y Pase Altiva:** conectar el prompt/API de recomendaciones, búsqueda, quiz y comparación al catálogo fuente; suministrar casa, familia, notas, tipo, presentación, precio y datos ausentes. Soraya recomienda perfumes por defecto y complementos solo si se solicitan expresamente; no realiza fine-tuning. Mantener el ledger anónimo idempotente y OTP descritos arriba.
4. **Ayuda y showroom:** crear/actualizar las secciones de envíos y devoluciones, incidencias y “Santuario Olfativo”; generar un QR local con `qrcode.react`, marca de agua del isotipo y enlace directo a WhatsApp `+54 9 351 652-1368`; la planilla producirá un ticket de incidencia y abrirá un mensaje prellenado. Mostrar “Próximamente en Córdoba, Argentina” y “24 hs (atención y tienda online)”. La encuesta de tres campos —Estética, Experiencias y Sugerencias— acredita `+200` una sola vez por cliente.
5. **Pedidos, PDF y correo:** `services/pdfService.js` generará A4 en memoria con PDFKit; `services/emailService.js` enviará HTML oscuro/dorado y el adjunto desde Nodemailer. `POST /api/checkout/confirm` validará el carrito contra el catálogo del servidor, recalculará importes, guardará el pedido y devolverá su ID aleatorio; el correo y el PDF describirán su estado real. `GET /api/tickets/download/:ticketId` recuperará el pedido persistido y regenerará el Buffer, sin archivos temporales. El frontend mostrará descarga del ticket y estado pendiente cuando corresponda.
6. **Importación de catálogo:** convertir las hojas `Productos` y `Casas` a `data/catalog.json`, manteniendo el Excel original y un importador reproducible. `src/data.js` exporta la fuente única a frontend y backend; familias/casas y conteos derivan de las columnas. Las fichas distinguen perfume, desodorante y set. Tarjetas, Soraya, carrito, checkout y PDF usan presentación/precio reales; precio desconocido será “Consultar”, no se acepta en checkout y los campos vacíos permanecen vacíos.

### Dependencias y ejecución

Se conserva `pnpm@11.25.0`, `react`, `react-dom`, `lucide-react`, Vite y Express. Se añadirán `mysql2` para MySQL, `pdfkit`, `nodemailer` y `qrcode.react`; no se incorporarán secretos al bundle ni a Git. Express seguirá escuchando en el puerto configurado (3000 por defecto), sirviendo Vite en desarrollo y `dist/` en producción.

### Estructura prevista

- `src/components.jsx`: header, rail/barra inferior, tarjetas compartibles, carrito y chat de Soraya.
- `src/pages1.jsx`: Home, catálogo/filtros por familia y casa, ficha/lista de notas y compartir.
- `src/pages2.jsx`: checkout, quiz, ayuda, encuesta, incidencias y reseñas.
- `src/pages3.jsx`: Estudio IA y preferencia de duración.
- `src/useAltivaPoints.js`: sesión anónima, saldo y acciones del Pase Altiva.
- `src/lib.jsx`, `src/aiClient.js`, `src/data.js`: estado compartido, cliente IA y adaptación del catálogo JSON importado; cada duración informada o derivada seguirá marcada como orientativa y no garantizada.
- `data/source/altiva_essentia_catalogo.xlsx`, `data/catalog.json`, `data/README.md`, `scripts/import_catalog.py` y `requirements-import.txt`: fuente adjunta, JSON normalizado compartido, límites de los datos, transformación reproducible y versión fijada de `openpyxl`.
- `server/services/catalogService.js`: contexto factual completo para Soraya: familias, notas informadas, presentación, volumen, precio y duración original.
- `server/index.js`: rutas de IA, OTP, puntos, pedidos, descarga y salud del servicio.
- `server/services/{pdfService,emailService,loyaltyService,orderService}.js`: documentos, correo, ledger y órdenes separados del router.
- `db/migrations/001_altiva_core.sql`: tablas aditivas para clientes anónimos, movimientos, desafíos OTP y pedidos.
- `public/manus-routes.json`: manifiesto sincronizado con las rutas de página.

El estado de tema `dark|light` vivirá en `AppProvider`, se persistirá en `localStorage` bajo la clave `theme` y se aplicará en `<html data-theme>`. El header y los accesos de navegación se implementan en `src/components.jsx`; la búsqueda del header se conecta al filtro `q` del catálogo en `src/pages1.jsx`; el sistema cromático dual se define en `src/styles.css`.

## Diseño

- **Movimiento:** editorial de alta perfumería contemporánea con glassmorphism oscuro, no un dashboard genérico.
- **Principios:** navegación silenciosa; jerarquía tipográfica editorial; transparencia sobre datos y pagos; controles breves y táctiles en móvil.
- **Color:** modo oscuro de alto contraste con texto principal `#FFFFFF`, texto secundario `#F5F5F7` y oro `#D4AF37`; modo claro Champagne Luxury con base `#FDFBF7`, paneles blancos traslúcidos al 85%, grafito `#121212` y oro `#B8860B`.
- **Composición:** rail flotante separado del margen izquierdo en desktop; header limpio con un único buscador; isla de navegación inferior centrada bajo 1024 px, con iconos distribuidos equitativamente y menú “Más”. El contenido principal respira en secciones asimétricas y paneles laterales, con el Hero como umbral de la exploración.
- **Motivos:** vidrio ahumado con filete dorado; halo radial difuso detrás de las familias, sin cortes rectos; frasco ilustrado, notas fieles a la fuente y filete dorado de ruta activa.
- **Interacción y movimiento:** tooltips solo con hover/foco, nunca por estado activo persistente; estado de ruta visible mediante subrayado dorado; pulsación táctil breve; transición de tema de 500 ms; sin movimiento esencial para entender la pantalla; respetar `prefers-reduced-motion`.
- **Tipografía:** conservar Outfit para títulos funcionales, Inter para lectura y Cormorant Garamond para acentos editoriales.
- **Esencia de marca:** la casa digital que traduce preferencias en descubrimientos olfativos de nicho; **serena, experta, sensorial**.
- **Voz:** íntima y precisa, nunca promete rendimiento no documentado. Ejemplos: “Decime qué querés sentir; Soraya encuentra el hilo.” / “La duración depende de cada piel. Te mostramos solo lo que la ficha confirma.”
- **Marca:** reutilizar el isotipo existente; wordmark Altiva Essentia en serif editorial, con corona dorada ya presente en el sello; color propio `#D4AF37`.
