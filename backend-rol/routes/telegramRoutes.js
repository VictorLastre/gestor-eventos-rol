const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { enviarMensajeTelegram } = require('../utils/telegram');

// Webhook que Telegram llamará de forma invisible
router.post('/webhook', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (message && message.text && message.text.startsWith('/start')) {
      const chatId = message.chat.id;
      const partes = message.text.split(' ');
      
      if (partes.length > 1) {
        const userId = parseInt(partes[1], 10);
        
        if (!isNaN(userId)) {
          // AQUI ESTA LA CORRECCIÓN CLAVE: Usamos db.query normal con callback (err, resultado)
          db.query(
            'UPDATE usuarios SET telegram_chet_id = ? WHERE id = ?',
            [chatId, userId],
            async (err, resultado) => {
              if (err) {
                console.error('Error al vincular cuenta en BD:', err);
                return;
              }
              
              if (resultado.affectedRows > 0) {
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
    
    // ESTO ES LO QUE DETIENE EL BUCLE DE TELEGRAM
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en el webhook de Telegram:', error);
    res.status(200).send('OK'); 
  }
});

module.exports = router;