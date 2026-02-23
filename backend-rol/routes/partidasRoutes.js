const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

router.post('/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;
  const sqlCupo = `SELECT cupo, (SELECT COUNT(*) FROM inscripciones WHERE partida_id = ?) as anotados FROM partidas WHERE id = ?`;

  db.query(sqlCupo, [idPartida, idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error de servidor.');
    if (resultados.length === 0) return res.status(404).send('La mesa ya no existe.');
    if (resultados[0].anotados >= resultados[0].cupo) return res.status(400).send('❌ ¡Mesa llena! No quedan lugares.');

    db.query("INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)", [idUsuario, idPartida], (err) => {
      if (err) return res.status(400).send('Ya estás anotado o hubo un error.');
      res.status(201).send('¡Te has unido a la aventura!');
    });
  });
});

router.delete('/:id/inscripciones', verificarToken, (req, res) => {
  db.query("DELETE FROM inscripciones WHERE usuario_id = ? AND partida_id = ?", [req.usuario.id, req.params.id], (err, resultado) => {
    if (err) return res.status(500).send('Error en los anales del gremio.');
    if (resultado.affectedRows === 0) return res.status(404).send('No se encontró tu inscripción en esta mesa.');
    res.send('Has abandonado la misión correctamente.');
  });
});

router.get('/:id/jugadores', verificarToken, (req, res) => {
  const sql = "SELECT u.id, u.nombre, u.email FROM usuarios u JOIN inscripciones i ON u.id = i.usuario_id WHERE i.partida_id = ?";
  db.query(sql, [req.params.id], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error.' });
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