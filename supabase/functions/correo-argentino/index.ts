import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req: Request) => {
  // Manejo de CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceRole);

  // Obtener variables de configuración de MiCorreo
  const user = Deno.env.get("MICORREO_USER");
  const pass = Deno.env.get("MICORREO_PASS");
  const customerId = Deno.env.get("MICORREO_CUSTOMER_ID") || "MOCK_CUSTOMER_123";
  const originZip = Deno.env.get("MICORREO_ORIGIN_ZIP") || "1425"; // Palermo, CABA por defecto
  const isMockMode = !user || !pass;

  const apiBase = Deno.env.get("MICORREO_ENV") === "prod"
    ? "https://api.correoargentino.com.ar/micorreo/v1"
    : "https://apitest.correoargentino.com.ar/micorreo/v1";

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // 1. OBTENER TOKEN DE AUTENTICACIÓN (Función interna)
    const getAuthToken = async (): Promise<string> => {
      if (isMockMode) return "MOCK_JWT_TOKEN";

      // Intentar obtener token de la caché en base de datos
      const { data: cached } = await supabase
        .from("system_tokens")
        .select("*")
        .eq("key", "micorreo_token")
        .single();

      if (cached && new Date(cached.expires_at) > new Date()) {
        return cached.value;
      }

      // Si no hay token o expiró, solicitar uno nuevo
      const credentials = btoa(`${user}:${pass}`);
      const response = await fetch(`${apiBase}/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Autenticación fallida con MiCorreo: ${response.statusText}`);
      }

      const resData = await response.json();
      const token = resData.token;
      
      // Calcular expiración (normalmente devuelven expires o expires_in)
      let expiresAt = new Date(Date.now() + 3500 * 1000); // Fallback: 58 minutos
      if (resData.expires) {
        expiresAt = new Date(resData.expires);
      } else if (resData.expires_in) {
        expiresAt = new Date(Date.now() + Number(resData.expires_in) * 1000);
      }

      // Guardar en caché
      await supabase
        .from("system_tokens")
        .upsert({
          key: "micorreo_token",
          value: token,
          expires_at: expiresAt.toISOString(),
        });

      return token;
    };

    // --- EN RUTAS ---

    // COTIZACIÓN DE ENVÍO (POST /rates)
    if (req.method === "POST" && path.endsWith("/rates")) {
      const body = await req.json();
      const { postalCodeDestination, deliveredType, items } = body;

      if (!postalCodeDestination) {
        return new Response(JSON.stringify({ error: "postalCodeDestination es requerido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calcular dimensiones de la orden
      let totalWeight = 0;
      let maxHeight = 0;
      let maxWidth = 0;
      let maxLength = 0;

      if (items && Array.isArray(items) && items.length > 0) {
        // Consultar productos de la DB
        const productIds = items.map((i: any) => i.id);
        const { data: dbProducts } = await supabase
          .from("products")
          .select("id, weight, height, width, length")
          .in("id", productIds);

        const productsMap = new Map(dbProducts?.map((p: any) => [p.id, p]));

        for (const item of items) {
          const prod = productsMap.get(item.id) || { weight: 500, height: 10, width: 10, length: 10 };
          const qty = Number(item.quantity) || 1;

          totalWeight += (prod.weight || 500) * qty;
          maxHeight = Math.max(maxHeight, prod.height || 10);
          maxWidth = Math.max(maxWidth, prod.width || 10);
          maxLength = Math.max(maxLength, prod.length || 10);
        }
      } else {
        // Valores por defecto
        totalWeight = 500;
        maxHeight = 10;
        maxWidth = 10;
        maxLength = 10;
      }

      // Restricciones de MiCorreo
      totalWeight = Math.min(Math.max(totalWeight, 1), 25000);
      maxHeight = Math.min(maxHeight, 150);
      maxWidth = Math.min(maxWidth, 150);
      maxLength = Math.min(maxLength, 150);

      if (isMockMode) {
        // Retornar tarifas mock
        const mockRates = [
          {
            deliveryType: "D",
            name: "Envío a domicilio (Correo Argentino)",
            price: 3500,
            deliveryTimeMin: 3,
            deliveryTimeMax: 5,
          },
          {
            deliveryType: "S",
            name: "Retiro en Sucursal (Correo Argentino)",
            price: 2200,
            deliveryTimeMin: 4,
            deliveryTimeMax: 6,
          }
        ].filter(r => !deliveredType || r.deliveryType === deliveredType);

        return new Response(JSON.stringify({ rates: mockRates, mock: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = await getAuthToken();
      const reqBody = {
        customerId,
        postalCodeOrigin: originZip,
        postalCodeDestination,
        deliveredType,
        dimensions: {
          weight: totalWeight,
          height: maxHeight,
          width: maxWidth,
          length: maxLength,
        },
      };

      const response = await fetch(`${apiBase}/rates`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: errorData.message || "Error al cotizar tarifa" }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // OBTENER SUCURSALES (GET /agencies)
    if (req.method === "GET" && path.endsWith("/agencies")) {
      const provinceCode = url.searchParams.get("provinceCode") || "C";

      if (isMockMode) {
        const mockAgencies = [
          { code: "AG_PALERMO", name: "Sucursal Palermo", streetName: "Av. Santa Fe", streetNumber: "3456", city: "CABA", provinceCode: "C", hours: "Lunes a Viernes 09:00 a 18:00" },
          { code: "AG_CENTRO", name: "Sucursal Centro", streetName: "Av. Corrientes", streetNumber: "1234", city: "CABA", provinceCode: "C", hours: "Lunes a Viernes 09:00 a 18:00" },
          { code: "AG_LP", name: "Sucursal La Plata", streetName: "Calle 7", streetNumber: "456", city: "La Plata", provinceCode: "B", hours: "Lunes a Viernes 08:30 a 17:30" },
          { code: "AG_SI", name: "Sucursal San Isidro", streetName: "Belgrano", streetNumber: "123", city: "San Isidro", provinceCode: "B", hours: "Lunes a Viernes 09:00 a 18:00" }
        ].filter(a => a.provinceCode === provinceCode);

        return new Response(JSON.stringify({ agencies: mockAgencies, mock: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = await getAuthToken();
      const response = await fetch(`${apiBase}/agencies?customerId=${customerId}&provinceCode=${provinceCode}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: errorData.message || "Error al obtener sucursales" }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // IMPORTAR ENVÍO (POST /import) - Rutas del servidor
    if (req.method === "POST" && path.endsWith("/import")) {
      const body = await req.json();
      const { orderId } = body;

      if (!orderId) {
        return new Response(JSON.stringify({ error: "orderId es requerido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Obtener detalles de la orden
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderErr || !order) {
        return new Response(JSON.stringify({ error: "Orden no encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validar si el envío ya fue importado
      const { data: existingShipment } = await supabase
        .from("shipments")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (existingShipment && existingShipment.tracking_number) {
        return new Response(JSON.stringify({ message: "Envío ya importado previamente", shipment: existingShipment }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determinar provincia y código de provincia
      const mappingProvincias: Record<string, string> = {
        "caba": "C", "ciudad autónoma de buenos aires": "C", "ciudad autonoma de buenos aires": "C",
        "buenos aires": "B", "provincia de buenos aires": "B", "gba": "B",
        "salta": "A", "chaco": "H", "chubut": "U", "cordoba": "X", "córdoba": "X",
        "corrientes": "W", "entre rios": "E", "entre ríos": "E", "formosa": "P",
        "jujuy": "Y", "la pampa": "L", "la rioja": "F", "mendoza": "M", "misiones": "N",
        "neuquen": "Q", "neuquén": "Q", "rio negro": "R", "río negro": "R",
        "san juan": "J", "san luis": "D", "santa cruz": "Z", "santa fe": "S",
        "santa fé": "S", "santiago del estero": "G", "tierra del fuego": "V",
        "tucuman": "T", "tucumán": "T", "catamarca": "K"
      };

      const cleanProvince = (order.province || "").toLowerCase().trim();
      const provinceLetter = mappingProvincias[cleanProvince] || "C"; // CABA como fallback

      // Calcular dimensiones e importación
      let totalWeight = 500;
      let maxHeight = 10;
      let maxWidth = 10;
      let maxLength = 10;

      if (order.products && Array.isArray(order.products)) {
        const productIds = order.products.map((p: any) => p.id);
        const { data: dbProducts } = await supabase
          .from("products")
          .select("id, weight, height, width, length")
          .in("id", productIds);

        const productsMap = new Map(dbProducts?.map((p: any) => [p.id, p]));
        
        totalWeight = 0;
        for (const item of order.products) {
          const prod = productsMap.get(item.id) || { weight: 500, height: 10, width: 10, length: 10 };
          const qty = Number(item.quantity) || 1;
          totalWeight += (prod.weight || 500) * qty;
          maxHeight = Math.max(maxHeight, prod.height || 10);
          maxWidth = Math.max(maxWidth, prod.width || 10);
          maxLength = Math.max(maxLength, prod.length || 10);
        }
      }

      totalWeight = Math.min(Math.max(totalWeight, 1), 25000);
      maxHeight = Math.min(maxHeight, 255);
      maxWidth = Math.min(maxWidth, 255);
      maxLength = Math.min(maxLength, 255);

      // Si no tenemos código de sucursal, es entrega a domicilio ("D")
      // El comprador puede haber seleccionado de alguna manera retiro
      // Se almacena la información estructurada en shipments
      const isSucursal = order.whatsapp_message && order.whatsapp_message.includes("Agencia:"); // O similar indicador
      const deliveryType = isSucursal ? "S" : "D";
      const agencyCode = isSucursal ? order.whatsapp_message.split("Agencia:")[1]?.trim() : null;

      if (isMockMode) {
        const trackingNum = `CA-${order.order_number.replace(/\D/g, "")}`;
        
        // Crear envío mock en base de datos
        const { data: newShipment, error: shipErr } = await supabase
          .from("shipments")
          .insert({
            order_id: orderId,
            carrier: "correo_argentino_micorreo",
            ext_order_id: orderId,
            tracking_number: trackingNum,
            shipping_id: trackingNum,
            declared_value: order.total_final,
            delivery_type: deliveryType,
            agency_code: agencyCode,
            status: "PREIMPOSICION",
          })
          .select()
          .single();

        if (shipErr) throw shipErr;

        return new Response(JSON.stringify({ success: true, trackingNumber: trackingNum, mock: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = await getAuthToken();
      const senderData = {
        name: "Aldy Ecommerce",
        phone: "1122334455",
        email: "contacto@aldyecommerce.com",
        originAddress: {
          streetName: "Av. Santa Fe",
          streetNumber: "1234",
          city: "CABA",
          provinceCode: "C",
          postalCode: originZip,
        },
      };

      const recipientData = {
        name: `${order.customer_first_name} ${order.customer_last_name}`,
        email: order.customer_email,
        phone: order.customer_phone,
      };

      const reqBody: any = {
        customerId,
        extOrderId: orderId,
        orderNumber: order.order_number,
        sender: senderData,
        recipient: recipientData,
        shipping: {
          deliveryType,
          productType: "CP",
          declaredValue: order.total_final,
          weight: totalWeight,
          height: maxHeight,
          length: maxLength,
          width: maxWidth,
        },
      };

      if (deliveryType === "S") {
        reqBody.shipping.agency = agencyCode;
      } else {
        reqBody.shipping.address = {
          streetName: order.address_street,
          streetNumber: order.address_number,
          city: order.city,
          provinceCode: provinceLetter,
          postalCode: order.postal_code,
        };
        if (order.address_apartment) {
          reqBody.shipping.address.apartment = order.address_apartment;
        }
      }

      const response = await fetch(`${apiBase}/shipping/import`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Si hay conflicto (409) significa que la orden ya fue importada
        if (response.status === 409) {
          return new Response(JSON.stringify({ error: "Orden ya importada en Correo Argentino anteriormente" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: errorData.message || "Error al importar el envío a MiCorreo" }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json(); //createdAt

      // Nota: la respuesta inmediata de import no da el tracking number directamente,
      // la documentación menciona que se puede obtener via GET /shipping/tracking usando extOrderId.
      // Vamos a consultarlo inmediatamente
      let trackingNumber = `CA-${order.order_number.replace(/\D/g, "")}`; // fallback por defecto
      try {
        const trackRes = await fetch(`${apiBase}/shipping/tracking?customerId=${customerId}&extOrderId=${orderId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (trackRes.ok) {
          const trackData = await trackRes.json();
          if (trackData && trackData.trackingNumber) {
            trackingNumber = trackData.trackingNumber;
          }
        }
      } catch (_err) {
        // best effort
      }

      // Guardar en la tabla shipments
      await supabase
        .from("shipments")
        .insert({
          order_id: orderId,
          carrier: "correo_argentino_micorreo",
          ext_order_id: orderId,
          tracking_number: trackingNumber,
          shipping_id: trackingNumber,
          declared_value: order.total_final,
          delivery_type: deliveryType,
          agency_code: agencyCode,
          status: "PREIMPOSICION",
        });

      return new Response(JSON.stringify({ success: true, trackingNumber, data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ruta no encontrada" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
