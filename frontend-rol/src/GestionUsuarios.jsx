import { useState, useEffect } from 'react';

function GestionUsuarios() {
  const [solicitudes, setSolicitudes] = useState([]);

  const cargarSolicitudes = () => {
    const token = localStorage.getItem('token');
    fetch('https://gestor-eventos-rol.onrender.com/api/usuarios/solicitudes-dm', {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(datos => setSolicitudes(datos))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const promoverUsuario = async (id, nombre) => {
    const token = localStorage.getItem('token');
    if(!window.confirm(`¿Estás seguro de otorgar el rango de Dungeon Master a ${nombre.toUpperCase()}?`)) return;

    try {
      const res = await fetch(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/promover`, {
        method: 'PUT',
        headers: { 'authorization': token }
      });
      const texto = await res.text();
      if(res.ok) {
        alert(`✨ ${nombre} ha sido ascendido.`);
        cargarSolicitudes();
      } else {
        alert(`❌ ${texto}`);
      }
    } catch(e) { console.error(e); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-xl border border-purple-500/30">
          🛡️
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">
            Peticiones de Ascenso
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Aspirantes a Dungeon Master
          </p>
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center">
          <p className="text-zinc-600 font-bold italic">No hay peticiones de rango pendientes en el reino.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {solicitudes.map(user => (
            <div 
              key={user.id} 
              className="group flex flex-col md:flex-row justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl border border-white/5 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                  👤
                </div>
                <div>
                  <p className="text-lg font-black text-white leading-tight">{user.nombre}</p>
                  <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                </div>
              </div>

              <button 
                onClick={() => promoverUsuario(user.id, user.nombre)} 
                className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 text-[10px] uppercase tracking-widest"
              >
                🪄 Otorgar Rango de DM
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GestionUsuarios;