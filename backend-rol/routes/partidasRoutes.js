const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const { enviarMensajeAlCanal, enviarMensajeTelegram } = require('../utils/telegram');

// âœ¨ FUNCIÃ“N DEL ESCRIBA: REGISTRO EN LA BITÃCORA
const registrarLog = (usuario, accion, descripcion) => {
  const sql = "INSERT INTO logs_actividad (usuario_id, nombre_usuario, accion, descripcion) VALUES (?, ?, ?, ?)";
  db.query(sql, [usuario.id, usuario.nombre, accion, descripcion], (err) => {
    if (err) console.error("âŒ Error en bitÃ¡cora:", err);
  });
};

// âœ¨ ESTADÃSTICAS: Obtener el Top de Sistemas MÃ¡s Jugados (Rol)
router.get('/estadisticas/sistemas', verificarToken, (req, res) => {
  const eventoId = req.query.eventoId;
  let sql = `
    SELECT 
      s.nombre as sistema, 
      COUNT(p.id) as cantidad 
    FROM partidas p
    JOIN sistemas s ON p.sistema_id = s.id
    WHERE p.etiqueta != 'Juegos de Mesa' -- Solo contamos estadÃ­sticas de rol
  `;
  const params = [];
  if (eventoId) {
    sql += " AND p.evento_id = ?";
    params.push(eventoId);
  }
  sql += " GROUP BY p.sistema_id, s.nombre ORDER BY cantidad DESC LIMIT 5";
  
  db.query(sql, params, (err, resultados) => {
    if (err) {
      console.error("Error al consultar el OrÃ¡culo de Sistemas:", err);
      let sqlFallback = `SELECT sistema, COUNT(*) as cantidad FROM partidas WHERE etiqueta != 'Juegos de Mesa'`;
      if (eventoId) sqlFallback += ` AND evento_id = ${db.escape(eventoId)}`;
      sqlFallback += ` GROUP BY sistema ORDER BY cantidad DESC LIMIT 5`;
      return db.query(sqlFallback, (errFB, resFB) => {
        if(errFB) return res.status(500).json({ error: 'Error leyendo los sistemas mÃ¡s jugados.' });
        res.json(resFB);
      });
    }
    res.json(resultados);
  });
});

// âœ¨ ESTADÃSTICAS: Obtener el Top de Juegos de Mesa
router.get('/estadisticas/juegos-mesa', verificarToken, (req, res) => {
  const eventoId = req.query.eventoId;
  let sql = `
    SELECT sistema, COUNT(*) as cantidad 
    FROM partidas 
    WHERE etiqueta = 'Juegos de Mesa' 
  `;
  const params = [];
  if (eventoId) {
    sql += " AND evento_id = ?";
    params.push(eventoId);
  }
  sql += " GROUP BY sistema ORDER BY cantidad DESC LIMIT 5";
  
  db.query(sql, params, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los juegos de mesa.' });
    res.json(resultados);
  });
});

// âœ¨ CREACIÃ“N: Forjar una nueva mesa/partida (Flexibilizada para Juegos de Mesa y Protegida contra ubicuidad)
router.post('/', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  const rolUsuario = req.usuario.rol;
  const { titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, evento_id } = req.body;

  const esOrganizadorValido = rolUsuario === 'dm' || rolUsuario === 'admin';
  const esMesaJuegoValida = (rolUsuario === 'jugador' || rolUsuario === 'aventurero') && etiqueta === 'Juegos de Mesa';

  if (!esOrganizadorValido && !esMesaJuegoValida) {
    return res.status(403).json({ 
      error: 'Solo los Directores de Juego pueden convocar aventuras de Rol. Como Jugador, solo puedes organizar Juegos de Mesa.' 
    });
  }

  const sqlValidarParticipacion = `
    SELECT 
      (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_creador,
      (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador,
      (SELECT COUNT(*) FROM escape_inscripciones ei JOIN escape_turnos et ON ei.escape_turno_id = et.id JOIN escape_rooms er ON et.escape_room_id = er.id WHERE er.evento_id = ? AND ei.usuario_id = ?) as es_escape
  `;

  db.query(sqlValidarParticipacion, [evento_id, idUsuario, evento_id, idUsuario, evento_id, idUsuario], (err, participacion) => {
    if (err) return res.status(500).json({ error: 'Error al consultar tus compromisos en el Gremio.' });

    const { es_creador, es_jugador, es_escape } = participacion[0];

    if (es_creador > 0 || es_jugador > 0 || es_escape > 0) {
      return res.status(400).json({ 
        error: 'No puedes organizar esta mesa porque ya tienes otro compromiso (como jugador, creador o en un Escape Room) en este evento.' 
      });
    }

    const sqlInsert = `
      INSERT INTO partidas 
      (titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, evento_id, dungeon_master_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlInsert, [titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, evento_id, idUsuario], (err, resultado) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al forjar la mesa en la base de datos.' });
      }

      const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'CONVOCAR_JUEGO' : 'CREAR_MESA';
      const descLog = etiqueta === 'Juegos de Mesa' 
        ? `ConvocÃ³ el juego de mesa "${titulo}" para "${sistema}".`
        : `AbriÃ³ la mesa de Rol "${titulo}" usando el sistema "${sistema}".`;
        
      registrarLog(req.usuario, tipoMesaLog, descLog);

      // âœ¨ ANUNCIO EN TELEGRAM (Canal)
      db.query("SELECT nombre FROM eventos WHERE id = ?", [evento_id], (errEv, resEv) => {
        const nombreEvento = resEv && resEv[0]?.nombre || "Jornada";
        const mensajeTelegram = etiqueta === 'Juegos de Mesa'
          ? `ðŸƒ <b>Â¡Nuevo Juego de Mesa Convocado!</b>\n\n` +
            `ðŸ“¦ <b>${titulo}</b>\n` +
            `ðŸŽ² <b>Juego:</b> ${sistema}\n` +
            `ðŸ“ <i>"${descripcion}"</i>\n\n` +
            `ðŸ”® <b>Jornada:</b> ${nombreEvento}\n` +
            `â° <b>Turno:</b> ${turno} | ðŸ‘¥ <b>Cupo:</b> ${cupo} jugadores\n` +
            `ðŸŒ± <b>Â¿EnseÃ±a reglas?:</b> ${apta_novatos ? 'SÃ­, apto para novatos' : 'No'}\n\n` +
            `âš”ï¸ Â¡AnÃ³tate en el portal para jugar!`
          : `ðŸŽ² <b>Â¡Nueva Mesa de Rol Forjada!</b>\n\n` +
            `âš”ï¸ <b>${titulo}</b>\n` +
            `ðŸ“œ <b>Sistema:</b> ${sistema}\n` +
            `ðŸ“ <i>"${descripcion}"</i>\n\n` +
            `ðŸ”® <b>Jornada:</b> ${nombreEvento}\n` +
            `â° <b>Turno:</b> ${turno} | ðŸ‘¥ <b>Cupo:</b> ${cupo} aventureros\n` +
            `ðŸŒ± <b>Apta novatos:</b> ${apta_novatos ? 'SÃ­' : 'No'}\n\n` +
            `ðŸ›¡ï¸ Â¡Prepara tus dados y regÃ­strate!`;

        enviarMensajeAlCanal(mensajeTelegram);
      });

      if (etiqueta !== 'Juegos de Mesa') {
        db.query("SELECT COUNT(*) AS total_mesas FROM partidas WHERE dungeon_master_id = ? AND etiqueta != 'Juegos de Mesa'", [idUsuario], (err, countResult) => {
          if (err) console.error("Error al contar las mesas del DM:", err);
          
          if (countResult && countResult[0].total_mesas === 1) {
            db.query("SELECT id FROM usuarios WHERE rol = 'admin'", (err, admins) => {
              if (err || admins.length === 0) return; 
              
              const mensajeNotif = `Â¡El Escriba announces que el DM ${req.usuario.nombre} ha convocado su primera mesa de ROL ("${titulo}")! Recuerda forjar su Certificado del Gremio en el Censo.`;
              const notificacionesValues = admins.map(admin => [admin.id, mensajeNotif]);
              
              db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES ?", [notificacionesValues], (err) => {
                  if(err) console.error("Error al enviar los cuervos a los admins:", err);
              });
            });
          }
        });
      }

      const io = req.app.get('io');
      if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

      res.status(201).json({ mensaje: `Â¡${etiqueta === 'Juegos de Mesa' ? 'Juego de mesa' : 'Mesa'} convocado con Ã©xito!` });
    });
  });
});

// âœ¨ INSCRIPCIONES: Unirse a una aventura (AutomÃ¡ticamente soporta Rol y Juegos de Mesa)
router.post('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  const sqlInfoMesa = `
    SELECT 
      p.evento_id, p.cupo, p.titulo, p.etiqueta, p.dungeon_master_id,
      u.telegram_chat_id AS dm_telegram_id, u.nombre AS dm_nombre,
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id) as anotados 
    FROM partidas p
    JOIN usuarios u ON p.dungeon_master_id = u.id
    WHERE p.id = ?`;

  db.query(sqlInfoMesa, [idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error de servidor.');
    if (resultados.length === 0) return res.status(404).send('La mesa ya no existe.');
    
    const { evento_id, cupo, anotados, titulo, etiqueta, dm_telegram_id } = resultados[0];

    if (anotados >= cupo) return res.status(400).send('âŒ Â¡Mesa llena! No quedan lugares.');

    const sqlValidarParticipacion = `
      SELECT 
        (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_dm_o_creador,
        (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador,
        (SELECT COUNT(*) FROM escape_inscripciones ei JOIN escape_turnos et ON ei.escape_turno_id = et.id JOIN escape_rooms er ON et.escape_room_id = er.id WHERE er.evento_id = ? AND ei.usuario_id = ?) as es_escape
    `;

    db.query(sqlValidarParticipacion, [evento_id, idUsuario, evento_id, idUsuario, evento_id, idUsuario], (err, participacion) => {
      if (err) return res.status(500).send('Error al consultar los anales del gremio.');

      const { es_dm_o_creador, es_jugador, es_escape } = participacion[0];

      if (es_dm_o_creador > 0) return res.status(400).send('âš ï¸ Ya eres Organizador/DM de una mesa en este evento.');
      if (es_jugador > 0) return res.status(400).send('âš ï¸ Ya estÃ¡s inscrito en otra mesa de este evento.');
      if (es_escape > 0) return res.status(400).send('âš ï¸ Ya estÃ¡s inscrito en un turno de Escape Room de este evento.');

      db.query("INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)", [idUsuario, idPartida], (err) => {
        if (err) return res.status(400).send('Error al anotarse.');
        
        const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'UNIRSE_JUEGO' : 'INSCRIPCION_MESA';
        registrarLog(req.usuario, tipoMesaLog, `Se uniÃ³ a la mesa de ${etiqueta} "${titulo}".`);

        const io = req.app.get('io');
        if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

        // âœ¨ ALERTA AL DM EN TELEGRAM
        if (dm_telegram_id) {
          const mensajeDM = `ðŸ‘¤ <b>Â¡Un nuevo aventurero!</b>\n\n` +
            `<b>${req.usuario.nombre}</b> se ha inscrito a tu mesa de ${etiqueta}:\n` +
            `ðŸ›¡ï¸ <b>${titulo}</b>`;
          enviarMensajeTelegram(dm_telegram_id, mensajeDM);
        }
        
        res.status(201).send('Â¡Te has unido a la partida!');
      });
    });
  });
});

// âœ¨ DESERCIÃ“N: Abandonar una mesa
router.delete('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  db.query(`
    SELECT p.evento_id, p.titulo, p.etiqueta, u.telegram_chat_id AS dm_telegram_id 
    FROM partidas p 
    JOIN usuarios u ON p.dungeon_master_id = u.id 
    WHERE p.id = ?`, [idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error en los registros.');
    if (resultados.length === 0) return res.status(404).send('La mesa no existe.');
    
    const { evento_id, titulo, etiqueta, dm_telegram_id } = resultados[0];

    const sqlDelete = 'DELETE FROM inscripciones WHERE partida_id = ? AND usuario_id = ?';
    db.query(sqlDelete, [idPartida, idUsuario], (err, resultado) => {
      if (err) return res.status(500).send('Error al abandonar la mesa.');
      if (resultado.affectedRows === 0) return res.status(400).send('No figurabas en los registros.');
      
      const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'ABANDONAR_JUEGO' : 'ABANDONAR_MESA';
      registrarLog(req.usuario, tipoMesaLog, `Se retirÃ³ de la mesa de ${etiqueta} "${titulo}".`);

      const io = req.app.get('io');
      if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

      // âœ¨ ALERTA AL DM EN TELEGRAM
      if (dm_telegram_id) {
        const mensajeDM = `ðŸšª <b>Â¡Una baja en tu mesa!</b>\n\n` +
          `<b>${req.usuario.nombre}</b> se ha retirado de tu mesa de ${etiqueta}:\n` +
          `ðŸ›¡ï¸ <b>${titulo}</b>`;
        enviarMensajeTelegram(dm_telegram_id, mensajeDM);
      }

      res.status(200).send('Has abandonado la mesa exitosamente.');
    });
  });
});

// âœ¨ JUGADORES: Obtener lista de inscritos en una mesa
router.get('/:id/jugadores', verificarToken, (req, res) => {
  const sql = `
      SELECT u.id, u.nombre, u.email, u.rol, 
        IFNULL((SELECT SUM(voto) FROM reputacion WHERE evaluado_id = u.id), 0) as reputacion_neta 
      FROM usuarios u 
      JOIN inscripciones i ON u.id = i.usuario_id 
      WHERE i.partida_id = ?
      
      UNION
      
      SELECT u.id, u.nombre, u.email, u.rol, 
        IFNULL((SELECT SUM(voto) FROM reputacion WHERE evaluado_id = u.id), 0) as reputacion_neta 
      FROM usuarios u 
      JOIN partidas p ON u.id = p.dungeon_master_id 
      WHERE p.id = ?
    `;
    db.query(sql, [req.params.id, req.params.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar aventureros.' });
    res.json(resultados);
  });
});

// âœ¨ ELIMINACIÃ“N: Disolver mesa + Notificaciones automÃ¡ticas (Soporta Rol y Juegos de Mesa)
router.delete('/:id', verificarToken, (req, res) => {
  const partidaId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  db.query("SELECT dungeon_master_id, titulo, evento_id, etiqueta FROM partidas WHERE id = ?", [partidaId], (err, resultados) => {
    if (err) return res.status(500).send('Error de servidor.');
    if (resultados.length === 0) return res.status(404).send('La mesa no existe.');

    const { dungeon_master_id: dmId, titulo, evento_id, etiqueta } = resultados[0];

    if (dmId !== usuarioId && rolUsuario !== 'admin') {
      return res.status(403).send('No tienes autoridad para disolver esta mesa.');
    }

    db.query(`
      SELECT i.usuario_id, u.telegram_chat_id 
      FROM inscripciones i 
      JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.partida_id = ?`, [partidaId], (err, inscritos) => {
      if (inscritos && inscritos.length > 0) {
        const mensaje = `El Organizador de "${titulo}" ha disuelto la mesa. Tu inscripciÃ³n ha sido cancelada.`;
        const values = inscritos.map(j => [j.usuario_id, mensaje]);
        db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES ?", [values], (err) => {
          if (err) console.error("Error al crear notificaciones:", err);
        });

        // âœ¨ ALERTA DE CANCELACIÃ“N EN TELEGRAM A LOS JUGADORES
        inscritos.forEach(jugador => {
          if (jugador.telegram_chat_id) {
            const mensajeTelegram = `âš ï¸ <b>Mesa Cancelada</b>\n\n` +
              `El Dungeon Master ha disuelto la mesa de ${etiqueta} a la que estabas inscrito:\n` +
              `ðŸ›¡ï¸ <b>${titulo}</b>\n\n` +
              `Tu inscripciÃ³n ha sido cancelada.`;
            enviarMensajeTelegram(jugador.telegram_chat_id, mensajeTelegram);
          }
        });
      }

      db.query("DELETE FROM partidas WHERE id = ?", [partidaId], (err) => {
        if (err) return res.status(500).send('Error al disolver la mesa.');
        
        const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'ELIMINAR_JUEGO' : 'ELIMINAR_MESA';
        registrarLog(req.usuario, tipoMesaLog, `DisolviÃ³ la mesa de ${etiqueta} "${titulo}"${dmId !== usuarioId ? ' (AcciÃ³n de Administrador)' : ''}.`);

        const io = req.app.get('io');
        if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

        res.send('Mesa disuelta correctamente y aventureros notificados.');
      });
    });
  });
});

// âœ¨ EDICIÃ“N: Modificar detalles de la mesa
router.put('/:id', verificarToken, (req, res) => {
  const partidaId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  db.query("SELECT dungeon_master_id, evento_id, titulo as titulo_viejo, etiqueta as etiqueta_vieja FROM partidas WHERE id = ?", [partidaId], (err, resultados) => {
    if (err || resultados.length === 0) return res.status(404).json({ error: 'Mesa no encontrada.' });

    const { dungeon_master_id: dmId, evento_id, titulo_viejo, etiqueta_vieja } = resultados[0];

    if (dmId !== usuarioId && rolUsuario !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos.' });
    }

    const { titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos } = req.body;

    const esOrganizadorValido = rolUsuario === 'dm' || rolUsuario === 'admin';
    const esJugador = rolUsuario === 'jugador' || rolUsuario === 'aventurero';

    if (!esOrganizadorValido && !(esJugador && etiqueta === 'Juegos de Mesa')) {
      return res.status(403).json({ error: 'No posees permisos de DM para esta acciÃ³n.' });
    }

    const sqlUpdate = `
      UPDATE partidas 
      SET titulo = ?, descripcion = ?, requisitos = ?, sistema = ?, sistema_id = ?, cupo = ?, turno = ?, etiqueta = ?, apta_novatos = ?, materiales_pedidos = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [titulo, descripcion, requisitos, sistema, sistema_id || null, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, partidaId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al actualizar registros.' });
      }

      registrarLog(req.usuario, 'EDITAR_MESA', `ReescribiÃ³ los detalles de la mesa de ${etiqueta_vieja} "${titulo_viejo}" (Ahora: "${titulo}").`);

      const io = req.app.get('io');
      if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

      res.json({ mensaje: 'Â¡Cambios grabados!' });
    });
  });
});

// âœ¨ NOTIFICAR JUGADORES: Enviar un mensaje de Telegram a todos los inscritos en la mesa
router.post('/:id/notificar-jugadores', verificarToken, (req, res) => {
  const partidaId = req.params.id;
  const usuarioId = req.usuario.id;
  const { mensaje } = req.body;

  if (!mensaje || mensaje.trim() === '') {
    return res.status(400).json({ error: 'El mensaje no puede estar vacÃ­o.' });
  }

  db.query("SELECT dungeon_master_id, titulo, etiqueta FROM partidas WHERE id = ?", [partidaId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error del servidor.' });
    if (resultados.length === 0) return res.status(404).json({ error: 'La mesa no existe.' });

    const { dungeon_master_id, titulo, etiqueta } = resultados[0];

    if (dungeon_master_id !== usuarioId) {
      return res.status(403).json({ error: 'No tienes autorizaciÃ³n para enviar mensajes a esta mesa.' });
    }

    const sqlInscritos = `
      SELECT u.nombre, u.telegram_chat_id 
      FROM inscripciones i 
      JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.partida_id = ?
    `;

    db.query(sqlInscritos, [partidaId], (err, jugadores) => {
      if (err) return res.status(500).json({ error: 'Error al consultar jugadores.' });
      
      const jugadoresConTelegram = jugadores.filter(j => j.telegram_chat_id);

      if (jugadoresConTelegram.length === 0) {
        return res.status(200).json({ mensaje: 'No hay jugadores con Telegram vinculado en esta mesa.' });
      }

      jugadoresConTelegram.forEach(async (jugador) => {
        const mensajeTelegram = `ðŸ§™â€â™‚ï¸ <b>Aviso de tu DM en "${titulo}":</b>\n\n` +
          `${mensaje}`;
        
        await enviarMensajeTelegram(jugador.telegram_chat_id, mensajeTelegram);
      });

      res.json({ mensaje: `Mensaje enviado con Ã©xito a los jugadores con Telegram.` });
    });
  });
});

// âœ¨ LOGÃSTICA: Reporte completo para Fundadores (Rol y Juegos de Mesa)
router.get('/reporte-logistico/:eventoId', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso reservado a los fundadores.' });

  const sql = `
    SELECT 
      p.titulo as mesa, 
      p.etiqueta,
      p.sistema, 
      p.turno, 
      p.materiales_pedidos,
      u.nombre as dm_o_creador_nombre, 
      u.nombre_completo,
      u.es_dm_nuevo, 
      GROUP_CONCAT(uj.nombre SEPARATOR ', ') as jugadores
    FROM partidas p
    JOIN usuarios u ON p.dungeon_master_id = u.id
    LEFT JOIN inscripciones i ON p.id = i.partida_id
    LEFT JOIN usuarios uj ON i.usuario_id = uj.id
    WHERE p.evento_id = ?
    GROUP BY p.id
    ORDER BY p.turno ASC, p.etiqueta ASC
  `;

  db.query(sql, [req.params.eventoId], (err, resultados) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al generar el reporte logÃ­stico.' });
    }
    
    // Registrar en bitÃ¡cora quiÃ©n y cuÃ¡ndo exportÃ³ la logÃ­stica
    db.query("SELECT nombre FROM eventos WHERE id = ?", [req.params.eventoId], (err2, result2) => {
       const nombreEv = result2 && result2[0] ? result2[0].nombre : 'Desconocido';
       registrarLog(req.usuario, 'REPORTE_LOGISTICA', `ExportÃ³ la planilla logÃ­stica de la jornada "${nombreEv}".`);
    });

    res.json(resultados);
  });
});

module.exports = router;
