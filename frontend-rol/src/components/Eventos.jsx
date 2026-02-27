import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2'; 
import Partida from './Partida'; 
import CrearMesa from './CrearMesa'; 
import CrearEvento from './CrearEvento'; 
import GestionUsuarios from './GestionUsuarios'; 
import Estadisticas from './Estadisticas';
import { fetchProtegido } from '../utils/api'; 

function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [partidasDelEvento, setPartidasDelEvento] = useState([]);
  const [mostrarFormularioMesa, setMostrarFormularioMesa] = useState(false);
  const [pestanaAdmin, setPestanaAdmin] = useState('eventos');
  
  const [eventoEditando, setEventoEditando] = useState(null);
  
  const carruselEventosRef = useRef(null);
  const carruselPartidasRef = useRef(null); 

  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  const esDungeonMaster = usuarioGuardado && (usuarioGuardado.rol === 'dm' || usuarioGuardado.rol === 'admin');
  const esAdmin = usuarioGuardado && usuarioGuardado.rol === 'admin';

  // ✨ FUNCIÓN CLAVE: Formatear fecha sin usar el objeto Date (Evita desfase horario)
  const formatearFechaManual = (fechaStr) => {
    if (!fechaStr) return "Fecha Desconocida";
    // Si viene formato ISO "2026-02-28T00:00:00.000Z" o "2026-02-28"
    const soloFecha = fechaStr.split('T')[0];
    const [anio, mes, dia] = soloFecha.split('-');
    
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${anio}`;
  };

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
    
    const result = await Swal.fire({
      title: '¿Arrasar con esta jornada?',
      text: "⚠️ Se perderán todos los datos, mesas y aventureros inscritos en este evento.",
      icon: 'warning',
      showCancelButton: true,
      background: '#18181b', 
      color: '#fff',
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#3f3f46', 
      confirmButtonText: 'Sí, destruir evento',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/eventos/${id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          Swal.fire({ title: '¡Evento Borrado!', icon: 'success', background: '#18181b', color: '#fff' });
          if (eventoSeleccionado && eventoSeleccionado.id === id) setEventoSeleccionado(null);
          cargarEventos();
        }
      } catch (err) { 
        if (err === 'Sesión expirada') return;
        console.error(err); 
      }
    }
  };

  const guardarEdicionEvento = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/eventos/${eventoEditando.id}`, {
        method: 'PUT',
        body: JSON.stringify(eventoEditando)
      });

      if (res.ok) {
        Swal.fire({ title: '¡Jornada Reescríta!', icon: 'success', background: '#18181b', color: '#fff' });
        if (eventoSeleccionado && eventoSeleccionado.id === eventoEditando.id) setEventoSeleccionado(eventoEditando);
        setEventoEditando(null); 
        cargarEventos(); 
      }
    } catch (err) {
      if (err === 'Sesión expirada') return;
      console.error(err);
    }
  };

  const abrirEdicion = (evento, e) => {
    e.stopPropagation();
    // Tomamos la fecha directamente como string para el input date
    const fechaLimpia = evento.fecha.split('T')[0];
    setEventoEditando({ ...evento, fecha: fechaLimpia });
  };

  const entrarAlEvento = (evento) => {
    setEventoSeleccionado(evento);
    fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/eventos/${evento.id}/partidas`)
      .then(res => res.json())
      .then(setPartidasDelEvento)
      .catch(err => {
        if (err === 'Sesión expirada') return;
        console.error(err);
      });
  };

  // Ordenamiento seguro tratando la fecha como string para evitar saltos de día
  const eventosProximos = eventos
    .filter(e => e.estado === 'Proximo' || e.estado === 'En Curso')
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
    
  const eventosPasados = eventos
    .filter(e => e.estado === 'Finalizado' || e.estado === 'Suspendido')
    .sort((a, b) => b.fecha.localeCompare(a.fecha)); 

  const formatearHora = (hora) => hora ? hora.substring(0, 5) : '';

  const scrollEventosIzq = () => carruselEventosRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const scrollEventosDer = () => carruselEventosRef.current?.scrollBy({ left: 400, behavior: 'smooth' });
  const scrollPartidasIzq = () => carruselPartidasRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const scrollPartidasDer = () => carruselPartidasRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

  if (eventoSeleccionado) {
    const eventoEsPasado = eventoSeleccionado.estado === 'Finalizado';
    const eventoSuspendido = eventoSeleccionado.estado === 'Suspendido';
    const yaParticipaEnEsteEvento = partidasDelEvento.some(p => 
      p.dungeon_master_id === usuarioGuardado?.id || p.anotadoInicialmente === 1
    );

    return (
      <div className="max-w-6xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
          <button onClick={() => setEventoSeleccionado(null)} className="group flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors font-black text-xs uppercase tracking-widest">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al Tablón
          </button>
          {esAdmin && (
            <button onClick={(e) => abrirEdicion(eventoSeleccionado, e)} className="bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-400 border border-purple-500/30 px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-colors">
              ✏️ Editar Evento
            </button>
          )}
        </div>

        <header className={`bg-zinc-900/50 border ${eventoEsPasado || eventoSuspendido ? 'border-zinc-800 opacity-80' : 'border-zinc-800'} p-8 rounded-3xl backdrop-blur-xl mb-8 relative overflow-hidden max-w-4xl mx-auto`}>
          {eventoEsPasado && <div className="absolute -top-6 -right-10 bg-zinc-800 text-zinc-400 text-xs font-black px-12 py-2 rotate-45 uppercase tracking-widest shadow-lg">FINALIZADO</div>}
          {eventoSuspendido && <div className="absolute -top-6 -right-10 bg-red-500 text-black text-xs font-black px-12 py-2 rotate-45 uppercase tracking-widest shadow-lg">SUSPENDIDO</div>}
          {eventoSeleccionado.estado === 'En Curso' && <div className="absolute -top-6 -right-10 bg-blue-500 text-white text-xs font-black px-12 py-2 rotate-45 uppercase tracking-widest shadow-lg animate-pulse">EN CURSO</div>}
          
          <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">{eventoSeleccionado.nombre}</h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6 italic">"{eventoSeleccionado.descripcion}"</p>
          
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 font-bold w-fit px-4 py-1.5 rounded-full border ${eventoEsPasado || eventoSuspendido ? 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'}`}>
              <span>📅</span> {formatearFechaManual(eventoSeleccionado.fecha)}
            </div>
            {eventoSeleccionado.hora_inicio && (
              <div className={`flex items-center gap-2 font-bold w-fit px-4 py-1.5 rounded-full border ${eventoEsPasado || eventoSuspendido ? 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'}`}>
                <span>⏰</span> {formatearHora(eventoSeleccionado.hora_inicio)} a {formatearHora(eventoSeleccionado.hora_fin)}
              </div>
            )}
          </div>
        </header>

        {esDungeonMaster && !eventoEsPasado && !eventoSuspendido && !yaParticipaEnEsteEvento && (
          <div className="mb-10 max-w-4xl mx-auto">
            <button 
              onClick={() => setMostrarFormularioMesa(!mostrarFormularioMesa)}
              className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 ${mostrarFormularioMesa ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.01]'}`}
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

        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-5">Mesas de la jornada</h3>
        {partidasDelEvento.length > 0 ? (
          <div ref={carruselPartidasRef} className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide">
            {partidasDelEvento.map(p => (
              <div key={p.id} className="w-[90%] md:w-[45%] lg:w-[400px] flex-shrink-0">
                <Partida {...p} eventoEsPasado={eventoEsPasado || eventoSuspendido} esAdmin={esAdmin} esMiMesa={usuarioGuardado?.id === p.dungeon_master_id} />
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

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-in fade-in duration-700 overflow-hidden relative">
      
      {eventoEditando && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-purple-500/30 w-full max-w-lg rounded-[2rem] p-8 relative">
            <button onClick={() => setEventoEditando(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white text-2xl">✕</button>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">✏️ Alterar Evento</h3>
            <form onSubmit={guardarEdicionEvento} className="flex flex-col gap-4">
              <input type="text" value={eventoEditando.nombre} onChange={e => setEventoEditando({...eventoEditando, nombre: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold" />
              <textarea value={eventoEditando.descripcion} onChange={e => setEventoEditando({...eventoEditando, descripcion: e.target.value})} rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white italic resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Fecha</label>
                  <input type="date" value={eventoEditando.fecha} onChange={e => setEventoEditando({...eventoEditando, fecha: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Estado</label>
                  <select value={eventoEditando.estado} onChange={e => setEventoEditando({...eventoEditando, estado: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 px-4 text-white outline-none">
                    <option value="Proximo">Próximo</option>
                    <option value="En Curso">En Curso</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="mt-4 w-full bg-purple-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest">💾 Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {esAdmin && (
        <section className="mb-16 bg-zinc-900 rounded-[2.5rem] border border-purple-500/20 overflow-hidden shadow-2xl">
          <header className="bg-zinc-800/50 p-2 flex gap-2">
            {['eventos', 'usuarios', 'stats'].map(tab => (
              <button key={tab} onClick={() => setPestanaAdmin(tab)} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${pestanaAdmin === tab ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
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

      <section className="mb-20">
        <h2 className="text-4xl font-black text-white tracking-tighter mb-10 flex items-center gap-4 italic uppercase">
          <span className="w-12 h-12 bg-emerald-500 text-black flex items-center justify-center rounded-2xl not-italic">⚔️</span>
          Asociación de Rol La Pampa
        </h2>
        
        {eventosProximos.length > 0 ? (
          <div ref={carruselEventosRef} className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide">
            {eventosProximos.map(evento => (
              <div 
                key={evento.id} 
                onClick={() => entrarAlEvento(evento)}
                className="group relative bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] transition-all cursor-pointer w-[90%] md:w-[45%] flex-shrink-0"
              >
                <h3 className="text-2xl font-black text-white mb-3 group-hover:text-emerald-400 uppercase italic tracking-tight">{evento.nombre}</h3>
                <p className="text-zinc-400 text-sm mb-8 line-clamp-3 italic border-l-2 border-zinc-800 pl-4">"{evento.descripcion}"</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-emerald-500 font-black text-xs bg-emerald-500/10 px-4 py-1.5 rounded-xl border border-emerald-500/20 uppercase">
                    {formatearFechaManual(evento.fecha)}
                  </span>
                  <span className="text-zinc-600 text-[10px] font-black uppercase group-hover:text-emerald-500 transition-all">Entrar →</span>
                </div>
                {esAdmin && (
                  <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => abrirEdicion(evento, e)} className="p-2 bg-zinc-950 text-purple-400 rounded-full border border-purple-500/30">✏️</button>
                    <button onClick={(e) => borrarEvento(evento.id, e)} className="p-2 bg-zinc-950 text-red-500 rounded-full border border-red-500/30">🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-center py-20 text-zinc-600 font-bold italic border-2 border-dashed border-zinc-800 rounded-3xl">No hay eventos convocados...</p>}
      </section>

      <section>
        <h3 className="text-2xl font-black text-zinc-600 uppercase tracking-tighter italic mb-8">Historial de Misiones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventosPasados.map(evento => (
            <div key={evento.id} onClick={() => entrarAlEvento(evento)} className="group bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl transition-all cursor-pointer hover:bg-zinc-900/50">
              <h4 className="text-lg font-black text-zinc-400 mb-2 group-hover:text-zinc-300">{evento.nombre}</h4>
              <span className="text-zinc-500 font-black text-[10px] bg-zinc-800/50 px-3 py-1.5 rounded-lg uppercase">
                {formatearFechaManual(evento.fecha)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Eventos;