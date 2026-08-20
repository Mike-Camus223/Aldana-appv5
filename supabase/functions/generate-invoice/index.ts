import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { buildCustomerInvoiceB } from "./invoice/customer-invoice-b.ts";
import { buildCustomerInvoiceA } from "./invoice/customer-invoice-a.ts";
import { buildAdminPackingSlip } from "./invoice/admin-packing-slip.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceRole);

  try {
    let orderId: string | null = null;
    let type = "customer"; // 'customer' | 'admin'
    let invoiceType = "B"; // 'B' | 'A'
    let format = "json"; // 'json' | 'html'

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      orderId = body.order_id || body.orderId || null;
      type = body.type || "customer";
      invoiceType = (body.invoice_type || body.invoiceType || "B").toUpperCase();
      format = body.format || "json";
    } else {
      const url = new URL(req.url);
      orderId = url.searchParams.get("order_id") || url.searchParams.get("orderId");
      type = url.searchParams.get("type") || "customer";
      invoiceType = (url.searchParams.get("invoice_type") || url.searchParams.get("invoiceType") || "B").toUpperCase();
      format = url.searchParams.get("format") || "html";
    }

    if (!orderId) {
      return new Response(JSON.stringify({ error: "order_id es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Orden no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Obtener el último pago asociado
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Renderizar el layout correspondiente
    let invoiceHtml = "";
    let filePrefix = "Factura";

    if (type === "admin") {
      invoiceHtml = buildAdminPackingSlip(order, payment);
      filePrefix = "Hoja-Despacho-Admin";
    } else if (invoiceType === "A") {
      invoiceHtml = buildCustomerInvoiceA(order, payment);
      filePrefix = "Factura-A";
    } else {
      invoiceHtml = buildCustomerInvoiceB(order, payment);
      filePrefix = "Factura-B";
    }

    if (format === "html") {
      return new Response(invoiceHtml, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_number: order.order_number,
        type,
        invoice_type: invoiceType,
        html: invoiceHtml,
        filename: `${filePrefix}-Pedido-${order.order_number}.pdf`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Error generating invoice:", err);
    return new Response(JSON.stringify({ error: err.message || "Error al generar factura" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
