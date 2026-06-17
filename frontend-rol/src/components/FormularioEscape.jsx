import { useState } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 

function FormularioEscape({ eventoId, onClose, onSuccess }) {
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    dificultad: 'Intermedia',
    edad_minima: 'Apta para todo público',
    cupo_por_turno: 4,
    materiales_pedidos: ''
  });

  const [turnos, setTurnos] = useState([
    { hora_inicio: '16:00', hora_fin: '16:45' }
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTurnoChange = (index, campo, valor) => {
    const nuevosTurnos = [...turnos];
    nuevosTurnos[index][campo] = valor;
    setTurnos(nuevosTurnos);
  };

  const agregarTurno = () => {
    setTurnos([...turnos, { hora_inicio: '', hora_fin: '' }]);
  };

  const eliminarTurno = (index) => {
    if (turnos.length === 1) {
      return Swal.fire({
        title: '¡Espera!',
        text: 'La sala debe tener al menos un horario habilitado.',
        icon: 'warning',
        background: '#09090b', color: '#fff'
      });
    }
    const nuevosTurnos = turnos.filter((_, i) => i !== index);
    setTurnos(nuevosTurnos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const turnosValidos = turnos.every(t => t.hora_inicio && t.hora_fin);
    if (!turnosValidos) {
      return Swal.fire({
        title: 'Horarios Incompletos',
        text: 'Asegúrate de definir la hora de inicio y fin para todos los pases.',
        icon: 'error',
        background: '#09090b', color: '#fff',
        customClass: { popup: 'border border-red-500/30 rounded-[2rem]' }
      });
    }

    setCargando(true);
    try {
      // ✨ CORRECCIÓN: Ruta relativa para habilitar la sala
      const res = await fetchProtegido(`/api/escapes/${eventoId}`, {
        method: 'POST',
        body: JSON.stringify({ ...formData, turnos })
      });

      if (res.ok) {
        Swal.fire({
          title: '¡Sala Habilitada!',
          text: 'El Escape Room ya está listo para recibir a las víctimas... digo, aventureros.',
          icon: 'success',
          background: '#09090b', color: '#fff', confirmButtonColor: '#10b981',
          customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' }
        });
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Error', text: data.error, icon: 'error', background: '#09090b', color: '#fff' });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Error', text: 'Falló la conexión con el gremio.', icon: 'error', background: '#09090b', color: '#fff' });
    }
    setCargando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 md:p-10 w-full max-w-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-zinc-900 text-zinc-500 hover:text-white hover:bg-red-500 rounded-full flex items-center justify-center transition-all">✕</button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 flex items-center justify-center rounded-2xl border border-indigo-500/20 text-2xl">
            🔐
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Diseñar Escape Room</h2>
            <p className="text-xs text-indigo-400/80 font-bold uppercase tracking-[0.2em]">Configura la sala y sus pases</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 space-y-4">
            <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Información de la Sala</h3>
            
            <div>
              <label className="block text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2 ml-2">Nombre de la Sala</label>
              <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Ej: El Laboratorio del Dr. Muerte" className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm font-bold rounded-2xl py-4 px-5 focus:border-indigo-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2 ml-2">Misión / Sinopsis</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required placeholder="¿De qué trata? ¿Qué tienen que resolver?" rows="3" className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm font-bold rounded-2xl py-4 px-5 focus:border-indigo-500 outline-none transition-all resize-none"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2 ml-2">Dificultad</label>
                <select name="dificultad" value={formData.dificultad} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm font-bold rounded-2xl py-4 px-5 focus:border-indigo-500 outline-none appearance-none">
                  <option value="Fácil">🟢 Fácil</option>
                  <option value="Intermedia">🟡 Intermedia</option>
                  <option value="Experta">🔴 Experta</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2 ml-2">Restricción de Edad</label>
                <select name="edad_minima" value={formData.edad_minima} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm font-bold rounded-2xl py-4 px-5 focus:border-indigo-500 outline-none appearance-none">
                  <option value="Apta para todo público">Todo Público</option>
                  <option value="+13 años">+13 años</option>
                  <option value="+16 años">+16 años</option>
                  <option value="+18 años">+18 años</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2 ml-2">Jugadores por Pase</label>
                <input type="number" name="cupo_por_turno" value={formData.cupo_por_turno} onChange={handleChange} min="1" max="20" required className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm font-bold rounded-2xl py-4 px-5 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2 ml-2">Materiales / Logística (Para los organizadores)</label>
              <textarea name="materiales_pedidos" value={formData.materiales_pedidos} onChange={handleChange} placeholder="Ej: Necesito 2 mesas chicas, oscuridad total, y enchufes." rows="2" className="w-full bg-zinc-950 border border-zinc-800 text-zinc-400 text-sm font-bold rounded-2xl py-4 px-5 focus:border-indigo-500 outline-none transition-all resize-none"></textarea>
            </div>
          </div>

          <div className="bg-indigo-950/10 p-6 rounded-3xl border border-indigo-500/20 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em]">Pases / Horarios</h3>
              <button type="button" onClick={agregarTurno} className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                + Añadir Pase
              </button>
            </div>

            <div className="space-y-3">
              {turnos.map((turno, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 group">
                  <span className="text-zinc-600 font-black text-[10px] uppercase tracking-widest w-16 text-center">Pase {index + 1}</span>
                  
                  <div className="flex-1 flex items-center gap-2 w-full">
                    <input type="time" value={turno.hora_inicio} onChange={(e) => handleTurnoChange(index, 'hora_inicio', e.target.value)} required className="flex-1 bg-zinc-900 border border-zinc-800 text-white text-sm font-bold rounded-xl py-3 px-4 focus:border-indigo-500 outline-none" />
                    <span className="text-zinc-600">a</span>
                    <input type="time" value={turno.hora_fin} onChange={(e) => handleTurnoChange(index, 'hora_fin', e.target.value)} required className="flex-1 bg-zinc-900 border border-zinc-800 text-white text-sm font-bold rounded-xl py-3 px-4 focus:border-indigo-500 outline-none" />
                  </div>

                  <button type="button" onClick={() => eliminarTurno(index)} className="w-full sm:w-12 h-12 bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 border border-zinc-800 hover:border-red-500/50 rounded-xl flex items-center justify-center transition-all">🗑️</button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all border border-zinc-800">Cancelar</button>
            <button type="submit" disabled={cargando} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
              {cargando ? '⚙️ Forjando Sala...' : '🔐 Habilitar Escape Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormularioEscape;