const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const { emitirAClub } = require('../utils/socketNotifier');

// POST /api/buzon - Enviar un mensaje (público)
router.post('/', (req, res) => {
  const { tipo, mensaje, club_id } = req.body;
  
  if (!tipo || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  
  const idClub = (club_id && club_id !== 'todos') ? parseInt(club_id, 10) : 1;
  const query = "INSERT INTO buzon_sugerencias (tipo, mensaje, club_id) VALUES (?, ?, ?)";
  db.query(query, [tipo, mensaje, idClub], (err, result) => {
    if (err) {
      console.error('Error al guardar en el buzón:', err);
      return res.status(500).json({ error: 'Error del servidor al guardar el mensaje.' });
    }
    
    // Opcional: Notificar a los admins conectados (Socket.io)
    const io = req.app.get('io');
    if (io) emitirAClub(io, 'nuevo-mensaje-buzon', { club_id: idClub }, idClub);
    
    res.status(201).json({ success: true, message: 'Mensaje depositado en el buzón.' });
  });
});

// GET /api/buzon - Obtener todos los mensajes (solo admin, filtrado por sede)
router.get('/', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  
  const clubId = req.query.club_id;
  const esSuperAdmin = req.usuario.rol === 'superadmin';

  let sql = "SELECT * FROM buzon_sugerencias";
  let params = [];

  if (clubId && clubId !== 'todos') {
    sql += " WHERE IFNULL(club_id, 1) = ?";
    params.push(parseInt(clubId, 10));
  } else if (!esSuperAdmin) {
    sql += " WHERE IFNULL(club_id, 1) = ?";
    params.push(req.usuario.club_id || 1);
  }

  sql += " ORDER BY fecha DESC";
  
  db.query(sql, params, (err, resultados) => {
    if (err) {
      console.error('Error al obtener el buzón:', err);
      return res.status(500).json({ error: 'Error al obtener el buzón.' });
    }
    res.json(resultados);
  });
});

// PUT /api/buzon/:id/leer - Marcar como leído o no leído (solo admin)
router.put('/:id/leer', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  
  const { leido } = req.body;
  
  db.query("UPDATE buzon_sugerencias SET leido = ? WHERE id = ?", [leido, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar el estado.' });
    
    const io = req.app.get('io');
    if (io) emitirAClub(io, 'actualizacion-buzon');
    
    res.json({ success: true });
  });
});

// DELETE /api/buzon/:id - Eliminar un mensaje (solo admin)
router.delete('/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  
  db.query("DELETE FROM buzon_sugerencias WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar el mensaje.' });
    
    const io = req.app.get('io');
    if (io) emitirAClub(io, 'actualizacion-buzon');
    
    res.json({ success: true });
  });
});

module.exports = router;
