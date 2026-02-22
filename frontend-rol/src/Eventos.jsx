import { useState, useEffect } from 'react';
import Partida from './Partida'; 
import CrearMesa from './CrearMesa'; 
import CrearEvento from './CrearEvento'; 
import GestionUsuarios from './GestionUsuarios'; 
import Estadisticas from './Estadisticas';

function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [partidasDelEvento, setPartidasDelEvento] = useState([]);
  const [mostrarFormularioMesa, setMostrarFormularioMesa] = useState(false);
  const [pestanaAdmin, setPestanaAdmin] = useState('eventos');

  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  const esDungeonMaster = usuarioGuardado && (usuarioGuardado.rol === 'dm' || usuarioGuardado.rol === 'admin');
  const esAdmin = usuarioGuardado && usuarioGuardado.rol === 'admin';

  const cargarEventos = () => {
    fetch('https://gestor-eventos-rol.onrender.com/api/eventos')
      .then(res => res.json())
      .then(datos => setEventos(datos))
      .catch(err => console.error("Error:", err));
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  const borrarEvento = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ ¿Estás seguro? Se perderán todos los datos de este evento.")) return;
    const token = localStorage.getItem('token');
    await fetch(`https://gestor-eventos-rol.onrender.com/api/eventos/${id}`, {
      method: 'DELETE',
      headers: { 'authorization': token }
    });
    cargarEventos();
  };

  const entrarAlEvento = (evento) => {
    setEventoSeleccionado(evento);
    const token = localStorage.getItem('token'); 
    fetch(`https://gestor-eventos-rol.onrender.com/api/eventos/${evento.id}/partidas`, {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(setPartidasDelEvento);
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const eventosProximos = eventos
    .filter(e => new Date(e.fecha) >= hoy)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const formatearFecha = (f) => new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  // === VISTA DETALLADA DEL EVENTO ===
  if (eventoSeleccionado) {
    const eventoEsPasado = new Date(eventoSeleccionado.fecha) < hoy;

    return (
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setEventoSeleccionado(null)}
          className="mb-8 group flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors font-black text-xs uppercase tracking-widest"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al Tablón
        </button>

        <header className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
          <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">{eventoSeleccionado.nombre}</h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6 italic">"{eventoSeleccionado.descripcion}"</p>
          <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 w-fit px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span>📅</span> {formatearFecha(eventoSeleccionado.fecha)}
          </div>
        </header>

        {esDungeonMaster && !eventoEsPasado && (
          <div className="mb-10">
            <button 
              onClick={() => setMostrarFormularioMesa(!mostrarFormularioMesa)}
              className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 ${
                mostrarFormularioMesa 
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' 
                : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.01] active:scale-95'
              }`}
            >
              {mostrarFormularioMesa ? '✕ CANCELAR CONVOCATORIA' : '⚔️ CONVOCAR NUEVA MESA'}
            </button>
            
            {mostrarFormularioMesa && (
              <div className="mt-6 p-8 bg-zinc-900 border border-amber-500/20 rounded-3xl animate-in zoom-in-95 duration-300 shadow-2xl">
                 <CrearMesa idEvento={eventoSeleccionado.id} alCrearMesa={() => {setMostrarFormularioMesa(false); entrarAlEvento(eventoSeleccionado);}} />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Mesas Disponibles</h3>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        <div className="space-y-6">
          {partidasDelEvento.length > 0 ? (
            partidasDelEvento.map(p => (
              <Partida 
                key={p.id} 
                id={p.id}
                titulo={p.titulo}
                descripcion={p.descripcion}
                sistema={p.sistema}
                cupo={p.cupo}
                requisitos={p.requisitos}
                dmNombre={p.dungeon_master_nombre}
                jugadoresIniciales={p.jugadores_anotados} 
                anotadoInicialmente={p.estoy_anotado === 1}
                eventoEsPasado={eventoEsPasado}
                esAdmin={esAdmin} 
                esMiMesa={usuarioGuardado?.id === p.dungeon_master_id} 
              />
            ))
          ) : (
            <div className="text-center py-20 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl">
              <p className="text-zinc-500 font-bold italic">Aún no hay expediciones planeadas para este evento...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === VISTA PRINCIPAL (EL TABLÓN) ===
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-in fade-in duration-700">
      
      {/* PANEL DE ADMINISTRACIÓN */}
      {esAdmin && (
        <section className="mb-16 bg-zinc-900 rounded-[2.5rem] border border-purple-500/20 overflow-hidden shadow-2xl shadow-purple-500/5">
          <header className="bg-zinc-800/50 p-2 flex gap-2">
            {['eventos', 'usuarios', 'stats'].map(tab => (
              <button 
                key={tab}
                onClick={() => setPestanaAdmin(tab)}
                className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  pestanaAdmin === tab 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                {tab === 'eventos' ? '👑 Gestor Eventos' : tab === 'usuarios' ? '🛡️ Ascensos' : '📊 Estadísticas'}
              </button>
            ))}
          </header>
          <div className="p-8">
            {pestanaAdmin === 'eventos' && <CrearEvento alCrearEvento={cargarEventos} />}
            {pestanaAdmin === 'usuarios' && <GestionUsuarios />}
            {pestanaAdmin === 'stats' && <Estadisticas />}
          </div>
        </section>
      )}

      {/* LISTADO DE EVENTOS PRÓXIMOS */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 italic uppercase">
            <span className="w-12 h-12 bg-emerald-500 text-black flex items-center justify-center rounded-2xl shadow-lg shadow-emerald-500/20 not-italic">⚔️</span>
            Asociación de Rol La Pampa
          </h2>
          <p className="text-zinc-500 font-bold text-xs tracking-widest uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
            Tablón de Misiones
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {eventosProximos.length > 0 ? (
            eventosProximos.map(evento => (
              <div 
                key={evento.id} 
                onClick={() => entrarAlEvento(evento)}
                className="group relative bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 p-8 rounded-[2rem] transition-all duration-300 cursor-pointer shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-2 overflow-hidden"
              >
                {/* Glow efecto hover */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 group-hover:bg-emerald-500/10 blur-3xl rounded-full transition-colors"></div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors uppercase italic tracking-tight">
                    {evento.nombre}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-8 line-clamp-3 leading-relaxed italic border-l-2 border-zinc-800 pl-4">
                    "{evento.descripcion}"
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-emerald-500 font-black text-xs bg-emerald-500/10 px-4 py-1.5 rounded-xl border border-emerald-500/20 uppercase tracking-tighter">
                      {formatearFecha(evento.fecha)}
                    </span>
                    <span className="text-zinc-600 text-[10px] font-black tracking-[0.2em] uppercase group-hover:text-emerald-500 transition-all flex items-center gap-2">
                      Ver Detalles <span className="text-lg">→</span>
                    </span>
                  </div>
                </div>

                {esAdmin && (
                  <button 
                    onClick={(e) => borrarEvento(evento.id, e)}
                    className="absolute top-6 right-6 p-2 bg-zinc-950/50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white border border-red-500/20"
                    title="Borrar Evento"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full text-center py-20 text-zinc-600 font-bold uppercase tracking-widest italic border-2 border-dashed border-zinc-800 rounded-3xl">
              No hay eventos convocados por el momento...
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Eventos;