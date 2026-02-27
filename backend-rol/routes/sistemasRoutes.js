const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todos los sistemas para el selector
router.get('/', (req, res) => {
    db.query('SELECT * FROM sistemas ORDER BY nombre ASC', (err, resultados) => {
        if (err) return res.status(500).json({ error: 'Error al consultar sistemas' });
        res.json(resultados);
    });
});

module.exports = router;