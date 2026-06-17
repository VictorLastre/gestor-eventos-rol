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
  .then(connection => {
    console.log('📦 ¡Conexión a la Bóveda de Datos (MySQL) establecida con éxito!');
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