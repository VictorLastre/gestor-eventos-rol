import { useState } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 

function CrearMesaJuego({ idEvento, alCrearMesa }) {
  const [titulo, setTitulo] = useState('');
  const [juego, setJuego] = useState(''); // Lo usaremos como "sistema" en la BD
  const [descripcion, setDescripcion] = useState('');
  const [requisitos, setRequisitos] = useState('');
  
  const [cupo, setCupo] = useState(4);
  const [turno, setTurno] = useState('Tarde');
  const [aptaNovatos, setAptaNovatos] = useState(false);
  const [materialesPedidos, setMaterialesPedidos] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarCreacion = async (e) => {
    e.preventDefault();
    
    if (!juego.trim()) {
        return Swal.fire({
            title: 'Falta el Juego',
            text: 'Debes indicar a qué van a jugar (Ej: Magic, Catan, Uno...).',
            icon: 'warning',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#f43f5e' // Rose 500
        });
    }

    // Armamos el paquete asegurándonos que la etiqueta sea 'Juegos de Mesa'
    const nuevaMesa = { 
      titulo, 
      descripcion, 
      requisitos, 
      sistema: juego,      // Enviamos el nombre del juego como sistema
      sistema_id: null,    // Sin ID fijo en BD
      cupo, 
      turno, 
      etiqueta: 'Juegos de Mesa', // ✨ ETIQUETA CLAVE PARA EL BACKEND
      apta_novatos: aptaNovatos,
      materiales_pedidos: materialesPedidos 
    };

    setCargando(true);

    try {
      const respuesta = await fetchProtegido(`/api/eventos/${idEvento}/partidas`, {
        method: 'POST',
        body: JSON.stringify(nuevaMesa)
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        Swal.fire({
          title: '¡Mesa Desplegada!',
          text: data.mensaje || 'Tu juego de mesa ha sido publicado en el tablón.',
          icon: 'success',
          background: '#18181b', 
          color: '#fff',
          confirmButtonColor: '#f43f5e', 
          confirmButtonText: '¡A mezclar las cartas!'
        });

        setTitulo(''); setDescripcion(''); setRequisitos(''); 
        setJuego(''); setCupo(4); 
        setAptaNovatos(false); setMaterialesPedidos('');
        alCrearMesa(); 

      } else {
        Swal.fire({
          title: 'Aviso del Gremio',
          text: data.error || 'Error al convocar la partida.',
          icon: 'warning',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#f43f5e'
        });
      }
    } catch (error) {
      if (error === 'Sesión expirada') return;
      console.error("Error:", error);
      Swal.fire({ title: 'Error', text: 'Los pergaminos no pudieron llegar al servidor.', icon: 'error', background: '#18181b', color: '#fff', confirmButtonColor: '#ef4444' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl mx-auto">
      
      {/* HEADER DEL FORMULARIO */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-2xl border border-rose-500/30 text-2xl shadow-lg">
          🃏
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
            Convocar Juego de Mesa
          </h3>
          <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em] mt-1">
            Espacio Lúdico Comunitario
          </p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-rose-500/20 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>

        <div className="relative bg-zinc-900/90 border border-zinc-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          
          <form onSubmit={manejarCreacion} className="relative z-10 flex flex-col gap-6">
            
            {/* TÍTULO */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Título de la Convocatoria</label>
              <input 
                type="text" 
                placeholder="Ej: Tarde de Commander MTG" 
                value={titulo} 
                onChange={e => setTitulo(e.target.value)} 
                required 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none transition-all font-bold placeholder:text-zinc-800"
              />
            </div>

            {/* JUEGO (Libre) */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Juego de Mesa a jugar</label>
              <input 
                type="text" 
                placeholder="Ej: Magic The Gathering, Catán, Zombicide..." 
                value={juego} 
                onChange={e => setJuego(e.target.value)} 
                required 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none transition-all font-bold placeholder:text-zinc-800"
              />
            </div>

            {/* NOTAS / DESCRIPCIÓN */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Notas del Organizador</label>
              <textarea 
                placeholder="Ej: Vamos a jugar formato Commander casual. Llevo 2 mazos extra para prestar si alguien no tiene." 
                value={descripcion} 
                onChange={e => setDescripcion(e.target.value)} 
                required 
                rows="3" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none transition-all resize-none italic font-medium placeholder:text-zinc-800"
              />
            </div>

            {/* REQUISITOS & NOVATOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Requisitos Especiales</label>
                <input 
                  type="text" 
                  placeholder="Ej: Conocer las reglas, mazos family friendly..." 
                  value={requisitos} 
                  onChange={e => setRequisitos(e.target.value)} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-rose-500 outline-none font-bold placeholder:text-zinc-800 h-[60px]"
                />
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
                    <h4 className={`font-black uppercase tracking-widest text-[11px] ${aptaNovatos ? 'text-emerald-400' : 'text-zinc-500'}`}>Enseño a Jugar</h4>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${aptaNovatos ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700'}`}>
                  {aptaNovatos && <span className="font-black text-xs">✓</span>}
                </div>
              </div>
            </div>

            {/* TURNO Y CUPO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Cupo Total (Incluyéndote)</label>
                <input 
                  type="number" 
                  value={cupo} 
                  onChange={e => setCupo(e.target.value)} 
                  min="2" max="20" required 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-rose-500 outline-none font-black text-center text-lg" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Turno de Juego</label>
                <select 
                  value={turno} 
                  onChange={e => setTurno(e.target.value)} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-rose-500 outline-none font-bold [color-scheme:dark] cursor-pointer text-lg text-center"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>
            </div>

            {/* MATERIALES PEDIDOS AL GREMIO */}
            <div className="space-y-2 mt-2">
              <label className="text-[11px] font-black text-rose-500 uppercase ml-1 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                Logística (Pedido al Gremio)
              </label>
              <input 
                type="text" 
                placeholder="¿Necesitas que llevemos algún juego de la ludoteca, dados, fichas...?" 
                value={materialesPedidos} 
                onChange={e => setMaterialesPedidos(e.target.value)} 
                className="w-full bg-rose-500/5 border border-rose-500/20 rounded-2xl py-4 px-6 text-rose-200 focus:border-rose-500 outline-none italic text-sm placeholder:text-rose-900/50 shadow-inner"
              />
            </div>

            {/* BOTÓN SUBMIT */}
            <button 
              type="submit" 
              disabled={cargando}
              className="mt-6 relative group/btn overflow-hidden rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 transition-transform group-hover/btn:scale-105 duration-500"></div>
              <div className="relative flex items-center justify-center gap-3 py-5 font-black text-white text-sm uppercase tracking-[0.3em] border border-white/20">
                <span>{cargando ? '⏳' : '🃏'}</span> {cargando ? 'Sellando la mesa...' : 'Publicar Mesa de Juego'}
              </div>
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}

export default CrearMesaJuego;