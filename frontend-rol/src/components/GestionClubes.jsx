import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { fetchProtegido } from '../utils/api';

function GestionClubes() {
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [clubSeleccionado, setClubSeleccionado] = useState(null);
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState({});

  const cargarClubes = async () => {
    setCargando(true);
    try {
      const res = await fetchProtegido('/api/clubes');
      if (res.ok) {
        const data = await res.json();
        setClubes(data);
      }
    } catch (err) {
      console.error('Error al cargar clubes:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await fetchProtegido('/api/usuarios?limit=1000');
      if (res.ok) {
        const data = await res.json();
        const lista = data.datos ? data.datos : (Array.isArray(data) ? data : []);
        setUsuariosDisponibles(lista);
      }
    } catch (err) {
      console.error('Error al cargar usuarios para asignación:', err);
    }
  };

  useEffect(() => {
    cargarClubes();
    cargarUsuarios();

    const socket = io('/', { path: '/api/socket.io' });
    socket.on('actualizacion-clubes', cargarClubes);

    return () => socket.disconnect();
  }, []);

  // ➕ MODAL PARA CREAR UN NUEVO CLUB
  const abrirModalCrearClub = async () => {
    const { value: formValues } = await Swal.fire({
      title: '🏛️ Forjar Nueva Comunidad',
      html: `
        <div class="text-left text-xs space-y-3 text-zinc-300">
          <p class="text-zinc-400">Crea un espacio independiente para que un club o agrupación gestione sus propias jornadas de rol sin mezclarse con otras comunidades.</p>
          
          <div>
            <label class="block font-black text-amber-400 uppercase text-[10px] mb-1">Nombre de la Agrupación / Club *</label>
            <input id="swal-nombre" class="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500" placeholder="Ej: Club de Rol Merlo San Luis">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-black text-zinc-400 uppercase text-[10px] mb-1">Ciudad *</label>
              <input id="swal-ciudad" class="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500" placeholder="Ej: Merlo">
            </div>
            <div>
              <label class="block font-black text-zinc-400 uppercase text-[10px] mb-1">Provincia *</label>
              <input id="swal-provincia" class="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500" placeholder="Ej: San Luis">
            </div>
          </div>

          <div>
            <label class="block font-black text-zinc-400 uppercase text-[10px] mb-1">Enlace a WhatsApp del Club (Opcional)</label>
            <input id="swal-whatsapp" class="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500" placeholder="https://chat.whatsapp.com/...">
          </div>

          <div>
            <label class="block font-black text-zinc-400 uppercase text-[10px] mb-1">Historia / Sobre Nosotros (Opcional)</label>
            <textarea id="swal-historia" rows="3" class="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500 resize-none" placeholder="Breve historia del club, dónde juegan, etc..."></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '⚔️ Forjar Espacio',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#27272a',
      background: '#09090b',
      color: '#fff',
      customClass: { popup: 'border border-purple-500/30 rounded-3xl' },
      preConfirm: () => {
        const nombre = document.getElementById('swal-nombre').value.trim();
        const ciudad = document.getElementById('swal-ciudad').value.trim();
        const provincia = document.getElementById('swal-provincia').value.trim();
        const whatsapp_url = document.getElementById('swal-whatsapp').value.trim();
        const historia = document.getElementById('swal-historia').value.trim();

        if (!nombre || !ciudad || !provincia) {
          Swal.showValidationMessage('El nombre, la ciudad y la provincia son obligatorios.');
          return false;
        }

        return { nombre, ciudad, provincia, whatsapp_url, historia };
      }
    });

    if (formValues) {
      try {
        const res = await fetchProtegido('/api/clubes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear la comunidad');

        Swal.fire({
          title: '¡Comunidad Forjada!',
          text: `El espacio "${formValues.nombre}" fue creado exitosamente. Ya puedes designar a sus administradores locales.`,
          icon: 'success',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#10b981'
        });

        cargarClubes();
      } catch (err) {
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
          background: '#09090b',
          color: '#fff'
        });
      }
    }
  };

  // ✏️ ABRIR MODAL PARA EDITAR IDENTIDAD
  const abrirEditarClub = (club) => {
    setClubSeleccionado(club);
    setDatosEdicion({
      nombre: club.nombre || '',
      ciudad: club.ciudad || '',
      provincia: club.provincia || '',
      descripcion: club.descripcion || '',
      historia: club.historia || '',
      foto_grupal: club.foto_grupal || '',
      whatsapp_url: club.whatsapp_url || '',
      instagram_url: club.instagram_url || ''
    });
    setModalEditarAbierto(true);
  };

  const guardarEdicionClub = async (e) => {
    e.preventDefault();
    if (!clubSeleccionado) return;

    try {
      const res = await fetchProtegido(`/api/clubes/${clubSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEdicion)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la información');

      Swal.fire({
        title: '¡Identidad Actualizada!',
        text: 'Los anales y datos de la comunidad fueron grabados con éxito.',
        icon: 'success',
        background: '#09090b',
        color: '#fff',
        confirmButtonColor: '#10b981'
      });

      setModalEditarAbierto(false);
      cargarClubes();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        background: '#09090b',
        color: '#fff'
      });
    }
  };

  // 👑 ABRIR MODAL DE ADMINISTRADORES
  const abrirGestionAdmins = async (club) => {
    setClubSeleccionado(club);
    try {
      const res = await fetchProtegido(`/api/clubes/${club.id}`);
      if (res.ok) {
        const detalle = await res.json();
        setClubSeleccionado(detalle);
        setModalAdminAbierto(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const asignarAdminAClub = async (usuarioId) => {
    if (!clubSeleccionado) return;

    try {
      const res = await fetchProtegido(`/api/clubes/${clubSeleccionado.id}/asignar-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo asignar el administrador');

      Swal.fire({
        title: '¡Administrador Nombrado!',
        text: data.mensaje,
        icon: 'success',
        background: '#09090b',
        color: '#fff',
        confirmButtonColor: '#10b981'
      });

      abrirGestionAdmins(clubSeleccionado);
      cargarClubes();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        background: '#09090b',
        color: '#fff'
      });
    }
  };

  const revocarAdminDeClub = async (usuarioId) => {
    if (!clubSeleccionado) return;

    const result = await Swal.fire({
      title: '¿Revocar Rango de Admin?',
      text: 'Este usuario volverá al rango de jugador base.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, revocar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#27272a',
      background: '#09090b',
      color: '#fff'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetchProtegido(`/api/clubes/${clubSeleccionado.id}/revocar-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo revocar el rango');

      abrirGestionAdmins(clubSeleccionado);
      cargarClubes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 🧭 ENCABEZADO DE SUPERADMIN */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-lg text-[10px] font-black uppercase tracking-widest">
              ⚡ Exclusivo Superadmin
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3 mt-1">
            <span>🏛️</span> Alianza de Clubes y Comunidades
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Gestiona los espacios independientes para que otras agrupaciones lúdicas del país (como Merlo, San Luis) tengan su propia casa digital sin interferir con La Pampa.
          </p>
        </div>

        <button
          onClick={abrirModalCrearClub}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-950/50 flex items-center gap-2 active:scale-95 shrink-0"
        >
          <span>➕</span> Forjar Nueva Comunidad
        </button>
      </div>

      {/* 📜 GRILLA DE CLUBES ACTIVOS */}
      {cargando ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 font-bold text-sm">Consultando las fortalezas del reino...</p>
        </div>
      ) : clubes.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center">
          <span className="text-5xl block mb-3">🏛️</span>
          <h4 className="text-white font-black text-lg">No hay comunidades registradas</h4>
          <p className="text-zinc-400 text-xs mt-1">Presiona el botón superior para crear el primer espacio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubes.map((club) => (
            <div
              key={club.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between gap-5 relative overflow-hidden ${
                club.id === 1
                  ? 'bg-gradient-to-br from-amber-950/20 via-zinc-900/90 to-zinc-950 border-amber-500/40 shadow-xl shadow-amber-950/20'
                  : 'bg-gradient-to-br from-purple-950/15 via-zinc-900/80 to-zinc-950 border-purple-500/30 shadow-lg'
              }`}
            >
              <div>
                
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md text-[10px] font-black uppercase tracking-wider">
                      📍 {club.ciudad}, {club.provincia}
                    </span>
                    {club.id === 1 && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-md text-[10px] font-black uppercase">
                        ⭐ Sede Fundadora
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-500 text-xs font-mono">
                    /{club.slug}
                  </span>
                </div>

                {/* Nombre y descripción */}
                <h4 className="text-xl font-black text-white tracking-tight">
                  {club.nombre}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {club.descripcion || club.historia || 'Comunidad lúdica de rol y juegos de mesa.'}
                </p>

                {/* Métricas rápidas del Club */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-800/80 text-center">
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 font-black uppercase block">Jornadas</span>
                    <span className="text-sm font-black text-emerald-400">⚔️ {club.total_eventos || 0}</span>
                  </div>
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 font-black uppercase block">Miembros</span>
                    <span className="text-sm font-black text-cyan-400">👥 {club.total_usuarios || 0}</span>
                  </div>
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 font-black uppercase block">Admins</span>
                    <span className="text-sm font-black text-amber-400">👑 {club.total_admins || 0}</span>
                  </div>
                </div>

              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
                <button
                  onClick={() => abrirEditarClub(club)}
                  className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-zinc-700"
                >
                  <span>✏️</span> Editar Identidad
                </button>
                <button
                  onClick={() => abrirGestionAdmins(club)}
                  className="flex-1 py-2 px-3 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border border-purple-500/40"
                >
                  <span>👑</span> Administradores ({club.total_admins || 0})
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ MODAL EDITAR IDENTIDAD Y SOBRE NOSOTROS                                 */}
      {/* ========================================================================= */}
      {modalEditarAbierto && clubSeleccionado && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-black text-white flex items-center gap-2">
                  <span>✏️</span> Identidad de "{clubSeleccionado.nombre}"
                </h4>
                <p className="text-xs text-zinc-400">Personaliza la foto, historia y redes de esta comunidad.</p>
              </div>
              <button 
                onClick={() => setModalEditarAbierto(false)} 
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarEdicionClub} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-zinc-400 uppercase text-[10px] mb-1">Nombre Oficial</label>
                  <input
                    type="text"
                    value={datosEdicion.nombre}
                    onChange={(e) => setDatosEdicion({ ...datosEdicion, nombre: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-black text-zinc-400 uppercase text-[10px] mb-1">Localidad y Provincia</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Ciudad"
                      value={datosEdicion.ciudad}
                      onChange={(e) => setDatosEdicion({ ...datosEdicion, ciudad: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Provincia"
                      value={datosEdicion.provincia}
                      onChange={(e) => setDatosEdicion({ ...datosEdicion, provincia: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-black text-zinc-400 uppercase text-[10px] mb-1">Descripción Breve</label>
                <input
                  type="text"
                  value={datosEdicion.descripcion}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, descripcion: e.target.value })}
                  placeholder="Ej: Agrupación lúdica de las sierras de San Luis."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-black text-amber-400 uppercase text-[10px] mb-1">📸 URL de Foto Grupal / Portada del Club</label>
                <input
                  type="text"
                  value={datosEdicion.foto_grupal}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, foto_grupal: e.target.value })}
                  placeholder="https://... o /assets/FotoGrupal.png"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-mono text-[11px]"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Esta foto aparecerá en la sección "Sobre Nosotros" cuando visiten este club.</p>
              </div>

              <div>
                <label className="block font-black text-zinc-400 uppercase text-[10px] mb-1">📜 Su Historia / Sobre Nosotros</label>
                <textarea
                  rows="4"
                  value={datosEdicion.historia}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, historia: e.target.value })}
                  placeholder="Cuenta cómo nació la comunidad, cuántos miembros son y su pasión por el rol..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-emerald-400 uppercase text-[10px] mb-1">Grupo de WhatsApp Oficial</label>
                  <input
                    type="text"
                    value={datosEdicion.whatsapp_url}
                    onChange={(e) => setDatosEdicion({ ...datosEdicion, whatsapp_url: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-black text-pink-400 uppercase text-[10px] mb-1">Instagram del Club</label>
                  <input
                    type="text"
                    value={datosEdicion.instagram_url}
                    onChange={(e) => setDatosEdicion({ ...datosEdicion, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-purple-950/50"
                >
                  💾 Grabar Cambios
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👑 MODAL GESTIÓN DE ADMINISTRADORES DEL CLUB                               */}
      {/* ========================================================================= */}
      {modalAdminAbierto && clubSeleccionado && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] bg-zinc-900 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-black text-white flex items-center gap-2">
                  <span>👑</span> Administradores de "{clubSeleccionado.nombre}"
                </h4>
                <p className="text-xs text-zinc-400">Designa qué usuarios tendrán autoridad local para este club.</p>
              </div>
              <button 
                onClick={() => setModalAdminAbierto(false)} 
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Administradores actuales */}
              <div>
                <h5 className="font-black text-zinc-400 uppercase text-[10px] tracking-wider mb-2">
                  Líderes Actuales ({clubSeleccionado.administradores?.length || 0})
                </h5>

                {(!clubSeleccionado.administradores || clubSeleccionado.administradores.length === 0) ? (
                  <p className="text-xs italic text-zinc-500 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
                    Esta comunidad aún no tiene un administrador local asignado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clubSeleccionado.administradores.map((admin) => (
                      <div key={admin.id} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm">{admin.nombre}</span>
                            <span className="px-2 py-0.2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[9px] font-black uppercase">
                              {admin.rol}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500">{admin.email}</p>
                        </div>

                        {admin.rol !== 'superadmin' && (
                          <button
                            onClick={() => revocarAdminDeClub(admin.id)}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition"
                            title="Revocar rango de administrador"
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selector para nombrar nuevo administrador */}
              <div className="pt-4 border-t border-zinc-800">
                <h5 className="font-black text-amber-400 uppercase text-[10px] tracking-wider mb-2">
                  Nombrar Nuevo Administrador
                </h5>
                <p className="text-[11px] text-zinc-400 mb-3">
                  Selecciona a un aventurero registrado para ascenderlo a Administrador oficial de este club.
                </p>

                <div className="flex gap-2">
                  <select
                    id="select-nuevo-admin"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-purple-500"
                  >
                    <option value="">Seleccionar aventurero...</option>
                    {usuariosDisponibles
                      .filter(u => !clubSeleccionado.administradores?.some(a => a.id === u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.nombre_completo || u.email})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => {
                      const sel = document.getElementById('select-nuevo-admin');
                      if (sel && sel.value) asignarAdminAClub(sel.value);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    Asignar
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default GestionClubes;
