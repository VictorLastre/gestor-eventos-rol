const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verificarToken = require('../middlewares/auth');

// Middleware para restringir acceso exclusivo a Administradores durante la fase de prueba
const esAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Zona de pruebas restringida: Se requiere rol de Administrador.' });
  }
  next();
};

// Crear tabla en MySQL si no existe aún
const asegurarTablaCrawler = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS crawler_progreso (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      piso_actual INT DEFAULT 1,
      clase VARCHAR(50) DEFAULT 'guerrero',
      genero VARCHAR(10) DEFAULT 'm',
      nivel INT DEFAULT 1,
      xp INT DEFAULT 0,
      hp_actual INT DEFAULT 160,
      durabilidad_actual INT DEFAULT 70,
      oro INT DEFAULT 0,
      jefes_derrotados INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_crawler_usuario (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  try {
    await db.promise().query(sql);
  } catch (err) {
    console.error('Error al verificar tabla crawler_progreso:', err);
  }
};
asegurarTablaCrawler();

// 1. OBTENER PROGRESO DEL JUGADOR
router.get('/progreso', verificarToken, esAdmin, async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const [filas] = await db.promise().query(
      'SELECT * FROM crawler_progreso WHERE usuario_id = ?',
      [usuarioId]
    );

    if (filas.length === 0) {
      return res.json({
        existe: false,
        piso_actual: 1,
        oro: 0,
        clase: 'guerrero',
        genero: 'm',
        nivel: 1
      });
    }

    res.json({ existe: true, ...filas[0] });
  } catch (error) {
    console.error('Error al cargar progreso del crawler:', error);
    res.status(500).json({ error: 'Error al consultar la cripta.' });
  }
});

// 2. GUARDAR PROGRESO (Hoguera, muerte o cambio de piso)
router.post('/guardar', verificarToken, esAdmin, async (req, res) => {
  const usuarioId = req.usuario.id;
  const {
    piso_actual,
    clase,
    genero,
    nivel,
    xp,
    hp_actual,
    durabilidad_actual,
    oro,
    jefes_derrotados
  } = req.body;

  const sql = `
    INSERT INTO crawler_progreso 
      (usuario_id, piso_actual, clase, genero, nivel, xp, hp_actual, durabilidad_actual, oro, jefes_derrotados)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      piso_actual = VALUES(piso_actual),
      clase = VALUES(clase),
      genero = VALUES(genero),
      nivel = VALUES(nivel),
      xp = VALUES(xp),
      hp_actual = VALUES(hp_actual),
      durabilidad_actual = VALUES(durabilidad_actual),
      oro = VALUES(oro),
      jefes_derrotados = VALUES(jefes_derrotados),
      updated_at = CURRENT_TIMESTAMP
  `;

  try {
    await db.promise().query(sql, [
      usuarioId,
      piso_actual || 1,
      clase || 'guerrero',
      genero || 'm',
      nivel || 1,
      xp || 0,
      hp_actual || 160,
      durabilidad_actual || 70,
      oro || 0,
      jefes_derrotados || 0
    ]);

    res.json({ mensaje: '¡Progreso de la Cripta resguardado por los dioses antiguos!' });
  } catch (error) {
    console.error('Error al guardar progreso en la cripta:', error);
    res.status(500).json({ error: 'No se pudo guardar el avance en la base de datos.' });
  }
});

// 3. RANKING / SALÓN DE LA CRIPTA (Top exploradores)
router.get('/ranking', verificarToken, esAdmin, async (req, res) => {
  try {
    const [filas] = await db.promise().query(`
      SELECT 
        c.piso_actual, c.clase, c.nivel, c.oro, c.jefes_derrotados, c.updated_at,
        u.nombre, u.avatar
      FROM crawler_progreso c
      JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.piso_actual DESC, c.jefes_derrotados DESC, c.nivel DESC
      LIMIT 10
    `);

    res.json(filas);
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error al consultar la tabla de líderes.' });
  }
});

module.exports = router;
