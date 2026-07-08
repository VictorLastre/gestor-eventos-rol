const cron = require('node-cron');
const db = require('../config/db');
const { enviarMensajeAlCanal } = require('../utils/telegram');

const iniciarCronAvisos = () => {
  // Se ejecuta todos los días a las 14:00 hs (hora del servidor)
  // Puedes ajustar la hora cambiando el '14'
  cron.schedule('0 14 * * *', () => {
    console.log("⏰ [Cron] Ejecutando revisión de eventos para avisos semanales...");

    const sql = `
      SELECT id, nombre, fecha, hora_inicio, hora_fin, lugar, ciudad, estado 
      FROM eventos 
      WHERE estado IN ('Proximo', 'En Curso')
    `;

    db.query(sql, (err, eventos) => {
      if (err) {
        console.error("❌ Error en cron buscando eventos:", err);
        return;
      }

      eventos.forEach(evento => {
        // Cálculo preciso de diferencia de días usando la fecha sin horas
        const fechaObj = new Date(evento.fecha);
        const tzOffset = -3 * 60 * 60 * 1000; 
        
        const hoyArgDate = new Date(Date.now() + tzOffset);
        hoyArgDate.setUTCHours(0, 0, 0, 0);

        const eventoArgDate = new Date(fechaObj.getTime()); // asume 00:00:00 UTC
        // no le sumamos offset al evento porque ya viene en 00:00:00 y representa la fecha pura.

        const diffTime = eventoArgDate - hoyArgDate;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // Si faltan exactamente 7, 14, 21 o 28 días
        if (diffDays > 0 && diffDays % 7 === 0) {
          enviarConvocatoria(evento, diffDays);
        }
      });
    });
  });
};

const enviarConvocatoria = (evento, diasFaltantes) => {
    const fechaObj = new Date(evento.fecha);
    const dia = fechaObj.getUTCDate().toString().padStart(2, '0');
    
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mes = meses[fechaObj.getUTCMonth()];
    
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = diasSemana[fechaObj.getUTCDay()];
    
    const horaInicio = evento.hora_inicio ? evento.hora_inicio.substring(0, 5) : '15:00';
    const horaFin = evento.hora_fin ? evento.hora_fin.substring(0, 5) : '20:30';
    
    const mensajeTelegram = `⚔️ <b>Convocatoria de Narradores</b> ⚔️ – ${evento.nombre}\n\n` +
      `📍 ${evento.lugar}, ${evento.ciudad}\n` +
      `📅 ${diaSemana}, ${dia} de ${mes}\n` +
      `⏰ De ${horaInicio} a ${horaFin} hs\n\n` +
      `Buscamos narradores y cronistas de cualquier sistema:\n` +
      `🎲 Pampa Primigenia, Call of Cthulhu, Vampiro, Alien etc.\n` +
      `🎭 Mesas para principiantes o avanzadas.\n` +
      `⌛ Cada master decide a qué hora realiza su mesa. Siéntete libre de ponerte en contacto con tu grupo y llegar dentro del horario que disponemos.\n\n` +
      `¡Gracias por hacer parte de esta hermosa comunidad!.\n\n` +
      `👉 Puedes registrar tu aventura o crónica en:\n` +
      `https://rollapampa.org/\n` +
      `🔴 Puedes crear tu mesa hasta 24 horas antes del evento. Y puedes sumarte como aventurero hasta 1 hora antes del evento.\n\n` +
      `Nos vemos en la mesa. ✨`;

    enviarMensajeAlCanal(mensajeTelegram);
    console.log(`📢 Aviso semanal automático enviado para el evento: ${evento.nombre} (faltan ${diasFaltantes} días)`);
};

module.exports = iniciarCronAvisos;