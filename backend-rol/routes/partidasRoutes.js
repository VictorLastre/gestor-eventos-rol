const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

// ✨ FUNCIÓN DEL ESCRIBA: REGISTRO EN LA BITÁCORA
const registrarLog = (usuario, accion, descripcion) => {
  const sql = "INSERT INTO logs_actividad (usuario_id, nombre_usuario, accion, descripcion) VALUES (?, ?, ?, ?)";
  db.query(sql, [usuario.id, usuario.nombre, accion, descripcion], (err) => {
    if (err) console.error("❌ Error en bitácora:", err);
  });
};

// ✨ ESTADÍSTICAS: Obtener el Top de Sistemas Más Jugados (Rol)
router.get('/estadisticas/sistemas', verificarToken, (req, res) => {
  // Ahora cruzamos con la tabla sistemas usando sistema_id para mayor precisión
  const sql = `
    SELECT 
      s.nombre as sistema, 
      COUNT(p.id) as cantidad 
    FROM partidas p
    JOIN sistemas s ON p.sistema_id = s.id
    WHERE p.etiqueta = 'Rol' -- Solo contamos estadísticas de rol
    GROUP BY p.sistema_id, s.nombre
    ORDER BY cantidad DESC 
    LIMIT 5
  `;
  
  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("Error al consultar el Oráculo de Sistemas:", err);
      // Fallback: Si la nueva query falla por algún motivo de estructura, volvemos a la vieja
      const sqlFallback = `SELECT sistema, COUNT(*) as cantidad FROM partidas WHERE etiqueta = 'Rol' GROUP BY sistema ORDER BY cantidad DESC LIMIT 5`;
      return db.query(sqlFallback, (errFB, resFB) => {
        if(errFB) return res.status(500).json({ error: 'Error leyendo los sistemas más jugados.' });
        res.json(resFB);
      });
    }
    res.json(resultados);
  });
});

// ✨ ESTADÍSTICAS: Obtener el Top de Juegos de Mesa (¡NUEVA RUTA AÑADIDA!)
router.get('/estadisticas/juegos-mesa', verificarToken, (req, res) => {
  const sql = `
    SELECT sistema, COUNT(*) as cantidad 
    FROM partidas 
    WHERE etiqueta = 'Juegos de Mesa' 
    GROUP BY sistema 
    ORDER BY cantidad DESC 
    LIMIT 5
  `;
  db.query(sql, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los juegos de mesa.' });
    res.json(resultados);
  });
});

// ✨ CREACIÓN: Forjar una nueva mesa/partida (Flexibilizada para Juegos de Mesa)
router.post('/', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  const rolUsuario = req.usuario.rol;
  const { titulo, sistema, etiqueta } = req.body;

  // ✨ VALIDACIÓN DEL TIPO DE MESA Y ROL ✨
  // Admins y DMs pueden crear lo que quieran.
  // Aventureros solo pueden crear mesas con la etiqueta 'Juegos de Mesa'.
  const esOrganizadorValido = rolUsuario === 'dm' || rolUsuario === 'admin';
  const esMesaJuegoValida = rolUsuario === 'aventurero' && etiqueta === 'Juegos de Mesa';

  if (!esOrganizadorValido && !esMesaJuegoValida) {
    return res.status(403).json({ 
      error: 'Solo los Directores de Juego pueden convocar aventuras de Rol. Como Aventurero, puedes convocar mesas de Juegos de Mesa.' 
    });
  }

  // Aceptamos tanto sistema como sistema_id si vienen del frontend.
  // Para juegos de mesa, sistema_id vendrá NULL o un ID genérico.
  const { descripcion, requisitos, sistema_id, cupo, turno, apta_novatos, materiales_pedidos, evento_id } = req.body;

  // Insertamos en ambas columnas por si acaso (para compatibilidad)
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

    // ✨ REGISTRO EN BITÁCORA
    const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'CONVOCAR_JUEGO' : 'CREAR_MESA';
    const descLog = etiqueta === 'Juegos de Mesa' 
      ? `Convocó la mesa de juego "${titulo}" para "${sistema}".`
      : `Abrió la mesa de Rol "${titulo}" usando el sistema "${sistema}".`;
      
    registrarLog(req.usuario, tipoMesaLog, descLog);

    // ✨ MAGIA DE NOTIFICACIÓN (Solo para DMs creando su PRIMERA mesa de Rol)
    if (etiqueta !== 'Juegos de Mesa') {
      db.query("SELECT COUNT(*) AS total_mesas FROM partidas WHERE dungeon_master_id = ? AND etiqueta != 'Juegos de Mesa'", [idUsuario], (err, countResult) => {
        if (err) console.error("Error al contar las mesas del DM:", err);
        
        if (countResult && countResult[0].total_mesas === 1) {
          db.query("SELECT id FROM usuarios WHERE rol = 'admin'", (err, admins) => {
            if (err || admins.length === 0) return; 
            
            const mensajeNotif = `¡El Escriba announces que el DM ${req.usuario.nombre} ha convocado su primera mesa de ROL ("${titulo}")! Recuerda forjar su Certificado del Gremio en el Censo.`;
            const notificacionesValues = admins.map(admin => [admin.id, mensajeNotif]);
            
            db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES ?", [notificacionesValues], (err) => {
                if(err) console.error("Error al enviar los cuervos a los admins:", err);
            });
          });
        }
      });
    }

    // ✨ WEBSOCKETS: Avisar que se forjó una nueva mesa (para refrescar el tablón automáticamente)
    const io = req.app.get('io');
    if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

    res.status(201).json({ mensaje: `¡Mesa de ${etiqueta} forjada con éxito! Los aventureros ya pueden unirse.` });
  });
});

// ✨ INSCRIPCIONES: Unirse a una aventura (Automáticamente soporta Rol y Juegos de Mesa)
router.post('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  const sqlInfoMesa = `
    SELECT 
      evento_id, cupo, titulo, etiqueta, 
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = ?) as anotados 
    FROM partidas WHERE id = ?`;

  db.query(sqlInfoMesa, [idPartida, idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error de servidor.');
    if (resultados.length === 0) return res.status(404).send('La mesa ya no existe.');
    
    const { evento_id, cupo, anotados, titulo, etiqueta } = resultados[0];

    if (anotados >= cupo) return res.status(400).send('❌ ¡Mesa llena! No quedan lugares.');

    // ✨ RESTRECCIÓN DE "NO ESTAR EN DOS LUGARES" ✨
    // Verificamos si ya es Organizador (DM/Creador) en este evento, si ya está anotado en otra mesa,
    // o si tiene un turno de Escape Room. (Esta query es perfecta y soporta el cambio automáticamente).
    const sqlValidarParticipacion = `
      SELECT 
        (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_dm_o_creador,
        (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador,
        (SELECT COUNT(*) FROM escape_inscripciones ei JOIN escape_turnos et ON ei.escape_turno_id = et.id JOIN escape_rooms er ON et.escape_room_id = er.id WHERE er.evento_id = ? AND ei.usuario_id = ?) as es_escape
    `;

    db.query(sqlValidarParticipacion, [evento_id, idUsuario, evento_id, idUsuario, evento_id, idUsuario], (err, participacion) => {
      if (err) return res.status(500).send('Error al consultar los anales del gremio.');

      const { es_dm_o_creador, es_jugador, es_escape } = participacion[0];

      if (es_dm_o_creador > 0) return res.status(400).send('⚠️ Ya eres Organizador/DM de una mesa en este evento.');
      if (es_jugador > 0) return res.status(400).send('⚠️ Ya estás inscrito en otra mesa de este evento.');
      if (es_escape > 0) return res.status(400).send('⚠️ Ya estás inscrito en un turno de Escape Room de este evento.');

      db.query("INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)", [idUsuario, idPartida], (err) => {
        if (err) return res.status(400).send('Error al anotarse.');
        
        // ✨ REGISTRO EN BITÁCORA
        const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'UNIRSE_JUEGO' : 'INSCRIPCION_MESA';
        registrarLog(req.usuario, tipoMesaLog, `Se unió a la mesa de ${etiqueta} "${titulo}".`);

        // ✨ WEBSOCKETS: Avisar a todos que alguien ocupó un lugar
        const io = req.app.get('io');
        if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });
        
        res.status(201).send('¡Te has unido a la aventura!');
      });
    });
  });
});

// ✨ DESERCIÓN: Abandonar una mesa
router.delete('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  // Primero necesitamos saber a qué evento pertenecía esta partida para avisar al frontend y obtener el título y etiqueta para el log
  db.query("SELECT evento_id, titulo, etiqueta FROM partidas WHERE id = ?", [idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error en los registros.');
    if (resultados.length === 0) return res.status(404).send('La mesa no existe.');
    
    const { evento_id, titulo, etiqueta } = resultados[0];

    const sqlDelete = 'DELETE FROM inscripciones WHERE partida_id = ? AND usuario_id = ?';
    db.query(sqlDelete, [idPartida, idUsuario], (err, resultado) => {
      if (err) return res.status(500).send('Error al abandonar la mesa.');
      if (resultado.affectedRows === 0) return res.status(400).send('No figurabas en los registros.');
      
      // ✨ REGISTRO EN BITÁCORA
      const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'ABANDONAR_JUEGO' : 'ABANDONAR_MESA';
      registrarLog(req.usuario, tipoMesaLog, `Se retiró de la mesa de ${etiqueta} "${titulo}".`);

      // ✨ WEBSOCKETS: Avisar a todos que se liberó un cupo
      const io = req.app.get('io');
      if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

      res.status(200).send('Has abandonado la mesa exitosamente.');
    });
  });
});

// ✨ JUGADORES: Obtener lista de inscritos en una mesa
router.get('/:id/jugadores', verificarToken, (req, res) => {
  const sql = "SELECT u.id, u.nombre, u.email, u.rol FROM usuarios u JOIN inscripciones i ON u.id = i.usuario_id WHERE i.partida_id = ?";
  db.query(sql, [req.params.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar aventureros.' });
    res.json(resultados);
  });
});

// ✨ ELIMINACIÓN: Disolver mesa + Notificaciones automáticas (Soporta Rol y Juegos de Mesa)
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

    db.query("SELECT usuario_id FROM inscripciones WHERE partida_id = ?", [partidaId], (err, inscritos) => {
      if (inscritos && inscritos.length > 0) {
        const mensaje = `El Organizador de "${titulo}" ha disuelto la mesa. Tu inscripción ha sido cancelada.`;
        const values = inscritos.map(j => [j.usuario_id, mensaje]);
        db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES ?", [values], (err) => {
          if (err) console.error("Error al crear notificaciones:", err);
        });
      }

      db.query("DELETE FROM partidas WHERE id = ?", [partidaId], (err) => {
        if (err) return res.status(500).send('Error al disolver la mesa.');
        
        // ✨ REGISTRO EN BITÁCORA
        const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'ELIMINAR_JUEGO' : 'ELIMINAR_MESA';
        registrarLog(req.usuario, tipoMesaLog, `Disolvió la mesa de ${etiqueta} "${titulo}"${dmId !== usuarioId ? ' (Acción de Administrador)' : ''}.`);

        // ✨ WEBSOCKETS: Avisar que una mesa desapareció del tablón
        const io = req.app.get('io');
        if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

        res.send('Mesa disuelta correctamente y aventureros notificados.');
      });
    });
  });
});

// ✨ EDICIÓN: Modificar detalles de la mesa (Flexibilizada y asegura actualización de ambas columnas de sistema)
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

    // Recibimos los datos, incluyendo sistema (texto) y sistema_id (número) y la etiqueta.
    const { titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos } = req.body;

    // ✨ VALIDACIÓN DE AUTORIDAD PARA CAMBIAR ETIQUETA O SISTEMA DE ROL ✨
    // Si la etiqueta cambia de Rol a otra cosa, o de otra cosa a Rol, o si se intenta editar una mesa de Rol siendo Aventurero, lo bloqueamos.
    // Solo un Admin o el DM de la mesa (siendo rol DM/Admin) pueden cambiar la etiqueta.
    const esOrganizadorValido = req.usuario.rol === 'dm' || req.usuario.rol === 'admin';
    const intentaCambiarRolAAntes = etiqueta_vieja === 'Rol';
    const intentaCambiarRolAAhora = etiqueta === 'Rol';

    if (!esOrganizadorValido && (intentaCambiarRolAAntes || intentaCambiarRolAAhora)) {
      return res.status(403).json({ 
        error: 'No tienes la autoridad del Gremio para editar mesas de Rol o cambiar la etiqueta Rol.' 
      });
    }

    const sqlUpdate = `
      UPDATE partidas 
      SET titulo = ?, descripcion = ?, requisitos = ?, sistema = ?, sistema_id = ?, cupo = ?, turno = ?, etiqueta = ?, apta_novatos = ?, materiales_pedidos = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, partidaId], (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar.' });
      
      // ✨ REGISTRO EN BITÁCORA
      registrarLog(req.usuario, 'EDITAR_MESA', `Modificó los detalles de la mesa de ${etiqueta} "${titulo_viejo}" (Ahora: "${titulo}").`);

      // ✨ WEBSOCKETS: Avisar que los detalles de la mesa cambiaron
      const io = req.app.get('io');
      if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(evento_id) });

      res.status(200).json({ mensaje: '¡Aventura actualizada!' });
    });
  });
});

// ✨ LOGÍSTICA: Reporte completo para Fundadores (Rol y Juegos de Mesa)
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
      return res.status(500).json({ error: 'Error al generar el reporte logístico.' });
    }
    
    // Opcional: registrar quién y cuándo exportó la logística
    db.query("SELECT nombre FROM eventos WHERE id = ?", [req.params.eventoId], (err2, result2) => {
       const nombreEv = result2 && result2[0] ? result2[0].nombre : 'Desconocido';
       registrarLog(req.usuario, 'REPORTE_LOGISTICA', `Exportó la planilla logística de la jornada "${nombreEv}".`);
    });

    res.json(resultados);
  });
});

module.exports = router;