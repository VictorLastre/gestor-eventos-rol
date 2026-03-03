const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

// ✨ REGISTRO: Ahora capturamos el nombre real para los pergaminos oficiales
router.post('/registro', async (req, res) => {
  const { nombre, nombre_completo, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    
    // Añadimos nombre_completo a la consulta SQL
    const sql = 'INSERT INTO usuarios (nombre, nombre_completo, email, password, rol) VALUES (?, ?, ?, ?, ?)';
    
    db.query(sql, [nombre, nombre_completo, email, hash, 'jugador'], (err) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: 'El nombre de héroe o email ya están en uso.' });
      }
      res.status(201).json({ mensaje: '¡Aventurero registrado en los anales del gremio!' });
    });
  } catch (e) { 
    res.status(500).json({ error: 'Error interno en la forja de identidad.' }); 
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, resultados) => {
    if (err || resultados.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
    
    const usuario = resultados[0];
    const valida = await bcrypt.compare(password, usuario.password);
    
    if (!valida) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, JWT_SECRET, { expiresIn: '2h' });
    
    // ✨ LOGIN: Ahora enviamos también el nombre completo al Frontend
    res.json({ 
      token, 
      usuario: { 
        id: usuario.id, 
        nombre: usuario.nombre, 
        nombre_completo: usuario.nombre_completo, // Enviamos el nombre real
        rol: usuario.rol, 
        email: usuario.email,
        avatar: usuario.avatar || 'guerrero' 
      } 
    });
  });
});

module.exports = router;