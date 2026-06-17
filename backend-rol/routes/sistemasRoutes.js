const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth'); // ✨ Importante para la seguridad

// 1. OBTENER SISTEMAS (Público: para que los DMs elijan al crear mesa)
router.get('/', async (req, res) => {
    try {
        // ✨ EL PUENTE MÁGICO APLICADO AQUÍ: db.promise().query
        const [resultados] = await db.promise().query('SELECT * FROM sistemas ORDER BY nombre ASC');
        res.json(resultados);
    } catch (error) {
        console.error('❌ Error al consultar sistemas:', error);
        res.status(500).json({ error: 'Error al consultar sistemas' });
    }
});

// 2. AGREGAR NUEVO SISTEMA (Solo Admin)
router.post('/', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });

    try {
        // ✨ EL PUENTE MÁGICO APLICADO AQUÍ
        await db.promise().query('INSERT INTO sistemas (nombre) VALUES (?)', [nombre]);
        
        // ✨ WEBSOCKETS: Avisar a todos que hay un nuevo sistema en la biblioteca
        const io = req.app.get('io');
        if (io) io.emit('actualizacion-sistemas');

        res.status(201).json({ mensaje: '¡Nuevo sistema incorporado al gremio!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Este sistema ya existe.' });
        }
        console.error('❌ Error al registrar el sistema:', error);
        res.status(500).json({ error: 'Error al registrar el sistema.' });
    }
});

// 3. MODIFICAR SISTEMA (Solo Admin)
router.put('/:id', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    
    const { nombre } = req.body;
    const { id } = req.params;

    try {
        // ✨ EL PUENTE MÁGICO APLICADO AQUÍ
        await db.promise().query('UPDATE sistemas SET nombre = ? WHERE id = ?', [nombre, id]);
        
        // ✨ WEBSOCKETS: Avisar del cambio en los pergaminos
        const io = req.app.get('io');
        if (io) io.emit('actualizacion-sistemas');

        res.json({ mensaje: 'Sistema actualizado correctamente.' });
    } catch (error) {
        console.error('❌ Error al actualizar el sistema:', error);
        res.status(500).json({ error: 'Error al actualizar el sistema.' });
    }
});

// 4. ELIMINAR SISTEMA (Solo Admin)
router.delete('/:id', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    
    const { id } = req.params;

    try {
        // ✨ EL PUENTE MÁGICO APLICADO AQUÍ
        await db.promise().query('DELETE FROM sistemas WHERE id = ?', [id]);
        
        // ✨ WEBSOCKETS: Avisar de la eliminación
        const io = req.app.get('io');
        if (io) io.emit('actualizacion-sistemas');

        res.json({ mensaje: 'Sistema eliminado de los archivos.' });
    } catch (error) {
        // ✨ Nota: MySQL lanzará error si el sistema está siendo usado en alguna mesa (FK constraint)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'No se puede borrar: hay mesas registradas con este sistema.' });
        }
        console.error('❌ Error al eliminar el sistema:', error);
        res.status(500).json({ error: 'Error al eliminar el sistema.' });
    }
});

module.exports = router;