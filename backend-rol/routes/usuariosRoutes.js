const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const bcrypt = require('bcrypt'); // ¡Vital para encriptar la nueva contraseña!

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

// === RUTA ACTUALIZADA: PERFIL Y AVATAR ===
router.put('/perfil', verificarToken, async (req, res) => {
  // Extraemos el avatar que nos manda el frontend
  const { nombre, email, password, avatar } = req.body;
  const idUsuario = req.usuario.id;

  try {
    // Si el aventurero forjó una nueva contraseña
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      // Agregamos el avatar al UPDATE
      const sql = "UPDATE usuarios SET nombre = ?, email = ?, password = ?, avatar = ? WHERE id = ?";
      
      db.query(sql, [nombre, email, hash, avatar, idUsuario], (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar tu ficha en el gremio.' });
        res.json({ mensaje: '¡Perfil, avatar y contraseña actualizados con éxito!' });
      });
    } 
    // Si solo está actualizando datos o avatar (sin tocar la contraseña)
    else {
      // Agregamos el avatar al UPDATE
      const sql = "UPDATE usuarios SET nombre = ?, email = ?, avatar = ? WHERE id = ?";
      
      db.query(sql, [nombre, email, avatar, idUsuario], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al actualizar tu ficha en el gremio.' });
        }
        res.json({ mensaje: '¡Perfil y avatar actualizados con éxito!' });
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno en la magia del servidor.' });
  }
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
  if (req.usuario.rol !== 'jugador') {
    return res.status(400).json({ error: 'Ya tienes rango o no puedes solicitarlo.' });
  }

  const sql = "UPDATE usuarios SET solicita_dm = 1 WHERE id = ?";
  
  db.query(sql, [req.usuario.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al enviar la petición.' });
    res.status(200).send('¡Tu solicitud ha sido enviada al gremio!');
  });
});

module.exports = router;