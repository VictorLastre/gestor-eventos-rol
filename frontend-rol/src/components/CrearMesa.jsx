import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 

// ✨ CONFIGURACIÓN DE ESTILOS POR ETIQUETA
const CONFIG_ETIQUETAS = {
  "Fantasía Medieval": { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "🏰" },
  "Fantasía Oscura": { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "🌑" },
  "Fantasía Urbana": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "🏙️" },
  "Terror / Horror": { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: "🩸" },
  "Horror Cósmico": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "🐙" },
  "Ciencia Ficción": { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", icon: "🚀" },
  "Cyberpunk": { color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", icon: "🦾" },
  "Post-Apocalíptico": { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "☢️" },
  "Misterio / Investigación": { color: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: "🔎" },
  "Anime / Manga": { color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30", icon: "🌸" },
  "Escape Room": { color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/30", icon: "🗝️" }
};

function CrearMesa({ idEvento, alCrearMesa }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [requisitos, setRequisitos] = useState('');
  
  const [sistemas, setSistemas] = useState([]);
  const [sistemaId, setSistemaId] = useState('');
  
  const [cupo, setCupo] = useState(4);
  const [turno, setTurno] = useState('Tarde');
  const [etiqueta, setEtiqueta] = useState('Fantasía Medieval');
  const [aptaNovatos, setAptaNovatos] = useState(false);
  const [materialesPedidos, setMaterialesPedidos] = useState('');

  useEffect(() => {
    fetch('https://gestor-eventos-rol.onrender.com/api/sistemas')
      .then(res => res.json())
      .then(data => {
        setSistemas(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Error al cargar sistemas:", err));
  }, []);

  const manejarCreacion = async (e) => {
    e.preventDefault();
    
    if (!sistemaId) {
        return Swal.fire({
            title: 'Falta información',
            text: 'Debes seleccionar un sistema de juego de la lista.',
            icon: 'warning',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#f59e0b'
        });
    }

    const nuevaMesa = { 
      titulo, 
      descripcion, 
      requisitos, 
      sistema_id: sistemaId, 
      cupo, 
      turno, 
      etiqueta, 
      apta_novatos: aptaNovatos,
      materiales_pedidos: materialesPedidos 
    };

    try {
      const respuesta = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/eventos/${idEvento}/partidas`, {
        method: 'POST',
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

        setTitulo(''); setDescripcion(''); setRequisitos(''); 
        setSistemaId(''); setCupo(4); setEtiqueta('Fantasía Medieval'); 
        setAptaNovatos(false); setMaterialesPedidos('');
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
      if (error === 'Sesión expirada') return;
      console.error("Error:", error);
      Swal.fire({ title: 'Error Mágico', text: 'Los pergaminos no pudieron llegar al servidor.', icon: 'error', background: '#18181b', color: '#fff', confirmButtonColor: '#ef4444' });
    }
  };

  // Obtener estilo actual basado en la etiqueta seleccionada
  const estiloActual = CONFIG_ETIQUETAS[etiqueta] || CONFIG_ETIQUETAS["Fantasía Medieval"];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl mx-auto">
      
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 ${estiloActual.bg} ${estiloActual.color} flex items-center justify-center rounded-2xl border ${estiloActual.border} text-2xl shadow-lg transition-all duration-500`}>
          {estiloActual.icon}
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
            Forjar Nueva Mesa
          </h3>
          <p className={`text-[10px] ${estiloActual.color} font-black uppercase tracking-[0.3em] mt-1 transition-colors duration-500`}>
            {etiqueta}
          </p>
        </div>
      </div>

      <div className="relative group">
        <div className={`absolute -inset-1 ${estiloActual.bg} rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000`}></div>

        <div className="relative bg-zinc-900/90 border border-zinc-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          
          <form onSubmit={manejarCreacion} className="relative z-10 flex flex-col gap-6">
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Nombre de la Gesta</label>
              <input 
                type="text" 
                placeholder="Ej: El Despertar del Dragón" 
                value={titulo} 
                onChange={e => setTitulo(e.target.value)} 
                required 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all font-bold placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Resumen de la Aventura</label>
              <textarea 
                placeholder="Escribe la sinopsis que atraerá a los valientes..." 
                value={descripcion} 
                onChange={e => setDescripcion(e.target.value)} 
                required 
                rows="3" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all resize-none italic font-medium placeholder:text-zinc-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Ambientación / Etiqueta</label>
                <select 
                  value={etiqueta} 
                  onChange={e => setEtiqueta(e.target.value)} // ✨ CORREGIDO: Antes era setTurno
                  className={`w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:ring-1 outline-none font-bold [color-scheme:dark] transition-all ${estiloActual.color}`}
                >
                  {Object.keys(CONFIG_ETIQUETAS).map(opcion => (
                    <option key={opcion} value={opcion}>{CONFIG_ETIQUETAS[opcion].icon} {opcion}</option>
                  ))}
                </select>
              </div>

              <div 
                onClick={() => setAptaNovatos(!aptaNovatos)}
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between select-none mt-auto h-[60px] ${
                  aptaNovatos 
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${aptaNovatos ? 'opacity-100' : 'opacity-30'}`}>🌱</span>
                  <div>
                    <h4 className={`font-black uppercase tracking-widest text-[11px] ${aptaNovatos ? 'text-emerald-400' : 'text-zinc-500'}`}>Apta Novatos</h4>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${aptaNovatos ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700'}`}>
                  {aptaNovatos && <span className="font-black text-xs">✓</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Sistema</label>
                <select 
                  value={sistemaId} 
                  onChange={e => setSistemaId(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-amber-500 outline-none font-bold [color-scheme:dark]"
                >
                  <option value="">Seleccionar...</option>
                  {sistemas.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Cupo Máx.</label>
                <input 
                  type="number" 
                  value={cupo} 
                  onChange={e => setCupo(e.target.value)} 
                  min="1" max="10" required 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-amber-500 outline-none font-bold" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Turno</label>
                <select 
                  value={turno} 
                  onChange={e => setTurno(e.target.value)} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-amber-500 outline-none font-bold [color-scheme:dark]"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Requisitos de PJ</label>
                <input 
                  type="text" 
                  placeholder="Ej: Nivel 3, traer ficha lista" 
                  value={requisitos} 
                  onChange={e => setRequisitos(e.target.value)} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-amber-500 outline-none font-bold placeholder:text-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-amber-500 uppercase ml-1 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  Logística (Pedido al Gremio)
                </label>
                <input 
                  type="text" 
                  placeholder="¿Necesitas dados, mapas...?" 
                  value={materialesPedidos} 
                  onChange={e => setMaterialesPedidos(e.target.value)} 
                  className="w-full bg-amber-500/5 border border-amber-500/20 rounded-2xl py-4 px-6 text-amber-200 focus:border-amber-500 outline-none italic text-sm placeholder:text-amber-900/50 shadow-inner"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="mt-4 relative group/btn overflow-hidden rounded-2xl shadow-xl transition-all active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 transition-transform group-hover/btn:scale-105 duration-500"></div>
              <div className="relative flex items-center justify-center gap-3 py-5 font-black text-black text-sm uppercase tracking-[0.3em] border border-white/20">
                <span>⚔️</span> Forjar Mesa de Rol
              </div>
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}

export default CrearMesa;