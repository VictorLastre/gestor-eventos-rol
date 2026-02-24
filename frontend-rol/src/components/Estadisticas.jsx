import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // ✨ IMPORTAMOS SWEETALERT

function Estadisticas() {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('https://gestor-eventos-rol.onrender.com/api/usuarios/estadisticas', {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(setDatos)
      .catch(err => {
        console.error(err);
        // ✨ MANEJO DE ERRORES CON SWEETALERT
        Swal.fire({
          title: 'El Oráculo está nublado',
          text: 'Hubo un error al consultar los anales de la asociación.',
          icon: 'error',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#06b6d4' // cyan-500
        });
      });
  }, []);

  // ✨ CÁLCULO AUTOMÁTICO DE MÉTRICAS GLOBALES
  const totalEventos = datos.length;
  const totalMesasGlobal = datos.reduce((acc, curr) => acc + (curr.total_mesas || 0), 0);
  const totalAventurerosGlobal = datos.reduce((acc, curr) => acc + (curr.total_jugadores || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      
      {/* Encabezado de la Sección */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 flex items-center justify-center rounded-xl border border-cyan-500/30 text-xl">
          📊
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">
            Métricas de la Asociación
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Censo Histórico del Gremio
          </p>
        </div>
      </div>

      {/* ✨ TARJETAS DE RESUMEN GLOBAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-center items-center shadow-lg relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-cyan-500/5 blur-xl rounded-full"></div>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 z-10">Jornadas Totales</p>
          <p className="text-4xl font-black text-white z-10">{totalEventos}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-center items-center shadow-lg relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-cyan-500/5 blur-xl rounded-full"></div>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 z-10">Mesas Desplegadas</p>
          <p className="text-4xl font-black text-white z-10">{totalMesasGlobal}</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 p-5 rounded-2xl flex flex-col justify-center items-center shadow-[0_0_20px_rgba(6,182,212,0.1)] relative overflow-hidden">
          <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1 z-10 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span> Aventureros Sentados
          </p>
          <p className="text-4xl font-black text-cyan-400 z-10">{totalAventurerosGlobal}</p>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl relative z-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-800/50 border-b border-zinc-700">
              <th className="p-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Evento</th>
              <th className="p-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Mesas</th>
              <th className="p-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Aventureros</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {datos.length > 0 ? (
              datos.map((d, i) => (
                <tr 
                  key={i} 
                  className="group hover:bg-cyan-500/5 transition-colors duration-200"
                >
                  <td className="p-5">
                    <span className="text-sm font-bold text-zinc-200 group-hover:text-cyan-400 transition-colors uppercase italic tracking-tight">
                      {d.nombre}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <span className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-bold px-4 py-1.5 rounded-lg shadow-inner">
                      {d.total_mesas}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full group-hover:animate-ping"></span>
                      <span className="text-lg font-black text-emerald-500 font-mono">
                        {d.total_jugadores || 0}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-10 text-center text-zinc-600 italic font-bold">
                  No hay crónicas registradas en los anales...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen rápido opcional al pie */}
      <div className="mt-6 flex justify-end">
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic">
          * Datos actualizados en tiempo real por el Oráculo
        </p>
      </div>
    </div>
  );
}

export default Estadisticas;