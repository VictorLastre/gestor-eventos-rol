const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { enviarMensajeTelegram } = require('../utils/telegram');

router.post('/webhook', async (req, res) => {
  try {
    const { message } = req.body;
    if (message && message.text && message.text.startsWith('/start')) {
      const chatId = message.chat.id;
      const partes = message.text.split(' ');
      if (partes.length > 1) {
        const userId = parseInt(partes[1], 10);
        if (!isNaN(userId)) {
          db.query(
            'UPDATE usuarios SET telegram_chet_id = ? WHERE id = ?',
            [chatId, userId],
            async (err, resultado) => {
              if (err) return;
              if (resultado.affectedRows > 0) {
                await enviarMensajeTelegram(
                  chatId,
                  `✅ <b>¡Vinculación Exitosa!</b>\n\nTu cuenta de la Asociación de Rol La Pampa ha sido enlazada correctamente.`
                );
              }
            }
          );
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    res.status(200).send('OK'); 
  }
});

module.exports = router;