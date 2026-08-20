function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * HOJA DE DESPACHO, PICKING & FACTURA ADMINISTRATIVA (Para Administradora / Vendedora / Taller)
 */
export function buildAdminPackingSlip(order: any, paymentRecord?: any): string {
  const formattedDate = formatDate(order.created_at);
  const total = order.total_final || 0;
  const subtotal = order.subtotal || total;
  const discount = order.discount_applied || 0;
  const shipping = Math.max(0, total - subtotal + discount);

  const isSucursal = order.whatsapp_message && order.whatsapp_message.includes("Agencia:");
  const agencyCode = isSucursal ? order.whatsapp_message.split("Agencia:")[1]?.trim() : null;

  // Teléfono limpio para link de WhatsApp
  const rawPhone = (order.customer_phone || "").replace(/\D/g, "");
  const waUrl = rawPhone ? `https://wa.me/549${rawPhone}?text=Hola%20${encodeURIComponent(order.customer_first_name || "")},%20te%20escribimos%20desde%20Aldana%20Vilcabana%20por%20tu%20pedido%20%23${order.order_number}` : null;

  const itemsRows = (order.products || []).map((p: any, idx: number) => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e0d8cf; text-align: center;">
        <span style="display: inline-block; width: 18px; height: 18px; border: 2px solid #556F52; border-radius: 3px;"></span>
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e0d8cf;">
        <strong style="color: #2b332b; font-size: 13px;">${p.name}</strong>
        <p style="color: #6b776a; font-size: 11px; margin-top: 2px;">
          Talle: <strong>${p.size || "Único"}</strong> | Color: <strong>${p.color || "Estándar"}</strong>
        </p>
        ${p.id ? `<span style="font-size: 9px; color: #999; text-transform: uppercase;">ID: ${p.id}</span>` : ""}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e0d8cf; text-align: center; font-size: 14px; font-weight: 700; color: #2b332b;">
        ${p.quantity}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e0d8cf; text-align: right; color: #2b332b; font-size: 13px;">
        ${formatPrice(p.price)}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e0d8cf; text-align: right; color: #2b332b; font-size: 13px; font-weight: 600;">
        ${formatPrice(p.price * p.quantity)}
      </td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8"/>
      <title>Orden de Despacho Admin #${order.order_number} - Aldana Vilcabana</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          background: #ffffff;
          color: #2b332b;
          padding: 30px;
          font-size: 12px;
        }
        .admin-box {
          max-width: 850px;
          margin: 0 auto;
          border: 2px solid #556F52;
          padding: 30px;
          background: #ffffff;
        }
        .top-bar {
          background: #556F52;
          color: #ffffff;
          padding: 8px 16px;
          margin: -30px -30px 25px -30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #e0d8cf;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2b332b;
        }
        .grid-info {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }
        .card-info {
          background: #fbf9f6;
          border: 1px solid #e0d8cf;
          padding: 14px;
        }
        .card-info h4 {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #556F52;
          margin-bottom: 8px;
          font-weight: 700;
          border-bottom: 1px solid #e0d8cf;
          padding-bottom: 4px;
        }
        .card-info p {
          line-height: 1.5;
          margin-bottom: 3px;
        }
        .checklist-box {
          background: #f5f1ec;
          border: 1px dashed #b5a99a;
          padding: 16px;
          margin-bottom: 25px;
        }
        .checklist-box h4 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 700;
          color: #2b332b;
          margin-bottom: 10px;
        }
        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .check-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        th {
          background: #f5f1ec;
          color: #2b332b;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          padding: 10px;
          border-top: 1px solid #e0d8cf;
          border-bottom: 1px solid #e0d8cf;
        }
        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .notes-box {
          border: 1px solid #e0d8cf;
          padding: 14px;
          background: #faf8f5;
        }
        .notes-box h4 {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #7b887a;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .totals-admin {
          background: #fbf9f6;
          border: 1px solid #e0d8cf;
          padding: 16px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 12px;
          color: #6b776a;
        }
        .totals-row.final {
          border-top: 2px solid #2b332b;
          padding-top: 8px;
          margin-top: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #2b332b;
        }
        .no-print-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-bottom: 20px;
          max-width: 850px;
          margin-left: auto;
          margin-right: auto;
        }
        .btn-print {
          background: #556F52;
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          font-family: inherit;
        }
        @media print {
          body { padding: 0; }
          .admin-box { border: 1px solid #2b332b; padding: 20px; }
          .top-bar { margin: -20px -20px 20px -20px; }
          .no-print-bar { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <button class="btn-print" onclick="window.print()">Imprimir Hoja de Despacho</button>
      </div>

      <div class="admin-box">
        <div class="top-bar">
          <span>Uso Interno: Administración, Taller & Logística</span>
          <span>Estado: ${order.status.toUpperCase()}</span>
        </div>

        <div class="header">
          <div>
            <h1 class="brand-title">Aldana Vilcabana</h1>
            <p style="font-size: 11px; color: #6b776a; margin-top: 2px;">Hoja de Picking y Despacho de Pedido</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 16px; font-weight: 700; color: #2b332b;">#${order.order_number}</h2>
            <p style="color: #6b776a; font-size: 11px;">Fecha: ${formattedDate}</p>
            <p style="color: #999; font-size: 9px; margin-top: 2px;">ID DB: ${order.id}</p>
          </div>
        </div>

        <div class="grid-info">
          <div class="card-info">
            <h4>1. Cliente & Contacto</h4>
            <p><strong>${order.customer_first_name || ""} ${order.customer_last_name || ""}</strong></p>
            <p>${order.customer_email || "-"}</p>
            <p>Tel: <strong>${order.customer_phone || "-"}</strong></p>
            ${waUrl ? `<p style="margin-top: 6px;"><a href="${waUrl}" target="_blank" style="color: #556F52; font-weight: 600; text-decoration: underline;">Abrir WhatsApp</a></p>` : ""}
          </div>

          <div class="card-info">
            <h4>2. Datos de Envío</h4>
            ${isSucursal ? `
              <p><strong>Retiro en Sucursal Correo Argentino</strong></p>
              <p style="color: #556F52; font-weight: 700; font-size: 13px;">Sucursal ID: ${agencyCode}</p>
            ` : `
              <p><strong>Envío a Domicilio</strong></p>
              <p>${order.address_street || ""} ${order.address_number || ""}${order.address_apartment ? " (Depto " + order.address_apartment + ")" : ""}</p>
              <p>${order.city || ""}, ${order.province || ""} - CP: <strong>${order.postal_code || "-"}</strong></p>
            `}
          </div>

          <div class="card-info">
            <h4>3. Cobro Mercado Pago</h4>
            <p>Estado: <strong style="color: #556F52;">${order.payment_status?.toUpperCase() || "APROBADO"}</strong></p>
            <p>Total: <strong>${formatPrice(total)}</strong></p>
            ${paymentRecord?.external_payment_id ? `<p style="font-size: 10px; color: #777;">ID MP: ${paymentRecord.external_payment_id}</p>` : ""}
          </div>
        </div>

        <div class="checklist-box">
          <h4>Control de Calidad & Despacho (Taller)</h4>
          <div class="checklist-grid">
            <div class="check-item"><span style="display:inline-block;width:14px;height:14px;border:1.5px solid #2b332b;"></span> [ ] Prenda confeccionada y verificada</div>
            <div class="check-item"><span style="display:inline-block;width:14px;height:14px;border:1.5px solid #2b332b;"></span> [ ] Control de costuras, cierres y forrería</div>
            <div class="check-item"><span style="display:inline-block;width:14px;height:14px;border:1.5px solid #2b332b;"></span> [ ] Planchado y packaging exclusivo AV</div>
            <div class="check-item"><span style="display:inline-block;width:14px;height:14px;border:1.5px solid #2b332b;"></span> [ ] Rótulo Correo Argentino pegado</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">Pick</th>
              <th style="text-align: left;">Prenda / Especificaciones de Confección</th>
              <th style="text-align: center; width: 60px;">Cant.</th>
              <th style="text-align: right; width: 110px;">Precio Unit.</th>
              <th style="text-align: right; width: 110px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="bottom-grid">
          <div class="notes-box">
            <h4>Observaciones & Notas</h4>
            <p><strong>Notas del Cliente:</strong> ${order.customer_notes || "Sin observaciones del cliente."}</p>
            <p style="margin-top: 8px;"><strong>Notas de Taller:</strong> ${order.seller_notes || "Sin notas internas."}</p>
          </div>

          <div class="totals-admin">
            <div class="totals-row">
              <span>Subtotal Prendas</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            ${discount > 0 ? `
              <div class="totals-row" style="color: #556F52;">
                <span>Descuento aplicado (${order.discount_code || "Cupón"})</span>
                <span>-${formatPrice(discount)}</span>
              </div>
            ` : ""}
            <div class="totals-row">
              <span>Costo Envío Correo Argentino</span>
              <span>${shipping > 0 ? formatPrice(shipping) : "Gratis"}</span>
            </div>
            <div class="totals-row final">
              <span>Total Liquidado</span>
              <span>${formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;
}
