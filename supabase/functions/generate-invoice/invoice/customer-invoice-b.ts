export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * FACTURA B / COMPROBANTE DE COMPRA PARA CONSUMIDOR FINAL (CLIENTE)
 */
export function buildCustomerInvoiceB(order: any, paymentRecord?: any): string {
  const formattedDate = formatDate(order.created_at);
  const subtotalFormatted = formatPrice(order.subtotal || order.total_final);
  const totalFormatted = formatPrice(order.total_final);
  const discountFormatted = order.discount_applied ? formatPrice(order.discount_applied) : "$0";
  const shippingCost = (order.total_final - (order.subtotal || 0) + (order.discount_applied || 0));
  const shippingFormatted = shippingCost > 0 ? formatPrice(shippingCost) : "Gratis";

  const isSucursal = order.whatsapp_message && order.whatsapp_message.includes("Agencia:");
  const agencyCode = isSucursal ? order.whatsapp_message.split("Agencia:")[1]?.trim() : null;

  const itemsRows = (order.products || []).map((p: any) => `
    <tr>
      <td style="padding: 14px 12px; border-bottom: 1px solid #e0d8cf;">
        <strong style="color: #2b332b; font-size: 13px; font-weight: 500;">${p.name}</strong>
        ${p.color || p.size ? `<br/><span style="color: #6b776a; font-size: 11px; font-weight: 300;">Color: ${p.color || "-"} • Talle: ${p.size || "-"}</span>` : ""}
      </td>
      <td style="padding: 14px 12px; border-bottom: 1px solid #e0d8cf; text-align: center; color: #2b332b; font-size: 13px;">
        ${p.quantity}
      </td>
      <td style="padding: 14px 12px; border-bottom: 1px solid #e0d8cf; text-align: right; color: #2b332b; font-size: 13px;">
        ${formatPrice(p.price)}
      </td>
      <td style="padding: 14px 12px; border-bottom: 1px solid #e0d8cf; text-align: right; color: #2b332b; font-size: 13px; font-weight: 600;">
        ${formatPrice(p.price * p.quantity)}
      </td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8"/>
      <title>Factura B Pedido #${order.order_number} - Aldana Vilcabana</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          background: #ffffff;
          color: #2b332b;
          padding: 40px 30px;
          font-size: 13px;
        }
        .invoice-box {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #e0d8cf;
          padding: 40px;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #2b332b;
          padding-bottom: 25px;
          margin-bottom: 30px;
          position: relative;
        }
        .factura-letter {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          border: 2px solid #2b332b;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          background: #fbf9f6;
        }
        .brand-title {
          font-size: 22px;
          font-weight: 300;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #2b332b;
          margin-bottom: 4px;
        }
        .brand-sub {
          font-size: 10px;
          color: #7b887a;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .invoice-tag {
          text-align: right;
        }
        .invoice-tag h2 {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2b332b;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .meta-box h4 {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #7b887a;
          margin-bottom: 8px;
          border-bottom: 1px solid #e0d8cf;
          padding-bottom: 4px;
        }
        .meta-box p {
          line-height: 1.6;
          color: #2b332b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #fbf9f6;
          color: #7b887a;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 600;
          padding: 12px 10px;
          border-top: 1px solid #e0d8cf;
          border-bottom: 1px solid #e0d8cf;
        }
        .totals-wrap {
          margin-left: auto;
          width: 320px;
          background: #fbf9f6;
          border: 1px solid #e0d8cf;
          padding: 20px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          color: #6b776a;
        }
        .totals-row.final {
          border-top: 1px solid #e0d8cf;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 15px;
          font-weight: 700;
          color: #2b332b;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0d8cf;
          text-align: center;
          font-size: 10px;
          color: #7b887a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .no-print-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-bottom: 20px;
          max-width: 800px;
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
          .invoice-box { border: none; padding: 20px; }
          .no-print-bar { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <button class="btn-print" onclick="window.print()">Imprimir / Guardar en PDF</button>
      </div>

      <div class="invoice-box">
        <div class="header">
          <div class="factura-letter">B</div>
          <div>
            <h1 class="brand-title">Aldana Vilcabana</h1>
            <p class="brand-sub">Atelier de Alta Costura & Colecciones</p>
            <p style="font-size: 10px; color: #7b887a; margin-top: 4px;">IVA Responsable Inscripto</p>
          </div>
          <div class="invoice-tag">
            <h2>Factura B (Consumidor Final)</h2>
            <p style="color: #6b776a; font-size: 11px; margin-top: 4px;">Comp. #${order.order_number}</p>
            <p style="color: #6b776a; font-size: 11px;">Fecha de emisión: ${formattedDate}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <h4>Receptor / Cliente</h4>
            <p><strong>${order.customer_first_name || ""} ${order.customer_last_name || ""}</strong></p>
            <p style="color: #6b776a; font-size: 11px;">Condición IVA: Consumidor Final</p>
            ${order.customer_email ? `<p>${order.customer_email}</p>` : ""}
            ${order.customer_phone ? `<p>Tel: ${order.customer_phone}</p>` : ""}
          </div>
          <div class="meta-box">
            <h4>Información de Entrega & Pago</h4>
            ${isSucursal ? `
              <p><strong>Entrega:</strong> Retiro en Sucursal Correo Argentino</p>
              <p style="color: #6b776a; font-size: 11px;">Sucursal ID: ${agencyCode || "-"}</p>
            ` : `
              <p><strong>Dirección:</strong> ${order.address_street || ""} ${order.address_number || ""}${order.address_apartment ? ", Depto " + order.address_apartment : ""}</p>
              <p>${order.city || ""}, ${order.province || ""} ${order.postal_code ? "(CP " + order.postal_code + ")" : ""}</p>
            `}
            <p style="margin-top: 6px;"><strong>Forma de pago:</strong> Mercado Pago (Tarjeta) - Aprobado</p>
            ${paymentRecord?.external_payment_id ? `<p style="color: #7b887a; font-size: 10px;">ID Transacción: ${paymentRecord.external_payment_id}</p>` : ""}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Descripción de Prenda / Producto</th>
              <th style="text-align: center;">Cant.</th>
              <th style="text-align: right;">Precio Unit. (IVA inc.)</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="totals-wrap">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${subtotalFormatted}</span>
          </div>
          ${order.discount_applied ? `
            <div class="totals-row" style="color: #556F52;">
              <span>Descuento (${order.discount_code || "Cupón"})</span>
              <span>-${discountFormatted}</span>
            </div>
          ` : ""}
          <div class="totals-row">
            <span>Envío</span>
            <span>${shippingFormatted}</span>
          </div>
          <div class="totals-row final">
            <span>Total Facturado</span>
            <span>${totalFormatted}</span>
          </div>
        </div>

        <div class="footer">
          <p>Gracias por tu compra en Aldana Vilcabana</p>
          <p style="margin-top: 4px; font-size: 9px;">Documento digital emitido conforme a normativas de facturación comercial.</p>
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
