import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import SolicitudDM from './SolicitudDM'; 
import { fetchProtegido } from '../utils/api';

const AVATARES = ['guerrero', 'mago', 'ladron', 'clerigo', 'bardo', 'explorador', 'nigromante', 'paladin'];

const CONFIG_AVATARES = {
  guerrero: { emoji: '🛡️', nombre: 'Guerrero' },
  mago: { emoji: '🔮', nombre: 'Mago' },
  ladron: { emoji: '🗡️', nombre: 'Pícaro' },
  clerigo: { emoji: '✨', nombre: 'Clérigo' },
  bardo: { emoji: '🎵', nombre: 'Bardo' },
  explorador: { emoji: '🏹', nombre: 'Explorador' },
  nigromante: { emoji: '💀', nombre: 'Nigromante' },
  paladin: { emoji: '⚔️', nombre: 'Paladín' }
};

function MisCronicas({ alActualizarUsuario }) {
  const [usuarioGuardado, setUsuarioGuardado] = useState(JSON.parse(localStorage.getItem('usuario')));
  
  const [perfil, setPerfil] = useState({ 
    nombre: usuarioGuardado?.nombre || '', 
    nombre_completo: usuarioGuardado?.nombre_completo || '', 
    email: usuarioGuardado?.email || '',
    avatar: usuarioGuardado?.avatar || 'guerrero',
    telegram_chet_id: usuarioGuardado?.telegram_chet_id || '',
    password: '' // ✨ AGREGADO: Campo para la nueva contraseña
  });

  const [cronicas, setCronicas] = useState({ jugando: [], dirigiendo: [] });
  const [editando, setEditando] = useState(false);
  const [cargandoCronicas, setCargandoCronicas] = useState(true);
  const [peticionEnviada, setPeticionEnviada] = useState(usuarioGuardado?.solicitudDmPendiente || false);

  // Nuevo estado para controlar la visibilidad del modal del reglamento
  const [mostrarSolicitudDM, setMostrarSolicitudDM] = useState(false);

  useEffect(() => {
    actualizarPerfilDesdeDB();
    cargarCronicas();
  }, []);

  const actualizarPerfilDesdeDB = () => {
    fetchProtegido('/api/usuarios/yo') 
      .then(res => res.json())
      .then(datosUsuario => {
         if(datosUsuario.rol !== usuarioGuardado.rol || datosUsuario.telegram_chet_id !== usuarioGuardado.telegram_chet_id) {
            const nuevoUsuario = { 
              ...usuarioGuardado, 
              rol: datosUsuario.rol, 
              telegram_chet_id: datosUsuario.telegram_chet_id,
              solicitudDmPendiente: false 
            };
            localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
            setUsuarioGuardado(nuevoUsuario);
            setPerfil(prev => ({ 
              ...prev, 
              telegram_chet_id: datosUsuario.telegram_chet_id || '' 
            }));
            setPeticionEnviada(false); 
            if (alActualizarUsuario) alActualizarUsuario(nuevoUsuario);
         }
      })
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  };

  const cargarCronicas = () => {
    setCargandoCronicas(true);
    fetchProtegido('/api/partidas/cronicas/mis-partidas')
      .then(res => res.json())
      .then(data => { setCronicas(data); setCargandoCronicas(false); })
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); setCargandoCronicas(false); });
  };

  const manejarCambioPerfil = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const seleccionarAvatar = (av) => {
    setPerfil({ ...perfil, avatar: av });
  };

  const guardarPerfil = async () => {
    try {
      const res = await fetchProtegido('/api/usuarios/perfil', {
        method: 'PUT',
        body: JSON.stringify(perfil)
      });
      
      if (res.ok) {
        const nuevoUsuario = { ...usuarioGuardado, ...perfil };
        
        // ✨ SEGURIDAD: Borramos la contraseña antes de guardar en el navegador
        delete nuevoUsuario.password;

        localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
        setUsuarioGuardado(nuevoUsuario);
        setEditando(false);
        if (alActualizarUsuario) alActualizarUsuario(nuevoUsuario);

        Swal.fire({
          title: 'Ficha Guardada',
          text: 'Tus datos de aventurero han sido actualizados en los anales del gremio.',
          icon: 'success',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#10b981'
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          title: 'Error de Escritura',
          text: errorData.error || 'La base de datos rechazó el pergamino.',
          icon: 'error',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) { if (err !== 'Sesión expirada') console.error(err); }
  };

  // Se encarga de abrir el modal en lugar de enviar la petición directamente
  const enviarPeticionDM = () => {
    setMostrarSolicitudDM(true);
  };

  // Callback que se ejecuta cuando el modal SolicitudDM.jsx es aprobado por el usuario
  const procesarPeticionDM = async () => {
    try {
      const res = await fetchProtegido('/api/usuarios/solicitar-dm', { method: 'POST' });
      if (res.ok) {
        setPeticionEnviada(true);
        const nuevoUsuario = { ...usuarioGuardado, solicitudDmPendiente: true };
        localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
        setUsuarioGuardado(nuevoUsuario);
        
        // Cerramos el modal una vez completado
        setMostrarSolicitudDM(false);

        Swal.fire({
          title: 'Petición Presentada',
          text: 'Tu solicitud de rango ha sido elevada al Senado de Administradores.',
          icon: 'success',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#a855f7'
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          title: 'Petición Denegada',
          text: errorData.error || 'Tu petición no pudo ser entregada.',
          icon: 'warning',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#f59e0b'
        });
      }
    } catch (err) { if (err !== 'Sesión expirada') console.error(err); }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const esJugadorBase = usuarioGuardado?.rol === 'jugador' || usuarioGuardado?.rol === 'aventurero';

  return (
    <div className="space-y-12">
      {/* 🔮 PERFIL GENERAL */}
      <section className="bg-zinc-900/40 p-8 md:p-12 rounded-[2.5rem] border border-zinc-800 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        {editando ? (
          <div className="space-y-8 relative z-10">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Reescribir Ficha de Personaje</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Nombre en los registros (Alias)</label>
                <input name="nombre" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-emerald-500 outline-none transition-all font-bold" value={perfil.nombre} onChange={manejarCambioPerfil} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Mensajería (Email)</label>
                <input name="email" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-emerald-500 outline-none transition-all font-mono" value={perfil.email} onChange={manejarCambioPerfil} />
              </div>
            </div>

            {/* ✨ ZONA DE CONTRASEÑA Y TELEGRAM AGREGADOS AQUÍ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> 
                  Nombre Real (Requerido para Certificados)
                </label>
                <input 
                  name="nombre_completo" 
                  placeholder="Ej: Bilbo Bolsón" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-emerald-500 outline-none transition-all font-bold" 
                  value={perfil.nombre_completo} 
                  onChange={manejarCambioPerfil} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> 
                  Nueva Contraseña (Opcional)
                </label>
                <input 
                  type="password"
                  name="password" 
                  placeholder="Dejar vacío para no cambiarla" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-amber-500 outline-none transition-all font-bold" 
                  value={perfil.password} 
                  onChange={manejarCambioPerfil} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></span> 
                  ID de Telegram (para notificaciones)
                </label>
                <input 
                  name="telegram_chet_id" 
                  placeholder="Ej: 123456789" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-sky-500 outline-none transition-all font-mono" 
                  value={perfil.telegram_chet_id} 
                  onChange={manejarCambioPerfil} 
                />
                <p className="text-[9px] text-zinc-500 italic ml-2 mt-1">
                  Obtén tu ID escribiendo al bot <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">@userinfobot</a>.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button onClick={guardarPerfil} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-900/20">Grabar Ficha</button>
              <button onClick={() => setEditando(false)} className="px-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all">Descartar</button>
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-800/80">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 block">Retrato del Aventurero (Avatar)</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                {AVATARES.map(av => (
                  <button 
                    key={av} 
                    onClick={() => seleccionarAvatar(av)}
                    type="button" 
                    className={`aspect-square text-3xl rounded-2xl flex items-center justify-center transition-all border ${perfil.avatar === av ? 'bg-emerald-500/20 border-emerald-500 scale-105 shadow-lg shadow-emerald-900/10' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                    title={CONFIG_AVATARES[av].nombre}
                  >
                    {CONFIG_AVATARES[av].emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div className="flex items-center gap-6 min-w-0">
                <div className="shrink-0 w-24 h-24 bg-zinc-950 border border-zinc-800 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative">
                  {CONFIG_AVATARES[perfil.avatar]?.emoji || '🛡️'}
                </div>
                <div className="min-w-0">
                  <p className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{perfil.nombre}</p>
                  
                  {perfil.nombre_completo && (
                    <p className="text-zinc-400 font-bold text-sm tracking-wide mb-2 flex items-center gap-2">
                      📜 {perfil.nombre_completo}
                    </p>
                  )}

                  <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">{usuarioGuardado?.rol === 'admin' ? '👑 Administrador' : usuarioGuardado?.rol === 'dm' ? '🛡️ Dungeon Master' : '⚔️ Aventurero'}</p>
                  <p className="text-zinc-500 font-mono text-sm">{perfil.email}</p>
                  {usuarioGuardado?.telegram_chet_id ? (
                    <p className="text-sky-400 font-bold text-xs mt-2 flex items-center gap-2 select-none">
                      🤖 Telegram Vinculado (ID: {usuarioGuardado.telegram_chet_id})
                    </p>
                  ) : (
                    <p className="text-zinc-500 italic text-[11px] mt-2 flex items-center gap-2 select-none">
                      ⚠️ Telegram no vinculado (edita tu perfil para recibir alertas)
                    </p>
                  )}
                </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-50">
              <button onClick={() => setEditando(true)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 shadow-xl">
                ✏️ Editar Perfil
              </button>
              
              {esJugadorBase && (
                peticionEnviada ? (
                  <div className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center animate-pulse">
                    ⏳ Evaluación en curso...
                  </div>
                ) : (
                  <button onClick={enviarPeticionDM} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 transition-all active:scale-95">
                    🧙‍♂️ Pedir Rango DM
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/* ⚔️ LISTADO DE CRÓNICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* JUGANDO */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Jugando</h3>
            <span className="h-px flex-grow bg-emerald-500/20"></span>
            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-xs font-black">{cronicas.jugando.length}</span>
          </div>
          
          <div className="grid gap-4">
            {cronicas.jugando.length === 0 ? (
              <p className="text-zinc-600 italic text-sm py-4 border-2 border-dashed border-zinc-900 rounded-3xl text-center">Aún no has participado en ninguna mesa...</p>
            ) : (
              cronicas.jugando.map(p => (
                <div key={p.id} className="group bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl hover:border-emerald-500/30 transition-all hover:bg-zinc-900">
                  <h4 className="font-black text-lg text-white group-hover:text-emerald-400 transition-colors uppercase italic leading-tight">{p.titulo}</h4>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.evento_nombre}</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                    <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">{formatearFecha(p.evento_fecha)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* DIRIGIENDO */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Dirigiendo</h3>
            <span className="h-px flex-grow bg-amber-500/20"></span>
            <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-xs font-black">{cronicas.dirigiendo.length}</span>
          </div>
          
          <div className="grid gap-4">
            {cronicas.dirigiendo.length === 0 ? (
              <p className="text-zinc-600 italic text-sm py-4 border-2 border-dashed border-zinc-900 rounded-3xl text-center">No has convocado ninguna aventura aún...</p>
            ) : (
              cronicas.dirigiendo.map(p => (
                <div key={p.id} className="group bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl hover:border-amber-500/30 transition-all hover:bg-zinc-900">
                  <h4 className="font-black text-lg text-white group-hover:text-amber-400 transition-colors uppercase italic leading-tight">{p.titulo}</h4>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.evento_nombre}</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                    <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">{formatearFecha(p.evento_fecha)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ✨ Renderizamos el modal si se solicita el rango de DM */}
      {mostrarSolicitudDM && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-[2.5rem]">
            <button 
              onClick={() => setMostrarSolicitudDM(false)} 
              className="absolute top-4 right-4 z-[210] text-zinc-500 hover:text-white bg-zinc-900 w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center transition-colors shadow-lg"
            >
              ✕
            </button>
            <SolicitudDM onCompletado={procesarPeticionDM} />
          </div>
        </div>
      )}

    </div>
  );
}

export default MisCronicas;