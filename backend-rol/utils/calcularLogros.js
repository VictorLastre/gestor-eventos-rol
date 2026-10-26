/**
 * 🏅 ORÁCULO DE LOGROS Y MEDALLAS DEL GREMIO
 * Calcula dinámicamente y de forma 100% retroactiva las medallas alcanzadas
 * por cada aventurero o Director de Juego en base al historial de la base de datos.
 */

const calcularLogrosUsuario = async (usuarioId, db) => {
  try {
    // 1. Obtener datos básicos del usuario
    const [usuarios] = await db.promise().query(
      `SELECT id, nombre, email, rol, telegram_chat_id, 
        IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id = usuarios.id), 0) as honor_total, 
        IFNULL((SELECT SUM(r.voto) FROM reputacion r JOIN partidas p ON r.partida_id = p.id WHERE r.evaluado_id = usuarios.id AND p.dungeon_master_id != usuarios.id), 0) as reputacion_neta 
       FROM usuarios WHERE id = ?`,
      [usuarioId]
    );
    if (!usuarios || usuarios.length === 0) return null;
    const usuario = usuarios[0];

    // 2. Mesas jugadas y sus sistemas
    const sqlJugadas = `
      SELECT p.id, p.titulo, COALESCE(s.nombre, p.sistema, 'Rol') as sistema_nombre, i.asistencia, e.estado as evento_estado
      FROM inscripciones i
      JOIN partidas p ON i.partida_id = p.id
      JOIN eventos e ON p.evento_id = e.id
      LEFT JOIN sistemas s ON p.sistema_id = s.id
      WHERE i.usuario_id = ? AND (i.asistencia = 'presente' OR (e.estado = 'Finalizado' AND i.asistencia != 'ausente'))
    `;
    const [mesasJugadas] = await db.promise().query(sqlJugadas, [usuarioId]);

    // 3. Mesas dirigidas y sus sistemas
    const sqlDirigidas = `
      SELECT p.id, p.titulo, COALESCE(s.nombre, p.sistema, 'Rol') as sistema_nombre, e.estado as evento_estado
      FROM partidas p
      JOIN eventos e ON p.evento_id = e.id
      LEFT JOIN sistemas s ON p.sistema_id = s.id
      WHERE p.dungeon_master_id = ? AND e.estado = 'Finalizado'
    `;
    const [mesasDirigidas] = await db.promise().query(sqlDirigidas, [usuarioId]);

    // 4. Inasistencias sin aviso en eventos finalizados
    const sqlFaltas = `
      SELECT COUNT(*) as total_faltas
      FROM inscripciones i
      JOIN partidas p ON i.partida_id = p.id
      JOIN eventos e ON p.evento_id = e.id
      WHERE i.usuario_id = ? AND e.estado = 'Finalizado' AND i.asistencia = 'ausente'
    `;
    const [faltasResult] = await db.promise().query(sqlFaltas, [usuarioId]);
    const faltasSinAviso = (faltasResult[0] && faltasResult[0].total_faltas) || 0;

    // 5. Reputación y votos de honor recibidos con sus etiquetas
    const sqlReputacion = `
      SELECT r.etiqueta, COUNT(*) as cantidad
      FROM reputacion r
      WHERE r.evaluado_id = ? AND r.voto > 0
      GROUP BY r.etiqueta
    `;
    const [votosReputacion] = await db.promise().query(sqlReputacion, [usuarioId]);

    let votosCompanero = 0;
    let votosRoleador = 0;
    let votosComida = 0;
    let votosTactico = 0;

    for (const v of votosReputacion) {
      const et = (v.etiqueta || '').toLowerCase();
      if (et.includes('compañero') || et.includes('companero') || et.includes('amistoso')) votosCompanero += v.cantidad;
      if (et.includes('roleador') || et.includes('narrador') || et.includes('inmersivo')) votosRoleador += v.cantidad;
      if (et.includes('comida') || et.includes('pizza') || et.includes('snacks')) votosComida += v.cantidad;
      if (et.includes('táctico') || et.includes('tactico') || et.includes('reglas') || et.includes('clase')) votosTactico += v.cantidad;
    }

    // Sistemas únicos explorados
    const sistemasUnicos = new Set();
    mesasJugadas.forEach(m => { if (m.sistema_nombre) sistemasUnicos.add(m.sistema_nombre.trim().toLowerCase()); });
    mesasDirigidas.forEach(m => { if (m.sistema_nombre) sistemasUnicos.add(m.sistema_nombre.trim().toLowerCase()); });

    const fundadores = ['mati', 'martín', 'martin', 'delo', 'keith', 'guille', 'diny', 'sterbern'];
    const esFundador = fundadores.includes((usuario.nombre || '').toLowerCase().trim());
    const esAdmin = usuario.rol === 'admin';

    const cantJugadas = mesasJugadas.length;
    const cantDirigidas = mesasDirigidas.length;
    const totalSistemas = sistemasUnicos.size;
    const reputacionNeta = Number(usuario.reputacion_neta) || 0;
    const honorTotal = Number(usuario.honor_total) || 0;
    const mejorReputacion = Math.max(reputacionNeta, honorTotal);
    const tieneTelegram = Boolean(usuario.telegram_chat_id);

    // Catálogo completo de medallas
    const catalogo = [
      // Senda del Aventurero
      {
        id: 'primeros_pasos',
        categoria: 'Aventurero',
        titulo: 'Primeros Pasos',
        icono: '🗡️',
        color: 'emerald',
        descripcion: 'Has participado en tu primera mesa de rol del Gremio.',
        meta: 1,
        progresoActual: Math.min(cantJugadas, 1),
        desbloqueada: cantJugadas >= 1
      },
      {
        id: 'veterano_aventurero',
        categoria: 'Aventurero',
        titulo: 'Aventurero Veterano',
        icono: '🏹',
        color: 'emerald',
        descripcion: 'Has luchado en al menos 3 mesas de juego.',
        meta: 3,
        progresoActual: Math.min(cantJugadas, 3),
        desbloqueada: cantJugadas >= 3
      },
      {
        id: 'heroe_leyenda',
        categoria: 'Aventurero',
        titulo: 'Héroe de Leyenda',
        icono: '⚔️',
        color: 'emerald',
        descripcion: 'Has completado 5 o más mesas de juego en el Gremio.',
        meta: 5,
        progresoActual: Math.min(cantJugadas, 5),
        desbloqueada: cantJugadas >= 5
      },
      {
        id: 'semidios_dado',
        categoria: 'Aventurero',
        titulo: 'Semidiós del Dado',
        icono: '🐉',
        color: 'emerald',
        descripcion: 'Has participado en 10 o más mesas de aventura épica.',
        meta: 10,
        progresoActual: Math.min(cantJugadas, 10),
        desbloqueada: cantJugadas >= 10
      },

      // Senda del Director de Juego
      {
        id: 'iniciacion_mando',
        categoria: 'Director de Juego',
        titulo: 'Iniciación al Mando',
        icono: '📜',
        color: 'amber',
        descripcion: 'Has tomado la pantalla de DM y narrado tu primera mesa.',
        meta: 1,
        progresoActual: Math.min(cantDirigidas, 1),
        desbloqueada: cantDirigidas >= 1
      },
      {
        id: 'arquitecto_mundos',
        categoria: 'Director de Juego',
        titulo: 'Arquitecto de Mundos',
        icono: '🏰',
        color: 'amber',
        descripcion: 'Has guiado a valientes aventureros en al menos 3 mesas.',
        meta: 3,
        progresoActual: Math.min(cantDirigidas, 3),
        desbloqueada: cantDirigidas >= 3
      },
      {
        id: 'gran_maestro',
        categoria: 'Director de Juego',
        titulo: 'Gran Maestro de la Mesa',
        icono: '👑',
        color: 'amber',
        descripcion: 'Has narrado 5 o más aventuras memorables para el Gremio.',
        meta: 5,
        progresoActual: Math.min(cantDirigidas, 5),
        desbloqueada: cantDirigidas >= 5
      },

      // Sabiduría y Exploración
      {
        id: 'curioso_arcano',
        categoria: 'Exploración',
        titulo: 'Curioso Arcano',
        icono: '🎲',
        color: 'indigo',
        descripcion: 'Has probado al menos 2 sistemas de rol diferentes.',
        meta: 2,
        progresoActual: Math.min(totalSistemas, 2),
        desbloqueada: totalSistemas >= 2
      },
      {
        id: 'explorador_multiverso',
        categoria: 'Exploración',
        titulo: 'Explorador del Multiverso',
        icono: '🧭',
        color: 'indigo',
        descripcion: 'Has jugado o dirigido en 3 o más sistemas de reglas distintos.',
        meta: 3,
        progresoActual: Math.min(totalSistemas, 3),
        desbloqueada: totalSistemas >= 3
      },
      {
        id: 'sabio_poliglota',
        categoria: 'Exploración',
        titulo: 'Sabio Políglota',
        icono: '🪐',
        color: 'indigo',
        descripcion: 'Has dominado 5 o más sistemas de rol diferentes.',
        meta: 5,
        progresoActual: Math.min(totalSistemas, 5),
        desbloqueada: totalSistemas >= 5
      },

      // Honor y Convivencia
      {
        id: 'buen_companero',
        categoria: 'Honor',
        titulo: 'Compañero Ejemplar',
        icono: '🛡️',
        color: 'cyan',
        descripcion: 'Has recibido reconocimientos por tu compañerismo y juego en equipo.',
        meta: 1,
        progresoActual: Math.min(votosCompanero, 1),
        desbloqueada: votosCompanero >= 1
      },
      {
        id: 'roleador_nato',
        categoria: 'Honor',
        titulo: 'Alma del Rol',
        icono: '🎭',
        color: 'cyan',
        descripcion: 'Has deslumbrado a la mesa con tu interpretación y narrativa.',
        meta: 1,
        progresoActual: Math.min(votosRoleador, 1),
        desbloqueada: votosRoleador >= 1
      },
      {
        id: 'festin_taberna',
        categoria: 'Honor',
        titulo: 'El Festín de la Taberna',
        icono: '🍕',
        color: 'cyan',
        descripcion: 'Has llevado comida o provisiones ganando el aprecio del grupo.',
        meta: 1,
        progresoActual: Math.min(votosComida, 1),
        desbloqueada: votosComida >= 1
      },
      {
        id: 'mente_tactica',
        categoria: 'Honor',
        titulo: 'Estratega Sagaz',
        icono: '🧠',
        color: 'cyan',
        descripcion: 'Has demostrado dominio táctico de las reglas o de tu clase.',
        meta: 1,
        progresoActual: Math.min(votosTactico, 1),
        desbloqueada: votosTactico >= 1
      },
      {
        id: 'luz_gremio',
        categoria: 'Honor',
        titulo: 'Luz del Gremio',
        icono: '✨',
        color: 'cyan',
        descripcion: 'Has alcanzado 5 o más puntos de honor o reputación neta.',
        meta: 5,
        progresoActual: Math.min(mejorReputacion, 5),
        desbloqueada: mejorReputacion >= 5
      },

      // Compromiso y Dedicación
      {
        id: 'paladin_compromiso',
        categoria: 'Compromiso',
        titulo: 'Paladín del Compromiso',
        icono: '⚖️',
        color: 'purple',
        descripcion: 'Has participado en jornadas con asistencia perfecta (sin faltas).',
        meta: 1,
        progresoActual: (cantJugadas >= 2 && faltasSinAviso === 0) ? 1 : 0,
        desbloqueada: (cantJugadas >= 2 && faltasSinAviso === 0)
      },
      {
        id: 'mensajero_arcano',
        categoria: 'Compromiso',
        titulo: 'Mensajero Arcano',
        icono: '✈️',
        color: 'purple',
        descripcion: 'Has vinculado tu cuenta con el Bot de Telegram del Gremio.',
        meta: 1,
        progresoActual: tieneTelegram ? 1 : 0,
        desbloqueada: tieneTelegram
      },

      // Linaje y Fundación
      {
        id: 'pilar_fundador',
        categoria: 'Linaje',
        titulo: 'Pilar del Gremio',
        icono: '🏛️',
        color: 'yellow',
        descripcion: 'Formas parte del núcleo fundador o del Consejo de Administración.',
        meta: 1,
        progresoActual: (esFundador || esAdmin) ? 1 : 0,
        desbloqueada: (esFundador || esAdmin)
      }
    ];

    const desbloqueadas = catalogo.filter(m => m.desbloqueada).length;
    const total = catalogo.length;
    const porcentaje = Math.round((desbloqueadas / total) * 100);

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        honor_total: honorTotal,
        reputacion_neta: reputacionNeta,
        es_fundador: esFundador
      },
      estadisticas: {
        mesas_jugadas: cantJugadas,
        mesas_dirigidas: cantDirigidas,
        sistemas_probados: totalSistemas,
        lista_sistemas: Array.from(sistemasUnicos),
        faltas_sin_aviso: faltasSinAviso,
        telegram_vinculado: tieneTelegram
      },
      resumen: {
        desbloqueadas,
        total,
        porcentaje
      },
      medallas: catalogo
    };
  } catch (err) {
    console.error('Error calculando logros del usuario:', err);
    throw err;
  }
};

module.exports = { calcularLogrosUsuario };
