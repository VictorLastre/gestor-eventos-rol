// Módulo de integración con Telegram API usando native https (compatible con cualquier versión de Node)
const https = require('https');

// Envía un mensaje a un chat ID (usuario o grupo)
function enviarMensajeTelegram(chatId, mensaje) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn("⚠️ Telegram warning: TELEGRAM_BOT_TOKEN no configurado.");
      return resolve(false);
    }
    if (!chatId) {
      return resolve(false);
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text: mensaje,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          console.error("❌ Telegram API error:", data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error("❌ Telegram network error:", error.message);
      resolve(false); // resolvemos false para no crashear
    });

    req.write(payload);
    req.end();
  });
}

// Envía un anuncio al canal configurado
function enviarMensajeAlCanal(mensaje) {
  const canalId = process.env.CANALGENERALID || process.env.TELEGRAM_CHANNEL_ID;
  if (!canalId) {
    console.warn("⚠️ Telegram warning: CANALGENERALID o TELEGRAM_CHANNEL_ID no configurado.");
    return Promise.resolve(false);
  }
  return enviarMensajeTelegram(canalId, mensaje);
}

module.exports = {
  enviarMensajeTelegram,
  enviarMensajeAlCanal
};