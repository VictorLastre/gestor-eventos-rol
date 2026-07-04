const express = require('express');
const router = express.Router();

// Parche de emergencia para cortar el bucle de Telegram
router.post('/webhook', (req, res) => {
  res.status(200).send('OK'); 
});

module.exports = router;