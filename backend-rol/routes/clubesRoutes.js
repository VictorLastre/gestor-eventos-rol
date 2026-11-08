const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');
const { verificarSuperAdmin } = require('../middlewares/auth');

// ✨ FUNCIÓN DEL ESCRIBA: REGISTRO EN LA BITÁCORA
const registrarLog = (usuario, accion, descripcion) => {
  const sql = "INSERT INTO logs_actividad (usuario_id, nombre_usuario, accion, descripcion) VALUES (?, ?, ?, ?)";
  db.query(sql, [usuario.id, usuario.nombre, accion, descripcion], (err) => {
    if (err) console.error("❌ Error en bitácora:", err);
  });
};

// 1. LISTAR TODOS LOS CLUBES (Público / Para selector de comunidad)
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.nombre, 
        c.slug, 
        c.descripcion, 
        c.ciudad, 
        c.provincia, 
        c.logo, 
        c.banner, 
        c.foto_grupal,
        c.whatsapp_url,
        c.instagram_url,
        c.activo,
        (SELECT COUNT(*) FROM eventos WHERE club_id = c.id) as total_eventos,
        (SELECT COUNT(*) FROM usuarios WHERE club_id = c.id) as total_usuarios,
        (SELECT COUNT(*) FROM usuarios WHERE club_id = c.id AND (rol = 'admin' OR rol = 'superadmin')) as total_admins
      FROM clubes c
      ORDER BY (c.id = 1) DESC, c.nombre ASC
    `;
    const [resultados] = await db.promise().query(sql);
    res.json(resultados);
  } catch (err) {
    console.error('Error al listar clubes:', err);
    res.status(500).json({ error: 'Error del servidor al obtener las comunidades.' });
  }
});

// 0. DETECTAR CLUB POR IP / GEOLOCALIZACIÓN (Público)
router.get('/detectar/geo', async (req, res) => {
  try {
    let ip = req.headers['cf-connecting-ip'] || 
             req.headers['x-real-ip'] || 
             req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.socket.remoteAddress || '';

    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    const esLocal = ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');

    let ciudadDetectada = '';
    let provinciaDetectada = '';

    if (!esLocal && ip && !ip.startsWith('172.')) {
      try {
        const respuesta = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, { signal: AbortSignal.timeout(2500) });
        if (respuesta.ok) {
          const dataGeo = await respuesta.json();
          if (dataGeo.status === 'success') {
            ciudadDetectada = dataGeo.city || '';
            provinciaDetectada = dataGeo.regionName || '';
          }
        }
      } catch (e) {
        // Fallback silencioso si falla la llamada externa
      }
    }

    const [clubes] = await db.promise().query("SELECT id, nombre, slug, ciudad, provincia FROM clubes WHERE activo = 1");
    
    let clubSugerido = null;
    if (provinciaDetectada || ciudadDetectada) {
      const provLower = provinciaDetectada.toLowerCase();
      const ciudLower = ciudadDetectada.toLowerCase();

      clubSugerido = clubes.find(c => 
        (c.provincia && (provLower.includes(c.provincia.toLowerCase()) || c.provincia.toLowerCase().includes(provLower))) ||
        (c.ciudad && (ciudLower.includes(c.ciudad.toLowerCase()) || c.ciudad.toLowerCase().includes(ciudLower)))
      );
    }

    if (!clubSugerido) {
      clubSugerido = clubes.find(c => c.id === 1) || clubes[0] || null;
    }

    res.json({
      ip,
      ciudadDetectada,
      provinciaDetectada,
      clubSugerido
    });
  } catch (err) {
    console.error('Error al detectar geolocalización:', err);
    res.json({ clubSugerido: { id: 1, nombre: 'Asociación de Rol La Pampa', slug: 'la-pampa' } });
  }
});

// 2. DETALLE DE UN CLUB ESPECÍFICO POR ID O SLUG (Público)
router.get('/:identificador', async (req, res) => {
  const { identificador } = req.params;
  const esNumero = !isNaN(parseInt(identificador, 10));

  try {
    const sqlClub = esNumero 
      ? "SELECT * FROM clubes WHERE id = ?" 
      : "SELECT * FROM clubes WHERE slug = ?";

    const [clubes] = await db.promise().query(sqlClub, [identificador]);
    if (clubes.length === 0) {
      return res.status(404).json({ error: 'Comunidad o club no encontrado.' });
    }

    const club = clubes[0];

    // Traer sus administradores / referentes
    const [admins] = await db.promise().query(
      "SELECT id, nombre, nombre_completo, email, rol, avatar, biografia FROM usuarios WHERE club_id = ? AND (rol = 'admin' OR rol = 'superadmin')",
      [club.id]
    );

    // Parsear organizadores si están en JSON o texto
    let organizadores = [];
    if (club.organizadores) {
      try {
        organizadores = typeof club.organizadores === 'string' 
          ? JSON.parse(club.organizadores) 
          : club.organizadores;
      } catch (e) {
        organizadores = [];
      }
    }

    // Traer sus próximos eventos
    const [proximosEventos] = await db.promise().query(
      `SELECT id, nombre, descripcion, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, hora_inicio, hora_fin, estado, lugar, ciudad 
       FROM eventos WHERE club_id = ? AND estado != 'Finalizado' ORDER BY fecha ASC LIMIT 5`,
      [club.id]
    );

    res.json({
      ...club,
      organizadores,
      administradores: admins,
      proximos_eventos: proximosEventos
    });
  } catch (err) {
    console.error('Error al obtener detalle del club:', err);
    res.status(500).json({ error: 'Error del servidor al obtener la comunidad.' });
  }
});

// 3. CREAR NUEVO CLUB / ESPACIO (Solo Superadmin)
router.post('/', verificarSuperAdmin, async (req, res) => {
  let { 
    nombre, 
    slug, 
    descripcion, 
    ciudad, 
    provincia, 
    logo, 
    banner, 
    foto_grupal, 
    historia, 
    whatsapp_url, 
    instagram_url, 
    admin_usuario_id 
  } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la comunidad es obligatorio.' });
  }

  // Generar o limpiar slug URL-friendly
  let slugLimpio = slug ? slug.trim().toLowerCase() : nombre.trim().toLowerCase();
  slugLimpio = slugLimpio
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  try {
    // Comprobar si ya existe el slug
    const [existe] = await db.promise().query("SELECT id FROM clubes WHERE slug = ?", [slugLimpio]);
    if (existe.length > 0) {
      slugLimpio = `${slugLimpio}-${Date.now().toString().slice(-4)}`;
    }

    const sqlInsert = `
      INSERT INTO clubes (nombre, slug, descripcion, ciudad, provincia, logo, banner, foto_grupal, historia, whatsapp_url, instagram_url, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const [resInsert] = await db.promise().query(sqlInsert, [
      nombre.trim(),
      slugLimpio,
      descripcion || null,
      ciudad ? ciudad.trim() : 'Merlo',
      provincia ? provincia.trim() : 'San Luis',
      logo || null,
      banner || null,
      foto_grupal || null,
      historia || null,
      whatsapp_url || null,
      instagram_url || null
    ]);

    const nuevoClubId = resInsert.insertId;

    // Si se especificó un usuario como Administrador inicial para este club
    if (admin_usuario_id) {
      await db.promise().query(
        "UPDATE usuarios SET rol = 'admin', club_id = ? WHERE id = ?",
        [nuevoClubId, admin_usuario_id]
      );

      await db.promise().query(
        "INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)",
        [admin_usuario_id, `👑 ¡El Alto Mando te ha nombrado Administrador oficial del espacio "${nombre}"! Ya puedes gestionar eventos y mesas para tu comunidad.`]
      );
    }

    registrarLog(
      req.usuario, 
      'CREAR_CLUB', 
      `Creó el espacio de comunidad "${nombre}" (${ciudad}, ${provincia}) con ID #${nuevoClubId}.`
    );

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-clubes');

    res.status(201).json({
      mensaje: `¡Espacio "${nombre}" forjado con éxito!`,
      club: {
        id: nuevoClubId,
        nombre,
        slug: slugLimpio,
        ciudad,
        provincia
      }
    });
  } catch (err) {
    console.error('Error al crear club:', err);
    res.status(500).json({ error: 'Error del servidor al crear el espacio.' });
  }
});

// 4. EDITAR UN CLUB (Superadmin o Admin de ese Club)
router.put('/:id', verificarToken, async (req, res) => {
  const clubId = parseInt(req.params.id, 10);
  const esSuperAdmin = req.usuario.rol === 'superadmin';
  const esAdminDelClub = req.usuario.rol === 'admin' && req.usuario.club_id === clubId;

  if (!esSuperAdmin && !esAdminDelClub) {
    return res.status(403).json({ error: 'No tienes autorización para modificar los anales de este club.' });
  }

  const { 
    nombre, 
    descripcion, 
    ciudad, 
    provincia, 
    logo, 
    banner, 
    foto_grupal, 
    historia, 
    whatsapp_url, 
    instagram_url, 
    organizadores,
    activo 
  } = req.body;

  try {
    const orgString = organizadores ? (typeof organizadores === 'string' ? organizadores : JSON.stringify(organizadores)) : null;

    let sqlUpdate = `
      UPDATE clubes 
      SET nombre = COALESCE(?, nombre),
          descripcion = ?,
          ciudad = COALESCE(?, ciudad),
          provincia = COALESCE(?, provincia),
          logo = ?,
          banner = ?,
          foto_grupal = ?,
          historia = ?,
          whatsapp_url = ?,
          instagram_url = ?,
          organizadores = ?
    `;
    const params = [
      nombre, 
      descripcion || null, 
      ciudad, 
      provincia, 
      logo || null, 
      banner || null, 
      foto_grupal || null, 
      historia || null, 
      whatsapp_url || null, 
      instagram_url || null, 
      orgString
    ];

    // Solo el superadmin puede activar o desactivar un club
    if (esSuperAdmin && activo !== undefined) {
      sqlUpdate += `, activo = ?`;
      params.push(activo ? 1 : 0);
    }

    sqlUpdate += ` WHERE id = ?`;
    params.push(clubId);

    const [resUpdate] = await db.promise().query(sqlUpdate, params);
    if (resUpdate.affectedRows === 0) {
      return res.status(404).json({ error: 'Club no encontrado.' });
    }

    registrarLog(req.usuario, 'EDITAR_CLUB', `Actualizó la información del club #${clubId}.`);

    const io = req.app.get('io');
    if (io) io.emit('actualizacion-clubes');

    res.json({ mensaje: 'Información del club actualizada con éxito.' });
  } catch (err) {
    console.error('Error al editar club:', err);
    res.status(500).json({ error: 'Error al actualizar el club.' });
  }
});

// 5. ASIGNAR ADMINISTRADOR A UN CLUB (Solo Superadmin)
router.post('/:id/asignar-admin', verificarSuperAdmin, async (req, res) => {
  const clubId = parseInt(req.params.id, 10);
  const { usuario_id } = req.body;

  if (!usuario_id) return res.status(400).json({ error: 'usuario_id es obligatorio.' });

  try {
    const [clubes] = await db.promise().query("SELECT nombre FROM clubes WHERE id = ?", [clubId]);
    if (clubes.length === 0) return res.status(404).json({ error: 'Club no encontrado.' });
    const nombreClub = clubes[0].nombre;

    const [usuarios] = await db.promise().query("SELECT nombre FROM usuarios WHERE id = ?", [usuario_id]);
    if (usuarios.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const nombreUsuario = usuarios[0].nombre;

    await db.promise().query(
      "UPDATE usuarios SET rol = 'admin', club_id = ? WHERE id = ?",
      [clubId, usuario_id]
    );

    await db.promise().query(
      "INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)",
      [usuario_id, `👑 ¡Has sido asignado como Administrador del espacio "${nombreClub}"!`]
    );

    registrarLog(
      req.usuario, 
      'ASIGNAR_ADMIN_CLUB', 
      `Nombró a ${nombreUsuario} como Administrador del espacio "${nombreClub}".`
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion-usuarios');
      io.emit('actualizacion-clubes');
    }

    res.json({ mensaje: `¡${nombreUsuario} ha sido nombrado Administrador de "${nombreClub}"!` });
  } catch (err) {
    console.error('Error al asignar admin:', err);
    res.status(500).json({ error: 'Error del servidor al asignar administrador.' });
  }
});

// 6. REVOCAR RANGO DE ADMIN EN UN CLUB (Solo Superadmin)
router.post('/:id/revocar-admin', verificarSuperAdmin, async (req, res) => {
  const clubId = parseInt(req.params.id, 10);
  const { usuario_id } = req.body;

  if (!usuario_id) return res.status(400).json({ error: 'usuario_id es obligatorio.' });

  try {
    await db.promise().query(
      "UPDATE usuarios SET rol = 'jugador' WHERE id = ? AND club_id = ? AND rol != 'superadmin'",
      [usuario_id, clubId]
    );

    registrarLog(req.usuario, 'REVOCAR_ADMIN_CLUB', `Revocó privilegios de admin al usuario #${usuario_id} en el club #${clubId}.`);

    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion-usuarios');
      io.emit('actualizacion-clubes');
    }

    res.json({ mensaje: 'Privilegios de administrador revocados con éxito.' });
  } catch (err) {
    console.error('Error al revocar admin:', err);
    res.status(500).json({ error: 'Error al revocar privilegios.' });
  }
});

module.exports = router;
