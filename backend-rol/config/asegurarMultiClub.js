const db = require('./db');

/**
 * 🏛️ MIGRACIÓN AUTOMÁTICA MULTI-CLUB (FASE 1 & 2)
 * Asegura la existencia de la tabla 'clubes', columnas de identidad (historia, foto_grupal, organizadores),
 * columnas 'club_id' en eventos y usuarios, y la actualización del ENUM de roles para incluir 'superadmin'.
 */
const asegurarMultiClub = async () => {
  try {
    const promiseDb = db.promise();

    // 1. Crear tabla 'clubes' si no existe
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

    // 2. Comprobar columnas de identidad en 'clubes' por si ya fue creada previamente
    const columnasNuevas = [
      { nombre: 'foto_grupal', def: 'VARCHAR(255) NULL' },
      { nombre: 'historia', def: 'TEXT NULL' },
      { nombre: 'whatsapp_url', def: 'VARCHAR(255) NULL' },
      { nombre: 'instagram_url', def: 'VARCHAR(255) NULL' },
      { nombre: 'organizadores', def: 'LONGTEXT NULL' }
    ];

    for (const col of columnasNuevas) {
      const [existe] = await promiseDb.query(`SHOW COLUMNS FROM clubes LIKE '${col.nombre}'`);
      if (existe.length === 0) {
        console.log(`📌 Agregando columna ${col.nombre} en tabla clubes...`);
        await promiseDb.query(`ALTER TABLE clubes ADD COLUMN ${col.nombre} ${col.def}`);
      }
    }

    // 3. Sembrar el Club #1 (Asociación de Rol La Pampa) con sus datos por defecto
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

    // 4. Comprobar y agregar columna 'club_id' en 'eventos'
    const [colEventos] = await promiseDb.query("SHOW COLUMNS FROM eventos LIKE 'club_id'");
    if (colEventos.length === 0) {
      console.log('📌 Agregando columna club_id en tabla eventos...');
      await promiseDb.query("ALTER TABLE eventos ADD COLUMN club_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_eventos_club (club_id)");
    }

    // 5. Comprobar y agregar columna 'club_id' en 'usuarios'
    const [colUsuarios] = await promiseDb.query("SHOW COLUMNS FROM usuarios LIKE 'club_id'");
    if (colUsuarios.length === 0) {
      console.log('📌 Agregando columna club_id en tabla usuarios...');
      await promiseDb.query("ALTER TABLE usuarios ADD COLUMN club_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_usuarios_club (club_id)");
    }

    // 6. Actualizar ENUM de 'rol' en usuarios para soportar 'superadmin'
    const [colRol] = await promiseDb.query("SHOW COLUMNS FROM usuarios LIKE 'rol'");
    if (colRol.length > 0 && !colRol[0].Type.includes('superadmin')) {
      console.log('👑 Actualizando roles de usuarios para habilitar superadmin...');
      await promiseDb.query("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('jugador', 'dm', 'admin', 'superadmin') DEFAULT 'jugador'");
    }

    // 7. Promover a Víctor a 'superadmin'
    await promiseDb.query("UPDATE usuarios SET rol = 'superadmin' WHERE email = 'rockzila2011@gmail.com' OR nombre = 'Sterbern'");

    // 8. Comprobar y agregar columna 'club_id' en 'buzon_sugerencias'
    const [colBuzon] = await promiseDb.query("SHOW COLUMNS FROM buzon_sugerencias LIKE 'club_id'");
    if (colBuzon.length === 0) {
      console.log('📌 Agregando columna club_id en tabla buzon_sugerencias...');
      await promiseDb.query("ALTER TABLE buzon_sugerencias ADD COLUMN club_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_buzon_club (club_id)");
    }

    console.log('✅ Bóveda Multi-Club (Fase 1 y 2) sincronizada y asegurada.');
  } catch (err) {
    console.warn('⚠️ Nota sobre migración Multi-Club:', err.message);
  }
};

module.exports = asegurarMultiClub;
