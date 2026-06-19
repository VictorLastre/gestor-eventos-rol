const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

// ✨ FUNCIÓN DEL ESCRIBA: REGISTRO EN LA BITÁCORA
const registrarLog = (usuario, accion, descripcion) => {
  const sql = "INSERT INTO logs_actividad (usuario_id, nombre_usuario, accion, descripcion) VALUES (?, ?, ?, ?)";
  db.query(sql, [usuario.id, usuario.nombre, accion, descripcion], (err) => {
    if (err) console.error("❌ Error en bitácora (Escapes):", err);
  });
};

// 1. OBTENER TODOS LOS ESCAPES DE UN EVENTO
router.get('/:eventoId', verificarToken, (req, res) => {
  const eventoId = req.params.eventoId;
  
  const sqlSalas = `
    SELECT er.*, u.nombre as organizador_nombre 
    FROM escape_rooms er 
    JOIN usuarios u ON er.organizador_id = u.id 
    WHERE er.evento_id = ?
  `;
  
  db.query(sqlSalas, [eventoId], (err, salas) => {
    if (err) return res.status(500).json({ error: 'Error al buscar las salas.' });
    if (salas.length === 0) return res.json([]);

    const salasIds = salas.map(s => s.id);
    
    // ✨ MAGIA AÑADIDA: GROUP_CONCAT para traer los nombres de los aventureros en un solo texto separado por comas
    const sqlTurnos = `
      SELECT et.*, 
        (SELECT COUNT(*) FROM escape_inscripciones WHERE escape_turno_id = et.id) as anotados,
        (SELECT COUNT(*) FROM escape_inscripciones WHERE escape_turno_id = et.id AND usuario_id = ?) as estoy_anotado,
        (
            SELECT GROUP_CONCAT(u.nombre SEPARATOR ', ') 
            FROM escape_inscripciones ei
            JOIN usuarios u ON ei.usuario_id = u.id
            WHERE ei.escape_turno_id = et.id
        ) as nombres_jugadores
      FROM escape_turnos et 
      WHERE et.escape_room_id IN (?)
      ORDER BY et.hora_inicio ASC
    `;

    db.query(sqlTurnos, [req.usuario.id, salasIds], (err, turnos) => {
      if (err) return res.status(500).json({ error: 'Error al cargar los horarios.' });

      const salasConTurnos = salas.map(sala => {
        sala.turnos = turnos.filter(t => t.escape_room_id === sala.id);
        return sala;
      });

      res.json(salasConTurnos);
    });
  });
});

// 2. CREAR UNA SALA DE ESCAPE Y SUS TURNOS
router.post('/:eventoId', verificarToken, (req, res) => {
  if (req.usuario.rol === 'jugador') return res.status(403).json({ error: 'Solo DMs y Admins pueden organizar Escapes.' });

  const eventoId = req.params.eventoId;
  const organizadorId = req.usuario.id;
  const { titulo, descripcion, dificultad, edad_minima, cupo_por_turno, materiales_pedidos, turnos } = req.body;

  if (!turnos || turnos.length === 0) {
    return res.status(400).json({ error: 'Debes habilitar al menos un horario para la sala.' });
  }

  const sqlInsertRoom = `
    INSERT INTO escape_rooms 
    (evento_id, organizador_id, titulo, descripcion, dificultad, edad_minima, cupo_por_turno, materiales_pedidos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sqlInsertRoom, [eventoId, organizadorId, titulo, descripcion, dificultad, edad_minima, cupo_por_turno, materiales_pedidos], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al construir la sala.' });

    const roomId = result.insertId;

    const valoresTurnos = turnos.map(t => [roomId, t.hora_inicio, t.hora_fin]);
    const sqlInsertTurnos = "INSERT INTO escape_turnos (escape_room_id, hora_inicio, hora_fin) VALUES ?";

    db.query(sqlInsertTurnos, [valoresTurnos], (err) => {
      if (err) return res.status(500).json({ error: 'Sala creada, pero fallaron los horarios.' });

      registrarLog(req.usuario, 'CREAR_ESCAPE', `Inauguró el Escape Room "${titulo}" con ${turnos.length} pases.`);

      const io = req.app.get('io');
      if (io) io.emit('actualizacion-escapes', { eventoId: parseInt(eventoId) });

      res.status(201).json({ mensaje: '¡Escape Room habilitado con éxito!' });
    });
  });
});

// 3. INSCRIBIRSE A UN TURNO DE ESCAPE
router.post('/turnos/:turnoId/inscripciones', verificarToken, (req, res) => {
  const turnoId = req.params.turnoId;
  const usuarioId = req.usuario.id;

  // Paso 1: Obtener información del turno y la sala
  const sqlInfo = `
    SELECT er.id as room_id, er.evento_id, er.cupo_por_turno, er.titulo, et.hora_inicio
    FROM escape_turnos et
    JOIN escape_rooms er ON et.escape_room_id = er.id
    WHERE et.id = ?
  `;

  db.query(sqlInfo, [turnoId], (err, resInfo) => {
    if (err || resInfo.length === 0) return res.status(404).json({ error: 'Horario no encontrado.' });

    const { room_id, evento_id, cupo_por_turno, titulo, hora_inicio } = resInfo[0];

    // Paso 2: Ejecutar todas las validaciones del Gremio en una sola consulta
    const sqlValidar = `
      SELECT 
        (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_dm_rol,
        (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador_rol,
        (SELECT COUNT(*) FROM escape_inscripciones ei JOIN escape_turnos et ON ei.escape_turno_id = et.id WHERE et.escape_room_id = ? AND ei.usuario_id = ?) as ya_en_este_escape,
        (SELECT COUNT(*) FROM escape_inscripciones WHERE escape_turno_id = ?) as anotados_turno
    `;

    db.query(sqlValidar, [evento_id, usuarioId, evento_id, usuarioId, room_id, usuarioId, turnoId], (err, resValidar) => {
      if (err) return res.status(500).json({ error: 'Error al consultar las leyes del gremio.' });

      const { es_dm_rol, es_jugador_rol, ya_en_este_escape, anotados_turno } = resValidar[0];

      // Aplicamos las Reglas:
      if (anotados_turno >= cupo_por_turno) return res.status(400).json({ error: 'Ese horario ya está lleno.' });
      if (es_dm_rol > 0) return res.status(400).json({ error: '⚠️ No puedes jugar, ya estás dirigiendo una mesa de rol en este evento.' });
      if (es_jugador_rol > 0) return res.status(400).json({ error: '⚠️ Ya estás anotado en una mesa de rol en este evento.' });
      if (ya_en_este_escape > 0) return res.status(400).json({ error: '⚠️ Solo puedes anotarte a un horario por Escape Room para dar lugar a otros.' });

      // Si pasa todas las pruebas, lo inscribimos
      db.query("INSERT INTO escape_inscripciones (escape_turno_id, usuario_id) VALUES (?, ?)", [turnoId, usuarioId], (err) => {
        if (err) return res.status(500).json({ error: 'Error al firmar el contrato del escape.' });

        registrarLog(req.usuario, 'INSCRIPCION_ESCAPE', `Se anotó al Escape "${titulo}" (Turno: ${hora_inicio}).`);

        const io = req.app.get('io');
        if (io) io.emit('actualizacion-escapes', { eventoId: parseInt(evento_id) });

        res.status(201).json({ mensaje: '¡Estás dentro! No llegues tarde.' });
      });
    });
  });
});

// 4. CANCELAR INSCRIPCIÓN DE UN TURNO
router.delete('/turnos/:turnoId/inscripciones', verificarToken, (req, res) => {
  const turnoId = req.params.turnoId;
  const usuarioId = req.usuario.id;

  db.query("SELECT er.titulo, er.evento_id FROM escape_turnos et JOIN escape_rooms er ON et.escape_room_id = er.id WHERE et.id = ?", [turnoId], (err, resultados) => {
    if (err || resultados.length === 0) return res.status(404).send('No encontrado');
    
    const { titulo, evento_id } = resultados[0];

    db.query("DELETE FROM escape_inscripciones WHERE escape_turno_id = ? AND usuario_id = ?", [turnoId, usuarioId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al cancelar.' });
      if (result.affectedRows === 0) return res.status(400).json({ error: 'No estabas anotado.' });

      registrarLog(req.usuario, 'ABANDONAR_ESCAPE', `Canceló su lugar en el Escape "${titulo}".`);

      const io = req.app.get('io');
      if (io) io.emit('actualizacion-escapes', { eventoId: parseInt(evento_id) });

      res.json({ mensaje: 'Has cancelado tu turno.' });
    });
  });
});

// 5. ELIMINAR UN ESCAPE ROOM
router.delete('/:id', verificarToken, (req, res) => {
  const roomId = req.params.id;

  db.query("SELECT organizador_id, titulo, evento_id FROM escape_rooms WHERE id = ?", [roomId], (err, resultados) => {
    if (err || resultados.length === 0) return res.status(404).json({ error: 'Sala no encontrada.' });

    const { organizador_id, titulo, evento_id } = resultados[0];

    if (organizador_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No puedes destruir una sala que no creaste.' });
    }

    db.query("DELETE FROM escape_rooms WHERE id = ?", [roomId], (err) => {
      if (err) return res.status(500).json({ error: 'Error al clausurar la sala.' });

      registrarLog(req.usuario, 'ELIMINAR_ESCAPE', `Clausuró permanentemente el Escape Room "${titulo}".`);

      const io = req.app.get('io');
      if (io) io.emit('actualizacion-escapes', { eventoId: parseInt(evento_id) });

      res.json({ mensaje: 'La sala ha sido desmantelada.' });
    });
  });
});

// ✨ 6. EDITAR UN ESCAPE ROOM (¡NUEVO!)
router.put('/:id', verificarToken, (req, res) => {
  const roomId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  // Primero verificamos que la sala exista y que el usuario tenga permisos
  db.query("SELECT organizador_id, evento_id, titulo as titulo_viejo FROM escape_rooms WHERE id = ?", [roomId], (err, resultados) => {
    if (err || resultados.length === 0) return res.status(404).json({ error: 'Escape Room no encontrado.' });

    const orgId = resultados[0].organizador_id;
    const evento_id = resultados[0].evento_id;
    const titulo_viejo = resultados[0].titulo_viejo;

    if (orgId !== usuarioId && rolUsuario !== 'admin') {
      return res.status(403).json({ error: 'No tienes autoridad para reescribir esta sala.' });
    }

    // Extraemos los nuevos datos enviados por el frontend
    const { titulo, descripcion, dificultad, edad_minima, cupo_por_turno, materiales_pedidos } = req.body;

    // Actualizamos los datos principales de la sala (No tocamos los turnos en esta ruta por seguridad y simplicidad)
    const sqlUpdate = `
      UPDATE escape_rooms 
      SET titulo = ?, descripcion = ?, dificultad = ?, edad_minima = ?, cupo_por_turno = ?, materiales_pedidos = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [titulo, descripcion, dificultad, edad_minima, cupo_por_turno, materiales_pedidos, roomId], (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar los planos de la sala.' });
      
      // Dejamos constancia en los anales del gremio
      registrarLog(req.usuario, 'EDITAR_ESCAPE', `Modificó los detalles del Escape Room "${titulo_viejo}" (Ahora: "${titulo}").`);

      // Avisamos a todos vía WebSocket para que se actualice la pantalla en vivo
      const io = req.app.get('io');
      if (io) io.emit('actualizacion-escapes', { eventoId: parseInt(evento_id) });

      res.status(200).json({ mensaje: '¡Planos de la sala actualizados!' });
    });
  });
});

// 7. REPORTE LOGÍSTICO POR HORARIOS
router.get('/reporte-logistico/:eventoId', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo para el consejo.' });

  const sql = `
    SELECT 
      et.hora_inicio as inicio,
      et.hora_fin as fin,
      er.titulo as sala,
      u_org.nombre as organizador,
      er.materiales_pedidos,
      GROUP_CONCAT(u_jug.nombre SEPARATOR ', ') as jugadores
    FROM escape_turnos et
    JOIN escape_rooms er ON et.escape_room_id = er.id
    JOIN usuarios u_org ON er.organizador_id = u_org.id
    LEFT JOIN escape_inscripciones ei ON et.id = ei.escape_turno_id
    LEFT JOIN usuarios u_jug ON ei.usuario_id = u_jug.id
    WHERE er.evento_id = ?
    GROUP BY et.id
    ORDER BY er.titulo ASC, et.hora_inicio ASC
  `;

  db.query(sql, [req.params.eventoId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al generar la logística.' });
    res.json(resultados);
  });
});

module.exports = router;