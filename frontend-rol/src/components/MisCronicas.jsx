import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 
import { io } from 'socket.io-client';
import Avatar from 'boring-avatars';
import { obtenerRangoDM } from '../utils/rangoHonor';
// ✨ Importamos el componente de la solicitud de DM
import SolicitudDM from './SolicitudDM';
import EvaluarMesaModal from './EvaluarMesaModal';

function MisCronicas({ alActualizarUsuario }) { 
  const [cronicas, setCronicas] = useState({ dirigiendo: [], jugando: [] });
  const [cargando, setCargando] = useState(true);
  const [honoresOtorgados, setHonoresOtorgados] = useState([]);
  
  const [usuarioGuardado, setUsuarioGuardado] = useState(JSON.parse(localStorage.getItem('usuario')));
  const [editando, setEditando] = useState(false);
  
  const [peticionEnviada, setPeticionEnviada] = useState(usuarioGuardado?.solicitudDmPendiente || false);
  const esJugadorBase = usuarioGuardado?.rol === 'jugador';
  
  // ✨ Estado para mostrar el modal de Solicitud de DM
  const [mostrarSolicitudDM, setMostrarSolicitudDM] = useState(false);
  const [partidaEvaluar, setPartidaEvaluar] = useState(null);
  
  const [perfil, setPerfil] = useState({ 
    nombre: usuarioGuardado?.nombre || '', 
    nombre_completo: usuarioGuardado?.nombre_completo || '', 
    email: usuarioGuardado?.email || '',
    avatar: usuarioGuardado?.avatar || 'guerrero',
    telegram_chat_id: usuarioGuardado?.telegram_chat_id || '',
    biografia: usuarioGuardado?.biografia || '',
    password: '' // ✨ AGREGADO: Campo para la nueva contraseña
  });

  const cargarCronicas = async () => {
    try {
      const [resCronicas, resHonor] = await Promise.all([
        fetchProtegido('/api/usuarios/mis-cronicas'),
        fetchProtegido('/api/usuarios/honor-otorgado')
      ]);
      const datosCronicas = await resCronicas.json();
      const datosHonor = await resHonor.json();
      
      setCronicas(datosCronicas);
      setHonoresOtorgados(datosHonor);
      setCargando(false);
    } catch (err) {
      if (err === 'Sesión expirada') return;
      console.error("Error cargando crónicas:", err);
    }
  };

  const darHonor = async (dmId, partidaId, dmNombre) => {
    const { value: mensaje, isConfirmed } = await Swal.fire({
      title: `¡Otorgar Honor! 🏆`,
      html: `¿Qué deseas destacar de <b>${dmNombre}</b>? <br><small class="text-zinc-400">El Master recibirá 1 Punto de Honor por esta aventura.</small>`,
      input: 'select',
      inputOptions: {
        '¡Mundo asombroso! La inmersión fue total y épica.': '🌍 ¡Mundo asombroso! La inmersión fue total y épica.',
        'Un director brillante. Las reglas fueron justas y divertidas.': '📜 Un director brillante. Las reglas fueron justas y divertidas.',
        '¡Qué giros en la trama! Me mantuvo al borde del asiento.': '🎭 ¡Qué giros en la trama! Me mantuvo al borde del asiento.',
        'Interpretación magistral de los NPCs. ¡Me creí todo!': '🗣️ Interpretación magistral de los NPCs. ¡Me creí todo!',
        'Excelente ritmo de partida. Ni muy lento, ni muy rápido.': '⏳ Excelente ritmo de partida. Ni muy lento, ni muy rápido.',
        'Combates épicos y desafiantes, sudé cada tirada de dados.': '⚔️ Combates épicos y desafiantes, sudé cada tirada.',
        'Creaste un espacio súper seguro y cómodo para rolear.': '🛡️ Creaste un espacio súper seguro y cómodo para rolear.',
        'Impresionante creatividad con los puzzles y misterios.': '🧩 Impresionante creatividad con los puzzles y misterios.',
        '¡La banda sonora y la ambientación fueron de otro nivel!': '🎶 ¡La banda sonora y la ambientación fueron de otro nivel!',
        'Mucha paciencia y dedicación, genial para jugadores nuevos.': '🎓 Mucha paciencia y dedicación, genial para jugadores.'
      },
      inputPlaceholder: 'Selecciona un elogio',
      showCancelButton: true,
      confirmButtonText: 'Otorgar Honor',
      cancelButtonText: 'Cancelar',
      background: '#09090b', color: '#fff', confirmButtonColor: '#10b981'
    });

    if (isConfirmed) {
      try {
        const res = await fetchProtegido('/api/usuarios/honor', {
          method: 'POST',
          body: JSON.stringify({ dm_id: dmId, partida_id: partidaId, mensaje })
        });
        if (res.ok) {
          Swal.fire({ title: '¡Honor Otorgado!', icon: 'success', background: '#09090b', color: '#fff', confirmButtonColor: '#10b981', timer: 2000, showConfirmButton: false });
          setHonoresOtorgados([...honoresOtorgados, partidaId]);
        } else {
          const data = await res.json();
          Swal.fire({ title: 'Error', text: data.error, icon: 'error', background: '#09090b', color: '#fff' });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const actualizarPerfilDesdeDB = () => {
    fetchProtegido('/api/usuarios/yo') 
      .then(res => res.json())
      .then(datosUsuario => {
         // Verificamos si cambió algo importante (rol, telegram, etc)
         const cambioRol = datosUsuario.rol !== usuarioGuardado.rol;
         const cambioTelegram = datosUsuario.telegram_chat_id !== usuarioGuardado.telegram_chat_id;
         
         if(cambioRol || cambioTelegram || !usuarioGuardado.telegram_chat_id) {
            const nuevoUsuario = { 
              ...usuarioGuardado, 
              rol: datosUsuario.rol, 
              telegram_chat_id: datosUsuario.telegram_chat_id,
              solicitudDmPendiente: false 
            };
            localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
            setUsuarioGuardado(nuevoUsuario);
            
            // ✨ REPARACIÓN CLAVE: Actualizamos también el formulario 'perfil'
            // para que no mande un valor vacío al grabar.
            setPerfil(prev => ({
              ...prev,
              telegram_chat_id: datosUsuario.telegram_chat_id || ''
            }));
            
            setPeticionEnviada(false); 
            if (alActualizarUsuario) alActualizarUsuario(nuevoUsuario);
         }
      })
      .catch(err => console.error("Error verificando usuario:", err));
  };

  useEffect(() => {
    cargarCronicas();

    const socket = io('/', { path: '/api/socket.io' });

    socket.on('actualizacion-mesas', () => {
      cargarCronicas();
    });

    socket.on('actualizacion-eventos', () => {
      cargarCronicas();
    });

    socket.on('actualizacion-usuarios', () => {
      actualizarPerfilDesdeDB();
    });

    return () => {
      socket.disconnect();
    };
  }, [usuarioGuardado.rol]); 

  const manejarCambioPerfil = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
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
        if (alActualizarUsuario) alActualizarUsuario(nuevoUsuario);
        
        // Limpiamos el campo del formulario
        setPerfil(prev => ({ ...prev, password: '' }));
        setEditando(false);
        
        Swal.fire({
          title: '¡Ficha Actualizada!',
          text: 'Tus datos han sido grabados en los registros del gremio.',
          icon: 'success',
          background: '#09090b', 
          color: '#fff',
          confirmButtonColor: '#10b981'
        });
      }
    } catch (error) {
      if (error === 'Sesión expirada') return;
      console.error(error);
    }
  };

  // ✨ Abrimos el modal con los términos y condiciones en lugar de enviar la petición directamente
  const enviarPeticionDM = () => {
    setMostrarSolicitudDM(true);
  };

  // ✨ Procesa la petición a la API tras aceptar los términos y condiciones
  const procesarPeticionDM = async () => {
    try {
      const res = await fetchProtegido('/api/usuarios/solicitar-dm', {
        method: 'POST'
      });
      
      if (res.ok) {
        setPeticionEnviada(true);
        const usuarioActualizado = { ...usuarioGuardado, solicitudDmPendiente: true };
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        setUsuarioGuardado(usuarioActualizado);
        if (alActualizarUsuario) alActualizarUsuario(usuarioActualizado);
        setMostrarSolicitudDM(false);
      }
    } catch (e) { 
      if (e !== 'Sesión expirada') console.error(e); 
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "Fecha Desconocida";
    try {
      const soloFecha = fechaStr.split('T')[0];
      const [anio, mes, dia] = soloFecha.split('-');
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${anio}`;
    } catch (error) {
      return "Fecha en el limbo";
    }
  };

  if (cargando) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-black animate-pulse uppercase tracking-widest text-xs">Consultando Archivos...</p>
      </div>
    </div>
  );

  const rango = usuarioGuardado?.rol === 'dm' ? obtenerRangoDM(usuarioGuardado.honor_total) : null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      
      {/* 📜 ENCABEZADO DE PERFIL */}
      <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        {editando ? (
          <div className="relative z-10 flex flex-col gap-8 animate-in zoom-in-95 duration-300">
            
            <div className="flex flex-col md:flex-row items-center gap-6 bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-800/50 mb-6">
              <div className="w-24 h-24 rounded-full shadow-2xl overflow-hidden shrink-0">
                  <Avatar
                    size="100%"
                    name={perfil.nombre}
                    variant="beam"
                    colors={['#10b981', '#059669', '#34d399', '#065f46', '#047857']}
                  />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Retrato Dinámico</h4>
                <p className="text-zinc-400 text-sm mt-1">Tu avatar se forja mágicamente usando la energía de tu alias. <b>¡Cambia tu Alias abajo y verás cómo tu retrato se transforma en vivo!</b> 🎨✨</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Nombre en los registros (Alias)</label>
                <input name="nombre" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 md:py-4 md:px-6 text-white focus:border-emerald-500 outline-none transition-all font-bold" value={perfil.nombre} onChange={manejarCambioPerfil} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Mensajería (Email)</label>
                <input name="email" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 md:py-4 md:px-6 text-white focus:border-emerald-500 outline-none transition-all font-mono" value={perfil.email} onChange={manejarCambioPerfil} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> 
                Tu Historia (Biografía)
              </label>
              <textarea 
                name="biografia" 
                rows="3"
                placeholder="Cuenta al gremio quién eres, qué juegos diriges o qué tipo de aventuras buscas..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 md:py-4 md:px-6 text-white focus:border-amber-500 outline-none transition-all font-bold resize-none" 
                value={perfil.biografia} 
                onChange={manejarCambioPerfil} 
              />
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 md:py-4 md:px-6 text-white focus:border-emerald-500 outline-none transition-all font-bold" 
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 md:py-4 md:px-6 text-white focus:border-amber-500 outline-none transition-all font-bold" 
                  value={perfil.password} 
                  onChange={manejarCambioPerfil} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></span> 
                  Vinculación con Telegram
                </label>
                
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold">Recibe notificaciones en tu móvil</h4>
                    <p className="text-zinc-400 text-xs mt-1">Conecta tu cuenta para recibir avisos de tus mesas, cancelaciones o inscripciones.</p>
                  </div>
                  
                  {usuarioGuardado?.telegram_chat_id ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-400 text-sm font-bold flex items-center gap-2">
                      ✅ Cuenta Vinculada
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                      <a 
                        href="https://t.me/+VctZXScrUAgxYTVh" 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-zinc-800 hover:bg-zinc-700 text-[#24A1DE] border border-zinc-700 px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-black tracking-wide transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        📢 1. Unirse al Canal
                      </a>
                      <a 
                        href={`https://t.me/CuervosMensajeros_bot?start=${usuarioGuardado?.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-[#24A1DE] hover:bg-[#1d8ec5] text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-black tracking-wide transition-all shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        2. Activar Notificaciones
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button onClick={guardarPerfil} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-900/20">Grabar Ficha</button>
              <button onClick={() => setEditando(false)} className="px-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all">Descartar</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8 w-full max-w-full overflow-hidden">
                <div className="relative group shrink-0">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/40 transition-all"></div>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl relative z-10 overflow-hidden">
                        <Avatar
                          size="100%"
                          name={perfil.nombre}
                          variant="beam"
                          colors={['#10b981', '#059669', '#34d399', '#065f46', '#047857']}
                        />
                    </div>
                </div>
                <div className="flex flex-col items-center md:items-start max-w-full min-w-0">
                  <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic w-full truncate" title={perfil.nombre}>{perfil.nombre}</p>
                  
                  {perfil.nombre_completo && (
                    <p className="text-zinc-400 font-bold text-xs sm:text-sm tracking-wide mb-2 flex items-center justify-center md:justify-start gap-2 w-full truncate">
                      📜 <span className="truncate">{perfil.nombre_completo}</span>
                    </p>
                  )}
                  {perfil.biografia && (
                    <p className="text-zinc-300 italic text-sm mt-1 mb-4 border-l-2 border-emerald-500/50 pl-3">
                      "{perfil.biografia}"
                    </p>
                  )}

                  {usuarioGuardado?.rol === 'admin' ? (
                    <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2 w-full truncate">👑 Administrador</p>
                  ) : usuarioGuardado?.rol === 'dm' ? (
                    <div className="flex flex-wrap items-center gap-2 mb-2 w-full">
                      <span className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em]">🛡️ Dungeon Master</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full hidden sm:block"></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest bg-black/30 px-2 py-1 rounded-md border border-zinc-800 ${rango?.colorClase}`}>
                        {rango?.icono} Rango {rango?.nombre} ({usuarioGuardado.honor_total || 0})
                      </span>
                    </div>
                  ) : (
                    <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2 w-full truncate">⚔️ Aventurero</p>
                  )}
                  <p className="text-zinc-500 font-mono text-xs sm:text-sm w-full truncate">{perfil.email}</p>
                  {usuarioGuardado?.telegram_chat_id ? (
                    <p className="text-emerald-500 font-bold text-xs mt-2 flex items-center gap-2 select-none">
                      🤖 Cuenta vinculada ✅
                    </p>
                  ) : (
                    <p className="text-red-500 font-bold text-[11px] mt-2 flex items-center gap-2 select-none">
                      ❌ Cuenta no vinculada
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
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.evento_nombre}</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                      <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">{formatearFecha(p.evento_fecha)}</span>
                    </div>
                    
                    {p.etiqueta !== 'Juegos de Mesa' && p.etiqueta !== 'Escape Room' && (
                        <button onClick={() => setPartidaEvaluar(p)} className="text-[10px] font-bold text-zinc-400 hover:text-emerald-400 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-all border border-zinc-700 hover:border-emerald-500/50 flex items-center gap-1.5 shadow-lg">
                          <span className="text-sm">⭐</span> <span className="hidden sm:inline">Evaluar Mesa</span>
                        </button>
                      )}
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
      {partidaEvaluar && ( <EvaluarMesaModal partida={partidaEvaluar} cerrar={() => setPartidaEvaluar(null)} usuarioActualId={usuarioGuardado.id} /> )} 
      {mostrarSolicitudDM && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-[2.5rem]">
            {/* Botón para cerrar el modal si el usuario lo desea */}
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