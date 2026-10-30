import { randomUUID } from "node:crypto";
import { CATALOG, HOUSES } from "../../src/data.js";
import { consumeRedemption } from "./loyaltyService.js";

export const FREE_SHIPPING = 150000;
export const SHIPPING_ARS = 7500;
const byProductId = new Map(CATALOG.map((p) => [p.id,p]));
const safeString = (v,max=180) => typeof v === "string" ? v.trim().slice(0,max) : "";

// Ticket no adivinable: se toma el inicio de un UUIDv4 (CSPRNG) con la forma ALT-8F92A4B1-94A2
// (48 bits aleatorios, sin fecha ni contador). Reemplaza al formato anterior basado en Date.now().
export const makeTicketId = () => { const [head, tail] = randomUUID().split("-"); return `ALT-${head}-${tail}`.toUpperCase(); };
// Se siguen aceptando los tickets ya emitidos con el formato anterior (ALT-<base36>-<6 hex>) para que
// su descarga y reseñas no se rompan. Devuelve el ID normalizado en mayúsculas o null si no es válido.
const TICKET_ID_RE = /^ALT-(?:[0-9A-F]{8}-[0-9A-F]{4}|[0-9A-Z]{6,12}-[0-9A-F]{6})$/;
export const normalizeTicketId = (value) => { const id = typeof value === "string" ? value.trim().toUpperCase() : ""; return TICKET_ID_RE.test(id) ? id : null; };

export function validateBuyer(raw={}) {
  const buyer = {
    firstName:safeString(raw.firstName,80), lastName:safeString(raw.lastName,80), email:safeString(raw.email,254).toLowerCase(),
    phone:safeString(raw.phone,40), address:safeString(raw.address,180), city:safeString(raw.city,100), province:safeString(raw.province,100), zip:safeString(raw.zip,24),
  };
  if (!buyer.firstName || !buyer.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email) || !buyer.phone || !buyer.address || !buyer.city || !buyer.province) {
    const e = new Error("Completá nombre, email, teléfono y dirección de envío con datos válidos."); e.status=400; throw e;
  }
  return buyer;
}

export async function createOrder(db,clientId,input) {
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 20) { const e=new Error("El carrito no contiene una cantidad válida de productos.");e.status=400;throw e; }
  if (!["card","transfer"].includes(input.paymentMethod)) { const e=new Error("Seleccioná un medio de pago.");e.status=400;throw e; }
  const buyer=validateBuyer(input.buyer);
  const items=[];
  for (const line of input.items) {
    const product=byProductId.get(line?.id);
    const qty=Number(line?.qty);
    if (!product || !Number.isFinite(product.price) || product.price<=0 || !Number.isInteger(qty) || qty<1 || qty>10) { const e=new Error("El carrito contiene un producto sin precio confirmado o una cantidad no válida. Actualizá el carrito e intentá otra vez.");e.status=400;throw e; }
    items.push({id:product.id,name:product.name,brand:HOUSES[product.brand]?.name || "Altiva Essentia",presentation:product.presentation || "Presentación no informada",volumeMl:product.volumeMl,qty,price:product.price});
  }
  const subtotalARS=items.reduce((sum,item)=>sum+item.price*item.qty,0);
  const shippingARS=subtotalARS>=FREE_SHIPPING?0:SHIPPING_ARS;
  const transferDiscountARS=input.paymentMethod==="transfer"?Math.round(subtotalARS*.05):0;
  const beforePoints=Math.max(0,subtotalARS+shippingARS-transferDiscountARS);
  const status="pending_payment";
  // Los puntos y el descuento NUNCA se leen del body: solo se recibe el id de una autorización (redemptionId)
  // que consumeRedemption valida contra la base (dueño, vigencia, uso único y saldo real del Pase).
  // Si el ticket generado colisionara con uno existente (PK), se reintenta con otro id; la transacción
  // anterior ya fue revertida, por lo que ningún punto se descuenta dos veces.
  for (let attempt=0; attempt<3; attempt+=1) {
    const ticketId=makeTicketId();
    const cx=await db.getConnection();
    try {
      await cx.beginTransaction();
      const points=input.redemptionId ? await consumeRedemption(cx,clientId,String(input.redemptionId),beforePoints) : {points:0,discountARS:0};
      const totalARS=beforePoints-points.discountARS;
      const [res]=await cx.execute(
        "INSERT INTO altiva_orders (ticket_id,client_id,status,payment_method,buyer_json,items_json,subtotal_ars,shipping_ars,transfer_discount_ars,points_discount_ars,points_redeemed,total_ars) VALUES (?,?,? ,?,?,?,?,?,?,?,?,?)",
        [ticketId,clientId,status,input.paymentMethod,JSON.stringify(buyer),JSON.stringify(items),subtotalARS,shippingARS,transferDiscountARS,points.discountARS,points.points,totalARS],
      );
      if(!res.affectedRows) throw new Error("No se pudo guardar el pedido.");
      await cx.commit();
      return {ticketId,clientId,status,paymentMethod:input.paymentMethod,buyer,items,subtotalARS,shippingARS,transferDiscountARS,pointsDiscountARS:points.discountARS,pointsRedeemed:points.points,totalARS,createdAt:new Date().toISOString()};
    } catch(e) {
      await cx.rollback();
      if (e.code==="ER_DUP_ENTRY" && String(e.sqlMessage||"").includes("altiva_orders") && attempt<2) continue;
      throw e;
    } finally { cx.release(); }
  }
}

export async function getOrder(db,clientId,ticketId) {
  const [rows]=await db.execute("SELECT * FROM altiva_orders WHERE ticket_id=? AND client_id=? LIMIT 1",[ticketId,clientId]);
  if(!rows.length)return null;
  const r=rows[0];
  const parse=(v)=>typeof v==="string"?JSON.parse(v):v;
  return {ticketId:r.ticket_id,clientId:r.client_id,status:r.status,paymentMethod:r.payment_method,buyer:parse(r.buyer_json),items:parse(r.items_json),subtotalARS:Number(r.subtotal_ars),shippingARS:Number(r.shipping_ars),transferDiscountARS:Number(r.transfer_discount_ars),pointsDiscountARS:Number(r.points_discount_ars),pointsRedeemed:Number(r.points_redeemed),totalARS:Number(r.total_ars),createdAt:r.created_at};
}

export async function markEmailSent(db,ticketId){await db.execute("UPDATE altiva_orders SET email_sent_at=UTC_TIMESTAMP(3) WHERE ticket_id=?",[ticketId]);}
