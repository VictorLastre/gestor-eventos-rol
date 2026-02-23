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
// 4. MIDDLEWARE DE SEGURIDAD
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
  // Ajustamos el SQL para usar tus columnas reales:
  // p.cupo es la columna que me pasaste para evitar el NaN
  // u.nombre es el nombre del DM
  const sql = `
    SELECT 
      p.id, 
      p.evento_id, 
      p.dungeon_master_id, 
      p.titulo, 
      p.descripcion, 
      p.requisitos, 
      p.sistema, 
      p.cupo, 
      p.turno, 
      p.estado,
      u.nombre AS dmNombre, 
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id) AS jugadoresIniciales,
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id AND usuario_id = ?) AS anotadoInicialmente
    FROM partidas p
    JOIN usuarios u ON p.dungeon_master_id = u.id
    WHERE p.evento_id = ?
    GROUP BY p.id
  `;

  db.query(sql, [req.usuario.id, req.params.id], (err, resultados) => {
    if (err) {
      console.error("Error en partidas:", err);
      return res.status(500).json({ error: 'Error al consultar las mesas.' });
    }
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
// 7. GESTIÓN DE INSCRIPCIONES (SOLUCIÓN ERROR 400)
// ==========================================

app.post('/api/partidas/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  // Verificamos si la partida existe y tiene cupo
  const sqlCupo = `SELECT cupo, (SELECT COUNT(*) FROM inscripciones WHERE partida_id = ?) as anotados FROM partidas WHERE id = ?`;

  db.query(sqlCupo, [idPartida, idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error de servidor.');
    if (resultados.length === 0) return res.status(404).send('La mesa ya no existe.');
    
    if (resultados[0].anotados >= resultados[0].cupo) {
      return res.status(400).send('❌ ¡Mesa llena! No quedan lugares.');
    }

    const sqlIns = "INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)";
    db.query(sqlIns, [idUsuario, idPartida], (err) => {
      if (err) return res.status(400).send('Ya estás anotado o hubo un error en los anales.');
      res.status(201).send('¡Te has unido a la aventura!');
    });
  });
});

// Abandonar una partida (Darse de baja)
app.delete('/api/partidas/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id; // Extraído del Token del jugador logueado

  // Usamos ambos IDs para asegurarnos de borrar la fila correcta
  const sql = "DELETE FROM inscripciones WHERE usuario_id = ? AND partida_id = ?";
  
  db.query(sql, [idUsuario, idPartida], (err, resultado) => {
    if (err) {
      console.error("Error al dar de baja:", err);
      return res.status(500).send('Error en los anales del gremio.');
    }
    
    if (resultado.affectedRows === 0) {
      return res.status(404).send('No se encontró tu inscripción en esta mesa.');
    }

    res.send('Has abandonado la misión correctamente.');
  });
});

// ==========================================
// 8. MIS CRÓNICAS (SOLUCIÓN ERROR 404)
// ==========================================

app.get('/api/mis-cronicas', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  const sqlDirigiendo = `SELECT p.*, e.nombre as evento_nombre FROM partidas p JOIN eventos e ON p.evento_id = e.id WHERE p.dungeon_master_id = ?`;
  const sqlJugando = `SELECT p.*, e.nombre as evento_nombre FROM inscripciones i JOIN partidas p ON i.partida_id = p.id JOIN eventos e ON p.evento_id = e.id WHERE i.usuario_id = ?`;
  
  db.query(sqlDirigiendo, [idUsuario], (err, dirigiendo) => {
    if (err) return res.status(500).json({ error: 'Error en crónicas.' });
    db.query(sqlJugando, [idUsuario], (err, jugando) => {
      if (err) return res.status(500).json({ error: 'Error en crónicas.' });
      res.json({ dirigiendo: dirigiendo || [], jugando: jugando || [] });
    });
  });
});

// ==========================================
// 9. ADMIN: ESTADÍSTICAS Y SOLICITUDES
// ==========================================

app.get('/api/admin/estadisticas', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  const sql = `
    SELECT e.nombre, COUNT(DISTINCT p.id) AS total_mesas, COUNT(i.id) AS total_jugadores
    FROM eventos e
    LEFT JOIN partidas p ON e.id = p.evento_id
    LEFT JOIN inscripciones i ON p.id = i.partida_id
    GROUP BY e.id ORDER BY e.fecha DESC`;
  db.query(sql, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error.' });
    res.json(resultados);
  });
});

app.get('/api/usuarios/solicitudes-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  const sql = "SELECT id, nombre, email FROM usuarios WHERE solicita_dm = 1 AND rol = 'jugador'";
  db.query(sql, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error.' });
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

// ==========================================
// 10. AUTH: REGISTRO Y LOGIN
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

// Rutas extras necesarias para el componente Partida.jsx
app.get('/api/partidas/:id/jugadores', verificarToken, (req, res) => {
  const sql = "SELECT u.id, u.nombre, u.email FROM usuarios u JOIN inscripciones i ON u.id = i.usuario_id WHERE i.partida_id = ?";
  db.query(sql, [req.params.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error.' });
    res.json(resultados);
  });
});

app.delete('/api/partidas/:id', verificarToken, (req, res) => {
  db.query("DELETE FROM partidas WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error.');
    res.send('Mesa disuelta.');
  });
});

// 11. ENCENDER EL SERVIDOR
const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
  console.log(`⚔️  Asociación de Rol La Pampa activa en puerto ${PUERTO}`);
});