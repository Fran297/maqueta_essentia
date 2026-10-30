# Análisis de tecnologías y dependencias — Altiva Essentia

**Fecha de revisión:** 17 de octubre de 2026  
**Alcance:** lectura del código fuente, configuración, manifiestos de dependencias, lockfile e inventario de archivos. No se modificó la lógica de la aplicación.

## Resumen ejecutivo

El proyecto es una aplicación web de comercio electrónico de una sola página, construida con **React 18 y Vite 5**, servida por un backend **Node.js con ES modules y Express 4**. El mismo proceso atiende la API y, según el entorno, monta Vite en desarrollo o sirve la compilación `dist` en producción. La persistencia funcional usa **MySQL** mediante `mysql2`; la inteligencia artificial llama desde el servidor a una API compatible con OpenAI mediante `fetch` nativo y el modelo configurado `gpt-5-mini`. El catálogo se normaliza a JSON desde Excel usando un script independiente de Python y `openpyxl`.

La interfaz utiliza CSS propio; no se encontraron Tailwind, React Router, Axios ni el SDK npm de OpenAI. El proyecto incluye correo SMTP, generación de PDF, QR SVG y una implementación anónima del programa de puntos.

## Tecnologías y arquitectura

| Área | Tecnología | Uso en el proyecto |
|---|---|---|
| Frontend | React 18 + JSX | Páginas, componentes, hooks, tema, carrito y estados compartidos. El punto de entrada monta `App` dentro de `React.StrictMode` (`src/main.jsx`). |
| Build y desarrollo | Vite 5 + `@vitejs/plugin-react` | Transformación JSX, servidor de desarrollo y build a `dist` (`vite.config.js`). |
| Backend | Node.js + ES modules + Express 4 | API REST, validaciones, lógica de negocio y entrega de la SPA (`server/index.js`). |
| Rutas frontend | Router propio basado en `location.hash` | `parseHash()`, `useRoute()` y `go()` en `src/lib.jsx`; no usa una librería de routing. |
| Estado frontend | React Context y hooks | `AppProvider` coordina carrito, favoritos, tema, overlays y estado temporal del Estudio IA/quiz (`src/lib.jsx`). `localStorage` conserva carrito, favoritos, tema y el token anónimo. |
| Estilos | CSS propio | `src/styles.css` implementa tokens, temas oscuro/claro, layout, responsive y glassmorphism; no hay Tailwind ni framework CSS declarado. |
| Datos | JSON + fuente Excel | `data/catalog.json` es la fuente normalizada compartida; `src/data.js` la adapta a las estructuras del frontend y el servidor. El Excel original se conserva en `data/source/`. |
| Base de datos | MySQL | `mysql2/promise` crea el pool y `db/migrations/001_altiva_core.sql` define las tablas. El backend usa SQL parametrizado directamente, sin ORM. |
| IA | API administrada, compatible con OpenAI | `server/index.js` invoca el endpoint de chat completions con `fetch` nativo; las credenciales se leen solo en servidor. El modelo configurado es `gpt-5-mini`. No se importa el paquete `openai`. |
| Correo | SMTP con Nodemailer | OTP y correo de ticket con PDF adjunto (`server/services/emailService.js`). |
| PDF | PDFKit | Genera un resumen A4 en un `Buffer`, que se envía o descarga sin crear un archivo temporal (`server/services/pdfService.js`). |
| QR | `qrcode.react` | Renderiza un QR SVG en la interfaz, principalmente para contacto/WhatsApp (`src/pages2.jsx`). |
| Iconos | `lucide-react` | Iconografía de navegación, catálogo, checkout y experiencias de IA. |
| Importación | Python 3 + `openpyxl` | `scripts/import_catalog.py` valida hojas/columnas y transforma registros del Excel en JSON reproducible. No forma parte del runtime de la web. |

### Flujo de ejecución

- `pnpm dev` ejecuta `node server/index.js`. En modo desarrollo Express carga Vite dinámicamente como middleware (`server/index.js`, bloque final); no es un proceso Vite separado.
- `pnpm build` ejecuta `vite build` y genera `dist/`.
- `pnpm start` inicia Express en modo producción; el servidor sirve los assets de `dist/` y aplica fallback a `index.html`.
- Antes de escuchar, el servidor ejecuta `ensureSchema()`. Por eso el backend también depende de una base accesible y de `DATABASE_URL`, incluso durante desarrollo.
- `server/services/catalogService.js` importa el catálogo adaptado desde `src/data.js`; no hay una segunda fuente de catálogo para el backend.

### Módulos principales

- `src/App.jsx`: composición global y selección de página por hash (`#/catalog`, `#/product/:id`, `#/quiz`, `#/ai`, etc.).
- `src/components.jsx`: navegación, barra superior, carrito, chat de Nez y componentes compartidos.
- `src/pages1.jsx`: inicio, colecciones, catálogo y fichas.
- `src/pages2.jsx`: checkout, quiz, contenido editorial, contacto y cuenta.
- `src/pages3.jsx`: Estudio IA — búsqueda, comparación y layering.
- `src/aiClient.js`: llamada same-origin al endpoint `/api/ai`.
- `src/useAltivaPoints.js`: cliente del Pase Altiva y su token de sesión anónima.
- `server/index.js`: orquestación de API y servicios.
- `server/services/`: catálogo para IA, pedidos, puntos/OTP, correo y PDF.

## Dependencias npm

Versiones declaradas en `package.json` frente a las instaladas que mostró `pnpm list --depth=0`:

| Paquete | Rango declarado | Instalado | Función |
|---|---:|---:|---|
| `express` | `^4.21.2` | `4.22.3` | API, middleware y servidor web. |
| `lucide-react` | `^0.468.0` | `0.468.0` | Iconos React. |
| `mysql2` | `^3.24.6` | `3.24.6` | Driver y pool MySQL con API Promise. |
| `nodemailer` | `^10.1.1` | `10.1.1` | Envío por SMTP. |
| `pdfkit` | `^0.20.2` | `0.20.2` | Generación de PDF. |
| `qrcode.react` | `^4.2.0` | `4.2.0` | QR en SVG dentro de React. |
| `react` | `^18.3.1` | `18.3.1` | UI y estado declarativo. |
| `react-dom` | `^18.3.1` | `18.3.1` | Montaje de React en el DOM. |
| `@vitejs/plugin-react` (desarrollo) | `^4.3.4` | `4.7.0` | Integración de React/JSX con Vite. |
| `vite` (desarrollo) | `^5.4.11` | `5.4.21` | Servidor de desarrollo y compilación. |

El gestor está fijado como `pnpm@11.25.0` y existe `pnpm-lock.yaml`. La única dependencia Python declarada es `openpyxl==3.1.5` en `requirements-import.txt`.

Node y Python observados en el entorno de auditoría fueron **Node.js 22.13.0** y **Python 3.12.3**. `package.json` no declara un campo `engines`; esas versiones son las del entorno revisado, no una garantía de que estén fijadas para cada despliegue.

## Persistencia, seguridad y servicios externos

- La conexión MySQL se crea desde `DATABASE_URL`; la migración cubre clientes anónimos, ledger de puntos, OTP, redenciones, pedidos, encuestas, incidencias y reseñas.
- El Pase Altiva no utiliza cuentas ni contraseñas. El token se guarda en el navegador; el servidor persiste su hash y el saldo/ledger en MySQL.
- Las llamadas de IA pasan por Express a `/api/ai`. La clave de la plataforma (`MANUS_API_KEY`) no se incluye en el bundle del navegador.
- El correo requiere `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASS`. El código recorta los espacios exteriores de las variables SMTP; las credenciales actuales aún requieren autenticación aceptada por el proveedor.
- No se observa un SDK ni una integración de pasarela de pago. Los pedidos se guardan con estado pendiente y el PDF aclara que no es una factura ni confirma un pago.

## Observaciones y oportunidades de mejora

1. **Sin herramientas declaradas de test, lint o formato.** Los scripts del paquete cubren `dev`, `build` y `start`; no hay script `test`, ESLint, Prettier ni framework de pruebas automatizadas en el manifiesto.
2. **Versiones no fijadas de forma exacta en el manifiesto.** Se usan rangos `^`; el lockfile de pnpm es lo que conserva la resolución instalada.
3. **Documentación con datos antiguos.** `README.md` aún titula y describe el asistente como “Nez”, aunque la interfaz y el backend actuales usan “Soraya”. También conserva el diagnóstico SMTP `ENOTFOUND`, mientras el código ya normaliza espacios y las verificaciones recientes llegaron a `EAUTH`.
4. **Variables locales incompletas.** `.env.example` documenta las variables SMTP, pero no enumera `DATABASE_URL`, `MANUS_API_URL` ni `MANUS_API_KEY`; el README indica que la plataforma las inyecta. Para desarrollo local convendría aclarar el origen seguro de cada una.
5. **`app.config.ts` no parece importarse desde el código de la aplicación.** Contiene metadata de logo, pero no hay un proyecto TypeScript general ni `tsconfig`; puede ser metadata consumida por la plataforma.
6. **Posible desajuste en las imágenes de dos familias.** `src/lib.jsx` contiene rutas absolutas bajo `/manus-storage/...` para `fruity` y `floral-musk`; el helper de fondo `BottleStage` en `src/components.jsx` debe preservar una ruta que ya empieza con `/`, en vez de anteponerle `/img/`. Conviene validar esos dos fondos en la ficha/tarjeta.
7. **Límite comercial importante:** el checkout calcula y registra pedidos, pero no confirma cobros; no debe presentarse como una integración de pago real hasta incorporar proveedor, webhook y transición verificada de estado.

## Conclusión

La base técnica es compacta y coherente para una demo de tienda interactiva con catálogo, recomendaciones IA y herramientas de lealtad: pocas dependencias directas, React/Vite en la experiencia y Express/MySQL en el servidor. Los principales pendientes del stack no son de framework, sino operativos y de mantenimiento: formalizar pruebas estáticas/automatizadas, alinear README y variables de entorno, validar las rutas de imágenes de familias y, antes de operar comercialmente, integrar pagos reales y completar la autenticación SMTP.


## Addendum: arquitectura del backend y auditoría de seguridad

Este addendum amplía el análisis del 17 de octubre de 2026 con el flujo de rutas de Express y una revisión del lockfile. No se modificaron dependencias ni lógica de aplicación. Los hallazgos de npm corresponden al árbol instalado durante esta revisión; pueden cambiar cuando se regenere el lockfile.

### Arquitectura y manejo de rutas

El backend es un proceso Express único. `server/index.js` configura JSON con un límite de 96 KB, carga el catálogo y los servicios, declara las rutas de salud, IA, lealtad, checkout, tickets y soporte, y finalmente monta Vite en Preview o sirve `dist` en producción. Aunque la lógica de negocio ya está separada en `server/services/`, todos los handlers HTTP y buena parte de su validación siguen concentrados en el mismo archivo. La separación de rutas por dominio es la mejora estructural más directa: routers pequeños para `/api/ai`, `/api/loyalty`, `/api/checkout`, `/api/tickets` y `/api/support`, montados desde un módulo de aplicación. Express documenta `express.Router()` precisamente como una unidad modular y montable de rutas [1].

El código maneja errores dentro de los handlers y usa una función `errorResponse`; sin embargo, no se ve un middleware de error central ni una ruta final que garantice JSON para todos los endpoints `/api/*` no reconocidos. En Express 4, los errores de handlers asíncronos necesitan pasar explícitamente al flujo de errores; conviene centralizar esa traducción después de montar los routers y añadir una respuesta JSON para rutas API inexistentes [2].

`allowRate()` mantiene contadores en un `Map` del proceso. Esto limita solicitudes en una sola instancia, pero se reinicia al reiniciar Node y no coordina límites entre varias instancias. Si se escala horizontalmente, el límite debería residir en un almacén compartido o en el gateway. `server/index.js` también monta Vite como middleware de Preview con `host: "0.0.0.0"`; producción, en cambio, sirve la compilación `dist`. Por tanto, los avisos de desarrollo de Vite deben tratarse según quién pueda alcanzar el Preview, sin atribuirlos automáticamente al runtime publicado.

`ensureSchema()` lee y ejecuta todos los `.sql` al arrancar y separa sentencias con `split(";")`. La migración actual usa `CREATE TABLE IF NOT EXISTS`, lo que hace repetibles sus creaciones actuales, pero no existe un registro de versiones aplicadas y la separación textual es frágil si se añaden rutinas o valores con punto y coma. Se recomienda un runner de migraciones versionadas con registro y una estrategia de arranque segura cuando coincidan varias instancias.

Hay controles valiosos que conviene conservar: SQL parametrizado en los servicios, cálculo del precio del pedido desde el catálogo del servidor, transacciones en operaciones del ledger, tokens anónimos almacenados como hash y OTP con sal, expiración, límite de intentos y comparación de hash en tiempo constante. El cuerpo JSON está acotado y se desactiva `x-powered-by`. Express y Node recomiendan añadir controles de borde como TLS en el proxy, validación consistente, gestión de errores y protección frente a disponibilidad según el despliegue [3] [4].

El checkout registra pedidos con estado `pending_payment`; no se encontró SDK, webhook ni confirmación de una pasarela. Debe describirse como registro de pedido, no como cobro confirmado. La API de salud comprueba MySQL y presencia de configuración, pero no verifica conectividad o autenticación SMTP. La corrección aplicada a SMTP recorta espacios externos y elimina el `ENOTFOUND`; la verificación actual llega al servidor y devuelve `EAUTH`, así que el correo todavía requiere credenciales aceptadas. No se enviaron correos de prueba.

### Versiones y hallazgos de dependencias

No se encontró un desfase fuera de los rangos declarados: las versiones instaladas de Express, React, `mysql2`, Nodemailer, PDFKit, `qrcode.react`, `lucide-react`, Vite y el plugin React satisfacen los rangos semver del manifiesto. La excepción importante es de política de seguridad, no de resolución: `vite` está declarado como `^5.4.11`, por lo que no puede instalar la rama 6 que contiene la corrección completa. Node está observado como 22.13.0 y pnpm sí está fijado; el paquete no declara `engines` para Node.

El audit completo del lockfile encontró **cuatro advisories en dependencias de desarrollo**: tres asociados a Vite y uno a esbuild. `pnpm audit --prod` no reportó vulnerabilidades. La revisión exacta de Express, React, `mysql2`, Nodemailer, PDFKit, QR, `openpyxl` y el resto de dependencias principales no encontró un advisory aplicable a la versión instalada; esto es una instantánea de los avisos publicados, no una garantía futura.

El hallazgo de mayor severidad es **Vite `server.fs.deny` en Windows**, CVE-2026-53571, con severidad alta. Afecta Vite hasta 6.4.2 y está corregido en 6.4.3. Requiere Windows y condiciones específicas de NTFS/rutas alternas, además de un servidor de desarrollo expuesto; no afecta directamente al host Ubuntu observado. La exposición sí importa para equipos Windows que ejecuten el Preview o dev server [5].

Los otros dos avisos de Vite son de severidad moderada. CVE-2026-39365 permite una lectura fuera de la raíz mediante rutas `.map`, pero solo si el servidor de desarrollo se expone y existe un source map sensible válido en una ubicación predecible; se corrige en 6.4.2 [6]. CVE-2026-53632 involucra `launch-editor` y rutas UNC en Windows con NTLM habilitado; la corrección indicada es Vite 6.4.3 y `launch-editor` 2.14.1 [7].

`esbuild` 0.21.5 cae dentro del rango del aviso moderado GHSA-67mh-4wv8-2f99, corregido en 0.25.0. El ataque descrito aprovecha la función `serve` de esbuild y su CORS permisivo; instalarlo o compilar con él no basta. El proyecto usa Vite como servidor de desarrollo y no llama directamente a `esbuild.serve()`, por lo que el audit señala un paquete afectado, pero la ruta concreta de explotación no queda demostrada en esta aplicación [8].

No se deben trasladar falsos positivos al informe: la alerta crítica de React Server Components afecta paquetes `react-server-dom-*` en versiones 19.x, no `react` o `react-dom` 18.3.1. Los avisos de Express, `mysql2`, Nodemailer, PDFKit, `openpyxl` y otros examinados se refieren a rangos anteriores, a paquetes diferentes o a condiciones que no corresponden a la versión instalada.

### Recomendaciones priorizadas

1. Actualizar Vite a **6.4.3 o posterior** en una rama de mantenimiento y regenerar el lockfile. Esa versión cubre los tres avisos de Vite revisados. `@vitejs/plugin-react` 4.7.0 declara compatibilidad de peer con Vite 6 y Node 22 cumple el requisito publicado. Confirmar después que el lockfile resuelva `esbuild` al menos en 0.25.0 y `launch-editor` al menos en 2.14.1; luego ejecutar `pnpm audit`, build y una prueba del Preview.
2. Extraer los handlers a `server/routes/` con `express.Router()` y mantener los servicios actuales como capa de negocio. Añadir una capa central de validación y errores, y garantizar respuestas JSON para rutas API desconocidas.
3. Sustituir el `Map` de rate limiting por un límite compartido si se habilitan varias instancias. Añadir un runner de migraciones con tabla de versiones y un cierre explícito del pool ante señales de terminación.
4. Declarar `engines`, agregar pruebas de servicios y rutas, y ejecutar audit/build en CI. Si el importador empieza a aceptar libros XLSX no confiables, evaluar una protección XML como `defusedxml`; la versión actual de `openpyxl` no cae en el advisory antiguo revisado.
5. Resolver por separado la autenticación SMTP. El fallo actual ya no es DNS: es `EAUTH`. No habilitar OTP por email ni afirmar que los tickets se envían hasta que `verifyEmailTransport()` tenga éxito.

## Referencias

[1]: https://expressjs.com/en/4x/guide/routing/ "Express 4 routing guide"
[2]: https://expressjs.com/en/4x/guide/error-handling/ "Express 4 error handling"
[3]: https://expressjs.com/en/advanced/best-practice-security.html "Express production security best practices"
[4]: https://nodejs.org/en/learn/getting-started/security-best-practices "Node.js security best practices"
[5]: https://github.com/advisories/GHSA-fx2h-pf6j-xcff "Vite server.fs.deny bypass on Windows alternate paths"
[6]: https://github.com/advisories/GHSA-4w7w-66w2-5vf9 "Vite path traversal in optimized dependency source maps"
[7]: https://github.com/advisories/GHSA-v6wh-96g9-6wx3 "launch-editor UNC path handling on Windows"
[8]: https://github.com/advisories/GHSA-67mh-4wv8-2f99 "esbuild development server CORS exposure"
