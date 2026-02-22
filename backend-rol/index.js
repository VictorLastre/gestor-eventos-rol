// 1. IMPORTAMOS NUESTRAS HERRAMIENTAS MÁGICAS
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// 2. INICIALIZAMOS LA APLICACIÓN
const app = express();
app.use(cors());
app.use(express.json());

// 3. CONEXIÓN AL "MANUAL DE REGLAS" (MySQL)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      
  password: '',      
  database: 'gestor_rol' 
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('¡Conectado exitosamente a la base de datos MySQL!');
});

// ==========================================
// 4. EL GUARDIA DE SEGURIDAD
// ==========================================
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send('¡Alto ahí! Necesitas estar logueado para hacer esto.');
  }

  jwt.verify(token, 'secreto_del_master_123', (err, decoded) => {
    if (err) {
      return res.status(401).send('Tu Pase VIP es inválido o ha caducado.');
    }
    
    req.usuario = decoded; 
    next();
  });
};

// ==========================================
// 5. RUTAS PÚBLICAS
// ==========================================

app.get('/api/eventos', (req, res) => {
  const instruccionSQL = 'SELECT * FROM eventos ORDER BY fecha DESC';
  db.query(instruccionSQL, (err, resultados) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error leyendo los eventos');
    }
    res.json(resultados);
  });
});

app.post('/api/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const passwordEncriptada = await bcrypt.hash(password, 10);
    const instruccionSQL = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
    
    db.query(instruccionSQL, [nombre, email, passwordEncriptada, 'jugador'], (err, resultados) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).send('Este email ya está en uso. ¡Prueba con otro!');
        }
        return res.status(500).send('Error guardando el usuario en la base de datos');
      }
      res.status(201).send('¡Aventurero registrado con éxito!');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor al encriptar');
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const instruccionSQL = 'SELECT * FROM usuarios WHERE email = ?';
  
  db.query(instruccionSQL, [email], async (err, resultados) => {
    if (err) return res.status(500).send('Error interno del servidor');
    if (resultados.length === 0) return res.status(401).send('Credenciales incorrectas'); 

    const usuario = resultados[0]; 
    try {
      const passwordValida = await bcrypt.compare(password, usuario.password);
      if (!passwordValida) return res.status(401).send('Credenciales incorrectas');

      const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol }, 
        'secreto_del_master_123', 
        { expiresIn: '2h' } 
      );

      res.json({
        mensaje: `¡Bienvenido de vuelta, ${usuario.nombre}!`,
        token: token,
        usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al verificar credenciales');
    }
  });
});

// ==========================================
// 6. RUTAS PROTEGIDAS
// ==========================================

// Obtener partidas de un evento
app.get('/api/eventos/:id/partidas', verificarToken, (req, res) => {
  const idEvento = req.params.id;
  const idUsuario = req.usuario.id; 
  
  const instruccionSQL = `
    SELECT p.*, 
           u.nombre AS dungeon_master_nombre,
           COUNT(i.id) as jugadores_anotados,
           MAX(CASE WHEN i.usuario_id = ? THEN 1 ELSE 0 END) as estoy_anotado
    FROM partidas p
    JOIN usuarios u ON p.dungeon_master_id = u.id
    LEFT JOIN inscripciones i ON p.id = i.partida_id
    WHERE p.evento_id = ?
    GROUP BY p.id
  `;

  db.query(instruccionSQL, [idUsuario, idEvento], (err, resultados) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error leyendo las partidas del evento');
    }
    res.json(resultados);
  });
});

// Anotarse a una mesa (Regla de Oro)
app.post('/api/partidas/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id; 
  const idUsuario = req.usuario.id; 

  const instruccionVerificacion = `
    SELECT 1 FROM inscripciones i JOIN partidas p ON i.partida_id = p.id WHERE i.usuario_id = ? AND p.evento_id = (SELECT evento_id FROM partidas WHERE id = ?)
    UNION
    SELECT 1 FROM partidas WHERE dungeon_master_id = ? AND evento_id = (SELECT evento_id FROM partidas WHERE id = ?)
  `;

  db.query(instruccionVerificacion, [idUsuario, idPartida, idUsuario, idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error verificando el manual de reglas.');
    if (resultados.length > 0) {
        return res.status(400).send('Regla de Oro: Ya estás participando en otra mesa de este evento.');
    }

    const instruccionSQL = 'INSERT INTO inscripciones (usuario_id, partida_id) VALUES (?, ?)';
    db.query(instruccionSQL, [idUsuario, idPartida], (err, insertRes) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).send('Ya estás anotado en esta mesa.');
        return res.status(500).send('Error al procesar tu inscripción.');
      }
      res.status(201).send('¡Te has sumado a la mesa con éxito!');
    });
  });
});

app.delete('/api/partidas/:id/inscripciones', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;
  const instruccionSQL = 'DELETE FROM inscripciones WHERE usuario_id = ? AND partida_id = ?';
  db.query(instruccionSQL, [idUsuario, idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error al intentar darte de baja.');
    if (resultados.affectedRows === 0) return res.status(404).send('No estás anotado en esta mesa.');
    res.send('Te has dado de baja de la mesa.');
  });
});

// Ver jugadores de una mesa
app.get('/api/partidas/:id/jugadores', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;
  const instruccionVerificacion = 'SELECT dungeon_master_id FROM partidas WHERE id = ?';
  
  db.query(instruccionVerificacion, [idPartida], (err, resultados) => {
    if (err) return res.status(500).send('Error consultando los pergaminos.');
    if (resultados.length === 0) return res.status(404).send('Mesa no encontrada.');

    const esElMaster = resultados[0].dungeon_master_id === idUsuario;
    const esAdmin = req.usuario.rol === 'admin';

    if (!esElMaster && !esAdmin) {
      return res.status(403).send('Solo el DM de esta mesa puede ver esta información.');
    }

    const instruccionSQL = `
      SELECT u.id, u.nombre, u.email 
      FROM inscripciones i
      JOIN usuarios u ON i.usuario_id = u.id
      WHERE i.partida_id = ?
    `;

    db.query(instruccionSQL, [idPartida], (err, jugadores) => {
      if (err) return res.status(500).send('Error al invocar la lista de jugadores.');
      res.json(jugadores);
    });
  });
});

// Crear nueva mesa
app.post('/api/eventos/:id/partidas', verificarToken, (req, res) => {
  const idEvento = req.params.id;
  const idUsuario = req.usuario.id;
  const rolUsuario = req.usuario.rol;

  if (rolUsuario === 'jugador') {
    return res.status(403).send('Solo DMs y Admins pueden crear mesas.');
  }

  const instruccionVerificacion = 'SELECT id FROM partidas WHERE evento_id = ? AND dungeon_master_id = ?';
  db.query(instruccionVerificacion, [idEvento, idUsuario], (err, resultados) => {
    if (err) return res.status(500).send('Error verificando el manual de reglas.');
    if (resultados.length > 0) {
      return res.status(400).send('Ya estás dirigiendo una mesa en este evento.');
    }

    const { titulo, descripcion, requisitos, sistema, cupo, turno } = req.body;
    const instruccionSQL = `
      INSERT INTO partidas (evento_id, dungeon_master_id, titulo, descripcion, requisitos, sistema, cupo, turno, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'abierta')
    `;
    db.query(instruccionSQL, [idEvento, idUsuario, titulo, descripcion, requisitos, sistema, cupo, turno], (err, insertRes) => {
      if (err) return res.status(500).send('Error al crear la mesa.');
      res.status(201).send('¡Mesa creada con éxito!');
    });
  });
});

// Crear nuevo evento
app.post('/api/eventos', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).send('Solo Admins pueden crear eventos.');
  const { nombre, descripcion, fecha } = req.body;
  const instruccionSQL = 'INSERT INTO eventos (nombre, descripcion, fecha) VALUES (?, ?, ?)';
  db.query(instruccionSQL, [nombre, descripcion, fecha], (err, insertRes) => {
    if (err) return res.status(500).send('Error al crear el evento.');
    res.status(201).send('¡Evento convocado con éxito!');
  });
});

// Mis Crónicas
app.get('/api/mis-cronicas', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  const sqlDirigiendo = `
    SELECT p.id, p.titulo, p.sistema, e.nombre AS evento_nombre, e.fecha AS evento_fecha
    FROM partidas p
    JOIN eventos e ON p.evento_id = e.id
    WHERE p.dungeon_master_id = ?
    ORDER BY e.fecha DESC
  `;
  const sqlJugando = `
    SELECT p.id, p.titulo, p.sistema, e.nombre AS evento_nombre, e.fecha AS evento_fecha, u.nombre AS dm_nombre
    FROM inscripciones i
    JOIN partidas p ON i.partida_id = p.id
    JOIN eventos e ON p.evento_id = e.id
    JOIN usuarios u ON p.dungeon_master_id = u.id
    WHERE i.usuario_id = ?
    ORDER BY e.fecha DESC
  `;
  db.query(sqlDirigiendo, [idUsuario], (err, dirigiendo) => {
    if (err) return res.status(500).send('Error en crónicas.');
    db.query(sqlJugando, [idUsuario], (err, jugando) => {
      if (err) return res.status(500).send('Error en crónicas.');
      res.json({ dirigiendo, jugando });
    });
  });
});

// Solicitar ser DM
app.post('/api/usuarios/solicitar-dm', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  db.query('UPDATE usuarios SET solicita_dm = true WHERE id = ?', [idUsuario], (err) => {
    if (err) return res.status(500).send('Error en solicitud.');
    res.send('Solicitud enviada.');
  });
});

app.get('/api/usuarios/solicitudes-dm', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).send('Acceso denegado');
  db.query('SELECT id, nombre, email FROM usuarios WHERE solicita_dm = true AND rol = "jugador"', (err, resultados) => {
    if (err) return res.status(500).send('Error leyendo solicitudes.');
    res.json(resultados);
  });
});

app.put('/api/usuarios/:id/promover', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).send('Acceso denegado');
  db.query('UPDATE usuarios SET rol = "dm", solicita_dm = false WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send('Error al promover.');
    res.send('Ascendido con éxito.');
  });
});

// ==========================================
// ESTADÍSTICAS (RUTA CORREGIDA)
// ==========================================
app.get('/api/admin/estadisticas', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).send('Acceso denegado');

  // Cambiamos p.id_evento por p.evento_id
  // Y contamos las inscripciones reales
  const sql = `
    SELECT 
      e.nombre, 
      COUNT(DISTINCT p.id) as total_mesas, 
      (SELECT COUNT(*) FROM inscripciones i2 
       JOIN partidas p2 ON i2.partida_id = p2.id 
       WHERE p2.evento_id = e.id) as total_jugadores
    FROM eventos e
    LEFT JOIN partidas p ON e.id = p.evento_id
    GROUP BY e.id
    ORDER BY e.fecha DESC
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error("Error SQL Stats:", err);
      return res.status(500).send('Error al obtener estadísticas');
    }
    res.json(resultados);
  });
});

// ==========================================
// SEGURIDAD Y CALIDAD: BORRADO Y EDICIÓN
// ==========================================

// 1. Borrar un Evento (Solo Admin)
app.delete('/api/eventos/:id', verificarToken, (req, res) => {
  if (req.usuario.rol !== 'admin') return res.status(403).send('No tienes permiso.');
  
  const id = req.params.id;
  // Gracias a las claves foráneas (si las configuraste), esto debería borrar en cascada
  db.query('DELETE FROM eventos WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send('Error al borrar el evento.');
    res.send('Evento eliminado del registro.');
  });
});

// 2. Borrar una Mesa (Admin o el propio DM)
app.delete('/api/partidas/:id', verificarToken, (req, res) => {
  const idPartida = req.params.id;
  const idUsuario = req.usuario.id;
  const esAdmin = req.usuario.rol === 'admin';

  // Verificamos si es el dueño
  db.query('SELECT dungeon_master_id FROM partidas WHERE id = ?', [idPartida], (err, resultados) => {
    if (err || resultados.length === 0) return res.status(404).send('Mesa no encontrada.');
    
    if (resultados[0].dungeon_master_id !== idUsuario && !esAdmin) {
      return res.status(403).send('No puedes borrar una mesa que no diriges.');
    }

    db.query('DELETE FROM partidas WHERE id = ?', [idPartida], (err) => {
      if (err) return res.status(500).send('Error al borrar la mesa.');
      res.send('La mesa ha sido disuelta.');
    });
  });
});

// 3. Editar Perfil (Cualquier usuario logueado)
app.put('/api/usuarios/perfil', verificarToken, (req, res) => {
  const idUsuario = req.usuario.id;
  const { nombre, email } = req.body;

  db.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, idUsuario], (err) => {
    if (err) return res.status(500).send('Error al actualizar el perfil.');
    res.send('Perfil actualizado con éxito.');
  });
});

// ==========================================
// 7. ENCENDER EL SERVIDOR
// ==========================================
const PUERTO = 3001;
app.listen(PUERTO, () => {
  console.log(`Director de Juego escuchando en http://localhost:${PUERTO}`);
});