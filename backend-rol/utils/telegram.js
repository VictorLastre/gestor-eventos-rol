const https = require('https');

function enviarMensajeTelegram(chatId, mensaje) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn("⚠️ Telegram warning: TELEGRAM_BOT_TOKEN no configurado.");
      return resolve(false);
    }
    if (!chatId) return resolve(false);

    const payload = JSON.stringify({ chat_id: chatId, text: mensaje, parse_mode: 'HTML' });
    const options = {
      hostname: 'api.telegram.org', port: 443, path: `/bot${token}/sendMessage`,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(true);
        else resolve(false);
      });
    });

    req.on('error', (error) => {
      console.error("❌ Telegram network error:", error.message);
      resolve(false); 
    });

    req.write(payload);
    req.end();
  });
}

function enviarMensajeAlCanal(mensaje) {
  const canalId = process.env.CANALGENERALID || process.env.TELEGRAM_CHANNEL_ID;
  if (!canalId) return Promise.resolve(false);
  return enviarMensajeTelegram(canalId, mensaje);
}

module.exports = { enviarMensajeTelegram, enviarMensajeAlCanal };