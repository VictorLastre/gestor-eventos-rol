import React, { useState, useEffect } from 'react';
import Avatar from 'boring-avatars';
import { io } from 'socket.io-client';
import { fetchProtegido } from '../utils/api';

function SalonFama({ cambiarVista }) {
  const [ranking, setRanking] = useState({ masters: [], jugadores: [] });
  const [cargando, setCargando] = useState(true);
  const [pestanaActiva, setPestanaActiva] = useState('masters');

  const fetchRanking = async () => {
    try {
      const res = await fetchProtegido('/api/usuarios/ranking/salon-fama');
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
  }, []);

  const verPerfil = (id) => {
    cambiarVista('perfilPublico', { id });
  };

  const renderAvatar = (u) => {
    if (u.avatar && u.avatar.startsWith('http')) {
      return <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />;
    }
    return (
      <Avatar
        size="100%"
        name={u.nombre}
        variant="beam"
        colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']}
      />
    );
  };

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 text-glow">
            Salón de la Fama
          </h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">
            El prestigio del Gremio forjado en cada partida
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

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-[2.5rem] p-4 md:p-8 border border-zinc-800 shadow-2xl">
            
            {/* MASTERS */}
            {pestanaActiva === 'masters' && (
              <div className="flex flex-col gap-4">
                {ranking.masters.map((master, index) => (
                  <div
                    key={master.id}
                    onClick={() => verPerfil(master.id)}
                    className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl cursor-pointer hover:border-amber-500/50 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-black text-amber-500/30 w-8 text-center">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-lg border-2 border-zinc-800 group-hover:border-amber-500/50 transition-colors">
                        {renderAvatar(master)}
                      </div>
                      <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm md:text-base group-hover:text-amber-400 transition-colors">
                          {master.nombre}
                        </h3>
                        <p className="text-xs text-zinc-500 font-bold tracking-widest mt-1">
                          {master.nombre_completo || 'Dungeon Master'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Honor Total</div>
                      <div className="text-xl md:text-2xl font-black text-amber-500 flex items-center gap-2 justify-end">
                        {master.honor_total} <span>🔥</span>
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
                {ranking.jugadores.map((jugador, index) => (
                  <div
                    key={jugador.id}
                    onClick={() => verPerfil(jugador.id)}
                    className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-black text-emerald-500/30 w-8 text-center">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-lg border-2 border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
                        {renderAvatar(jugador)}
                      </div>
                      <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm md:text-base group-hover:text-emerald-400 transition-colors">
                          {jugador.nombre}
                        </h3>
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
