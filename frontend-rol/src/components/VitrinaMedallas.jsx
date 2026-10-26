import { useState, useEffect } from 'react';
import { fetchProtegido } from '../utils/api';

function VitrinaMedallas({ usuarioId, datosIniciales, compacta = false }) {
  const [logros, setLogros] = useState(datosIniciales || null);
  const [cargando, setCargando] = useState(!datosIniciales);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [medallaSeleccionada, setMedallaSeleccionada] = useState(null);

  useEffect(() => {
    if (datosIniciales) {
      setLogros(datosIniciales);
      setCargando(false);
      return;
    }

    if (usuarioId) {
      setCargando(true);
      fetchProtegido(`/api/usuarios/${usuarioId}/logros`)
        .then(res => {
          if (!res.ok) throw new Error('Error al cargar logros');
          return res.json();
        })
        .then(data => {
          setLogros(data);
          setCargando(false);
        })
        .catch(err => {
          console.error('Error cargando medallas:', err);
          setCargando(false);
        });
    }
  }, [usuarioId, datosIniciales]);

  if (cargando) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-xs font-bold animate-pulse">Inspeccionando pergaminos y medallas...</p>
      </div>
    );
  }

  if (!logros || !logros.medallas) {
    return null;
  }

  const { resumen, medallas, estadisticas } = logros;

  const categorias = [
    { id: 'todas', label: 'Todas', icono: '🏅' },
    { id: 'Aventurero', label: 'Aventurero', icono: '🗡️' },
    { id: 'Director de Juego', label: 'Director de Juego', icono: '📜' },
    { id: 'Exploración', label: 'Exploración', icono: '🧭' },
    { id: 'Honor', label: 'Honor', icono: '✨' },
    { id: 'Compromiso', label: 'Compromiso', icono: '⚖️' },
    { id: 'Linaje', label: 'Linaje', icono: '🏛️' }
  ];

  const medallasFiltradas = medallas.filter(m => {
    if (filtroCategoria === 'todas') return true;
    return m.categoria === filtroCategoria;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 👑 BARRA DE RESUMEN Y PROGRESO GENERAL */}
      <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-amber-500/20 shadow-xl relative overflow-hidden">
        
        {/* Adorno visual de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          {/* Título y porcentaje */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.15)] shrink-0">
              🏅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                  Vitrina de Medallas y Logros
                </h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase">
                  {resumen.desbloqueadas} / {resumen.total}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Reconocimientos retroactivos forjados en las crónicas del Gremio.
              </p>
            </div>
          </div>

          {/* Barra de progreso visual */}
          <div className="w-full md:w-64 space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-400 text-[11px] uppercase tracking-wider">Hazañas Desbloqueadas</span>
              <span className="text-amber-400 font-black">{resumen.porcentaje}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${resumen.porcentaje}%` }}
              />
            </div>
          </div>

        </div>

        {/* 📊 CHIPS DE ESTADÍSTICAS HISTÓRICAS */}
        {estadisticas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-zinc-800/80">
            <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Mesas Jugadas</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">⚔️ {estadisticas.mesas_jugadas}</span>
            </div>
            <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Mesas Dirigidas</span>
              <span className="text-sm sm:text-base font-black text-amber-400">📜 {estadisticas.mesas_dirigidas}</span>
            </div>
            <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Sistemas de Rol</span>
              <span className="text-sm sm:text-base font-black text-indigo-400">🎲 {estadisticas.sistemas_probados}</span>
            </div>
            <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Telegram</span>
              <span className="text-sm sm:text-base font-black text-purple-400">
                {estadisticas.telegram_vinculado ? '✈️ Vinculado' : '⏳ Pendiente'}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* 🧭 SELECTOR DE CATEGORÍAS */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFiltroCategoria(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              filtroCategoria === cat.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-zinc-800'
            }`}
          >
            <span>{cat.icono}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 🏅 GRILLA DE MEDALLAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {medallasFiltradas.map(m => {
          const estaDesbloqueada = m.desbloqueada;
          const pct = Math.min(100, Math.round((m.progresoActual / m.meta) * 100));

          return (
            <div
              key={m.id}
              onClick={() => setMedallaSeleccionada(m)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                estaDesbloqueada
                  ? 'bg-zinc-900/90 border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-950/20 hover:scale-[1.01]'
                  : 'bg-zinc-950/40 border-zinc-800/80 opacity-60 hover:opacity-85'
              }`}
            >
              
              {/* Resplandor suave para medallas desbloqueadas */}
              {estaDesbloqueada && (
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
              )}

              <div>
                
                {/* Encabezado de la Medalla */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 ${
                      estaDesbloqueada
                        ? 'bg-amber-500/15 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-900 border border-zinc-800 grayscale'
                    }`}>
                      {m.icono}
                    </div>
                    <div>
                      <h4 className={`font-black text-sm leading-tight ${estaDesbloqueada ? 'text-white' : 'text-zinc-400'}`}>
                        {m.titulo}
                      </h4>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        {m.categoria}
                      </span>
                    </div>
                  </div>

                  {/* Estado / Candado */}
                  <div>
                    {estaDesbloqueada ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                        ✓ Logrado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                        🔒 Bloqueado
                      </span>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {m.descripcion}
                </p>

              </div>

              {/* Barra de Progreso Inferior */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                  <span className="text-zinc-500 uppercase tracking-wider">
                    {estaDesbloqueada ? 'Requisito Cumplido' : 'Progreso'}
                  </span>
                  <span className={estaDesbloqueada ? 'text-amber-400 font-black' : 'text-zinc-400'}>
                    {m.progresoActual} / {m.meta}
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      estaDesbloqueada
                        ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                        : 'bg-zinc-700'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* 🔍 MODAL DETALLE DE MEDALLA (AL HACER CLIC) */}
      {medallaSeleccionada && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center">
            
            <button
              onClick={() => setMedallaSeleccionada(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 w-8 h-8 rounded-full flex items-center justify-center transition border border-zinc-700"
            >
              ✕
            </button>

            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl mb-4 ${
              medallaSeleccionada.desbloqueada
                ? 'bg-amber-500/20 border-2 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-800 border-2 border-zinc-700 grayscale'
            }`}>
              {medallaSeleccionada.icono}
            </div>

            <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block mb-1">
              {medallaSeleccionada.categoria}
            </span>
            <h3 className="text-xl font-black text-white mb-2">
              {medallaSeleccionada.titulo}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto mb-5">
              {medallaSeleccionada.descripcion}
            </p>

            <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 max-w-xs mx-auto mb-5 text-left">
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-zinc-400">Progreso actual:</span>
                <span className="text-amber-400 font-black">
                  {medallaSeleccionada.progresoActual} / {medallaSeleccionada.meta}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    medallaSeleccionada.desbloqueada ? 'bg-amber-400' : 'bg-zinc-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((medallaSeleccionada.progresoActual / medallaSeleccionada.meta) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              {medallaSeleccionada.desbloqueada ? (
                <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-black uppercase">
                  ✨ Logro Conseguido
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-xl text-xs font-bold uppercase">
                  🔒 En Progreso
                </span>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default VitrinaMedallas;
