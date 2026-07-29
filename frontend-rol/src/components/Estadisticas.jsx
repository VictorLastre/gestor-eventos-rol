import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 

const bgClasses = {
  cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  rose: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
};

const blurClasses = {
  cyan: 'bg-cyan-500/20',
  emerald: 'bg-emerald-500/20',
  amber: 'bg-amber-500/20',
  purple: 'bg-purple-500/20',
  rose: 'bg-rose-500/20',
  blue: 'bg-blue-500/20'
};

const textClasses = {
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  purple: 'text-purple-400',
  rose: 'text-rose-400',
  blue: 'text-blue-400'
};

const MetricCard = ({ titulo, valor, color }) => (
  <div className={`border p-4 md:p-5 rounded-2xl flex flex-col justify-center items-center shadow-lg relative overflow-hidden ${bgClasses[color]}`}>
    <div className={`absolute -top-4 -right-4 w-16 h-16 blur-xl rounded-full ${blurClasses[color]}`}></div>
    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 z-10 text-center opacity-80">{titulo}</p>
    <p className="text-3xl md:text-4xl font-black z-10">{valor}</p>
  </div>
);

const TopRankings = ({ titulo, icono, data, color }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden h-fit">
    <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl rounded-full pointer-events-none ${blurClasses[color]}`}></div>
    <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
      <span className={textClasses[color]}>{icono}</span> <span className="truncate">{titulo}</span>
    </h4>
    <div className="space-y-3 relative z-10">
      {data.length > 0 ? data.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors group gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`font-black text-sm w-5 text-center shrink-0 ${idx === 0 ? textClasses[color] : 'text-zinc-600'}`}>#{idx + 1}</span>
            <span className="text-zinc-300 font-bold text-[10px] uppercase tracking-wider group-hover:text-white truncate">{item.sistema}</span>
          </div>
          <span className={`${bgClasses[color]} px-2 py-1 rounded-lg text-[9px] font-black shrink-0 whitespace-nowrap`}>{item.cantidad} {item.cantidad === 1 ? 'Mesa' : 'Mesas'}</span>
        </div>
      )) : <p className="text-zinc-600 text-xs italic text-center py-4">No hay registros aún...</p>}
    </div>
  </div>
);

function Estadisticas() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('global');
  const [pestanaActiva, setPestanaActiva] = useState('resumen'); 

  const [topRol, setTopRol] = useState([]);
  const [topJuegosMesa, setTopJuegosMesa] = useState([]);
  const [topEscapes, setTopEscapes] = useState([]);

  const [resumenGlobal, setResumenGlobal] = useState({ total_mesas: 0, total_jugadores: 0 });

  const [mesasRol, setMesasRol] = useState([]);
  const [mesasJuegos, setMesasJuegos] = useState([]);
  const [escapeRooms, setEscapeRooms] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  useEffect(() => {
    fetchProtegido('/api/usuarios/estadisticas')
      .then(res => res.json())
      .then(datosGlobales => {
        setEventos(datosGlobales);
        const tMesas = datosGlobales.reduce((acc, curr) => acc + (curr.total_mesas || 0), 0);
        const tJugadores = datosGlobales.reduce((acc, curr) => acc + (curr.total_jugadores || 0), 0);
        setResumenGlobal({ total_mesas: tMesas, total_jugadores: tJugadores });
      })
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  }, []);

  useEffect(() => {
    const params = eventoSeleccionado !== 'global' ? `?eventoId=${eventoSeleccionado}` : '';

    Promise.all([
      fetchProtegido(`/api/partidas/estadisticas/sistemas${params}`).then(r => r.json()),
      fetchProtegido(`/api/partidas/estadisticas/juegos-mesa${params}`).then(r => r.json()),
      fetchProtegido(`/api/escapes/estadisticas/top${params}`).then(r => r.json())
    ]).then(([rol, juegos, escapes]) => {
      setTopRol(Array.isArray(rol) ? rol : []);
      setTopJuegosMesa(Array.isArray(juegos) ? juegos : []);
      setTopEscapes(Array.isArray(escapes) ? escapes : []);
    }).catch(err => console.error(err));

    if (eventoSeleccionado !== 'global') {
      setCargandoDetalles(true);
      Promise.all([
        fetchProtegido(`/api/eventos/${eventoSeleccionado}/partidas`).then(r => r.json()),
        fetchProtegido(`/api/escapes/${eventoSeleccionado}`).then(r => r.json())
      ]).then(([partidasData, escapeData]) => {
        const pRol = (Array.isArray(partidasData) ? partidasData : []).filter(p => p.etiqueta !== 'Juegos de Mesa');
        const pJuegos = (Array.isArray(partidasData) ? partidasData : []).filter(p => p.etiqueta === 'Juegos de Mesa');
        setMesasRol(pRol);
        setMesasJuegos(pJuegos);
        setEscapeRooms(Array.isArray(escapeData) ? escapeData : []);
      }).catch(err => console.error(err)).finally(() => setCargandoDetalles(false));
    } else {
      setMesasRol([]);
      setMesasJuegos([]);
      setEscapeRooms([]);
    }
  }, [eventoSeleccionado]);

  let resumenMostrado = { jornadas: 0, mesas: 0, aventureros: 0, ocupacion: 0, dms: 0 };
  
  if (eventoSeleccionado === 'global') {
    resumenMostrado.jornadas = eventos.length;
    resumenMostrado.mesas = resumenGlobal.total_mesas;
    resumenMostrado.aventureros = resumenGlobal.total_jugadores;
  } else {
    resumenMostrado.jornadas = 1;
    const totalTurnosEscape = escapeRooms.reduce((acc, r) => acc + (r.turnos ? r.turnos.length : 0), 0);
    resumenMostrado.mesas = mesasRol.length + mesasJuegos.length + totalTurnosEscape;
    
    const anotadosRol = mesasRol.reduce((acc, m) => acc + (m.jugadoresIniciales || 0), 0);
    const anotadosJuegos = mesasJuegos.reduce((acc, m) => acc + (m.jugadoresIniciales || 0), 0);
    const anotadosEscape = escapeRooms.reduce((acc, r) => acc + r.turnos.reduce((accT, t) => accT + (t.anotados || 0), 0), 0);
    resumenMostrado.aventureros = anotadosRol + anotadosJuegos + anotadosEscape;

    const cupoRol = mesasRol.reduce((acc, m) => acc + (m.cupo || 0), 0);
    const cupoJuegos = mesasJuegos.reduce((acc, m) => acc + (m.cupo || 0), 0);
    const cupoEscape = escapeRooms.reduce((acc, r) => acc + ((r.cupo_por_turno || 0) * r.turnos.length), 0);
    const cupoTotal = cupoRol + cupoJuegos + cupoEscape;

    resumenMostrado.ocupacion = cupoTotal > 0 ? Math.round((resumenMostrado.aventureros / cupoTotal) * 100) : 0;

    const dmsUnicos = new Set();
    mesasRol.forEach(m => dmsUnicos.add(m.dungeon_master_id));
    mesasJuegos.forEach(m => dmsUnicos.add(m.dungeon_master_id));
    escapeRooms.forEach(m => dmsUnicos.add(m.organizador_id));
    resumenMostrado.dms = dmsUnicos.size;
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 flex items-center justify-center rounded-xl border border-cyan-500/30 text-xl shrink-0">📊</div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate">Oráculo de Datos</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">Centro de Análisis del Gremio</p>
          </div>
        </div>
        
        <select 
          value={eventoSeleccionado}
          onChange={(e) => setEventoSeleccionado(e.target.value)}
          className="bg-zinc-950 border border-cyan-500/30 text-white font-bold text-xs uppercase tracking-widest rounded-xl py-3 px-4 outline-none focus:border-cyan-400 transition-colors cursor-pointer w-full sm:w-auto"
        >
          <option value="global">🌍 Censo Histórico Global</option>
          {eventos.map(ev => (
            <option key={ev.id} value={ev.id.toString()}>⚔️ {ev.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-4 mb-6 border-b border-zinc-800 pb-4">
        {['resumen', 'rol', 'juegos_mesa', 'escapes'].map(tab => (
          <button 
            key={tab}
            onClick={() => setPestanaActiva(tab)} 
            className={`flex items-center gap-2 px-4 md:px-6 py-3 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all rounded-xl ${pestanaActiva === tab ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-zinc-500 hover:bg-zinc-900'}`}
          >
            {tab === 'resumen' ? '👁️ Resumen' : tab === 'rol' ? '🎲 Rol' : tab === 'juegos_mesa' ? '🃏 Juegos de Mesa' : '🔐 Escape Rooms'}
          </button>
        ))}
      </div>

      {pestanaActiva === 'resumen' && (
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard titulo={eventoSeleccionado === 'global' ? "Jornadas Totales" : "Jornada"} valor={resumenMostrado.jornadas} color="cyan" />
            <MetricCard titulo={eventoSeleccionado === 'global' ? "Mesas Históricas" : "Mesas y Turnos"} valor={resumenMostrado.mesas} color="emerald" />
            <MetricCard titulo="Aventureros" valor={resumenMostrado.aventureros} color="amber" />
            {eventoSeleccionado !== 'global' && <MetricCard titulo="Ocupación" valor={`${resumenMostrado.ocupacion}%`} color="purple" />}
            {eventoSeleccionado !== 'global' && <MetricCard titulo="Organizadores" valor={resumenMostrado.dms} color="rose" />}
          </div>
          
          {eventoSeleccionado === 'global' && (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl h-fit flex flex-col mt-6">
               <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Histórico de Jornadas</h4>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[400px]">
                     <thead className="bg-zinc-800/30 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                       <tr><th className="p-4">Evento</th><th className="p-4 text-center">Mesas</th><th className="p-4 text-center">Aventureros</th></tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-800/50">
                       {eventos.map((e, i) => (
                         <tr key={i} className="hover:bg-cyan-500/5">
                           <td className="p-4 text-xs font-bold text-zinc-300 uppercase italic truncate max-w-[200px]">{e.nombre}</td>
                           <td className="p-4 text-center"><span className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] font-bold px-3 py-1 rounded-lg">{e.total_mesas}</span></td>
                           <td className="p-4 text-center font-mono text-emerald-500 font-bold">{e.total_jugadores || 0}</td>
                         </tr>
                       ))}
                     </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      )}

      {pestanaActiva === 'rol' && (
        <div className="animate-in fade-in duration-500 grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1">
              <TopRankings titulo="Top Rol" icono="🎲" data={topRol} color="amber" />
           </div>
           <div className="lg:col-span-2">
              {eventoSeleccionado === 'global' ? (
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500 text-xs uppercase tracking-widest font-black italic">
                   Selecciona un evento en el Oráculo para ver las crónicas detalladas de sus mesas.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl h-fit">
                   <div className="p-4 border-b border-zinc-800 bg-zinc-950/50"><h4 className="text-sm font-black text-white uppercase tracking-widest">Mesas Desplegadas</h4></div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left min-w-[500px]">
                       <thead className="bg-zinc-800/30 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                         <tr><th className="p-4">Aventura</th><th className="p-4">Dungeon Master</th><th className="p-4 text-center">Ocupación</th></tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-800/50">
                         {cargandoDetalles ? <tr><td colSpan="3" className="p-8 text-center text-zinc-500">Cargando visiones...</td></tr> : 
                          mesasRol.length > 0 ? mesasRol.map(m => (
                           <tr key={m.id} className="hover:bg-amber-500/5">
                             <td className="p-4">
                               <p className="text-zinc-200 text-xs font-bold uppercase truncate max-w-[200px]">{m.titulo}</p>
                               <p className="text-[9px] text-zinc-500 uppercase tracking-widest truncate">{m.sistema}</p>
                             </td>
                             <td className="p-4 text-[10px] font-bold text-zinc-400 uppercase italic truncate">{m.dmNombre}</td>
                             <td className="p-4 text-center">
                               <span className="text-amber-500 font-black">{m.jugadoresIniciales}</span><span className="text-zinc-600 font-bold text-xs"> / {m.cupo}</span>
                             </td>
                           </tr>
                         )) : <tr><td colSpan="3" className="p-8 text-center text-zinc-600 font-bold italic text-xs uppercase tracking-widest">No se abrieron mesas de rol en este evento.</td></tr>}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {pestanaActiva === 'juegos_mesa' && (
        <div className="animate-in fade-in duration-500 grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1">
              <TopRankings titulo="Top Juegos" icono="🃏" data={topJuegosMesa} color="rose" />
           </div>
           <div className="lg:col-span-2">
              {eventoSeleccionado === 'global' ? (
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500 text-xs uppercase tracking-widest font-black italic">
                   Selecciona un evento en el Oráculo para ver las crónicas detalladas.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl h-fit">
                   <div className="p-4 border-b border-zinc-800 bg-zinc-950/50"><h4 className="text-sm font-black text-white uppercase tracking-widest">Juegos Convocados</h4></div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left min-w-[500px]">
                       <thead className="bg-zinc-800/30 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                         <tr><th className="p-4">Título</th><th className="p-4">Organizador</th><th className="p-4 text-center">Ocupación</th></tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-800/50">
                         {cargandoDetalles ? <tr><td colSpan="3" className="p-8 text-center text-zinc-500">Cargando visiones...</td></tr> : 
                          mesasJuegos.length > 0 ? mesasJuegos.map(m => (
                           <tr key={m.id} className="hover:bg-rose-500/5">
                             <td className="p-4">
                               <p className="text-zinc-200 text-xs font-bold uppercase truncate max-w-[200px]">{m.titulo}</p>
                               <p className="text-[9px] text-zinc-500 uppercase tracking-widest truncate">{m.sistema}</p>
                             </td>
                             <td className="p-4 text-[10px] font-bold text-zinc-400 uppercase italic truncate">{m.dmNombre}</td>
                             <td className="p-4 text-center">
                               <span className="text-rose-500 font-black">{m.jugadoresIniciales}</span><span className="text-zinc-600 font-bold text-xs"> / {m.cupo}</span>
                             </td>
                           </tr>
                         )) : <tr><td colSpan="3" className="p-8 text-center text-zinc-600 font-bold italic text-xs uppercase tracking-widest">No se convocaron juegos de mesa.</td></tr>}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {pestanaActiva === 'escapes' && (
        <div className="animate-in fade-in duration-500 grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1">
              <TopRankings titulo="Top Escapes" icono="🔐" data={topEscapes} color="purple" />
           </div>
           <div className="lg:col-span-2">
              {eventoSeleccionado === 'global' ? (
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500 text-xs uppercase tracking-widest font-black italic">
                   Selecciona un evento en el Oráculo para ver las crónicas detalladas.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl h-fit">
                   <div className="p-4 border-b border-zinc-800 bg-zinc-950/50"><h4 className="text-sm font-black text-white uppercase tracking-widest">Escape Rooms Activos</h4></div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left min-w-[500px]">
                       <thead className="bg-zinc-800/30 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                         <tr><th className="p-4">Sala</th><th className="p-4">Organizador</th><th className="p-4 text-center">Turnos (Ocupación)</th></tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-800/50">
                         {cargandoDetalles ? <tr><td colSpan="3" className="p-8 text-center text-zinc-500">Cargando visiones...</td></tr> : 
                          escapeRooms.length > 0 ? escapeRooms.map(r => (
                           <tr key={r.id} className="hover:bg-purple-500/5">
                             <td className="p-4">
                               <p className="text-zinc-200 text-xs font-bold uppercase truncate max-w-[200px]">{r.titulo}</p>
                               <p className="text-[9px] text-zinc-500 uppercase tracking-widest truncate">Dificultad: {r.dificultad}</p>
                             </td>
                             <td className="p-4 text-[10px] font-bold text-zinc-400 uppercase italic truncate">{r.organizador_nombre}</td>
                             <td className="p-4 text-center">
                               <div className="flex flex-col gap-1 items-center justify-center">
                                 {r.turnos.map(t => (
                                   <div key={t.id} className="bg-zinc-950 px-2 py-1 rounded text-[9px] font-mono text-zinc-400 border border-zinc-800">
                                      {t.hora_inicio.substring(0,5)} - {t.hora_fin.substring(0,5)} <span className="ml-2 text-purple-400 font-bold">{t.anotados} / {r.cupo_por_turno}</span>
                                   </div>
                                 ))}
                               </div>
                             </td>
                           </tr>
                         )) : <tr><td colSpan="3" className="p-8 text-center text-zinc-600 font-bold italic text-xs uppercase tracking-widest">No se crearon Escape Rooms.</td></tr>}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

export default Estadisticas;