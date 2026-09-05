import { useState, useEffect } from 'react';
import Avatar from 'boring-avatars';
import { fetchProtegido } from '../utils/api';
import { obtenerRangoDM } from '../utils/rangoHonor';

function PerfilPublico({ usuarioId, volver }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProtegido(`/api/usuarios/${usuarioId}/perfil_publico`)
      .then(res => {
        if (!res.ok) throw new Error('Aventurero no encontrado');
        return res.json();
      })
      .then(data => {
        setPerfil(data);
        setCargando(false);
      })
      .catch(err => {
        setError(err.message);
        setCargando(false);
      });
  }, [usuarioId]);

  if (cargando) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-black animate-pulse uppercase tracking-widest text-xs">Buscando en los registros...</p>
      </div>
    </div>
  );

  if (error || !perfil) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
      <span className="text-6xl grayscale opacity-20">👻</span>
      <p className="text-zinc-500 font-bold uppercase tracking-widest">{error || 'El aventurero se ha desvanecido'}</p>
      <button onClick={volver} className="mt-4 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-xl uppercase tracking-widest text-xs transition-colors">Volver a la taberna</button>
    </div>
  );

  const rango = (perfil.rol === 'dm' || perfil.rol === 'admin') ? obtenerRangoDM(perfil.dirigiendo ? perfil.dirigiendo.length : 0) : null;
  const fundadores = ['mati', 'martín', 'martin', 'delo', 'keith', 'guille', 'diny', 'sterbern'];
  const esFundador = perfil.nombre ? fundadores.includes(perfil.nombre.toLowerCase()) : false;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
      
      <button 
        onClick={volver}
        className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-emerald-400 font-black uppercase tracking-widest text-xs transition-colors"
      >
        <span>←</span> Volver
      </button>

      {/* 📜 ENCABEZADO DE PERFIL */}
      <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl mb-8 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 ${esFundador ? 'bg-amber-500/10' : 'bg-emerald-500/10'} blur-[100px] rounded-full pointer-events-none`}></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8 w-full max-w-full overflow-hidden">
              <div className="relative group shrink-0">
                  <div className={`absolute inset-0 ${esFundador ? 'bg-amber-500/20' : 'bg-emerald-500/20'} blur-xl rounded-full transition-all`}></div>
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl relative z-10 overflow-hidden border-4 ${esFundador ? 'border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-zinc-800'}`}>
                      <Avatar
                        size="100%"
                        name={perfil.nombre}
                        variant="beam"
                        colors={esFundador ? ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'] : ['#10b981', '#059669', '#34d399', '#065f46', '#047857']}
                      />
                  </div>
              </div>
              <div className="flex flex-col items-center md:items-start max-w-full min-w-0">
                <p className={`text-3xl md:text-5xl font-black tracking-tighter uppercase italic w-full truncate ${esFundador ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'text-white'}`} title={perfil.nombre}>
                  {perfil.nombre}
                </p>
                
                {perfil.rol === 'admin' ? (
                  <span className="flex flex-wrap items-center gap-2 text-emerald-400 font-black tracking-[0.2em] text-xs mt-2">
                    <span className="text-sm">👑</span> ADMINISTRADOR
                    {rango && <><span className="text-zinc-600 font-normal ml-1">•</span> <span className={`ml-1 flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-800 bg-black/40 ${rango.colorClase}`}>NVL. {rango.nivel} - {rango.nombre.toUpperCase()}</span></>}
                  </span>
                ) : perfil.rol === 'dm' ? (
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2 w-full mt-2">
                    <span className="text-emerald-500 font-black text-[10px] md:text-xs uppercase tracking-[0.4em]">🛡️ Dungeon Master</span>
                    {rango && (
                      <>
                        <span className="text-zinc-600 font-normal hidden md:inline">•</span>
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-800 bg-black/40 ${rango.colorClase}`}>NVL. {rango.nivel} - {rango.nombre.toUpperCase()}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-500 font-black text-[10px] md:text-xs uppercase tracking-[0.4em] mb-2 w-full truncate mt-2">⚔️ Aventurero</p>
                )}

                {/* ✨ REPUTACIÓN Y ETIQUETAS */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex flex-col items-center justify-center">
                    {(perfil.rol === 'dm' || perfil.rol === 'admin') ? (
                      <>
                        <span className={`text-2xl font-black ${perfil.reputacion_neta >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                          {perfil.reputacion_neta > 0 ? '+' : ''}{perfil.reputacion_neta || 0} {perfil.reputacion_neta >= 0 ? '🔥' : '💀'}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">Honor Total</span>
                      </>
                    ) : (
                      <>
                        <span className={`text-2xl font-black ${perfil.reputacion_neta > 0 ? 'text-emerald-500' : perfil.reputacion_neta < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                          {perfil.reputacion_neta > 0 ? '+' : ''}{perfil.reputacion_neta || 0}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">Reputación</span>
                      </>
                    )}
                  </div>

                  {perfil.topTags && perfil.topTags.length > 0 && (
                    <div className="flex gap-2 ml-2">
                      {perfil.topTags.map((tag, idx) => (
                        <span key={idx} className="bg-zinc-900/80 border border-zinc-800 text-[9px] md:text-[10px] text-zinc-300 font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-inner flex items-center gap-1">
                          {tag.etiqueta} <span className="opacity-50">({tag.cantidad})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {perfil.biografia && (
                  <div className="mt-4 bg-zinc-950/50 p-4 rounded-2xl border-l-2 border-emerald-500 w-full text-left">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Su Historia</p>
                    <p className="text-zinc-300 italic text-sm md:text-base leading-relaxed">"{perfil.biografia}"</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </section>

      {/* HISTORIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* LIDERANDO MESAS (Solo DMs y Admins) */}
        {(perfil.rol === 'dm' || perfil.rol === 'admin') && (
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-[2rem]">
            <h3 className="text-amber-500 font-black uppercase tracking-widest text-sm md:text-base mb-6 flex items-center gap-3">
              🛡️ Expediciones Lideradas ({perfil.dirigiendo.length})
            </h3>
            {perfil.dirigiendo.length === 0 ? (
              <p className="text-zinc-500 text-xs italic font-bold text-center py-8">Este Dungeon Master aún no ha liderado ninguna aventura registrada.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
                {perfil.dirigiendo.map(p => (
                  <div key={p.id} className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between items-start gap-2 group hover:border-amber-500/50 transition-colors">
                    <div className="w-full">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">{p.evento_nombre}</p>
                      <p className="text-white font-bold leading-tight line-clamp-2">{p.titulo}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-zinc-900 rounded font-black text-amber-500/80 border border-zinc-800/80 group-hover:bg-amber-900/20 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
                      {p.etiqueta || 'Mesa Rol'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* JUGANDO MESAS */}
        <div className={`bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-[2rem] ${perfil.rol === 'aventurero' ? 'lg:col-span-2 max-w-2xl mx-auto w-full' : ''}`}>
          <h3 className="text-emerald-500 font-black uppercase tracking-widest text-sm md:text-base mb-6 flex items-center gap-3">
            ⚔️ Aventuras Jugadas ({perfil.jugando.length})
          </h3>
          {perfil.jugando.length === 0 ? (
            <p className="text-zinc-500 text-xs italic font-bold text-center py-8">Aún no se ha unido a ninguna aventura.</p>
          ) : (
            <div className={`space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide pr-2 ${perfil.rol === 'aventurero' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 space-y-0' : ''}`}>
              {perfil.jugando.map(p => (
                <div key={p.id} className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between items-start gap-2 hover:border-emerald-500/50 transition-colors group">
                  <div className="w-full">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">{p.evento_nombre}</p>
                    <p className="text-white font-bold leading-tight line-clamp-2">{p.titulo}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-zinc-900 rounded font-black text-emerald-500/80 border border-zinc-800/80 group-hover:bg-emerald-900/20 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                    {p.etiqueta || 'Mesa Rol'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerfilPublico;
