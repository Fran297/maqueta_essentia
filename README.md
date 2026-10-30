# Altiva Essentia — Nez y Pase Altiva

Sitio interactivo de perfumería construido con React 18, Vite y Node.js/Express. El catálogo parte del Excel Altiva de 147 referencias y 14 familias olfativas, y alimenta el estudio con IA de Nez. Incluye Pase Altiva anónimo con saldo en MySQL, tickets PDF en memoria, OTP por email y experiencias de ayuda/compartir. La fuente y su proceso de importación están documentados en `data/README.md`.

## Desarrollo

```bash
pnpm install
pnpm dev       # Express + Vite, escucha PORT (3000 por defecto)
pnpm build     # genera dist/
```

El inicio verifica MySQL y aplica migraciones aditivas `db/migrations/*.sql`. El esquema conserva datos existentes y no incluye operaciones destructivas. El identificador aleatorio del Pase se guarda en `localStorage`; su saldo solo se lee/escribe en servidor. Si se elimina el almacenamiento del navegador, ese pase anónimo no se puede recuperar.

## Funciones

- Asesor **Nez** y Estudio IA basados en el catálogo disponible.
- Filtros de duración agrupados en niveles moderada, notoria/larga e intensa; la ficha conserva la duración literal de la planilla. Los grupos son orientativos, no mediciones ni garantías, y nunca completan valores `Consultar` o vacíos.
- Puntos por quiz diario, una recomendación compartida y una encuesta por Pase; canje de 500 puntos por ARS 5.000 tras OTP de un solo uso enviado al correo.
- Resumen PDF A4 regenerable en memoria. Mientras no exista un proveedor de pago verificado, cada pedido se conserva con estado `pending_payment`; el PDF no es una factura ni constancia de pago.
- QR/WhatsApp generado localmente en el navegador; tickets de soporte persistidos en el backend.

## Variables de entorno

La plataforma inyecta `DATABASE_URL`, `MANUS_API_URL` y `MANUS_API_KEY`. Para correo se necesitan `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASS`; se pueden ingresar en la configuración segura del proyecto. `.env.example` documenta los nombres sin incluir valores reales. **Pendiente de activación:** el host SMTP actualmente configurado no resuelve en DNS (`ENOTFOUND`), así que los emails y OTP por correo no están operativos hasta corregirlo. No se enviaron emails de prueba.

## Seguridad (auditoría técnica)

- **Puntos del Pase Altiva:** el servidor valida el saldo real (fila bloqueada) al aplicar un canje; saldo insuficiente → HTTP 400. Puntos y descuento nunca se leen del body.
- **Cabeceras y límites:** `helmet` (CSP solo en producción, HSTS) y `express-rate-limit`: 100 solicitudes / 15 min por IP en `/api` (excepto `/api/health`) y 10 / hora en `POST /api/checkout/confirm`. Configurá `TRUST_PROXY` y `CSP_FRAME_ANCESTORS` (ver `.env.example`).
- **Tickets:** ID no predecible `ALT-8F92A4B1-94A2` (UUID aleatorio). La descarga y las reseñas siguen limitadas al dueño del Pase; los tickets con el formato anterior se siguen aceptando.
- **Correo:** hasta 3 intentos con backoff exponencial solo ante errores transitorios (red/SMTP 4xx). El ticket se envía en segundo plano (`emailQueued`) para no bloquear el checkout.
- **Asistente IA:** el prompt de sistema del servidor limita las respuestas al catálogo (`data/catalog.json`).
- **Consentimiento:** casilla obligatoria y sin marcar en el Quiz y en la encuesta del Santuario. Los puntos vencen tras 12 meses de inactividad (texto informativo; no hay vencimiento automático en el servidor).

## Dependencias añadidas

`mysql2` para MySQL, `pdfkit` para PDF en `Buffer`, `nodemailer` para SMTP y `qrcode.react` para representar el QR, `helmet` y `express-rate-limit` para seguridad HTTP. Las credenciales de servidor nunca se importan desde código del navegador.
