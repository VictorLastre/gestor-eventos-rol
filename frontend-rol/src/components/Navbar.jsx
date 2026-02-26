import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchProtegido } from '../utils/api'; // ✨ IMPORTAMOS A NUESTRO GUARDIÁN

function Navbar({ usuario, alCerrarSesion, setVista }) {
  // ✨ NUEVOS ESTADOS PARA LOS MENSAJES
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarCampana, setMostrarCampana] = useState(false);

  // ✨ BUSCAMOS LOS MENSAJES AL CARGAR LA BARRA
  useEffect(() => {
    if (usuario) {
      fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/notificaciones')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setNotificaciones(data);
        })
        .catch(err => {
          if (err !== 'Sesión expirada') console.error('Error con los cuervos:', err);
        });
    }
  }, [usuario]);

  // ✨ FUNCIÓN PARA QUEMAR EL PERGAMINO (MARCAR COMO LEÍDA)
  const marcarComoLeida = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/notificaciones/${id}/leida`, {
        method: 'PUT'
      });
      if (res.ok) {
        // La quitamos de la vista inmediatamente para que se sienta rápido
        setNotificaciones(notificaciones.filter(n => n.id !== id));
      }
    } catch (err) {
      if (err !== 'Sesión expirada') console.error(err);
    }
  };

  const renderAvatar = () => {
    const avatar = usuario?.avatar || 'guerrero';
    const iconos = {
      guerrero: '⚔️',
      mago: '🧙',
      esqueleto: '💀',
      goblin: '👺'
    };
    return iconos[avatar] || '👤';
  };

  const confirmarCierreSesion = () => {
    Swal.fire({
      title: '¿Abandonar la Taberna?',
      text: "Tus aventuras te estarán esperando cuando regreses del mundo real.",
      icon: 'question',
      showCancelButton: true,
      background: '#18181b',
      color: '#fff',
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#3f3f46', 
      confirmButtonText: '🚪 Salir del portal',
      cancelButtonText: 'Quedarme a beber'
    }).then((result) => {
      if (result.isConfirmed) {
        alCerrarSesion();
      }
    });
  };

  const fundadores = ['mati', 'martín', 'martin', 'delo', 'keith', 'guille', 'diny', 'sterbern'];
  const esFundador = usuario?.nombre ? fundadores.includes(usuario.nombre.toLowerCase()) : false;

  const formatearFechaMini = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <nav className="bg-zinc-900 border-b border-emerald-500/30 px-6 py-4 mb-8 sticky top-0 z-50 backdrop-blur-md bg-zinc-900/80 shadow-2xl relative">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Sección Izquierda: Identidad */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setVista('eventos')}>
            <span className="text-2xl group-hover:rotate-12 transition-transform">✨</span>
            <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">
              Asociación de Rol <span className="text-emerald-500">La Pampa</span>
            </h2>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setVista('eventos')}
              className="text-[20px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors py-2 px-4 rounded-xl hover:bg-emerald-500/5"
            >
              📅 Eventos
            </button>
            <button 
              onClick={() => setVista('mis-cronicas')}
              className="text-[20px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors py-2 px-4 rounded-xl hover:bg-emerald-500/5"
            >
              📖 Mi Diario
            </button>
          </div>
        </div>

        {/* Sección Derecha: Usuario y Controles */}
        <div className="flex items-center gap-4">
          
          {/* ✨ CAMPANITA DE NOTIFICACIONES */}
          <div className="relative">
            <button 
              onClick={() => setMostrarCampana(!mostrarCampana)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all border ${notificaciones.length > 0 ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20' : 'bg-zinc-800 border-transparent text-zinc-400 hover:text-white'}`}
            >
              🔔
              {notificaciones.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse">
                  {notificaciones.length}
                </span>
              )}
            </button>

            {/* ✨ DROPDOWN DE MENSAJES */}
            {mostrarCampana && (
              <div className="absolute top-14 right-0 w-80 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Cuervos Mensajeros</h3>
                  <button onClick={() => setMostrarCampana(false)} className="text-zinc-500 hover:text-white">✕</button>
                </div>
                
                <div className="max-h-80 overflow-y-auto scrollbar-hide">
                  {notificaciones.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs italic font-bold">
                      No hay mensajes nuevos del gremio.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {notificaciones.map(notif => (
                        <div key={notif.id} className="p-4 hover:bg-zinc-800/50 transition-colors group relative">
                          <p className="text-zinc-300 text-sm font-bold pr-6 leading-tight">
                            {notif.mensaje}
                          </p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2 font-black">
                            {formatearFechaMini(notif.fecha)}
                          </p>
                          <button 
                            onClick={(e) => marcarComoLeida(notif.id, e)}
                            className="absolute top-4 right-4 w-6 h-6 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-emerald-500 hover:text-white transition-all text-xs"
                            title="Marcar como leída"
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

          {/* Avatar del Usuario */}
          <div className={`flex items-center gap-4 bg-black/40 p-1.5 pr-5 rounded-full border ${esFundador ? 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'border-white/5'}`}>
            <div className={`w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xl overflow-hidden transition-all duration-700
              ${esFundador 
                ? 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-[pulse_3s_ease-in-out_infinite]' 
                : 'border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              }`}
            >
              {renderAvatar()}
            </div>
            
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-black leading-none mb-1 ${esFundador ? 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-zinc-100'}`}>
                {usuario.nombre}
              </p>
              <div className="flex gap-2 justify-end items-center">
                {esFundador && (
                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                    Fundador
                  </span>
                )}
                <p className={`text-[9px] font-bold uppercase tracking-widest opacity-70 ${esFundador ? 'text-amber-200' : 'text-emerald-500'}`}>
                  {usuario.rol}
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={confirmarCierreSesion}
            className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90"
            title="Cerrar Sesión"
          >
            🚪
          </button>
        </div>
        
      </div>
    </nav>
  );
}

export default Navbar;