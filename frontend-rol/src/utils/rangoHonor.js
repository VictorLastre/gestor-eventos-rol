// ✨ SISTEMA DE RANGOS DEL GREMIO (Estilo Goblin Slayer)
export const obtenerRangoDM = (puntosHonor) => {
  const honor = parseInt(puntosHonor) || 0;

  if (honor >= 500) return { nivel: 10, nombre: 'Platino', icono: '💎', colorClase: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]' };
  if (honor >= 350) return { nivel: 9, nombre: 'Oro', icono: '🪙', colorClase: 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' };
  if (honor >= 200) return { nivel: 8, nombre: 'Plata', icono: '🥈', colorClase: 'text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.4)]' };
  if (honor >= 140) return { nivel: 7, nombre: 'Bronce', icono: '🥉', colorClase: 'text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.3)]' };
  if (honor >= 90)  return { nivel: 6, nombre: 'Rubí', icono: '🩸', colorClase: 'text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]' };
  if (honor >= 60)  return { nivel: 5, nombre: 'Esmeralda', icono: '🧪', colorClase: 'text-emerald-500 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]' };
  if (honor >= 35)  return { nivel: 4, nombre: 'Zafiro', icono: '💧', colorClase: 'text-blue-500' };
  if (honor >= 20)  return { nivel: 3, nombre: 'Acero', icono: '🗡️', colorClase: 'text-zinc-400' };
  if (honor >= 10)  return { nivel: 2, nombre: 'Obsidiana', icono: '⬛', colorClase: 'text-zinc-800' };
  
  return { nivel: 1, nombre: 'Porcelana', icono: '🥚', colorClase: 'text-zinc-300' };
};
