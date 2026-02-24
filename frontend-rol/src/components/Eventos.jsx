import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2'; // ✨ IMPORTAMOS SWEETALERT
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
  
  const carruselEventosRef = useRef(null);
  const carruselPartidasRef = useRef(null); 

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

  // ✨ MAGIA DE SWEETALERT EN LA ELIMINACIÓN
  const borrarEvento = async (id, e) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: '¿Arrasar con esta jornada?',
      text: "⚠️ Se perderán todos los datos, mesas y aventureros inscritos en este evento. Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      background: '#18181b', // zinc-900
      color: '#fff',
      confirmButtonColor: '#ef4444', // red-500
      cancelButtonColor: '#3f3f46', // zinc-700
      confirmButtonText: 'Sí, destruir evento',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`https://gestor-eventos-rol.onrender.com/api/eventos/${id}`, {
          method: 'DELETE',
          headers: { 'authorization': token }
        });

        if (res.ok) {
          Swal.fire({
            title: '¡Evento Borrado!',
            text: 'Los pergaminos han sido reducidos a cenizas.',
            icon: 'success',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#10b981' // emerald-500
          });
          
          // Si el admin borra el evento que estaba viendo en detalle, lo devolvemos al tablón
          if (eventoSeleccionado && eventoSeleccionado.id === id) {
            setEventoSeleccionado(null);
          }
          cargarEventos();
        } else {
          Swal.fire({
            title: 'Error',
            text: 'La magia defensiva del evento impidió su borrado.',
            icon: 'error',
            background: '#18181b',
            color: '#fff'
          });
        }
      } catch (err) { console.error(err); }
    }
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
    
  const eventosPasados = eventos
    .filter(e => new Date(e.fecha) < hoy)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); 

  const formatearFecha = (f) => new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  const scrollEventosIzq = () => carruselEventosRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const scrollEventosDer = () => carruselEventosRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

  const scrollPartidasIzq = () => carruselPartidasRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const scrollPartidasDer = () => carruselPartidasRef.current?.scrollBy({ left: 400, behavior: 'smooth' });


  // === VISTA DETALLADA DEL EVENTO ===
  if (eventoSeleccionado) {
    const eventoEsPasado = new Date(eventoSeleccionado.fecha) < hoy;
    
    // ✨ LÓGICA ACTUALIZADA: Verifica si es DM o si ya está anotado como jugador
    const yaParticipaEnEsteEvento = partidasDelEvento.some(p => 
      p.dungeon_master_id === usuarioGuardado?.id || p.anotadoInicialmente === 1
    );

    return (
      <div className="max-w-6xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        <button 
          onClick={() => setEventoSeleccionado(null)}
          className="mb-8 group flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors font-black text-xs uppercase tracking-widest"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al Tablón
        </button>

        <header className={`bg-zinc-900/50 border ${eventoEsPasado ? 'border-zinc-800 opacity-80' : 'border-zinc-800'} p-8 rounded-3xl backdrop-blur-xl mb-8 relative overflow-hidden max-w-4xl mx-auto`}>
          {eventoEsPasado && (
             <div className="absolute -top-6 -right-10 bg-zinc-800 text-zinc-400 text-xs font-black px-12 py-2 rotate-45 uppercase tracking-widest shadow-lg">
               FINALIZADO
             </div>
          )}
          <div className={`absolute top-0 right-0 w-32 h-32 ${eventoEsPasado ? 'bg-zinc-500/5' : 'bg-emerald-500/5'} blur-3xl rounded-full`}></div>
          <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">{eventoSeleccionado.nombre}</h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6 italic">"{eventoSeleccionado.descripcion}"</p>
          <div className={`flex items-center gap-2 font-bold w-fit px-4 py-1.5 rounded-full border shadow-[0_0_15px_rgba(16,185,129,0.1)] ${eventoEsPasado ? 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'}`}>
            <span>📅</span> {formatearFecha(eventoSeleccionado.fecha)}
          </div>
        </header>

        {/* ✨ AQUÍ APLICAMOS LA RESTRICCIÓN VISUAL */}
        {esDungeonMaster && !eventoEsPasado && !yaParticipaEnEsteEvento && (
          <div className="mb-10 max-w-4xl mx-auto">
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

        {/* CONTROLES Y TÍTULO DEL CARRUSEL DE PARTIDAS */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Mesas de la jornada</h3>
          </div>
          {partidasDelEvento.length > 1 && (
            <div className="flex gap-2">
              <button onClick={scrollPartidasIzq} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-colors">
                ←
              </button>
              <button onClick={scrollPartidasDer} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-colors">
                →
              </button>
            </div>
          )}
        </div>

        {/* CARRUSEL DE PARTIDAS */}
        {partidasDelEvento.length > 0 ? (
          <div 
            ref={carruselPartidasRef}
            className="flex gap-6 overflow-x-auto pb-10 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {partidasDelEvento.map(p => (
              <div key={p.id} className="w-[90%] md:w-[45%] lg:w-[400px] flex-shrink-0 snap-center">
                <Partida 
                  {...p} 
                  eventoEsPasado={eventoEsPasado}
                  esAdmin={esAdmin} 
                  esMiMesa={usuarioGuardado?.id === p.dungeon_master_id} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl max-w-4xl mx-auto">
            <p className="text-zinc-500 font-bold italic">No hubo expediciones en este evento.</p>
          </div>
        )}
      </div>
    );
  }

  // === VISTA PRINCIPAL (EL TABLÓN) ===
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-in fade-in duration-700 overflow-hidden">
      
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

      {/* EVENTOS PRÓXIMOS (CARRUSEL) */}
      <section className="mb-20 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 italic uppercase">
            <span className="w-12 h-12 bg-emerald-500 text-black flex items-center justify-center rounded-2xl shadow-lg shadow-emerald-500/20 not-italic">⚔️</span>
            Asociación de Rol La Pampa
          </h2>
          
          <div className="flex items-center gap-3">
             <p className="text-zinc-500 font-bold text-xs tracking-widest uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 hidden md:block">
               Tablón de Misiones
             </p>
             {eventosProximos.length > 2 && (
               <div className="flex gap-2">
                 <button onClick={scrollEventosIzq} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-colors">
                   ←
                 </button>
                 <button onClick={scrollEventosDer} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-colors">
                   →
                 </button>
               </div>
             )}
          </div>
        </div>
        
        {eventosProximos.length > 0 ? (
          <div 
            ref={carruselEventosRef} 
            className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {eventosProximos.map(evento => (
              <div 
                key={evento.id} 
                onClick={() => entrarAlEvento(evento)}
                className="group relative bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 p-8 rounded-[2rem] transition-all duration-300 cursor-pointer shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-2 overflow-hidden flex-shrink-0 w-[90%] md:w-[45%] snap-center"
              >
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 group-hover:bg-emerald-500/10 blur-3xl rounded-full transition-colors"></div>

                <div className="relative z-10 h-full flex flex-col">
                  <h3 className="text-2xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors uppercase italic tracking-tight line-clamp-2">
                    {evento.nombre}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-8 line-clamp-3 leading-relaxed italic border-l-2 border-zinc-800 pl-4 flex-grow">
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
            ))}
          </div>
        ) : (
          <p className="text-center py-20 text-zinc-600 font-bold uppercase tracking-widest italic border-2 border-dashed border-zinc-800 rounded-3xl">
            No hay eventos convocados por el momento...
          </p>
        )}
      </section>

      {/* EVENTOS PASADOS (HISTORIAL) */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl font-black text-zinc-600 uppercase tracking-tighter italic">Historial de Misiones</h3>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-70 hover:opacity-100 transition-opacity duration-300">
          {eventosPasados.length > 0 ? (
            eventosPasados.map(evento => (
              <div 
                key={evento.id} 
                onClick={() => entrarAlEvento(evento)}
                className="group relative bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl transition-all duration-300 cursor-pointer hover:bg-zinc-900/50"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <h4 className="text-lg font-black text-zinc-400 mb-2 uppercase italic tracking-tight line-clamp-1 group-hover:text-zinc-300">
                    {evento.nombre}
                  </h4>
                  <p className="text-zinc-600 text-xs mb-4 line-clamp-2 italic">
                    {evento.descripcion}
                  </p>
                  <div className="mt-auto">
                    <span className="text-zinc-500 font-black text-[10px] bg-zinc-800/50 px-3 py-1 rounded-lg uppercase tracking-tighter">
                      {formatearFecha(evento.fecha)}
                    </span>
                  </div>
                </div>
                
                {esAdmin && (
                  <button 
                    onClick={(e) => borrarEvento(evento.id, e)}
                    className="absolute top-4 right-4 p-1 text-zinc-700 hover:text-red-500 transition-colors"
                    title="Borrar Evento del Historial"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-zinc-700 font-bold uppercase tracking-widest text-xs italic">
              Aún no hay registros en los anales del gremio.
            </p>
          )}
        </div>
      </section>

    </div>
  );
}

export default Eventos;