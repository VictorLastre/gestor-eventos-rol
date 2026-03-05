const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth'); // ✨ Importante para la seguridad

// 1. OBTENER SISTEMAS (Público: para que los DMs elijan al crear mesa)
router.get('/', (req, res) => {
    db.query('SELECT * FROM sistemas ORDER BY nombre ASC', (err, resultados) => {
        if (err) return res.status(500).json({ error: 'Error al consultar sistemas' });
        res.json(resultados);
    });
});

// 2. AGREGAR NUEVO SISTEMA (Solo Admin)
router.post('/', verificarToken, (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });

    db.query('INSERT INTO sistemas (nombre) VALUES (?)', [nombre], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Este sistema ya existe.' });
            return res.status(500).json({ error: 'Error al registrar el sistema.' });
        }
        
        // ✨ WEBSOCKETS: Avisar a todos que hay un nuevo sistema en la biblioteca
        const io = req.app.get('io');
        if (io) io.emit('actualizacion-sistemas');

        res.status(201).json({ mensaje: '¡Nuevo sistema incorporado al gremio!' });
    });
});

// 3. MODIFICAR SISTEMA (Solo Admin)
router.put('/:id', verificarToken, (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    
    const { nombre } = req.body;
    const { id } = req.params;

    db.query('UPDATE sistemas SET nombre = ? WHERE id = ?', [nombre, id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar el sistema.' });
        
        // ✨ WEBSOCKETS: Avisar del cambio en los pergaminos
        const io = req.app.get('io');
        if (io) io.emit('actualizacion-sistemas');

        res.json({ mensaje: 'Sistema actualizado correctamente.' });
    });
});

// 4. ELIMINAR SISTEMA (Solo Admin)
router.delete('/:id', verificarToken, (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    
    const { id } = req.params;

    // ✨ Nota: MySQL lanzará error si el sistema está siendo usado en alguna mesa (FK constraint)
    db.query('DELETE FROM sistemas WHERE id = ?', [id], (err) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ error: 'No se puede borrar: hay mesas registradas con este sistema.' });
            }
            return res.status(500).json({ error: 'Error al eliminar el sistema.' });
        }
        
        // ✨ WEBSOCKETS: Avisar de la eliminación
        const io = req.app.get('io');
        if (io) io.emit('actualizacion-sistemas');

        res.json({ mensaje: 'Sistema eliminado de los archivos.' });
    });
});

module.exports = router;