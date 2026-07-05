const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { enviarMensajeTelegram } = require('../utils/telegram');

// Webhook que Telegram llamará cuando reciba un mensaje
router.post('/webhook', async (req, res) => {
  // Telegram SIEMPRE requiere que devolvamos 200 OK rápido.
  // Lo enviamos inmediatamente para evitar cualquier tipo de bucle o reintento de Telegram.
  res.status(200).send('OK');

  try {
    const { message } = req.body;
    
    // Verificamos que sea un mensaje de texto y comience con /start
    if (message && message.text && message.text.startsWith('/start')) {
      const chatId = message.chat.id;
      const partes = message.text.split(' ');
      
      // Si el comando trae un parámetro (ej: "/start 5")
      if (partes.length > 1) {
        const userId = parseInt(partes[1], 10);
        
        if (!isNaN(userId)) {
          // Actualizamos el usuario en la BD asignándole su ID de Telegram
          db.query(
            'UPDATE usuarios SET telegram_chat_id = ? WHERE id = ?',
            [chatId, userId],
            async (err, resultado) => {
              if (err) {
                console.error('Error al actualizar el ID de Telegram:', err);
                return;
              }
              
              if (resultado.affectedRows > 0) {
                // Le mandamos un mensaje automático al usuario confirmando el éxito
                await enviarMensajeTelegram(
                  chatId,
                  `✅ <b>¡Vinculación Exitosa!</b>\n\nTu cuenta de la Asociación de Rol La Pampa ha sido enlazada correctamente.\n\nA partir de ahora recibirás aquí los avisos de tus mesas y los mensajes de tu Master. ¡Que rueden los dados!`
                );
                
                // ✨ AVISAR AL FRONTEND QUE SE ACTUALIZÓ EL USUARIO
                const io = req.app.get('io');
                if (io) io.emit('actualizacion-usuarios');
              }
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error procesando el webhook de Telegram:', error);
  }
});

module.exports = router;