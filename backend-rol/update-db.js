require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_ADDON_HOST,
      user: process.env.MYSQL_ADDON_USER,
      password: process.env.MYSQL_ADDON_PASSWORD,
      database: process.env.MYSQL_ADDON_DB,
      port: process.env.MYSQL_ADDON_PORT || 3306
    });

    console.log('Conectado a la base de datos.');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS buzon_sugerencias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        mensaje TEXT NOT NULL,
        leido BOOLEAN DEFAULT FALSE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await connection.execute(createTableQuery);
    console.log('Tabla buzon_sugerencias creada o ya existente.');

    await connection.end();
  } catch (error) {
    console.error('Error al actualizar BD:', error);
  }
}

updateDB();
