const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const { emitirAClub } = require('../utils/socketNotifier');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

// Helper para extraer usuario opcional sin bloquear la petición pública
const extraerUsuarioOpcional = (req) => {
  const token = req.headers['authorization'];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};

// =========================================================================
// 1. LISTAR TALLERES Y CURSOS
// =========================================================================
router.get('/', (req, res) => {
  const usuario = extraerUsuarioOpcional(req);
  const usuarioId = usuario ? parseInt(usuario.id, 10) : null;

  const { club_id, evento_id, sin_evento, estado } = req.query;

  let whereClauses = [];
  let params = [];

  // Filtrado por sede / club
  if (club_id && club_id !== 'todos') {
    whereClauses.push('(t.club_id = ? OR t.club_id IS NULL)');
    params.push(parseInt(club_id, 10));
  }

  // Filtrado por evento específico
  if (evento_id) {
    whereClauses.push('t.evento_id = ?');
    params.push(parseInt(evento_id, 10));
  }

  // Filtrado exclusivo de talleres autónomos (sin evento asignado)
  if (sin_evento === 'true') {
    whereClauses.push('t.evento_id IS NULL');
  }

  // Filtrado por estado si se especifica
  if (estado) {
    whereClauses.push('t.estado = ?');
    params.push(estado);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      t.id,
      t.club_id,
      c.nombre AS club_nombre,
      t.evento_id,
      e.nombre AS evento_nombre,
      DATE_FORMAT(e.fecha, '%Y-%m-%d') AS evento_fecha,
      t.titulo,
      t.descripcion,
      t.tipo,
      t.modalidad,
      t.instructor_id,
      t.instructor_nombre,
      t.cupo,
      DATE_FORMAT(t.fecha, '%Y-%m-%d') AS fecha,
      t.hora_inicio,
      t.hora_fin,
      t.lugar,
      t.requisitos,
      t.materiales_incluidos,
      t.costo,
      t.destinatarios,
      t.estado,
      t.creado_por,
      t.fecha_creacion,
      (SELECT COUNT(*) FROM taller_inscripciones WHERE taller_id = t.id) AS inscritos_count,
      ${usuarioId ? `(SELECT COUNT(*) FROM taller_inscripciones WHERE taller_id = t.id AND usuario_id = ${usuarioId})` : '0'} AS esta_inscrito,
      ${usuarioId ? `(SELECT asistencia FROM taller_inscripciones WHERE taller_id = t.id AND usuario_id = ${usuarioId} LIMIT 1)` : 'NULL'} AS mi_asistencia
    FROM talleres_cursos t
    LEFT JOIN clubes c ON t.club_id = c.id
    LEFT JOIN eventos e ON t.evento_id = e.id
    ${whereSql}
    ORDER BY t.fecha ASC, t.hora_inicio ASC
  `;

  db.query(sql, params, (err, resultados) => {
    if (err) {
      console.error('Error al consultar talleres:', err);
      return res.status(500).json({ error: 'Error al consultar talleres y cursos.' });
    }
    res.json(resultados);
  });
});

// =========================================================================
// 2. DETALLE DE UN TALLER E INSCRIPTOS
// =========================================================================
router.get('/:id', (req, res) => {
  const tallerId = parseInt(req.params.id, 10);
  const usuario = extraerUsuarioOpcional(req);
  const usuarioId = usuario ? parseInt(usuario.id, 10) : null;
  const esAdmin = usuario && (usuario.rol === 'admin' || usuario.rol === 'superadmin');

  const sqlTaller = `
    SELECT 
      t.id,
      t.club_id,
      c.nombre AS club_nombre,
      t.evento_id,
      e.nombre AS evento_nombre,
      DATE_FORMAT(e.fecha, '%Y-%m-%d') AS evento_fecha,
      t.titulo,
      t.descripcion,
      t.tipo,
      t.modalidad,
      t.instructor_id,
      t.instructor_nombre,
      t.cupo,
      DATE_FORMAT(t.fecha, '%Y-%m-%d') AS fecha,
      t.hora_inicio,
      t.hora_fin,
      t.lugar,
      t.requisitos,
      t.materiales_incluidos,
      t.costo,
      t.destinatarios,
      t.estado,
      t.creado_por,
      (SELECT COUNT(*) FROM taller_inscripciones WHERE taller_id = t.id) AS inscritos_count,
      ${usuarioId ? `(SELECT COUNT(*) FROM taller_inscripciones WHERE taller_id = t.id AND usuario_id = ${usuarioId})` : '0'} AS esta_inscrito,
      ${usuarioId ? `(SELECT asistencia FROM taller_inscripciones WHERE taller_id = t.id AND usuario_id = ${usuarioId} LIMIT 1)` : 'NULL'} AS mi_asistencia
    FROM talleres_cursos t
    LEFT JOIN clubes c ON t.club_id = c.id
    LEFT JOIN eventos e ON t.evento_id = e.id
    WHERE t.id = ?
  `;

  db.query(sqlTaller, [tallerId], (err, resultados) => {
    if (err || resultados.length === 0) {
      return res.status(404).json({ error: 'Taller o curso no encontrado.' });
    }

    const taller = resultados[0];

    // Obtenemos lista de participantes inscritos
    const sqlInscritos = `
      SELECT 
        ti.id AS inscripcion_id,
        u.id AS usuario_id,
        u.nombre,
        ${esAdmin ? 'u.nombre_completo, u.email,' : ''}
        u.avatar,
        ti.asistencia,
        ti.fecha_inscripcion
      FROM taller_inscripciones ti
      JOIN usuarios u ON ti.usuario_id = u.id
      WHERE ti.taller_id = ?
      ORDER BY ti.fecha_inscripcion ASC
    `;

    db.query(sqlInscritos, [tallerId], (errInsc, inscritos) => {
      if (errInsc) {
        console.error('Error al consultar inscritos:', errInsc);
        return res.json({ ...taller, inscritos: [] });
      }
      res.json({ ...taller, inscritos });
    });
  });
});

// =========================================================================
// 3. CREAR UN NUEVO TALLER O CURSO (Solo Admin y Superadmin)
// =========================================================================
router.post('/', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Solo los líderes del Gremio pueden convocar cursos o talleres.' });
  }

  const {
    club_id,
    evento_id,
    titulo,
    descripcion,
    tipo,
    modalidad,
    instructor_id,
    instructor_nombre,
    cupo,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    requisitos,
    materiales_incluidos,
    costo,
    destinatarios,
    estado
  } = req.body;

  if (!titulo || !descripcion || !fecha || !hora_inicio || !hora_fin) {
    return res.status(400).json({ error: 'Título, descripción, fecha y horarios son obligatorios.' });
  }

  const idClub = club_id ? parseInt(club_id, 10) : (req.usuario.club_id || 1);
  const idEvento = evento_id && evento_id !== 'ninguno' ? parseInt(evento_id, 10) : null;
  const cupoFinal = parseInt(cupo, 10) || 12;
  const nombreInstructor = (instructor_nombre && instructor_nombre.trim() !== '') ? instructor_nombre.trim() : req.usuario.nombre;

  const sqlInsert = `
    INSERT INTO talleres_cursos (
      club_id, evento_id, titulo, descripcion, tipo, modalidad,
      instructor_id, instructor_nombre, cupo, fecha, hora_inicio, hora_fin,
      lugar, requisitos, materiales_incluidos, costo, destinatarios, estado, creado_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    idClub,
    idEvento,
    titulo.trim(),
    descripcion.trim(),
    tipo || 'Taller Práctico',
    modalidad || 'Presencial',
    instructor_id ? parseInt(instructor_id, 10) : req.usuario.id,
    nombreInstructor,
    cupoFinal,
    fecha,
    hora_inicio,
    hora_fin,
    lugar || (modalidad === 'Virtual' ? 'Discord del Gremio' : 'Sede de la Asociación'),
    requisitos || null,
    materiales_incluidos || null,
    costo || 'Gratuito',
    destinatarios || 'Para todo público',
    estado || 'Abierto',
    req.usuario.id
  ];

  db.query(sqlInsert, values, (err, resultado) => {
    if (err) {
      console.error('Error al crear taller:', err);
      return res.status(500).json({ error: 'Error del servidor al registrar el taller o curso.' });
    }

    const io = req.app.get('io');
    if (io) {
      emitirAClub(io, 'actualizacion-talleres', { tallerId: resultado.insertId, club_id: idClub });
      if (idEvento) {
        emitirAClub(io, 'actualizacion-eventos', { eventoId: idEvento });
      }
    }

    res.json({ mensaje: '¡Taller o curso convocado con éxito!', id: resultado.insertId });
  });
});

// =========================================================================
// 4. MODIFICAR TALLER O CURSO (Solo Admin y Superadmin)
// =========================================================================
router.put('/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Sin autorización para modificar talleres.' });
  }

  const tallerId = parseInt(req.params.id, 10);
  const {
    club_id,
    evento_id,
    titulo,
    descripcion,
    tipo,
    modalidad,
    instructor_id,
    instructor_nombre,
    cupo,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    requisitos,
    materiales_incluidos,
    costo,
    destinatarios,
    estado
  } = req.body;

  const idEvento = evento_id && evento_id !== 'ninguno' ? parseInt(evento_id, 10) : null;
  const cupoFinal = parseInt(cupo, 10) || 12;

  const sqlUpdate = `
    UPDATE talleres_cursos SET
      club_id = COALESCE(?, club_id),
      evento_id = ?,
      titulo = ?,
      descripcion = ?,
      tipo = ?,
      modalidad = ?,
      instructor_id = ?,
      instructor_nombre = ?,
      cupo = ?,
      fecha = ?,
      hora_inicio = ?,
      hora_fin = ?,
      lugar = ?,
      requisitos = ?,
      materiales_incluidos = ?,
      costo = ?,
      destinatarios = ?,
      estado = ?
    WHERE id = ?
  `;

  const values = [
    club_id ? parseInt(club_id, 10) : null,
    idEvento,
    titulo.trim(),
    descripcion.trim(),
    tipo || 'Taller Práctico',
    modalidad || 'Presencial',
    instructor_id ? parseInt(instructor_id, 10) : null,
    instructor_nombre || req.usuario.nombre,
    cupoFinal,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    requisitos || null,
    materiales_incluidos || null,
    costo || 'Gratuito',
    destinatarios || 'Para todo público',
    estado || 'Abierto',
    tallerId
  ];

  db.query(sqlUpdate, values, (err) => {
    if (err) {
      console.error('Error al actualizar taller:', err);
      return res.status(500).json({ error: 'Error al actualizar el taller.' });
    }

    const io = req.app.get('io');
    if (io) emitirAClub(io, 'actualizacion-talleres', { tallerId });

    res.json({ mensaje: 'Taller actualizado correctamente.' });
  });
});

// =========================================================================
// 5. BORRAR TALLER O CURSO (Solo Admin y Superadmin)
// =========================================================================
router.delete('/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Sin autorización para disolver talleres.' });
  }

  const tallerId = parseInt(req.params.id, 10);

  db.query('DELETE FROM talleres_cursos WHERE id = ?', [tallerId], (err, resultado) => {
    if (err) {
      console.error('Error al borrar taller:', err);
      return res.status(500).json({ error: 'Error al eliminar el taller.' });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Taller no encontrado.' });
    }

    // Limpieza de inscripciones
    db.query('DELETE FROM taller_inscripciones WHERE taller_id = ?', [tallerId], () => {});

    const io = req.app.get('io');
    if (io) emitirAClub(io, 'actualizacion-talleres', { tallerId });

    res.json({ mensaje: 'Taller eliminado correctamente.' });
  });
});

// =========================================================================
// 6. INSCRIBIRSE A UN TALLER (Cualquier aventurero)
// =========================================================================
router.post('/:id/inscribirse', verificarToken, (req, res) => {
  const tallerId = parseInt(req.params.id, 10);
  const usuarioId = req.usuario.id;

  // Consultar estado del taller y cupo disponible
  const sqlCheck = `
    SELECT 
      t.id, t.titulo, t.cupo, t.estado, t.club_id,
      (SELECT COUNT(*) FROM taller_inscripciones WHERE taller_id = t.id) AS inscritos_actuales,
      (SELECT COUNT(*) FROM taller_inscripciones WHERE taller_id = t.id AND usuario_id = ?) AS ya_inscrito
    FROM talleres_cursos t
    WHERE t.id = ?
  `;

  db.query(sqlCheck, [usuarioId, tallerId], (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error del servidor.' });
    if (resultados.length === 0) return res.status(404).json({ error: 'Taller no encontrado.' });

    const taller = resultados[0];

    if (taller.ya_inscrito > 0) {
      return res.status(400).json({ error: 'Ya te encuentras inscripto en este taller.' });
    }

    if (taller.estado !== 'Abierto') {
      return res.status(400).json({ error: `Las inscripciones están cerradas (Estado: ${taller.estado}).` });
    }

    if (taller.inscritos_actuales >= taller.cupo) {
      return res.status(400).json({ error: 'El cupo para este taller ya ha sido completado.' });
    }

    const sqlInsert = 'INSERT INTO taller_inscripciones (taller_id, usuario_id) VALUES (?, ?)';
    db.query(sqlInsert, [tallerId, usuarioId], (errIns) => {
      if (errIns) {
        console.error('Error al inscribir:', errIns);
        return res.status(500).json({ error: 'No se pudo completar la inscripción.' });
      }

      const io = req.app.get('io');
      if (io) emitirAClub(io, 'actualizacion-talleres', { tallerId, club_id: taller.club_id });

      res.json({ mensaje: `¡Te has inscripto con éxito en "${taller.titulo}"!` });
    });
  });
});

// =========================================================================
// 7. CANCELAR INSCRIPCIÓN AL TALLER (El propio usuario)
// =========================================================================
router.delete('/:id/inscribirse', verificarToken, (req, res) => {
  const tallerId = parseInt(req.params.id, 10);
  const usuarioId = req.usuario.id;

  db.query('DELETE FROM taller_inscripciones WHERE taller_id = ? AND usuario_id = ?', [tallerId, usuarioId], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al cancelar la inscripción.' });
    if (resultado.affectedRows === 0) return res.status(404).json({ error: 'No estabas inscripto en este taller.' });

    const io = req.app.get('io');
    if (io) emitirAClub(io, 'actualizacion-talleres', { tallerId });

    res.json({ mensaje: 'Has liberado tu lugar en el taller.' });
  });
});

// =========================================================================
// 8. ASISTENCIA AL TALLER (Solo Admin y Superadmin)
// =========================================================================
router.put('/:id/asistencia', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Solo el Alto Mando puede registrar asistencia.' });
  }

  const tallerId = parseInt(req.params.id, 10);
  const { usuario_id, asistencia } = req.body;

  if (!['presente', 'ausente', 'pendiente'].includes(asistencia)) {
    return res.status(400).json({ error: 'Estado de asistencia inválido.' });
  }

  const sql = 'UPDATE taller_inscripciones SET asistencia = ? WHERE taller_id = ? AND usuario_id = ?';
  db.query(sql, [asistencia, tallerId, usuario_id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar asistencia.' });

    const io = req.app.get('io');
    if (io) emitirAClub(io, 'actualizacion-talleres', { tallerId });

    res.json({ mensaje: 'Asistencia registrada.' });
  });
});

// =========================================================================
// 9. EXPULSAR O QUITAR PARTICIPANTE DEL TALLER (Admin)
// =========================================================================
router.delete('/:id/expulsar/:usuario_id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Sin autorización.' });
  }

  const tallerId = parseInt(req.params.id, 10);
  const usuarioAExpulsar = parseInt(req.params.usuario_id, 10);

  db.query('DELETE FROM taller_inscripciones WHERE taller_id = ? AND usuario_id = ?', [tallerId, usuarioAExpulsar], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al remover al participante.' });
    if (resultado.affectedRows === 0) return res.status(404).json({ error: 'El aventurero no estaba anotado.' });

    const io = req.app.get('io');
    if (io) emitirAClub(io, 'actualizacion-talleres', { tallerId });

    res.json({ mensaje: 'Participante removido del taller.' });
  });
});

module.exports = router;
