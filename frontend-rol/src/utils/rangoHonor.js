// ✨ SISTEMA DE RANGOS DEL GREMIO (Estilo Goblin Slayer)
export const obtenerRangoDM = (puntosHonor) => {
  const honor = parseInt(puntosHonor) || 0;

  if (honor >= 500) return { nivel: 10, nombre: 'Platino', icono: '💎', colorClase: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]' };
  if (honor >= 350) return { nivel: 9, nombre: 'Oro', icono: '🪙', colorClase: 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' };
  if (honor >= 200) return { nivel: 8, nombre: 'Plata', icono: '🥈', colorClase: 'text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.4)]' };
  if (honor >= 140) return { nivel: 7, nombre: 'Bronce', icono: '🥉', colorClase: 'text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]' };
  if (honor >= 90)  return { nivel: 6, nombre: 'Rubí', icono: '🩸', colorClase: 'text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.3)]' };
  if (honor >= 60)  return { nivel: 5, nombre: 'Esmeralda', icono: '🧪', colorClase: 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]' };
  if (honor >= 35)  return { nivel: 4, nombre: 'Zafiro', icono: '💧', colorClase: 'text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]' };
  if (honor >= 20)  return { nivel: 3, nombre: 'Acero', icono: '🗡️', colorClase: 'text-zinc-300 drop-shadow-[0_0_4px_rgba(212,212,216,0.3)]' };
  if (honor >= 10)  return { nivel: 2, nombre: 'Obsidiana', icono: '⬛', colorClase: 'text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.3)]' };
  
  return { nivel: 1, nombre: 'Porcelana', icono: '🥚', colorClase: 'text-zinc-300' };
};
