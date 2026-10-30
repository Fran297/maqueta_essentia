import nodemailer from "nodemailer";

let transport;
const smtpUser = () => process.env.SMTP_USER?.trim();

export function isEmailConfigured() {
  const port = Number(process.env.SMTP_PORT);
  return Boolean(process.env.SMTP_HOST?.trim() && Number.isInteger(port) && port > 0 && port < 65536 && smtpUser() && process.env.SMTP_PASS?.trim());
}

function getTransport() {
  // SMTP values can arrive with copy/paste whitespace; normalize only their outer edges.
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const user = smtpUser();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass) throw new Error("SMTP configuration is incomplete");
  if (!transport) transport = nodemailer.createTransport({
    host, port, secure: port === 465, auth: { user, pass },
    tls: { minVersion: "TLSv1.2" }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  });
  return transport;
}

export async function verifyEmailTransport() { await getTransport().verify(); return true; }

/* ───────────── Reintentos con backoff exponencial ─────────────
   Solo se reintentan micro-cortes (red, DNS temporal, respuestas SMTP 4xx). Los errores permanentes
   (EAUTH, destinatario rechazado, 5xx, configuración incompleta) fallan de inmediato: reintentarlos no
   los arregla y repetir un login inválido puede bloquear la cuenta SMTP. */
const TRANSIENT_CODES = new Set(["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ECONNECTION", "ESOCKET", "EAI_AGAIN", "EPIPE", "EHOSTUNREACH", "ENETUNREACH", "ETIMEOUT"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function isTransientSmtpError(error) {
  const status = Number(error?.responseCode);
  if (status >= 400 && status < 500) return true;
  if (status >= 500) return false;
  return TRANSIENT_CODES.has(error?.code) || TRANSIENT_CODES.has(error?.errno);
}

/**
 * Ejecuta `send()` hasta `attempts` veces. Espera baseMs, 2·baseMs, … (más un pequeño jitter) entre intentos.
 * `budgetMs` limita el tiempo total: si el próximo reintento lo superaría, se corta y se propaga el error
 * (útil cuando una persona espera la respuesta HTTP, p. ej. el código OTP).
 * Los logs solo incluyen la etiqueta, el número de intento y el código del error; nunca direcciones ni credenciales.
 */
export async function sendWithRetry(send, { label = "mail", attempts = 3, baseMs = 500, budgetMs = Infinity, wait = sleep } = {}) {
  const startedAt = Date.now();
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await send();
    } catch (error) {
      const reason = error?.code || error?.name || "Error";
      const delay = baseMs * 2 ** (attempt - 1) + Math.round(Math.random() * baseMs * 0.2);
      const retryable = isTransientSmtpError(error) && attempt < attempts && Date.now() - startedAt + delay <= budgetMs;
      if (!retryable) {
        console.error(`[smtp] ${label}: envío fallido en el intento ${attempt}/${attempts} (${reason})${isTransientSmtpError(error) && attempt < attempts ? " — sin tiempo para reintentar" : ""}`);
        throw error;
      }
      console.warn(`[smtp] ${label}: intento ${attempt}/${attempts} falló (${reason}); reintento en ${delay} ms`);
      await wait(delay);
    }
  }
}

export async function sendOtpEmail(clientEmail, code) {
  // Hay una persona esperando la respuesta (el cliente corta a los 15 s): presupuesto total de 12 s.
  return sendWithRetry(() => getTransport().sendMail({
    from: smtpUser(),
    to: clientEmail,
    subject: "Tu código del Pase Altiva | Altiva Essentia",
    text: `Tu código de verificación es ${code}. Vence en 10 minutos. Si no lo solicitaste, ignora este mensaje.`,
    html: `<div style="background:#0d0d14;color:#f5f2ea;padding:32px;font-family:Arial,sans-serif"><div style="max-width:520px;margin:auto;border:1px solid #5b4928;padding:28px"><p style="color:#d4af37;letter-spacing:3px">ALTIVA ESSENTIA</p><h1 style="font-size:22px">Verificación del Pase Altiva</h1><p>Ingresá este código de un solo uso para autorizar el canje de puntos:</p><p style="font-size:34px;letter-spacing:10px;color:#d4af37;font-weight:bold">${code}</p><p>El código vence en 10 minutos. Si no solicitaste esta operación, ignora este correo.</p></div></div>`,
  }), { label: "otp", budgetMs: 12000 });
}

export async function sendTicketEmail(clientEmail, ticketId, pdfBuffer, { status, totalARS }) {
  const pending = status !== "paid";
  const subject = `Confirmación de Compra - Ticket #${ticketId} | Altiva Essentia`;
  const statusLine = pending ? "El pedido fue recibido y el pago aún está pendiente de confirmación." : "El pago de tu pedido fue confirmado.";
  // Se envía en segundo plano (ver /api/checkout/confirm): aquí no hay límite de tiempo salvo los 3 intentos.
  return sendWithRetry(() => getTransport().sendMail({
    from: smtpUser(), to: clientEmail, subject,
    text: `Ticket #${ticketId}. ${statusLine} Total informado: ARS ${totalARS}. El comprobante del pedido está adjunto.`,
    html: `<div style="background:#0d0d14;color:#f5f2ea;padding:32px;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;border:1px solid #d4af37;padding:30px"><p style="color:#d4af37;letter-spacing:3px">ALTIVA ESSENTIA</p><h1 style="font-size:24px">Gracias por elegirnos</h1><p>${statusLine}</p><p>Ticket <b style="color:#d4af37">#${ticketId}</b></p><p>Total del pedido: <b>ARS ${Number(totalARS).toLocaleString("es-AR")}</b></p><p>Adjuntamos el resumen PDF. No es una factura y, mientras el pago figure pendiente, no confirma una venta pagada.</p><p style="color:#cbb985">Soporte: WhatsApp +54 9 351 652-1368</p></div></div>`,
    attachments: [{ filename: `Ticket-AltivaEssentia-${ticketId}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
  }), { label: "ticket" });
}
