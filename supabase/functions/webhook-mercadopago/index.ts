import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceRole);

  // Priorizar el token de la base de datos si existe, de lo contrario usar Deno.env
  let mpAccessToken = null;
  try {
    const { data: dbToken } = await supabase
      .from("system_tokens")
      .select("value")
      .eq("key", "mp_access_token")
      .maybeSingle();
    if (dbToken && dbToken.value) {
      mpAccessToken = dbToken.value;
      console.log("🗝️ Usando MP_ACCESS_TOKEN de la base de datos. Prefijo:", mpAccessToken.substring(0, 15));
    }
  } catch (dbErr) {
    console.error("Error al buscar token en DB:", dbErr);
  }

  if (!mpAccessToken) {
    mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN") || null;
    if (mpAccessToken) {
      console.log("🗝️ Usando MP_ACCESS_TOKEN de Deno.env. Prefijo:", mpAccessToken.substring(0, 15));
    }
  }
  const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET"); // Secreto para validación de firmas de MP

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Solo se acepta POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payloadText = await req.text();
    const body = JSON.parse(payloadText);
    console.log("📥 Webhook recibido:", JSON.stringify(body, null, 2));

    // 1. Validar Firma del Webhook (Firma X-Signature de Mercado Pago)
    // Nota: Para simplificar y evitar fallos si no está configurada,
    // validamos firma solo si MP_WEBHOOK_SECRET está seteado.
    const signatureHeader = req.headers.get("x-signature") || req.headers.get("x-mp-signature");
    if (webhookSecret && !signatureHeader) {
      console.error("❌ Firma faltante en el webhook de Mercado Pago");
      return new Response(JSON.stringify({ error: "Firma faltante" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Registrar log del webhook recibido
    const { data: logEntry, error: logErr } = await supabase
      .from("webhook_logs")
      .insert({
        provider: "mercadopago",
        external_id: String(body.data?.id || body.id || ""),
        action: body.action || body.type || "",
        payload: body,
        status: "pending",
      })
      .select()
      .single();

    if (logErr) console.error("Error al registrar log de webhook:", logErr);

    // 2. Procesar la notificación de pago
    // Mercado Pago envía notificaciones con type: 'payment' o action: 'payment.created' / 'payment.updated'
    const isPaymentEvent = body.type === "payment" || (body.action && body.action.startsWith("payment."));
    const paymentId = body.data?.id || (body.type === "payment" ? body.id : null);

    if (isPaymentEvent && paymentId && mpAccessToken) {
      console.log(`🔍 Consultando detalles del pago ${paymentId} en Mercado Pago...`);

      // Consultar la API de Mercado Pago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!mpRes.ok) {
        const errText = await mpRes.text();
        throw new Error(`Error al consultar Mercado Pago: ${mpRes.statusText}. Detalle: ${errText}`);
      }

      const mpPayment = await mpRes.json();
      const orderId = mpPayment.external_reference || mpPayment.metadata?.order_id;

      if (!orderId) {
        console.warn(`⚠️ Pago ${paymentId} no tiene external_reference (orderId) asociado.`);
        if (logEntry) {
          await supabase.from("webhook_logs").update({
            status: "error",
            error_message: "Pago no tiene external_reference",
          }).eq("id", logEntry.id);
        }
        return new Response(JSON.stringify({ message: "Ignorado - Sin orden asociada" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`📦 Pago ${paymentId} asociado a la orden ${orderId}. Estado MP: ${mpPayment.status}`);

      // Consultar estado actual de la orden en DB
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!order) {
        throw new Error(`Orden ${orderId} no encontrada en base de datos`);
      }

      // Upsert/Insert en la tabla de pagos
      await supabase.from("payments").upsert({
        order_id: orderId,
        provider: "mercadopago",
        external_payment_id: String(paymentId),
        status: mpPayment.status,
        amount: Number(mpPayment.transaction_amount),
        payment_method: mpPayment.payment_method_id,
        installments: mpPayment.installments,
        metadata: mpPayment,
      }, {
        onConflict: "external_payment_id",
      });

      // Si el pago es aprobado y la orden está pendiente, actualizamos stock y disparamos envíos/emails
      if (mpPayment.status === "approved" && order.status === "pending") {
        console.log(`✅ Aprobando orden ${orderId} y descontando stock...`);

        // Actualizar orden
        const { error: updErr } = await supabase
          .from("orders")
          .update({
            status: "preparing",
            payment_status: "approved",
            payment_id: String(paymentId),
            payment_method: "mercadopago",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (updErr) throw updErr;

        // Registrar en historial
        await supabase.from("orders_status_history").insert({
          order_id: orderId,
          old_status: "pending",
          new_status: "preparing",
          comment: `Pago aprobado notificado por Webhook. ID MP: ${paymentId}`,
          changed_by: "webhook_mercadopago",
        });

        // Descontar stock
        const { error: rpcErr } = await supabase.rpc("deduct_stock_for_order", { p_order_id: orderId });
        if (rpcErr) {
          console.error("❌ Error al descontar stock por webhook:", rpcErr);
        }

        // Crear envío en Correo Argentino
        fetch(`${supabaseUrl}/functions/v1/correo-argentino/import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceRole}`,
            "apikey": supabaseServiceRole,
          },
          body: JSON.stringify({ orderId }),
        }).catch((e) => console.error("Error al disparar import de envío:", e));

        // Enviar email transaccional con Resend
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          try {
            const productsListHtml = order.products && Array.isArray(order.products)
              ? order.products.map((p: any) => `<li>${p.name} (Talla: ${p.size || "-"}, Color: ${p.color || "-"}) x${p.quantity} - $${p.price}</li>`).join("")
              : "";

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Aldy Ecommerce <ventas@aldyecommerce.com>",
                to: order.customer_email,
                subject: `¡Gracias por tu compra! Orden #${order.order_number}`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>¡Hola ${order.customer_first_name}!</h2>
                    <p>Tu pago ha sido aprobado correctamente. Estamos preparando tu pedido.</p>
                    <h3>Detalle del Pedido #${order.order_number}</h3>
                    <ul>
                      ${productsListHtml}
                    </ul>
                    <p><strong>Total pagado:</strong> $${order.total_final}</p>
                    <hr/>
                    <p>Puedes seguir el estado de tu pedido en tiempo real ingresando a tu cuenta en nuestro sitio web.</p>
                    <p>¡Muchas gracias por elegirnos!</p>
                  </div>
                `,
              }),
            });
            console.log("📧 Email transaccional enviado.");
          } catch (e) {
            console.error("Error al enviar email:", e);
          }
        }
      } else if ((mpPayment.status === "rejected" || mpPayment.status === "cancelled") && order.status === "pending") {
        // Actualizar orden a rechazada
        await supabase
          .from("orders")
          .update({
            status: "rejected",
            payment_status: mpPayment.status,
            payment_id: String(paymentId),
            payment_method: "mercadopago",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        await supabase.from("orders_status_history").insert({
          order_id: orderId,
          old_status: "pending",
          new_status: "rejected",
          comment: `Pago rechazado/cancelado notificado por Webhook. ID MP: ${paymentId}`,
          changed_by: "webhook_mercadopago",
        });
      }

      // Marcar log como procesado con éxito
      if (logEntry) {
        await supabase.from("webhook_logs").update({
          status: "processed",
        }).eq("id", logEntry.id);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Webhook procesado correctamente" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Error procesando webhook:", error);
    return new Response(JSON.stringify({ error: error.message || "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
