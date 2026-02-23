require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

// Configuración de CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://gestor-eventos-rol.vercel.app', /\.vercel\.app$/],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'authorization']
}));

app.use(express.json());

// CONEXIÓN A LA BASE DE DATOS
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10
});

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

// MIDDLEWARE DE SEGURIDAD
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'Necesitas estar logueado.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Sesión expirada.' });
    req.usuario = decoded; 
    next();
  });
};

// --- RUTAS DE EVENTOS ---
app.get('/api/eventos', (req, res) => {
  db.query('SELECT * FROM eventos ORDER BY fecha DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error leyendo eventos' });
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

// --- RUTAS DE PARTIDAS (MESAS) ---
app.get('/api/eventos/:id/partidas', verificarToken, (req, res) => {
  const sql = `
    SELECT p.*, u.nombre AS dmNombre, 
    (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id) as jugadoresIniciales,
    (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id AND usuario_id = ?) as anotadoInicialmente
    FROM partidas p
    JOIN usuarios u ON p.dungeon_master_id = u.id
    WHERE p.evento_id = ?
  `;
  db.query(sql, [req.usuario.id, req.params.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error en partidas.' });
    res.json(resultados);
  });
});

app.post('/api/eventos/:id/partidas', verificarToken, (req, res) => {
  if (req.usuario.rol === 'jugador') return res.status(403).json({ error: 'Solo DMs/Admins.' });
  const { titulo, descripcion, requisitos, sistema, cupo, turno } = req.body;
  const sql = `INSERT INTO partidas (evento_id, dungeon_master_id, titulo, descripcion, requisitos, sistema, cupo, turno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [req.params.id, req.usuario.id, titulo, descripcion, requisitos, sistema, cupo, turno], (err) => {
    if (err) return res.status(500).json({ error: 'Error al crear mesa.' });
    res.status(201).json({ mensaje: 'Mesa creada.' });
  });
});

// --- INSCRIPCIONES ---
app.post('/api/partidas/:id/inscripciones', verificarToken, (req, res) => {
  const sql = "INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)";
  db.query(sql, [req.usuario.id, req.params.id], (err) => {
    if (err) return res.status(400).send('Ya estás anotado o mesa inexistente.');
    res.status(201).send('¡Anotado!');
  });
});

app.delete('/api/partidas/:id/inscripciones', verificarToken, (req, res) => {
  const sql = "DELETE FROM inscripciones WHERE usuario_id = ? AND partida_id = ?";
  db.query(sql, [req.usuario.id, req.params.id], (err) => {
    if (err) return res.status(500).send('Error al abandonar.');
    res.send('Has abandonado la misión.');
  });
});

// --- MIS CRÓNICAS (RUTA QUE FALTABA) ---
app.get('/api/mis-cronicas', verificarToken, (req, res) => {
  const sqlDirigiendo = `SELECT p.*, e.nombre as evento_nombre FROM partidas p JOIN eventos e ON p.evento_id = e.id WHERE p.dungeon_master_id = ?`;
  const sqlJugando = `SELECT p.*, e.nombre as evento_nombre FROM inscripciones i JOIN partidas p ON i.partida_id = p.id JOIN eventos e ON p.evento_id = e.id WHERE i.usuario_id = ?`;
  
  db.query(sqlDirigiendo, [req.usuario.id], (err, dirigiendo) => {
    db.query(sqlJugando, [req.usuario.id], (err, jugando) => {
      res.json({ dirigiendo: dirigiendo || [], jugando: jugando || [] });
    });
  });
});

// --- ADMIN: ESTADÍSTICAS Y SOLICITUDES ---
app.get('/api/admin/estadisticas', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  const sql = `
    SELECT e.nombre, COUNT(DISTINCT p.id) AS total_mesas, COUNT(i.id) AS total_jugadores
    FROM eventos e
    LEFT JOIN partidas p ON e.id = p.evento_id
    LEFT JOIN inscripciones i ON p.id = i.partida_id
    GROUP BY e.id ORDER BY e.fecha DESC`;
  db.query(sql, (err, resultados) => {
    if (err) return res.status(500).json(err);
    res.json(resultados);
  });
});

app.get('/api/usuarios/solicitudes-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  db.query("SELECT id, nombre, email FROM usuarios WHERE solicita_dm = 1 AND rol = 'jugador'", (err, resultados) => {
    res.json(resultados || []);
  });
});

app.put('/api/usuarios/:id/promover', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  db.query("UPDATE usuarios SET rol = 'dm', solicita_dm = 0 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error.');
    res.send('¡Ascenso completado!');
  });
});

// --- AUTH ---
app.post('/api/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.query('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)', [nombre, email, hash], (err) => {
    if (err) return res.status(400).json({ error: 'Email en uso.' });
    res.status(201).json({ mensaje: 'Registrado.' });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, resultados) => {
    if (err || resultados.length === 0) return res.status(401).json({ error: 'Error.' });
    const usuario = resultados[0];
    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(401).json({ error: 'Error.' });
    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, email: usuario.email } });
  });
});

const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
  console.log(`⚔️ Servidor en puerto ${PUERTO}`);
});