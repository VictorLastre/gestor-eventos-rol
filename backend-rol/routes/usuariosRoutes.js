const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const bcrypt = require('bcrypt'); 

// 1. MIS CRÓNICAS (✨ FIX: Ahora se llama evento_fecha para que React lo lea bien)
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

// ✨ FIX: ACTUALIZAR PERFIL AHORA RECIBE Y GUARDA nombre_completo
router.put('/perfil', verificarToken, async (req, res) => {
  const { nombre, nombre_completo, email, password, avatar } = req.body;
  const idUsuario = req.usuario.id;

  try {
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      const sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, password = ?, avatar = ? WHERE id = ?";
      
      db.query(sql, [nombre, nombre_completo, email, hash, avatar, idUsuario], (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar tu ficha en el gremio.' });
        res.json({ mensaje: '¡Perfil, avatar y contraseña actualizados con éxito!' });
      });
    } else {
      const sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, avatar = ? WHERE id = ?";
      
      db.query(sql, [nombre, nombre_completo, email, avatar, idUsuario], (err) => {
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

// ✨ BUG SOLUCIONADO: AL ASCENDER A DM, SE MARCA COMO NUEVO
router.put('/:id/promover', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  
  // Agregamos es_dm_nuevo = 1
  const sql = "UPDATE usuarios SET rol = 'dm', solicita_dm = 0, es_dm_nuevo = 1 WHERE id = ?";
  
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al forjar el ascenso.');
    res.send('¡Ascenso completado!');
  });
});

// ✨ NUEVA RUTA: MARCAR CERTIFICADO COMO ENTREGADO
router.put('/:id/certificado-entregado', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo el Alto Mando puede realizar este rito.' });
  
  const sql = "UPDATE usuarios SET es_dm_nuevo = 0 WHERE id = ?";
  
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar el estado del DM.' });
    res.json({ mensaje: 'Rito de iniciación completado.' });
  });
});

router.put('/:id/rechazar-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  
  db.query("UPDATE usuarios SET solicita_dm = 0 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al rechazar la petición.');
    res.status(200).send('La petición ha sido denegada correctamente.');
  });
});

// RUTA PARA ASIGNAR ROL LIBREMENTE
router.put('/:id/rol', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes autoridad para otorgar títulos.' });
  }

  const { rol } = req.body; 
  const usuarioId = req.params.id;

  if (!['admin', 'dm', 'jugador'].includes(rol)) {
    return res.status(400).json({ error: 'Rango desconocido en el reino.' });
  }

  // ✨ SI LO BAJAN A JUGADOR O LO SUBEN A ADMIN, LE QUITAMOS LA ETIQUETA DE NUEVO POR LAS DUDAS
  let sqlUpdate = 'UPDATE usuarios SET rol = ?, solicita_dm = 0 WHERE id = ?';
  if (rol !== 'dm') {
      sqlUpdate = 'UPDATE usuarios SET rol = ?, solicita_dm = 0, es_dm_nuevo = 0 WHERE id = ?';
  } else {
      // Si un admin lo fuerza a ser DM manualmente (fuera de las peticiones), lo marcamos como nuevo
      sqlUpdate = 'UPDATE usuarios SET rol = ?, solicita_dm = 0, es_dm_nuevo = 1 WHERE id = ?';
  }

  db.query(sqlUpdate, [rol, usuarioId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al forjar el nuevo rango.' });
    }
    res.status(200).json({ mensaje: '¡El rango ha sido modificado con éxito!' });
  });
});

// ✨ SENADO 2: PROPONER A UN USUARIO PARA ADMIN
router.post('/:id/proponer-admin', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo los administradores pueden convocar al Senado.' });
  
  const candidatoId = req.params.id;
  const proponenteId = req.usuario.id;

  db.query("SELECT id FROM votaciones_admin WHERE candidato_id = ? AND estado = 'pendiente'", [candidatoId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al consultar el oráculo.' });
    if (results.length > 0) return res.status(400).json({ error: 'Ya hay una votación en curso para este aventurero.' });

    db.query("INSERT INTO votaciones_admin (candidato_id, proponente_id) VALUES (?, ?)", [candidatoId, proponenteId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al abrir la sesión en el Senado.' });
      
      const votacionId = result.insertId;
      db.query("INSERT INTO votos_admin (votacion_id, admin_id, voto) VALUES (?, ?, 'a favor')", [votacionId, proponenteId], (err) => {
        if (err) return res.status(500).json({ error: 'Votación creada, pero falló el registro de tu voto.' });
        res.json({ mensaje: '¡El Senado ha sido convocado! La votación está abierta.' });
      });
    });
  });
});

// ✨ SENADO 3: EMITIR UN VOTO EN UNA PROPUESTA
router.post('/votaciones/:id/votar', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo los administradores pueden votar.' });

  const votacionId = req.params.id;
  const adminId = req.usuario.id;
  const { voto } = req.body; 

  if (!['a favor', 'en contra'].includes(voto)) return res.status(400).json({ error: 'Voto inválido.' });

  db.query("INSERT INTO votos_admin (votacion_id, admin_id, voto) VALUES (?, ?, ?)", [votacionId, adminId, voto], (err) => {
    if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya has emitido tu voto en esta moción.' });
        return res.status(500).json({ error: 'Error al registrar tu voto en los pergaminos.' });
    }

    const sqlCheck = `
      SELECT 
        v.candidato_id,
        (SELECT COUNT(*) FROM votos_admin WHERE votacion_id = ? AND voto = 'a favor') as votos_favor,
        (SELECT COUNT(*) FROM votos_admin WHERE votacion_id = ? AND voto = 'en contra') as votos_contra,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') as total_admins
      FROM votaciones_admin v WHERE v.id = ?
    `;

    db.query(sqlCheck, [votacionId, votacionId, votacionId], (err, results) => {
      if (err || results.length === 0) return res.json({ mensaje: 'Voto registrado con éxito.' });

      const { candidato_id, votos_favor, votos_contra, total_admins } = results[0];
      const mayoria = Math.floor(total_admins / 2) + 1;

      if (votos_favor >= mayoria) {
        db.query("UPDATE usuarios SET rol = 'admin', solicita_dm = 0, es_dm_nuevo = 0 WHERE id = ?", [candidato_id]);
        db.query("UPDATE votaciones_admin SET estado = 'aprobada' WHERE id = ?", [votacionId]);
        return res.json({ mensaje: '¡La mayoría ha hablado! El aventurero ha sido ascendido a Administrador.', ascendido: true });
      } else if (votos_contra >= mayoria) {
        db.query("UPDATE votaciones_admin SET estado = 'rechazada' WHERE id = ?", [votacionId]);
        return res.json({ mensaje: 'La moción ha sido rechazada por mayoría del consejo.', rechazado: true });
      }

      res.json({ mensaje: 'Voto registrado con éxito en los archivos del Senado.' });
    });
  });
});

// ✨ NOTIFICACIONES 
router.get('/notificaciones', verificarToken, (req, res) => {
  const sql = "SELECT id, mensaje, fecha FROM notificaciones WHERE usuario_id = ? AND leida = FALSE ORDER BY fecha DESC";
  
  db.query(sql, [req.usuario.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar los cuervos mensajeros.' });
    res.json(resultados);
  });
});

router.put('/notificaciones/:id/leida', verificarToken, (req, res) => {
  const sql = "UPDATE notificaciones SET leida = TRUE WHERE id = ? AND usuario_id = ?";
  
  db.query(sql, [req.params.id, req.usuario.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al quemar el pergamino.' });
    res.json({ mensaje: 'Notificación descartada.' });
  });
});

// ✨ OBTENER CENSO: AÑADIMOS es_dm_nuevo AL SELECT Y nombre_completo
router.get('/', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado a los archivos secretos.' });
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const countSql = "SELECT COUNT(*) AS total FROM usuarios";
  
  db.query(countSql, (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Error al contar el censo del gremio.' });
    
    const totalUsuarios = countResult[0].total;
    const totalPaginas = Math.ceil(totalUsuarios / limit);

    // ✨ AÑADIMOS nombre_completo y es_dm_nuevo AQUÍ
    const sql = `SELECT id, nombre, nombre_completo, email, rol, avatar, solicita_dm, es_dm_nuevo FROM usuarios ORDER BY nombre ASC LIMIT ${limit} OFFSET ${offset}`;
    
    db.query(sql, (err, resultados) => {
      if (err) return res.status(500).json({ error: 'Error al consultar el censo del gremio.' });
      
      res.json({
        datos: resultados,
        paginacion: {
          paginaActual: page,
          totalPaginas: totalPaginas,
          totalUsuarios: totalUsuarios,
          limite: limit
        }
      });
    });
  });
});

module.exports = router;