// @ts-nocheck
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.13";
import { renderNewsletterHtml } from "./email-template.ts";

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

  const smtpHost = Deno.env.get("COMINTECH_SMTP_HOST") || "aldanavilcabana.com.ar";
  const smtpPort = parseInt(Deno.env.get("COMINTECH_SMTP_PORT") || "465", 10);
  const smtpUser = Deno.env.get("COMINTECH_SMTP_USER") || "hola@aldanavilcabana.com.ar";
  const smtpPass = Deno.env.get("COMINTECH_SMTP_PASSWORD") || "aldanitarenegona";

  try {
    const body = await req.json();
    const { action, to, subject, title, message, discountCode, discountPercent, customHtml } = body;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        servername: smtpHost,
      },
    });

    // CASO 1: Envío individual (Bienvenida o Test específico)
    if (action === "test_send" || action === "welcome_discount" || (action !== "send_campaign" && to)) {
      const recipient = to || "michaelcamposvil@gmail.com";
      const emailSubj = subject || "✨ ¡Bienvenido a Aldana Vilcabana! Tu regalo exclusivo de bienvenida";
      const emailTitle = title || "¡Gracias por unirte a nuestra comunidad!";
      const emailMsg =
        message ||
        "Estamos encantados de tenerte con nosotros. A partir de ahora serás el primero en enterarte de nuestros nuevos lanzamientos de vestidos, promociones exclusivas y eventos especiales.";
      const code = discountCode || (action === "welcome_discount" ? "BIENVENIDO10" : undefined);
      const percent = discountPercent || (action === "welcome_discount" ? "10%" : undefined);

      const html = renderNewsletterHtml({
        subject: emailSubj,
        title: emailTitle,
        message: emailMsg,
        discountCode: code,
        discountPercent: percent,
        customHtml,
      });

      const info = await transporter.sendMail({
        from: `"Aldana Vilcabana" <${smtpUser}>`,
        to: recipient,
        subject: emailSubj,
        html,
      });

      return new Response(
        JSON.stringify({
          success: true,
          recipient,
          messageId: info.messageId,
          message: "Email enviado con éxito a través del SMTP de Comintech",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CASO 2: Envío Masivo de Campaña a TODOS los suscriptores activos (is_active = true)
    if (action === "send_campaign") {
      const { data: subscribers, error: subError } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("is_active", true);

      if (subError) throw subError;

      if (!subscribers || subscribers.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "No hay suscriptores activos en la base de datos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const emailSubj = subject || "✨ Novedades Exclusivas de Aldana Vilcabana";
      const emailTitle = title || "Nueva Colección y Promociones Especiales";
      const emailMsg = message || "Te presentamos nuestras últimas creaciones diseñadas especialmente para ti.";

      const html = renderNewsletterHtml({
        subject: emailSubj,
        title: emailTitle,
        message: emailMsg,
        discountCode,
        discountPercent,
        customHtml,
      });

      const recipients = subscribers.map((s: any) => s.email);
      let sentCount = 0;
      const errors: string[] = [];

      for (const email of recipients) {
        try {
          await transporter.sendMail({
            from: `"Aldana Vilcabana" <${smtpUser}>`,
            to: email,
            subject: emailSubj,
            html,
          });
          sentCount++;
          // Pausa de 300ms entre envíos para respetar límite del servidor
          await new Promise((r) => setTimeout(r, 300));
        } catch (err: any) {
          console.error(`Error enviando a ${email}:`, err.message);
          errors.push(`${email}: ${err.message}`);
        }
      }

      // Registrar campaña en la base de datos
      try {
        await supabase.from("newsletter_campaigns").insert({
          title: emailTitle,
          subject: emailSubj,
          content_html: html,
          status: "sent",
          sent_count: sentCount,
          total_recipients: recipients.length,
          sent_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn("Error al registrar campaña en DB:", dbErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          totalSubscribers: recipients.length,
          sentCount,
          errors: errors.length > 0 ? errors : undefined,
          message: `Campaña enviada con éxito a ${sentCount} suscriptores`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Acción no válida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error en Edge Function send-newsletter:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error al conectar con el servidor SMTP",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
