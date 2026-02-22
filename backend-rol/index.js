// 1. IMPORTAMOS NUESTRAS HERRAMIENTAS MÁGICAS
require('dotenv').config(); // Cargamos variables de entorno (.env)
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


require('dotenv').config();

// 2. INICIALIZAMOS LA APLICACIÓN
const app = express();

// Configuración de CORS dinámica
app.use(cors({
  origin: [
    'http://localhost:5173',                   // Pruebas locales
    'https://gestor-eventos-rol.vercel.app',  // Tu URL de Vercel (CÁMBIALA si es otra)
    /\.vercel\.app$/                          // Permite cualquier subdominio de vercel
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'authorization']
}));

app.use(express.json());

// 3. CONEXIÓN AL "MANUAL DE REGLAS" (TiDB Cloud / MySQL)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestor_rol',
  port: process.env.DB_PORT || 4000,
  // CONFIGURACIÓN SSL OBLIGATORIA PARA LA NUBE
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificamos conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
  } else {
    console.log('✅ ¡Conexión exitosa a TiDB Cloud / MySQL!');
    connection.release();
  }
});

// Secreto para JWT (desde variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

// ==========================================
// 4. EL GUARDIA DE SEGURIDAD
// ==========================================
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send('¡Alto ahí! Necesitas estar logueado.');
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send('Tu Pase VIP es inválido o ha caducado.');
    }
    req.usuario = decoded; 
    next();
  });
};

// ==========================================
// 5. RUTAS (Públicas y Protegidas)
// ==========================================

// --- EVENTOS ---
app.get('/api/eventos', (req, res) => {
  db.query('SELECT * FROM eventos ORDER BY fecha DESC', (err, resultados) => {
    if (err) return res.status(500).send('Error leyendo los eventos');
    res.json(resultados);
  });
});

app.post('/api/eventos', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).send('Solo Admins.');
  const { nombre, descripcion, fecha } = req.body;
  db.query('INSERT INTO eventos (nombre, descripcion, fecha) VALUES (?, ?, ?)', [nombre, descripcion, fecha], (err) => {
    if (err) return res.status(500).send('Error al crear evento.');
    res.status(201).send('¡Evento convocado!');
  });
});

app.delete('/api/eventos/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).send('No tienes permiso.');
  db.query('DELETE FROM eventos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al borrar.');
    res.send('Evento eliminado.');
  });
});

// --- USUARIOS & AUTH ---
app.post('/api/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.query('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', [nombre, email, hash, 'jugador'], (err) => {
      if (err) return res.status(400).send('Email ya en uso o error de DB.');
      res.status(201).send('¡Aventurero registrado!');
    });
  } catch (e) { res.status(500).send('Error interno.'); }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, resultados) => {
    if (err || resultados.length === 0) return res.status(401).send('Credenciales incorrectas');
    const usuario = resultados[0];
    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(401).send('Credenciales incorrectas');

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '2h' });
    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, email: usuario.email, avatar: usuario.avatar }
    });
  });
});

// --- PARTIDAS & INSCRIPCIONES ---
app.get('/api/eventos/:id/partidas', verificarToken, (req, res) => {
  const sql = `
    SELECT p.*, u.nombre AS dungeon_master_nombre, COUNT(i.id) as jugadores_anotados,
    MAX(CASE WHEN i.usuario_id = ? THEN 1 ELSE 0 END) as estoy_anotado
    FROM partidas p
    JOIN usuarios u ON p.dungeon_master_id = u.id
    LEFT JOIN inscripciones i ON p.id = i.partida_id
    WHERE p.evento_id = ?
    GROUP BY p.id
  `;
  db.query(sql, [req.usuario.id, req.params.id], (err, resultados) => {
    if (err) return res.status(500).send('Error en partidas.');
    res.json(resultados);
  });
});

app.post('/api/partidas/:id/inscripciones', verificarToken, (req, res) => {
  const sql = 'INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)';
  db.query(sql, [req.usuario.id, req.params.id], (err) => {
    if (err) return res.status(400).send('Error en inscripción o ya estás anotado.');
    res.status(201).send('¡Inscripto!');
  });
});

app.delete('/api/partidas/:id/inscripciones', verificarToken, (req, res) => {
  db.query('DELETE FROM inscripciones WHERE usuario_id = ? AND partida_id = ?', [req.usuario.id, req.params.id], (err) => {
    if (err) return res.status(500).send('Error al dar de baja.');
    res.send('Baja exitosa.');
  });
});

// --- PERFIL & ROLES ---
app.put('/api/usuarios/perfil', verificarToken, (req, res) => {
  const { nombre, email, avatar } = req.body;
  db.query('UPDATE usuarios SET nombre = ?, email = ?, avatar = ? WHERE id = ?', [nombre, email, avatar, req.usuario.id], (err) => {
    if (err) return res.status(500).send('Error al actualizar.');
    res.send('Perfil actualizado.');
  });
});

// --- ADMIN & STATS ---
app.get('/api/admin/estadisticas', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).send('Acceso denegado');
  const sql = `
    SELECT e.nombre, COUNT(DISTINCT p.id) as total_mesas, 
    (SELECT COUNT(*) FROM inscripciones i2 JOIN partidas p2 ON i2.partida_id = p2.id WHERE p2.evento_id = e.id) as total_jugadores
    FROM eventos e
    LEFT JOIN partidas p ON e.id = p.evento_id
    GROUP BY e.id ORDER BY e.fecha DESC
  `;
  db.query(sql, (err, resultados) => {
    if (err) return res.status(500).send('Error en stats.');
    res.json(resultados);
  });
});

// ==========================================
// 7. ENCENDER EL SERVIDOR
// ==========================================
const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
  console.log(`⚔️  Asociación de Rol La Pampa activa en puerto ${PUERTO}`);
});