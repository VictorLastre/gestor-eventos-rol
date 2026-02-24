import { useState } from 'react';
import Swal from 'sweetalert2'; // ✨ IMPORTAMOS SWEETALERT

function CrearMesa({ idEvento, alCrearMesa }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [sistema, setSistema] = useState('');
  const [cupo, setCupo] = useState(4);
  const [turno, setTurno] = useState('Tarde');

  // ✨ Eliminamos el estado `mensaje` porque ya no lo necesitamos

  const manejarCreacion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const nuevaMesa = { titulo, descripcion, requisitos, sistema, cupo, turno };

    try {
      const respuesta = await fetch(`https://gestor-eventos-rol.onrender.com/api/eventos/${idEvento}/partidas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify(nuevaMesa)
      });

      // Parseamos la respuesta como JSON
      const data = await respuesta.json();

      if (respuesta.ok) {
        // ✨ ALERTA DE ÉXITO ESTILO DM
        Swal.fire({
          title: '¡Mesa Forjada!',
          text: data.mensaje || 'Tu aventura ha sido publicada en el tablón.',
          icon: 'success',
          background: '#18181b', // zinc-900
          color: '#fff',
          confirmButtonColor: '#f59e0b', // amber-500
          confirmButtonText: '¡A preparar los dados!'
        });

        // Limpiamos los campos y recargamos la vista principal al instante
        setTitulo(''); 
        setDescripcion(''); 
        setRequisitos(''); 
        setSistema(''); 
        setCupo(4);
        alCrearMesa(); 

      } else {
        // ✨ ALERTA DE RESTRICCIÓN (Ej: ya es DM o jugador)
        Swal.fire({
          title: 'Aviso del Gremio',
          text: data.error || 'Error al crear la mesa.',
          icon: 'warning',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#f59e0b'
        });
      }
    } catch (error) {
      console.error("Error:", error);
      // ✨ ALERTA DE ERROR DE CONEXIÓN
      Swal.fire({
        title: 'Error Mágico',
        text: 'Los pergaminos no pudieron llegar al servidor.',
        icon: 'error',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#ef4444' // red-500
      });
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-500/20 text-amber-500 flex items-center justify-center rounded-xl border border-amber-500/30 text-xl">
          📜
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">
            Forjar Nueva Mesa
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Convocatoria de Aventuras
          </p>
        </div>
      </div>

      <form onSubmit={manejarCreacion} className="flex flex-col gap-5">
        
        <div className="space-y-1">
          <input 
            type="text" 
            placeholder="Título de la aventura" 
            value={titulo} 
            onChange={e => setTitulo(e.target.value)} 
            required 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all font-bold placeholder:text-zinc-700"
          />
        </div>

        <div className="space-y-1">
          <textarea 
            placeholder="Descripción épica de la partida..." 
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)} 
            required 
            rows="3" 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all resize-none italic placeholder:text-zinc-700"
          />
        </div>

        <div className="space-y-1">
          <input 
            type="text" 
            placeholder="Requisitos (opcional, ej: Nivel 5, Veteranos)" 
            value={requisitos} 
            onChange={e => setRequisitos(e.target.value)} 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all placeholder:text-zinc-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Sistema</label>
            <input 
              type="text" 
              placeholder="Ej: D&D 5e" 
              value={sistema} 
              onChange={e => setSistema(e.target.value)} 
              required 
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all font-bold" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Cupo Máximo</label>
            <input 
              type="number" 
              value={cupo} 
              onChange={e => setCupo(e.target.value)} 
              min="1" 
              max="10" 
              required 
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all font-bold" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Turno</label>
            <select 
              value={turno} 
              onChange={e => setTurno(e.target.value)} 
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all font-bold appearance-none cursor-pointer"
            >
              <option value="Mañana" className="bg-zinc-900 text-white">Mañana</option>
              <option value="Tarde" className="bg-zinc-900 text-white">Tarde</option>
              <option value="Noche" className="bg-zinc-900 text-white">Noche</option>
              <option value="Madrugada" className="bg-zinc-900 text-white">Madrugada</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 text-xs uppercase tracking-widest mt-2"
        >
          ⚔️ Crear Mesa de Rol
        </button>
      </form>
      
      {/* ✨ El div del mensaje en texto plano desapareció por completo */}
    </div>
  );
}

export default CrearMesa;