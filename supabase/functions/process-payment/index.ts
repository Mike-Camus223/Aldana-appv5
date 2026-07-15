import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

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

  const isMockMode = !mpAccessToken;

  try {
    const body = await req.json();
    const { orderId, token, paymentMethodId, installments, payerEmail } = body;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Obtener detalles de la orden desde la base de datos
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Orden no encontrada en base de datos" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transactionAmount = Number(order.total_final);

    // 2. Procesar el pago
    let mpPayment: any = {};
    if (isMockMode || token === "mock_token") {
      // Modo Mock si no hay clave de Mercado Pago o si se solicita una simulación
      console.log("⚠️ Modo Mock activado para Mercado Pago");
      mpPayment = {
        id: `mock_mp_${Date.now()}`,
        status: "approved",
        status_detail: "accredited",
        payment_method_id: paymentMethodId || "visa",
        payment_type_id: "credit_card",
        installments: installments || 1,
        transaction_details: {
          total_paid_amount: transactionAmount,
          installment_amount: transactionAmount / (installments || 1),
        },
      };
    } else {
      const finalPayerEmail = payerEmail || order.customer_email || "comprador_prueba@test.com";
      console.log("🧪 Usando email del comprador:", finalPayerEmail);
      console.log("🪙 Usando token de tarjeta recibido:", token);

      // Clave de idempotencia ÚNICA por intento (orderId + timestamp) para evitar
      // que MP devuelva un resultado cacheado de un intento anterior fallido.
      const idempotencyKey = `${orderId}_${Date.now()}`;

      // Checkout API de Mercado Pago
      console.log("💳 Llamando a Mercado Pago API con token prefijo:", mpAccessToken.substring(0, 15));
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          token,
          transaction_amount: transactionAmount,
          installments: Number(installments) || 1,
          payment_method_id: paymentMethodId,
          description: `Pedido #${order.order_number || orderId}`,
          payer: {
            email: finalPayerEmail,
          },
          additional_info: {
            items: order.products && Array.isArray(order.products) 
              ? order.products.map((p: any) => ({
                  id: String(p.product_id || p.id || "item"),
                  title: p.name || "Producto",
                  quantity: p.quantity || 1,
                  unit_price: Number(p.price) || transactionAmount,
                }))
              : [{
                  id: "item_1",
                  title: "Compra en tienda",
                  quantity: 1,
                  unit_price: transactionAmount,
                }],
          },
          external_reference: orderId,
          metadata: {
            order_id: orderId,
          },
        }),
      });

      mpPayment = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("❌ Error de Mercado Pago:", mpPayment);
        return new Response(JSON.stringify({ error: mpPayment.message || "Error al procesar el pago en Mercado Pago" }), {
          status: mpResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. Registrar el pago en la tabla de pagos
    await supabase.from("payments").insert({
      order_id: orderId,
      provider: "mercadopago",
      external_payment_id: String(mpPayment.id),
      status: mpPayment.status,
      amount: transactionAmount,
      payment_method: mpPayment.payment_method_id,
      installments: mpPayment.installments,
      metadata: mpPayment,
    });

    // 4. Actualizar estado de la orden según el estado del pago
    const orderStatus = mpPayment.status === "approved" ? "preparing" : "pending";
    
    // Si fue rechazado o cancelado, actualizamos a rejected
    const finalOrderStatus = (mpPayment.status === "rejected" || mpPayment.status === "cancelled") 
      ? "rejected" 
      : orderStatus;

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: finalOrderStatus,
        payment_status: mpPayment.status,
        payment_id: String(mpPayment.id),
        payment_method: "mercadopago",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    // 5. Registrar en el historial de estados
    await supabase.from("orders_status_history").insert({
      order_id: orderId,
      old_status: order.status,
      new_status: finalOrderStatus,
      comment: `Pago de Mercado Pago procesado: ${mpPayment.status} (${mpPayment.status_detail || ""})`,
      changed_by: "system_payment_function",
    });

    // 6. Lógica post-pago aprobado: stock + envíos + emails
    if (mpPayment.status === "approved") {
      // A. Descontar stock atómicamente llamando a la función RPC
      const { error: rpcErr } = await supabase.rpc("deduct_stock_for_order", { p_order_id: orderId });
      if (rpcErr) {
        console.error("❌ Error al descontar stock atómico:", rpcErr);
        // Si el stock falla, registramos el error pero no bloqueamos la respuesta al cliente
      }

      // B. Disparar importación en Correo Argentino
      fetch(`${supabaseUrl}/functions/v1/correo-argentino/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceRole}`,
          "apikey": supabaseServiceRole,
        },
        body: JSON.stringify({ orderId }),
      }).catch((e) => console.error("Error al disparar import de envío:", e));

      // C. Enviar email transaccional con Resend
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
                  <p><strong>Subtotal:</strong> $${order.subtotal}</p>
                  ${order.discount_applied ? `<p><strong>Descuento aplicado:</strong> -$${order.discount_applied}</p>` : ""}
                  <p><strong>Total pagado:</strong> $${order.total_final}</p>
                  <hr/>
                  <p>Puedes seguir el estado de tu pedido en tiempo real ingresando a tu cuenta en nuestro sitio web.</p>
                  <p>¡Muchas gracias por elegirnos!</p>
                </div>
              `,
            }),
          });
          console.log("📧 Email transaccional enviado con éxito");
        } catch (emailErr) {
          console.error("❌ Error al enviar email con Resend:", emailErr);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId: mpPayment.id,
      status: mpPayment.status,
      statusDetail: mpPayment.status_detail,
      orderStatus: finalOrderStatus,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Error en process-payment:", error);
    return new Response(JSON.stringify({ error: error.message || "Error interno al procesar el pago" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
