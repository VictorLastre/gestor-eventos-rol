// Módulo de integración con Telegram API usando native fetch

// Envía un mensaje a un chat ID (usuario o grupo)
async function enviarMensajeTelegram(chatId, mensaje) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("⚠️ Telegram warning: TELEGRAM_BOT_TOKEN no configurado.");
    return false;
  }
  if (!chatId) {
    return false; // Silencioso si el usuario no tiene vinculado Telegram
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensaje,
        parse_mode: 'HTML' // Permite dar formato con <b>, <i>, <a>, <code>, etc.
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("❌ Telegram API error:", data);
      return false;
    }
    return true;
  } catch (error) {
    console.error("❌ Telegram network error:", error.message);
    return false;
  }
}

// Envía un anuncio al canal configurado
async function enviarMensajeAlCanal(mensaje) {
  const canalId = process.env.CANALGENERALID || process.env.TELEGRAM_CHANNEL_ID;
  if (!canalId) {
    console.warn("⚠️ Telegram warning: CANALGENERALID o TELEGRAM_CHANNEL_ID no configurado.");
    return false;
  }
  return enviarMensajeTelegram(canalId, mensaje);
}

module.exports = {
  enviarMensajeTelegram,
  enviarMensajeAlCanal
};