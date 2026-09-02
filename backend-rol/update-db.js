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

    const createReputacionQuery = `
      CREATE TABLE IF NOT EXISTS reputacion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        evaluador_id INT NOT NULL,
        evaluado_id INT NOT NULL,
        partida_id INT NOT NULL,
        voto INT NOT NULL,
        etiqueta VARCHAR(100) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_eval (evaluador_id, evaluado_id, partida_id)
      )
    `;
    await connection.execute(createReputacionQuery);
    console.log('Tabla reputacion creada o ya existente.');

    await connection.end();
  } catch (error) {
    console.error('Error al actualizar BD:', error);
  }
}

updateDB();
