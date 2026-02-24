import Swal from 'sweetalert2';

function Navbar({ usuario, alCerrarSesion, setVista }) {
  // Función para determinar qué icono mostrar
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

  // ✨ ALERTA ÉPICA PARA CERRAR SESIÓN
  const confirmarCierreSesion = () => {
    Swal.fire({
      title: '¿Abandonar la Taberna?',
      text: "Tus aventuras te estarán esperando cuando regreses del mundo real.",
      icon: 'question',
      showCancelButton: true,
      background: '#18181b',
      color: '#fff',
      confirmButtonColor: '#ef4444', // red-500
      cancelButtonColor: '#3f3f46', // zinc-700
      confirmButtonText: '🚪 Salir del portal',
      cancelButtonText: 'Quedarme a beber'
    }).then((result) => {
      if (result.isConfirmed) {
        alCerrarSesion();
      }
    });
  };

  // ✨ MAGIA DE FUNDADORES: Comprobamos si el usuario es un miembro original
  const fundadores = ['mati', 'martín', 'martin', 'delo', 'keith', 'guille', 'diny', 'sterbern'];
  const esFundador = usuario?.nombre ? fundadores.includes(usuario.nombre.toLowerCase()) : false;

  return (
    <nav className="bg-zinc-900 border-b border-emerald-500/30 px-6 py-4 mb-8 sticky top-0 z-50 backdrop-blur-md bg-zinc-900/80 shadow-2xl">
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

        {/* Sección Derecha: Usuario con Avatar Circular */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-4 bg-black/40 p-1.5 pr-5 rounded-full border ${esFundador ? 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'border-white/5'}`}>
            
            {/* ✨ EFECTO FOIL PARA FUNDADORES EN EL CÍRCULO */}
            <div className={`w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xl overflow-hidden transition-all duration-700
              ${esFundador 
                ? 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-[pulse_3s_ease-in-out_infinite]' 
                : 'border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              }`}
            >
              {renderAvatar()}
            </div>
            
            <div className="text-right hidden sm:block">
              {/* ✨ TEXTO DORADO SI ES FUNDADOR */}
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