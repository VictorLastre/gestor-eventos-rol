const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const bcrypt = require('bcrypt'); 

// ✨ FUNCIÓN DEL ESCRIBA: REGISTRO EN LA BITÁCORA
const registrarLog = (usuario, accion, descripcion) => {
  const sql = "INSERT INTO logs_actividad (usuario_id, nombre_usuario, accion, descripcion) VALUES (?, ?, ?, ?)";
  db.query(sql, [usuario.id, usuario.nombre, accion, descripcion], (err) => {
    if (err) console.error("❌ Error en bitácora:", err);
  });
};

// 1. MIS CRÓNICAS
router.get('/mis-cronicas', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;

  const sqlDirigiendo = `
    SELECT p.*, e.nombre as evento_nombre, DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha 
    FROM partidas p 
    JOIN eventos e ON p.evento_id = e.id 
    WHERE p.dungeon_master_id = ?
  `;
  
  const sqlJugando = `
    SELECT p.*, e.nombre as evento_nombre, DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha 
    FROM inscripciones i 
    JOIN partidas p ON i.partida_id = p.id 
    JOIN eventos e ON p.evento_id = e.id 
    WHERE i.usuario_id = ?
  `;
  
  db.query(sqlDirigiendo, [idUsuario], (err, dirigiendo) => {
    if (err) return res.status(500).json({ error: 'Error en crónicas de DM.' });
    
    db.query(sqlJugando, [idUsuario], (err, jugando) => {
      if (err) return res.status(500).json({ error: 'Error en crónicas de jugador.' });
      
      res.json({ 
        dirigiendo: dirigiendo || [], 
        jugando: jugando || [] 
      });
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

// ✨ SENADO 1: OBTENER VOTACIONES ACTIVAS
router.get('/votaciones/activas', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });

  const sql = `
    SELECT v.id, v.candidato_id, v.estado, c.nombre as candidato_nombre, p.nombre as proponente_nombre,
    (SELECT COUNT(*) FROM votos_admin WHERE votacion_id = v.id AND voto = 'a favor') as votos_favor,
    (SELECT COUNT(*) FROM votos_admin WHERE votacion_id = v.id AND voto = 'en contra') as votos_contra,
    (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') as total_admins,
    (SELECT COUNT(*) FROM votos_admin WHERE votacion_id = v.id AND admin_id = ?) as ya_vote
    FROM votaciones_admin v
    JOIN usuarios c ON v.candidato_id = c.id
    JOIN usuarios p ON v.proponente_id = p.id
    WHERE v.estado = 'pendiente'
  `;

  db.query(sql, [req.usuario.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar el Senado.' });
    res.json(resultados);
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

// ✨ ACTUALIZAR PERFIL (Con registro en bitácora)
router.put('/perfil', verificarToken, async (req, res) => {
  const { nombre, nombre_completo, email, password, avatar } = req.body;
  const idUsuario = req.usuario.id;

  try {
    let sql;
    let params;
    let cambioPass = false;

    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, password = ?, avatar = ? WHERE id = ?";
      params = [nombre, nombre_completo, email, hash, avatar, idUsuario];
      cambioPass = true;
    } else {
      sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, avatar = ? WHERE id = ?";
      params = [nombre, nombre_completo, email, avatar, idUsuario];
    }

    db.query(sql, params, (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar tu ficha.' });
      
      // Registro en bitácora
      registrarLog(req.usuario, 'ACTUALIZAR_PERFIL', `Actualizó sus datos de aventurero${cambioPass ? ' (incluyendo contraseña)' : ''}.`);
      
      res.json({ mensaje: '¡Perfil actualizado con éxito!' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno en la magia del servidor.' });
  }
});

router.post('/solicitar-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'jugador') {
    return res.status(400).json({ error: 'Ya tienes rango o no puedes solicitarlo.' });
  }

  db.query("UPDATE usuarios SET solicita_dm = 1 WHERE id = ?", [req.usuario.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al enviar la petición.' });
    
    // Registro en bitácora
    registrarLog(req.usuario, 'PEDIDO_DM', 'Ha solicitado formalmente el rango de Dungeon Master.');

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-solicitudes');
    res.status(200).send('¡Tu solicitud ha sido enviada!');
  });
});

router.put('/:id/promover', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  
  db.query("UPDATE usuarios SET rol = 'dm', solicita_dm = 0, es_dm_nuevo = 1 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al forjar el ascenso.');
    
    // Registro en bitácora (necesitamos saber a quién promovió)
    db.query("SELECT nombre FROM usuarios WHERE id = ?", [req.params.id], (err, result) => {
        const nombrePromovido = result[0]?.nombre || 'Desconocido';
        registrarLog(req.usuario, 'PROMOVER_DM', `Promovió a ${nombrePromovido} al rango de Dungeon Master.`);
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion-usuarios');
      io.emit('actualizacion-solicitudes');
    }
    res.send('¡Ascenso completado!');
  });
});

router.put('/:id/rechazar-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  
  db.query("UPDATE usuarios SET solicita_dm = 0 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al rechazar la petición.');
    
    db.query("SELECT nombre FROM usuarios WHERE id = ?", [req.params.id], (err, result) => {
        const nombreRechazado = result[0]?.nombre || 'Desconocido';
        registrarLog(req.usuario, 'RECHAZAR_DM', `Denegó la solicitud de DM de ${nombreRechazado}.`);
    });

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-solicitudes');
    res.status(200).send('Petición denegada.');
  });
});

router.put('/:id/rol', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Sin autoridad.' });

  const { rol } = req.body; 
  const usuarioId = req.params.id;
  let sqlUpdate = rol === 'dm' ? 
    'UPDATE usuarios SET rol = ?, solicita_dm = 0, es_dm_nuevo = 1 WHERE id = ?' : 
    'UPDATE usuarios SET rol = ?, solicita_dm = 0, es_dm_nuevo = 0 WHERE id = ?';

  db.query(sqlUpdate, [rol, usuarioId], (err) => {
    if (err) return res.status(500).json({ error: 'Error.' });
    
    db.query("SELECT nombre FROM usuarios WHERE id = ?", [usuarioId], (err, result) => {
        registrarLog(req.usuario, 'CAMBIO_ROL_MANUAL', `Cambió el rango de ${result[0]?.nombre} a ${rol.toUpperCase()}.`);
    });

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-usuarios');
    res.status(200).json({ mensaje: 'Rango modificado.' });
  });
});

// ✨ SENADO: PROPONER ADMIN
router.post('/:id/proponer-admin', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo admins.' });
  
  const candidatoId = req.params.id;

  db.query("SELECT nombre FROM usuarios WHERE id = ?", [candidatoId], (err, userRes) => {
    const nombreCandidato = userRes[0]?.nombre;

    db.query("INSERT INTO votaciones_admin (candidato_id, proponente_id) VALUES (?, ?)", [candidatoId, req.usuario.id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error.' });
      
      const votacionId = result.insertId;
      db.query("INSERT INTO votos_admin (votacion_id, admin_id, voto) VALUES (?, ?, 'a favor')", [votacionId, req.usuario.id], (err) => {
        
        registrarLog(req.usuario, 'PROPUESTA_SENADO', `Abrió una votación para ascender a ${nombreCandidato} a Administrador.`);

        const io = req.app.get('io');
        if (io) io.emit('actualizacion-senado');
        res.json({ mensaje: '¡Senado convocado!' });
      });
    });
  });
});

// ✨ SENADO: VOTAR
router.post('/votaciones/:id/votar', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo admins.' });

  const votacionId = req.params.id;
  const { voto } = req.body; 

  db.query("INSERT INTO votos_admin (votacion_id, admin_id, voto) VALUES (?, ?, ?)", [votacionId, req.usuario.id, voto], (err) => {
    if (err) return res.status(500).json({ error: 'Error al votar.' });

    // Registro del voto individual
    db.query("SELECT c.nombre FROM votaciones_admin v JOIN usuarios c ON v.candidato_id = c.id WHERE v.id = ?", [votacionId], (err, resV) => {
        registrarLog(req.usuario, 'VOTO_SENADO', `Votó "${voto}" en la propuesta de ${resV[0]?.nombre}.`);
    });

    const sqlCheck = `
      SELECT v.candidato_id, c.nombre as candidato_nombre,
      (SELECT COUNT(*) FROM votos_admin WHERE votacion_id = ? AND voto = 'a favor') as votos_favor,
      (SELECT COUNT(*) FROM votos_admin WHERE votacion_id = ? AND voto = 'en contra') as votos_contra,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') as total_admins
      FROM votaciones_admin v JOIN usuarios c ON v.candidato_id = c.id WHERE v.id = ?
    `;

    db.query(sqlCheck, [votacionId, votacionId, votacionId], (err, results) => {
      if (err || results.length === 0) return res.json({ mensaje: 'Voto registrado.' });

      const { candidato_id, candidato_nombre, votos_favor, votos_contra, total_admins } = results[0];
      const mayoria = Math.floor(total_admins / 2) + 1;
      const io = req.app.get('io');

      if (votos_favor >= mayoria) {
        db.query("UPDATE usuarios SET rol = 'admin', solicita_dm = 0, es_dm_nuevo = 0 WHERE id = ?", [candidato_id]);
        db.query("UPDATE votaciones_admin SET estado = 'aprobada' WHERE id = ?", [votacionId]);
        registrarLog({id: 0, nombre: 'SENADO'}, 'CIERRE_VOTACION', `La propuesta para ${candidato_nombre} fue APROBADA.`);
        if (io) { io.emit('actualizacion-senado'); io.emit('actualizacion-usuarios'); }
      } else if (votos_contra >= mayoria) {
        db.query("UPDATE votaciones_admin SET estado = 'rechazada' WHERE id = ?", [votacionId]);
        registrarLog({id: 0, nombre: 'SENADO'}, 'CIERRE_VOTACION', `La propuesta para ${candidato_nombre} fue RECHAZADA.`);
        if (io) io.emit('actualizacion-senado');
      }
      res.json({ mensaje: 'Voto registrado.' });
    });
  });
});

// (Resto de rutas de notificaciones y censo se mantienen igual...)
router.get('/notificaciones', verificarToken, (req, res) => {
    const sql = "SELECT id, mensaje, fecha FROM notificaciones WHERE usuario_id = ? AND leida = FALSE ORDER BY fecha DESC";
    db.query(sql, [req.usuario.id], (err, resultados) => {
      if (err) return res.status(500).json({ error: 'Error.' });
      res.json(resultados);
    });
  });
  
  router.put('/notificaciones/:id/leida', verificarToken, (req, res) => {
    const sql = "UPDATE notificaciones SET leida = TRUE WHERE id = ? AND usuario_id = ?";
    db.query(sql, [req.params.id, req.usuario.id], (err) => {
      if (err) return res.status(500).json({ error: 'Error.' });
      res.json({ mensaje: 'Leída.' });
    });
  });
  
  router.get('/', verificarToken, (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    db.query("SELECT COUNT(*) AS total FROM usuarios", (err, countResult) => {
      if (err) return res.status(500).json({ error: 'Error.' });
      const sql = `SELECT id, nombre, nombre_completo, email, rol, avatar, solicita_dm, es_dm_nuevo FROM usuarios ORDER BY nombre ASC LIMIT ${limit} OFFSET ${offset}`;
      db.query(sql, (err, resultados) => {
        if (err) return res.status(500).json({ error: 'Error.' });
        res.json({ datos: resultados, paginacion: { paginaActual: page, totalPaginas: Math.ceil(countResult[0].total / limit) } });
      });
    });
  });
  
  router.get('/yo', verificarToken, (req, res) => {
    db.query("SELECT id, nombre, nombre_completo, email, rol, avatar, solicita_dm, es_dm_nuevo FROM usuarios WHERE id = ?", [req.usuario.id], (err, resultados) => {
      if (err || resultados.length === 0) return res.status(404).json({ error: 'No encontrado.' });
      res.json(resultados[0]);
    });
  });

module.exports = router;