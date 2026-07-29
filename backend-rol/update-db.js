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

    await connection.execute(`ALTER TABLE usuarios ADD COLUMN biografia TEXT`);
    console.log('Columna biografia añadida con éxito.');

    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('La columna biografia ya existe.');
    } else {
      console.error('Error al actualizar BD:', error);
    }
  }
}

updateDB();
