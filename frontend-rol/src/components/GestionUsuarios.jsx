import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 
import * as XLSX from 'xlsx'; 

function GestionUsuarios() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [votaciones, setVotaciones] = useState([]); 
  const [eventos, setEventos] = useState([]); 
  
  const [pestanaActiva, setPestanaActiva] = useState('peticiones');
  const [filtroRol, setFiltroRol] = useState('todos'); 
  const [busqueda, setBusqueda] = useState('');

  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [paginaCenso, setPaginaCenso] = useState(1);
  const [infoPaginacion, setInfoPaginacion] = useState({ totalPaginas: 1, totalUsuarios: 0 });

  const cargarDatosPrincipales = () => {
    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/solicitudes-dm')
      .then(res => res.json())
      .then(datos => setSolicitudes(Array.isArray(datos) ? datos : []))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });

    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/votaciones/activas')
      .then(res => res.json())
      .then(datos => setVotaciones(Array.isArray(datos) ? datos : []))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });

    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/eventos')
      .then(res => res.json())
      .then(datos => setEventos(Array.isArray(datos) ? datos : []))
      .catch(err => console.error(err));
  };

  const cargarCenso = (pagina) => {
    fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios?page=${pagina}&limit=10`)
      .then(res => res.json())
      .then(data => {
        if (data.datos && data.paginacion) {
          setTodosLosUsuarios(data.datos);
          setInfoPaginacion(data.paginacion);
        } else {
          setTodosLosUsuarios(Array.isArray(data) ? data : []);
        }
      })
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  };

  useEffect(() => { cargarDatosPrincipales(); }, []);
  useEffect(() => { cargarCenso(paginaCenso); }, [paginaCenso]);

  const exportarLogistica = async () => {
    if (eventos.length === 0) return Swal.fire({ title: 'Error', text: 'No hay eventos.', icon: 'error', background: '#18181b', color: '#fff' });

    const { value: eventoId } = await Swal.fire({
      title: '📊 Reporte Logístico',
      text: 'Selecciona la jornada para el reporte:',
      input: 'select',
      inputOptions: Object.fromEntries(eventos.map(e => [e.id, e.nombre])),
      inputPlaceholder: 'Seleccionar jornada...',
      showCancelButton: true,
      background: '#18181b',
      color: '#fff',
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Descargar Pergamino (Excel)',
      didOpen: () => {
        const select = Swal.getInput();
        if (select) {
          select.style.backgroundColor = '#09090b';
          select.style.color = '#fff';
          select.style.borderColor = '#3f3f46';
          const options = select.querySelectorAll('option');
          options.forEach(opt => { opt.style.backgroundColor = '#18181b'; opt.style.color = '#fff'; });
        }
      }
    });

    if (eventoId) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/partidas/reporte-logistico/${eventoId}`);
        const datos = await res.json();
        if (!datos || datos.length === 0) return Swal.fire({ title: 'Aviso', text: 'No hay partidas en este evento.', icon: 'info', background: '#18181b', color: '#fff' });

        const filas = datos.map(m => ({
          "ESTADO": m.es_dm_nuevo ? "⚠️ NUEVO (ENTREGAR CERTIFICADO)" : "VETERANO",
          "DIRECTOR": m.dm_nombre.toUpperCase(),
          "TURNO": m.turno,
          "MESA": m.mesa,
          "SISTEMA": m.sistema,
          "JUGADORES": m.jugadores || "Sin inscritos",
          "MATERIALES": m.materiales_pedidos || "✅ NADA PENDIENTE"
        }));

        const hoja = XLSX.utils.json_to_sheet(filas);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Planilla Logística");
        const nombreEvento = eventos.find(e => e.id == eventoId).nombre;
        XLSX.writeFile(libro, `Logistica_${nombreEvento.replace(/\s+/g, '_')}.xlsx`);
      } catch (e) { console.error(e); }
    }
  };

  const promoverUsuario = async (id, nombre) => {
    const result = await Swal.fire({
      title: 'Forjar un nuevo Director',
      text: `¿Ascender a ${nombre.toUpperCase()} al rango de Dungeon Master?`,
      icon: 'warning',
      showCancelButton: true,
      background: '#18181b', color: '#fff', confirmButtonColor: '#f59e0b', confirmButtonText: '🪄 Ascender'
    });
    if (result.isConfirmed) {
      const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/promover`, { method: 'PUT' });
      if (res.ok) { cargarDatosPrincipales(); cargarCenso(paginaCenso); Swal.fire({ title: '¡Ascenso Concedido!', icon: 'success', background: '#18181b', color: '#fff' }); }
    }
  };

  const emitirVoto = async (votacionId, candidatoNombre, voto) => {
    const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/votaciones/${votacionId}/votar`, {
      method: 'POST',
      body: JSON.stringify({ voto })
    });
    if (res.ok) { cargarDatosPrincipales(); cargarCenso(paginaCenso); Swal.fire({ title: 'Voto Registrado', icon: 'info', background: '#18181b', color: '#fff' }); }
  };

  const usuariosFiltrados = todosLosUsuarios.filter(user => {
    const coincideRol = filtroRol === 'todos' || user.rol === filtroRol;
    return coincideRol && user.nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🧭 NAVEGACIÓN DE PESTAÑAS */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button onClick={() => setPestanaActiva('peticiones')} className={`flex items-center gap-2 px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all rounded-xl ${pestanaActiva === 'peticiones' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          🛡️ Peticiones DM {solicitudes.length > 0 && <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-[9px]">{solicitudes.length}</span>}
        </button>
        <button onClick={() => setPestanaActiva('censo')} className={`flex items-center gap-2 px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all rounded-xl ${pestanaActiva === 'censo' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          📜 Registro Gremial
        </button>
        <button onClick={() => setPestanaActiva('senado')} className={`flex items-center gap-2 px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all rounded-xl ${pestanaActiva === 'senado' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          🏛️ Senado {votaciones.length > 0 && <span className="bg-white text-amber-600 px-2 py-0.5 rounded-full text-[9px] animate-pulse">{votaciones.length}</span>}
        </button>
      </div>

      {/* 🛡️ SECCIÓN: PETICIONES */}
      {pestanaActiva === 'peticiones' && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-12 h-12 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-2xl border border-purple-500/20 text-xl">🛡️</div>
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Aspirantes a Director</h3>
           </div>
           {solicitudes.length === 0 ? (
             <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-900 rounded-[2.5rem] p-20 text-center text-zinc-700 font-black uppercase tracking-[0.3em] text-xs">No hay peticiones en el tablón</div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {solicitudes.map(user => (
                 <div key={user.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:border-purple-500/30 group">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-zinc-950 rounded-full flex items-center justify-center text-2xl border border-zinc-800 group-hover:border-purple-500/50 transition-colors">👤</div>
                     <div>
                       <p className="text-xl font-black text-white tracking-tighter uppercase italic">{user.nombre}</p>
                       <p className="text-xs text-zinc-500 font-mono italic">{user.email}</p>
                     </div>
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto">
                     <button onClick={() => rechazarUsuario(user.id, user.nombre)} className="flex-1 bg-zinc-800 text-zinc-500 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all">✕ Denegar</button>
                     <button onClick={() => promoverUsuario(user.id, user.nombre)} className="flex-1 bg-amber-500 text-black py-3 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">🪄 Ascender</button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {/* 📜 SECCIÓN: CENSO */}
      {pestanaActiva === 'censo' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-2xl border border-emerald-500/20 text-xl">📜</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Censo del Gremio</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button onClick={exportarLogistica} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-2xl text-[9px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-950/20">📊 Exportar Logística</button>
              <div className="relative flex-1 sm:flex-none">
                <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setPaginaCenso(1) || setBusqueda(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-white text-xs font-bold rounded-2xl py-3 pl-10 pr-4 w-full sm:w-64 focus:border-emerald-500 outline-none transition-all" />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">🔍</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-950/50 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black border-b border-zinc-800">
                    <th className="p-6">Héroe</th>
                    <th className="p-6 hidden md:table-cell">Rango Actual</th>
                    <th className="p-6 text-center">Acciones de Comando</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {usuariosFiltrados.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6 flex items-center gap-4">
                        <span className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center text-xl border border-zinc-800 group-hover:border-zinc-600 transition-all">
                          {user.avatar === 'guerrero' ? '⚔️' : user.avatar === 'mago' ? '🧙' : user.avatar === 'esqueleto' ? '💀' : user.avatar === 'goblin' ? '👺' : '👤'}
                        </span>
                        <div>
                          <p className="font-black text-zinc-200 uppercase italic tracking-tight">{user.nombre}</p>
                          <p className="text-[10px] text-zinc-600 font-mono lowercase">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-6 hidden md:table-cell">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${user.rol === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : user.rol === 'dm' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'}`}>
                          {user.rol === 'admin' ? '👑 Administrador' : user.rol === 'dm' ? '🛡️ Dungeon Master' : '⚔️ Aventurero'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-3">
                          {user.rol !== 'admin' && <button onClick={() => proponerAdmin(user.id, user.nombre)} className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-amber-500 hover:text-amber-500 transition-all text-sm" title="Proponer al Senado">👑</button>}
                          {user.rol !== 'dm' && user.rol !== 'admin' && <button onClick={() => cambiarRolDirecto(user.id, user.nombre, 'dm')} className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-purple-500 hover:text-purple-400 transition-all text-sm" title="Ascender a DM">🛡️</button>}
                          {user.rol !== 'jugador' && <button onClick={() => cambiarRolDirecto(user.id, user.nombre, 'jugador')} className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-500 hover:text-red-500 transition-all text-sm" title="Revocar Rango">✕</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center p-6 bg-zinc-950/30 border-t border-zinc-800">
               <button onClick={() => setPaginaCenso(p => Math.max(1, p - 1))} disabled={paginaCenso === 1} className="px-6 py-2 bg-zinc-900 text-zinc-500 font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-20 transition-all hover:text-white">← Anterior</button>
               <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">Página {paginaCenso} de {infoPaginacion.totalPaginas}</span>
               <button onClick={() => setPaginaCenso(p => Math.min(infoPaginacion.totalPaginas, p + 1))} disabled={paginaCenso >= infoPaginacion.totalPaginas} className="px-6 py-2 bg-zinc-900 text-zinc-500 font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-20 transition-all hover:text-white">Siguiente →</button>
            </div>
          </div>
        </div>
      )}

      {/* 🏛️ SECCIÓN: SENADO */}
      {pestanaActiva === 'senado' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-2xl border border-amber-500/20 text-xl animate-pulse">🏛️</div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Senado del Gremio</h3>
              <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.4em]">Mociones de Ascenso de Élite</p>
            </div>
          </div>
          
          {votaciones.length === 0 ? (
            <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-900 rounded-[3rem] p-24 text-center">
               <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-xs italic">El Senado está en silencio absoluto...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {votaciones.map(v => (
                <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl group transition-all hover:border-amber-500/40">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] rounded-full group-hover:bg-amber-500/10 transition-all"></div>
                  
                  <h4 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase italic">{v.candidato_nombre}</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-8">Propuesto por: <span className="text-amber-500">{v.proponente_nombre}</span></p>
                  
                  <div className="bg-zinc-950 rounded-[2rem] p-6 border border-zinc-800/50 mb-8">
                    <div className="flex justify-between items-end mb-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">A Favor</span>
                        <span className="text-2xl font-black text-emerald-400 leading-none">{v.votos_favor}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">En Contra</span>
                        <span className="text-2xl font-black text-red-400 leading-none">{v.votos_contra}</span>
                      </div>
                    </div>
                    
                    {/* Barra de progreso de votación */}
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
                      <div style={{ width: `${(v.votos_favor / (v.total_admins || 1)) * 100}%` }} className="bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <div style={{ width: `${(v.votos_contra / (v.total_admins || 1)) * 100}%` }} className="bg-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    </div>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] text-center mt-4">Requiere {Math.floor(v.total_admins / 2) + 1} votos para resolución</p>
                  </div>

                  {v.ya_vote > 0 ? (
                    <div className="bg-zinc-800/30 text-zinc-600 text-center py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-zinc-800/50">⚖️ Tu veredicto ha sido sellado</div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => emitirVoto(v.id, v.candidato_nombre, 'en contra')} className="flex-1 bg-zinc-950 border border-zinc-800 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">👎 Rechazar</button>
                      <button onClick={() => emitirVoto(v.id, v.candidato_nombre, 'a favor')} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all">👍 Apoyar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default GestionUsuarios;