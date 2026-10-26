import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { fetchProtegido } from '../utils/api';
import AvatarUsuario from './AvatarUsuario';

function GestionSanciones({ setVista }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'sancionados', 'advertencia', 'justificados'

  // Estado para el modal de expediente
  const [modalUsuario, setModalUsuario] = useState(null);
  const [historialUsuario, setHistorialUsuario] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const cargarListado = () => {
    setCargando(true);
    fetchProtegido('/api/usuarios/sanciones/listado')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar sanciones');
        return res.json();
      })
      .then(datos => {
        setUsuarios(Array.isArray(datos) ? datos : []);
        setCargando(false);
      })
      .catch(err => {
        if (err !== 'Sesión expirada') console.error('Error al cargar listado de sanciones:', err);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarListado();

    const socket = io('/', { path: '/api/socket.io' });
    const refrescar = () => {
      cargarListado();
      if (modalUsuario) {
        recargarHistorial(modalUsuario.id);
      }
    };

    socket.on('actualizacion-sanciones', refrescar);
    socket.on('actualizacion-usuarios', refrescar);

    return () => socket.disconnect();
  }, [modalUsuario?.id]);

  const recargarHistorial = (usuarioId) => {
    fetchProtegido(`/api/usuarios/${usuarioId}/historial-asistencia`)
      .then(res => res.json())
      .then(data => {
        setHistorialUsuario(data.historial || []);
      })
      .catch(err => console.error('Error al recargar historial:', err));
  };

  const abrirHistorial = (usuario) => {
    setModalUsuario(usuario);
    setCargandoHistorial(true);
    fetchProtegido(`/api/usuarios/${usuario.id}/historial-asistencia`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar historial');
        return res.json();
      })
      .then(data => {
        setHistorialUsuario(data.historial || []);
        setCargandoHistorial(false);
      })
      .catch(err => {
        console.error('Error al abrir expediente:', err);
        setCargandoHistorial(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el historial de asistencia.',
          background: '#18181b',
          color: '#f4f4f5'
        });
      });
  };

  const cerrarModal = () => {
    setModalUsuario(null);
    setHistorialUsuario([]);
  };

  // ⚖️ INDULTAR / JUSTIFICAR UNA FALTA ESPECÍFICA
  const justificarFalta = async (item) => {
    const { value: motivo, isConfirmed } = await Swal.fire({
      title: '⚖️ Conceder Indulto',
      html: `
        <div class="text-left text-xs sm:text-sm text-zinc-300 space-y-2">
          <p>¿Deseas justificar la inasistencia de <b>${modalUsuario?.nombre}</b> en la mesa <b>"${item.partida_titulo}"</b>?</p>
          <div class="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700/50 text-[11px] text-zinc-400">
            <p>⚔️ <b>Efectos del Indulto:</b></p>
            <ul class="list-disc list-inside mt-1 space-y-0.5">
              <li>Se retira el deshonor (-1 Falta sin aviso) de su historial.</li>
              <li>Se actualiza la asistencia a <i>Justificado</i>.</li>
              <li>Si estaba bloqueado, se reevaluará para habilitar su inscripción.</li>
              <li>Se registrará en la Bitácora y se notificará al aventurero.</li>
            </ul>
          </div>
        </div>
      `,
      input: 'text',
      inputLabel: 'Motivo del indulto (opcional):',
      inputPlaceholder: 'Ej: Certificado médico presentado / Aviso previo',
      showCancelButton: true,
      confirmButtonText: '⚖️ Conceder Indulto',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3f3f46',
      background: '#18181b',
      color: '#f4f4f5'
    });

    if (!isConfirmed) return;

    try {
      setProcesandoAccion(true);
      const res = await fetchProtegido('/api/usuarios/sanciones/justificar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inscripcion_id: item.inscripcion_id,
          motivo: motivo || 'Justificación concedida por la Administración'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo justificar la inasistencia.');

      Swal.fire({
        icon: 'success',
        title: '¡Indulto Concedido!',
        text: data.mensaje || 'La falta ha sido justificada y el deshonor retirado.',
        background: '#18181b',
        color: '#f4f4f5',
        confirmButtonColor: '#10b981'
      });

      recargarHistorial(modalUsuario.id);
      cargarListado();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Fallo al procesar',
        text: error.message || 'Error del servidor.',
        background: '#18181b',
        color: '#f4f4f5'
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // 👑 INDULTO TOTAL PARA UN AVENTURERO
  const aplicarIndultoTotal = async (usuario) => {
    const { value: motivo, isConfirmed } = await Swal.fire({
      title: '👑 Indulto Total del Gremio',
      html: `
        <div class="text-left text-xs sm:text-sm text-zinc-300 space-y-2">
          <p>¿Estás seguro de conceder un <b>Indulto Total</b> a <b>${usuario.nombre}</b>?</p>
          <div class="bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 text-[11px] text-purple-300">
            <p>⚖️ <b>Resolución Extraordinaria:</b></p>
            <ul class="list-disc list-inside mt-1 space-y-0.5">
              <li>Todas sus inasistencias pasarán a estar <i>Justificadas</i>.</li>
              <li>Se removerán todas las penalizaciones de deshonor por inasistencia.</li>
              <li>Cualquier suspensión de cupos quedará <b>inmediatamente anulada</b>.</li>
            </ul>
          </div>
        </div>
      `,
      input: 'text',
      inputLabel: 'Motivo del Indulto Total:',
      inputPlaceholder: 'Ej: Compromiso de asistencia / Amnistía anual del Gremio',
      showCancelButton: true,
      confirmButtonText: '👑 Otorgar Indulto Total',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#3f3f46',
      background: '#18181b',
      color: '#f4f4f5'
    });

    if (!isConfirmed) return;

    try {
      setProcesandoAccion(true);
      const res = await fetchProtegido('/api/usuarios/sanciones/indulto-total', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.id,
          motivo: motivo || 'Indulto general concedido por el Alto Mando'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo procesar el indulto total.');

      Swal.fire({
        icon: 'success',
        title: '¡Indulto Total Aplicado!',
        text: data.mensaje || 'Todas las faltas han sido justificadas con éxito.',
        background: '#18181b',
        color: '#f4f4f5',
        confirmButtonColor: '#9333ea'
      });

      if (modalUsuario && modalUsuario.id === usuario.id) {
        recargarHistorial(usuario.id);
      }
      cargarListado();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Fallo al procesar',
        text: error.message || 'Error del servidor.',
        background: '#18181b',
        color: '#f4f4f5'
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Métricas calculadas para los contadores superiores
  const totalSancionados = usuarios.filter(u => u.esta_sancionado).length;
  const totalAdvertencia = usuarios.filter(u => !u.esta_sancionado && u.ausencias_consecutivas === 1).length;
  const totalFaltasGlobales = usuarios.reduce((acc, u) => acc + (u.total_ausencias || 0), 0);
  const totalJustificadasGlobales = usuarios.reduce((acc, u) => acc + (u.total_justificadas || 0), 0);

  // Filtrado de usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    const texto = `${u.nombre || ''} ${u.nombre_completo || ''} ${u.email || ''}`.toLowerCase();
    const coincideBusqueda = texto.includes(busqueda.toLowerCase());

    if (!coincideBusqueda) return false;

    if (filtro === 'sancionados') return u.esta_sancionado;
    if (filtro === 'advertencia') return !u.esta_sancionado && u.ausencias_consecutivas === 1;
    if (filtro === 'justificados') return (u.total_justificadas || 0) > 0;
    if (filtro === 'con_faltas') return (u.total_ausencias || 0) > 0;

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 🧭 ENCABEZADO DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <span>⚠️</span> Tribunal de Asistencias y Sanciones
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Supervisa el compromiso de los aventureros, gestiona inasistencias consecutivas y otorga indultos oficiales.
          </p>
        </div>
        <button
          onClick={cargarListado}
          disabled={cargando}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-zinc-700 shadow-sm"
        >
          <span className={cargando ? 'animate-spin' : ''}>🔄</span> Actualizar Datos
        </button>
      </div>

      {/* 📊 TARJETAS DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Sancionados Activos */}
        <div 
          onClick={() => setFiltro(filtro === 'sancionados' ? 'todos' : 'sancionados')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            filtro === 'sancionados'
              ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-950/40 ring-2 ring-red-500/30'
              : 'bg-zinc-900/80 hover:bg-zinc-800/60 border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">🚫</span>
            <span className="text-2xl sm:text-3xl font-black text-red-400">{totalSancionados}</span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-red-300 uppercase tracking-wider mt-3">
            Sancionados Activos
          </h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">2 inasistencias consecutivas (Bloqueados)</p>
        </div>

        {/* En Advertencia */}
        <div 
          onClick={() => setFiltro(filtro === 'advertencia' ? 'todos' : 'advertencia')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            filtro === 'advertencia'
              ? 'bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-950/40 ring-2 ring-amber-500/30'
              : 'bg-zinc-900/80 hover:bg-zinc-800/60 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">⚠️</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{totalAdvertencia}</span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-amber-300 uppercase tracking-wider mt-3">
            En Advertencia
          </h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">1 falta consecutiva (Al borde de sanción)</p>
        </div>

        {/* Total Faltas Sin Aviso */}
        <div 
          onClick={() => setFiltro(filtro === 'con_faltas' ? 'todos' : 'con_faltas')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            filtro === 'con_faltas'
              ? 'bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-950/40 ring-2 ring-orange-500/30'
              : 'bg-zinc-900/80 hover:bg-zinc-800/60 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">⚔️</span>
            <span className="text-2xl sm:text-3xl font-black text-orange-400">{totalFaltasGlobales}</span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-zinc-300 uppercase tracking-wider mt-3">
            Inasistencias Sin Aviso
          </h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">Faltas registradas históricas</p>
        </div>

        {/* Total Indultadas */}
        <div 
          onClick={() => setFiltro(filtro === 'justificados' ? 'todos' : 'justificados')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            filtro === 'justificados'
              ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/30'
              : 'bg-zinc-900/80 hover:bg-zinc-800/60 border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl">⚖️</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{totalJustificadasGlobales}</span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-emerald-300 uppercase tracking-wider mt-3">
            Indultos Otorgados
          </h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">Faltas perdonadas y justificadas</p>
        </div>

      </div>

      {/* 🔍 BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre de héroe, nombre real o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Selector de Filtros */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-800">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'sancionados', label: `🚫 Sancionados (${totalSancionados})` },
            { id: 'advertencia', label: `⚠️ Advertencia (${totalAdvertencia})` },
            { id: 'con_faltas', label: '⚔️ Con Faltas' },
            { id: 'justificados', label: '⚖️ Indultados' }
          ].map(op => (
            <button
              key={op.id}
              onClick={() => setFiltro(op.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filtro === op.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

      </div>

      {/* 📜 TABLA / LISTADO DE AVENTUREROS */}
      {cargando ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 font-bold text-sm">Consultando registros del Tribunal...</p>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center">
          <span className="text-4xl block mb-3">🕊️</span>
          <h4 className="text-white font-black text-lg">No se hallaron registros</h4>
          <p className="text-zinc-400 text-xs max-w-md mx-auto mt-1">
            {busqueda 
              ? 'No hay aventureros que coincidan con los términos de búsqueda.' 
              : 'No hay aventureros con el estado seleccionado en los libros del Gremio.'}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider text-[10px] font-black border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4">Aventurero</th>
                  <th className="py-3.5 px-4">Estado Disciplinario</th>
                  <th className="py-3.5 px-4 text-center">Asistencias</th>
                  <th className="py-3.5 px-4 text-center">Faltas Sin Aviso</th>
                  <th className="py-3.5 px-4 text-center">Indultos</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {usuariosFiltrados.map((u) => (
                  <tr 
                    key={u.id}
                    className={`transition-colors hover:bg-zinc-900/50 ${
                      u.esta_sancionado ? 'bg-red-950/15' : u.ausencias_consecutivas === 1 ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    
                    {/* Identidad */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <AvatarUsuario nombre={u.nombre} tamaño={38} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm truncate">{u.nombre}</span>
                            {u.rol === 'admin' && (
                              <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[9px] font-black uppercase">
                                Admin
                              </span>
                            )}
                            {u.rol === 'dm' && (
                              <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-black uppercase">
                                DM
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {u.nombre_completo || u.email}
                          </p>
                          {u.telegram_chat_id && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 mt-0.5">
                              ✈️ Telegram activo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Estado Disciplinario */}
                    <td className="py-3.5 px-4">
                      {u.esta_sancionado ? (
                        <div className="inline-flex flex-col">
                          <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl font-black text-[11px] flex items-center gap-1.5 w-fit animate-pulse">
                            <span>🚫</span> SUSPENDIDO
                          </span>
                          <span className="text-[10px] text-red-300/80 font-bold mt-1">
                            {u.ausencias_consecutivas} faltas consecutivas (Inscripción bloqueada)
                          </span>
                        </div>
                      ) : u.ausencias_consecutivas === 1 ? (
                        <div className="inline-flex flex-col">
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-xl font-black text-[11px] flex items-center gap-1.5 w-fit">
                            <span>⚠️</span> ADVERTENCIA
                          </span>
                          <span className="text-[10px] text-amber-300/80 font-bold mt-1">
                            1 falta reciente (1 más = sanción)
                          </span>
                        </div>
                      ) : u.total_ausencias === 0 && u.total_presentes > 0 ? (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl font-bold text-[11px] flex items-center gap-1.5 w-fit">
                          <span>✨</span> Ejemplar
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-xl font-bold text-[11px] flex items-center gap-1.5 w-fit">
                          <span>🛡️</span> Habilitado
                        </span>
                      )}
                    </td>

                    {/* Presentes */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-black text-xs">
                        {u.total_presentes}
                      </span>
                    </td>

                    {/* Ausencias Sin Aviso */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-lg font-black text-xs ${
                        u.total_ausencias > 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-zinc-800/50 text-zinc-500'
                      }`}>
                        {u.total_ausencias}
                      </span>
                    </td>

                    {/* Indultos */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-lg font-black text-xs ${
                        u.total_justificadas > 0
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-zinc-800/50 text-zinc-500'
                      }`}>
                        {u.total_justificadas}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* Botón Ver Historial / Expediente */}
                        <button
                          onClick={() => abrirHistorial(u)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition border border-zinc-700 flex items-center gap-1.5 shadow-sm"
                          title="Ver todas las mesas y asistencias de este aventurero"
                        >
                          <span>📜</span> Expediente
                        </button>

                        {/* Botón Indulto Total Rápido (si tiene ausencias o está sancionado) */}
                        {(u.total_ausencias > 0 || u.esta_sancionado) && (
                          <button
                            onClick={() => aplicarIndultoTotal(u)}
                            className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-xs font-black transition border border-purple-500/40 flex items-center gap-1 shadow-sm"
                            title="Perdonar todas las inasistencias y habilitar de inmediato"
                          >
                            <span>👑</span> Indulto
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 MODAL DE EXPEDIENTE DETALLADO DE ASISTENCIA                            */}
      {/* ========================================================================= */}
      {modalUsuario && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-900 border border-purple-500/30 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            
            {/* Encabezado del Modal */}
            <div className="p-5 sm:p-6 bg-zinc-950/80 border-b border-zinc-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <AvatarUsuario nombre={modalUsuario.nombre} tamaño={52} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Expediente de {modalUsuario.nombre}
                    </h3>
                    {modalUsuario.esta_sancionado && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg text-[10px] font-black">
                        🚫 SANCIONADO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {modalUsuario.nombre_completo || modalUsuario.email} • Registro del Tribunal
                  </p>
                </div>
              </div>

              {/* Botón Cerrar */}
              <button
                onClick={cerrarModal}
                className="text-zinc-500 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 w-9 h-9 rounded-full flex items-center justify-center transition border border-zinc-700/60"
              >
                ✕
              </button>
            </div>

            {/* Resumen del Estado Disciplinario en el Modal */}
            <div className="px-5 sm:px-6 py-3 bg-zinc-950/40 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-zinc-400">
                  Presentes: <b className="text-emerald-400">{modalUsuario.total_presentes}</b>
                </span>
                <span className="text-zinc-400">
                  Faltas: <b className="text-red-400">{modalUsuario.total_ausencias}</b>
                </span>
                <span className="text-zinc-400">
                  Indultadas: <b className="text-purple-400">{modalUsuario.total_justificadas}</b>
                </span>
              </div>

              {/* Botón de Indulto Total dentro del Modal */}
              {modalUsuario.total_ausencias > 0 && (
                <button
                  onClick={() => aplicarIndultoTotal(modalUsuario)}
                  disabled={procesandoAccion}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-purple-950/50"
                >
                  <span>👑</span> Otorgar Indulto Total a este Aventurero
                </button>
              )}
            </div>

            {/* Contenido / Listado de Mesas */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {cargandoHistorial ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-zinc-400 text-xs">Cargando jornadas y asistencias...</p>
                </div>
              ) : historialUsuario.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  Este aventurero aún no registra inscripciones en mesas de juego.
                </div>
              ) : (
                historialUsuario.map((item) => (
                  <div
                    key={item.inscripcion_id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      item.asistencia === 'ausente'
                        ? 'bg-red-950/20 border-red-500/40 shadow-sm'
                        : item.asistencia === 'justificado'
                        ? 'bg-purple-950/15 border-purple-500/30'
                        : item.asistencia === 'presente'
                        ? 'bg-zinc-950/60 border-zinc-800'
                        : 'bg-zinc-900/60 border-zinc-800/80'
                    }`}
                  >
                    
                    {/* Datos de la Mesa */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-white text-sm truncate">
                          {item.partida_titulo}
                        </span>
                        {item.partida_sistema && (
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md text-[10px] font-bold">
                            {item.partida_sistema}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500">
                          Jornada: <b>{item.evento_nombre}</b> ({item.evento_fecha})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span>DM: <b className="text-zinc-200">{item.dm_nombre || 'Sin DM'}</b></span>
                        <span>Estado Evento: <b className="text-zinc-300 capitalize">{item.evento_estado}</b></span>
                      </div>
                    </div>

                    {/* Estado de Asistencia y Acción de Indulto */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      
                      {item.asistencia === 'ausente' ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl text-xs font-black flex items-center gap-1.5">
                            <span>🔴</span> Falta sin aviso (-1)
                          </span>
                          
                          {/* Botón para justificar ESTA falta */}
                          <button
                            onClick={() => justificarFalta(item)}
                            disabled={procesandoAccion}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm"
                            title="Justificar esta falta puntual y levantar su deshonor"
                          >
                            <span>⚖️</span> Indultar
                          </button>
                        </div>
                      ) : item.asistencia === 'justificado' ? (
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-black flex items-center gap-1.5">
                          <span>⚖️</span> Justificado / Indultado
                        </span>
                      ) : item.asistencia === 'presente' ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <span>🟢</span> Presente
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-xl text-xs font-bold">
                          ⏳ Pendiente
                        </span>
                      )}

                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Pie del modal */}
            <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
              <button
                onClick={cerrarModal}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default GestionSanciones;
