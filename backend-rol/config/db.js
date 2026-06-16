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

// Convertimos a promesas para usar async/await en tus rutas
const promisePool = pool.promise();

// ✨ PRUEBA DE CONEXIÓN DE SUPERVIVENCIA ✨
// Esto obligará a Node.js a probar la llave inmediatamente al arrancar.
// Si la puerta de la base de datos está trabada, nos dejará un mensaje de error exacto en los logs.
promisePool.getConnection()
  .then(connection => {
    console.log('📦 ¡Conexión a la Bóveda de Datos (MySQL) establecida con éxito!');
    connection.release(); // Liberamos la conexión de prueba para que los usuarios la usen
  })
  .catch(err => {
    console.error('💥 ERROR CRÍTICO: No se pudo conectar a la Bóveda de Datos. Detalles:', err.message);
    console.error('Código de error:', err.code);
  });

module.exports = promisePool;