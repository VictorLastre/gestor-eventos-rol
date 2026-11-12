import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2'; 
import Partida from './Partida';
import CuentaRegresivaEvento from './CuentaRegresivaEvento'; 
import CrearMesa from './CrearMesa'; 
import CrearMesaJuego from './CrearMesaJuego'; // ✨ IMPORTAMOS EL NUEVO FORMULARIO
import FormularioEscape from './FormularioEscape'; 
import TarjetaEscape from './TarjetaEscape'; 
import { fetchProtegido } from '../utils/api'; 
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';

function Eventos({ setVista, mesaActivaId, setMesaActivaId, clubActivo, setClubActivo, clubes = [] }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [partidasDelEvento, setPartidasDelEvento] = useState([]);
  const [eventoEditando, setEventoEditando] = useState(null);
  
  const [vistaActiva, setVistaActiva] = useState('rol'); 
  const [escapesDelEvento, setEscapesDelEvento] = useState([]);
  
  const [mostrarFormularioMesa, setMostrarFormularioMesa] = useState(false);
  const [mostrarFormularioEscape, setMostrarFormularioEscape] = useState(false);
  const [mostrarFormularioJuegoMesa, setMostrarFormularioJuegoMesa] = useState(false); // ✨ NUEVO ESTADO
  const [modalLogisticaEvento, setModalLogisticaEvento] = useState(null);
  const [datosLogistica, setDatosLogistica] = useState(null);
  const [cargandoLogistica, setCargandoLogistica] = useState(false);
  const [filtroLogistica, setFiltroLogistica] = useState('todos');
  
  const carruselEventosRef = useRef(null);
  const carruselPartidasRef = useRef(null); 
  const carruselJuegosRef = useRef(null); // ✨ REF PARA EL CARRUSEL DE JUEGOS
  const carruselEscapesRef = useRef(null); // ✨ REF PARA EL CARRUSEL DE ESCAPES

  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  // Los DMs y Admins pueden crear mesas de rol.
  const esDungeonMaster = usuarioGuardado && (usuarioGuardado.rol === 'dm' || (usuarioGuardado.rol === 'admin' || usuarioGuardado.rol === 'superadmin'));
  const esAdmin = usuarioGuardado && (usuarioGuardado.rol === 'admin' || usuarioGuardado.rol === 'superadmin');

  const formatearFechaManual = (fechaStr) => {
    if (!fechaStr) return "Fecha Desconocida";
    const soloFecha = fechaStr.split('T')[0];
    const [anio, mes, dia] = soloFecha.split('-');
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${anio}`;
  };

  const cargarEventos = () => {
    let url = '/api/eventos';
    if (clubActivo?.id === 'todos') {
      url = '/api/eventos?club_id=todos';
    } else if (clubActivo?.id) {
      url = `/api/eventos?club_id=${clubActivo.id}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(datos => setEventos(Array.isArray(datos) ? datos : []))
      .catch(err => console.error("Error cargando eventos:", err));
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

  // Recargar eventos cuando cambie la sede activa
  useEffect(() => {
    cargarEventos();
  }, [clubActivo?.id]);

  useEffect(() => { 
    cargarEventos(); 

    const socket = io('/', {
      path: '/api/socket.io',
      transports: ['websocket'], 
      reconnectionAttempts: 5
    });

    socket.emit('unirse-club', clubActivo?.id || 1);

    socket.on('actualizacion-eventos', () => {
      cargarEventos();
    });

    socket.on('actualizacion-clubes', () => {
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
  }, [clubActivo?.id]);

  // ✨ SCROLL HORIZONTAL CON RUEDA DEL RATÓN
  useEffect(() => {
    const attachWheelEvent = (ref) => {
      const container = ref.current;
      if (!container) return;
      
      const handleWheel = (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          container.scrollBy({ left: e.deltaY > 0 ? 100 : -100, behavior: 'smooth' });
        }
      };
      
      // Pasamos passive: false para poder hacer preventDefault y evitar que la página baje
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    };

    let cleanupEventos = attachWheelEvent(carruselEventosRef);
    let cleanupPartidas = attachWheelEvent(carruselPartidasRef);
    let cleanupJuegos = attachWheelEvent(carruselJuegosRef);
    let cleanupEscapes = attachWheelEvent(carruselEscapesRef);

    return () => {
      if (cleanupEventos) cleanupEventos();
      if (cleanupPartidas) cleanupPartidas();
      if (cleanupJuegos) cleanupJuegos();
      if (cleanupEscapes) cleanupEscapes();
    };
  }, [eventoSeleccionado, vistaActiva]);

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

  const abrirLogistica = async (evento, e) => {
    if (e) e.stopPropagation();
    setModalLogisticaEvento(evento);
    setCargandoLogistica(true);
    setDatosLogistica(null);
    setFiltroLogistica('todos');

    try {
      const [resMesas, resEscapes] = await Promise.all([
        fetchProtegido(`/api/partidas/reporte-logistico/${evento.id}`),
        fetchProtegido(`/api/escapes/reporte-logistico/${evento.id}`).catch(() => ({ ok: false }))
      ]);

      const mesas = resMesas.ok ? await resMesas.json() : [];
      const escapes = resEscapes && resEscapes.ok ? await resEscapes.json() : [];

      setDatosLogistica({
        mesas: Array.isArray(mesas) ? mesas : [],
        escapes: Array.isArray(escapes) ? escapes : []
      });
    } catch (err) {
      if (err !== 'Sesión expirada') console.error('Error al cargar logística:', err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener la información logística del evento.',
        icon: 'error',
        background: '#09090b',
        color: '#fff'
      });
      setModalLogisticaEvento(null);
    } finally {
      setCargandoLogistica(false);
    }
  };

  const descargarExcelLogistica = () => {
    if (!datosLogistica || !modalLogisticaEvento) return;

    const filas = datosLogistica.mesas.map(m => ({
      "TIPO": m.etiqueta || "Rol",
      "ESTADO DM": m.es_dm_nuevo ? "⚠️ NUEVO" : "VETERANO",
      "DIRECTOR": (m.nombre_completo || m.dm_o_creador_nombre || "Anónimo").toUpperCase(),
      "TURNO": m.turno || "Tarde",
      "MESA / AVENTURA": m.mesa,
      "SISTEMA / JUEGO": m.sistema,
      "JUGADORES INSCRITOS": m.jugadores || "Sin inscritos aún",
      "MATERIALES PEDIDOS AL GREMIO": m.materiales_pedidos && m.materiales_pedidos.trim() !== '' ? m.materiales_pedidos : "✅ Sin pedidos especiales"
    }));

    if (datosLogistica.escapes && datosLogistica.escapes.length > 0) {
      datosLogistica.escapes.forEach(esc => {
        filas.push({
          "TIPO": "Escape Room",
          "ESTADO DM": "ORGANIZADOR",
          "DIRECTOR": (esc.organizador || "").toUpperCase(),
          "TURNO": `${esc.inicio || ''} - ${esc.fin || ''}`,
          "MESA / AVENTURA": esc.sala,
          "SISTEMA / JUEGO": "Escape Room",
          "JUGADORES INSCRITOS": esc.jugadores || "Sin inscritos",
          "MATERIALES PEDIDOS AL GREMIO": esc.materiales_pedidos || "✅ Sin pedidos especiales"
        });
      });
    }

    if (filas.length === 0) {
      return Swal.fire({
        title: 'Planilla Vacía',
        text: 'Aún no hay mesas convocadas en este evento.',
        icon: 'info',
        background: '#09090b',
        color: '#fff'
      });
    }

    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Planilla Logística");

    const nombreLimpio = (modalLogisticaEvento.nombre || 'Evento').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fechaLimpia = (modalLogisticaEvento.fecha || '').split('T')[0];
    XLSX.writeFile(libro, `Logistica_${nombreLimpio}_${fechaLimpia}.xlsx`);
  };

  const renderModalLogistica = () => {
    if (!modalLogisticaEvento) return null;

    const mesas = datosLogistica?.mesas || [];
    const escapes = datosLogistica?.escapes || [];

    const mesasConMaterial = mesas.filter(m => m.materiales_pedidos && m.materiales_pedidos.trim() !== '');
    const escapesConMaterial = escapes.filter(e => e.materiales_pedidos && e.materiales_pedidos.trim() !== '');
    const totalConMaterial = mesasConMaterial.length + escapesConMaterial.length;

    const mesasFiltradas = filtroLogistica === 'con_pedidos' 
      ? mesas.filter(m => m.materiales_pedidos && m.materiales_pedidos.trim() !== '')
      : mesas;

    const escapesFiltrados = filtroLogistica === 'con_pedidos'
      ? escapes.filter(e => e.materiales_pedidos && e.materiales_pedidos.trim() !== '')
      : escapes;

    return (
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) setModalLogisticaEvento(null); }}
        className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      >
        <div className="bg-zinc-950 border border-amber-500/30 w-full max-w-4xl max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 flex flex-col shadow-2xl relative my-auto overflow-hidden">
          
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                📦
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                  Logística y Pedidos de DMs
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                  {modalLogisticaEvento.nombre} • {formatearFechaManual(modalLogisticaEvento.fecha)}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setModalLogisticaEvento(null)}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors text-sm cursor-pointer border border-zinc-800 shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Barra de métricas y exportación */}
          <div className="py-4 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-xl">
                🎲 {mesas.length} Mesas
              </span>
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all ${
                totalConMaterial > 0 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}>
                📦 {totalConMaterial} con Solicitudes
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro Todas / Con Pedidos */}
              <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                <button 
                  onClick={() => setFiltroLogistica('todos')}
                  className={`px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    filtroLogistica === 'todos' 
                      ? 'bg-zinc-800 text-amber-400 shadow' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Todas
                </button>
                <button 
                  onClick={() => setFiltroLogistica('con_pedidos')}
                  className={`px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    filtroLogistica === 'con_pedidos' 
                      ? 'bg-amber-500 text-black shadow font-black' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Solo Pedidos ({totalConMaterial})
                </button>
              </div>

              {/* Botón Exportar a Excel */}
              <button 
                onClick={descargarExcelLogistica}
                disabled={cargandoLogistica || (mesas.length === 0 && escapes.length === 0)}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black px-4 py-2 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/30 cursor-pointer"
                title="Descargar planilla completa en formato Excel"
              >
                <span>📊</span> Exportar Excel
              </button>
            </div>
          </div>

          {/* Lista scrolleable de mesas y pedidos */}
          <div className="overflow-y-auto py-4 space-y-4 pr-1 scrollbar-hide flex-1">
            {cargandoLogistica ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-amber-400 font-black uppercase tracking-widest text-xs animate-pulse">
                  Consultando registros de la jornada...
                </p>
              </div>
            ) : (mesasFiltradas.length === 0 && escapesFiltrados.length === 0) ? (
              <div className="py-16 text-center border-2 border-dashed border-zinc-800/80 rounded-2xl bg-zinc-900/20 p-6">
                <span className="text-3xl block mb-2 opacity-40">📭</span>
                <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">
                  {filtroLogistica === 'con_pedidos' 
                    ? 'No hay solicitudes de materiales especiales en este evento.' 
                    : 'Aún no se han convocado mesas para esta jornada.'}
                </p>
              </div>
            ) : (
              <>
                {/* MESAS DE ROL Y JUEGOS DE MESA */}
                {mesasFiltradas.map((m, idx) => {
                  const tieneMaterial = Boolean(m.materiales_pedidos && m.materiales_pedidos.trim() !== '');
                  const directorNombre = m.nombre_completo || m.dm_o_creador_nombre || 'Sin DM';

                  return (
                    <div 
                      key={idx} 
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        tieneMaterial 
                          ? 'bg-zinc-900/80 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)]' 
                          : 'bg-zinc-900/40 border-zinc-800/70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {m.turno ? `Turno ${m.turno}` : 'Turno Tarde'}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {m.etiqueta || 'Rol'}
                            </span>
                            {m.sistema && (
                              <span className="text-[9px] font-bold text-zinc-400 border-l border-zinc-700 pl-2">
                                🎲 {m.sistema}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white uppercase italic tracking-tight">
                            {m.mesa}
                          </h4>
                        </div>

                        {/* DM Info */}
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs font-black text-amber-300 uppercase tracking-tight flex items-center sm:justify-end gap-1.5">
                            <span>🛡️</span> {directorNombre}
                            {m.nombre_completo && m.dm_o_creador_nombre && m.nombre_completo !== m.dm_o_creador_nombre && (
                              <span className="text-[10px] text-zinc-500 font-mono lowercase">({m.dm_o_creador_nombre})</span>
                            )}
                          </p>
                          {Boolean(m.es_dm_nuevo) && (
                            <span className="inline-block mt-0.5 text-[8px] font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded">
                              ⚠️ DM Primerizo (Requiere Certificado)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Caja de Materiales Pedidos */}
                      <div className={`p-3 rounded-xl border mt-3 ${
                        tieneMaterial 
                          ? 'bg-amber-950/30 border-amber-500/50 text-amber-200' 
                          : 'bg-zinc-950/40 border-zinc-800/50 text-zinc-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{tieneMaterial ? '📦' : '✅'}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {tieneMaterial ? 'Materiales Solicitados al Gremio:' : 'Sin pedidos de material:'}
                          </span>
                        </div>
                        <p className={`text-xs font-medium pl-5 ${tieneMaterial ? 'text-amber-100 font-bold' : 'italic text-zinc-500'}`}>
                          {tieneMaterial ? m.materiales_pedidos : 'El DM no solicitó materiales para esta aventura.'}
                        </p>
                      </div>

                      {/* Jugadores anotados */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap text-[10px] text-zinc-400">
                        <span className="font-bold uppercase tracking-wider text-zinc-500">Aventureros:</span>
                        {m.jugadores ? (
                          <span className="text-zinc-300 font-medium">{m.jugadores}</span>
                        ) : (
                          <span className="italic text-zinc-600">Sin inscripciones aún</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* ESCAPES SI HUBIERA */}
                {escapesFiltrados.map((esc, eIdx) => {
                  const tieneMaterial = Boolean(esc.materiales_pedidos && esc.materiales_pedidos.trim() !== '');

                  return (
                    <div 
                      key={`esc-${eIdx}`}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        tieneMaterial 
                          ? 'bg-zinc-900/80 border-indigo-500/40' 
                          : 'bg-zinc-900/40 border-zinc-800/70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            🔐 Escape Room • {esc.inicio} a {esc.fin} hs
                          </span>
                          <h4 className="text-base sm:text-lg font-black text-white uppercase italic tracking-tight mt-1">
                            {esc.sala}
                          </h4>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-black text-indigo-300 uppercase">
                            Organizador: {esc.organizador}
                          </p>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border mt-3 ${
                        tieneMaterial ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-200' : 'bg-zinc-950/40 border-zinc-800/50 text-zinc-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{tieneMaterial ? '📦' : '✅'}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {tieneMaterial ? 'Materiales Solicitados:' : 'Materiales:'}
                          </span>
                        </div>
                        <p className={`text-xs pl-5 ${tieneMaterial ? 'font-bold' : 'italic text-zinc-500'}`}>
                          {tieneMaterial ? esc.materiales_pedidos : 'Sin solicitudes especiales'}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-2 flex-wrap text-[10px] text-zinc-400">
                        <span className="font-bold uppercase tracking-wider text-zinc-500">Inscritos:</span>
                        <span className="text-zinc-300">{esc.jugadores || 'Sin inscritos'}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end shrink-0">
            <button 
              onClick={() => setModalLogisticaEvento(null)}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-zinc-800"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    );
  };

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

    const cupoRolLleno = eventoSeleccionado.cupo_rol !== null && mesasRol.length >= eventoSeleccionado.cupo_rol;
    const cupoJuegosLleno = eventoSeleccionado.cupo_juegos_mesa !== null && juegosMesa.length >= eventoSeleccionado.cupo_juegos_mesa;
    const cupoEscapeLleno = eventoSeleccionado.cupo_escape_room !== null && escapesDelEvento.length >= eventoSeleccionado.cupo_escape_room;

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

          <div className="mb-10 border-b border-zinc-900 pb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl">
                {eventoSeleccionado.nombre}
              </h2>
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-400">
                <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-sm">🗓️ {formatearFechaManual(eventoSeleccionado.fecha)}</span>
                {eventoSeleccionado.hora_inicio && <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-sm">⏰ {eventoSeleccionado.hora_inicio} a {eventoSeleccionado.hora_fin} hs</span>}
                {eventoSeleccionado.lugar && <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-sm">📍 {eventoSeleccionado.lugar}</span>}
                {esAdmin && (
                  <button 
                    onClick={() => abrirLogistica(eventoSeleccionado)}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 px-4 py-2 rounded-full border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-950/20 transition-all cursor-pointer"
                    title="Ver pedidos de materiales de los DMs y exportar planilla"
                  >
                    <span>📦</span> Logística y Pedidos de DMs
                  </button>
                )}
              </div>
            </div>

            {/* ⏳ CUENTA REGRESIVA DESTACADA EN LA FICHA */}
            <div className="shrink-0 w-full lg:w-auto">
              <CuentaRegresivaEvento 
                fecha={eventoSeleccionado.fecha}
                horaInicio={eventoSeleccionado.hora_inicio}
                horaFin={eventoSeleccionado.hora_fin}
                estado={eventoSeleccionado.estado}
              />
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
              🎲 Mesas de Rol ({mesasRol.length}{eventoSeleccionado.cupo_rol !== null ? `/${eventoSeleccionado.cupo_rol}` : ''})
            </button>
            <button 
              onClick={() => setVistaActiva('juegos')}
              className={`snap-start whitespace-nowrap flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 border ${
                vistaActiva === 'juegos' 
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              🃏 Juegos de Mesa ({juegosMesa.length}{eventoSeleccionado.cupo_juegos_mesa !== null ? `/${eventoSeleccionado.cupo_juegos_mesa}` : ''})
            </button>
            <button 
              onClick={() => setVistaActiva('escape')}
              className={`snap-start whitespace-nowrap flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 border ${
                vistaActiva === 'escape' 
                  ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              🔐 Escape Rooms ({escapesDelEvento.length}{eventoSeleccionado.cupo_escape_room !== null ? `/${eventoSeleccionado.cupo_escape_room}` : ''})
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
                    cupoRolLleno ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-inner">
                        <span className="text-3xl mb-3">🛡️</span>
                        <h4 className="text-amber-500 font-black uppercase tracking-widest text-sm mb-2">Cupo de Mesas Lleno</h4>
                        <p className="text-zinc-400 text-sm italic max-w-lg">Ya se ha alcanzado el límite logístico de mesas de rol para esta jornada.</p>
                      </div>
                    ) : (
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
                    )
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
                        eventoFecha={eventoSeleccionado.fecha}
                        eventoHoraInicio={eventoSeleccionado.hora_inicio}
                        eventoHoraFin={eventoSeleccionado.hora_fin}
                        eventoEstado={eventoSeleccionado.estado}
                        esAdmin={esAdmin} 
                        setVista={setVista} 
                        esMiMesa={usuarioGuardado?.id === p.dungeon_master_id} 
                        inscripcionesCerradas={inscripcionesCerradas} 
                        mesaActivaId={mesaActivaId}
                        setMesaActivaId={setMesaActivaId}
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
                    cupoEscapeLleno ? (
                      <div className="bg-indigo-500/10 border border-indigo-500/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-inner">
                        <span className="text-3xl mb-3">🔐</span>
                        <h4 className="text-indigo-400 font-black uppercase tracking-widest text-sm mb-2">Cupo de Salas Lleno</h4>
                        <p className="text-zinc-400 text-sm italic max-w-lg">Ya se ha alcanzado el límite logístico de Escape Rooms para esta jornada.</p>
                      </div>
                    ) : (
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
                    )
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
                {escapesDelEvento.length > 2 && (
                  <div className="flex gap-2">
                    <button onClick={() => carruselEscapesRef.current?.scrollBy({left: -350, behavior: 'smooth'})} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors">‹</button>
                    <button onClick={() => carruselEscapesRef.current?.scrollBy({left: 350, behavior: 'smooth'})} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-colors">›</button>
                  </div>
                )}
              </div>

              {escapesDelEvento.length > 0 ? (
                escapesDelEvento.length === 1 ? (
                  <div className="max-w-4xl mx-auto w-full pb-6 sm:pb-12">
                    {escapesDelEvento.map(sala => (
                      <TarjetaEscape 
                        key={sala.id}
                        sala={sala} 
                        usuarioGuardado={usuarioGuardado} 
                        esAdmin={esAdmin} 
                        inscripcionesCerradas={inscripcionesCerradas}
                        setVista={setVista}
                      />
                    ))}
                  </div>
                ) : escapesDelEvento.length === 2 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto w-full pb-6 sm:pb-12">
                    {escapesDelEvento.map(sala => (
                      <TarjetaEscape 
                        key={sala.id}
                        sala={sala} 
                        usuarioGuardado={usuarioGuardado} 
                        esAdmin={esAdmin} 
                        inscripcionesCerradas={inscripcionesCerradas}
                        setVista={setVista}
                      />
                    ))}
                  </div>
                ) : (
                  <div ref={carruselEscapesRef} className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:overflow-x-auto pb-6 sm:pb-12 scrollbar-hide sm:snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {escapesDelEvento.map(sala => (
                      <div key={sala.id} className="w-full sm:w-[350px] lg:w-[calc(33.333%-1rem)] flex-none sm:snap-start min-w-0">
                        <TarjetaEscape 
                          sala={sala} 
                          usuarioGuardado={usuarioGuardado} 
                          esAdmin={esAdmin} 
                          inscripcionesCerradas={inscripcionesCerradas}
                          setVista={setVista}
                        />
                      </div>
                    ))}
                  </div>
                )
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
                    cupoJuegosLleno ? (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-inner">
                        <span className="text-3xl mb-3">👑</span>
                        <h4 className="text-rose-500 font-black uppercase tracking-widest text-sm mb-2">Cupo de Juegos Lleno</h4>
                        <p className="text-zinc-400 text-sm italic max-w-lg">Ya se ha alcanzado el límite logístico de Juegos de Mesa para esta jornada.</p>
                      </div>
                    ) : (
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
                    )
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
                        eventoFecha={eventoSeleccionado.fecha}
                        eventoHoraInicio={eventoSeleccionado.hora_inicio}
                        eventoHoraFin={eventoSeleccionado.hora_fin}
                        eventoEstado={eventoSeleccionado.estado}
                        esAdmin={esAdmin} 
                        setVista={setVista} 
                        esMiMesa={usuarioGuardado?.id === p.dungeon_master_id} 
                        inscripcionesCerradas={inscripcionesCerradas} 
                        mesaActivaId={mesaActivaId}
                        setMesaActivaId={setMesaActivaId}
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
        {renderModalLogistica()}
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

              <div className="grid grid-cols-3 gap-4">
                <input type="number" min="1" placeholder="Cupo Rol" value={eventoEditando.cupo_rol || ''} onChange={e => setEventoEditando({...eventoEditando, cupo_rol: e.target.value ? parseInt(e.target.value) : null})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-white text-sm outline-none focus:border-yellow-500" title="Cupo de Mesas de Rol" />
                <input type="number" min="1" placeholder="Cupo Juegos" value={eventoEditando.cupo_juegos_mesa || ''} onChange={e => setEventoEditando({...eventoEditando, cupo_juegos_mesa: e.target.value ? parseInt(e.target.value) : null})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-white text-sm outline-none focus:border-yellow-500" title="Cupo de Juegos de Mesa" />
                <input type="number" min="1" placeholder="Cupo Escape" value={eventoEditando.cupo_escape_room || ''} onChange={e => setEventoEditando({...eventoEditando, cupo_escape_room: e.target.value ? parseInt(e.target.value) : null})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-white text-sm outline-none focus:border-yellow-500" title="Cupo de Escape Rooms" />
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setEventoEditando(null)} className="flex-1 bg-zinc-800 text-zinc-400 font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest hover:text-white transition-colors">Descartar</button>
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-purple-600/20 transition-all">Guardar Cambios</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🏛️ BANNER HERO DE LA COMUNIDAD / SEDE ACTIVA */}
      <div className="mb-10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-950 p-6 sm:p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full"></div>
        <div className="flex items-center gap-4 sm:gap-5 min-w-0 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner overflow-hidden text-2xl sm:text-3xl">
            {clubActivo?.logo ? (
              <img src={clubActivo.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              clubActivo?.id === 'todos' ? '🌐' : '🏛️'
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                {clubActivo?.id === 'todos' ? 'Multiverso Activo' : 'Sede del Gremio'}
              </span>
              {clubActivo?.id === 'todos' && (
                <span className="text-[8px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  TODAS LAS REGIONES
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter truncate mt-1">
              {clubActivo ? clubActivo.nombre : 'Asociación de Rol La Pampa'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-bold flex items-center gap-2 mt-1">
              <span>📍</span> {clubActivo?.id === 'todos' ? 'Todas las localidades de Argentina' : `${clubActivo?.ciudad || 'Santa Rosa'}, ${clubActivo?.provincia || 'La Pampa'}`}
            </p>
          </div>
        </div>

        {clubActivo?.whatsapp_url && (
          <a 
            href={clubActivo.whatsapp_url} 
            target="_blank" 
            rel="noreferrer"
            className="relative z-10 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 hover:scale-105"
          >
            <span>💬</span> Grupo de la Sede
          </a>
        )}
      </div>

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
                
                <div className="flex justify-between items-start mb-6 gap-2">
                  <div>
                    {e.club_nombre && clubActivo?.id === 'todos' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                        🏛️ {e.club_nombre} {e.club_ciudad ? `• ${e.club_ciudad}` : ''}
                      </span>
                    )}
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">
                      {formatearFechaManual(e.fecha)}
                    </p>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-amber-400 transition-colors">
                      {e.nombre}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner ${
                      e.estado === 'En Curso' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    }`}>
                      {e.estado}
                    </span>
                    <CuentaRegresivaEvento fecha={e.fecha} horaInicio={e.hora_inicio} horaFin={e.hora_fin} estado={e.estado} compacta={true} />
                  </div>
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
                    {esAdmin && (
                       <button 
                         onClick={(evt) => enviarConvocatoriaDMs(e, evt)}
                         className="p-3 bg-zinc-950 text-emerald-500 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors border border-emerald-500/20 group/btn"
                         title="Enviar cuervos para buscar Masters"
                       >
                         <span className="group-hover/btn:scale-110 inline-block transition-transform">📣</span>
                       </button>
                    )}
                    
                    {esAdmin && (
                      <>
                        <button 
                          onClick={(evt) => abrirLogistica(e, evt)} 
                          className="p-3 bg-zinc-950 text-amber-500 rounded-xl hover:bg-amber-500/10 hover:text-amber-400 transition-colors border border-amber-500/30 group/btn"
                          title="Ver logística, pedidos de DMs y exportar"
                        >
                          <span className="group-hover/btn:scale-110 inline-block transition-transform">📦</span>
                        </button>
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
                <div>
                  {e.club_nombre && clubActivo?.id === 'todos' && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-400 border border-zinc-800 mb-1">
                      🏛️ {e.club_nombre}
                    </span>
                  )}
                  <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
                    {formatearFechaManual(e.fecha)}
                  </p>
                </div>
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

      {renderModalLogistica()}
    </div>
  );
}

export default Eventos;