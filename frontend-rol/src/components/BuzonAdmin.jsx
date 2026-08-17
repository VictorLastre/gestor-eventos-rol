import React, { useState, useEffect } from 'react';
import { fetchProtegido } from '../utils/api';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

const BuzonAdmin = ({ usuarioLogueado }) => {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const fetchMensajes = async () => {
    try {
      const response = await fetchProtegido('/api/buzon');
      const data = await response.json();
      setMensajes(data);
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMensajes();

    const socket = io('/', { path: '/api/socket.io' });
    
    socket.on('nuevo-mensaje-buzon', () => {
      fetchMensajes();
    });
    
    socket.on('actualizacion-buzon', () => {
      fetchMensajes();
    });

    return () => socket.disconnect();
  }, []);

  const toggleLeido = async (id, estadoActual) => {
    try {
      const resp = await fetchProtegido(`/api/buzon/${id}/leer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leido: !estadoActual })
      });
      if (resp.ok) {
        fetchMensajes();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarMensaje = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar mensaje?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      background: '#18181b',
      color: '#fff',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Sí, borrar'
    });

    if (result.isConfirmed) {
      try {
        const resp = await fetchProtegido(`/api/buzon/${id}`, { method: 'DELETE' });
        if (resp.ok) {
          fetchMensajes();
          Swal.fire({
            title: 'Borrado',
            text: 'El mensaje ha sido eliminado.',
            icon: 'success',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#10b981'
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (cargando) return <div className="text-center text-white py-20 animate-pulse">Consultando el buzón mágico...</div>;

  const noLeidos = mensajes.filter(m => !m.leido).length;

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-b border-indigo-500/30 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <span>📬</span> Buzón de la Taberna
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Aquí llegan las quejas, dudas y sugerencias anónimas de los usuarios.</p>
        </div>
        <div className="mt-4 md:mt-0 bg-indigo-900/50 border border-indigo-500/50 text-indigo-300 px-4 py-2 rounded-lg font-bold tracking-widest text-sm uppercase flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {noLeidos > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${noLeidos > 0 ? 'bg-red-500' : 'bg-zinc-500'}`}></span>
          </span>
          {noLeidos} Sin Leer
        </div>
      </div>

      {mensajes.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-6xl mb-4 opacity-50">📭</p>
          <h3 className="text-xl font-bold text-zinc-300">El buzón está vacío</h3>
          <p className="text-zinc-500 mt-2">Nadie ha dejado mensajes por ahora.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mensajes.map((msg) => (
            <div 
              key={msg.id} 
              className={`relative overflow-hidden border rounded-xl p-5 md:p-6 transition-all ${
                msg.leido 
                  ? 'bg-zinc-900/40 border-zinc-800 opacity-75 hover:opacity-100' 
                  : 'bg-zinc-800 border-indigo-500/40 shadow-lg shadow-indigo-900/20'
              }`}
            >
              {!msg.leido && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
              )}
              
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded ${
                      msg.tipo === 'Queja' ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
                      msg.tipo === 'Duda' ? 'bg-blue-900/50 text-blue-400 border border-blue-500/30' :
                      'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {msg.tipo === 'Queja' ? '📢' : msg.tipo === 'Duda' ? '❓' : '💡'} {msg.tipo}
                    </span>
                    <span className="text-zinc-500 text-xs font-bold">{formatearFecha(msg.fecha)}</span>
                  </div>
                  
                  <p className={`text-sm md:text-base whitespace-pre-wrap ${msg.leido ? 'text-zinc-400' : 'text-zinc-200'}`}>
                    {msg.mensaje}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 md:flex-col md:w-32 flex-shrink-0">
                  <button 
                    onClick={() => toggleLeido(msg.id, msg.leido)}
                    className={`flex-1 w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${
                      msg.leido 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' 
                        : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border-indigo-500/30'
                    }`}
                  >
                    {msg.leido ? 'Marcar No Leído' : '✓ Marcar Leído'}
                  </button>
                  <button 
                    onClick={() => eliminarMensaje(msg.id)}
                    className="md:flex-1 p-2 md:py-2 md:px-3 w-auto md:w-full rounded text-xs font-bold uppercase tracking-wider transition-colors border bg-zinc-900 hover:bg-red-900/50 text-zinc-500 hover:text-red-400 border-zinc-800 hover:border-red-500/30"
                    title="Eliminar mensaje"
                  >
                    🗑️ <span className="hidden md:inline">Borrar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuzonAdmin;
