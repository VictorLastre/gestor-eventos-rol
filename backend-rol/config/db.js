const mysql = require('mysql2');

// Configuración de la conexión vinculada a las Variables de Entorno de Hostinger
const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || '127.0.0.1', 
  user: process.env.MYSQL_ADDON_USER, 
  password: process.env.MYSQL_ADDON_PASSWORD, 
  database: process.env.MYSQL_ADDON_DB, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convertimos a promesas para usar async/await en tus rutas
const promisePool = pool.promise();

module.exports = promisePool;