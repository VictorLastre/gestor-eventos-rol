const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

// ✨ NUEVA RUTA: Obtener el Top de Sistemas Más Jugados (¡Debe ir primero!)
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

// ----------------------------------------------------------------------

router.post('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  // 1. Primero obtenemos el evento_id de la partida a la que se quiere anotar
  const sqlInfoMesa = `SELECT evento_id, cupo, (SELECT COUNT(*) FROM inscripciones WHERE partida_id = ?) as anotados FROM partidas WHERE id = ?`;

  db.query(sqlInfoMesa, [idPartida, idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error de servidor.');
    if (resultados.length === 0) return res.status(404).send('La mesa ya no existe.');
    
    const { evento_id, cupo, anotados } = resultados[0];

    // 2. Verificamos cupo
    if (anotados >= cupo) return res.status(400).send('❌ ¡Mesa llena! No quedan lugares.');

    // 3. REGLA DE ORO: Verificar si ya participa en este evento (como DM o como Jugador)
    const sqlValidarParticipacion = `
      SELECT 
        (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_dm,
        (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador
    `;

    db.query(sqlValidarParticipacion, [evento_id, idUsuario, evento_id, idUsuario], (err, participacion) => {
      if (err) return res.status(500).send('Error al consultar los anales del gremio.');

      const { es_dm, es_jugador } = participacion[0];

      if (es_dm > 0) {
        return res.status(400).send('⚠️ Ya eres Dungeon Master en este evento. ¡No puedes participar como jugador al mismo tiempo!');
      }

      if (es_jugador > 0) {
        return res.status(400).send('⚠️ Ya estás inscrito en otra mesa de este evento. Solo puedes participar en una aventura por jornada.');
      }

      // 4. Si pasó todas las pruebas, lo anotamos
      db.query("INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)", [idUsuario, idPartida], (err) => {
        if (err) return res.status(400).send('Ya estás anotado o hubo un error inesperado.');
        res.status(201).send('¡Te has unido a la aventura!');
      });
    });
  });
});

// ✨ RUTA PROTEGIDA: Solo el DM dueño o un Admin pueden disolver la mesa y NOTIFICAR
router.delete('/:id', verificarToken, (req, res) => {
  const partidaId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  // 1. Verificamos quién es el DM de esta partida y obtenemos el título
  db.query("SELECT dungeon_master_id, titulo FROM partidas WHERE id = ?", [partidaId], (err, resultados) => {
    if (err) return res.status(500).send('Error al buscar la mesa en los registros.');
    if (resultados.length === 0) return res.status(404).send('La mesa no existe.');

    const dmId = resultados[0].dungeon_master_id;
    const tituloPartida = resultados[0].titulo;

    // 2. Candado de seguridad
    if (dmId !== usuarioId && rolUsuario !== 'admin') {
      return res.status(403).send('No tienes autoridad para disolver esta mesa.');
    }

    // 3. Buscamos a los jugadores inscritos ANTES de borrar la mesa
    db.query("SELECT usuario_id FROM inscripciones WHERE partida_id = ?", [partidaId], (err, inscritos) => {
      if (err) console.error("Error buscando inscritos para notificar:", err);

      // 4. Si hay inscritos, preparamos y enviamos las notificaciones
      if (inscritos && inscritos.length > 0) {
        const mensaje = `El Director de Juego ha disuelto la mesa de "${tituloPartida}". Tu inscripción ha sido cancelada.`;
        const values = inscritos.map(jugador => [jugador.usuario_id, mensaje]);
        
        db.query("INSERT INTO notificaciones (usuario_id, mensaje) VALUES ?", [values], (err) => {
          if (err) console.error("Error al enviar cuervos mensajeros:", err);
        });
      }

      // 5. Finalmente, disolvemos la mesa
      db.query("DELETE FROM partidas WHERE id = ?", [partidaId], (err) => {
        if (err) return res.status(500).send('Error al disolver la mesa.');
        res.send('Mesa disuelta correctamente y aventureros notificados.');
      });
    });
  });
});

router.get('/:id/jugadores', verificarToken, (req, res) => {
  const sql = "SELECT u.id, u.nombre, u.email, u.rol FROM usuarios u JOIN inscripciones i ON u.id = i.usuario_id WHERE i.partida_id = ?";
  db.query(sql, [req.params.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar los aventureros.' });
    res.json(resultados);
  });
});

// ✨ RUTA PROTEGIDA: Solo el DM dueño o un Admin pueden disolver la mesa
router.delete('/:id', verificarToken, (req, res) => {
  const partidaId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  // Primero verificamos quién es el DM de esta partida
  db.query("SELECT dungeon_master_id FROM partidas WHERE id = ?", [partidaId], (err, resultados) => {
    if (err) return res.status(500).send('Error al buscar la mesa en los registros.');
    if (resultados.length === 0) return res.status(404).send('La mesa no existe.');

    const dmId = resultados[0].dungeon_master_id;

    // Candado de seguridad
    if (dmId !== usuarioId && rolUsuario !== 'admin') {
      return res.status(403).send('No tienes autoridad para disolver esta mesa.');
    }

    // Si pasa el filtro, procedemos a borrarla
    db.query("DELETE FROM partidas WHERE id = ?", [partidaId], (err) => {
      if (err) return res.status(500).send('Error al disolver la mesa.');
      res.send('Mesa disuelta correctamente.');
    });
  });
});

// ✨ NUEVA RUTA: Modificar una mesa (Solo el DM dueño o un Admin)
router.put('/:id', verificarToken, (req, res) => {
  const partidaId = req.params.id;
  const usuarioId = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  // 1. Verificamos de quién es la mesa
  db.query("SELECT dungeon_master_id FROM partidas WHERE id = ?", [partidaId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al buscar los pergaminos de la mesa.' });
    if (resultados.length === 0) return res.status(404).json({ error: 'La mesa no existe.' });

    const dmId = resultados[0].dungeon_master_id;

    // 2. Candado de seguridad
    if (dmId !== usuarioId && rolUsuario !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para modificar esta historia.' });
    }

    // 3. Extraemos los datos actualizados enviados desde el frontend
    const { titulo, descripcion, requisitos, sistema, cupo, turno, etiqueta, apta_novatos } = req.body;

    // 4. Ejecutamos la actualización
    const sqlUpdate = `
      UPDATE partidas 
      SET titulo = ?, descripcion = ?, requisitos = ?, sistema = ?, cupo = ?, turno = ?, etiqueta = ?, apta_novatos = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [titulo, descripcion, requisitos, sistema, cupo, turno, etiqueta, apta_novatos, partidaId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al reescribir la mesa.' });
      }
      res.status(200).json({ mensaje: '¡La aventura ha sido actualizada con éxito!' });
    });
  });
});

module.exports = router;