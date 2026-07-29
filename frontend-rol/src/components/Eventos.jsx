import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2'; 
import Partida from './Partida'; 
import CrearMesa from './CrearMesa'; 
import CrearMesaJuego from './CrearMesaJuego'; // ✨ IMPORTAMOS EL NUEVO FORMULARIO
import FormularioEscape from './FormularioEscape'; 
import TarjetaEscape from './TarjetaEscape'; 
import { fetchProtegido } from '../utils/api'; 
import { io } from 'socket.io-client';

function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [partidasDelEvento, setPartidasDelEvento] = useState([]);
  const [eventoEditando, setEventoEditando] = useState(null);
  
  const [vistaActiva, setVistaActiva] = useState('rol'); 
  const [escapesDelEvento, setEscapesDelEvento] = useState([]);
  
  const [mostrarFormularioMesa, setMostrarFormularioMesa] = useState(false);
  const [mostrarFormularioEscape, setMostrarFormularioEscape] = useState(false);
  const [mostrarFormularioJuegoMesa, setMostrarFormularioJuegoMesa] = useState(false); // ✨ NUEVO ESTADO
  
  const carruselEventosRef = useRef(null);
  const carruselPartidasRef = useRef(null); 
  const carruselJuegosRef = useRef(null); // ✨ REF PARA EL CARRUSEL DE JUEGOS
  const carruselEscapesRef = useRef(null); // ✨ REF PARA EL CARRUSEL DE ESCAPES

  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  // Los DMs y Admins pueden crear mesas de rol.
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
    fetch('/api/eventos')
      .then(res => res.json())
      .then(datos => setEventos(Array.isArray(datos) ? datos : []))
      .catch(err => console.error("Error:", err));
  };

  const cargarMesasDelEvento = (idEvento) => {
    fetchProtegido(`/api/eventos/${idEvento}/partidas`)
      .then(res => res.json())
      .then(datos => setPartidasDelEvento(Array.isArray(datos) ? datos : []))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  };
  

  const cargarEscapesDelEvento = (idEvento) => {
    fetchProtegido(`/api/escapes/${idEvento}`)
      .then(res => res.json())
      .then(data => setEscapesDelEvento(Array.isArray(data) ? data : []))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  };

  useEffect(() => { 
    cargarEventos(); 

    const socket = io('/', {
      path: '/api/socket.io',
      transports: ['websocket'], 
      reconnectionAttempts: 5
    });

    socket.on('actualizacion-eventos', () => {
      cargarEventos();
    });

    // ✨ actualizacion-mesas ahora maneja tanto Rol como Juegos de Mesa!
    socket.on('actualizacion-mesas', (data) => {
      setEventoSeleccionado(estadoPrevio => {
        if (estadoPrevio && estadoPrevio.id === data.eventoId) {
          cargarMesasDelEvento(data.eventoId);
        }
        return estadoPrevio; 
      });
    });

    socket.on('actualizacion-escapes', (data) => {
      setEventoSeleccionado(estadoPrevio => {
        if (estadoPrevio && estadoPrevio.id === data.eventoId) {
          cargarEscapesDelEvento(data.eventoId);
        }
        return estadoPrevio;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ✨ AUTO-PLAY PARA LOS CARRUSELES (EVITA QUE LA PÁGINA QUEDE ESTÁTICA)
  useEffect(() => {
    let intervalo;
    
    const autoScroll = (ref) => {
      if (ref.current) {
        const container = ref.current;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        
        if (container.scrollLeft >= maxScrollLeft - 5) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: 350, behavior: 'smooth' });
        }
      }
    };

    if (eventoSeleccionado) {
      if (vistaActiva === 'rol') {
        intervalo = setInterval(() => autoScroll(carruselPartidasRef), 4000);
      } else if (vistaActiva === 'juegos') {
        intervalo = setInterval(() => autoScroll(carruselJuegosRef), 4000);
      } else if (vistaActiva === 'escape') {
        intervalo = setInterval(() => autoScroll(carruselEscapesRef), 4000);
      }
    } else {
      intervalo = setInterval(() => autoScroll(carruselEventosRef), 5000);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [eventoSeleccionado, vistaActiva, partidasDelEvento, escapesDelEvento, eventos]);

  const borrarEvento = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: '¿Arrasar con esta jornada?',
      text: "⚠️ Se perderán todos los datos, mesas y aventureros inscritos.",
      icon: 'warning',
      showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444', cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, destruir evento',
      customClass: { popup: 'border border-zinc-800 rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/eventos/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({ title: '¡Evento Borrado!', icon: 'success', background: '#09090b', color: '#fff', customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' } });
          if (eventoSeleccionado && eventoSeleccionado.id === id) setEventoSeleccionado(null);
        }
      } catch (err) { if (err !== 'Sesión expirada') console.error(err); }
    }
  };

  const guardarEdicionEvento = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchProtegido(`/api/eventos/${eventoEditando.id}`, {
        method: 'PUT',
        body: JSON.stringify(eventoEditando)
      });
      if (res.ok) {
        Swal.fire({ title: '¡Jornada Reescrita!', icon: 'success', background: '#09090b', color: '#fff', customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' } });
        if (eventoSeleccionado && eventoSeleccionado.id === eventoEditando.id) setEventoSeleccionado(eventoEditando);
        setEventoEditando(null); 
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
    setVistaActiva('rol'); 
    setMostrarFormularioMesa(false);
    setMostrarFormularioEscape(false);
    setMostrarFormularioJuegoMesa(false);
    cargarMesasDelEvento(evento.id);
    cargarEscapesDelEvento(evento.id); 
  };

  const enviarConvocatoriaDMs = async (evento, e) => {
    if (e) e.stopPropagation();
    
    const result = await Swal.fire({
      title: '¿Llamar a los Dungeon Masters?',
      text: `Se enviará un mensaje oficial al canal de Telegram pidiendo Masters para "${evento.nombre}".`,
      icon: 'question',
      showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#10b981', cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, enviar cuervos',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'border border-zinc-800 rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/eventos/${evento.id}/convocatoria`, { method: 'POST' });
        const data = await res.json();
        
        if (res.ok) {
          Swal.fire({ 
            title: '¡Cuervos Enviados!', 
            text: 'El llamado ha resonado en Telegram.',
            icon: 'success', 
            background: '#09090b', 
            color: '#fff', 
            customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' } 
          });
        } else {
          Swal.fire({ title: 'Aviso', text: data.error, icon: 'error', background: '#09090b', color: '#fff' });
        }
      } catch (err) {
        if (err !== 'Sesión expirada') console.error(err);
      }
    }
  };

  const eventosProximos = eventos.filter(e => e.estado === 'Proximo' || e.estado === 'En Curso').sort((a, b) => a.fecha.localeCompare(b.fecha));
  const eventosPasados = eventos.filter(e => e.estado === 'Finalizado' || e.estado === 'Suspendido').sort((a, b) => b.fecha.localeCompare(a.fecha)); 

  const scrollEventosIzq = () => carruselEventosRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  const scrollEventosDer = () => carruselEventosRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

  if (eventoSeleccionado) {
    // Si ya está en alguna mesa de Rol o Juegos de Mesa como creador o jugador
    const yaParticipa = partidasDelEvento.some(p => p.dungeon_master_id === usuarioGuardado?.id || p.anotadoInicialmente === 1);
    
    const tzOffset = -3 * 60 * 60 * 1000;
    const hoyArg = new Date(Date.now() + tzOffset).toISOString().split('T')[0];
    const fechaEventoStr = eventoSeleccionado.fecha.split('T')[0];
    const convocatoriaCerrada = hoyArg >= fechaEventoStr;

    let inscripcionesCerradas = false;
    if (eventoSeleccionado.fecha && eventoSeleccionado.hora_inicio) {
      const [anio, mes, dia] = eventoSeleccionado.fecha.split('T')[0].split('-');
      const [hora, minuto] = eventoSeleccionado.hora_inicio.split(':');
      
      const fechaHoraEvento = new Date(anio, mes - 1, dia, hora, minuto);
      const limiteInscripcion = new Date(fechaHoraEvento.getTime() - (60 * 60 * 1000));
      const ahora = new Date();
      
      inscripcionesCerradas = ahora >= limiteInscripcion;
    }

     // ✨ Separar las partidas de Rol y las de Juegos de Mesa usando los nombres REALES de la base de datos
    const mesasRol = partidasDelEvento.filter(p => p.etiqueta !== 'Juegos de Mesa');
    const juegosMesa = partidasDelEvento.filter(p => p.etiqueta === 'Juegos de Mesa');
    // Ordenar para mostrar primero las que tienen lugar
    const mesasOrdenadas = [...mesasRol].sort((a, b) => {
      const aLlena = (a.jugadoresIniciales || 0) >= (a.cupo || 0);
      const bLlena = (b.jugadoresIniciales || 0) >= (b.cupo || 0);
      if (aLlena === bLlena) return 0;
      return aLlena ? 1 : -1;
    });
    const juegosOrdenados = [...juegosMesa].sort((a, b) => {
      const aLlena = (a.jugadoresIniciales || 0) >= (a.cupo || 0);
      const bLlena = (b.jugadoresIniciales || 0) >= (b.cupo || 0);
      if (aLlena === bLlena) return 0;
      return aLlena ? 1 : -1;
    });

    return (
      <div className="min-h-screen bg-black font-sans pb-32 overflow-x-hidden">
        <main className="pt-24 md:pt-32 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
          
          <button 
            onClick={() => setEventoSeleccionado(null)}
            className="mb-8 text-zinc-500 hover:text-white font-black tracking-widest text-xs uppercase transition-colors flex items-center gap-2 group"
          >
            <span className="bg-zinc-900 border border-zinc-800 p-2 rounded-full group-hover:bg-zinc-800 transition-colors">←</span> 
            Volver a la Agenda
          </button>

          <div className="mb-12 border-b border-zinc-900 pb-8">
            <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl">
              {eventoSeleccionado.nombre}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm font-bold uppercase tracking-widest text-zinc-400">
              <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-sm">🗓️ {formatearFechaManual(eventoSeleccionado.fecha)}</span>
              {eventoSeleccionado.hora_inicio && <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-sm">⏰ {eventoSeleccionado.hora_inicio} a {eventoSeleccionado.hora_fin}</span>}
              {eventoSeleccionado.lugar && <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-sm">📍 {eventoSeleccionado.lugar}</span>}
            </div>
          </div>

          {/* MENÚ DE PESTAÑAS */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide snap-x">
            <button 
              onClick={() => setVistaActiva('rol')}
              className={`snap-start whitespace-nowrap flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 border ${
                vistaActiva === 'rol' 
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              🎲 Mesas de Rol ({mesasRol.length})
            </button>
            <button 
              onClick={() => setVistaActiva('juegos')}
              className={`snap-start whitespace-nowrap flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 border ${
                vistaActiva === 'juegos' 
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              🃏 Juegos de Mesa ({juegosMesa.length})
            </button>
            <button 
              onClick={() => setVistaActiva('escape')}
              className={`snap-start whitespace-nowrap flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 border ${
                vistaActiva === 'escape' 
                  ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              🔐 Escape Rooms ({escapesDelEvento.length})
            </button>
          </div>

          {/* ========================================= */}
          {/* 🎲 VISTA: MESAS DE ROL                    */}
          {/* ========================================= */}
          {vistaActiva === 'rol' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {esDungeonMaster && (eventoSeleccionado.estado !== 'Finalizado' && eventoSeleccionado.estado !== 'Suspendido') && !yaParticipa && (
                <div className="mb-12">
                  {!convocatoriaCerrada ? (
                    <>
                      <div className="flex justify-center w-full">
                        <button 
                          onClick={() => setMostrarFormularioMesa(!mostrarFormularioMesa)}
                          className={`w-full max-w-md py-5 rounded-full font-black transition-all duration-300 flex items-center justify-center gap-3 tracking-widest text-xs md:text-sm uppercase transform hover:-translate-y-1 ${
                            mostrarFormularioMesa 
                              ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white hover:bg-red-500/20 hover:border-red-500/50' 
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40'
                          }`}
                        >
                          {mostrarFormularioMesa ? '✕ Cancelar Convocatoria' : '⚔️ Convocar Nueva Mesa'}
                        </button>
                      </div>

                      {mostrarFormularioMesa && (
                        <div className="mt-8 p-1 bg-gradient-to-b from-amber-500/20 to-transparent rounded-[2.5rem]">
                          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-3xl">
                            <CrearMesa idEvento={eventoSeleccionado.id} alCrearMesa={() => {setMostrarFormularioMesa(false);}} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-3xl mb-3">🛡️</span>
                      <h4 className="text-amber-500 font-black uppercase tracking-widest text-sm mb-2">Convocatoria Cerrada</h4>
                      <p className="text-zinc-400 text-sm italic max-w-lg">Ya nos encontramos en la fecha del evento. La organización está finalizando los preparativos logísticos y no es posible registrar nuevas mesas.</p>
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

              {mesasOrdenadas.length > 0 ? (
                <div ref={carruselPartidasRef} className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:overflow-x-auto pb-6 sm:pb-12 scrollbar-hide sm:snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {mesasOrdenadas.map(p => (
                    <div key={p.id} className="w-full sm:w-[350px] lg:w-[calc(33.333%-1rem)] flex-none sm:snap-start min-w-0">
                      <Partida 
                        {...p} 
                        eventoEsPasado={eventoSeleccionado.estado === 'Finalizado' || eventoSeleccionado.estado === 'Suspendido'} 
                        esAdmin={esAdmin} 
                        esMiMesa={usuarioGuardado?.id === p.dungeon_master_id} 
                        inscripcionesCerradas={inscripcionesCerradas} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                  <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No hay expediciones registradas para este evento</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================= */}
          {/* 🔐 VISTA: ESCAPE ROOMS                    */}
          {/* ========================================= */}
          {vistaActiva === 'escape' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {esDungeonMaster && (eventoSeleccionado.estado !== 'Finalizado' && eventoSeleccionado.estado !== 'Suspendido') && (
                <div className="mb-12">
                  {!convocatoriaCerrada ? (
                    <>
                      <div className="flex justify-center w-full">
                        <button 
                          onClick={() => setMostrarFormularioEscape(!mostrarFormularioEscape)}
                          className={`w-full max-w-md py-5 rounded-full font-black transition-all duration-300 flex items-center justify-center gap-3 tracking-widest text-xs md:text-sm uppercase transform hover:-translate-y-1 ${
                            mostrarFormularioEscape 
                              ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white hover:bg-red-500/20 hover:border-red-500/50' 
                              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
                          }`}
                        >
                          {mostrarFormularioEscape ? '✕ Cancelar Instalación' : '🔐 Habilitar Nueva Sala'}
                        </button>
                      </div>

                      {mostrarFormularioEscape && (
                        <FormularioEscape 
                          eventoId={eventoSeleccionado.id} 
                          onClose={() => setMostrarFormularioEscape(false)} 
                          onSuccess={() => cargarEscapesDelEvento(eventoSeleccionado.id)} 
                        />
                      )}
                    </>
                  ) : (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-3xl mb-3">⏳</span>
                      <h4 className="text-indigo-400 font-black uppercase tracking-widest text-sm mb-2">Convocatoria Cerrada</h4>
                      <p className="text-zinc-400 text-sm italic max-w-lg">La jornada ya comenzó y los espacios físicos están asignados. No se pueden armar nuevas salas.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Salas Disponibles</h3>
                <div className="flex gap-2">
                  <button onClick={() => carruselEscapesRef.current?.scrollBy({left: -350, behavior: 'smooth'})} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors">‹</button>
                  <button onClick={() => carruselEscapesRef.current?.scrollBy({left: 350, behavior: 'smooth'})} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors">›</button>
                </div>
              </div>

              {escapesDelEvento.length > 0 ? (
                <div ref={carruselEscapesRef} className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:overflow-x-auto pb-6 sm:pb-12 scrollbar-hide sm:snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {escapesDelEvento.map(sala => (
                    <div key={sala.id} className="w-full sm:w-[350px] lg:w-[calc(33.333%-1rem)] flex-none sm:snap-start min-w-0">
                      <TarjetaEscape 
                        sala={sala} 
                        usuarioGuardado={usuarioGuardado} 
                        esAdmin={esAdmin} 
                        inscripcionesCerradas={inscripcionesCerradas}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                  <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No hay salas de escape en construcción para esta jornada</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================= */}
          {/* 🃏 VISTA: JUEGOS DE MESA                  */}
          {/* ========================================= */}
          {vistaActiva === 'juegos' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Cualquier usuario logueado (incluido 'aventurero') puede convocar si no participa en otra cosa */}
              {usuarioGuardado && (eventoSeleccionado.estado !== 'Finalizado' && eventoSeleccionado.estado !== 'Suspendido') && !yaParticipa && (
                <div className="mb-12">
                  {!convocatoriaCerrada ? (
                    <>
                      <div className="flex justify-center w-full">
                        <button 
                          onClick={() => setMostrarFormularioJuegoMesa(!mostrarFormularioJuegoMesa)}
                          className={`w-full max-w-md py-5 rounded-full font-black transition-all duration-300 flex items-center justify-center gap-3 tracking-widest text-xs md:text-sm uppercase transform hover:-translate-y-1 ${
                            mostrarFormularioJuegoMesa 
                              ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white hover:bg-red-500/20 hover:border-red-500/50' 
                              : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40'
                          }`}
                        >
                          {mostrarFormularioJuegoMesa ? '✕ Cancelar Convocatoria' : '🃏 Convocar Juego de Mesa'}
                        </button>
                      </div>

                      {mostrarFormularioJuegoMesa && (
                        <div className="mt-8 p-1 bg-gradient-to-b from-rose-500/20 to-transparent rounded-[2.5rem]">
                          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-3xl">
                            <CrearMesaJuego idEvento={eventoSeleccionado.id} alCrearMesa={() => {setMostrarFormularioJuegoMesa(false);}} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-3xl mb-3">🃏</span>
                      <h4 className="text-rose-500 font-black uppercase tracking-widest text-sm mb-2">Convocatoria Cerrada</h4>
                      <p className="text-zinc-400 text-sm italic max-w-lg">Ya nos encontramos en la fecha del evento. La organización está finalizando los preparativos logísticos y no es posible registrar nuevas mesas.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Juegos de la Jornada</h3>
                <div className="flex gap-2">
                  <button onClick={() => carruselJuegosRef.current?.scrollBy({left: -350, behavior: 'smooth'})} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors">‹</button>
                  <button onClick={() => carruselJuegosRef.current?.scrollBy({left: 350, behavior: 'smooth'})} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors">›</button>
                </div>
              </div>

              {juegosOrdenados.length > 0 ? (
                <div ref={carruselJuegosRef} className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:overflow-x-auto pb-6 sm:pb-12 scrollbar-hide sm:snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {juegosOrdenados.map(p => (
                    <div key={p.id} className="w-full sm:w-[350px] lg:w-[calc(33.333%-1rem)] flex-none sm:snap-start min-w-0">
                      <Partida 
                        {...p} 
                        eventoEsPasado={eventoSeleccionado.estado === 'Finalizado' || eventoSeleccionado.estado === 'Suspendido'} 
                        esAdmin={esAdmin} 
                        esMiMesa={usuarioGuardado?.id === p.dungeon_master_id} 
                        inscripcionesCerradas={inscripcionesCerradas} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                  <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No hay juegos de mesa registrados para este evento</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 animate-in fade-in duration-700">
      
      {eventoEditando && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-zinc-900 border border-purple-500/30 w-full max-w-lg rounded-[2.5rem] p-10 shadow-3xl">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 italic">✏️ Alterar Evento</h3>
            
            <form onSubmit={guardarEdicionEvento} className="flex flex-col gap-5">
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

              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Lugar" value={eventoEditando.lugar || ''} onChange={e => setEventoEditando({...eventoEditando, lugar: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-purple-500" />
                <input type="text" placeholder="Ciudad" value={eventoEditando.ciudad || ''} onChange={e => setEventoEditando({...eventoEditando, ciudad: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-purple-500" />
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
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-purple-500/5 blur-3xl pointer-events-none -z-10 rounded-[3rem]"></div>
        
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Eventos <span className="text-zinc-500">Próximos</span></h2>
          
          <div className="flex gap-2">
            <button onClick={scrollEventosIzq} className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors hidden sm:flex">‹</button>
            <button onClick={scrollEventosDer} className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors hidden sm:flex">›</button>
          </div>
        </div>
        
        {eventosProximos.length > 0 ? (
          <div ref={carruselEventosRef} className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {eventosProximos.map(e => (
              <div 
                key={e.id} 
                className="min-w-[85vw] sm:min-w-[400px] bg-zinc-900/60 p-8 rounded-[2.5rem] border border-zinc-800 cursor-pointer hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-300 group flex flex-col snap-start relative overflow-hidden"
                onClick={() => entrarAlEvento(e)}
              >
                {e.estado === 'En Curso' && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">
                      {formatearFechaManual(e.fecha)}
                    </p>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-amber-400 transition-colors">
                      {e.nombre}
                    </h3>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner ${
                    e.estado === 'En Curso' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  }`}>
                    {e.estado}
                  </span>
                </div>
                
                <p className="text-zinc-400 text-sm italic line-clamp-2 mb-8 flex-1">
                  {e.descripcion}
                </p>

                <div className="flex flex-col gap-2 mb-8">
                  {e.lugar && (
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">📍</span>
                      {e.lugar} {e.ciudad ? ` - ${e.ciudad}` : ''}
                    </div>
                  )}
                  {e.hora_inicio && (
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">⏰</span>
                      {e.hora_inicio} a {e.hora_fin}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-zinc-800/50 mt-auto gap-2">
                  <div className="flex gap-2">
                    {esDungeonMaster && (
                       <button 
                         onClick={(evt) => enviarConvocatoriaDMs(e, evt)}
                         className="p-3 bg-zinc-950 text-emerald-500 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors border border-emerald-500/20 group/btn"
                         title="Enviar cuervos para buscar Masters"
                       >
                         <span className="group-hover/btn:scale-110 inline-block transition-transform">🦅</span>
                       </button>
                    )}
                    
                    {esAdmin && (
                      <>
                        <button onClick={(evt) => abrirEdicion(e, evt)} className="p-3 bg-zinc-950 text-zinc-500 rounded-xl hover:text-white transition-colors border border-zinc-800">
                          ✏️
                        </button>
                        <button onClick={(evt) => borrarEvento(e.id, evt)} className="p-3 bg-zinc-950 text-zinc-500 rounded-xl hover:text-red-500 hover:bg-red-500/10 transition-colors border border-zinc-800">
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="text-amber-500 font-black uppercase tracking-widest text-xs flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                    Entrar <span className="text-lg leading-none">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <span className="text-5xl mb-4 block opacity-50">🏕️</span>
            <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">El horizonte está despejado</p>
            <p className="text-zinc-600 text-xs mt-2">No hay eventos próximos agendados</p>
          </div>
        )}
      </section>


      <section className="opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
        <h2 className="text-3xl md:text-4xl font-black text-zinc-700 italic uppercase tracking-tighter mb-10 pl-2 border-l-4 border-zinc-800">
          Crónicas Pasadas
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosPasados.map(e => (
            <div 
              key={e.id} 
              className="bg-zinc-950 p-6 rounded-[2rem] border border-zinc-900 cursor-pointer hover:border-zinc-700 transition-colors group"
              onClick={() => entrarAlEvento(e)}
            >
              <div className="flex justify-between items-start mb-4">
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
                  {formatearFechaManual(e.fecha)}
                </p>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  {e.estado}
                </span>
              </div>
              <h3 className="text-xl font-black text-zinc-400 italic uppercase tracking-tighter group-hover:text-zinc-200 transition-colors mb-2">
                {e.nombre}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-4">
                <span>Explorar</span> <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Eventos;