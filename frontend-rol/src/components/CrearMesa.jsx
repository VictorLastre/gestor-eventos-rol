import { useState } from 'react';
import Swal from 'sweetalert2'; 

function CrearMesa({ idEvento, alCrearMesa }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [sistema, setSistema] = useState('');
  const [cupo, setCupo] = useState(4);
  const [turno, setTurno] = useState('Tarde');
  
  // ✨ NUEVOS ESTADOS PARA LOS TAGS
  const [etiqueta, setEtiqueta] = useState('Fantasía Medieval');
  const [aptaNovatos, setAptaNovatos] = useState(false);

  const manejarCreacion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    // ✨ AGREGAMOS LOS NUEVOS DATOS AL OBJETO
    const nuevaMesa = { 
      titulo, 
      descripcion, 
      requisitos, 
      sistema, 
      cupo, 
      turno, 
      etiqueta, 
      apta_novatos: aptaNovatos 
    };

    try {
      const respuesta = await fetch(`https://gestor-eventos-rol.onrender.com/api/eventos/${idEvento}/partidas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify(nuevaMesa)
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        Swal.fire({
          title: '¡Mesa Forjada!',
          text: data.mensaje || 'Tu aventura ha sido publicada en el tablón.',
          icon: 'success',
          background: '#18181b', 
          color: '#fff',
          confirmButtonColor: '#f59e0b', 
          confirmButtonText: '¡A preparar los dados!'
        });

        // Limpiamos los campos
        setTitulo(''); setDescripcion(''); setRequisitos(''); 
        setSistema(''); setCupo(4); setEtiqueta('Fantasía Medieval'); setAptaNovatos(false);
        
        alCrearMesa(); 

      } else {
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
      Swal.fire({
        title: 'Error Mágico',
        text: 'Los pergaminos no pudieron llegar al servidor.',
        icon: 'error',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#ef4444' 
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

        {/* ✨ SECCIÓN NUEVA: ETIQUETAS Y NOVATOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex flex-col gap-1 justify-center">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Género Principal</label>
            <select 
              value={formulario.etiqueta} 
              onChange={manejarCambio} 
              name="etiqueta" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 px-4 text-white focus:border-amber-500 outline-none font-bold"
            >
              <option value="Fantasía Medieval">🏰 Fantasía Medieval</option>
              <option value="Fantasía Oscura">🌑 Fantasía Oscura</option>
              <option value="Fantasía Urbana">🏙️ Fantasía Urbana</option>
              <option value="Terror / Horror">🩸 Terror / Horror</option>
              <option value="Horror Cósmico">🐙 Horror Cósmico</option>
              <option value="Terror Espacial">🛰️ Terror Espacial</option>
              <option value="Ciencia Ficción">🚀 Ciencia Ficción</option>
              <option value="Cyberpunk">🦾 Cyberpunk</option>
              <option value="Steampunk">⚙️ Steampunk</option>
              <option value="Post-Apocalíptico">☢️ Post-Apocalíptico</option>
              <option value="Misterio / Investigación">🔎 Misterio / Investigación</option>
              <option value="Mundo de Tinieblas">🦇 Mundo de Tinieblas</option>
              <option value="Superhéroes">🦸 Superhéroes</option>
              <option value="Western / Weird West">🤠 Western / Weird West</option>
              <option value="Piratas / Naval">🏴‍☠️ Piratas / Naval</option>
              <option value="Space Opera">🛸 Space Opera</option>
              <option value="Histórico">📜 Histórico</option>
              <option value="Anime / Manga">🌸 Anime / Manga</option>
              <option value="Espionaje / Acción">🕶️ Espionaje / Acción</option>
              <option value="Rol Infantil / Familiar">🧸 Rol Infantil / Familiar</option>
              <option value="Comedia">🎭 Comedia</option>
            </select>
          </div>

          <div 
            onClick={() => setAptaNovatos(!aptaNovatos)}
            className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-4 select-none mt-5 md:mt-0 ${
              aptaNovatos 
              ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div>
              <h4 className={`font-black uppercase tracking-widest text-xs ${aptaNovatos ? 'text-emerald-400' : 'text-zinc-500'}`}>
                🌱 Apta Novatos
              </h4>
              <p className={`text-[9px] uppercase mt-0.5 ${aptaNovatos ? 'text-emerald-500/80' : 'text-zinc-600'}`}>
                Ideal para aprender a jugar
              </p>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${aptaNovatos ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700'}`}>
              {aptaNovatos && <span className="font-black text-sm">✓</span>}
            </div>
          </div>

        </div>

        <div className="space-y-1">
          <input 
            type="text" 
            placeholder="Requisitos (opcional, ej: Nivel 5, Veteranos, Leer lore)" 
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
              placeholder="Ej: D&D 5e, Daggerheart..." 
              value={sistema} 
              onChange={e => setSistema(e.target.value)} 
              required 
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all font-bold" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Cupo</label>
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
    </div>
  );
}

export default CrearMesa;