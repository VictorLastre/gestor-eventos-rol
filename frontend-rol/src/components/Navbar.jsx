import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { fetchProtegido } from '../utils/api';
import LogoSVG from '../assets/Logo.svg'; 
import { io } from 'socket.io-client';

// ✨ IMPORTAMOS EL NUEVO COMPONENTE DE AVATARES
import AvatarUsuario from '../components/AvatarUsuario'; 

function Navbar({ usuario, alCerrarSesion, setVista }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarCampana, setMostrarCampana] = useState(false);
  const [noLeidosBuzon, setNoLeidosBuzon] = useState(0);
  const dropdownRef = useRef(null); 

  const esAdmin = usuario?.rol === 'admin';

  const cargarNotificaciones = () => {
    if (usuario) {
      fetchProtegido('/api/usuarios/notificaciones')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setNotificaciones(data);
        })
        .catch(err => {
          if (err !== 'Sesión expirada') console.error('Error con los cuervos:', err);
        });
    }
  };

  const cargarBuzon = () => {
    if (esAdmin) {
      fetchProtegido('/api/buzon')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNoLeidosBuzon(data.filter(m => !m.leido).length);
          }
        })
        .catch(err => {
          if (err !== 'Sesión expirada') console.error('Error con el buzón:', err);
        });
    }
  };

  useEffect(() => {
    cargarNotificaciones();
    cargarBuzon();

    const socket = io('/', { path: '/api/socket.io' });

    socket.on('actualizacion-usuarios', () => {
      cargarNotificaciones();
    });
    
    socket.on('actualizacion-mesas', () => {
      cargarNotificaciones();
    });

    socket.on('nuevo-mensaje-buzon', () => {
      cargarBuzon();
    });
    
    socket.on('actualizacion-buzon', () => {
      cargarBuzon();
    });

    return () => {
      socket.disconnect();
    };
  }, [usuario]); 

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarCampana(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const marcarComoLeida = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetchProtegido(`/api/usuarios/notificaciones/${id}/leida`, {
        method: 'PUT'
      });
      if (res.ok) {
        setNotificaciones(notificaciones.filter(n => n.id !== id));
      }
    } catch (err) {
      if (err !== 'Sesión expirada') console.error(err);
    }
  };

  const confirmarCierreSesion = () => {
    Swal.fire({
      title: '¿Abandonar la Taberna?',
      text: "Tus aventuras te estarán esperando cuando regreses del mundo real.",
      icon: 'question',
      showCancelButton: true,
      background: '#09090b',
      color: '#fff',
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#27272a', 
      confirmButtonText: '🚪 Salir del portal',
      cancelButtonText: 'Quedarme a beber',
      customClass: {
        popup: 'border border-zinc-800 rounded-[2rem]'
      }
    }).then((result) => {
      if (result.isConfirmed) alCerrarSesion();
    });
  };

  const fundadores = ['mati', 'martín', 'martin', 'delo', 'keith', 'guille', 'diny', 'sterbern'];
  const esFundador = usuario?.nombre ? fundadores.includes(usuario.nombre.toLowerCase()) : false;

  const formatearFechaMini = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <nav className="bg-zinc-950/90 border-b border-zinc-800/80 px-4 md:px-6 py-3 md:py-4 mb-6 md:mb-8 sticky top-0 z-[100] backdrop-blur-xl shadow-2xl transition-all">
      {/* ✨ RESTRUCTURACIÓN RESPONSIVA MAGISTRAL ✨ */}
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* ROW 1: Logo & Actions */}
        <div className="flex items-center justify-between w-full">
        
        {/* LOGO (Orden 1 en todas las pantallas) */}
        <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0" onClick={() => setVista('eventos')}>
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img src={LogoSVG} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] relative z-10" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-tighter italic">Asociación de Rol</span>
            <span className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">La Pampa</span>
          </div>
        </div>
        
        {/* ACCIONES DE USUARIO: Campana, Perfil, Salir (Orden 2 en móvil, Orden 3 en escritorio) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setMostrarCampana(!mostrarCampana)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl transition-all border shadow-lg relative outline-none shrink-0 ${
                notificaciones.length > 0 
                ? 'bg-zinc-900 border-red-500/30 text-white hover:border-red-500/60 hover:bg-zinc-800' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
              }`}
            >
              🔔
              {notificaciones.length > 0 && (
                <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 w-4 h-4 md:w-5 md:h-5 bg-red-500 border-2 border-zinc-950 text-white text-[9px] md:text-[10px] font-black flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse">
                  {notificaciones.length}
                </span>
              )}
            </button>

            {mostrarCampana && (
              <div className="fixed sm:absolute top-[4rem] sm:top-[3.5rem] left-4 right-4 sm:left-auto sm:right-0 xl:-left-32 sm:w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[200] animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="bg-zinc-950/80 p-4 md:p-5 border-b border-zinc-800 flex justify-between items-center backdrop-blur-md">
                  <h3 className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    Cuervos Mensajeros
                  </h3>
                  <button onClick={() => setMostrarCampana(false)} className="text-zinc-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors">✕</button>
                </div>
                
                <div className="max-h-72 md:max-h-80 overflow-y-auto scrollbar-hide">
                  {notificaciones.length === 0 ? (
                    <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center gap-3">
                      <span className="text-2xl md:text-3xl opacity-20 grayscale">🕊️</span>
                      <p className="text-zinc-500 text-[10px] md:text-xs italic font-bold">El cielo está despejado.<br/>No hay mensajes del gremio.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800/50">
                      {notificaciones.map(notif => (
                        <div key={notif.id} className="p-4 md:p-5 hover:bg-zinc-800/40 transition-colors group relative cursor-default">
                          <p className="text-zinc-300 text-xs md:text-sm font-bold pr-8 leading-relaxed">
                            {notif.mensaje}
                          </p>
                          <p className="text-[8px] md:text-[9px] text-zinc-500 uppercase tracking-[0.2em] mt-2 md:mt-3 font-black flex items-center gap-1">
                            <span className="text-emerald-500">🕐</span> {formatearFechaMini(notif.fecha)}
                          </p>
                          <button 
                            onClick={(e) => marcarComoLeida(notif.id, e)}
                            className="absolute top-1/2 -translate-y-1/2 right-3 md:right-4 w-7 h-7 md:w-8 md:h-8 bg-zinc-950 text-zinc-500 border border-zinc-800 rounded-lg md:rounded-xl flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all text-xs shadow-lg"
                            title="Quemar pergamino (Marcar leído)"
                          >
                            ✓
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 md:gap-3 bg-zinc-950 p-1 md:p-1.5 sm:pr-5 md:pr-6 rounded-full border shadow-inner transition-all shrink-0 ${esFundador ? 'border-amber-500/30 shadow-amber-900/10' : 'border-zinc-800'}`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden transition-all duration-700 relative shrink-0
              ${esFundador 
                ? 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' 
                : 'border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              }`}
            >
              {esFundador && <div className="absolute inset-0 bg-amber-500/20 animate-pulse z-0"></div>}
              <div className="relative z-10 flex items-center justify-center w-full h-full">
                <AvatarUsuario nombre={usuario?.nombre} tamaño={40} variante="beam" />
              </div>
            </div>
            
            <div className="text-right hidden sm:flex flex-col justify-center">
              <p className={`text-xs md:text-sm font-black leading-none mb-1 tracking-tight uppercase italic ${esFundador ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'text-zinc-200'}`}>
                {usuario?.nombre}
              </p>
              <div className="flex gap-2 justify-end items-center">
                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${esFundador ? 'text-amber-600' : 'text-zinc-500'}`}>
                  {usuario?.rol === 'admin' ? '👑 Admin' : usuario?.rol === 'dm' ? '🛡️ DM' : '⚔️ Aventurero'}
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={confirmarCierreSesion}
            className="group bg-zinc-900 hover:bg-red-500 border border-zinc-800 hover:border-red-500 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-all shadow-lg outline-none shrink-0"
            title="Abandonar la Taberna"
          >
            <span className="text-lg md:text-xl grayscale group-hover:grayscale-0 transition-all">🚪</span>
          </button>
        </div>

        </div>



        {/* NAVEGACIÓN PRINCIPAL (Orden 3 en móvil enviándolo abajo al 100%, Orden 2 en escritorio) */}
        <div className="w-full flex overflow-x-auto scrollbar-hide justify-start sm:justify-center pb-1">
          <div className="flex flex-nowrap justify-center gap-1 sm:gap-2 bg-zinc-900/50 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-zinc-800/50 min-w-max">
            <button 
              onClick={() => setVista('eventos')}
              className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl hover:bg-zinc-800 focus:outline-none flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
            >
              <span className="text-base md:text-lg">📅</span> Tablón
            </button>
            <button 
              onClick={() => setVista('mis-cronicas')}
              className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl hover:bg-zinc-800 focus:outline-none flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
            >
              <span className="text-base md:text-lg">📖</span> Mi Diario
            </button>
              <button 
                onClick={() => setVista('salon-fama')}
                className="text-[10px] md:text-xs font-black uppercase tracking-widest text-amber-400 hover:text-white transition-all py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl hover:bg-zinc-800 focus:outline-none flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
              >
                <span className="text-base md:text-lg">🏆</span> Salón de la Fama
              </button>
            {esAdmin && (
              <>
                <button 
                  onClick={() => setVista('admin')}
                  className="text-[10px] md:text-xs font-black uppercase tracking-widest text-purple-400 hover:text-white transition-all py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-600 focus:outline-none flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
                >
                  <span className="text-base md:text-lg">👑</span> Mando
                </button>
                <button 
                  onClick={() => setVista('buzon')}
                  className="relative text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-all py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-600 focus:outline-none flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
                >
                  <span className="text-base md:text-lg">📬</span> Buzón
                  {noLeidosBuzon > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] border-2 border-zinc-950 animate-pulse font-bold">
                      {noLeidosBuzon}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;