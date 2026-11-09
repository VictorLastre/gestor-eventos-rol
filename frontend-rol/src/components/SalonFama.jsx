import React, { useState, useEffect } from 'react';
import AvatarUsuario from './AvatarUsuario';
import { io } from 'socket.io-client';
import { fetchProtegido } from '../utils/api';

function SalonFama({ cambiarVista, clubActivo }) {
  const [ranking, setRanking] = useState({ masters: [], jugadores: [] });
  const [cargando, setCargando] = useState(true);
  const [pestanaActiva, setPestanaActiva] = useState('masters');
  const [busqueda, setBusqueda] = useState('');

  const fetchRanking = async () => {
    try {
      const clubParam = clubActivo?.id ? `?club_id=${clubActivo.id}` : '';
      const res = await fetchProtegido(`/api/usuarios/ranking/salon-fama${clubParam}`);
      if (res.ok) {
        const data = await res.json();
        setRanking(data);
      }
    } catch (error) {
      console.error('Error cargando el salón de la fama:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchRanking();
    const socket = io('/', { path: '/api/socket.io' });
    socket.on('actualizacion-usuarios', fetchRanking);

    return () => socket.disconnect();
  }, [clubActivo?.id]);

  const verPerfil = (id) => {
    cambiarVista('perfilPublico', { id });
  };

  const renderAvatar = (u) => {
    return <AvatarUsuario nombre={u?.nombre} avatar={u?.avatar} tamaño="100%" variante="beam" />;
  };

  const coincide = (u) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase().trim();
    const alias = (u?.nombre || '').toLowerCase();
    const real = (u?.nombre_completo || '').toLowerCase();
    return alias.includes(q) || real.includes(q);
  };

  const mastersFiltrados = ranking.masters.filter(coincide);
  const jugadoresFiltrados = ranking.jugadores.filter(coincide);

  return (
    <div className="min-h-screen py-4 md:py-8 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 text-glow">
            Salón de la Fama
          </h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">
            {clubActivo?.id === 'todos' ? 'El prestigio del Gremio a través de todas las tierras' : `El prestigio forjado en ${clubActivo?.nombre || 'la Asociación'}`}
          </p>
        </div>

        {/* PESTAÑAS */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setPestanaActiva('masters')}
            className={`flex items-center gap-2 px-6 py-3 font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all rounded-2xl ${
              pestanaActiva === 'masters'
                ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)]'
                : 'text-zinc-500 hover:bg-zinc-900 border border-transparent hover:border-zinc-800'
            }`}
          >
            <span className="text-xl">🧙‍♂️</span> Maestros
          </button>
          <button
            onClick={() => setPestanaActiva('jugadores')}
            className={`flex items-center gap-2 px-6 py-3 font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all rounded-2xl ${
              pestanaActiva === 'jugadores'
                ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(5,150,105,0.4)]'
                : 'text-zinc-500 hover:bg-zinc-900 border border-transparent hover:border-zinc-800'
            }`}
          >
            <span className="text-xl">🛡️</span> Aventureros
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="flex justify-center mb-8 px-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder={pestanaActiva === 'masters' ? "Buscar maestro..." : "Buscar aventurero..."}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500/50 transition-colors pl-12 shadow-inner"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🔍</span>
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-[2.5rem] p-4 md:p-8 border border-zinc-800 shadow-2xl">
            
            {/* MASTERS */}
            {pestanaActiva === 'masters' && (
              <div className="flex flex-col gap-4">
                {mastersFiltrados.map((master, index) => (
                  <div
                    key={master.id}
                    onClick={() => verPerfil(master.id)}
                    className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl cursor-pointer hover:border-amber-500/50 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="text-xl sm:text-2xl font-black text-amber-500/30 w-6 sm:w-8 text-center shrink-0">
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-lg border-2 border-zinc-800 group-hover:border-amber-500/50 transition-colors shrink-0">
                        {renderAvatar(master)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-black uppercase tracking-widest text-xs sm:text-sm md:text-base group-hover:text-amber-400 transition-colors truncate">
                          {master.nombre}
                        </h3>
                        {master.nombre_completo && (
                          <p className="text-[10px] text-zinc-500 font-bold tracking-wider truncate">
                            {master.nombre_completo}
                          </p>
                        )}
                        <p className="text-xs text-amber-500/80 font-bold tracking-widest mt-1">
                          Dungeon Master
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Honor Total</div>
                      <div className={`text-xl md:text-2xl font-black flex items-center gap-2 justify-end ${master.honor_total >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                          {master.honor_total > 0 ? '+' : ''}{master.honor_total} <span>{master.honor_total >= 0 ? '🔥' : '💀'}</span>
                        </div>
                    </div>
                  </div>
                ))}
                {ranking.masters.length === 0 && (
                  <p className="text-center text-zinc-500 font-bold py-10">Ningún maestro ha forjado su leyenda aún.</p>
                )}
              </div>
            )}

            {/* JUGADORES */}
            {pestanaActiva === 'jugadores' && (
              <div className="flex flex-col gap-4">
                {jugadoresFiltrados.map((jugador, index) => (
                  <div
                    key={jugador.id}
                    onClick={() => verPerfil(jugador.id)}
                    className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="text-xl sm:text-2xl font-black text-emerald-500/30 w-6 sm:w-8 text-center shrink-0">
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-lg border-2 border-zinc-800 group-hover:border-emerald-500/50 transition-colors shrink-0">
                        {renderAvatar(jugador)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-black uppercase tracking-widest text-xs sm:text-sm md:text-base group-hover:text-emerald-400 transition-colors truncate">
                          {jugador.nombre}
                        </h3>
                        {jugador.nombre_completo && (
                          <p className="text-[10px] text-zinc-500 font-bold tracking-wider truncate">
                            {jugador.nombre_completo}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 font-bold tracking-widest mt-1">
                          {jugador.rol === 'aventurero' ? 'Aventurero Novato' : 'Héroe Consagrado'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Reputación</div>
                      <div className={`text-xl md:text-2xl font-black flex items-center gap-2 justify-end ${jugador.reputacion_neta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {jugador.reputacion_neta > 0 ? '+' : ''}{jugador.reputacion_neta} 
                        <span>{jugador.reputacion_neta >= 0 ? '🌟' : '☠️'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {ranking.jugadores.length === 0 && (
                  <p className="text-center text-zinc-500 font-bold py-10">Ningún jugador ha dejado su marca aún.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SalonFama;
