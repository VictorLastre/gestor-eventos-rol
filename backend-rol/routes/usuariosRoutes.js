const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const bcrypt = require('bcrypt'); 

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

router.put('/perfil', verificarToken, async (req, res) => {
  const { nombre, email, password, avatar } = req.body;
  const idUsuario = req.usuario.id;

  try {
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      const sql = "UPDATE usuarios SET nombre = ?, email = ?, password = ?, avatar = ? WHERE id = ?";
      
      db.query(sql, [nombre, email, hash, avatar, idUsuario], (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar tu ficha en el gremio.' });
        res.json({ mensaje: '¡Perfil, avatar y contraseña actualizados con éxito!' });
      });
    } else {
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

// ✨ RUTA PARA RECHAZAR LA PETICIÓN
router.put('/:id/rechazar-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  
  // Limpiamos el flag de solicita_dm poniéndolo en 0
  db.query("UPDATE usuarios SET solicita_dm = 0 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al rechazar la petición.');
    res.status(200).send('La petición ha sido denegada correctamente.');
  });
});

// ✨ NUEVA RUTA: CAMBIAR ROL LIBREMENTE (Solo Admins)
router.put('/:id/rol', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes autoridad para otorgar títulos.' });
  }

  const { rol } = req.body; 
  const usuarioId = req.params.id;

  if (!['admin', 'dm', 'jugador'].includes(rol)) {
    return res.status(400).json({ error: 'Rango desconocido en el reino.' });
  }

  // Actualizamos el rol y limpiamos cualquier solicitud de DM pendiente por las dudas
  const sqlUpdate = 'UPDATE usuarios SET rol = ?, solicita_dm = 0 WHERE id = ?';
  db.query(sqlUpdate, [rol, usuarioId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al forjar el nuevo rango.' });
    }
    res.status(200).json({ mensaje: '¡El rango ha sido modificado con éxito!' });
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

router.get('/', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado a los archivos secretos.' });
  
  const sql = "SELECT id, nombre, email, rol, avatar, solicita_dm FROM usuarios ORDER BY nombre ASC";
  
  db.query(sql, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar el censo del gremio.' });
    res.json(resultados);
  });
});

module.exports = router;