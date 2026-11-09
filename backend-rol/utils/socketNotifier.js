/**
 * ⚡ socketNotifier.js
 * Emisor inteligente de WebSockets con soporte para salas por sede (Rooms).
 * - Emite a la sala del club (`club_${clubId}`) y a los superadmins en el multiverso (`club_todos`).
 * - Si clubId no se especifica o es 'todos' o 'global', emite broadcast general (compatibilidad total).
 */
function emitirAClub(io, evento, datos = {}, clubId = null) {
  if (!io) return;
  
  if (!clubId || clubId === 'todos' || clubId === 'global') {
    io.emit(evento, datos);
  } else {
    // Envía a los conectados a este club y a los que están en modo multiverso
    io.to(`club_${clubId}`).to('club_todos').emit(evento, datos);
  }
}

module.exports = { emitirAClub };
