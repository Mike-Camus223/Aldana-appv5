/**
 * Script para enviar una campaña de prueba a todos los suscriptores activos de Supabase
 * Ejecutar con: node send-test-campaign.cjs
 */
const https = require('https');

const SUPABASE_URL = "https://cddrmboopihkiuyomxle.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZHJtYm9vcGloa2l1eW9teGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Njk4MTAsImV4cCI6MjA2MjI0NTgxMH0.iA4hW45R2F69mGq7X_e9o-9447w8u1J1wQ9x5E2s5fU";

const campaignData = JSON.stringify({
  action: "send_campaign",
  subject: "👗 ¡Nueva Colección Primavera & Descuento Especial en Aldana Vilcabana!",
  title: "Descubre nuestra nueva línea exclusiva",
  message: "Querida comunidad,\n\nNos complace presentarte nuestros nuevos diseños confeccionados a medida para esta temporada. Para celebrarlo, tienes un cupón exclusivo para tus próximas compras.",
  discountCode: "COLECCION2026",
  discountPercent: "15%"
});

const options = {
  hostname: "cddrmboopihkiuyomxle.supabase.co",
  port: 443,
  path: "/functions/v1/send-newsletter",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Content-Length": Buffer.byteLength(campaignData)
  }
};

console.log("Enviando campaña a todos los suscriptores activos...");

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => {
    console.log("Respuesta del servidor (Status:", res.statusCode, "):");
    console.log(data);
  });
});

req.on("error", (e) => {
  console.error("Error:", e.message);
});

req.write(campaignData);
req.end();
