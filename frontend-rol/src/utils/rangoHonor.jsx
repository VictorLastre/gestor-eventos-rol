import React from 'react';
import { GiBrokenPottery, GiStoneBlock, GiBroadsword, GiDrop, GiEmerald, GiGems, GiMedal, GiCheckedShield, GiCrown, GiDiamondTrophy } from 'react-icons/gi';

// ⚔️ SISTEMA DE RANGOS DEL GREMIO (Estilo Goblin Slayer)
export const obtenerRangoDM = (puntosHonor) => {
  const honor = parseInt(puntosHonor) || 0;

  if (honor >= 100) return { nivel: 10, nombre: 'Platino', icono: <GiDiamondTrophy className="text-cyan-200 text-lg" />, colorClase: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]' };
  if (honor >= 70)  return { nivel: 9, nombre: 'Oro', icono: <GiCrown className="text-yellow-300 text-lg" />, colorClase: 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' };
  if (honor >= 40)  return { nivel: 8, nombre: 'Plata', icono: <GiCheckedShield className="text-slate-200 text-lg" />, colorClase: 'text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.4)]' };
  if (honor >= 28)  return { nivel: 7, nombre: 'Bronce', icono: <GiMedal className="text-amber-500 text-lg" />, colorClase: 'text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]' };
  if (honor >= 18)  return { nivel: 6, nombre: 'Rubí', icono: <GiGems className="text-red-500 text-lg" />, colorClase: 'text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.3)]' };
  if (honor >= 12)  return { nivel: 5, nombre: 'Esmeralda', icono: <GiEmerald className="text-emerald-400 text-lg" />, colorClase: 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]' };
  if (honor >= 7)   return { nivel: 4, nombre: 'Zafiro', icono: <GiDrop className="text-blue-400 text-lg" />, colorClase: 'text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]' };
  if (honor >= 4)   return { nivel: 3, nombre: 'Acero', icono: <GiBroadsword className="text-zinc-300 text-lg" />, colorClase: 'text-zinc-300 drop-shadow-[0_0_4px_rgba(212,212,216,0.3)]' };
  if (honor >= 2)   return { nivel: 2, nombre: 'Obsidiana', icono: <GiStoneBlock className="text-purple-400 text-lg" />, colorClase: 'text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.3)]' };
  
  return { nivel: 1, nombre: 'Porcelana', icono: <GiBrokenPottery className="text-zinc-400 text-lg" />, colorClase: 'text-zinc-300' };
};
