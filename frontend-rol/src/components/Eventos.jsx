import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2'; 
import Partida from './Partida'; 
import CrearMesa from './CrearMesa'; 
import { fetchProtegido } from '../utils/api'; 

function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [partidasDelEvento, setPartidasDelEvento] = useState([]);
  const [mostrarFormularioMesa, setMostrarFormularioMesa] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  
  const carruselEventosRef = useRef(null);
  const carruselPartidasRef = useRef(null); 

  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  const esDungeonMaster = usuarioGuardado && (usuarioGuardado.rol === 'dm' || usuarioGuardado.rol === 'admin');
  const esAdmin = usuarioGuardado && usuarioGuardado.rol === 'admin';

  const formatearFechaManual = (fechaStr) => {
    if (!fechaStr) return "Fecha Desconocida";
    const soloFecha = fechaStr.split('T')[0];
    const [anio, mes, dia] = soloFecha.split('-');
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${anio}`;
  };

  const cargarEventos = () => {
    fetch('https://gestor-eventos-rol.onrender.com/api/eventos')
      .then(res => res.json())
      .then(datos => setEventos(datos))
      .catch(err => console.error("Error:", err));
  };

  useEffect(() => { cargarEventos(); }, []);

  const borrarEvento = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: '¿Arrasar con esta jornada?',
      text: "⚠️ Se perderán todos los datos, mesas y aventureros inscritos.",
      icon: 'warning',
      showCancelButton: true,
      background: '#09090b', 
      color: '#fff',
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, destruir evento',
      customClass: { popup: 'border border-zinc-800 rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/eventos/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({ title: '¡Evento Borrado!', icon: 'success', background: '#09090b', color: '#fff', customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' } });
          if (eventoSeleccionado && eventoSeleccionado.id === id) setEventoSeleccionado(null);
          cargarEventos();
        }
      } catch (err) { if (err !== 'Sesión expirada') console.error(err); }
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
        Swal.fire({ title: '¡Jornada Reescrita!', icon: 'success', background: '#09090b', color: '#fff', customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' } });
        if (eventoSeleccionado && eventoSeleccionado.id === eventoEditando.id) setEventoSeleccionado(eventoEditando);
        setEventoEditando(null); 
        cargarEventos(); 
      }
    } catch (err) { if (err !== 'Sesión expirada') console.error(err); }
  };

  const abrirEdicion = (evento, e) => {
    e.stopPropagation();
    const fechaLimpia = evento.fecha.split('T')[0];
    setEventoEditando({ ...evento, fecha: fechaLimpia });
  };

  const entrarAlEvento = (evento) => {
    setEventoSeleccionado(evento);
    fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/eventos/${evento.id}/partidas`)
      .then(res => res.json())
      .then(setPartidasDelEvento)
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  };

  const eventosProximos = eventos.filter(e => e.estado === 'Proximo' || e.estado === 'En Curso').sort((a, b) => a.fecha.localeCompare(b.fecha));
  const eventosPasados = eventos.filter(e => e.estado === 'Finalizado' || e.estado === 'Suspendido').sort((a, b) => b.fecha.localeCompare(a.fecha)); 

  const scrollEventosIzq = () => carruselEventosRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const scrollEventosDer = () => carruselEventosRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

  if (eventoSeleccionado) {
    const yaParticipa = partidasDelEvento.some(p => p.dungeon_master_id === usuarioGuardado?.id || p.anotadoInicialmente === 1);

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => setEventoSeleccionado(null)} className="group flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors font-black text-[10px] uppercase tracking-[0.3em] mb-8">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al Tablón
        </button>

        <header className="relative bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl mb-12 overflow-hidden">
          <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            eventoSeleccionado.estado === 'En Curso' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' : 
            eventoSeleccionado.estado === 'Suspendido' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {eventoSeleccionado.estado}
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">{eventoSeleccionado.nombre}</h2>
          <p className="text-zinc-400 text-lg italic mb-8 border-l-4 border-emerald-500/30 pl-6 max-w-2xl leading-relaxed">"{eventoSeleccionado.descripcion}"</p>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-zinc-950 px-5 py-3 rounded-2xl border border-zinc-800 flex items-center gap-3">
              <span className="text-emerald-500">📅</span>
              <span className="font-bold text-zinc-300 text-sm">{formatearFechaManual(eventoSeleccionado.fecha)}</span>
            </div>
            <div className="bg-zinc-950 px-5 py-3 rounded-2xl border border-zinc-800 flex items-center gap-3">
              <span className="text-emerald-500">⏰</span>
              <span className="font-bold text-zinc-300 text-sm">{eventoSeleccionado.hora_inicio?.substring(0,5)} a {eventoSeleccionado.hora_fin?.substring(0,5)}</span>
            </div>
          </div>
        </header>

        {esDungeonMaster && (eventoSeleccionado.estado !== 'Finalizado' && eventoSeleccionado.estado !== 'Suspendido') && !yaParticipa && (
          <div className="mb-12">
            <button 
              onClick={() => setMostrarFormularioMesa(!mostrarFormularioMesa)}
              className={`w-full py-5 rounded-[2rem] font-black transition-all shadow-xl flex items-center justify-center gap-3 tracking-widest text-xs uppercase ${mostrarFormularioMesa ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' : 'bg-amber-500 text-black hover:scale-[1.01] hover:shadow-amber-500/20'}`}
            >
              {mostrarFormularioMesa ? '✕ Cancelar Convocatoria' : '⚔️ Convocar Nueva Mesa de Rol'}
            </button>
            {mostrarFormularioMesa && (
              <div className="mt-8 p-1 bg-gradient-to-b from-amber-500/20 to-transparent rounded-[2.5rem]">
                <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-3xl">
                  <CrearMesa idEvento={eventoSeleccionado.id} alCrearMesa={() => {setMostrarFormularioMesa(false); entrarAlEvento(eventoSeleccionado);}} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Mesas de la Jornada</h3>
          <div className="flex gap-2">
            <button onClick={() => carruselPartidasRef.current?.scrollBy({left: -350, behavior: 'smooth'})} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors">‹</button>
            <button onClick={() => carruselPartidasRef.current?.scrollBy({left: 350, behavior: 'smooth'})} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors">›</button>
          </div>
        </div>

        {partidasDelEvento.length > 0 ? (
          <div ref={carruselPartidasRef} className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {partidasDelEvento.map(p => (
              <div key={p.id} className="min-w-[300px] md:min-w-[400px] snap-center">
                <Partida {...p} eventoEsPasado={eventoSeleccionado.estado === 'Finalizado' || eventoSeleccionado.estado === 'Suspendido'} esAdmin={esAdmin} esMiMesa={usuarioGuardado?.id === p.dungeon_master_id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
            <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No hay expediciones registradas para este evento</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 animate-in fade-in duration-700">
      
      {eventoEditando && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-zinc-900 border border-purple-500/30 w-full max-w-lg rounded-[2.5rem] p-10 shadow-3xl">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 italic">✏️ Alterar Evento</h3>
            <form onSubmit={guardarEdicionEvento} className="flex flex-col gap-6">
              <input type="text" value={eventoEditando.nombre} onChange={e => setEventoEditando({...eventoEditando, nombre: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white font-bold focus:border-purple-500 outline-none transition-all" />
              <textarea value={eventoEditando.descripcion} onChange={e => setEventoEditando({...eventoEditando, descripcion: e.target.value})} rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white italic resize-none focus:border-purple-500 outline-none transition-all" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={eventoEditando.fecha} onChange={e => setEventoEditando({...eventoEditando, fecha: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white [color-scheme:dark] outline-none" />
                <select value={eventoEditando.estado} onChange={e => setEventoEditando({...eventoEditando, estado: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white font-bold outline-none cursor-pointer">
                  <option value="Proximo">Próximo</option>
                  <option value="En Curso">En Curso</option>
                  <option value="Suspendido">Suspendido</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setEventoEditando(null)} className="flex-1 bg-zinc-800 text-zinc-400 font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest hover:text-white transition-colors">Descartar</button>
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-purple-600/20 transition-all">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="mb-20 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            Tablón de <br /><span className="text-emerald-500 not-italic">Misiones</span>
          </h2>
          <div className="flex gap-3">
             <button onClick={scrollEventosIzq} className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:border-emerald-500/50 text-zinc-500 hover:text-emerald-500 transition-all shadow-xl">‹</button>
             <button onClick={scrollEventosDer} className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:border-emerald-500/50 text-zinc-500 hover:text-emerald-500 transition-all shadow-xl">›</button>
          </div>
        </div>
        
        {eventosProximos.length > 0 ? (
          <div ref={carruselEventosRef} className="flex gap-8 overflow-x-auto pb-10 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {eventosProximos.map(evento => (
              <div 
                key={evento.id} 
                onClick={() => entrarAlEvento(evento)}
                className="group min-w-[300px] md:min-w-[450px] bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 p-10 rounded-[2.5rem] transition-all cursor-pointer snap-center shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full"></div>
                <h3 className="text-3xl font-black text-white mb-4 group-hover:text-emerald-400 uppercase tracking-tighter italic transition-colors leading-tight">{evento.nombre}</h3>
                <p className="text-zinc-500 text-sm mb-10 line-clamp-3 italic leading-relaxed">"{evento.descripcion}"</p>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Próxima Jornada</span>
                    <span className="text-emerald-500 font-black text-sm uppercase tracking-tighter">{formatearFechaManual(evento.fecha)}</span>
                  </div>
                  <span className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-all">→</span>
                </div>
                {esAdmin && (
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={(e) => abrirEdicion(evento, e)} className="w-8 h-8 bg-zinc-950 text-purple-400 rounded-full border border-purple-500/20 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all text-xs">✏️</button>
                    <button onClick={(e) => borrarEvento(evento.id, e)} className="w-8 h-8 bg-zinc-950 text-red-500 rounded-full border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-xs">🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-center py-24 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[3rem] text-zinc-600 font-black uppercase tracking-widest text-xs italic">No hay pergaminos convocados por el momento</p>}
      </section>

      <section className="opacity-60 hover:opacity-100 transition-opacity duration-500">
        <h3 className="text-xl font-black text-zinc-600 uppercase tracking-[0.3em] mb-10 italic">Anales del Pasado</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {eventosPasados.map(evento => (
            <div key={evento.id} onClick={() => entrarAlEvento(evento)} className="group bg-zinc-950 border border-zinc-900 p-6 rounded-[2rem] transition-all cursor-pointer hover:bg-zinc-900 hover:border-zinc-700">
              <h4 className="text-sm font-black text-zinc-500 mb-3 group-hover:text-zinc-300 uppercase italic truncate">{evento.nombre}</h4>
              <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">{formatearFechaManual(evento.fecha)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Eventos;