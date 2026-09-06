const db = require('./config/db');

db.query(`SELECT r.*, p.dungeon_master_id FROM reputacion r JOIN partidas p ON r.partida_id = p.id JOIN usuarios u ON r.evaluado_id = u.id WHERE u.nombre = 'Smoke'`, (err, results) => {
  if (err) console.error(err);
  console.log("SMOKE:", results);
  
  db.query(`SELECT r.*, p.dungeon_master_id FROM reputacion r JOIN partidas p ON r.partida_id = p.id JOIN usuarios u ON r.evaluado_id = u.id WHERE u.nombre = 'Theoden'`, (err, results) => {
    if (err) console.error(err);
    console.log("THEODEN:", results);
    process.exit(0);
  });
});
