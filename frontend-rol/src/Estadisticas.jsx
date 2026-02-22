import { useState, useEffect } from 'react';

function Estadisticas() {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/api/admin/estadisticas', {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(setDatos)
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Encabezado de la Sección */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 flex items-center justify-center rounded-xl border border-cyan-500/30">
          📊
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">
            Métricas de la Asociación de rol La Pampa
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Censo del Gremio
          </p>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl">
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
                    <span className="text-sm font-bold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                      {d.nombre}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <span className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-bold px-3 py-1 rounded-lg shadow-inner">
                      {d.total_mesas}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
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