const mysql = require('mysql2');

// Configuración de la conexión vinculada a las Variables de Entorno de Hostinger
const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || '127.0.0.1', 
  user: process.env.MYSQL_ADDON_USER, 
  password: process.env.MYSQL_ADDON_PASSWORD, 
  database: process.env.MYSQL_ADDON_DB, 
  port: process.env.MYSQL_ADDON_PORT || 3306, // ✨ Añadido el puerto explícito por seguridad
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✨ PRUEBA DE CONEXIÓN DE SUPERVIVENCIA ✨
// Usamos .promise() de forma temporal y exclusiva solo para esta prueba de arranque, 
// así nos permite usar .then() y .catch() para atrapar errores de credenciales.
pool.promise().getConnection()
  .then(async (connection) => {
    console.log('📦 ¡Conexión a la Bóveda de Datos (MySQL) establecida con éxito!');
    connection.query("ALTER TABLE sistemas ADD COLUMN imagen VARCHAR(500) DEFAULT NULL").catch(() => {});

    // ✨ TABLAS PARA EL MÓDULO DE CURSOS Y TALLERES (ACADEMIA DEL GREMIO)
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS talleres_cursos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          club_id INT NOT NULL DEFAULT 1,
          evento_id INT NULL,
          titulo VARCHAR(255) NOT NULL,
          descripcion TEXT NOT NULL,
          tipo VARCHAR(100) NOT NULL DEFAULT 'Taller Práctico',
          modalidad VARCHAR(50) NOT NULL DEFAULT 'Presencial',
          instructor_id INT NULL,
          instructor_nombre VARCHAR(255) NOT NULL,
          cupo INT NOT NULL DEFAULT 12,
          fecha DATE NOT NULL,
          hora_inicio VARCHAR(10) NOT NULL,
          hora_fin VARCHAR(10) NOT NULL,
          lugar VARCHAR(255) NULL,
          requisitos TEXT NULL,
          materiales_incluidos TEXT NULL,
          costo VARCHAR(100) NOT NULL DEFAULT 'Gratuito',
          destinatarios VARCHAR(150) NOT NULL DEFAULT 'Para todo público',
          estado VARCHAR(50) NOT NULL DEFAULT 'Abierto',
          creado_por INT NOT NULL,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_taller_club (club_id),
          INDEX idx_taller_evento (evento_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS taller_inscripciones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          taller_id INT NOT NULL,
          usuario_id INT NOT NULL,
          fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          asistencia VARCHAR(50) NOT NULL DEFAULT 'pendiente',
          UNIQUE KEY uq_taller_usuario (taller_id, usuario_id),
          INDEX idx_taller_ins (taller_id),
          INDEX idx_usuario_ins (usuario_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (errTablas) {
      console.warn('Aviso al verificar tablas de talleres:', errTablas.message);
    }

    connection.release(); // Liberamos la conexión de prueba para que los usuarios la usen
  })
  .catch(err => {
    console.error('💥 ERROR CRÍTICO: No se pudo conectar a la Bóveda de Datos. Detalles:', err.message);
    console.error('Código de error:', err.code);
  });

// ⚔️ LA CURA CONTRA LOS ERRORES 500 ⚔️
// Exportamos el 'pool' normal (Callbacks) para que sea 100% compatible 
// con la forma en la que están escritas tus rutas de usuarios y partidas.
module.exports = pool;