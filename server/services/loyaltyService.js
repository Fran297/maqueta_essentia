import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

const fail = (status, message, code) => Object.assign(new Error(message), { status, code });
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const available = async (db, clientId, lock = false) => {
  const [[client]] = await db.query(`SELECT points_balance FROM altiva_clients WHERE id=?${lock ? " FOR UPDATE" : ""}`, [clientId]);
  if (!client) throw fail(401, "La sesión del Pase Altiva ya no es válida.");
  const [[reserved]] = await db.query("SELECT COALESCE(SUM(points),0) AS points FROM altiva_redemptions WHERE client_id=? AND used_at IS NULL AND cancelled_at IS NULL AND expires_at>UTC_TIMESTAMP(3)", [clientId]);
  return Math.max(0, Number(client.points_balance) - Number(reserved.points || 0));
};

export async function loadSession(db, token) {
  if (!token) {
    const fresh = randomBytes(32).toString("base64url");
    const [result] = await db.execute("INSERT INTO altiva_clients (token_hash) VALUES (?)", [hashToken(fresh)]);
    return { token: fresh, clientId: result.insertId, balance: 0 };
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw fail(401, "La sesión del Pase Altiva no es válida.");
  const [rows] = await db.execute("SELECT id FROM altiva_clients WHERE token_hash=? LIMIT 1", [hashToken(token)]);
  if (!rows.length) throw fail(401, "La sesión del Pase Altiva venció. Se iniciará una nueva.");
  const clientId = rows[0].id;
  await db.execute("UPDATE altiva_clients SET last_seen_at=UTC_TIMESTAMP(3) WHERE id=?", [clientId]);
  return { token, clientId, balance: await available(db, clientId) };
}

export async function getAvailableBalance(db, clientId) { return available(db, clientId); }

export async function awardPoints(db, clientId, kind) {
  if (!new Set(["quiz", "share"]).has(kind)) throw fail(400, "Acción de puntos no reconocida.");
  const day = new Date().toISOString().slice(0, 10);
  const eventKey = kind === "quiz" ? `quiz:${day}` : "share:first";
  const amount = kind === "quiz" ? 150 : 200;
  const reason = kind === "quiz" ? "quiz" : "share";
  const cx = await db.getConnection();
  let awarded = false;
  try {
    await cx.beginTransaction();
    const [insert] = await cx.execute("INSERT IGNORE INTO altiva_points_ledger (client_id,event_key,reason,points_delta) VALUES (?,?,?,?)", [clientId,eventKey,reason,amount]);
    awarded = insert.affectedRows === 1;
    if (awarded) await cx.execute("UPDATE altiva_clients SET points_balance=points_balance+? WHERE id=?", [amount,clientId]);
    await cx.commit();
  } catch (e) { await cx.rollback(); throw e; } finally { cx.release(); }
  return { awarded, points: amount, balance: await available(db,clientId) };
}

export async function saveSurvey(db, clientId, answers) {
  const cx = await db.getConnection();
  try {
    await cx.beginTransaction();
    const [existing] = await cx.execute("SELECT id FROM altiva_surveys WHERE client_id=? LIMIT 1", [clientId]);
    if (existing.length) throw fail(409, "La encuesta ya fue enviada desde este Pase Altiva.");
    await cx.execute("INSERT INTO altiva_surveys (client_id,aesthetics,experiences,suggestions) VALUES (?,?,?,?)", [clientId,answers.aesthetics,answers.experiences,answers.suggestions]);
    const [insert] = await cx.execute("INSERT IGNORE INTO altiva_points_ledger (client_id,event_key,reason,points_delta) VALUES (?,?,?,200)", [clientId,"survey:first","survey"]);
    if (insert.affectedRows) await cx.execute("UPDATE altiva_clients SET points_balance=points_balance+200 WHERE id=?", [clientId]);
    await cx.commit();
  } catch (e) { await cx.rollback(); if (e.code === "ER_DUP_ENTRY") throw fail(409, "La encuesta ya fue enviada desde este Pase Altiva."); throw e; } finally { cx.release(); }
  return { awarded: true, balance: await available(db,clientId) };
}

export async function createOtp(db, clientId, email, points) {
  const [[limit]] = await db.execute("SELECT COUNT(*) AS n FROM altiva_otps WHERE client_id=? AND created_at>=DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 HOUR)", [clientId]);
  if (Number(limit.n) >= 5) throw fail(429, "Alcanzaste el límite de códigos. Esperá una hora para volver a intentar.");
  const balance = await available(db,clientId);
  if (points > balance) throw fail(400, "No tenés suficientes puntos disponibles para este canje.");
  const id = randomUUID();
  const code = String(randomInt(0,10000)).padStart(4,"0");
  const salt = randomBytes(16).toString("hex");
  const codeHash = createHash("sha256").update(`${salt}:${code}`).digest("hex");
  await db.execute("INSERT INTO altiva_otps (id,client_id,purpose,email,points,code_hash,code_salt,expires_at) VALUES (?,?, 'redeem', ?,?,?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 10 MINUTE))", [id,clientId,email,points,codeHash,salt]);
  return { id, code };
}

export async function discardOtp(db, id, clientId) { await db.execute("DELETE FROM altiva_otps WHERE id=? AND client_id=? AND consumed_at IS NULL", [id,clientId]); }

export async function verifyOtpAndReserve(db, clientId, challengeId, code) {
  const cx = await db.getConnection();
  let result, badCode = false;
  try {
    await cx.beginTransaction();
    const [rows] = await cx.execute("SELECT * FROM altiva_otps WHERE id=? AND client_id=? AND purpose='redeem' FOR UPDATE", [challengeId,clientId]);
    const otp = rows[0];
    if (!otp || otp.consumed_at || new Date(otp.expires_at).getTime() <= Date.now()) throw fail(400, "El código venció o ya fue utilizado. Pedí uno nuevo.");
    if (Number(otp.attempts) >= 5) throw fail(429, "Se agotaron los intentos para este código. Pedí uno nuevo.");
    const received = createHash("sha256").update(`${otp.code_salt}:${code}`).digest();
    const expected = Buffer.from(otp.code_hash,"hex");
    if (received.length !== expected.length || !timingSafeEqual(received,expected)) {
      await cx.execute("UPDATE altiva_otps SET attempts=attempts+1 WHERE id=?", [challengeId]);
      badCode = true;
    } else {
      const balance = await available(cx,clientId,true);
      if (Number(otp.points) > balance) throw fail(400,"Los puntos disponibles cambiaron. Volvé a iniciar el canje.");
      const redemptionId = randomUUID();
      const discountARS = Math.floor(Number(otp.points) / 500) * 5000;
      await cx.execute("UPDATE altiva_otps SET consumed_at=UTC_TIMESTAMP(3) WHERE id=?", [challengeId]);
      await cx.execute("INSERT INTO altiva_redemptions (id,client_id,points,discount_ars,expires_at) VALUES (?,?,?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 30 MINUTE))", [redemptionId,clientId,otp.points,discountARS]);
      result = { redemptionId, points: Number(otp.points), discountARS, balance:Math.max(0,balance-Number(otp.points)) };
    }
    await cx.commit();
  } catch (e) { await cx.rollback(); throw e; } finally { cx.release(); }
  if (badCode) throw fail(400,"El código ingresado no coincide.");
  return result;
}

export async function cancelRedemption(db, clientId, redemptionId) {
  const [result] = await db.execute("UPDATE altiva_redemptions SET cancelled_at=UTC_TIMESTAMP(3) WHERE id=? AND client_id=? AND used_at IS NULL AND cancelled_at IS NULL AND expires_at>UTC_TIMESTAMP(3)", [redemptionId,clientId]);
  if (!result.affectedRows) throw fail(409,"La autorización ya venció, fue aplicada o no pertenece a este Pase Altiva.");
  return { cancelled:true,balance:await available(db,clientId) };
}

export async function consumeRedemption(cx, clientId, redemptionId, amountDueARS) {
  if (!redemptionId) return { points: 0, discountARS: 0 };
  const [rows] = await cx.execute("SELECT * FROM altiva_redemptions WHERE id=? AND client_id=? FOR UPDATE", [redemptionId,clientId]);
  const r = rows[0];
  if (!r || r.used_at || r.cancelled_at || new Date(r.expires_at).getTime() <= Date.now()) throw fail(400,"La autorización del canje venció. Volvé a validarla por email.");
  if (Number(r.discount_ars) > amountDueARS) throw fail(400,"El descuento supera el total del pedido. Solicitá un canje menor.");
  // El saldo se verifica contra la base (fila bloqueada) justo antes de descontar: ni el navegador ni
  // una autorización emitida antes pueden gastar puntos que el Pase ya no tiene. Saldo insuficiente → 400.
  const [[client]] = await cx.execute("SELECT points_balance FROM altiva_clients WHERE id=? FOR UPDATE", [clientId]);
  if (!client) throw fail(401,"La sesión del Pase Altiva ya no es válida.");
  if (Number(client.points_balance) < Number(r.points)) throw fail(400,"No tenés puntos suficientes para aplicar este canje. Actualizá tu saldo e intentá otra vez.");
  const [update] = await cx.execute("UPDATE altiva_clients SET points_balance=points_balance-? WHERE id=? AND points_balance>=?", [r.points,clientId,r.points]);
  if (!update.affectedRows) throw fail(400,"No tenés puntos suficientes para aplicar este canje. Actualizá tu saldo e intentá otra vez.");
  await cx.execute("INSERT INTO altiva_points_ledger (client_id,event_key,reason,points_delta) VALUES (?,?,?,-?)", [clientId,`redeem:${r.id}`,"redeem",r.points]);
  await cx.execute("UPDATE altiva_redemptions SET used_at=UTC_TIMESTAMP(3) WHERE id=?", [r.id]);
  return { points: Number(r.points), discountARS: Number(r.discount_ars) };
}

export async function submitVerifiedReview(db, clientId, ticketId, rating, reviewText) {
  const cx = await db.getConnection();
  try {
    await cx.beginTransaction();
    const [orders] = await cx.execute("SELECT status FROM altiva_orders WHERE ticket_id=? AND client_id=? FOR UPDATE", [ticketId,clientId]);
    if (!orders.length || orders[0].status !== "paid") throw fail(403,"La reseña con puntos requiere una compra verificada como pagada.");
    await cx.execute("INSERT INTO altiva_reviews (client_id,ticket_id,rating,review_text) VALUES (?,?,?,?)", [clientId,ticketId,rating,reviewText]);
    await cx.execute("INSERT INTO altiva_points_ledger (client_id,event_key,reason,points_delta) VALUES (?,?,?,100)", [clientId,`review:${ticketId}`,"review"]);
    await cx.execute("UPDATE altiva_clients SET points_balance=points_balance+100 WHERE id=?", [clientId]);
    await cx.commit();
  } catch (e) { await cx.rollback(); if (e.code === "ER_DUP_ENTRY") throw fail(409,"Ya enviaste una reseña válida para este pedido."); throw e; } finally { cx.release(); }
  return { awarded: true, balance: await available(db,clientId) };
}

export function pointsError(status, message) { return fail(status,message); }
