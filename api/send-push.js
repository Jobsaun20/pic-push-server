// api/send-push.js

import webpush from 'web-push';

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }
  try {
    const { subs, notif } = req.body;

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

    // Enviar notificación a cada subscripción
    await Promise.all(
      subs.map(sub =>
        webpush.sendNotification(sub, JSON.stringify(notif)).catch(err => null)
      )
    );

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
