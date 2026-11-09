const db = require('./db');

/**
 * 🏛️ MIGRACIÓN AUTOMÁTICA MULTI-CLUB Y ESCALABILIDAD (FASE 1 & 2)
 * Asegura la existencia de la tabla 'clubes', columnas de identidad,
 * columnas 'club_id' en tablas del sistema, rol 'superadmin' para el Fundador,
 * e índices optimizados para alta concurrencia.
 */
const asegurarMultiClub = async () => {
  const promiseDb = db.promise();

  // Helper seguro para comprobar si una tabla existe
  const tablaExiste = async (nombreTabla) => {
    try {
      const [res] = await promiseDb.query(`SHOW TABLES LIKE '${nombreTabla}'`);
      return res.length > 0;
    } catch {
      return false;
    }
  };

  // Helper seguro para comprobar si una columna existe
  const columnaExiste = async (tabla, columna) => {
    try {
      if (!await tablaExiste(tabla)) return false;
      const [res] = await promiseDb.query(`SHOW COLUMNS FROM \`${tabla}\` LIKE '${columna}'`);
      return res.length > 0;
    } catch {
      return false;
    }
  };

  // Helper seguro para crear índices de forma idempotente
  const asegurarIndice = async (tabla, nombreIndice, columnas) => {
    try {
      if (!await tablaExiste(tabla)) return;
      const [res] = await promiseDb.query(`SHOW INDEX FROM \`${tabla}\` WHERE Key_name = '${nombreIndice}'`);
      if (res.length === 0) {
        console.log(`⚡ Creando índice ${nombreIndice} en ${tabla}...`);
        await promiseDb.query(`ALTER TABLE \`${tabla}\` ADD INDEX \`${nombreIndice}\` (${columnas})`);
      }
    } catch (e) {
      console.warn(`Aviso al indexar ${tabla}.${nombreIndice}:`, e.message);
    }
  };

  // 1. Crear tabla 'clubes' si no existe
  try {
    const sqlCrearClubes = `
      CREATE TABLE IF NOT EXISTS clubes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT NULL,
        ciudad VARCHAR(100) NOT NULL DEFAULT 'Santa Rosa',
        provincia VARCHAR(100) NOT NULL DEFAULT 'La Pampa',
        logo VARCHAR(255) NULL,
        banner VARCHAR(255) NULL,
        foto_grupal VARCHAR(255) NULL,
        historia TEXT NULL,
        whatsapp_url VARCHAR(255) NULL,
        instagram_url VARCHAR(255) NULL,
        organizadores LONGTEXT NULL,
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await promiseDb.query(sqlCrearClubes);

    // Columnas de identidad en 'clubes'
    const columnasClubes = [
      { nombre: 'foto_grupal', def: 'VARCHAR(255) NULL' },
      { nombre: 'historia', def: 'TEXT NULL' },
      { nombre: 'whatsapp_url', def: 'VARCHAR(255) NULL' },
      { nombre: 'instagram_url', def: 'VARCHAR(255) NULL' },
      { nombre: 'organizadores', def: 'LONGTEXT NULL' }
    ];

    for (const col of columnasClubes) {
      if (!await columnaExiste('clubes', col.nombre)) {
        await promiseDb.query(`ALTER TABLE clubes ADD COLUMN ${col.nombre} ${col.def}`);
      }
    }

    // Sembrar Club #1 por defecto
    const sqlSembrarClub = `
      INSERT INTO clubes (id, nombre, slug, descripcion, ciudad, provincia, foto_grupal, historia, whatsapp_url, activo)
      VALUES (
        1, 
        'Asociación de Rol La Pampa', 
        'la-pampa', 
        'Comunidad y gremio principal de rol y juegos de mesa en La Pampa.', 
        'Santa Rosa', 
        'La Pampa',
        '/assets/FotoGrupal.png',
        'Somos una comunidad de apasionados por el rol y los juegos de mesa. Organizamos jornadas periódicas para compartir mundos, dados y grandes historias.',
        'https://chat.whatsapp.com/FIiKyN8QkZd0DEXs8pRZzC',
        1
      )
      ON DUPLICATE KEY UPDATE id=id;
    `;
    await promiseDb.query(sqlSembrarClub);
  } catch (err) {
    console.warn('Nota sobre tabla clubes:', err.message);
  }

  // 2. Columna 'club_id' en 'eventos'
  try {
    if (await tablaExiste('eventos')) {
      if (!await columnaExiste('eventos', 'club_id')) {
        console.log('📌 Agregando columna club_id en tabla eventos...');
        await promiseDb.query("ALTER TABLE eventos ADD COLUMN club_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_eventos_club (club_id)");
      }
    }
  } catch (err) {
    console.warn('Nota sobre eventos.club_id:', err.message);
  }

  // 3. Columna 'club_id' y rol 'superadmin' en 'usuarios'
  try {
    if (await tablaExiste('usuarios')) {
      if (!await columnaExiste('usuarios', 'club_id')) {
        console.log('📌 Agregando columna club_id en tabla usuarios...');
        await promiseDb.query("ALTER TABLE usuarios ADD COLUMN club_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_usuarios_club (club_id)");
      }

      // Actualizar ENUM para superadmin
      const [colRol] = await promiseDb.query("SHOW COLUMNS FROM usuarios LIKE 'rol'");
      if (colRol.length > 0 && !colRol[0].Type.includes('superadmin')) {
        console.log('👑 Actualizando roles de usuarios para habilitar superadmin...');
        await promiseDb.query("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('jugador', 'dm', 'admin', 'superadmin') DEFAULT 'jugador'");
      }

      // Promover a Víctor / Sterbern a superadmin de forma garantizada
      await promiseDb.query("UPDATE usuarios SET rol = 'superadmin' WHERE email IN ('rockzila2011@gmail.com', 'admin@sterbern.com') OR nombre = 'Sterbern'");
    }
  } catch (err) {
    console.warn('Nota sobre usuarios.rol / club_id:', err.message);
  }

  // 4. Columna 'club_id' en 'buzon_sugerencias'
  try {
    if (await tablaExiste('buzon_sugerencias')) {
      if (!await columnaExiste('buzon_sugerencias', 'club_id')) {
        console.log('📌 Agregando columna club_id en tabla buzon_sugerencias...');
        await promiseDb.query("ALTER TABLE buzon_sugerencias ADD COLUMN club_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_buzon_club (club_id)");
      }
    }
  } catch (err) {
    console.warn('Nota sobre buzon_sugerencias.club_id:', err.message);
  }

  // 5. 🚀 ÍNDICES COMPUESTOS DE ESCALABILIDAD (FASE 1)
  try {
    await asegurarIndice('eventos', 'idx_eventos_club_fecha', 'club_id, fecha');
    await asegurarIndice('partidas', 'idx_partidas_evento', 'evento_id');
    await asegurarIndice('partidas', 'idx_partidas_evento_turno', 'evento_id, turno');
    await asegurarIndice('inscripciones', 'idx_inscripciones_partida', 'partida_id');
    await asegurarIndice('inscripciones', 'idx_inscripciones_usuario', 'usuario_id');
    await asegurarIndice('buzon_sugerencias', 'idx_buzon_club_fecha', 'club_id, fecha');
  } catch (err) {
    console.warn('Nota sobre índices de escalabilidad:', err.message);
  }

  console.log('🏛️ Bóveda Multi-Club y Optimizaciones de Fase 1 sincronizadas y aseguradas.');
};

module.exports = asegurarMultiClub;
