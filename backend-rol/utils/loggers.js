const db = require('./db'); // Tu conexión a la base de datos

const registrarLog = (usuario, accion, descripcion) => {
    const sql = "INSERT INTO logs_actividad (usuario_id, nombre_usuario, accion, descripcion) VALUES (?, ?, ?, ?)";
    
    // Si pasas el objeto 'usuario' que viene del JWT:
    const id = usuario.id;
    const nombre = usuario.nombre;

    db.query(sql, [id, nombre, accion, descripcion], (err) => {
        if (err) {
            console.error("❌ Error escribiendo en la bitácora:", err);
        } else {
            console.log(`📜 Bitácora actualizada: ${accion} por ${nombre}`);
        }
    });
};

module.exports = { registrarLog };