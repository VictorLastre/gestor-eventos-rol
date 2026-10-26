const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ ADVERTENCIA: JWT_SECRET no está configurado en .env. Se recomienda configurarlo.');
}

// 🛡️ Limitador de peticiones para mitigar ataques de fuerza bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // hasta 20 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos desde esta conexión. Por favor aguarda unos minutos e intenta de nuevo.' }
});

// ✨ REGISTRO: Actualizado para usar el puente mágico de Promesas
router.post('/registro', authLimiter, async (req, res) => {
  const { nombre, nombre_completo, email, password, fecha_nacimiento } = req.body;

  // Validación de fecha de nacimiento obligatoria para clasificar edad (+18 o menores)
  if (!fecha_nacimiento) {
    return res.status(400).json({ 
      error: 'La fecha de nacimiento es obligatoria para clasificar tu acceso a las mesas (+18 o menores).' 
    });
  }

  const fechaNac = new Date(fecha_nacimiento);
  if (isNaN(fechaNac.getTime())) {
    return res.status(400).json({ error: 'La fecha de nacimiento no es válida.' });
  }

  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const m = hoy.getMonth() - fechaNac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }

  if (edad < 6 || edad > 110) {
    return res.status(400).json({ error: 'Debes ingresar una fecha de nacimiento válida (edad entre 6 y 110 años).' });
  }

  // Validación de contraseña segura para proteger el gremio
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&._-]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.' 
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    
    // Añadimos nombre_completo y fecha_nacimiento a la consulta SQL
    const sql = 'INSERT INTO usuarios (nombre, nombre_completo, email, password, rol, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?)';
    
    // ✨ EL PUENTE MÁGICO APLICADO AQUÍ: db.promise().query
    await db.promise().query(sql, [nombre, nombre_completo, email, hash, 'jugador', fecha_nacimiento]);
    
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
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // ✨ EL PUENTE MÁGICO APLICADO AQUÍ: db.promise().query con cálculo de edad
    const sqlLogin = `
      SELECT u.*, 
        DATE_FORMAT(u.fecha_nacimiento, '%Y-%m-%d') as fecha_nacimiento_formateada,
        TIMESTAMPDIFF(YEAR, u.fecha_nacimiento, CURDATE()) as edad_calculada
      FROM usuarios u 
      WHERE u.email = ?
    `;
    const [resultados] = await db.promise().query(sqlLogin, [email]);
    
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
        avatar: usuario.avatar || 'guerrero',
        telegram_chat_id: usuario.telegram_chat_id,
        fecha_nacimiento: usuario.fecha_nacimiento_formateada || null,
        edad: usuario.edad_calculada !== null && usuario.edad_calculada !== undefined ? usuario.edad_calculada : null
      } 
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno al intentar abrir la bóveda.' });
  }
});

module.exports = router;