import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchProtegido } from '../utils/api';
import { io } from 'socket.io-client';
import AvatarUsuario from './AvatarUsuario';

function GestionTalleres({ clubActivo, clubes = [] }) {
  const [talleres, setTalleres] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'autonomos', 'evento'
  
  // Modales
  const [modalTaller, setModalTaller] = useState(false);
  const [tallerEditando, setTallerEditando] = useState(null);
  const [modalInscriptos, setModalInscriptos] = useState(null);
  const [cargandoInscriptos, setCargandoInscriptos] = useState(false);

  // Formulario
  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario')) || {};
  const [formulario, setFormulario] = useState({
    club_id: clubActivo?.id && clubActivo.id !== 'todos' ? clubActivo.id : 1,
    es_autonomo: true,
    evento_id: '',
    titulo: '',
    descripcion: '',
    tipo: 'Taller Práctico',
    modalidad: 'Presencial',
    instructor_nombre: usuarioGuardado?.nombre || '',
    cupo: 12,
    fecha: '',
    hora_inicio: '16:00',
    hora_fin: '18:30',
    lugar: '',
    requisitos: '',
    materiales_incluidos: '',
    costo: 'Gratuito',
    destinatarios: 'Para todo público',
    estado: 'Abierto'
  });

  const cargarTalleres = async () => {
    try {
      setCargando(true);
      let url = '/api/talleres';
      if (clubActivo?.id && clubActivo.id !== 'todos') {
        url += `?club_id=${clubActivo.id}`;
      }
      const res = await fetchProtegido(url);
      if (res.ok) {
        const datos = await res.json();
        setTalleres(Array.isArray(datos) ? datos : []);
      }
    } catch (e) {
      if (e !== 'Sesión expirada') console.error('Error al cargar talleres:', e);
    } finally {
      setCargando(false);
    }
  };

  const cargarEventos = async () => {
    try {
      let url = '/api/eventos';
      if (clubActivo?.id && clubActivo.id !== 'todos') {
        url += `?club_id=${clubActivo.id}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const datos = await res.json();
        setEventos(Array.isArray(datos) ? datos : []);
      }
    } catch (e) {
      console.error('Error al cargar jornadas:', e);
    }
  };

  useEffect(() => {
    cargarTalleres();
    cargarEventos();

    const socket = io('/', { path: '/api/socket.io' });
    socket.emit('unirse-club', clubActivo?.id || 1);

    socket.on('actualizacion-talleres', () => {
      cargarTalleres();
      if (modalInscriptos) {
        recargarDetalleInscriptos(modalInscriptos.id);
      }
    });

    return () => socket.disconnect();
  }, [clubActivo?.id]);

  const abrirModalNuevo = () => {
    setTallerEditando(null);
    setFormulario({
      club_id: clubActivo?.id && clubActivo.id !== 'todos' ? clubActivo.id : 1,
      es_autonomo: true,
      evento_id: '',
      titulo: '',
      descripcion: '',
      tipo: 'Taller Práctico',
      modalidad: 'Presencial',
      instructor_nombre: usuarioGuardado?.nombre || '',
      cupo: 12,
      fecha: '',
      hora_inicio: '16:00',
      hora_fin: '18:30',
      lugar: '',
      requisitos: '',
      materiales_incluidos: '',
      costo: 'Gratuito',
      destinatarios: 'Para todo público',
      estado: 'Abierto'
    });
    setModalTaller(true);
  };

  const abrirModalEditar = (t) => {
    setTallerEditando(t);
    setFormulario({
      club_id: t.club_id || 1,
      es_autonomo: !t.evento_id,
      evento_id: t.evento_id ? String(t.evento_id) : '',
      titulo: t.titulo || '',
      descripcion: t.descripcion || '',
      tipo: t.tipo || 'Taller Práctico',
      modalidad: t.modalidad || 'Presencial',
      instructor_nombre: t.instructor_nombre || '',
      cupo: t.cupo || 12,
      fecha: t.fecha ? t.fecha.split('T')[0] : '',
      hora_inicio: t.hora_inicio || '16:00',
      hora_fin: t.hora_fin || '18:30',
      lugar: t.lugar || '',
      requisitos: t.requisitos || '',
      materiales_incluidos: t.materiales_incluidos || '',
      costo: t.costo || 'Gratuito',
      destinatarios: t.destinatarios || 'Para todo público',
      estado: t.estado || 'Abierto'
    });
    setModalTaller(true);
  };

  const guardarTaller = async (e) => {
    e.preventDefault();
    if (!formulario.titulo || !formulario.descripcion || !formulario.fecha) {
      Swal.fire({
        title: 'Campos requeridos',
        text: 'Completa al menos el título, descripción y fecha del taller.',
        icon: 'warning',
        background: '#09090b', color: '#fff'
      });
      return;
    }

    const payload = {
      ...formulario,
      evento_id: formulario.es_autonomo ? null : (formulario.evento_id || null),
      cupo: parseInt(formulario.cupo, 10) || 12
    };

    try {
      let res;
      if (tallerEditando) {
        res = await fetchProtegido(`/api/talleres/${tallerEditando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetchProtegido('/api/talleres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar taller');

      Swal.fire({
        title: tallerEditando ? '¡Taller Actualizado!' : '¡Taller Convocado!',
        text: data.mensaje || 'Los aprendices ya pueden postularse.',
        icon: 'success',
        background: '#09090b', color: '#fff',
        customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' }
      });

      setModalTaller(false);
      cargarTalleres();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        background: '#09090b', color: '#fff'
      });
    }
  };

  const borrarTaller = async (id, titulo) => {
    const confirm = await Swal.fire({
      title: '¿Disolver este taller o curso?',
      text: `Se borrará "${titulo}" y las inscripciones de todos los participantes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, disolver',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      background: '#09090b', color: '#fff',
      customClass: { popup: 'border border-red-500/30 rounded-[2rem]' }
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/talleres/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar taller');

        Swal.fire({
          title: 'Taller Eliminado',
          icon: 'success',
          background: '#09090b', color: '#fff',
          customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' }
        });
        cargarTalleres();
      } catch (err) {
        Swal.fire({ title: 'Error', text: err.message, icon: 'error', background: '#09090b', color: '#fff' });
      }
    }
  };

  const abrirInscriptos = async (taller) => {
    setModalInscriptos(taller);
    recargarDetalleInscriptos(taller.id);
  };

  const recargarDetalleInscriptos = async (tallerId) => {
    try {
      setCargandoInscriptos(true);
      const res = await fetchProtegido(`/api/talleres/${tallerId}`);
      if (res.ok) {
        const data = await res.json();
        setModalInscriptos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoInscriptos(false);
    }
  };

  const cambiarAsistencia = async (usuarioId, nuevaAsistencia) => {
    if (!modalInscriptos) return;
    try {
      const res = await fetchProtegido(`/api/talleres/${modalInscriptos.id}/asistencia`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, asistencia: nuevaAsistencia })
      });
      if (res.ok) {
        // Actualizar estado local
        setModalInscriptos(prev => ({
          ...prev,
          inscritos: (prev?.inscritos || []).map(i => i.usuario_id === usuarioId ? { ...i, asistencia: nuevaAsistencia } : i)
        }));
      }
    } catch (e) {
      console.error('Error registrando asistencia:', e);
    }
  };

  const removerParticipante = async (usuarioId, nombre) => {
    if (!modalInscriptos) return;
    const confirm = await Swal.fire({
      title: '¿Remover aprendiz?',
      text: `¿Dar de baja a ${nombre} de este taller?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      background: '#09090b', color: '#fff'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/talleres/${modalInscriptos.id}/expulsar/${usuarioId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          recargarDetalleInscriptos(modalInscriptos.id);
          cargarTalleres();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Filtrado de talleres
  const talleresFiltrados = talleres.filter(t => {
    if (filtroTipo === 'autonomos') return !t.evento_id;
    if (filtroTipo === 'evento') return Boolean(t.evento_id);
    return true;
  });

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Barra Superior: Título, Filtros y Botón Nuevo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-2xl border border-purple-500/20 text-2xl shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            🎓
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter italic">
              Academia del Gremio
            </h3>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">
              Talleres, Cursos, Masterclasses y Capacitaciones
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Filtros */}
          <div className="flex gap-1 bg-zinc-950 border border-zinc-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                filtroTipo === 'todos' ? 'bg-zinc-800 text-purple-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Todos ({talleres.length})
            </button>
            <button
              onClick={() => setFiltroTipo('autonomos')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                filtroTipo === 'autonomos' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Cursos con fecha y lugar propios, fuera de jornadas"
            >
              ✨ Autónomos ({talleres.filter(t => !t.evento_id).length})
            </button>
            <button
              onClick={() => setFiltroTipo('evento')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                filtroTipo === 'evento' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Talleres integrados dentro de una jornada oficial"
            >
              ⚔️ En Jornadas ({talleres.filter(t => t.evento_id).length})
            </button>
          </div>

          {/* Botón Convocar */}
          <button
            onClick={abrirModalNuevo}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-900/30 hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <span>✨</span> Convocar Taller o Curso
          </button>
        </div>
      </div>

      {/* Lista / Grid de Talleres */}
      {cargando ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-xs animate-pulse">
          Consultando los registros de la Academia...
        </div>
      ) : talleresFiltrados.length === 0 ? (
        <div className="bg-zinc-950/40 border-2 border-dashed border-zinc-900 rounded-[2.5rem] p-12 text-center">
          <span className="text-4xl block mb-3 opacity-30">📚</span>
          <h4 className="text-zinc-400 font-black uppercase tracking-widest text-xs mb-1">
            No hay talleres registrados en esta categoría
          </h4>
          <p className="text-zinc-600 text-xs italic">
            Convoca el primer taller formativo haciendo clic en el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {talleresFiltrados.map(t => (
            <div 
              key={t.id} 
              className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    {t.tipo}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    t.estado === 'Abierto' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {t.estado}
                  </span>
                </div>

                <h4 className="text-xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-purple-300 transition-colors">
                  {t.titulo}
                </h4>

                <div className="text-xs text-zinc-400 font-bold mb-3">
                  <span className="text-zinc-500 font-mono">Instructor:</span> {t.instructor_nombre}
                </div>

                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 text-xs space-y-1 mb-4">
                  <div className="text-zinc-300">
                    <span className="text-amber-400 font-bold">📅</span> {t.fecha} • {t.hora_inicio} a {t.hora_fin} hs
                  </div>
                  <div className="text-zinc-400 truncate">
                    <span className="text-purple-400 font-bold">📍</span> {t.lugar || (t.modalidad === 'Virtual' ? 'Online' : 'Sede')}
                  </div>
                  <div className="text-zinc-500 text-[11px]">
                    {t.evento_nombre ? `⚔️ Jornada: ${t.evento_nombre}` : '✨ Taller Autónomo'}
                  </div>
                </div>

                {/* Barra de progreso de cupos */}
                <div className="mb-4">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    <span>Inscriptos</span>
                    <span className="text-purple-400 font-mono">{t.inscritos_count || 0} / {t.cupo}</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, Math.round(((t.inscritos_count || 0) / (t.cupo || 1)) * 100))}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Botones de Administración */}
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => abrirInscriptos(t)}
                  className="flex-1 py-2 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-purple-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>👥</span> Inscriptos ({t.inscritos_count || 0})
                </button>
                <button
                  onClick={() => abrirModalEditar(t)}
                  className="p-2 bg-zinc-950 hover:bg-amber-500/20 border border-zinc-800 hover:border-amber-500/50 text-amber-400 rounded-xl text-xs transition-all cursor-pointer"
                  title="Editar taller"
                >
                  ✏️
                </button>
                <button
                  onClick={() => borrarTaller(t.id, t.titulo)}
                  className="p-2 bg-zinc-950 hover:bg-rose-500/20 border border-zinc-800 hover:border-rose-500/50 text-rose-400 rounded-xl text-xs transition-all cursor-pointer"
                  title="Eliminar taller"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CREAR / EDITAR TALLER                               */}
      {/* ========================================================= */}
      {modalTaller && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-zinc-950 border border-purple-500/30 w-full max-w-2xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎓</span>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">
                  {tallerEditando ? 'Reescribir Taller / Curso' : 'Convocar Nuevo Taller'}
                </h3>
              </div>
              <button
                onClick={() => setModalTaller(false)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarTaller} className="overflow-y-auto space-y-4 pr-1 scrollbar-hide flex-1">
              
              {/* Selector Autónomo vs En Jornada */}
              <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                  Tipo de Convocatoria
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormulario(prev => ({ ...prev, es_autonomo: true, evento_id: '' }))}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                      formulario.es_autonomo 
                        ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-wider text-purple-400">✨ Taller Autónomo</span>
                    Con fecha, horario y lugar independientes de las jornadas.
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormulario(prev => ({ ...prev, es_autonomo: false, evento_id: eventos[0]?.id ? String(eventos[0].id) : '' }))}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                      !formulario.es_autonomo 
                        ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-wider text-amber-400">⚔️ Dentro de una Jornada</span>
                    Asociado a un evento del calendario del gremio.
                  </button>
                </div>

                {!formulario.es_autonomo && (
                  <div className="pt-2 animate-in fade-in duration-300">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1 block">
                      Seleccionar Jornada Oficial
                    </label>
                    <select
                      value={formulario.evento_id}
                      onChange={e => {
                        const selId = e.target.value;
                        const ev = eventos.find(item => String(item.id) === String(selId));
                        setFormulario(prev => ({
                          ...prev,
                          evento_id: selId,
                          fecha: ev?.fecha ? ev.fecha.split('T')[0] : prev.fecha,
                          lugar: ev?.lugar || prev.lugar
                        }));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500"
                    >
                      <option value="">-- Elige una jornada --</option>
                      {eventos.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.nombre} ({ev.fecha ? ev.fecha.split('T')[0] : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Título */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                  Título del Taller o Curso *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Taller de Pintura de Miniaturas / Masterclass: Crear Mundos OSR"
                  value={formulario.titulo}
                  onChange={e => setFormulario(prev => ({ ...prev, titulo: e.target.value }))}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 text-white text-sm font-bold focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Tipo, Modalidad y Cupo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Formato
                  </label>
                  <select
                    value={formulario.tipo}
                    onChange={e => setFormulario(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Taller Práctico">Taller Práctico</option>
                    <option value="Curso / Ciclo">Curso / Ciclo</option>
                    <option value="Masterclass">Masterclass</option>
                    <option value="Charla / Conversatorio">Charla / Conversatorio</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Modalidad
                  </label>
                  <select
                    value={formulario.modalidad}
                    onChange={e => setFormulario(prev => ({ ...prev, modalidad: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Presencial">🏛️ Presencial</option>
                    <option value="Virtual">💻 Virtual</option>
                    <option value="Híbrido">🌐 Híbrido</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Cupo Máximo
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formulario.cupo}
                    onChange={e => setFormulario(prev => ({ ...prev, cupo: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Instructor y Costo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Instructor / Disertante
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del docente o coordinador"
                    value={formulario.instructor_nombre}
                    onChange={e => setFormulario(prev => ({ ...prev, instructor_nombre: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Costo / Arancel
                  </label>
                  <input
                    type="text"
                    placeholder="Gratuito / A la gorra / $3500"
                    value={formulario.costo}
                    onChange={e => setFormulario(prev => ({ ...prev, costo: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Fecha y Horarios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formulario.fecha}
                    onChange={e => setFormulario(prev => ({ ...prev, fecha: e.target.value }))}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none [color-scheme:dark] focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={formulario.hora_inicio}
                    onChange={e => setFormulario(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none [color-scheme:dark] focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={formulario.hora_fin}
                    onChange={e => setFormulario(prev => ({ ...prev, hora_fin: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none [color-scheme:dark] focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Lugar / Plataforma y Destinatarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Lugar / Espacio / Enlace
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Centro Cultural Medasur / Servidor Discord"
                    value={formulario.lugar}
                    onChange={e => setFormulario(prev => ({ ...prev, lugar: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Público Objetivo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Para todo público / Mayores de 13 / Directores"
                    value={formulario.destinatarios}
                    onChange={e => setFormulario(prev => ({ ...prev, destinatarios: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                  Descripción y Temario *
                </label>
                <textarea
                  rows="3"
                  placeholder="Detalla qué se aprenderá, dinámica, módulos o actividades..."
                  value={formulario.descripcion}
                  onChange={e => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs italic resize-none focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Requisitos y Materiales provistos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1 block">
                    📜 Requisitos del Aprendiz (Opcional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Ej: Traer cuaderno, lápiz o pinceles..."
                    value={formulario.requisitos}
                    onChange={e => setFormulario(prev => ({ ...prev, requisitos: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs italic resize-none outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1 block">
                    🎁 Materiales Provistos (Opcional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Ej: Pinturas acrílicas, fotocopias y miniaturas impresas en 3D..."
                    value={formulario.materiales_incluidos}
                    onChange={e => setFormulario(prev => ({ ...prev, materiales_incluidos: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs italic resize-none outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Estado */}
              {tallerEditando && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                    Estado de la Convocatoria
                  </label>
                  <select
                    value={formulario.estado}
                    onChange={e => setFormulario(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Abierto">Abierto (Acepta inscripciones)</option>
                    <option value="Completo">Completo (Cupos llenos)</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalTaller(false)}
                  className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-900/40 cursor-pointer"
                >
                  {tallerEditando ? 'Guardar Cambios' : 'Lanzar Convocatoria'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL GESTIÓN DE INSCRIPTOS Y ASISTENCIAS                 */}
      {/* ========================================================= */}
      {modalInscriptos && (
        <div className="fixed inset-0 z-[360] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-zinc-950 border border-purple-500/30 w-full max-w-3xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  {modalInscriptos.tipo || 'Taller'}
                </span>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mt-1">
                  {modalInscriptos.titulo}
                </h3>
                <p className="text-xs text-zinc-400 font-bold mt-1">
                  Ocupación: {modalInscriptos.inscritos?.length || 0} / {modalInscriptos.cupo} aprendices
                </p>
              </div>
              <button
                onClick={() => setModalInscriptos(null)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Lista de inscriptos */}
            <div className="overflow-y-auto space-y-3 pr-1 scrollbar-hide flex-1">
              {cargandoInscriptos ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs animate-pulse">
                  Cargando nómina de participantes...
                </div>
              ) : !modalInscriptos.inscritos || modalInscriptos.inscritos.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-900/30">
                  <span className="text-3xl block mb-2 opacity-30">📭</span>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                    Aún no hay aprendices inscriptos en este taller
                  </p>
                </div>
              ) : (
                modalInscriptos.inscritos.map(insc => (
                  <div
                    key={insc.usuario_id}
                    className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                        <AvatarUsuario nombre={insc.nombre} avatar={insc.avatar} tamaño={40} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase italic tracking-tight">
                          {insc.nombre_completo || insc.nombre}
                          {insc.nombre_completo && insc.nombre_completo !== insc.nombre && (
                            <span className="text-zinc-500 text-xs font-mono ml-1.5 lowercase">({insc.nombre})</span>
                          )}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono truncate">
                          {insc.email || 'Sin correo público'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Botones de Asistencia */}
                      <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                        <button
                          onClick={() => cambiarAsistencia(insc.usuario_id, 'presente')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            insc.asistencia === 'presente'
                              ? 'bg-emerald-500 text-black shadow-md'
                              : 'text-zinc-500 hover:text-emerald-400'
                          }`}
                          title="Marcar Presente"
                        >
                          ✓ Presente
                        </button>
                        <button
                          onClick={() => cambiarAsistencia(insc.usuario_id, 'ausente')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            insc.asistencia === 'ausente'
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'text-zinc-500 hover:text-rose-400'
                          }`}
                          title="Marcar Ausente"
                        >
                          ✕ Ausente
                        </button>
                        <button
                          onClick={() => cambiarAsistencia(insc.usuario_id, 'pendiente')}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            insc.asistencia === 'pendiente'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                          title="Pendiente"
                        >
                          ?
                        </button>
                      </div>

                      {/* Quitar */}
                      <button
                        onClick={() => removerParticipante(insc.usuario_id, insc.nombre)}
                        className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        title="Remover del taller"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center mt-4">
              <span className="text-[10px] text-zinc-500 font-mono">
                Total: {modalInscriptos.inscritos?.length || 0} inscriptos
              </span>
              <button
                onClick={() => setModalInscriptos(null)}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border border-zinc-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default GestionTalleres;
