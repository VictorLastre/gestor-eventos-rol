import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 

function GestionUsuarios() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState('peticiones');
  const [filtroRol, setFiltroRol] = useState('todos'); 

  const cargarDatos = () => {
    const token = localStorage.getItem('token');
    
    fetch('https://gestor-eventos-rol.onrender.com/api/usuarios/solicitudes-dm', {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(datos => setSolicitudes(datos))
      .catch(err => console.error(err));

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
    
    const result = await Swal.fire({
      title: 'Forjar un nuevo Director',
      text: `¿Estás seguro de otorgar el manto de Dungeon Master a ${nombre.toUpperCase()}? Este poder es permanente.`,
      icon: 'warning',
      showCancelButton: true,
      background: '#18181b', 
      color: '#fff',
      confirmButtonColor: '#f59e0b', 
      cancelButtonColor: '#3f3f46', 
      confirmButtonText: '🪄 Ascender Aventurero',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/promover`, {
          method: 'PUT',
          headers: { 'authorization': token }
        });
        
        const texto = await res.text();
        
        if (res.ok) {
          Swal.fire({
            title: '¡Ascenso Concedido!',
            text: `✨ ${nombre} ahora posee el rango de Dungeon Master.`,
            icon: 'success',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#10b981' 
          });
          cargarDatos(); 
        } else {
          Swal.fire({
            title: 'Interferencia Mágica',
            text: `❌ ${texto}`,
            icon: 'error',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#ef4444' 
          });
        }
      } catch (e) { 
        console.error(e); 
        Swal.fire({
          title: 'Error de Red',
          text: 'Los pergaminos no pudieron llegar al servidor.',
          icon: 'error',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // ✨ NUEVA FUNCIÓN PARA RECHAZAR LA SOLICITUD
  const rechazarUsuario = async (id, nombre) => {
    const token = localStorage.getItem('token');
    
    const result = await Swal.fire({
      title: 'Denegar Petición',
      text: `¿Estás seguro de rechazar la solicitud de ${nombre.toUpperCase()}? La marca de petición será borrada.`,
      icon: 'error',
      showCancelButton: true,
      background: '#18181b', 
      color: '#fff',
      confirmButtonColor: '#ef4444', // red-500
      cancelButtonColor: '#3f3f46', 
      confirmButtonText: '❌ Rechazar Petición',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        // Asumimos que crearás esta ruta en el backend usando DELETE o PUT
        const res = await fetch(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/rechazar-dm`, {
          method: 'PUT', 
          headers: { 'authorization': token }
        });
        
        const texto = await res.text();
        
        if (res.ok) {
          Swal.fire({
            title: 'Petición Rechazada',
            text: `La solicitud de ${nombre} ha sido borrada de los registros.`,
            icon: 'success',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#10b981' 
          });
          cargarDatos(); 
        } else {
          Swal.fire({
            title: 'Interferencia Mágica',
            text: `❌ ${texto}`,
            icon: 'error',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#ef4444' 
          });
        }
      } catch (e) { 
        console.error(e); 
        Swal.fire({
          title: 'Error de Red',
          text: 'Los pergaminos no pudieron llegar al servidor.',
          icon: 'error',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  const usuariosFiltrados = todosLosUsuarios.filter(user => 
    filtroRol === 'todos' || user.rol === filtroRol
  );

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
                  
                  {/* ✨ AQUÍ AGREGAMOS EL BOTÓN DE RECHAZAR JUNTO AL DE ASCENDER */}
                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button 
                      onClick={() => rechazarUsuario(user.id, user.nombre)} 
                      className="flex-1 md:flex-none bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 border border-transparent hover:border-red-500/50 font-black px-4 py-3 rounded-xl transition-all text-[10px] uppercase tracking-widest"
                    >
                      ✕ Denegar
                    </button>
                    <button 
                      onClick={() => promoverUsuario(user.id, user.nombre)} 
                      className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 text-[10px] uppercase tracking-widest"
                    >
                      🪄 Ascender
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === VISTA 2: LISTADO DE TODOS LOS USUARIOS === */}
      {pestanaActiva === 'censo' && (
        <div className="animate-in fade-in duration-300">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-xl border border-emerald-500/30">
                📜
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Censo Total</h3>
              </div>
            </div>

            <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
              <button onClick={() => setFiltroRol('todos')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filtroRol === 'todos' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Todos</button>
              <button onClick={() => setFiltroRol('admin')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filtroRol === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-amber-500/50'}`}>👑 Admins</button>
              <button onClick={() => setFiltroRol('dm')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filtroRol === 'dm' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:text-purple-400/50'}`}>🛡️ DMs</button>
              <button onClick={() => setFiltroRol('jugador')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filtroRol === 'jugador' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>⚔️ Jugadores</button>
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
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-zinc-500 italic font-bold">
                      No hay registros para este filtro.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map(user => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default GestionUsuarios;