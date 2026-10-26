const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const bcrypt = require('bcrypt');
const { enviarMensajeTelegram } = require('../utils/telegram'); 

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
    SELECT p.*, e.nombre as evento_nombre, DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha, e.estado as evento_estado 
    FROM partidas p 
    JOIN eventos e ON p.evento_id = e.id 
    WHERE p.dungeon_master_id = ?
  `;
  
  const sqlJugando = `
    SELECT p.*, e.nombre as evento_nombre, DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha, e.estado as evento_estado, u.nombre as dm_nombre, i.estado as mi_estado
    FROM inscripciones i 
    JOIN partidas p ON i.partida_id = p.id 
    JOIN eventos e ON p.evento_id = e.id 
    JOIN usuarios u ON p.dungeon_master_id = u.id
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
    SELECT e.id, e.nombre, COUNT(DISTINCT p.id) AS total_mesas, COUNT(i.id) AS total_jugadores
    FROM eventos e LEFT JOIN partidas p ON e.id = p.evento_id LEFT JOIN inscripciones i ON p.id = i.partida_id
    GROUP BY e.id ORDER BY e.fecha DESC`;
  db.query(sql, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error.' });
    res.json(resultados);
  });
});

// ✨ ACTUALIZAR FECHA DE NACIMIENTO DIRECTA
router.put('/fecha-nacimiento', verificarToken, (req, res) => {
  const { fecha_nacimiento } = req.body;
  const idUsuario = req.usuario.id;

  if (!fecha_nacimiento) {
    return res.status(400).json({ error: 'La fecha de nacimiento es requerida.' });
  }

  const fechaNac = new Date(fecha_nacimiento);
  if (isNaN(fechaNac.getTime())) {
    return res.status(400).json({ error: 'La fecha ingresada no es válida.' });
  }

  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const m = hoy.getMonth() - fechaNac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }

  if (edad < 6 || edad > 110) {
    return res.status(400).json({ error: 'Debes ingresar una fecha válida (edad entre 6 y 110 años).' });
  }

  const sql = "UPDATE usuarios SET fecha_nacimiento = ? WHERE id = ?";
  db.query(sql, [fecha_nacimiento, idUsuario], (err) => {
    if (err) {
      console.error("Error al registrar fecha de nacimiento:", err);
      return res.status(500).json({ error: 'Error al registrar tu fecha de nacimiento.' });
    }

    registrarLog(req.usuario, 'ACTUALIZAR_EDAD', `Registró fecha de nacimiento: ${fecha_nacimiento} (${edad} años).`);

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-usuarios');

    res.json({ 
      mensaje: 'Fecha de nacimiento registrada correctamente.', 
      fecha_nacimiento, 
      edad 
    });
  });
});

// ✨ ACTUALIZAR PERFIL (Con registro en bitácora)
router.put('/perfil', verificarToken, async (req, res) => {
  const { nombre, nombre_completo, email, password, avatar, telegram_chat_id, biografia, fecha_nacimiento } = req.body;
  const idUsuario = req.usuario.id;

  try {
    let sql;
    let params;
    let cambioPass = false;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      if (fecha_nacimiento) {
        sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, password = ?, avatar = ?, telegram_chat_id = ?, biografia = ?, fecha_nacimiento = ? WHERE id = ?";
        params = [nombre, nombre_completo, email, hash, avatar, telegram_chat_id || null, biografia || null, fecha_nacimiento, idUsuario];
      } else {
        sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, password = ?, avatar = ?, telegram_chat_id = ?, biografia = ? WHERE id = ?";
        params = [nombre, nombre_completo, email, hash, avatar, telegram_chat_id || null, biografia || null, idUsuario];
      }
      cambioPass = true;
    } else {
      if (fecha_nacimiento) {
        sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, avatar = ?, telegram_chat_id = ?, biografia = ?, fecha_nacimiento = ? WHERE id = ?";
        params = [nombre, nombre_completo, email, avatar, telegram_chat_id || null, biografia || null, fecha_nacimiento, idUsuario];
      } else {
        sql = "UPDATE usuarios SET nombre = ?, nombre_completo = ?, email = ?, avatar = ?, telegram_chat_id = ?, biografia = ? WHERE id = ?";
        params = [nombre, nombre_completo, email, avatar, telegram_chat_id || null, biografia || null, idUsuario];
      }
    }

    db.query(sql, params, (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar tu ficha.' });
      
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
    
    registrarLog(req.usuario, 'PEDIDO_DM', 'Ha solicitado formalmente el rango de Dungeon Master.');

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-solicitudes');
    res.status(200).send('¡Tu solicitud ha sido enviada!');
  });
});

// Aceptamos tanto PUT como POST para evitar problemas de caché en el frontend
router.put('/:id/promover', verificarToken, promoverHandler);
router.post('/:id/promover', verificarToken, promoverHandler);

function promoverHandler(req, res) {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Denegado.' });
  
  db.query("UPDATE usuarios SET rol = 'dm', solicita_dm = 0, es_dm_nuevo = 1 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al forjar el ascenso.');
    
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
}

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

// ✨ HARD RESET DE CONTRASEÑA (NUEVO - SOLO PARA ADMINS)
router.put('/:id/hard-reset', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los líderes del gremio tienen este poder.' });
  }

  const defaultPassword = 'Aventurero2026!'; // Contraseña por defecto

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

// NOTIFICACIONES Y CENSO
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(2000, parseInt(req.query.limit, 10) || 10));
    const offset = Math.max(0, (page - 1) * limit);
    db.query("SELECT COUNT(*) AS total FROM usuarios", (err, countResult) => {
      if (err) {
        console.error('Error al contar usuarios:', err);
        return res.status(500).json({ error: 'Error al obtener usuarios.' });
      }
      const sql = "SELECT id, nombre, nombre_completo, email, rol, avatar, biografia, solicita_dm, es_dm_nuevo, telegram_chat_id, DATE_FORMAT(fecha_nacimiento, '%Y-%m-%d') as fecha_nacimiento, TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) as edad, IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id = usuarios.id), 0) as honor_total, IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id != usuarios.id), 0) as reputacion_neta FROM usuarios ORDER BY nombre ASC LIMIT ? OFFSET ?";
      db.query(sql, [limit, offset], (err, resultados) => {
        if (err) {
          console.error('Error al listar usuarios:', err);
          return res.status(500).json({ error: 'Error al obtener usuarios.' });
        }
        res.json({ datos: resultados, paginacion: { paginaActual: page, totalPaginas: Math.ceil(countResult[0].total / limit) } });
      });
    });
  });
  
  router.get('/yo', verificarToken, (req, res) => {
    db.query("SELECT id, nombre, nombre_completo, email, rol, avatar, biografia, solicita_dm, es_dm_nuevo, telegram_chat_id, DATE_FORMAT(fecha_nacimiento, '%Y-%m-%d') as fecha_nacimiento, TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) as edad, IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id = usuarios.id), 0) as honor_total, IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id != usuarios.id), 0) as reputacion_neta FROM usuarios WHERE id = ?", [req.usuario.id], (err, resultados) => {
      if (err || resultados.length === 0) return res.status(404).json({ error: 'No encontrado.' });
      res.json(resultados[0]);
    });
  });

  // ✨ PERFIL PÚBLICO DE CUALQUIER USUARIO
  router.get('/:id/perfil_publico', verificarToken, (req, res) => {
    const idObj = req.params.id;
    const sqlPerfil = `
      SELECT id, nombre, rol, avatar, biografia, 
      IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id = usuarios.id), 0) as honor_total,
      IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id != usuarios.id), 0) as reputacion_neta
      FROM usuarios WHERE id = ?`;

    db.query(sqlPerfil, [idObj], (err, resPerfil) => {
      if (err || resPerfil.length === 0) return res.status(404).json({ error: 'Aventurero no encontrado.' });
      
      const usuarioPublico = resPerfil[0];
      
      // Obtener mesas que dirigió
      const sqlDirigiendo = `
        SELECT p.id, p.titulo, p.etiqueta, e.nombre as evento_nombre, DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha, e.estado as evento_estado 
        FROM partidas p JOIN eventos e ON p.evento_id = e.id WHERE p.dungeon_master_id = ? ORDER BY e.fecha DESC
      `;
      // Obtener mesas que jugó
      const sqlJugando = `
        SELECT p.id, p.titulo, p.etiqueta, e.nombre as evento_nombre, DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha, e.estado as evento_estado 
        FROM inscripciones i JOIN partidas p ON i.partida_id = p.id JOIN eventos e ON p.evento_id = e.id WHERE i.usuario_id = ? ORDER BY e.fecha DESC
      `;
      
      db.query(sqlDirigiendo, [idObj], (err2, dirigiendo) => {
        if (err2) return res.status(500).json({ error: 'Error cargando crónicas.' });
        
        db.query(sqlJugando, [idObj], (err3, jugando) => {
          if (err3) return res.status(500).json({ error: 'Error cargando crónicas.' });
          
          db.query(`SELECT r.etiqueta, COUNT(*) as cantidad, (p.dungeon_master_id = r.evaluado_id) as es_dm FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = ? GROUP BY r.etiqueta, es_dm ORDER BY cantidad DESC LIMIT 3`, [idObj], (err4, topTags) => {
            res.json({
              ...usuarioPublico,
              dirigiendo,
              jugando,
              topTags: err4 ? [] : topTags
            });
          });
        });
      });
    });
  });

  // ✨ HONOR: Dar honor a un DM por una partida
  router.post('/honor', verificarToken, (req, res) => {
    const { dm_id, partida_id, mensaje } = req.body;
    const jugador_id = req.usuario.id;

    if (!dm_id || !partida_id) return res.status(400).json({ error: 'Datos incompletos.' });
    if (dm_id === jugador_id) return res.status(400).json({ error: 'No puedes darte honor a ti mismo.' });

    // Validar que el jugador efectivamente jugó esa partida
    db.query("SELECT * FROM inscripciones WHERE usuario_id = ? AND partida_id = ?", [jugador_id, partida_id], (err, insc) => {
      if (err) return res.status(500).json({ error: 'Error al verificar inscripción.' });
      if (insc.length === 0) return res.status(403).json({ error: 'No participaste en esta aventura.' });

      const sql = "INSERT INTO honor_dm (dm_id, jugador_id, partida_id, mensaje) VALUES (?, ?, ?, ?)";
      db.query(sql, [dm_id, jugador_id, partida_id, mensaje || ''], (err2) => {
        if (err2) {
          if (err2.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya otorgaste honor a este DM en esta partida.' });
          console.error(err2);
          return res.status(500).json({ error: 'Error al otorgar honor.' });
        }
        
        db.query("SELECT nombre FROM usuarios WHERE id = ?", [dm_id], (err3, dmInfo) => {
          const nombreDM = dmInfo[0] ? dmInfo[0].nombre : 'un Dungeon Master';
          registrarLog(req.usuario, 'OTORGAR_HONOR', `Le otorgó honor a ${nombreDM}.`);
        });

        res.json({ mensaje: '¡Honor otorgado con éxito!' });
      });
    });
  });

  // ✨ HONOR: Obtener la lista de partidas a las que el usuario ya dio honor
  router.get('/honor-otorgado', verificarToken, (req, res) => {
    db.query("SELECT partida_id FROM honor_dm WHERE jugador_id = ?", [req.usuario.id], (err, resultados) => {
      if (err) return res.status(500).json({ error: 'Error.' });
      // Devolver un array simple con los IDs de las partidas
      res.json(resultados.map(r => r.partida_id));
    });
  });


// GET RANKING (SALON DE LA FAMA)
router.get('/ranking/salon-fama', verificarToken, (req, res) => {
    // Calculamos el honor_total para DMs y la reputacion_neta para jugadores
    const sql = `
      SELECT 
        id, 
        nombre, 
        rol, 
        avatar, 
        IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id = usuarios.id), 0) as honor_total, 
        IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id != usuarios.id), 0) as reputacion_neta
      FROM usuarios
    `;
    
    db.query(sql, (err, resultados) => {
        if (err) return res.status(500).json({ error: 'Error al consultar el ranking.' });
        
        // Separar y ordenar
        const masters = resultados
            .filter(u => u.rol === 'dm' || u.rol === 'admin')
            .sort((a, b) => b.honor_total - a.honor_total);
            
        const jugadores = resultados
            // Puedes mostrar a todos o solo a los que no son DM. Si un DM también juega, debería aparecer. Mostraremos a todos.
            .sort((a, b) => b.reputacion_neta - a.reputacion_neta);

        res.json({ masters, jugadores });
    });
});


// ✨ NUEVO: VER LISTA DE BLOQUEADOS (Solo DM)
router.get('/bloqueos', verificarToken, (req, res) => {
  const dmId = req.usuario.id;

  const sql = `
    SELECT u.id, u.nombre, u.avatar 
    FROM bloqueos_jugadores b
    JOIN usuarios u ON b.jugador_id = u.id
    WHERE b.dm_id = ?
  `;

  db.query(sql, [dmId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al cargar bloqueos.' });
    res.json(resultados);
  });
});

// ✨ NUEVO: BLOQUEAR JUGADOR (Solo DM)
router.post('/bloqueos', verificarToken, (req, res) => {
  const dmId = req.usuario.id;
  const { jugador_id, motivo } = req.body;

  if (req.usuario.rol !== 'dm' && req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los Directores de Juego pueden usar la lista de bloqueos.' });
  }
  
  if (dmId === parseInt(jugador_id)) return res.status(400).json({ error: 'No puedes bloquearte a ti mismo.' });

  const textoMotivo = (motivo && typeof motivo === 'string' && motivo.trim() !== '') ? motivo.trim() : null;

  const sqlConMotivo = 'INSERT INTO bloqueos_jugadores (dm_id, jugador_id, motivo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE motivo = VALUES(motivo)';
  db.query(sqlConMotivo, [dmId, jugador_id, textoMotivo], (err) => {
    if (err) {
      // Fallback por si la columna motivo aún no fue creada en MySQL
      db.query('INSERT IGNORE INTO bloqueos_jugadores (dm_id, jugador_id) VALUES (?, ?)', [dmId, jugador_id], (err2) => {
        if (err2) return res.status(500).json({ error: 'Error al agregar a la lista de no deseados.' });
        res.json({ mensaje: 'Jugador añadido a tu lista de no deseados.' });
      });
      return;
    }
    res.json({ mensaje: 'Jugador añadido a tu lista de no deseados.' });
  });
});

// ✨ NUEVO: DESBLOQUEAR JUGADOR (Solo DM)
router.delete('/bloqueos/:jugador_id', verificarToken, (req, res) => {
  const dmId = req.usuario.id;
  const jugadorId = req.params.jugador_id;

  db.query('DELETE FROM bloqueos_jugadores WHERE dm_id = ? AND jugador_id = ?', [dmId, jugadorId], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al quitar de la lista de no deseados.' });
    res.json({ mensaje: 'Jugador removido de la lista.' });
  });
});


// =========================================================================
// ⚠️ GESTIÓN DE SANCIONES, ASISTENCIAS E INDULTOS (Solo Administradores)
// =========================================================================

// 1. Listar aventureros con métricas de asistencia y estado de sanción
router.get('/sanciones/listado', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo el Alto Mando puede gestionar sanciones.' });
  }

  try {
    const sqlUsuarios = `
      SELECT 
        u.id, 
        u.nombre, 
        u.nombre_completo, 
        u.email, 
        u.rol, 
        u.avatar, 
        u.telegram_chat_id,
        COUNT(CASE WHEN i.asistencia = 'ausente' THEN 1 END) as total_ausencias,
        COUNT(CASE WHEN i.asistencia = 'presente' THEN 1 END) as total_presentes,
        COUNT(CASE WHEN i.asistencia = 'justificado' THEN 1 END) as total_justificadas,
        COUNT(i.id) as total_inscripciones
      FROM usuarios u
      LEFT JOIN inscripciones i ON u.id = i.usuario_id
      LEFT JOIN partidas p ON i.partida_id = p.id
      GROUP BY u.id
    `;
    const [usuarios] = await db.promise().query(sqlUsuarios);

    const sqlHistorial = `
      SELECT i.usuario_id, i.asistencia, e.id as evento_id, e.fecha, e.nombre as evento_nombre
      FROM inscripciones i
      JOIN partidas p ON i.partida_id = p.id
      JOIN eventos e ON p.evento_id = e.id
      WHERE e.estado = 'Finalizado' AND i.asistencia IN ('presente', 'ausente')
      ORDER BY e.fecha DESC, p.id DESC
    `;
    const [historial] = await db.promise().query(sqlHistorial);

    const historialPorUsuario = {};
    for (const h of historial) {
      if (!historialPorUsuario[h.usuario_id]) {
        historialPorUsuario[h.usuario_id] = [];
      }
      historialPorUsuario[h.usuario_id].push(h);
    }

    const resultado = usuarios.map(u => {
      const asistenciasRecientes = historialPorUsuario[u.id] || [];
      let ausenciasConsecutivas = 0;
      for (const reg of asistenciasRecientes) {
        if (reg.asistencia === 'ausente') {
          ausenciasConsecutivas++;
        } else {
          break;
        }
      }

      const estaSancionado = ausenciasConsecutivas >= 2;

      return {
        id: u.id,
        nombre: u.nombre,
        nombre_completo: u.nombre_completo,
        email: u.email,
        rol: u.rol,
        avatar: u.avatar,
        telegram_chat_id: u.telegram_chat_id,
        total_ausencias: Number(u.total_ausencias) || 0,
        total_presentes: Number(u.total_presentes) || 0,
        total_justificadas: Number(u.total_justificadas) || 0,
        total_inscripciones: Number(u.total_inscripciones) || 0,
        ausencias_consecutivas: ausenciasConsecutivas,
        esta_sancionado: estaSancionado
      };
    });

    resultado.sort((a, b) => {
      if (a.esta_sancionado !== b.esta_sancionado) return b.esta_sancionado ? -1 : 1;
      if (a.ausencias_consecutivas !== b.ausencias_consecutivas) return b.ausencias_consecutivas - a.ausencias_consecutivas;
      if (a.total_ausencias !== b.total_ausencias) return b.total_ausencias - a.total_ausencias;
      return a.nombre.localeCompare(b.nombre);
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error al listar sanciones:', error);
    res.status(500).json({ error: 'Error del servidor al obtener listado de sanciones.' });
  }
});

// 2. Historial de asistencia detallado de un usuario
router.get('/:id/historial-asistencia', verificarToken, async (req, res) => {
  const usuarioId = parseInt(req.params.id, 10);
  if (req.usuario.rol !== 'admin' && req.usuario.id !== usuarioId) {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }

  try {
    const [usuarios] = await db.promise().query(
      "SELECT id, nombre, nombre_completo, email, rol, avatar, telegram_chat_id FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Aventurero no encontrado.' });
    }

    const sqlHistorial = `
      SELECT 
        i.id as inscripcion_id,
        i.usuario_id,
        i.partida_id,
        i.asistencia,
        i.estado as estado_inscripcion,
        p.titulo as partida_titulo,
        p.sistema as partida_sistema,
        dm.id as dm_id,
        dm.nombre as dm_nombre,
        e.id as evento_id,
        e.nombre as evento_nombre,
        e.estado as evento_estado,
        DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha,
        r.id as reputacion_id,
        r.voto as deshonor_voto,
        r.etiqueta as deshonor_etiqueta
      FROM inscripciones i
      JOIN partidas p ON i.partida_id = p.id
      JOIN eventos e ON p.evento_id = e.id
      LEFT JOIN usuarios dm ON p.dungeon_master_id = dm.id
      LEFT JOIN reputacion r ON (r.evaluado_id = i.usuario_id AND r.partida_id = p.id AND r.etiqueta = 'Falta sin aviso')
      WHERE i.usuario_id = ?
      ORDER BY e.fecha DESC, p.id DESC
    `;

    const [historial] = await db.promise().query(sqlHistorial, [usuarioId]);

    res.json({
      usuario: usuarios[0],
      historial: historial || []
    });
  } catch (error) {
    console.error('Error al obtener historial de asistencia:', error);
    res.status(500).json({ error: 'Error del servidor al obtener historial de asistencia.' });
  }
});

// 3. Justificar / Indultar una inasistencia específica
router.put('/sanciones/justificar', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los administradores pueden otorgar indultos o justificar faltas.' });
  }

  const { inscripcion_id, usuario_id, partida_id, motivo } = req.body;

  try {
    let sqlBusqueda = `
      SELECT i.id, i.usuario_id, i.partida_id, i.asistencia, 
             u.nombre as usuario_nombre, u.telegram_chat_id, 
             p.titulo as partida_titulo, e.nombre as evento_nombre
      FROM inscripciones i
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN partidas p ON i.partida_id = p.id
      JOIN eventos e ON p.evento_id = e.id
    `;
    let params = [];

    if (inscripcion_id) {
      sqlBusqueda += " WHERE i.id = ?";
      params = [inscripcion_id];
    } else if (usuario_id && partida_id) {
      sqlBusqueda += " WHERE i.usuario_id = ? AND i.partida_id = ?";
      params = [usuario_id, partida_id];
    } else {
      return res.status(400).json({ error: 'Se requiere inscripcion_id o usuario_id y partida_id.' });
    }

    const [inscripciones] = await db.promise().query(sqlBusqueda, params);
    if (inscripciones.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada.' });
    }

    const inscripcion = inscripciones[0];

    // Actualizar estado de asistencia a 'justificado'
    await db.promise().query(
      "UPDATE inscripciones SET asistencia = 'justificado' WHERE id = ?",
      [inscripcion.id]
    );

    // Retirar deshonor automático por falta sin aviso
    await db.promise().query(
      "DELETE FROM reputacion WHERE evaluado_id = ? AND partida_id = ? AND etiqueta = 'Falta sin aviso'",
      [inscripcion.usuario_id, inscripcion.partida_id]
    );

    // Registrar en la Bitácora
    const motivoTexto = (motivo && motivo.trim()) ? motivo.trim() : 'Justificación administrativa del Consejo';
    registrarLog(
      req.usuario,
      'JUSTIFICAR_FALTA',
      `Indulto concedido a ${inscripcion.usuario_nombre} en la mesa "${inscripcion.partida_titulo}" (${inscripcion.evento_nombre}). Motivo: ${motivoTexto}`
    );

    // Notificación in-app
    const mensajeNotif = `⚖️ El Alto Mando del Gremio ha justificado tu inasistencia en la mesa "${inscripcion.partida_titulo}". Se ha retirado la penalización de deshonor y tu derecho a inscripción ha sido restituido.${motivo ? ` Motivo: "${motivo}".` : ''}`;
    await db.promise().query(
      "INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)",
      [inscripcion.usuario_id, mensajeNotif]
    );

    // Notificación vía Telegram
    if (inscripcion.telegram_chat_id) {
      const msgTelegram = `⚖️ <b>Resolución del Gremio - Indulto Concedido</b>

` +
        `Estimado/a aventurero/a <b>${inscripcion.usuario_nombre}</b>:
` +
        `Tu inasistencia en la mesa <b>"${inscripcion.partida_titulo}"</b> (${inscripcion.evento_nombre}) ha sido justificada por la Administración.

` +
        `✨ <i>Motivo:</i> ${motivoTexto}

` +
        `Se ha removido el deshonor de tu hoja de aventurero y se restableció tu inscripción para próximas jornadas.`;
      enviarMensajeTelegram(inscripcion.telegram_chat_id, msgTelegram).catch(err => console.error('Error enviando Telegram de indulto:', err));
    }

    // Emisión de Sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion-sanciones');
      io.emit('actualizacion-usuarios');
      io.emit('actualizacion-notificaciones');
      io.emit('actualizacion-mesas');
    }

    res.json({ 
      mensaje: `Inasistencia en "${inscripcion.partida_titulo}" justificada con éxito para ${inscripcion.usuario_nombre}. Se ha retirado el deshonor.` 
    });
  } catch (error) {
    console.error('Error al justificar inasistencia:', error);
    res.status(500).json({ error: 'Error del servidor al justificar inasistencia.' });
  }
});

// 4. Indulto Total (perdonar todas las ausencias pendientes de un aventurero)
router.put('/sanciones/indulto-total', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los administradores pueden otorgar un indulto total.' });
  }

  const { usuario_id, motivo } = req.body;
  if (!usuario_id) return res.status(400).json({ error: 'usuario_id es requerido.' });

  try {
    const [usuarios] = await db.promise().query(
      "SELECT id, nombre, telegram_chat_id FROM usuarios WHERE id = ?",
      [usuario_id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Aventurero no encontrado.' });
    }

    const usuario = usuarios[0];
    const motivoTexto = (motivo && motivo.trim()) ? motivo.trim() : 'Indulto general otorgado por el Alto Mando';

    // Cambiar todas las inasistencias 'ausente' a 'justificado'
    const [resUpdate] = await db.promise().query(
      "UPDATE inscripciones SET asistencia = 'justificado' WHERE usuario_id = ? AND asistencia = 'ausente'",
      [usuario_id]
    );

    // Eliminar todas las sanciones de deshonor por falta
    await db.promise().query(
      "DELETE FROM reputacion WHERE evaluado_id = ? AND etiqueta = 'Falta sin aviso'",
      [usuario_id]
    );

    // Bitácora
    registrarLog(
      req.usuario,
      'INDULTO_TOTAL',
      `Indulto total concedido a ${usuario.nombre} (${resUpdate.affectedRows} faltas justificadas). Motivo: ${motivoTexto}`
    );

    // Notificación in-app
    const msgNotif = `⚖️ ¡El Alto Mando del Gremio ha concedido un Indulto Total a tu favor! Todas tus inasistencias previas han sido justificadas, tu honor ha sido limpiado y quedas plenamente habilitado para unirte a nuevas aventuras.${motivo ? ` Motivo: "${motivo}".` : ''}`;
    await db.promise().query(
      "INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)",
      [usuario_id, msgNotif]
    );

    // Telegram
    if (usuario.telegram_chat_id) {
      const msgTelegram = `⚖️ <b>Resolución Extraordinaria del Gremio - ¡Indulto Total!</b>

` +
        `Estimado/a aventurero/a <b>${usuario.nombre}</b>:
` +
        `El Alto Mando ha otorgado un <b>Indulto Total</b> a tu favor.
` +
        `✨ Todas tus inasistencias pasadas han sido justificadas y cualquier restricción para participar de nuevas jornadas ha sido levantada.

` +
        `<i>Motivo:</i> ${motivoTexto}`;
      enviarMensajeTelegram(usuario.telegram_chat_id, msgTelegram).catch(err => console.error('Error enviando Telegram indulto total:', err));
    }

    // Sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion-sanciones');
      io.emit('actualizacion-usuarios');
      io.emit('actualizacion-notificaciones');
      io.emit('actualizacion-mesas');
    }

    res.json({
      mensaje: `Indulto total concedido a ${usuario.nombre}. Se justificaron ${resUpdate.affectedRows} inasistencias.`
    });
  } catch (error) {
    console.error('Error al aplicar indulto total:', error);
    res.status(500).json({ error: 'Error del servidor al aplicar indulto total.' });
  }
});

module.exports = router;
