const mysql = require('mysql2');

// Configuración de la conexión con las nuevas credenciales de Hostinger
const pool = mysql.createPool({
  host: 'localhost',              // En Hostinger se usa localhost
  user: 'u708459681_victor',      // El usuario que creaste (con el prefijo)
  password: 'TuContraseñaSegura', // La contraseña que asignaste a la base
  database: 'u708459681_rol',     // El nombre de la base (con el prefijo)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convertimos a promesas para usar async/await en tus rutas
const promisePool = pool.promise();

module.exports = promisePool;