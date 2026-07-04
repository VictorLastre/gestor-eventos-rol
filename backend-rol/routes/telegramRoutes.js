const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { enviarMensajeTelegram } = require('../utils/telegram');

// Webhook que Telegram llamará de forma invisible cuando el usuario pulse Iniciar
router.post('/webhook', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Verificamos que sea un mensaje de texto que empiece con /start
    if (message && message.text && message.text.startsWith('/start')) {
      const chatId = message.chat.id;
      
      // Extraemos el ID numérico del usuario (ej: "/start 5" -> "5")
      const partes = message.text.split(' ');
      
      if (partes.length > 1) {
        const userId = parseInt(partes[1], 10);
        
        if (!isNaN(userId)) {
          // ACTUALIZADO: Usamos callbacks para la conexión a BD
          db.query(
            'UPDATE usuarios SET telegram_chet_id = ? WHERE id = ?',
            [chatId, userId],
            async (err, resultado) => {
              if (err) {
                console.error('Error al vincular cuenta en BD:', err);
                return;
              }
              
              if (resultado.affectedRows > 0) {
                // Le mandamos un mensaje automático al usuario confirmando el éxito
                await enviarMensajeTelegram(
                  chatId,
                  `✅ <b>¡Vinculación Exitosa!</b>\n\nTu cuenta de la Asociación de Rol La Pampa ha sido enlazada correctamente.\n\nA partir de ahora recibirás aquí los avisos de tus mesas y los mensajes de tu Master. ¡Que rueden los dados!`
                );
              }
            }
          );
        }
      }
    }
    
    // Siempre hay que responderle 200 OK a Telegram
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en el webhook de Telegram:', error);
    res.status(200).send('OK'); 
  }
});

module.exports = router;