const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

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
    // ✨ AHORA TRAEMOS lugar Y ciudad
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

// 2. Crear un nuevo evento (Solo Admins)
router.post('/', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo Admins.' });
  
  // ✨ CAPTURAMOS lugar y ciudad (Con valores por defecto para tu comodidad)
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

  // ✨ AGREGAMOS LAS COLUMNAS AL INSERT
  const sqlInsert = 'INSERT INTO eventos (nombre, descripcion, fecha, hora_inicio, hora_fin, estado, lugar, ciudad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sqlInsert, [nombre, descripcion, fechaLimpia, hora_inicio, hora_fin, 'Proximo', lugar, ciudad], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al convocar el evento.' });
    }
    res.status(201).json({ mensaje: '¡Evento convocado con éxito!' });
  });
});

// 3. Obtener partidas de un evento específico (✨ CORREGIDO PARA TRAER EL NOMBRE DEL SISTEMA)
router.get('/:id/partidas', verificarToken, (req, res) => {
  const sql = `
    SELECT 
      p.id, p.evento_id, p.dungeon_master_id, p.titulo, p.descripcion, p.requisitos, 
      p.sistema_id, s.nombre AS sistema, -- Traemos el nombre del sistema desde la tabla sistemas
      p.cupo, p.turno, p.estado, p.etiqueta, p.apta_novatos, p.materiales_pedidos,
      u.nombre AS dmNombre, 
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id) AS jugadoresIniciales,
      (SELECT COUNT(*) FROM inscripciones WHERE partida_id = p.id AND usuario_id = ?) AS anotadoInicialmente
    FROM partidas p 
    JOIN usuarios u ON p.dungeon_master_id = u.id
    LEFT JOIN sistemas s ON p.sistema_id = s.id -- Hacemos el cruce de tablas
    WHERE p.evento_id = ? 
    GROUP BY p.id
  `;
  db.query(sql, [req.usuario.id, req.params.id], (err, resultados) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al consultar las mesas.' });
    }
    res.json(resultados);
  });
});

// 4. Crear una mesa en un evento (✨ CORREGIDO PARA GUARDAR sistema_id)
router.post('/:id/partidas', verificarToken, (req, res) => {
  if (req.usuario.rol === 'jugador') return res.status(403).json({ error: 'Solo DMs y Admins pueden crear mesas.' });
  
  const eventoId = req.params.id;
  const usuarioId = req.usuario.id;

  const sqlCheck = `
    SELECT 
      (SELECT COUNT(*) FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?) as es_dm,
      (SELECT COUNT(*) FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE p.evento_id = ? AND i.usuario_id = ?) as es_jugador
  `;
  
  db.query(sqlCheck, [eventoId, usuarioId, eventoId, usuarioId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al consultar los registros del gremio.' });
    
    const { es_dm, es_jugador } = resultados[0];

    if (es_dm > 0) return res.status(400).json({ error: 'Ya estás dirigiendo una mesa en este evento.' });
    if (es_jugador > 0) return res.status(400).json({ error: 'No puedes crear una mesa porque ya estás anotado como jugador en este evento.' });

    // ✨ Ahora recibimos sistema_id del body, no sistema
    const { titulo, descripcion, requisitos, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos } = req.body;
    
    // ✨ Insertamos sistema_id
    const sqlInsert = `
        INSERT INTO partidas 
        (evento_id, dungeon_master_id, titulo, descripcion, requisitos, sistema_id, cupo, turno, estado, etiqueta, apta_novatos, materiales_pedidos) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'abierta', ?, ?, ?)
    `;
    
    db.query(sqlInsert, [eventoId, usuarioId, titulo, descripcion, requisitos, sistema_id, cupo, turno, etiqueta, apta_novatos, materiales_pedidos], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al crear la mesa.' });
      }
      res.status(201).json({ mensaje: '¡Mesa creada con éxito!' });
    });
  });
});

// 5. Modificar un Evento (Solo Admins)
router.put('/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo los líderes del gremio pueden alterar la historia.' });

  const eventoId = req.params.id;
  // ✨ RECIBIMOS lugar y ciudad PARA LA EDICIÓN
  let { nombre, descripcion, fecha, hora_inicio, hora_fin, estado, lugar, ciudad } = req.body;

  // Limpiamos la fecha por si viene con barras / la pasamos a guiones -
  const fechaLimpia = fecha.replace(/\//g, '-');

  // ✨ ACTUALIZAMOS lugar y ciudad EN LA BASE DE DATOS
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
    res.status(200).json({ mensaje: '¡La jornada ha sido reescrita con éxito!' });
  });
});

// 6. Eliminar un evento (Solo Admins)
router.delete('/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Sin autorización.' });
  db.query("DELETE FROM eventos WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send('Error');
    res.send('Evento borrado');
  });
});

module.exports = router;