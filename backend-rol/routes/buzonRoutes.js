const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

// POST /api/buzon - Enviar un mensaje (público)
router.post('/', (req, res) => {
  const { tipo, mensaje } = req.body;
  
  if (!tipo || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  
  const query = "INSERT INTO buzon_sugerencias (tipo, mensaje) VALUES (?, ?)";
  db.query(query, [tipo, mensaje], (err, result) => {
    if (err) {
      console.error('Error al guardar en el buzón:', err);
      return res.status(500).json({ error: 'Error del servidor al guardar el mensaje.' });
    }
    
    // Opcional: Notificar a los admins conectados (Socket.io)
    const io = req.app.get('io');
    if (io) io.emit('nuevo-mensaje-buzon');
    
    res.status(201).json({ success: true, message: 'Mensaje depositado en el buzón.' });
  });
});

// GET /api/buzon - Obtener todos los mensajes (solo admin)
router.get('/', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  
  db.query("SELECT * FROM buzon_sugerencias ORDER BY fecha DESC", (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al obtener el buzón.' });
    res.json(resultados);
  });
});

// PUT /api/buzon/:id/leer - Marcar como leído o no leído (solo admin)
router.put('/:id/leer', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  
  const { leido } = req.body; // true o false
  
  db.query("UPDATE buzon_sugerencias SET leido = ? WHERE id = ?", [leido, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar el estado.' });
    
    const io = req.app.get('io');
    if (io) io.emit('actualizacion-buzon');
    
    res.json({ success: true });
  });
});

// DELETE /api/buzon/:id - Eliminar un mensaje (solo admin)
router.delete('/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  
  db.query("DELETE FROM buzon_sugerencias WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar el mensaje.' });
    
    const io = req.app.get('io');
    if (io) io.emit('actualizacion-buzon');
    
    res.json({ success: true });
  });
});

module.exports = router;
