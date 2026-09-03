const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

// POST /api/reputacion - Enviar una evaluación (Honor/Deshonor)
router.post('/', verificarToken, async (req, res) => {
  const { evaluado_id, partida_id, voto, etiqueta } = req.body;
  const evaluador_id = req.usuario.id;

  if (evaluador_id === evaluado_id) {
    return res.status(400).json({ error: 'No puedes evaluarte a ti mismo.' });
  }

  try {
    // 1. Validar que la partida exista y esté finalizada
    const [partidas] = await db.promise().query(
      "SELECT p.id, e.estado FROM partidas p JOIN eventos e ON p.evento_id = e.id WHERE p.id = ?",
      [partida_id]
    );

    if (partidas.length === 0) {
      return res.status(404).json({ error: 'Mesa no encontrada.' });
    }

    if (partidas[0].estado !== 'Finalizado') {
      return res.status(400).json({ error: 'Solo se puede evaluar en mesas finalizadas.' });
    }

    // 2. Validar que evaluador y evaluado participaron (DMs o inscritos)
    const [participantes] = await db.promise().query(
      `SELECT usuario_id FROM inscripciones WHERE partida_id = ? 
       UNION 
       SELECT dungeon_master_id FROM partidas WHERE id = ?`,
      [partida_id, partida_id]
    );

    const idsParticipantes = participantes.map(p => p.usuario_id);
    if (!idsParticipantes.includes(evaluador_id)) {
      return res.status(403).json({ error: 'No participaste en esta mesa.' });
    }
    if (!idsParticipantes.includes(evaluado_id)) {
      return res.status(400).json({ error: 'El usuario evaluado no participó en esta mesa.' });
    }

    // 3. Registrar o actualizar la evaluación
    const sql = `
      INSERT INTO reputacion (evaluador_id, evaluado_id, partida_id, voto, etiqueta)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE voto = VALUES(voto), etiqueta = VALUES(etiqueta)
    `;
    await db.promise().query(sql, [evaluador_id, evaluado_id, partida_id, voto, etiqueta]);

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-usuarios');

    res.json({ success: true, mensaje: 'Evaluación registrada con éxito.' });
  } catch (error) {
    console.error('Error al registrar reputación:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/reputacion/usuario/:id - Obtener reputación de un usuario
router.get('/usuario/:id', async (req, res) => {
  const usuario_id = req.params.id;

  try {
    // Top 3 etiquetas
    const sqlTags = `
      SELECT etiqueta, COUNT(*) as cantidad 
      FROM reputacion 
      WHERE evaluado_id = ? 
      GROUP BY etiqueta 
      ORDER BY cantidad DESC 
      LIMIT 3
    `;
    const [tags] = await db.promise().query(sqlTags, [usuario_id]);

    res.json({ topTags: tags });
  } catch (error) {
    console.error('Error al obtener reputación:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/reputacion/partida/:id/mis-votos - Obtener votos emitidos por el usuario en una partida
router.get('/partida/:id/mis-votos', verificarToken, async (req, res) => {
  try {
    const [votos] = await db.promise().query(
      "SELECT evaluado_id, voto, etiqueta FROM reputacion WHERE evaluador_id = ? AND partida_id = ?",
      [req.usuario.id, req.params.id]
    );
    res.json(votos);
  } catch (error) {
    console.error('Error al obtener mis votos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
