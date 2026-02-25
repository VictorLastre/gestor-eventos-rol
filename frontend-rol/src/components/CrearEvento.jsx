import { useState } from 'react';
import Swal from 'sweetalert2'; 

function CrearEvento({ alCrearEvento }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  
  // ✨ NUEVOS ESTADOS PARA LAS HORAS (Por defecto las clásicas del gremio)
  const [horaInicio, setHoraInicio] = useState('16:00');
  const [horaFin, setHoraFin] = useState('20:00');

  const manejarCreacion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    // ✨ AGREGAMOS LAS HORAS AL OBJETO
    const nuevoEvento = { nombre, descripcion, fecha, hora_inicio: horaInicio, hora_fin: horaFin };

    try {
      const respuesta = await fetch('https://gestor-eventos-rol.onrender.com/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify(nuevoEvento)
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        Swal.fire({
          title: '¡Evento Convocado!',
          text: data.mensaje || 'La nueva jornada ha sido registrada en el gremio.',
          icon: 'success',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#9333ea', 
          confirmButtonText: 'Excelente'
        });

        // Limpiamos el formulario
        setNombre(''); setDescripcion(''); setFecha(''); 
        setHoraInicio('16:00'); setHoraFin('20:00');
        
        alCrearEvento(); 

      } else {
        Swal.fire({
          title: 'Aviso del Sistema',
          text: data.error || 'Error al crear evento',
          icon: 'warning',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#f59e0b' 
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: 'Error Mágico',
        text: 'Hubo un fallo de comunicación con el servidor.',
        icon: 'error',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#ef4444' 
      });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      
      {/* Encabezado del Formulario */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-xl border border-purple-500/30 text-xl">
          👑
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">
            Convocar Nuevo Evento
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Panel de Administración
          </p>
        </div>
      </div>

      {/* Contenedor del Formulario */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        {/* Brillo de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full pointer-events-none"></div>

        <form onSubmit={manejarCreacion} className="relative z-10 flex flex-col gap-6">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">
              Nombre del Evento
            </label>
            <input 
              type="text" 
              placeholder="Ej: Convención de Invierno" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 px-5 text-white placeholder:text-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all font-bold"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">
              Descripción
            </label>
            <textarea 
              placeholder="Detalles de la jornada épica..." 
              value={descripcion} 
              onChange={e => setDescripcion(e.target.value)} 
              rows="3"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 px-5 text-white placeholder:text-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all resize-none italic"
            />
          </div>
          
          {/* ✨ GRID PARA FECHA Y HORARIOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">
                Fecha
              </label>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)} 
                required 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 px-5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">
                Apertura
              </label>
              <input 
                type="time" 
                value={horaInicio} 
                onChange={e => setHoraInicio(e.target.value)} 
                required 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 px-5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">
                Cierre
              </label>
              <input 
                type="time" 
                value={horaFin} 
                onChange={e => setHoraFin(e.target.value)} 
                required 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 px-5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all transform active:scale-95 text-xs uppercase tracking-widest"
          >
            ⚔️ Forjar Evento
          </button>
        </form>
      </div>

    </div>
  );
}

export default CrearEvento;