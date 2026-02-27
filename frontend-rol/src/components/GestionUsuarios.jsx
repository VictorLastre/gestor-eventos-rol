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
      .then(datos => setSolicitudes(datos))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });

    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/votaciones/activas')
      .then(res => res.json())
      .then(datos => setVotaciones(datos))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });

    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/eventos')
      .then(res => res.json())
      .then(datos => setEventos(datos))
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
          setTodosLosUsuarios(data);
        }
      })
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  };

  useEffect(() => {
    cargarDatosPrincipales();
  }, []);

  useEffect(() => {
    cargarCenso(paginaCenso);
  }, [paginaCenso]);

  // ✨ FUNCIÓN DE EXPORTACIÓN CON FIX DE ESTILO PARA SELECT
  const exportarLogistica = async () => {
    if (eventos.length === 0) {
      return Swal.fire({ title: 'Error', text: 'No hay eventos registrados.', icon: 'error', background: '#18181b', color: '#fff' });
    }

    const { value: eventoId } = await Swal.fire({
      title: '📊 Reporte Logístico',
      text: 'Selecciona el evento para exportar:',
      input: 'select',
      inputOptions: Object.fromEntries(eventos.map(e => [e.id, e.nombre])),
      inputPlaceholder: 'Seleccionar evento...',
      showCancelButton: true,
      background: '#18181b',
      color: '#fff',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Descargar Excel',
      cancelButtonText: 'Cancelar',
      // ✨ FIX: Forzamos el color del select y sus opciones
      customClass: {
        input: 'custom-swal-select'
      },
      didOpen: () => {
        const select = Swal.getInput();
        if (select) {
          select.style.backgroundColor = '#09090b';
          select.style.color = '#fff';
          select.style.borderColor = '#3f3f46';
          select.style.borderRadius = '12px';
          // Esto soluciona el fondo blanco en las opciones
          const options = select.querySelectorAll('option');
          options.forEach(opt => {
            opt.style.backgroundColor = '#18181b';
            opt.style.color = '#fff';
          });
        }
      }
    });

    if (eventoId) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/partidas/reporte-logistico/${eventoId}`);
        const datos = await res.json();

        if (!datos || datos.length === 0) {
          return Swal.fire({ title: 'Mesa Vacía', text: 'Este evento no tiene partidas creadas.', icon: 'info', background: '#18181b', color: '#fff' });
        }

        const filas = datos.map(m => ({
          "ESTADO": m.es_dm_nuevo ? "⚠️ NUEVO (ENTREGAR CERTIFICADO)" : "VETERANO",
          "DIRECTOR": m.dm_nombre.toUpperCase(),
          "TURNO": m.turno,
          "MESA": m.mesa,
          "SISTEMA": m.sistema,
          "JUGADORES": m.jugadores || "Sin inscritos",
          "MATERIALES": m.materiales_pedidos && m.materiales_pedidos.trim() !== "" ? m.materiales_pedidos : "✅ NADA PENDIENTE"
        }));

        const hoja = XLSX.utils.json_to_sheet(filas);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Planilla");
        
        const nombreEvento = eventos.find(e => e.id == eventoId).nombre;
        XLSX.writeFile(libro, `Logistica_${nombreEvento.replace(/\s+/g, '_')}.xlsx`);

        Swal.fire({ title: '¡Generado!', text: 'El reporte se ha descargado.', icon: 'success', background: '#18181b', color: '#fff' });
      } catch (e) {
        console.error("Error exportando:", e);
      }
    }
  };

  const promoverUsuario = async (id, nombre) => {
    const result = await Swal.fire({
      title: 'Forjar un nuevo Director',
      text: `¿Estás seguro de otorgar el manto de Dungeon Master a ${nombre.toUpperCase()}?`,
      icon: 'warning',
      showCancelButton: true,
      background: '#18181b', color: '#fff', confirmButtonColor: '#f59e0b', cancelButtonColor: '#3f3f46', 
      confirmButtonText: '🪄 Ascender Aventurero', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/promover`, { method: 'PUT' });
        const texto = await res.text();
        if (res.ok) {
          Swal.fire({ title: '¡Ascenso Concedido!', text: `✨ ${nombre} ahora posee el rango de Dungeon Master.`, icon: 'success', background: '#18181b', color: '#fff' });
          cargarDatosPrincipales(); 
          cargarCenso(paginaCenso);
        } else {
          Swal.fire({ title: 'Interferencia Mágica', text: `❌ ${texto}`, icon: 'error', background: '#18181b', color: '#fff' });
        }
      } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
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
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/rechazar-dm`, { method: 'PUT' });
        if (res.ok) {
          Swal.fire({ title: 'Petición Rechazada', text: `La solicitud de ${nombre} ha sido borrada.`, icon: 'success', background: '#18181b', color: '#fff' });
          cargarDatosPrincipales(); 
          cargarCenso(paginaCenso);
        }
      } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
    }
  };

  const cambiarRolDirecto = async (id, nombre, nuevoRol) => {
    const rolVisual = nuevoRol === 'dm' ? 'Dungeon Master' : 'Jugador';
    const result = await Swal.fire({
      title: 'Alterar Rango',
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
          Swal.fire({ title: '¡Rango Alterado!', text: `${nombre} ahora es ${rolVisual}.`, icon: 'success', background: '#18181b', color: '#fff' });
          cargarCenso(paginaCenso); 
        }
      } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
    }
  };

  const proponerAdmin = async (id, nombre) => {
    const result = await Swal.fire({
      title: '👑 Convocar al Senado',
      text: `¿Quieres proponer a ${nombre} para formar parte de los Administradores?`,
      icon: 'info',
      showCancelButton: true,
      background: '#18181b', color: '#fff', confirmButtonColor: '#f59e0b', cancelButtonColor: '#3f3f46', 
      confirmButtonText: 'Sí, abrir moción', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/${id}/proponer-admin`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          Swal.fire({ title: 'Senado Convocado', text: data.mensaje, icon: 'success', background: '#18181b', color: '#fff' });
          setPestanaActiva('senado'); 
          cargarDatosPrincipales();
        } else {
          Swal.fire({ title: 'Aviso del Consejo', text: data.error, icon: 'warning', background: '#18181b', color: '#fff' });
        }
      } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
    }
  };

  const emitirVoto = async (votacionId, candidatoNombre, voto) => {
    const result = await Swal.fire({
      title: voto === 'a favor' ? 'Apoyar Moción' : 'Rechazar Moción',
      text: `¿Votar ${voto.toUpperCase()} del ascenso de ${candidatoNombre}?`,
      icon: 'question',
      showCancelButton: true,
      background: '#18181b', color: '#fff', confirmButtonColor: voto === 'a favor' ? '#10b981' : '#ef4444', 
      cancelButtonColor: '#3f3f46', confirmButtonText: 'Sí, votar', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/usuarios/votaciones/${votacionId}/votar`, {
          method: 'POST',
          body: JSON.stringify({ voto })
        });
        const data = await res.json();
        if (res.ok) {
          Swal.fire({ title: 'Voto Registrado', text: data.mensaje, icon: 'info', background: '#18181b', color: '#fff' });
          cargarDatosPrincipales();
          cargarCenso(paginaCenso);
        }
      } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
    }
  };

  const usuariosFiltrados = todosLosUsuarios.filter(user => {
    const coincideRol = filtroRol === 'todos' || user.rol === filtroRol;
    const coincideBusqueda = user.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideRol && coincideBusqueda;
  });

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      
      <div className="flex flex-wrap gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button onClick={() => setPestanaActiva('peticiones')} className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-lg ${pestanaActiva === 'peticiones' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>
          Peticiones DM {solicitudes.length > 0 && <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full ml-2">{solicitudes.length}</span>}
        </button>
        <button onClick={() => setPestanaActiva('censo')} className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-lg ${pestanaActiva === 'censo' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>
          Registro Gremial ({infoPaginacion.totalUsuarios})
        </button>
        <button onClick={() => setPestanaActiva('senado')} className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all rounded-lg ${pestanaActiva === 'senado' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>
          Senado {votaciones.length > 0 && <span className="bg-white text-amber-600 px-2 py-0.5 rounded-full ml-2 animate-pulse">{votaciones.length}</span>}
        </button>
      </div>

      {pestanaActiva === 'peticiones' && (
        <div className="animate-in fade-in duration-300">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-xl border border-purple-500/30">🛡️</div>
             <h3 className="text-xl font-black text-white uppercase tracking-tighter">Aspirantes a Dungeon Master</h3>
           </div>
           {solicitudes.length === 0 ? (
             <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center text-zinc-600 font-bold italic">No hay peticiones pendientes.</div>
           ) : (
             <div className="grid gap-4">
               {solicitudes.map(user => (
                 <div key={user.id} className="group flex flex-col md:flex-row justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl">👤</div>
                     <div>
                       <p className="text-lg font-black text-white leading-tight">{user.nombre}</p>
                       <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                     </div>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                     <button onClick={() => rechazarUsuario(user.id, user.nombre)} className="flex-1 md:flex-none bg-zinc-800 text-zinc-400 font-black px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest">✕ Denegar</button>
                     <button onClick={() => promoverUsuario(user.id, user.nombre)} className="flex-1 md:flex-none bg-amber-500 text-black font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest">🪄 Ascender</button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {pestanaActiva === 'censo' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-xl border border-emerald-500/30">📜</div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Censo Total</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={exportarLogistica}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
              >
                📊 Exportar Logística
              </button>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
                <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-white text-xs font-bold rounded-xl py-2 pl-9 pr-4 w-full sm:w-48 focus:border-emerald-500 outline-none transition-colors" />
              </div>

              <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 overflow-x-auto">
                {['todos', 'admin', 'dm', 'jugador'].map(rol => (
                  <button key={rol} onClick={() => setFiltroRol(rol)} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filtroRol === rol ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {rol === 'todos' ? 'Todos' : rol === 'admin' ? '👑 Admins' : rol === 'dm' ? '🛡️ DMs' : '⚔️ Jugadores'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col">
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
                  <tr><td colSpan="4" className="p-8 text-center text-zinc-500 italic font-bold">Sin resultados.</td></tr>
                ) : (
                  usuariosFiltrados.map(user => (
                    <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <span className="text-xl bg-zinc-950 w-8 h-8 flex items-center justify-center rounded-full border border-zinc-800">
                          {user.avatar === 'guerrero' ? '⚔️' : user.avatar === 'mago' ? '🧙' : user.avatar === 'esqueleto' ? '💀' : user.avatar === 'goblin' ? '👺' : '👤'}
                        </span>
                        <span className="font-bold text-zinc-200">{user.nombre}</span>
                      </td>
                      <td className="p-4 text-xs text-zinc-400 font-mono hidden sm:table-cell">{user.email}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${user.rol === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : user.rol === 'dm' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                          {user.rol === 'admin' ? '👑 Admin' : user.rol === 'dm' ? '🛡️ DM' : 'Jugador'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                          {user.rol !== 'admin' && <button onClick={() => proponerAdmin(user.id, user.nombre)} className="w-7 h-7 bg-zinc-950 text-zinc-500 hover:text-amber-500 border border-zinc-800 rounded-lg flex items-center justify-center transition-all" title="Proponer Senado">👑</button>}
                          {user.rol !== 'dm' && user.rol !== 'admin' && <button onClick={() => cambiarRolDirecto(user.id, user.nombre, 'dm')} className="w-7 h-7 bg-zinc-950 text-zinc-500 hover:text-purple-400 border border-zinc-800 rounded-lg flex items-center justify-center transition-all" title="Ascender">🛡️</button>}
                          {user.rol !== 'jugador' && <button onClick={() => cambiarRolDirecto(user.id, user.nombre, 'jugador')} className="w-7 h-7 bg-zinc-950 text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg flex items-center justify-center transition-all" title="Revocar">⚔️</button>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            <div className="flex justify-between items-center p-4 bg-zinc-950/50 border-t border-zinc-800 mt-auto">
              <button onClick={() => setPaginaCenso(p => Math.max(1, p - 1))} disabled={paginaCenso === 1} className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-30">← Anterior</button>
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Página <span className="text-white">{paginaCenso}</span> de {infoPaginacion.totalPaginas}</span>
              <button onClick={() => setPaginaCenso(p => Math.min(infoPaginacion.totalPaginas, p + 1))} disabled={paginaCenso === infoPaginacion.totalPaginas || infoPaginacion.totalPaginas === 0} className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-30">Siguiente →</button>
            </div>
          </div>
        </div>
      )}

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
            <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center text-zinc-600 font-bold italic">El Senado está en silencio.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {votaciones.map(v => (
                <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                  <div className="relative z-10">
                    <h4 className="text-2xl font-black text-white tracking-tighter mb-1">{v.candidato_nombre}</h4>
                    <p className="text-xs text-zinc-400 italic mb-4">Propuesto por: {v.proponente_nombre}</p>
                    <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 mb-6 text-center">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                        <span className="text-emerald-500">Favor: {v.votos_favor}</span>
                        <span className="text-red-500">Contra: {v.votos_contra}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Mínimo para resolver: {Math.floor(v.total_admins / 2) + 1}</p>
                    </div>
                    {v.ya_vote > 0 ? (
                      <div className="bg-zinc-800/50 text-zinc-400 text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">🏛️ Voto emitido</div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => emitirVoto(v.id, v.candidato_nombre, 'en contra')} className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">👎 Rechazar</button>
                        <button onClick={() => emitirVoto(v.id, v.candidato_nombre, 'a favor')} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">👍 Apoyar</button>
                      </div>
                    )}
                  </div>
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