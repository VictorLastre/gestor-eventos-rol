const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

router.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.query('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', [nombre, email, hash, 'jugador'], (err) => {
      if (err) return res.status(400).json({ error: 'Email ya en uso.' });
      res.status(201).json({ mensaje: '¡Aventurero registrado!' });
    });
  } catch (e) { res.status(500).json({ error: 'Error interno.' }); }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, resultados) => {
    if (err || resultados.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const usuario = resultados[0];
    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '2h' });
    
    // === EL CAMBIO ESTÁ AQUÍ ===
    // Ahora le enviamos el avatar de la base de datos al Frontend
    res.json({ 
      token, 
      usuario: { 
        id: usuario.id, 
        nombre: usuario.nombre, 
        rol: usuario.rol, 
        email: usuario.email,
        avatar: usuario.avatar || 'guerrero' // Fallback seguro por si acaso
      } 
    });
  });
});

module.exports = router;