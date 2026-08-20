/**
 * Plantilla HTML y CSS de Aldana Vilcabana para Newsletters y Correos de Bienvenida.
 * Puedes personalizar los estilos CSS y la estructura HTML aquí.
 */
export function renderNewsletterHtml(params: {
  subject: string;
  title: string;
  message: string;
  discountCode?: string;
  discountPercent?: string;
  customHtml?: string;
}): string {
  if (params.customHtml) {
    return params.customHtml;
  }

  const couponSection = params.discountCode
    ? `
    <div class="coupon-box">
      <div class="coupon-title">Cupón Exclusivo</div>
      <div class="coupon-code">${params.discountCode}</div>
      ${
        params.discountPercent
          ? `<div class="coupon-desc">Aplica <strong>${params.discountPercent} de descuento</strong> en tu compra.</div>`
          : ""
      }
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <style>
    /* ==========================================================================
       ESTILOS DEL NEWSLETTER - ALDANA VILCABANA
       Puedes modificar los colores, fuentes y espaciados aquí libremente.
       ========================================================================== */
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #fbf9f6;
      margin: 0;
      padding: 0;
      color: #404b40;
      -webkit-font-smoothing: antialiased;
    }

    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border: 1px solid #e8e0d8;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }

    /* ENCABEZADO */
    .header {
      background-color: #404b40;
      padding: 35px 20px;
      text-align: center;
    }

    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      font-weight: 300;
    }

    /* CONTENIDO PRINCIPAL */
    .content {
      padding: 45px 35px;
      text-align: center;
    }

    .title {
      font-size: 22px;
      font-weight: 400;
      color: #404b40;
      margin: 0 0 18px 0;
      letter-spacing: 0.05em;
      line-height: 1.4;
    }

    .text {
      font-size: 14px;
      line-height: 1.85;
      color: #5a665a;
      margin: 0 0 28px 0;
      white-space: pre-line;
    }

    /* SECCIÓN DE CUPÓN DE DESCUENTO */
    .coupon-box {
      background-color: #f5f1ec;
      border: 2px dashed #b8a693;
      padding: 24px 20px;
      margin: 32px 0;
    }

    .coupon-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.20em;
      color: #8c7866;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .coupon-code {
      font-size: 30px;
      font-weight: 700;
      color: #404b40;
      letter-spacing: 0.18em;
    }

    .coupon-desc {
      font-size: 13px;
      color: #6b776b;
      margin-top: 8px;
    }

    /* BOTÓN PRINCIPAL */
    .btn {
      display: inline-block;
      padding: 15px 40px;
      background-color: #6b8f6b;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      font-weight: 500;
      margin-top: 10px;
    }

    /* PIE DE PÁGINA */
    .footer {
      background-color: #f5f1ec;
      padding: 28px 24px;
      text-align: center;
      font-size: 11px;
      color: #8f9b8f;
      line-height: 1.7;
      border-top: 1px solid #e8e0d8;
    }

    .footer a {
      color: #6b8f6b;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- ENCABEZADO CON BRANDING -->
    <div class="header">
      <h1>ALDANA VILCABANA</h1>
    </div>

    <!-- CONTENIDO -->
    <div class="content">
      <h2 class="title">${params.title}</h2>
      <p class="text">${params.message}</p>
      
      ${couponSection}

      <div>
        <a href="https://aldanavilcabana.com.ar" class="btn">Visitar Tienda</a>
      </div>
    </div>

    <!-- PIE DE PÁGINA -->
    <div class="footer">
      <p>© ${new Date().getFullYear()} Aldana Vilcabana. Todos los derechos reservados.</p>
      <p>Has recibido este correo porque estás suscrito a nuestro newsletter en <a href="https://aldanavilcabana.com.ar">aldanavilcabana.com.ar</a>.</p>
      <p>Puedes gestionar o cancelar tu suscripción en cualquier momento desde tu panel de usuario.</p>
    </div>
  </div>
</body>
</html>`;
}
