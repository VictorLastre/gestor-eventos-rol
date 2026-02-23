// 1. IMPORTAMOS LAS HERRAMIENTAS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// 2. INICIALIZAMOS LA APLICACIÓN
const app = express();

// Configuración de CORS dinámica para Vercel y Local
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

// 3. CONEXIÓN A TIDB CLOUD (Pool de conexiones)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test', // Confirmamos que es 'test'
  port: process.env.DB_PORT || 4000,
  ssl: {
    minVersion: 'TLSv1.2',
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
    console.log('✅ ¡Conexión exitosa a TiDB Cloud / MySQL!');
    connection.release();
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

// ==========================================
// 4. MIDDLEWARE DE SEGURIDAD
// ==========================================
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send('¡Alto ahí! Necesitas estar logueado.');

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Tu Pase VIP es inválido o ha caducado.');
    req.usuario = decoded; 
    next();
  });
};

// ==========================================
// 5. RUTAS DE EVENTOS
// ==========================================

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

// ==========================================
// 6. RUTAS DE PARTIDAS (MESAS)
// ==========================================

// OBTENER PARTIDAS DE UN EVENTO
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
    if (err) {
        console.error(err);
        return res.status(500).send('Error en partidas.');
    }
    res.json(resultados);
  });
});

// CREAR NUEVA MESA (ESTA ES LA QUE FALTABA)
app.post('/api/eventos/:id/partidas', verificarToken, (req, res) => {
  const idEvento = req.params.id;
  const idUsuario = req.usuario.id;
  const { rol } = req.usuario;

  if (rol === 'jugador') return res.status(403).send('Solo DMs y Admins pueden crear mesas.');

  const { titulo, descripcion, requisitos, sistema, cupo, turno } = req.body;

  const sql = `
    INSERT INTO partidas (evento_id, dungeon_master_id, titulo, descripcion, requisitos, sistema, cupo, turno, estado) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'abierta')
  `;
  
  db.query(sql, [idEvento, idUsuario, titulo, descripcion, requisitos, sistema, cupo, turno], (err) => {
    if (err) {
      console.error("Error SQL al crear mesa:", err);
      return res.status(500).send('Error al crear la mesa en la base de datos.');
    }
    res.status(201).send('¡Mesa creada con éxito!');
  });
});

// ==========================================
// 7. USUARIOS, AUTH Y PERFIL
// ==========================================

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

app.get('/api/mis-cronicas', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  const sqlDirigiendo = `
    SELECT p.id, p.titulo, p.sistema, e.nombre AS evento_nombre, e.fecha AS evento_fecha
    FROM partidas p
    JOIN eventos e ON p.evento_id = e.id
    WHERE p.dungeon_master_id = ?
    ORDER BY e.fecha DESC
  `;
  const sqlJugando = `
    SELECT p.id, p.titulo, p.sistema, e.nombre AS evento_nombre, e.fecha AS evento_fecha, u.nombre AS dm_nombre
    FROM inscripciones i
    JOIN partidas p ON i.partida_id = p.id
    JOIN eventos e ON p.evento_id = e.id
    JOIN usuarios u ON p.dungeon_master_id = u.id
    WHERE i.usuario_id = ?
    ORDER BY e.fecha DESC
  `;
  db.query(sqlDirigiendo, [idUsuario], (err, dirigiendo) => {
    if (err) return res.status(500).send('Error en crónicas (dirigiendo).');
    db.query(sqlJugando, [idUsuario], (err, jugando) => {
      if (err) return res.status(500).send('Error en crónicas (jugando).');
      res.json({ dirigiendo, jugando });
    });
  });
});

// ==========================================
// 8. ENCENDER EL SERVIDOR
// ==========================================
const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
  console.log(`⚔️  Asociación de Rol La Pampa activa en puerto ${PUERTO}`);
});