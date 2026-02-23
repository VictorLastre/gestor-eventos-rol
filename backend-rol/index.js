// 1. IMPORTAMOS LAS HERRAMIENTAS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// 2. INICIALIZAMOS LA APLICACIÓN
const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://gestor-eventos-rol.vercel.app',
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'authorization']
}));

app.use(express.json());

// 3. CONEXIÓN A CLEVER CLOUD (MySQL)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
  } else {
    console.log('✅ ¡Conexión exitosa a la base de datos MySQL!');
    connection.release();
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

// ==========================================
// 4. MIDDLEWARE DE SEGURIDAD (Formateado para JSON)
// ==========================================
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: '¡Alto ahí! Necesitas estar logueado.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Tu Pase VIP es inválido o ha caducado.' });
    req.usuario = decoded; 
    next();
  });
};

// ==========================================
// 5. RUTAS DE EVENTOS
// ==========================================

app.get('/api/eventos', (req, res) => {
  db.query('SELECT * FROM eventos ORDER BY fecha DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los eventos' });
    res.json(resultados);
  });
});

app.post('/api/eventos', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo Admins.' });
  const { nombre, descripcion, fecha } = req.body;
  db.query('INSERT INTO eventos (nombre, descripcion, fecha) VALUES (?, ?, ?)', [nombre, descripcion, fecha], (err) => {
    if (err) return res.status(500).json({ error: 'Error al crear evento.' });
    res.status(201).json({ mensaje: '¡Evento convocado!' });
  });
});

// ==========================================
// 6. RUTAS DE PARTIDAS (MESAS)
// ==========================================

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
    if (err) return res.status(500).json({ error: 'Error en partidas.' });
    res.json(resultados);
  });
});

app.post('/api/eventos/:id/partidas', verificarToken, (req, res) => {
  const { rol } = req.usuario;
  if (rol === 'jugador') return res.status(403).json({ error: 'Solo DMs y Admins pueden crear mesas.' });

  const { titulo, descripcion, requisitos, sistema, cupo, turno } = req.body;
  const sql = `INSERT INTO partidas (evento_id, dungeon_master_id, titulo, descripcion, requisitos, sistema, cupo, turno, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'abierta')`;
  
  db.query(sql, [req.params.id, req.usuario.id, titulo, descripcion, requisitos, sistema, cupo, turno], (err) => {
    if (err) return res.status(500).json({ error: 'Error al crear la mesa.' });
    res.status(201).json({ mensaje: '¡Mesa creada con éxito!' });
  });
});

// ==========================================
// 7. COMPATIBILIDAD CON EL FRONTEND (Solución a errores 404)
// ==========================================

app.get('/api/admin/estadisticas', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  // Enviamos ceros para que cargue la interfaz sin romperse
  res.json({ usuarios: 0, eventos: 0, partidas: 0 });
});

app.get('/api/usuarios/solicitudes-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  res.json([]); 
});

// ==========================================
// 8. USUARIOS, AUTH Y PERFIL
// ==========================================

app.post('/api/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.query('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', [nombre, email, hash, 'jugador'], (err) => {
      if (err) return res.status(400).json({ error: 'Email ya en uso.' });
      res.status(201).json({ mensaje: '¡Aventurero registrado!' });
    });
  } catch (e) { res.status(500).json({ error: 'Error interno.' }); }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, resultados) => {
    if (err || resultados.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const usuario = resultados[0];
    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '2h' });
    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, email: usuario.email }
    });
  });
});

app.get('/api/admin/estadisticas', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });

  const sql = `
    SELECT 
      e.nombre,
      COUNT(DISTINCT p.id) AS total_mesas,
      COUNT(i.id) AS total_jugadores
    FROM eventos e
    LEFT JOIN partidas p ON e.id = p.evento_id
    LEFT JOIN inscripciones i ON p.id = i.partida_id
    GROUP BY e.id
    ORDER BY e.fecha DESC
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("Error en estadísticas:", err);
      return res.status(500).json({ error: 'Error al obtener métricas' });
    }
    res.json(resultados);
  });
});

// ==========================================
// 9. ENCENDER EL SERVIDOR
// ==========================================
const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
  console.log(`⚔️  Asociación de Rol La Pampa activa en puerto ${PUERTO}`);
});