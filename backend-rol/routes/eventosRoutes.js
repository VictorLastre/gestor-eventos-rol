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

// 1. Obtener todos los eventos (Con actualización de estados y formateo de fecha SEGURO)
router.get('/', (req, res) => {
  // Ajuste para Argentina (UTC-3) para la lógica de comparación de estados
  const tzOffset = -3 * 60 * 60 * 1000; 
  const ahoraArg = new Date(Date.now() + tzOffset).toISOString().slice(0, 19).replace('T', ' ');

  const sqlUpdate = `
    UPDATE eventos 
    SET estado = CASE 
      WHEN CAST(CONCAT(DATE(fecha), ' ', hora_fin) AS DATETIME) <= ? THEN 'Finalizado'
      WHEN CAST(CONCAT(DATE(fecha), ' ', hora_inicio) AS DATETIME) <= ? THEN 'En Curso'
      ELSE 'Proximo'
    END
    WHERE estado IN ('Proximo', 'En Curso')
  `;

  db.query(sqlUpdate, [ahoraArg, ahoraArg], (err) => {
    if (err) console.error("Error actualizando el reloj del gremio:", err);
    
    // ✨ TRUCO MAESTRO: DATE_FORMAT evita que el driver de JS reste horas por zona horaria
    const sqlSelect = `
      SELECT 
        id, nombre, descripcion, 
        DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, 
        hora_inicio, hora_fin, estado, lugar, ciudad
      FROM eventos 
      ORDER BY fecha DESC
    `;

    db.query(sqlSelect, (err, resultados) => {
      if (err) return res.status(500).json({ error: 'Error leyendo los eventos' });
      res.json(resultados);
    });
  });
});

// 2. Crear un nuevo evento (Solo Admins)
router.post('/', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo Admins.' });
  
  let { 
    nombre, 
    descripcion, 
    fecha, 
    hora_inicio = '16:00', 
    hora_fin = '20:00',
    lugar = 'Centro Cultural El Molino',
    ciudad = 'Santa Rosa'
  } = req.body;
  
  // Limpiamos la fecha por si viene con barras / la pasamos a guiones -
  const fechaLimpia = fecha.replace(/\//g, '-');

  const sqlInsert = 'INSERT INTO eventos (nombre, descripcion, fecha, hora_inicio, hora_fin, estado, lugar, ciudad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sqlInsert, [nombre, descripcion, fechaLimpia, hora_inicio, hora_fin, 'Proximo', lugar, ciudad], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al convocar el evento.' });
    }
    
    // ✨ REGISTRO EN BITÁCORA
    registrarLog(req.usuario, 'CREAR_EVENTO', `Ha convocado una nueva jornada: "${nombre}" para el ${fechaLimpia}.`);

    // ✨ WEBSOCKETS: Avisar a todos que hay un nuevo evento
    const io = req.app.get('io');
    if (io) io.emit('actualizacion-eventos');
    
    res.status(201).json({ mensaje: '¡Evento convocado con éxito!' });
  });
});

// 3. Obtener partidas de un evento específico (✨ CON SISTEMA DE NIVEL PARA DMs)
router.get('/:id/partidas', verificarToken, (req, res) => {
  const sql = `
    SELECT 
      p.id, p.evento_id, p.dungeon_master_id, p.titulo, p.descripcion, p.requisitos, 
      p.sistema, p.sistema_id, s.nombre AS sistema_db_nombre,
      p.cupo, p.turno, p.estado, p.etiqueta, p.apta_novatos, p.materiales_pedidos,
      u.nombre AS dmNombre, 
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id) AS jugadoresIniciales,
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id AND usuario_id = ?) AS anotadoInicialmente,
      (1 + (
        SELECT COUNT(*) 
        FROM partidas ph 
        JOIN eventos eh ON ph.evento_id = eh.id 
        WHERE ph.dungeon_master_id = p.dungeon_master_id AND eh.estado = 'Finalizado'
      )) AS dm_nivel
    FROM partidas p 
    JOIN usuarios u ON p.dungeon_master_id = u.id
    LEFT JOIN sistemas s ON p.sistema_id = s.id 
    WHERE p.evento_id = ? 
    GROUP BY p.id
  `;
  db.query(sql, [req.usuario.id, req.params.id], (err, resultados) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al consultar las mesas.' });
    }
    
    // Hacemos que si hay un sistema_id, mande el nombre de la BD, si no, que mande el string libre
    const formateados = resultados.map(r => ({
      ...r,
      sistema: r.sistema_db_nombre || r.sistema
    }));

    res.json(formateados);
  });
});

// 4. Crear una mesa en un evento (✨ ACTUALIZADO PARA JUEGOS DE MESA Y SEGURIDAD MÁXIMA)
router.post('/:id/partidas', verificarToken, (req, res) => {
  const eventoId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;
  
  const { titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos } = req.body;

  // ✨ VALIDACIÓN DEL TIPO DE MESA Y ROL ✨
  const esOrganizadorValido = rolUsuario === 'dm' || rolUsuario === 'admin';
  const esMesaJuegoValida = (rolUsuario === 'jugador' || rolUsuario === 'aventurero') && etiqueta === 'Juegos de Mesa';

  if (!esOrganizadorValido && !esMesaJuegoValida) {
    return res.status(403).json({ 
      error: 'Solo los Directores de Juego pueden convocar aventuras de Rol. Como Jugador, solo puedes organizar Juegos de Mesa.' 
    });
  }

  // ✨ RESTRICCIÓN: NO ESTAR EN DOS LUGARES AL MISMO TIEMPO
  const sqlCheck = `
    SELECT 
      DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha,
      e.nombre as nombre_evento,
      (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_creador,
      (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador,
      (SELECT COUNT(*) FROM escape_inscripciones ei JOIN escape_turnos et ON ei.escape_turno_id = et.id JOIN escape_rooms er ON et.escape_room_id = er.id WHERE er.evento_id = ? AND ei.usuario_id = ?) as es_escape
    FROM eventos e WHERE e.id = ?
  `;
  
  db.query(sqlCheck, [eventoId, usuarioId, eventoId, usuarioId, eventoId, usuarioId, eventoId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar los registros del gremio.' });
    if (resultados.length === 0) return res.status(404).json({ error: 'El evento no existe.' });
    
    const { evento_fecha, nombre_evento, es_creador, es_jugador, es_escape } = resultados[0];

    const tzOffset = -3 * 60 * 60 * 1000; 
    const hoyArg = new Date(Date.now() + tzOffset).toISOString().split('T')[0];

    // Chequeamos si el evento ya pasó o está transcurriendo
    if (hoyArg >= evento_fecha) {
      return res.status(400).json({ error: 'La convocatoria ha cerrado. Ya estamos en la fecha del evento y la organización está preparando la logística.' });
    }

    // Bloqueamos si ya tiene otra mesa, si está inscrito en otra, o si está en un escape
    if (es_creador > 0 || es_jugador > 0 || es_escape > 0) {
      return res.status(400).json({ 
        error: 'No puedes organizar esta mesa porque ya tienes otro compromiso (como jugador, creador o en un Escape Room) en este evento.' 
      });
    }

    const sqlInsert = `
        INSERT INTO partidas 
        (evento_id, dungeon_master_id, titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, estado, etiqueta, apta_novatos, materiales_pedidos) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'abierta', ?, ?, ?)
    `;
    
    db.query(sqlInsert, [eventoId, usuarioId, titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al crear la mesa.' });
      }
      
      // ✨ REGISTRO EN BITÁCORA
      const tipoMesaLog = etiqueta === 'Juegos de Mesa' ? 'CONVOCAR_JUEGO' : 'CREAR_MESA';
      const descLog = etiqueta === 'Juegos de Mesa' 
        ? `Convocó el juego de mesa "${titulo}" para la jornada "${nombre_evento}".`
        : `Abrió la mesa de Rol "${titulo}" para la jornada "${nombre_evento}".`;

      registrarLog(req.usuario, tipoMesaLog, descLog);

      // ✨ MAGIA DE NOTIFICACIÓN (Solo para DMs creando su PRIMERA mesa de Rol)
      if (etiqueta !== 'Juegos de Mesa') {
        db.query("SELECT COUNT(*) AS total_mesas FROM partidas WHERE dungeon_master_id = ? AND etiqueta != 'Juegos de Mesa'", [usuarioId], (err, countResult) => {
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

      const io = req.app.get('io');
      if (io) io.emit('actualizacion-mesas', { eventoId: parseInt(eventoId) });
      
      res.status(201).json({ mensaje: `¡${etiqueta === 'Juegos de Mesa' ? 'Juego de mesa' : 'Mesa'} convocado con éxito!` });
    });
  });
});

// 5. Modificar un Evento (Solo Admins)
router.put('/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo los líderes del gremio pueden alterar la historia.' });

  const eventoId = req.params.id;
  let { nombre, descripcion, fecha, hora_inicio, hora_fin, estado, lugar, ciudad } = req.body;

  const fechaLimpia = fecha.replace(/\//g, '-');

  const sqlUpdate = `
    UPDATE eventos 
    SET nombre = ?, descripcion = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, estado = ?, lugar = ?, ciudad = ?
    WHERE id = ?
  `;

  db.query(sqlUpdate, [nombre, descripcion, fechaLimpia, hora_inicio, hora_fin, estado, lugar, ciudad, eventoId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al modificar los registros del evento.' });
    }
    
    registrarLog(req.usuario, 'MODIFICAR_EVENTO', `Alteró los registros de la jornada: "${nombre}".`);

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-eventos');
    
    res.status(200).json({ mensaje: '¡La jornada ha sido reescrita con éxito!' });
  });
});

// 6. Eliminar un evento (Solo Admins)
router.delete('/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Sin autorización.' });
  
  db.query("SELECT nombre FROM eventos WHERE id = ?", [req.params.id], (err, result) => {
      const nombreEvento = result[0]?.nombre || 'Desconocido';

      db.query("DELETE FROM eventos WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).send('Error');
        
        registrarLog(req.usuario, 'ELIMINAR_EVENTO', `Canceló y borró la jornada: "${nombreEvento}".`);

        const io = req.app.get('io');
        if (io) io.emit('actualizacion-eventos');
        
        res.send('Evento borrado');
      });
  });
});

module.exports = router;
