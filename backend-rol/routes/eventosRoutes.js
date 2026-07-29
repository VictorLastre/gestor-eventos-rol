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

const { enviarMensajeAlCanal } = require('../utils/telegram');

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
    
    // ✨ ANUNCIO EN TELEGRAM (Canal) - Mensaje 1 (Detalles del evento, Inmediato)
    const hInicio = hora_inicio ? hora_inicio.substring(0, 5) : '15:00';
    const hFin = hora_fin ? hora_fin.substring(0, 5) : '20:30';

    const mensajeEvento = `📅 <b>¡Nueva Jornada Convocada!</b>\n\n` +
      `⚔️ <b>${nombre}</b>\n` +
      `📝 <i>"${descripcion}"</i>\n\n` +
      `🗓️ <b>Fecha:</b> ${fechaLimpia}\n` +
      `⏰ <b>Horario:</b> ${hInicio} a ${hFin}\n` +
      `📍 <b>Lugar:</b> ${lugar}, ${ciudad}\n\n` +
      `🔮 ¡Regístrate en el portal y asegura tu lugar!`;
      
    enviarMensajeAlCanal(mensajeEvento);

    // ✨ ANUNCIO EN TELEGRAM (Canal) - Mensaje 2 (Convocatoria DMs, a los 5 minutos)
    const mensajeConvocatoria = `⚔️ <b>Convocatoria de Narradores</b> ⚔️\n\n` +
      `Buscamos narradores y cronistas de cualquier sistema:\n` +
      `🎲 Pampa Primigenia, Call of Cthulhu, Vampiro, Alien etc.\n` +
      `🎭 Mesas para principiantes o avanzadas.\n` +
      `⌛ Cada master decide a qué hora realiza su mesa. Siéntete libre de ponerte en contacto con tu grupo y llegar dentro del horario que disponemos.\n\n` +
      `¡Gracias por hacer parte de esta hermosa comunidad!.\n\n` +
      `👉 Puedes registrar tu aventura o crónica en:\n` +
      `https://rollapampa.org/\n` +
      `🔴 Puedes crear tu mesa hasta 24 horas antes del evento. Y puedes sumarte como aventurero hasta 1 hora antes del evento.\n\n` +
      `Nos vemos en la mesa. ✨`;

    // 5 minutos = 300,000 milisegundos
    setTimeout(() => {
      enviarMensajeAlCanal(mensajeConvocatoria);
    }, 300000);

    res.status(201).json({ mensaje: '¡Evento convocado con éxito!' });
  });
});

// 3. Obtener partidas de un evento específico (✨ CON SISTEMA DE NIVEL PARA DMs Y SEGURIDAD DE MESAS PRIVADAS)
router.get('/:id/partidas', verificarToken, (req, res) => {
  const sql = `
    SELECT 
      p.id, p.evento_id, p.dungeon_master_id, p.titulo, p.descripcion, p.requisitos, 
      p.sistema, p.sistema_id, s.nombre AS sistema_db_nombre,
      p.cupo, p.turno, p.estado, p.etiqueta, p.apta_novatos, p.materiales_pedidos,
      IF(p.codigo_privado IS NOT NULL AND p.codigo_privado != '', 1, 0) AS es_privada,
      IF(p.dungeon_master_id = ?, p.codigo_privado, NULL) AS codigo_privado,
      u.nombre AS dmNombre, 
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id) AS jugadoresIniciales,
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id AND usuario_id = ?) AS anotadoInicialmente,
      (1 + (
        SELECT COUNT(*) 
        FROM partidas ph 
        JOIN eventos eh ON ph.evento_id = eh.id 
        WHERE ph.dungeon_master_id = p.dungeon_master_id AND eh.estado = 'Finalizado'
      )) AS dm_nivel,
      ((SELECT COUNT(*) FROM honor_dm WHERE dm_id = p.dungeon_master_id) + ((SELECT COUNT(*) FROM partidas WHERE dungeon_master_id = p.dungeon_master_id) * 5)) AS dm_honor
    FROM partidas p 
    JOIN usuarios u ON p.dungeon_master_id = u.id
    LEFT JOIN sistemas s ON p.sistema_id = s.id 
    WHERE p.evento_id = ? 
  `;
  // Se agregó req.usuario.id por partida doble para la lógica de la contraseña y de si está anotado
  db.query(sql, [req.usuario.id, req.usuario.id, req.params.id], (err, resultados) => {
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
  
  // Extraemos también el codigo_privado del cuerpo de la petición
  const { titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, codigo_privado } = req.body;

  // ✨ VALIDACIÓN DEL TIPO DE MESA Y ROL ✨
  const esOrganizadorValido = rolUsuario === 'dm' || rolUsuario === 'admin';
  const esMesaJuegoValida = (rolUsuario === 'jugador' || rolUsuario === 'aventurero') && etiqueta === 'Juegos de Mesa';

  if (!esOrganizadorValido && !esMesaJuegoValida) {
    return res.status(403).json({ 
      error: 'Solo los Directores de Juego pueden convocar aventuras de Rol. Como Jugador, solo puedes organizar Juegos de Mesa.' 
    });
  }

  const sqlCheck = `
    SELECT 
      DATE_FORMAT(e.fecha, '%Y-%m-%d') as evento_fecha,
      e.hora_inicio,
      e.nombre as nombre_evento,
      (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_creador,
      (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador,
      (SELECT COUNT(*) FROM escape_inscripciones ei JOIN escape_turnos et ON ei.escape_turno_id = et.id JOIN escape_rooms er ON et.escape_room_id = er.id WHERE er.evento_id = ? AND ei.usuario_id = ?) as es_escape
    FROM eventos e WHERE e.id = ?
  `;
  
  db.query(sqlCheck, [eventoId, usuarioId, eventoId, usuarioId, eventoId, usuarioId, eventoId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar los registros del gremio.' });
    if (resultados.length === 0) return res.status(404).json({ error: 'El evento no existe.' });
    
    const { evento_fecha, hora_inicio, nombre_evento, es_creador, es_jugador, es_escape } = resultados[0];

    const ahoraMs = Date.now();
    // Parseamos la fecha del evento junto a su hora de inicio (Asumiendo zona horaria de Argentina UTC-3)
    const eventoDateStr = `${evento_fecha}T${hora_inicio || '00:00:00'}-03:00`;
    const msEvento = Date.parse(eventoDateStr);
    const horasRestantes = (msEvento - ahoraMs) / (1000 * 60 * 60);

    // Chequeamos si faltan menos de 24 horas
    if (horasRestantes < 24) {
      return res.status(400).json({ error: 'La convocatoria ha cerrado. Solo se pueden publicar mesas hasta 24 horas antes del inicio del evento.' });
    }

    // Bloqueamos si ya tiene otra mesa, si está inscrito en otra, o si está en un escape
    if (es_creador > 0 || es_jugador > 0 || es_escape > 0) {
      return res.status(400).json({ 
        error: 'No puedes organizar esta mesa porque ya tienes otro compromiso (como jugador, creador o en un Escape Room) en este evento.' 
      });
    }

    // Añadimos el codigo_privado a la inserción
    const sqlInsert = `
        INSERT INTO partidas 
        (evento_id, dungeon_master_id, titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, estado, etiqueta, apta_novatos, materiales_pedidos, codigo_privado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'abierta', ?, ?, ?, ?)
    `;
    
    db.query(sqlInsert, [eventoId, usuarioId, titulo, descripcion, requisitos, sistema, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, codigo_privado || null], (err) => {
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

      // ✨ ANUNCIO EN TELEGRAM (Canal)
      const { enviarMensajeAlCanal } = require('../utils/telegram');
      
      // Función auxiliar para obtener el nombre del sistema
      const obtenerNombreSistema = () => {
        return new Promise((resolve) => {
          if (sistema) return resolve(sistema);
          if (sistema_id) {
            db.query("SELECT nombre FROM sistemas WHERE id = ?", [sistema_id], (err, res) => {
              if (!err && res.length > 0) return resolve(res[0].nombre);
              resolve("Desconocido");
            });
          } else {
            resolve("Desconocido");
          }
        });
      };

      obtenerNombreSistema().then(sistemaNombre => {
        const mensajeTelegram = etiqueta === 'Juegos de Mesa'
          ? `🃏 <b>¡Nuevo Juego de Mesa Convocado!</b>\n\n` +
            `📦 <b>${titulo}</b>\n` +
            `🎲 <b>Juego:</b> ${sistemaNombre}\n` +
            `📝 <i>"${descripcion}"</i>\n\n` +
            `👤 <b>Organiza:</b> ${req.usuario.nombre}\n` +
            `🔮 <b>Jornada:</b> ${nombre_evento}\n` +
            `⏰ <b>Turno:</b> ${turno} | 👥 <b>Cupo:</b> ${cupo} jugadores\n` +
            `🌱 <b>¿Enseña reglas?:</b> ${apta_novatos ? 'Sí, apto para novatos' : 'No'}\n\n` +
            `⚔️ ¡Anótate en el portal para jugar!`
          : `🎲 <b>¡Nueva Mesa de Rol Forjada!</b>\n\n` +
            `⚔️ <b>${titulo}</b>\n` +
            `📜 <b>Sistema:</b> ${sistemaNombre}\n` +
            `📝 <i>"${descripcion}"</i>\n\n` +
            `🧙‍♂️ <b>Master:</b> ${req.usuario.nombre}\n` +
            `🔮 <b>Jornada:</b> ${nombre_evento}\n` +
            `⏰ <b>Turno:</b> ${turno} | 👥 <b>Cupo:</b> ${cupo} aventureros\n` +
            `🌱 <b>Apta novatos:</b> ${apta_novatos ? 'Sí' : 'No'}\n\n` +
            `🛡️ ¡Prepara tus dados y regístrate!`;

        enviarMensajeAlCanal(mensajeTelegram);
      });

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

// 7. Enviar convocatoria de DMs a Telegram (Solo Admins)
router.post('/:id/convocatoria', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Sin autorización.' });
  
  db.query("SELECT * FROM eventos WHERE id = ?", [req.params.id], (err, result) => {
    if (err || result.length === 0) return res.status(404).json({ error: 'Evento no encontrado.' });
    
    const evento = result[0];
    
    // Formatear la fecha correctamente usando UTC para evitar desfases de zona horaria
    const fechaObj = new Date(evento.fecha);
    const dia = fechaObj.getUTCDate().toString().padStart(2, '0');
    
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mes = meses[fechaObj.getUTCMonth()];
    
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = diasSemana[fechaObj.getUTCDay()];
    
    const horaInicio = evento.hora_inicio ? evento.hora_inicio.substring(0, 5) : '15:00';
    const horaFin = evento.hora_fin ? evento.hora_fin.substring(0, 5) : '20:30';
    
    const { enviarMensajeAlCanal } = require('../utils/telegram');
    
    const mensajeTelegram = `⚔️ <b>Convocatoria de Narradores</b> ⚔️ – ${evento.nombre}\n\n` +
      `📍 ${evento.lugar}, ${evento.ciudad}\n` +
      `📅 ${diaSemana}, ${dia} de ${mes}\n` +
      `⏰ De ${horaInicio} a ${horaFin} hs\n\n` +
      `Buscamos narradores y cronistas de cualquier sistema:\n` +
      `🎲 Pampa Primigenia, Call of Cthulhu, Vampiro, Alien etc.\n` +
      `🎭 Mesas para principiantes o avanzadas.\n` +
      `⌛ Cada master decide a qué hora realiza su mesa. Siéntete libre de ponerte en contacto con tu grupo y llegar dentro del horario que disponemos.\n\n` +
      `¡Gracias por hacer parte de esta hermosa comunidad!.\n\n` +
      `👉 Puedes registrar tu aventura o crónica en:\n` +
      `https://rollapampa.org/\n` +
      `🔴 Puedes crear tu mesa hasta 24 horas antes del evento. Y puedes sumarte como aventurero hasta 1 hora antes del evento.\n\n` +
      `Nos vemos en la mesa. ✨`;

    enviarMensajeAlCanal(mensajeTelegram);
    
    registrarLog(req.usuario, 'CONVOCATORIA_DMS', `Envió llamado a DMs por Telegram para: "${evento.nombre}".`);
    
    res.json({ mensaje: 'Convocatoria enviada al canal de Telegram.' });
  });
});

module.exports = router;