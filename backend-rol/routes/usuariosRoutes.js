const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

router.get('/mis-cronicas', verificarToken, (req, res) => {
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

router.get('/solicitudes-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  db.query("SELECT id, nombre, email FROM usuarios WHERE solicita_dm = 1 AND rol = 'jugador'", (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error.' });
    res.json(resultados || []);
  });
});

router.put('/:id/promover', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  db.query("UPDATE usuarios SET rol = 'dm', solicita_dm = 0 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error.');
    res.send('¡Ascenso completado!');
  });
});

router.get('/estadisticas', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  const sql = `
    SELECT e.nombre, COUNT(DISTINCT p.id) AS total_mesas, COUNT(i.id) AS total_jugadores
    FROM eventos e LEFT JOIN partidas p ON e.id = p.evento_id LEFT JOIN inscripciones i ON p.id = i.partida_id
    GROUP BY e.id ORDER BY e.fecha DESC`;
  db.query(sql, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error.' });
    res.json(resultados);
  });
});

// Ruta para que un jugador pida ser DM
router.post('/solicitar-dm', verificarToken, (req, res) => {
  // Verificamos que sea un jugador
  if (req.usuario.rol !== 'jugador') {
    return res.status(400).json({ error: 'Ya tienes rango o no puedes solicitarlo.' });
  }

  // Actualizamos su ficha en la base de datos (solicita_dm = 1)
  const sql = "UPDATE usuarios SET solicita_dm = 1 WHERE id = ?";
  
  db.query(sql, [req.usuario.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al enviar la petición.' });
    res.status(200).send('¡Tu solicitud ha sido enviada al gremio!');
  });
});

module.exports = router;