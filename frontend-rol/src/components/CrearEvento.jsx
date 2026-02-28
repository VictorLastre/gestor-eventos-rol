import { useState } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 

function CrearEvento({ alCrearEvento }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  
  const [horaInicio, setHoraInicio] = useState('16:00');
  const [horaFin, setHoraFin] = useState('20:00');

  const manejarCreacion = async (e) => {
    e.preventDefault();
    
    const nuevoEvento = { 
      nombre, 
      descripcion, 
      fecha, 
      hora_inicio: horaInicio, 
      hora_fin: horaFin 
    };

    try {
      const respuesta = await fetchProtegido('https://gestor-eventos-rol.onrender.com/api/eventos', {
        method: 'POST',
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
      if (error === 'Sesión expirada') return;
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      
      {/* 👑 CABECERA DEL PANEL */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-2xl border border-purple-500/30 text-2xl shadow-[0_0_15px_rgba(147,51,234,0.2)]">
          👑
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
            Convocar Nuevo Evento
          </h3>
          <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mt-1">
            Mesa de Comando del Gremio
          </p>
        </div>
      </div>

      {/* 🏰 FORMULARIO ESTILO GRIMDARK */}
      <div className="group relative">
        {/* Resplandor de fondo que reacciona al hover del grupo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-emerald-600/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          
          {/* Adorno visual: Mancha de luz interna */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>

          <form onSubmit={manejarCreacion} className="relative z-10 flex flex-col gap-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* CAMPO: NOMBRE */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-zinc-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                  Nombre de la Jornada
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Crónicas de Invierno" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  required 
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all font-bold shadow-inner"
                />
              </div>

              {/* CAMPO: FECHA */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-zinc-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  Fecha Prevista
                </label>
                <input 
                  type="date" 
                  value={fecha} 
                  onChange={e => setFecha(e.target.value)} 
                  required 
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark] font-bold"
                />
              </div>
            </div>
            
            {/* CAMPO: DESCRIPCIÓN */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-zinc-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Manifiesto del Evento
              </label>
              <textarea 
                placeholder="Describe los desafíos que aguardan a los aventureros..." 
                value={descripcion} 
                onChange={e => setDescripcion(e.target.value)} 
                rows="3"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all resize-none italic font-medium"
              />
            </div>
            
            {/* CAMPOS: HORARIOS */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-zinc-400 uppercase ml-1 tracking-widest">
                  Tocar Llamada (Inicio)
                </label>
                <input 
                  type="time" 
                  value={horaInicio} 
                  onChange={e => setHoraInicio(e.target.value)} 
                  required 
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark] font-bold"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-zinc-400 uppercase ml-1 tracking-widest">
                  Fin de la Guardia (Cierre)
                </label>
                <input 
                  type="time" 
                  value={horaFin} 
                  onChange={e => setHoraFin(e.target.value)} 
                  required 
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark] font-bold"
                />
              </div>
            </div>

            {/* BOTÓN DE ACCIÓN */}
            <button 
              type="submit" 
              className="group/btn relative mt-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 transition-all group-hover/btn:scale-105"></div>
              <div className="relative flex items-center justify-center gap-3 bg-transparent py-5 rounded-2xl font-black text-white text-sm uppercase tracking-[0.2em] shadow-xl transition-transform active:scale-95 border border-white/10">
                <span>⚔️</span> Forjar Evento <span>⚔️</span>
              </div>
            </button>
            
          </form>
        </div>
      </div>

    </div>
  );
}

export default CrearEvento;