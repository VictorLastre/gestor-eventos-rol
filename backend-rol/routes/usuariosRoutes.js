const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const bcrypt = require('bcrypt');

// ✨ FUNCIÓN DEL ESCRIBA: REGISTRO EN LA BITÁCORA
const registrarLog = (usuario, accion, descripcion) => {
  const sql = "INSERT INTO logs_actividad (usuario_id, nombre_usuario, accion, descripcion) VALUES (?, ?, ?, ?)";
  db.query(sql, [usuario.id, usuario.nombre, accion, descripcion], (err) => {
    if (err) console.error("❌ Error en bitácora (Usuarios):", err);
  });
};

// =======================================================
// 1. CRÓNICAS, SENADO (CONSULTAS) Y ESTADÍSTICAS
// =======================================================

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

// =======================================================
// 2. GESTIÓN Y ACCIONES DE USUARIO
// =======================================================

router.put('/perfil', verificarToken, async (req, res) => {
  const { nombre, nombre_completo, email, password, avatar, telegram_chat_id } = req.body;
  const idUsuario = req.usuario.id;

  try {
    let sql;
    let params;
    let cambioPass = false;

    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, password = ?, avatar = ?, telegram_chat_id = ? WHERE id = ?";
      params = [nombre, nombre_completo, email, hash, avatar, telegram_chat_id || null, idUsuario];
      cambioPass = true;
    } else {
      sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, avatar = ?, telegram_chat_id = ? WHERE id = ?";
      params = [nombre, nombre_completo, email, avatar, telegram_chat_id || null, idUsuario];
    }

    db.query(sql, params, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al actualizar el perfil.' });
      }
      
      registrarLog({ id: idUsuario, nombre }, 'ACTUALIZAR_PERFIL', `Actualizó sus datos de perfil${cambioPass ? ' (cambió contraseña)' : ''}.`);
      res.status(200).json({ mensaje: 'Perfil actualizado con éxito' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en la actualización.' });
  }
});

router.post('/solicitar-dm', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  const nombreUsuario = req.usuario.nombre;

  if (req.usuario.rol === 'dm' || req.usuario.rol === 'admin') {
    return res.status(400).json({ error: 'Ya eres miembro de la orden de Directores de Juego.' });
  }

  const sqlCheck = "SELECT solicita_dm, es_dm_nuevo FROM usuarios WHERE id = ?";
  db.query(sqlCheck, [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al consultar pergaminos.' });
    
    if (results.length > 0 && (results[0].solicita_dm === 1 || results[0].es_dm_nuevo === 1)) {
        return res.status(400).json({ error: 'Tu solicitud ya está siendo evaluada en el Senado.' });
    }

    const sql = "UPDATE usuarios SET solicita_dm = 1, es_dm_nuevo = 1 WHERE id = ?";
    db.query(sql, [idUsuario], (err) => {
      if (err) return res.status(500).json({ error: 'Error al grabar solicitud.' });

      registrarLog(req.usuario, 'SOLICITAR_DM', "Envió su solicitud de rango al senado.");

      db.query("SELECT id FROM usuarios WHERE rol = 'admin'", (err, admins) => {
        if (err || admins.length === 0) return;
        
        const mensajeNotif = `⚔️ ¡El aventurero ${nombreUsuario} solicita el rango de DM! Revisa las votaciones en el Senado.`;
        const notificationsValues = admins.map(admin => [admin.id, mensajeNotif]);
        
        db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES ?", [notificationsValues], (err) => {
           if (err) console.error("Error enviando cuervos de solicitud:", err);
        });
      });

      const io = req.app.get('io');
      if (io) io.emit('actualizacion-senado');

      res.status(200).json({ mensaje: 'Solicitud enviada al Senado con éxito.' });
    });
  });
});

// ✨ RUTAS DE ASCENSO MEJORADAS (Soportan PUT y POST para evitar desincronizaciones del frontend)
router.put('/:id/promover', verificarToken, promoverHandler);
router.post('/:id/promover', verificarToken, promoverHandler);

function promoverHandler(req, res) {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  
  const idUsuario = req.params.id;

  // IMPORTANTE: es_dm_nuevo = 1 para que le permita forjar el pergamino
  db.query("UPDATE usuarios SET rol = 'dm', solicita_dm = 0, es_dm_nuevo = 1 WHERE id = ?", [idUsuario], (err) => {
    if (err) return res.status(500).send('Error al forjar el ascenso.');
    
    db.query("SELECT nombre FROM usuarios WHERE id = ?", [idUsuario], (err, result) => {
        const nombrePromovido = result[0]?.nombre || 'Desconocido';
        registrarLog(req.usuario, 'PROMOVER_DM', `Promovió a ${nombrePromovido} al rango de Dungeon Master.`);
        
        const mensaje = `📜 ¡Felicidades! Los líderes del Gremio han aprobado tu ascenso. Ahora posees el rango de Director de Juego (DM).`;
        db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)", [idUsuario, mensaje]);
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion-usuarios');
      io.emit('actualizacion-solicitudes');
      io.emit('actualizacion-senado');
    }
    res.send('¡Ascenso completado!');
  });
}

// ✨ RUTA DE RECHAZO MEJORADA
router.put('/:id/rechazar-dm', verificarToken, rechazarHandler);
router.post('/:id/rechazar-dm', verificarToken, rechazarHandler);

function rechazarHandler(req, res) {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo admins.' });
  
  const idUsuario = req.params.id;

  db.query("UPDATE usuarios SET solicita_dm = 0, es_dm_nuevo = 0 WHERE id = ?", [idUsuario], (err) => {
    if (err) return res.status(500).json({ error: 'Error.' });

    db.query("SELECT nombre FROM usuarios WHERE id = ?", [idUsuario], (err, userRes) => {
       const nombreRechazado = userRes[0]?.nombre || 'Desconocido';
       registrarLog(req.usuario, 'RECHAZAR_DM', `Rechazó la solicitud de DM de ${nombreRechazado}.`);
       
       const mensaje = `⚠️ Tu solicitud para el rango de DM ha sido archivada por los líderes del Gremio.`;
       db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)", [idUsuario, mensaje]);
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion-usuarios');
      io.emit('actualizacion-senado');
    }
    
    res.json({ mensaje: 'Archivado.' });
  });
}

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

// ✨ RUTA SENADO: Ahora se llama /proponer-admin para coincidir con tu frontend
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

router.post('/votaciones/:id/votar', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo admins.' });

  const votacionId = req.params.id;
  const { voto } = req.body; 

  db.query("INSERT INTO votos_admin (votacion_id, admin_id, voto) VALUES (?, ?, ?)", [votacionId, req.usuario.id, voto], (err) => {
    if (err) return res.status(500).json({ error: 'Error al votar.' });

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

router.put('/:id/hard-reset', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los líderes del gremio tienen este poder.' });
  }

  const defaultPassword = 'Aventurero2026!'; 

  try {
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    db.query("UPDATE usuarios SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?", [hash, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Error al forzar la contraseña.' });
      
      db.query("SELECT nombre FROM usuarios WHERE id = ?", [req.params.id], (err, result) => {
          const nombreReseteado = result[0]?.nombre || 'Desconocido';
          registrarLog(req.usuario, 'HARD_RESET_PASS', `Hizo un hard reset a la contraseña de ${nombreReseteado}.`);
      });

      res.status(200).json({ 
        mensaje: 'Contraseña forjada con éxito', 
        temporal: defaultPassword 
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno en la magia del servidor.' });
  }
});

// =======================================================
// 3. NOTIFICACIONES Y CENSO GENERAL
// =======================================================

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
      const sql = `SELECT id, nombre, nombre_completo, email, rol, avatar, solicita_dm, es_dm_nuevo, telegram_chat_id FROM usuarios ORDER BY nombre ASC LIMIT ${limit} OFFSET ${offset}`;
      db.query(sql, (err, resultados) => {
        if (err) return res.status(500).json({ error: 'Error.' });
        res.json({ datos: resultados, paginacion: { paginaActual: page, totalPaginas: Math.ceil(countResult[0].total / limit) } });
      });
    });
});
  
router.get('/yo', verificarToken, (req, res) => {
    db.query("SELECT id, nombre, nombre_completo, email, rol, avatar, solicita_dm, es_dm_nuevo, telegram_chat_id FROM usuarios WHERE id = ?", [req.usuario.id], (err, resultados) => {
      if (err || resultados.length === 0) return res.status(404).json({ error: 'No encontrado.' });
      res.json(resultados[0]);
    });
});

module.exports = router;