import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VERIFY_TOKEN = Deno.env.get("VERIFY_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_ID");

const supabaseHeaders = {
  "apikey": SUPABASE_SERVICE_KEY,
  "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json"
};

serve(async (req) => {
  const { method, url } = req;

  if (method === "GET") {
    const params = new URL(url).searchParams;
    const mode = params.get("hub.mode");
    const token = params.get("hub.verify_token");
    const challenge = params.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    return new Response("Verificación fallida", { status: 403 });
  }

  if (method === "POST") {
    try {
      const body = await req.json();
      const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
      
      if (!messages || messages.length === 0) {
        return new Response("EVENT_RECEIVED", { status: 200 });
      }

      const msg = messages[0];
      const messageId = msg.id;
      const text = msg.text?.body?.trim().toUpperCase();
      const from = msg.from;

      // 🔍 Validar comandos
      if (!["[ACEPTADO]", "[RECHAZADO]", "[DELIVERY]"].includes(text)) {
        return new Response("EVENT_RECEIVED", { status: 200 });
      }

      // 🚫 Prevenir duplicados
      if (!globalThis.processedMessages) {
        globalThis.processedMessages = new Map();
      }
      
      const cacheKey = `${from}_${messageId}`;
      if (globalThis.processedMessages.has(cacheKey)) {
        return new Response("EVENT_RECEIVED", { status: 200 });
      }
      globalThis.processedMessages.set(cacheKey, Date.now());

      // 🚦 Rate limiting
      if (!checkRateLimit(from)) {
        console.log(`Rate limit exceeded for ${from}`);
        return new Response("EVENT_RECEIVED", { status: 200 });
      }

      // 🔄 Procesar comandos
      await processWhatsAppCommand(text, from, messageId);

      return new Response("EVENT_RECEIVED", { status: 200 });
    } catch (err) {
      console.error("Error processing webhook:", err);
      return new Response("EVENT_RECEIVED", { status: 200 });
    }
  }

  return new Response("Método no permitido", { status: 405 });
});

// 🚦 Rate limiting para prevenir spam
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const key = phone;
  const limit = rateLimiter.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + 60000 }); // 1 minuto
    return true;
  }
  
  if (limit.count >= 5) { // Máximo 5 comandos por minuto
    return false;
  }
  
  limit.count++;
  return true;
}

async function processWhatsAppCommand(command: string, from: string, wamid: string) {
  try {
    let newStatus: string;
    let responseMessage: string;

    switch (command) {
      case "[ACEPTADO]":
        newStatus = "in_transit";
        responseMessage = "✅ Tu pedido ha sido ACEPTADO y está siendo preparado para el envío.";
        await updateOrderStatus(from, newStatus, wamid, "Pedido aceptado por vendedor");
        break;

      case "[RECHAZADO]":
        newStatus = "rejected";
        responseMessage = "❌ Tu pedido ha sido RECHAZADO. Contacta al vendedor para más información.";
        await updateOrderStatus(from, newStatus, wamid, "Pedido rechazado por vendedor");
        break;

      case "[DELIVERY]":
        responseMessage = "🚚 Tu pedido está EN CAMINO. Recibirás confirmación cuando sea entregado.";
        await handleDeliveryCommand(from, wamid);
        break;
    }

    // 📱 Enviar respuesta por WhatsApp
    await sendWhatsAppMessage(from, responseMessage);

  } catch (error) {
    console.error("Error processing command:", error);
  }
}

async function updateOrderStatus(customerPhone: string, newStatus: string, wamid: string, comment: string) {
  try {
    // 🔍 Buscar orden más reciente del cliente
    const ordersResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?customer_phone=eq.${customerPhone}&order=created_at.desc&limit=1`,
      { method: "GET", headers: supabaseHeaders }
    );

    const orders = await ordersResponse.json();
    if (!orders || orders.length === 0) {
      console.log("No se encontró orden para:", customerPhone);
      return;
    }

    const order = orders[0];
    
    // ✅ Actualizar estado de la orden
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify({
        status: newStatus,
        wamid: wamid,
        updated_at: new Date().toISOString(),
        ...(newStatus === "in_transit" && { confirmed_at: new Date().toISOString() })
      })
    });

    console.log(`✅ Orden ${order.order_number} actualizada a: ${newStatus}`);

  } catch (error) {
    console.error("Error updating order status:", error);
  }
}

async function handleDeliveryCommand(customerPhone: string, wamid: string) {
  try {
    // 🔍 Buscar orden en tránsito
    const ordersResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?customer_phone=eq.${customerPhone}&status=eq.in_transit&order=created_at.desc&limit=1`,
      { method: "GET", headers: supabaseHeaders }
    );

    const orders = await ordersResponse.json();
    if (!orders || orders.length === 0) {
      console.log("No se encontró orden en tránsito para:", customerPhone);
      return;
    }

    const order = orders[0];
    const deliveryTime = 4 * 60 * 60 * 1000; // 4 horas en milliseconds
    const deliveryDate = new Date(Date.now() + deliveryTime);

    // 📅 Actualizar fecha estimada de entrega
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify({
        estimated_delivery_at: deliveryDate.toISOString(),
        wamid: wamid
      })
    });

    // ⏰ Programar completado automático
    setTimeout(async () => {
      await completeDelivery(order.id, customerPhone);
    }, deliveryTime);

    console.log(`🚚 Delivery programado para orden ${order.order_number} en 4 horas`);

  } catch (error) {
    console.error("Error handling delivery command:", error);
  }
}

async function completeDelivery(orderId: string, customerPhone: string) {
  try {
    // ✅ Marcar como completado
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify({
        status: "completed",
        delivered_at: new Date().toISOString()
      })
    });

    // 📱 Notificar al cliente
    await sendWhatsAppMessage(
      customerPhone, 
      "🎉 ¡Tu pedido ha sido ENTREGADO exitosamente! Gracias por tu compra."
    );

    console.log(`✅ Orden ${orderId} marcada como completada automáticamente`);

  } catch (error) {
    console.error("Error completing delivery:", error);
  }
}

async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return;

  try {
    await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        text: { body: message }
      })
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}
