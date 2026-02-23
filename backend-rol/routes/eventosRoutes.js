const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

router.get('/', (req, res) => {
  db.query('SELECT * FROM eventos ORDER BY fecha DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los eventos' });
    res.json(resultados);
  });
});

router.post('/', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo Admins.' });
  const { nombre, descripcion, fecha } = req.body;
  db.query('INSERT INTO eventos (nombre, descripcion, fecha) VALUES (?, ?, ?)', [nombre, descripcion, fecha], (err) => {
    if (err) return res.status(500).json({ error: 'Error al crear evento.' });
    res.status(201).json({ mensaje: '¡Evento convocado!' });
  });
});

router.get('/:id/partidas', verificarToken, (req, res) => {
  const sql = `
    SELECT 
      p.id, p.evento_id, p.dungeon_master_id, p.titulo, p.descripcion, p.requisitos, p.sistema, p.cupo, p.turno, p.estado,
      u.nombre AS dmNombre, 
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id) AS jugadoresIniciales,
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id AND usuario_id = ?) AS anotadoInicialmente
    FROM partidas p JOIN usuarios u ON p.dungeon_master_id = u.id
    WHERE p.evento_id = ? GROUP BY p.id
  `;
  db.query(sql, [req.usuario.id, req.params.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar las mesas.' });
    res.json(resultados);
  });
});

// NUEVA LÓGICA: Candado para evitar DMs duplicados en el mismo evento
router.post('/:id/partidas', verificarToken, (req, res) => {
  if (req.usuario.rol === 'jugador') return res.status(403).json({ error: 'Solo DMs y Admins pueden crear mesas.' });
  
  const eventoId = req.params.id;
  const dmId = req.usuario.id;

  // 1. Verificamos si el DM ya tiene una mesa en este evento específico
  const sqlCheck = "SELECT id FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?";
  
  db.query(sqlCheck, [eventoId, dmId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar los registros del gremio.' });
    
    // Si ya existe un registro, bloqueamos la creación
    if (resultados.length > 0) {
      return res.status(400).json({ error: 'Ya estás dirigiendo una mesa en este evento. No puedes desdoblarte.' });
    }

    // 2. Si pasa la prueba, insertamos la nueva mesa
    const { titulo, descripcion, requisitos, sistema, cupo, turno } = req.body;
    const sqlInsert = `INSERT INTO partidas (evento_id, dungeon_master_id, titulo, descripcion, requisitos, sistema, cupo, turno, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'abierta')`;
    
    db.query(sqlInsert, [eventoId, dmId, titulo, descripcion, requisitos, sistema, cupo, turno], (err) => {
      if (err) return res.status(500).json({ error: 'Error al crear la mesa.' });
      res.status(201).json({ mensaje: '¡Mesa creada con éxito!' });
    });
  });
});

module.exports = router;