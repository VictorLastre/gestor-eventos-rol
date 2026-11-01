const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

// Crear tablas en MySQL si no existen aún
const asegurarTablas = async () => {
  const sqlProgreso = `
    CREATE TABLE IF NOT EXISTS crawler_progreso (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      piso_actual INT DEFAULT 1,
      clase VARCHAR(50) DEFAULT 'guerrero',
      genero VARCHAR(10) DEFAULT 'm',
      nivel INT DEFAULT 1,
      xp INT DEFAULT 0,
      hp_actual INT DEFAULT 160,
      durabilidad_actual INT DEFAULT 70,
      oro INT DEFAULT 0,
      jefes_derrotados INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_crawler_usuario (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const sqlPersonajesVE = `
    CREATE TABLE IF NOT EXISTS ve_personajes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      nombre VARCHAR(100) NOT NULL DEFAULT 'Aventurero',
      raza VARCHAR(50) NOT NULL DEFAULT 'humano',
      clase VARCHAR(50) NOT NULL DEFAULT 'guerrero',
      nivel INT DEFAULT 1,
      px INT DEFAULT 0,
      pv_actual INT DEFAULT 10,
      pod_actual INT DEFAULT 0,
      atributos TEXT NULL,
      habilidades TEXT NULL,
      talentos TEXT NULL,
      trasfondos TEXT NULL,
      armas TEXT NULL,
      armadura VARCHAR(50) DEFAULT 'cuero',
      escudo TINYINT(1) DEFAULT 0,
      equipo TEXT NULL,
      monedas TEXT NULL,
      datos_completos LONGTEXT NULL,
      activo TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ve_usuario (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const sqlBestiario = `
    CREATE TABLE IF NOT EXISTS ve_bestiario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      tipo VARCHAR(50) NOT NULL DEFAULT 'monstruo',
      nivel INT NOT NULL DEFAULT 1,
      pv_max INT NOT NULL DEFAULT 5,
      defensa INT NOT NULL DEFAULT 11,
      atq_bono INT NOT NULL DEFAULT 1,
      ataque_nombre VARCHAR(100) NOT NULL DEFAULT 'Ataque con arma',
      dado_dano VARCHAR(20) NOT NULL DEFAULT '1d6',
      dano_medio INT NOT NULL DEFAULT 3,
      talentos TEXT NULL,
      descripcion TEXT NULL,
      piso_min INT NOT NULL DEFAULT 1,
      piso_max INT NOT NULL DEFAULT 3,
      es_jefe TINYINT(1) NOT NULL DEFAULT 0,
      sprite_base VARCHAR(50) NOT NULL DEFAULT 'skelet',
      oro_recompensa INT NOT NULL DEFAULT 5,
      xp_recompensa INT NOT NULL DEFAULT 10,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_bestiario_piso (piso_min, piso_max, es_jefe)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await db.promise().query(sqlProgreso);
    await db.promise().query(sqlPersonajesVE);
    await db.promise().query(sqlBestiario);

    // Sembrar bestiario inicial si la tabla está vacía
    const [conteo] = await db.promise().query('SELECT COUNT(*) as cant FROM ve_bestiario');
    if (conteo[0]?.cant === 0) {
      await sembrarBestiarioInicial();
    }
  } catch (err) {
    console.error('Error al verificar tablas de Vieja Escuela / Cripta:', err);
  }
};

// Función para poblar el bestiario oficial adaptado a la Mazmorra del Mago Loco
const sembrarBestiarioInicial = async () => {
  const monstruos = [
    // --- PISO 1: Mazmorras Olvidadas & Cavernas de Saqueadores ---
    [
      'Rata de Alcantarilla Gigante', 'bestia', 0, 4, 10, 0,
      'Mordisco infecto', '1d4', 2,
      'Transmitir enfermedad contagiosa (1 de cada 10 mordiscos)',
      'Roedores hinchados por la inmundicia que pululan en los túneles de entrada.',
      1, 1, 0, 'imp', 2, 5
    ],
    [
      'Trasgo Explorador', 'humanoide', 1, 5, 12, 1,
      'Daga serrada', '1d6', 3,
      'Astucia subterránea, emboscada en sombras',
      'Miembro de las partidas de saqueo que acampan en los corredores del nivel 1.',
      1, 2, 0, 'chort', 4, 10
    ],
    [
      'Esqueleto Centinela', 'no_muerto', 1, 5, 11, 1,
      'Espada herrumbrosa', '1d6', 3,
      'Inmune a efectos sobre la mente (miedo, sueño, confusión)',
      'Antiguos soldados reanimados por la magia residual de la cripta.',
      1, 2, 0, 'skelet', 4, 10
    ],
    [
      'Zombi Errante', 'no_muerto', 2, 10, 11, 2,
      'Garras cadavéricas', '1d6', 3,
      'Inmune a efectos mentales, tenacidad cadavérica',
      'Cuerpos descompuestos que vagan ciegamente buscando carne tibia.',
      1, 2, 0, 'zombie', 6, 15
    ],
    [
      'Araña Gigante Tejedora', 'bestia', 1, 5, 11, 1,
      'Mordisco ponzoñoso', '1d4', 2,
      'Veneno mortal (Tirada de Instintos CON 11+ o 1d4 de daño adicional)',
      'Acechan en techos y rincones oscuros tejiendo densas telarañas.',
      1, 2, 0, 'chort', 5, 15
    ],
    [
      'Ogro Rompehuesos (Jefe Piso 1)', 'gigante', 4, 24, 14, 4,
      'Gran Garrote de Asedio', '1d8+1', 5,
      'Gran Envergadura, Golpe Arrollador (empuja y aturde)',
      'El colosal carcelero de la primera planta. Custodia el acceso a las Cámaras Arcanas.',
      1, 1, 1, 'ogre', 35, 60
    ],

    // --- PISO 2: Cámaras Arcanas del Mago ---
    [
      'Diablillo Ígneo (Imp)', 'demonio', 2, 9, 13, 2,
      'Aguijón ardiente', '1d4+1', 3,
      'Resistencia al fuego y a la magia menor, vuelo evasivo',
      'Espías invocados por el Mago Loco para vigilar sus laboratorios arcanos.',
      2, 3, 0, 'imp', 7, 20
    ],
    [
      'Guardia Esqueleto Acorazado', 'no_muerto', 2, 10, 13, 2,
      'Lanza pesada y escudo', '1d6', 3,
      'Muro de escudos (+1 DEF en grupo), Inmune a efectos mentales',
      'La guardia personal de los antiguos eruditos de la torre subterránea.',
      2, 3, 0, 'skelet', 8, 22
    ],
    [
      'Chort de las Profundidades', 'demonio', 3, 15, 13, 3,
      'Tridente runoso', '1d6', 3,
      'Carga demoníaca, Resistencia arcana',
      'Criaturas de azufre atadas a los círculos mágicos del segundo piso.',
      2, 3, 0, 'chort', 12, 30
    ],
    [
      'Zombi Colosal Reanimado', 'no_muerto', 4, 20, 12, 4,
      'Golpe demoledor', '2d4', 5,
      'Fuerza descomunal, Imparable (ignora el primer golpe crítico)',
      'Monstruosidad de retazos de carne cosida que resguarda las puertas selladas.',
      2, 3, 0, 'big_zombie', 16, 45
    ],
    [
      'Nigromante de la Torre Oscura (Jefe Piso 2)', 'humanoide', 4, 22, 13, 4,
      'Rayo de Muerte Arcana', '2d6', 7,
      'Lanzador de conjuros, Escudo espectral, Levantar esbirros caídos',
      'Uno de los discípulos más dementes del Mago Loco, amo de las almas errantes.',
      2, 2, 1, 'necromancer', 55, 90
    ],

    // --- PISO 3: Bosques de Hongos & Ciénegas de Keith ---
    [
      'Espora Viviente Menor', 'planta', 1, 6, 11, 1,
      'Nube de esporas tóxicas', '1d4', 2,
      'Esporas adormecedoras (Instintos CON 11+ o desventaja en el siguiente turno)',
      'Organismos micoides que reaccionan ante el calor corporal de los invasores.',
      3, 4, 0, 'chort', 6, 15
    ],
    [
      'Zombi Infestado de Hongos', 'no_muerto', 3, 14, 12, 3,
      'Zarcillos purulentos', '1d6+1', 4,
      'Explosión de esporas venenosas al morir (Instinto CON 11+)',
      'Exploradores caídos en la ciénega cuyos cuerpos ahora nutren a la colonia de hongos.',
      3, 4, 0, 'zombie', 14, 35
    ],
    [
      'Gran Abominación Fúngica (Jefe Piso 3)', 'monstruosidad', 5, 32, 14, 5,
      'Brazos descomunales de micelio', '2d6+1', 8,
      'Regeneración biológica (+3 PV por turno), Esporulación masiva',
      'El colosal hongo primigenio que domina la ciénega del tercer estrato.',
      3, 3, 1, 'big_zombie', 80, 130
    ]
  ];

  const sqlInsert = `
    INSERT INTO ve_bestiario (
      nombre, tipo, nivel, pv_max, defensa, atq_bono,
      ataque_nombre, dado_dano, dano_medio, talentos,
      descripcion, piso_min, piso_max, es_jefe,
      sprite_base, oro_recompensa, xp_recompensa
    ) VALUES ?
  `;

  try {
    await db.promise().query(sqlInsert, [monstruos]);
    console.log('📖 Bestiario oficial de Vieja Escuela sembrado con éxito en la base de datos.');
  } catch (err) {
    console.error('Error al sembrar bestiario inicial:', err);
  }
};
asegurarTablas();

// Helper para parsear JSON de forma segura
const parseJSONSeguro = (str, fallback = null) => {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

// =====================================================================
// 🗡️ RUTAS DE PERSONAJE OFICIAL VIEJA ESCUELA (Pág. 16 VE_jdr.pdf)
// =====================================================================

// 1. OBTENER PERSONAJE ACTIVO DEL USUARIO
router.get('/personaje', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const [filas] = await db.promise().query(
      `SELECT * FROM ve_personajes 
       WHERE usuario_id = ? 
       ORDER BY activo DESC, updated_at DESC 
       LIMIT 1`,
      [usuarioId]
    );

    if (filas.length === 0) {
      return res.json({ existe: false });
    }

    const fila = filas[0];
    let personaje = parseJSONSeguro(fila.datos_completos, null);

    if (!personaje) {
      personaje = {
        id: fila.id,
        nombre: fila.nombre,
        raza: fila.raza,
        clase: fila.clase,
        nivel: fila.nivel,
        px: fila.px,
        pvActual: fila.pv_actual,
        podActual: fila.pod_actual,
        atributos: parseJSONSeguro(fila.atributos, { fue: 14, des: 12, con: 13, int: 10, sab: 10, car: 10 }),
        habilidades: parseJSONSeguro(fila.habilidades, {}),
        talentos: parseJSONSeguro(fila.talentos, []),
        trasfondos: parseJSONSeguro(fila.trasfondos, []),
        armas: parseJSONSeguro(fila.armas, []),
        armadura: fila.armadura,
        escudo: !!fila.escudo,
        equipo: parseJSONSeguro(fila.equipo, []),
        monedas: parseJSONSeguro(fila.monedas, { mo: 30, mp: 15, mc: 40 })
      };
    } else {
      personaje.id = fila.id;
    }

    res.json({ existe: true, personaje });
  } catch (error) {
    console.error('Error al cargar personaje de Vieja Escuela:', error);
    res.status(500).json({ error: 'Error al consultar la hoja de personaje en la base de datos.' });
  }
});

// 2. GUARDAR / SINCRONIZAR PERSONAJE DE VIEJA ESCUELA
router.post('/personaje/guardar', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  const pj = req.body;

  if (!pj || typeof pj !== 'object') {
    return res.status(400).json({ error: 'Datos de personaje inválidos.' });
  }

  const nombre = pj.nombre || req.usuario.nombre || 'Aventurero';
  const raza = pj.raza || 'humano';
  const clase = pj.clase || 'guerrero';
  const nivel = parseInt(pj.nivel, 10) || 1;
  const px = parseInt(pj.px, 10) || 0;
  const pvActual = pj.pvActual !== undefined ? pj.pvActual : (pj.pv_actual || 10);
  const podActual = pj.podActual !== undefined ? pj.podActual : (pj.pod_actual || 0);
  const armadura = pj.armadura || 'cuero';
  const escudo = pj.escudo ? 1 : 0;

  const atributosStr = JSON.stringify(pj.atributos || {});
  const habilidadesStr = JSON.stringify(pj.habilidades || {});
  const talentosStr = JSON.stringify(pj.talentos || []);
  const trasfondosStr = JSON.stringify(pj.trasfondos || []);
  const armasStr = JSON.stringify(pj.armas || []);
  const equipoStr = JSON.stringify(pj.equipo || []);
  const monedasStr = JSON.stringify(pj.monedas || { mo: 30, mp: 15, mc: 40 });
  const datosCompletosStr = JSON.stringify(pj);

  try {
    let personajeId = pj.id ? parseInt(pj.id, 10) : null;

    if (!personajeId) {
      // Buscar si el usuario ya tiene algún personaje activo
      const [existentes] = await db.promise().query(
        'SELECT id FROM ve_personajes WHERE usuario_id = ? AND activo = 1 LIMIT 1',
        [usuarioId]
      );
      if (existentes.length > 0) {
        personajeId = existentes[0].id;
      }
    }

    if (personajeId) {
      // Actualizar registro existente
      const sqlUpdate = `
        UPDATE ve_personajes SET
          nombre = ?, raza = ?, clase = ?, nivel = ?, px = ?,
          pv_actual = ?, pod_actual = ?, atributos = ?, habilidades = ?,
          talentos = ?, trasfondos = ?, armas = ?, armadura = ?, escudo = ?,
          equipo = ?, monedas = ?, datos_completos = ?, activo = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND usuario_id = ?
      `;
      await db.promise().query(sqlUpdate, [
        nombre, raza, clase, nivel, px,
        pvActual, podActual, atributosStr, habilidadesStr,
        talentosStr, trasfondosStr, armasStr, armadura, escudo,
        equipoStr, monedasStr, datosCompletosStr,
        personajeId, usuarioId
      ]);
    } else {
      // Marcar otros como no activos y crear uno nuevo
      await db.promise().query('UPDATE ve_personajes SET activo = 0 WHERE usuario_id = ?', [usuarioId]);

      const sqlInsert = `
        INSERT INTO ve_personajes (
          usuario_id, nombre, raza, clase, nivel, px,
          pv_actual, pod_actual, atributos, habilidades,
          talentos, trasfondos, armas, armadura, escudo,
          equipo, monedas, datos_completos, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;
      const [resInsert] = await db.promise().query(sqlInsert, [
        usuarioId, nombre, raza, clase, nivel, px,
        pvActual, podActual, atributosStr, habilidadesStr,
        talentosStr, trasfondosStr, armasStr, armadura, escudo,
        equipoStr, monedasStr, datosCompletosStr
      ]);
      personajeId = resInsert.insertId;
    }

    // Sincronizar simultáneamente con crawler_progreso para compatibilidad con el juego
    const oroTotal = pj.monedas?.mo !== undefined ? parseInt(pj.monedas.mo, 10) : 0;
    const reiniciarPiso = !!pj.reiniciarAventura;

    const sqlCrawlerSync = `
      INSERT INTO crawler_progreso (usuario_id, clase, nivel, xp, hp_actual, oro, piso_actual, jefes_derrotados)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0)
      ON DUPLICATE KEY UPDATE
        clase = VALUES(clase),
        nivel = VALUES(nivel),
        xp = VALUES(xp),
        hp_actual = VALUES(hp_actual),
        oro = VALUES(oro),
        piso_actual = ${reiniciarPiso ? '1' : 'piso_actual'},
        jefes_derrotados = ${reiniciarPiso ? '0' : 'jefes_derrotados'},
        updated_at = CURRENT_TIMESTAMP
    `;
    await db.promise().query(sqlCrawlerSync, [
      usuarioId, clase, nivel, px, pvActual, oroTotal
    ]);

    res.json({
      ok: true,
      mensaje: '¡Hoja de personaje resguardada con éxito en la Bóveda del Gremio!',
      personajeId
    });
  } catch (error) {
    console.error('Error al guardar personaje en base de datos:', error);
    res.status(500).json({ error: 'No se pudo guardar la hoja de personaje en la base de datos.' });
  }
});

// 3. LISTAR TODOS LOS PERSONAJES DEL USUARIO
router.get('/personajes', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const [filas] = await db.promise().query(
      `SELECT id, nombre, raza, clase, nivel, px, pv_actual, activo, updated_at 
       FROM ve_personajes 
       WHERE usuario_id = ? 
       ORDER BY activo DESC, updated_at DESC`,
      [usuarioId]
    );
    res.json(filas);
  } catch (error) {
    console.error('Error al listar personajes:', error);
    res.status(500).json({ error: 'Error al consultar la lista de personajes.' });
  }
});

// 4. CAMBIAR PERSONAJE ACTIVO
router.post('/personaje/activar', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: 'Se requiere ID de personaje.' });

  try {
    await db.promise().query('UPDATE ve_personajes SET activo = 0 WHERE usuario_id = ?', [usuarioId]);
    await db.promise().query('UPDATE ve_personajes SET activo = 1 WHERE id = ? AND usuario_id = ?', [id, usuarioId]);

    res.json({ ok: true, mensaje: 'Personaje activo actualizado.' });
  } catch (error) {
    console.error('Error al activar personaje:', error);
    res.status(500).json({ error: 'Error al cambiar de personaje.' });
  }
});

// 5. ELIMINAR PERSONAJE
router.delete('/personaje/:id', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  const personajeId = req.params.id;

  try {
    await db.promise().query('DELETE FROM ve_personajes WHERE id = ? AND usuario_id = ?', [personajeId, usuarioId]);
    res.json({ ok: true, mensaje: 'Personaje eliminado del archivo.' });
  } catch (error) {
    console.error('Error al eliminar personaje:', error);
    res.status(500).json({ error: 'No se pudo eliminar el personaje.' });
  }
});


// =====================================================================
// 🏰 RUTAS DE LA MAZMORRA / CRIPTA
// =====================================================================

// 1. OBTENER PROGRESO DEL JUGADOR EN LA MAZMORRA
router.get('/progreso', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const [filas] = await db.promise().query(
      'SELECT * FROM crawler_progreso WHERE usuario_id = ?',
      [usuarioId]
    );

    if (filas.length === 0) {
      return res.json({
        existe: false,
        piso_actual: 1,
        oro: 0,
        clase: 'guerrero',
        genero: 'm',
        nivel: 1
      });
    }

    res.json({ existe: true, ...filas[0] });
  } catch (error) {
    console.error('Error al cargar progreso del crawler:', error);
    res.status(500).json({ error: 'Error al consultar la cripta.' });
  }
});

// 2. GUARDAR PROGRESO (Hoguera, muerte o cambio de piso)
router.post('/guardar', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  const {
    piso_actual,
    clase,
    genero,
    nivel,
    xp,
    hp_actual,
    durabilidad_actual,
    oro,
    jefes_derrotados
  } = req.body;

  const sql = `
    INSERT INTO crawler_progreso 
      (usuario_id, piso_actual, clase, genero, nivel, xp, hp_actual, durabilidad_actual, oro, jefes_derrotados)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      piso_actual = VALUES(piso_actual),
      clase = VALUES(clase),
      genero = VALUES(genero),
      nivel = VALUES(nivel),
      xp = VALUES(xp),
      hp_actual = VALUES(hp_actual),
      durabilidad_actual = VALUES(durabilidad_actual),
      oro = VALUES(oro),
      jefes_derrotados = VALUES(jefes_derrotados),
      updated_at = CURRENT_TIMESTAMP
  `;

  try {
    await db.promise().query(sql, [
      usuarioId,
      piso_actual || 1,
      clase || 'guerrero',
      genero || 'm',
      nivel || 1,
      xp || 0,
      hp_actual || 160,
      durabilidad_actual || 70,
      oro || 0,
      jefes_derrotados || 0
    ]);

    res.json({ mensaje: '¡Progreso de la Cripta resguardado por los dioses antiguos!' });
  } catch (error) {
    console.error('Error al guardar progreso en la cripta:', error);
    res.status(500).json({ error: 'No se pudo guardar el avance en la base de datos.' });
  }
});

// 3. RANKING / SALÓN DE LA CRIPTA (Top exploradores)
router.get('/ranking', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.promise().query(`
      SELECT 
        c.piso_actual, c.clase, c.nivel, c.oro, c.jefes_derrotados, c.updated_at,
        u.nombre, u.avatar
      FROM crawler_progreso c
      JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.piso_actual DESC, c.jefes_derrotados DESC, c.nivel DESC
      LIMIT 10
    `);

    res.json(filas);
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error al consultar la tabla de líderes.' });
  }
});

// 4. REINICIAR MAZMORRA AL PISO 1
router.post('/reiniciar', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    await db.promise().query(
      `UPDATE crawler_progreso 
       SET piso_actual = 1, jefes_derrotados = 0, hp_actual = 160, durabilidad_actual = 70, oro = 0, updated_at = CURRENT_TIMESTAMP
       WHERE usuario_id = ?`,
      [usuarioId]
    );
    res.json({ ok: true, mensaje: 'Aventura reiniciada con éxito en el Piso 1.' });
  } catch (error) {
    console.error('Error al reiniciar aventura:', error);
    res.status(500).json({ error: 'Error al reiniciar el piso.' });
  }
});

// 5. BORRAR DATOS VIEJOS DE PRUEBA Y RESETEAR TODO
router.post('/reset-total', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    await db.promise().query('DELETE FROM ve_personajes WHERE usuario_id = ?', [usuarioId]);
    await db.promise().query(
      `UPDATE crawler_progreso 
       SET piso_actual = 1, jefes_derrotados = 0, hp_actual = 160, durabilidad_actual = 70, oro = 0, updated_at = CURRENT_TIMESTAMP
       WHERE usuario_id = ?`,
      [usuarioId]
    );
    res.json({ ok: true, mensaje: 'Datos de prueba anteriores borrados. Todo listo para forjar un nuevo héroe.' });
  } catch (error) {
    console.error('Error al resetear datos:', error);
    res.status(500).json({ error: 'Error al limpiar datos.' });
  }
});

// =====================================================================
// 🐉 RUTAS DEL BESTIARIO OFICIAL (Vieja Escuela OSR)
// =====================================================================

// 6. OBTENER LISTADO COMPLETO DEL BESTIARIO
router.get('/bestiario', async (req, res) => {
  const { piso, es_jefe } = req.query;
  let sql = 'SELECT * FROM ve_bestiario WHERE 1=1';
  const params = [];

  if (piso) {
    sql += ' AND piso_min <= ? AND piso_max >= ?';
    params.push(parseInt(piso, 10), parseInt(piso, 10));
  }

  if (es_jefe !== undefined) {
    sql += ' AND es_jefe = ?';
    params.push(parseInt(es_jefe, 10) ? 1 : 0);
  }

  sql += ' ORDER BY piso_min ASC, es_jefe ASC, nivel ASC';

  try {
    const [monstruos] = await db.promise().query(sql, params);
    res.json(monstruos);
  } catch (error) {
    console.error('Error al consultar el bestiario:', error);
    res.status(500).json({ error: 'Error al consultar las criaturas de la mazmorra.' });
  }
});

// 7. OBTENER BESTIARIO AGRUPADO PARA UN PISO ESPECÍFICO
router.get('/bestiario/piso/:piso', async (req, res) => {
  const numPiso = parseInt(req.params.piso, 10) || 1;
  const sql = `
    SELECT * FROM ve_bestiario 
    WHERE piso_min <= ? AND piso_max >= ?
    ORDER BY es_jefe ASC, nivel ASC
  `;

  try {
    const [filas] = await db.promise().query(sql, [numPiso, numPiso]);
    const normales = filas.filter(m => !m.es_jefe);
    const jefes = filas.filter(m => !!m.es_jefe);

    res.json({
      piso: numPiso,
      total: filas.length,
      normales,
      jefe: jefes.length > 0 ? jefes[0] : null
    });
  } catch (error) {
    console.error(`Error al consultar bestiario del piso ${numPiso}:`, error);
    res.status(500).json({ error: 'Error al consultar criaturas del piso.' });
  }
});

module.exports = router;