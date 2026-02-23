function Navbar({ usuario, alCerrarSesion, setVista }) {
  // Función para determinar qué icono mostrar (por ahora por defecto, a futuro lo sacamos del usuario)
  const renderAvatar = () => {
    // Si el usuario tiene una preferencia guardada la usamos, si no, uno genérico
    const avatar = usuario.avatar || 'guerrero';
    const iconos = {
      guerrero: '⚔️',
      mago: '🧙',
      esqueleto: '💀',
      goblin: '👺'
    };
    return iconos[avatar] || '👤';
  };

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
              className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors py-2 px-4 rounded-xl hover:bg-emerald-500/5"
            >
              📅 Eventos
            </button>
            <button 
              onClick={() => setVista('mis-cronicas')}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors py-2 px-4 rounded-xl hover:bg-emerald-500/5"
            >
              📖 Mi Diario
            </button>
          </div>
        </div>

        {/* Sección Derecha: Usuario con Avatar Circular */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-black/40 p-1.5 pr-5 rounded-full border border-white/5">
            {/* Círculo de Perfil */}
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xl border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] overflow-hidden">
              {renderAvatar()}
            </div>
            
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-zinc-100 leading-none mb-1">
                {usuario.nombre}
              </p>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest opacity-70">
                {usuario.rol}
              </p>
            </div>
          </div>
          
          <button 
            onClick={alCerrarSesion}
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