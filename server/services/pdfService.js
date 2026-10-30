import PDFDocument from "pdfkit";

const ars = (value) => `ARS ${Number(value || 0).toLocaleString("es-AR")}`;
const text = (value, fallback = "—") => String(value ?? "").trim() || fallback;

export function generateTicketPDF(orderData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `Ticket ${orderData.ticketId} | Altiva Essentia`, Author: "Altiva Essentia" } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.once("error", reject);
    doc.once("end", () => resolve(Buffer.concat(chunks)));
    const left = 40, right = 555;
    doc.rect(28, 28, 539, 786).lineWidth(1).strokeColor("#D4AF37").stroke();
    doc.fillColor("#111111").font("Helvetica-Bold").fontSize(22).text("ALTIVA ESSENTIA", left, 48);
    doc.fillColor("#666666").font("Helvetica").fontSize(10).text("Alta Perfumería & Fragancias de Nicho", left, 77);
    doc.fontSize(9).text("Córdoba, Argentina | www.altivaessentia.com", left, 92);
    doc.moveTo(left, 112).lineTo(right, 112).lineWidth(1.3).strokeColor("#D4AF37").stroke();
    const isPaid = orderData.status === "paid";
    doc.fillColor("#111111").font("Helvetica-Bold").fontSize(17).text(`${isPaid ? "COMPROBANTE DE COMPRA" : "RESUMEN DE PEDIDO — PAGO PENDIENTE"} #${orderData.ticketId}`, left, 128, { width: right - left });
    const date = new Date(orderData.createdAt || Date.now()).toLocaleString("es-AR", { timeZone: "America/Argentina/Cordoba", dateStyle: "medium", timeStyle: "short" });
    doc.fillColor("#555555").font("Helvetica").fontSize(9).text(`Fecha y hora: ${date}`, left, 155);
    const buyer = orderData.buyer || {};
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111").text("Datos del cliente", left, 178);
    doc.font("Helvetica").fontSize(9).fillColor("#444444").text(`${text(buyer.firstName)} ${text(buyer.lastName)}`, left, 196);
    doc.text(`Email: ${text(buyer.email)}`, left, 210);
    doc.text(`Teléfono / WhatsApp: ${text(buyer.phone)}`, left, 224);
    doc.text(`Dirección: ${[buyer.address, buyer.city, buyer.province, buyer.zip].filter(Boolean).join(", ") || "—"}`, left, 238, { width: right - left });

    let y = 276;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111111");
    doc.text("Producto / Fragancia (presentación)", left, y, { width: 260 });
    doc.text("Cant.", 310, y, { width: 35, align: "right" });
    doc.text("Unitario", 355, y, { width: 85, align: "right" });
    doc.text("Subtotal", 455, y, { width: 100, align: "right" });
    y += 20;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(.6).strokeColor("#D4AF37").stroke();
    y += 8;
    for (const item of orderData.items || []) {
      const rowHeight = 34;
      doc.font("Helvetica").fontSize(9).fillColor("#222222");
      doc.text(`${text(item.name)} · ${text(item.presentation, item.volumeMl ? `${item.volumeMl} ml` : "Presentación no informada")}`, left, y, { width: 255, height: rowHeight });
      doc.text(String(item.qty), 310, y, { width: 35, align: "right" });
      doc.text(ars(item.price), 355, y, { width: 85, align: "right" });
      doc.text(ars(item.price * item.qty), 455, y, { width: 100, align: "right" });
      y += rowHeight;
      doc.moveTo(left, y).lineTo(right, y).lineWidth(.35).strokeColor("#E0E0E0").stroke();
      y += 7;
      if (y > 625) { doc.addPage({ size: "A4", margin: 40 }); y = 48; }
    }
    y += 8;
    const totalRow = (label, value, color = "#444444", bold = false, size = 10) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color).text(label, 320, y, { width: 125, align: "right" });
      doc.text(value, 455, y, { width: 100, align: "right" });
      y += size + 9;
    };
    totalRow("Subtotal", ars(orderData.subtotalARS));
    if (orderData.transferDiscountARS) totalRow("Descuento transferencia", `− ${ars(orderData.transferDiscountARS)}`, "#26734d");
    if (orderData.pointsDiscountARS) totalRow(`Descuento Pase Altiva (${orderData.pointsRedeemed} pts)`, `− ${ars(orderData.pointsDiscountARS)}`, "#26734d");
    totalRow("Envío", orderData.shippingARS ? ars(orderData.shippingARS) : "GRATIS");
    doc.moveTo(320, y).lineTo(right, y).lineWidth(.8).strokeColor("#D4AF37").stroke();
    y += 10;
    totalRow("TOTAL INFORMADO", ars(orderData.totalARS), "#111111", true, 15);
    doc.moveTo(left, 735).lineTo(right, 735).lineWidth(.7).strokeColor("#D4AF37").stroke();
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111").text("¡Gracias por elegir Altiva Essentia!", left, 748, { align: "center", width: right - left });
    doc.font("Helvetica").fontSize(8).fillColor("#555555").text(`Soporte prioritario: WhatsApp +54 9 351 652-1368 · Ticket #${orderData.ticketId}`, left, 765, { align: "center", width: right - left });
    doc.end();
  });
}
