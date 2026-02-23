import { useState, useEffect } from 'react';

function GestionUsuarios() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState('peticiones'); // Controla qué vista se muestra

  const cargarDatos = () => {
    const token = localStorage.getItem('token');
    
    // 1. Cargar peticiones de ascenso
    fetch('https://gestor-eventos-rol.onrender.com/api/usuarios/solicitudes-dm', {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(datos => setSolicitudes(datos))
      .catch(err => console.error(err));

    // 2. Cargar el censo completo de usuarios
    fetch('https://gestor-eventos-rol.onrender.com/api/usuarios', {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(datos => setTodosLosUsuarios(datos))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    cargarDatos();
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
        cargarDatos(); // Recargamos ambas listas para que el cambio se refleje al instante
      } else {
        alert(`❌ ${texto}`);
      }
    } catch(e) { console.error(e); }
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      
      {/* === NAVEGACIÓN DE PESTAÑAS === */}
      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button 
          onClick={() => setPestanaActiva('peticiones')}
          className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-lg ${
            pestanaActiva === 'peticiones' 
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
            : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          }`}
        >
          Peticiones de Ascenso {solicitudes.length > 0 && <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full ml-2">{solicitudes.length}</span>}
        </button>
        <button 
          onClick={() => setPestanaActiva('censo')}
          className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-lg ${
            pestanaActiva === 'censo' 
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
            : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          }`}
        >
          Registro del Gremio ({todosLosUsuarios.length})
        </button>
      </div>

      {/* === VISTA 1: PETICIONES DE ASCENSO === */}
      {pestanaActiva === 'peticiones' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-xl border border-purple-500/30">
              🛡️
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                Aspirantes a Dungeon Master
              </h3>
            </div>
          </div>

          {solicitudes.length === 0 ? (
            <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center">
              <p className="text-zinc-600 font-bold italic">No hay peticiones de rango pendientes en el reino.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {solicitudes.map(user => (
                <div key={user.id} className="group flex flex-col md:flex-row justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl hover:border-amber-500/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl border border-white/5 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      👤
                    </div>
                    <div>
                      <p className="text-lg font-black text-white leading-tight">{user.nombre}</p>
                      <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => promoverUsuario(user.id, user.nombre)} className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 text-[10px] uppercase tracking-widest">
                    🪄 Otorgar Rango de DM
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === VISTA 2: LISTADO DE TODOS LOS USUARIOS === */}
      {pestanaActiva === 'censo' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-xl border border-emerald-500/30">
              📜
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Censo Total</h3>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50 text-[10px] uppercase tracking-widest text-zinc-500 font-black">
                <tr>
                  <th className="p-4 pl-6">Aventurero</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4 text-center">Rango</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {todosLosUsuarios.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <span className="text-xl bg-zinc-950 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800">
                        {user.avatar === 'guerrero' && '⚔️'}
                        {user.avatar === 'mago' && '🧙'}
                        {user.avatar === 'esqueleto' && '💀'}
                        {user.avatar === 'goblin' && '👺'}
                        {!user.avatar && '👤'}
                      </span>
                      <span className="font-bold text-zinc-200">{user.nombre}</span>
                    </td>
                    <td className="p-4 text-xs text-zinc-400 font-mono">
                      {user.email}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        user.rol === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                        user.rol === 'dm' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {user.rol === 'admin' && '👑 Admin'}
                        {user.rol === 'dm' && '🛡️ DM'}
                        {user.rol === 'jugador' && 'Jugador'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default GestionUsuarios;