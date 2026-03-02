const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

// ✨ ESTADÍSTICAS: Obtener el Top de Sistemas Más Jugados
router.get('/estadisticas/sistemas', verificarToken, (req, res) => {
  const sql = `
    SELECT sistema, COUNT(*) as cantidad 
    FROM partidas 
    GROUP BY sistema 
    ORDER BY cantidad DESC 
    LIMIT 5
  `;
  
  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("Error al consultar el Oráculo de Sistemas:", err);
      return res.status(500).json({ error: 'Error leyendo los sistemas más jugados.' });
    }
    res.json(resultados);
  });
});

// ✨ CREACIÓN: Forjar una nueva mesa/partida y notificar si es la primera
router.post('/', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  if (rolUsuario !== 'dm' && rolUsuario !== 'admin') {
    return res.status(403).json({ error: 'Solo los Directores de Juego pueden convocar aventuras.' });
  }

  const { titulo, descripcion, requisitos, sistema, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, evento_id } = req.body;

  const sqlInsert = `
    INSERT INTO partidas 
    (titulo, descripcion, requisitos, sistema, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, evento_id, dungeon_master_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sqlInsert, [titulo, descripcion, requisitos, sistema, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, evento_id, idUsuario], (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al forjar la mesa en la base de datos.' });
    }

    // ✨ MAGIA DE NOTIFICACIÓN: Verificamos si es la primera mesa de su vida
    db.query("SELECT COUNT(*) AS total_mesas FROM partidas WHERE dungeon_master_id = ?", [idUsuario], (err, countResult) => {
      if (err) console.error("Error al contar las mesas del DM:", err);
      
      // Si el total es 1 (la que acaba de crear), le avisamos a los admins
      if (countResult && countResult[0].total_mesas === 1) {
        
        // Buscamos a todos los administradores
        db.query("SELECT id FROM usuarios WHERE rol = 'admin'", (err, admins) => {
          if (err || admins.length === 0) return; // Si no hay admins o hay error, seguimos en silencio
          
          const mensajeNotif = `¡El Escriba anuncia que el DM ${req.usuario.nombre} ha convocado su primera mesa ("${titulo}")! Recuerda forjar su Certificado del Gremio en el Censo.`;
          
          // Preparamos el array de valores para hacer un insert múltiple (uno por cada admin)
          const notificacionesValues = admins.map(admin => [admin.id, mensajeNotif]);
          
          db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES ?", [notificacionesValues], (err) => {
             if(err) console.error("Error al enviar los cuervos a los admins:", err);
          });
        });
      }
    });

    res.status(201).json({ mensaje: '¡Mesa forjada con éxito! Los aventureros ya pueden unirse.' });
  });
});

// ✨ INSCRIPCIONES: Unirse a una aventura
router.post('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  const sqlInfoMesa = `SELECT evento_id, cupo, (SELECT COUNT(*) FROM inscripciones WHERE partida_id = ?) as anotados FROM partidas WHERE id = ?`;

  db.query(sqlInfoMesa, [idPartida, idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error de servidor.');
    if (resultados.length === 0) return res.status(404).send('La mesa ya no existe.');
    
    const { evento_id, cupo, anotados } = resultados[0];

    if (anotados >= cupo) return res.status(400).send('❌ ¡Mesa llena! No quedan lugares.');

    const sqlValidarParticipacion = `
      SELECT 
        (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_dm,
        (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador
    `;

    db.query(sqlValidarParticipacion, [evento_id, idUsuario, evento_id, idUsuario], (err, participacion) => {
      if (err) return res.status(500).send('Error al consultar los anales del gremio.');

      const { es_dm, es_jugador } = participacion[0];

      if (es_dm > 0) return res.status(400).send('⚠️ Ya eres DM en este evento.');
      if (es_jugador > 0) return res.status(400).send('⚠️ Ya estás inscrito en otra mesa de este evento.');

      db.query("INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)", [idUsuario, idPartida], (err) => {
        if (err) return res.status(400).send('Error al anotarse.');
        res.status(201).send('¡Te has unido a la aventura!');
      });
    });
  });
});

// ✨ DESERCIÓN: Abandonar una mesa
router.delete('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  const sqlDelete = 'DELETE FROM inscripciones WHERE partida_id = ? AND usuario_id = ?';
  
  db.query(sqlDelete, [idPartida, idUsuario], (err, resultado) => {
    if (err) return res.status(500).send('Error al abandonar la mesa.');
    if (resultado.affectedRows === 0) return res.status(400).send('No figurabas en los registros.');
    res.status(200).send('Has abandonado la mesa exitosamente.');
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

// ✨ ELIMINACIÓN: Disolver mesa + Notificaciones automáticas
router.delete('/:id', verificarToken, (req, res) => {
  const partidaId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  db.query("SELECT dungeon_master_id, titulo FROM partidas WHERE id = ?", [partidaId], (err, resultados) => {
    if (err) return res.status(500).send('Error de servidor.');
    if (resultados.length === 0) return res.status(404).send('La mesa no existe.');

    const { dungeon_master_id: dmId, titulo } = resultados[0];

    if (dmId !== usuarioId && rolUsuario !== 'admin') {
      return res.status(403).send('No tienes autoridad para disolver esta mesa.');
    }

    // Buscamos inscritos para avisarles por cuervo mensajero
    db.query("SELECT usuario_id FROM inscripciones WHERE partida_id = ?", [partidaId], (err, inscritos) => {
      if (inscritos && inscritos.length > 0) {
        const mensaje = `El Director de Juego ha disuelto la mesa de "${titulo}". Tu inscripción ha sido cancelada.`;
        const values = inscritos.map(j => [j.usuario_id, mensaje]);
        db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES ?", [values], (err) => {
          if (err) console.error("Error al crear notificaciones:", err);
        });
      }

      db.query("DELETE FROM partidas WHERE id = ?", [partidaId], (err) => {
        if (err) return res.status(500).send('Error al disolver la mesa.');
        res.send('Mesa disuelta correctamente y aventureros notificados.');
      });
    });
  });
});

// ✨ EDICIÓN: Modificar detalles de la mesa
router.put('/:id', verificarToken, (req, res) => {
  const partidaId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  db.query("SELECT dungeon_master_id FROM partidas WHERE id = ?", [partidaId], (err, resultados) => {
    if (err || resultados.length === 0) return res.status(404).json({ error: 'Mesa no encontrada.' });

    const dmId = resultados[0].dungeon_master_id;
    if (dmId !== usuarioId && rolUsuario !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos.' });
    }

    const { titulo, descripcion, requisitos, sistema, cupo, turno, etiqueta, apta_novatos, materiales_pedidos } = req.body;

    const sqlUpdate = `
      UPDATE partidas 
      SET titulo = ?, descripcion = ?, requisitos = ?, sistema = ?, cupo = ?, turno = ?, etiqueta = ?, apta_novatos = ?, materiales_pedidos = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [titulo, descripcion, requisitos, sistema, cupo, turno, etiqueta, apta_novatos, materiales_pedidos, partidaId], (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar.' });
      res.status(200).json({ mensaje: '¡Aventura actualizada!' });
    });
  });
});

// ✨ LOGÍSTICA: Reporte completo para Fundadores (Excel)
// Se corrigió u.solicita_dm por u.es_dm_nuevo
router.get('/reporte-logistico/:eventoId', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso reservado a los fundadores.' });

  const sql = `
    SELECT 
      p.titulo as mesa, 
      p.sistema, 
      p.turno, 
      p.materiales_pedidos,
      u.nombre as dm_nombre, 
      u.es_dm_nuevo, 
      GROUP_CONCAT(uj.nombre SEPARATOR ', ') as jugadores
    FROM partidas p
    JOIN usuarios u ON p.dungeon_master_id = u.id
    LEFT JOIN inscripciones i ON p.id = i.partida_id
    LEFT JOIN usuarios uj ON i.usuario_id = uj.id
    WHERE p.evento_id = ?
    GROUP BY p.id
    ORDER BY p.turno ASC
  `;

  db.query(sql, [req.params.eventoId], (err, resultados) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al generar el reporte logístico.' });
    }
    res.json(resultados);
  });
});

module.exports = router;