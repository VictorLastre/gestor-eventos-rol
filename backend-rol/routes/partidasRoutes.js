const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

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

router.delete('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;

  const sqlDelete = 'DELETE FROM inscripciones WHERE partida_id = ? AND usuario_id = ?';
  
  db.query(sqlDelete, [idPartida, idUsuario], (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error mágico al intentar abandonar la mesa.');
    }
    
    if (resultado.affectedRows === 0) {
      return res.status(400).send('No figurabas en los registros de esta mesa.');
    }

    res.status(200).send('Has abandonado la mesa exitosamente.');
  });
});

// ✨ RUTA ACTUALIZADA: Ahora pedimos "u.rol" a la base de datos
router.get('/:id/jugadores', verificarToken, (req, res) => {
  const sql = "SELECT u.id, u.nombre, u.email, u.rol FROM usuarios u JOIN inscripciones i ON u.id = i.usuario_id WHERE i.partida_id = ?";
  db.query(sql, [req.params.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar los aventureros.' });
    res.json(resultados);
  });
});

router.delete('/:id', verificarToken, (req, res) => {
  db.query("DELETE FROM partidas WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al borrar la mesa.');
    res.send('Mesa disuelta correctamente.');
  });
});

module.exports = router;