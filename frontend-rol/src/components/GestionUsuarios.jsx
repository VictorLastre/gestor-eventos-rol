import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; // ✨ IMPORTAMOS AL GUARDIÁN

function GestionUsuarios() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [votaciones, setVotaciones] = useState([]); 
  
  const [pestanaActiva, setPestanaActiva] = useState('peticiones');
  const [filtroRol, setFiltroRol] = useState('todos'); 
  const [busqueda, setBusqueda] = useState('');

  const cargarDatos = () => {
    // ✨ ADIÓS LECTURA MANUAL DE TOKEN Y HEADERS
    
    // Cargar Peticiones de DM
    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/solicitudes-dm')
      .then(res => res.json())
      .then(datos => setSolicitudes(datos))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });

    // Cargar Censo Total
    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios')
      .then(res => res.json())
      .then(datos => setTodosLosUsuarios(datos))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });

    // Cargar Votaciones del Senado
    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/votaciones/activas')
      .then(res => res.json())
      .then(datos => setVotaciones(datos))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const promoverUsuario = async (id, nombre) => {
    const result = await Swal.fire({
      title: 'Forjar un nuevo Director',
      text: `¿Estás seguro de otorgar el manto de Dungeon Master a ${nombre.toUpperCase()}?`,
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
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/promover`, {
          method: 'PUT'
        });
        
        const texto = await res.text();
        
        if (res.ok) {
          Swal.fire({ title: '¡Ascenso Concedido!', text: `✨ ${nombre} ahora posee el rango de Dungeon Master.`, icon: 'success', background: '#18181b', color: '#fff', confirmButtonColor: '#10b981' });
          cargarDatos(); 
        } else {
          Swal.fire({ title: 'Interferencia Mágica', text: `❌ ${texto}`, icon: 'error', background: '#18181b', color: '#fff' });
        }
      } catch (e) { 
        if (e === 'Sesión expirada') return;
        console.error(e); 
      }
    }
  };

  const rechazarUsuario = async (id, nombre) => {
    const result = await Swal.fire({
      title: 'Denegar Petición',
      text: `¿Estás seguro de rechazar la solicitud de ${nombre.toUpperCase()}?`,
      icon: 'error',
      showCancelButton: true,
      background: '#18181b', color: '#fff', confirmButtonColor: '#ef4444', cancelButtonColor: '#3f3f46', 
      confirmButtonText: '❌ Rechazar Petición', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/rechazar-dm`, {
          method: 'PUT'
        });
        if (res.ok) {
          Swal.fire({ title: 'Petición Rechazada', text: `La solicitud de ${nombre} ha sido borrada.`, icon: 'success', background: '#18181b', color: '#fff' });
          cargarDatos(); 
        }
      } catch (e) { 
        if (e === 'Sesión expirada') return;
        console.error(e); 
      }
    }
  };

  const cambiarRolDirecto = async (id, nombre, nuevoRol) => {
    const rolVisual = nuevoRol === 'dm' ? 'Dungeon Master' : 'Jugador';
    const icono = nuevoRol === 'dm' ? '🛡️' : '⚔️';

    const result = await Swal.fire({
      title: `${icono} Alterar Rango`,
      text: `¿Estás seguro de convertir a ${nombre} en ${rolVisual}?`,
      icon: 'question',
      showCancelButton: true,
      background: '#18181b', color: '#fff', confirmButtonColor: '#0ea5e9', cancelButtonColor: '#3f3f46', 
      confirmButtonText: 'Sí, aplicar cambio', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/rol`, {
          method: 'PUT',
          body: JSON.stringify({ rol: nuevoRol })
        });
        
        if (res.ok) {
          Swal.fire({ title: '¡Rango Alterado!', text: `${nombre} ahora es ${rolVisual}.`, icon: 'success', background: '#18181b', color: '#fff', confirmButtonColor: '#10b981' });
          cargarDatos(); 
        } else {
          const errorData = await res.json();
          Swal.fire({ title: 'Error Mágico', text: errorData.error, icon: 'error', background: '#18181b', color: '#fff' });
        }
      } catch (e) { 
        if (e === 'Sesión expirada') return;
        console.error(e); 
      }
    }
  };

  const proponerAdmin = async (id, nombre) => {
    const result = await Swal.fire({
      title: '👑 Convocar al Senado',
      text: `¿Quieres proponer a ${nombre} para formar parte de los Administradores? El resto del consejo deberá votar.`,
      icon: 'info',
      showCancelButton: true,
      background: '#18181b', color: '#fff', confirmButtonColor: '#f59e0b', cancelButtonColor: '#3f3f46', 
      confirmButtonText: 'Sí, abrir moción', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/proponer-admin`, {
          method: 'POST'
        });
        const data = await res.json();
        if (res.ok) {
          Swal.fire({ title: 'Senado Convocado', text: data.mensaje, icon: 'success', background: '#18181b', color: '#fff', confirmButtonColor: '#10b981' });
          setPestanaActiva('senado'); 
          cargarDatos();
        } else {
          Swal.fire({ title: 'Aviso del Consejo', text: data.error, icon: 'warning', background: '#18181b', color: '#fff' });
        }
      } catch (e) { 
        if (e === 'Sesión expirada') return;
        console.error(e); 
      }
    }
  };

  const emitirVoto = async (votacionId, candidatoNombre, voto) => {
    const esAFavor = voto === 'a favor';
    
    const result = await Swal.fire({
      title: esAFavor ? 'Apoyar Moción' : 'Rechazar Moción',
      text: `¿Deseas votar ${voto.toUpperCase()} del ascenso de ${candidatoNombre}?`,
      icon: 'question',
      showCancelButton: true,
      background: '#18181b', color: '#fff', 
      confirmButtonColor: esAFavor ? '#10b981' : '#ef4444', 
      cancelButtonColor: '#3f3f46', 
      confirmButtonText: `Sí, votar ${voto}`, cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/votaciones/${votacionId}/votar`, {
          method: 'POST',
          body: JSON.stringify({ voto })
        });
        const data = await res.json();
        if (res.ok) {
          Swal.fire({ 
            title: data.ascendido ? '¡Habemus Admin!' : data.rechazado ? 'Moción Denegada' : 'Voto Registrado', 
            text: data.mensaje, 
            icon: data.ascendido ? 'success' : data.rechazado ? 'error' : 'info', 
            background: '#18181b', color: '#fff' 
          });
          cargarDatos();
        } else {
          Swal.fire({ title: 'Error en los Archivos', text: data.error, icon: 'warning', background: '#18181b', color: '#fff' });
        }
      } catch (e) { 
        if (e === 'Sesión expirada') return;
        console.error(e); 
      }
    }
  };

  const usuariosFiltrados = todosLosUsuarios.filter(user => {
    const coincideRol = filtroRol === 'todos' || user.rol === filtroRol;
    const coincideBusqueda = user.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideRol && coincideBusqueda;
  });

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      
      {/* NAVEGACIÓN DE PESTAÑAS */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button 
          onClick={() => setPestanaActiva('peticiones')}
          className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-lg ${
            pestanaActiva === 'peticiones' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          }`}
        >
          Peticiones DM {solicitudes.length > 0 && <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full ml-2">{solicitudes.length}</span>}
        </button>
        <button 
          onClick={() => setPestanaActiva('censo')}
          className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-lg ${
            pestanaActiva === 'censo' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          }`}
        >
          Registro Gremial ({todosLosUsuarios.length})
        </button>
        {/* PESTAÑA SENADO */}
        <button 
          onClick={() => setPestanaActiva('senado')}
          className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-lg ${
            pestanaActiva === 'senado' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          }`}
        >
          Senado {votaciones.length > 0 && <span className="bg-white text-amber-600 px-2 py-0.5 rounded-full ml-2 animate-pulse">{votaciones.length}</span>}
        </button>
      </div>

      {/* VISTA 1: PETICIONES DE DM */}
      {pestanaActiva === 'peticiones' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-xl border border-purple-500/30">🛡️</div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Aspirantes a Dungeon Master</h3>
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
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl border border-white/5 group-hover:bg-amber-500 group-hover:text-black transition-colors">👤</div>
                    <div>
                      <p className="text-lg font-black text-white leading-tight">{user.nombre}</p>
                      <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button onClick={() => rechazarUsuario(user.id, user.nombre)} className="flex-1 md:flex-none bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 border border-transparent hover:border-red-500/50 font-black px-4 py-3 rounded-xl transition-all text-[10px] uppercase tracking-widest">✕ Denegar</button>
                    <button onClick={() => promoverUsuario(user.id, user.nombre)} className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 text-[10px] uppercase tracking-widest">🪄 Ascender</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: LISTADO DE TODOS LOS USUARIOS */}
      {pestanaActiva === 'censo' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-xl border border-emerald-500/30">📜</div>
              <div><h3 className="text-xl font-black text-white uppercase tracking-tighter">Censo Total</h3></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
                <input type="text" placeholder="Buscar aventurero..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-white text-xs font-bold rounded-xl py-2 pl-9 pr-4 w-full sm:w-48 focus:border-emerald-500 outline-none transition-colors" />
              </div>
              <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 overflow-x-auto scrollbar-hide">
                <button onClick={() => setFiltroRol('todos')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filtroRol === 'todos' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Todos</button>
                <button onClick={() => setFiltroRol('admin')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filtroRol === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:text-amber-500/50'}`}>👑 Admins</button>
                <button onClick={() => setFiltroRol('dm')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filtroRol === 'dm' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:text-purple-400/50'}`}>🛡️ DMs</button>
                <button onClick={() => setFiltroRol('jugador')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filtroRol === 'jugador' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>⚔️ Jugadores</button>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50 text-[10px] uppercase tracking-widest text-zinc-500 font-black">
                <tr>
                  <th className="p-4 pl-6">Aventurero</th>
                  <th className="p-4 hidden sm:table-cell">Contacto</th>
                  <th className="p-4 text-center">Rango</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {usuariosFiltrados.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-zinc-500 italic font-bold">{busqueda ? 'Ningún aventurero coincide con esa búsqueda.' : 'No hay registros para este filtro.'}</td></tr>
                ) : (
                  usuariosFiltrados.map(user => (
                    <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors group">
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
                      <td className="p-4 text-xs text-zinc-400 font-mono hidden sm:table-cell">{user.email}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${user.rol === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : user.rol === 'dm' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                          {user.rol === 'admin' ? '👑 Admin' : user.rol === 'dm' ? '🛡️ DM' : 'Jugador'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                          {user.rol !== 'admin' && (
                            <button onClick={() => proponerAdmin(user.id, user.nombre)} className="w-7 h-7 bg-zinc-950 hover:bg-amber-500/20 text-zinc-500 hover:text-amber-500 border border-zinc-800 hover:border-amber-500/50 rounded-lg flex items-center justify-center transition-all" title="Proponer al Senado">👑</button>
                          )}
                          {user.rol !== 'dm' && user.rol !== 'admin' && (
                            <button onClick={() => cambiarRolDirecto(user.id, user.nombre, 'dm')} className="w-7 h-7 bg-zinc-950 hover:bg-purple-500/20 text-zinc-500 hover:text-purple-400 border border-zinc-800 hover:border-purple-500/50 rounded-lg flex items-center justify-center transition-all" title="Ascender a Dungeon Master">🛡️</button>
                          )}
                          {user.rol !== 'jugador' && (
                            <button onClick={() => cambiarRolDirecto(user.id, user.nombre, 'jugador')} className="w-7 h-7 bg-zinc-950 hover:bg-zinc-700 text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-500 rounded-lg flex items-center justify-center transition-all" title="Revocar títulos">⚔️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: SENADO DEL GREMIO */}
      {pestanaActiva === 'senado' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/20 text-amber-500 flex items-center justify-center rounded-xl border border-amber-500/30">🏛️</div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Senado del Gremio</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Mociones de Ascenso a Administrador</p>
            </div>
          </div>

          {votaciones.length === 0 ? (
            <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center">
              <p className="text-zinc-600 font-bold italic">El Senado está en silencio. No hay propuestas activas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {votaciones.map(votacion => {
                const mayoriaRequerida = Math.floor(votacion.total_admins / 2) + 1;
                const yaVote = votacion.ya_vote > 0;

                return (
                  <div key={votacion.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Candidato Propuesto</p>
                          <h4 className="text-2xl font-black text-white tracking-tighter">{votacion.candidato_nombre}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">👑 Admin</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 italic mb-6">Propuesto por: <strong className="text-zinc-300">{votacion.proponente_nombre}</strong></p>

                      <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 mb-6">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                          <span className="text-emerald-500">A Favor: {votacion.votos_favor}</span>
                          <span className="text-red-500">En Contra: {votacion.votos_contra}</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                          <div style={{ width: `${(votacion.votos_favor / mayoriaRequerida) * 100}%` }} className="h-full bg-emerald-500 transition-all duration-500"></div>
                          <div style={{ width: `${(votacion.votos_contra / mayoriaRequerida) * 100}%` }} className="h-full bg-red-500 transition-all duration-500 float-right ml-auto"></div>
                        </div>
                        <p className="text-[9px] text-center text-zinc-500 font-bold uppercase tracking-widest mt-3">
                          Se requieren {mayoriaRequerida} votos para resolver
                        </p>
                      </div>

                      {!yaVote ? (
                        <div className="flex gap-2">
                          <button onClick={() => emitirVoto(votacion.id, votacion.candidato_nombre, 'en contra')} className="flex-1 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 border border-transparent hover:border-red-500/30 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                            👎 Rechazar
                          </button>
                          <button onClick={() => emitirVoto(votacion.id, votacion.candidato_nombre, 'a favor')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                            👍 Apoyar
                          </button>
                        </div>
                      ) : (
                        <div className="bg-zinc-800/50 text-zinc-400 text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-zinc-700/50">
                          🏛️ Tu voto ya fue emitido
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default GestionUsuarios;