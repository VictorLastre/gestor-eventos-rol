const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

// ✨ REGISTRO: Actualizado para usar el puente mágico de Promesas
router.post('/registro', async (req, res) => {
  const { nombre, nombre_completo, email, password } = req.body;

  // Validación de contraseña segura para proteger el gremio
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&._-]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.' 
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    
    // Añadimos nombre_completo a la consulta SQL
    const sql = 'INSERT INTO usuarios (nombre, nombre_completo, email, password, rol) VALUES (?, ?, ?, ?, ?)';
    
    // ✨ EL PUENTE MÁGICO APLICADO AQUÍ: db.promise().query
    await db.promise().query(sql, [nombre, nombre_completo, email, hash, 'jugador']);
    
    res.status(201).json({ mensaje: '¡Aventurero registrado en el gremio!' });
  } catch (e) { 
    console.error('Error en la forja de identidad:', e);
    // Si el error es por duplicado en MySQL (ER_DUP_ENTRY)
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El nombre de héroe o email ya están en uso.' });
    }
    res.status(500).json({ error: 'Error interno en la forja de identidad.' }); 
  }
});

// ✨ LOGIN: Actualizado para usar el puente mágico de Promesas
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // ✨ EL PUENTE MÁGICO APLICADO AQUÍ: db.promise().query
    const [resultados] = await db.promise().query('SELECT * FROM usuarios WHERE email = ?', [email]);
    
    // Si no hay resultados, devolvemos error (y detenemos la ejecución)
    if (resultados.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    const usuario = resultados[0];
    const valida = await bcrypt.compare(password, usuario.password);
    
    if (!valida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, JWT_SECRET, { expiresIn: '2h' });
    
    // ✨ LOGIN EXITOSO: Enviamos los datos al Frontend
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
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno al intentar abrir la bóveda.' });
  }
});

module.exports = router;