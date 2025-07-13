// api/send-push.js

import webpush from 'web-push';

export default async (req, res) => {
  if (req.method === "OPTIONS") {
    // CORS preflight
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { subs, notif } = req.body;

    // DEBUG: Mira qué recibes exactamente
    console.log("Subs:", subs);
    console.log("Notif:", notif);

    // Cargar claves VAPID de variables de entorno
    const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(500).json({ error: "VAPID keys not set" });
    }

    webpush.setVapidDetails(
      'mailto:admin@tudominio.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    if (!Array.isArray(subs) || subs.length === 0) {
      return res.status(400).json({ error: "No subscriptions provided" });
    }
    if (!notif || typeof notif !== "object") {
      return res.status(400).json({ error: "No notification data provided" });
    }

    // Enviar notificación a cada subscripción
    const results = await Promise.all(
      subs.map(sub =>
        webpush.sendNotification(sub, JSON.stringify(notif))
          .then(() => ({ success: true }))
          .catch(err => {
            console.error("Error sending push:", err);
            return { success: false, error: err.message };
          })
      )
    );

    res.status(200).json({ success: true, results });
  } catch (e) {
    console.error("Fatal error in /api/send-push:", e);
    res.status(500).json({ error: e.message });
  }
};
