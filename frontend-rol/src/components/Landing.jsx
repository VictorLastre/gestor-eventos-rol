import { useState, useRef, useEffect } from 'react';
import puertaDungeon from '../assets/dungeon_door.png'; 
import forjaAventura from '../assets/forja_tu_aventura.gif'; 
import LogoSVG from '../assets/Logo.svg'; 

function Landing({ irALogin }) {
  const [indiceFundador, setIndiceFundador] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('inicio'); 
  const [menuAbierto, setMenuAbierto] = useState(false); // ✨ Estado para el menú móvil
  const carruselRef = useRef(null);

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (carruselRef.current && seccionActiva === 'fundadores') {
        const { scrollLeft, scrollWidth, clientWidth } = carruselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carruselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carruselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(intervalo);
  }, [seccionActiva]);

  const fundadores = [
    {
      nombre: "Sterbern",
      titulo: "El Arquitecto",
      icono: "💻",
      descripcion: "Aquí irá tu historia, la creación del sistema web y tu visión para la Asociación...",
      color: {
        border: "border-emerald-500/40 hover:border-emerald-500",
        shadow: "shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]",
        text: "text-emerald-400",
        bgIcon: "border-emerald-500/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]",
        foil: "from-emerald-400/0 via-emerald-300/40 to-emerald-400/0",
        modalGlow: "shadow-[0_0_40px_rgba(16,185,129,0.2)]",
        modalBorder: "border-emerald-500"
      }
    },
    {
      nombre: "Martín",
      titulo: "Forjador de Mundos",
      icono: "🗺️",
      descripcion: "Aquí irá la historia de Martín, sus anécdotas en las mesas y los sistemas que domina...",
      color: {
        border: "border-blue-500/40 hover:border-blue-500",
        shadow: "shadow-[0_0_25px_rgba(59,130,246,0.15)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]",
        text: "text-blue-400",
        bgIcon: "border-blue-500/50 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]",
        foil: "from-blue-400/0 via-blue-300/40 to-blue-400/0",
        modalGlow: "shadow-[0_0_40px_rgba(59,130,246,0.2)]",
        modalBorder: "border-blue-500"
      }
    },
    {
      nombre: "Diny",
      titulo: "Guardiána del Lore",
      icono: "📚",
      descripcion: "Aquí irá la historia de Diny, su conocimiento del trasfondo y sus mejores campañas...",
      color: {
        border: "border-purple-500/40 hover:border-purple-500",
        shadow: "shadow-[0_0_25px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]",
        text: "text-purple-400",
        bgIcon: "border-purple-500/50 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]",
        foil: "from-purple-400/0 via-purple-300/40 to-purple-400/0",
        modalGlow: "shadow-[0_0_40px_rgba(168,85,247,0.2)]",
        modalBorder: "border-purple-500"
      }
    },
    {
      nombre: "Mati",
      titulo: "Maestre de Dados",
      icono: "🎲",
      descripcion: "Aquí irá la historia de Mati, cómo crea escenarios increíbles y sus mundos favoritos...",
      color: {
        border: "border-amber-500/40 hover:border-amber-500",
        shadow: "shadow-[0_0_25_rgba(245,158,11,0.15)]",
        text: "text-amber-400",
        bgIcon: "border-amber-500/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.2)]",
        foil: "from-amber-400/0 via-amber-300/40 to-amber-400/0",
        modalGlow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]",
        modalBorder: "border-amber-500"
      }
    },
    {
      nombre: "Delo",
      titulo: "Voz del Caos",
      icono: "🔥",
      descripcion: "Aquí irá la historia de Delo, sus momentos más divertidos y su estilo de juego...",
      color: {
        border: "border-red-500/40 hover:border-red-500",
        shadow: "shadow-[0_0_25_rgba(239,68,68,0.15)]",
        text: "text-red-400",
        bgIcon: "border-red-500/50 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]",
        foil: "from-red-400/0 via-red-300/40 to-red-400/0",
        modalGlow: "shadow-[0_0_40px_rgba(239,68,68,0.2)]",
        modalBorder: "border-red-500"
      }
    },
    {
      nombre: "Keith",
      titulo: "Tejedora de Tinta y Destinos",
      icono: "✒️",
      descripcion: "Aquí irá la historia de Keith, sus estrategias en la mesa y personajes letales...",
      color: {
        border: "border-indigo-500/40 hover:border-indigo-500",
        shadow: "shadow-[0_0_25_rgba(99,102,241,0.15)]",
        text: "text-indigo-400",
        bgIcon: "border-indigo-500/50 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]",
        foil: "from-indigo-400/0 via-indigo-300/40 to-indigo-400/0",
        modalGlow: "shadow-[0_0_40px_rgba(99,102,241,0.2)]",
        modalBorder: "border-indigo-500"
      }
    },
    {
      nombre: "Chiquito",
      titulo: "El Coloso Gentil",
      icono: "🗿",
      descripcion: "Aquí irá la historia de Chiquito, su presencia en la Asociación y sus roles favoritos...",
      color: {
        border: "border-green-500/40 hover:border-green-500",
        shadow: "shadow-[0_0_25_rgba(34,197,94,0.15)]",
        text: "text-green-400",
        bgIcon: "border-green-500/50 shadow-[inset_0_0_15px_rgba(34,197,94,0.2)]",
        foil: "from-green-400/0 via-green-300/40 to-green-400/0",
        modalGlow: "shadow-[0_0_40px_rgba(34,197,94,0.2)]",
        modalBorder: "border-green-500"
      }
    }
  ];

  const siguienteFundador = (e) => { e.stopPropagation(); setIndiceFundador((prev) => (prev + 1) % fundadores.length); };
  const anteriorFundador = (e) => { e.stopPropagation(); setIndiceFundador((prev) => (prev - 1 + fundadores.length) % fundadores.length); };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative flex flex-col">
      
      <style>
        {`
          @keyframes foil-shine {
            0% { transform: translateX(-150%) skewX(-15deg); opacity: 0; }
            10% { opacity: 1; }
            40% { transform: translateX(250%) skewX(-15deg); opacity: 0; }
            100% { transform: translateX(250%) skewX(-15deg); opacity: 0; }
          }
          .animate-foil { animation: foil-shine 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
          .img-glow { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)); }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* 🧭 NAVBAR RESPONSIVE */}
      <nav className="fixed top-0 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 z-[100]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-24 md:h-32 flex items-center justify-between">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3 md:gap-6 cursor-pointer group" onClick={() => {setSeccionActiva('inicio'); setMenuAbierto(false);}}>
            <div className="relative w-16 h-16 md:w-28 md:h-28 flex items-center justify-center img-glow transition-transform duration-300 group-hover:scale-105">
              <img src={LogoSVG} alt="Logo" className="w-12 h-12 md:w-20 md:h-20 object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg md:text-3xl font-black text-white uppercase tracking-tighter">Asociación de Rol</span>
              <span className="text-emerald-500 text-sm md:text-xl font-black uppercase tracking-[0.2em]">La Pampa</span>
            </div>
          </div>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setSeccionActiva('inicio')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${seccionActiva === 'inicio' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-emerald-400'}`}>Inicio</button>
            <button onClick={() => setSeccionActiva('nosotros')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${seccionActiva === 'nosotros' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-emerald-400'}`}>Nosotros</button>
            <button onClick={() => setSeccionActiva('fundadores')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${seccionActiva === 'fundadores' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-emerald-400'}`}>Fundadores</button>
            <div className="h-8 w-px bg-zinc-800"></div>
            <button onClick={irALogin} className="relative group transition-all duration-300 hover:scale-110 flex flex-col items-center">
              <img src={puertaDungeon} alt="Entrar" className="w-16 h-16 object-contain img-glow" />
              <span className="absolute -bottom-6 text-[10px] font-black uppercase text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">Entrar</span>
            </button>
          </div>

          {/* Botón Menú Móvil (Hamburguesa) */}
          <button onClick={() => setMenuAbierto(!menuAbierto)} className="md:hidden flex flex-col gap-1.5 p-2 z-[110]">
            <div className={`w-6 h-0.5 bg-emerald-500 transition-all ${menuAbierto ? 'rotate-45 translate-y-2' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-emerald-500 transition-all ${menuAbierto ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-emerald-500 transition-all ${menuAbierto ? '-rotate-45 -translate-y-2' : ''}`}></div>
          </button>
        </div>

        {/* Menú Móvil Desplegable */}
        <div className={`fixed inset-0 bg-zinc-950/98 z-[105] flex flex-col items-center justify-center gap-10 transition-transform duration-500 md:hidden ${menuAbierto ? 'translate-x-0' : 'translate-x-full'}`}>
          <button onClick={() => {setSeccionActiva('inicio'); setMenuAbierto(false);}} className="text-2xl font-black uppercase tracking-widest text-white">Inicio</button>
          <button onClick={() => {setSeccionActiva('nosotros'); setMenuAbierto(false);}} className="text-2xl font-black uppercase tracking-widest text-white">Nosotros</button>
          <button onClick={() => {setSeccionActiva('fundadores'); setMenuAbierto(false);}} className="text-2xl font-black uppercase tracking-widest text-white">Fundadores</button>
          <button onClick={irALogin} className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest">Ingresar</button>
        </div>
      </nav>

      <main className="flex-grow flex flex-col justify-center pt-24 md:pt-32">
        {/* SECCIÓN INICIO */}
        {seccionActiva === 'inicio' && (
          <header className="relative py-12 md:py-20 px-6 flex flex-col items-center justify-center text-center flex-grow animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
              <button onClick={irALogin} className="group relative transition-transform duration-500 hover:scale-105 active:scale-95 mb-4 md:mb-6 outline-none w-full flex flex-col items-center">
                
                {/* ✨ IMAGEN REDUCIDA: Cambiamos a max-w-[180px] en móviles y max-w-[220px] en PC */}
                <img src={forjaAventura} alt="Comenzar" className="w-full max-w-[180px] md:max-w-[220px] h-auto object-contain img-glow" />
                
                {/* ✨ MÁRGENES REDUCIDOS: Para acercar el texto a la imagen */}
                <span className="mt-4 md:mt-5 block text-emerald-500 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-xs animate-pulse">Haz clic para entrar →</span>
              </button>
              
              {/* ✨ TEXTO LIGERAMENTE AJUSTADO: Pasó de text-2xl a text-xl para no empujar la pantalla hacia abajo */}
              <p className="text-base md:text-xl text-zinc-400 mb-6 max-w-2xl mx-auto leading-relaxed px-4 text-center">
                Únete a la Asociación de Rol. Encuentra mesas, descubre nuevos sistemas y comparte aventuras épicas con la comunidad.
              </p>
            </div>
          </header>
        )}

        {/* SECCIÓN NOSOTROS */}
        {seccionActiva === 'nosotros' && (
          <section className="py-12 md:py-20 px-6 max-w-4xl mx-auto flex-grow flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-8 md:mb-12 flex items-center justify-center gap-4">📜 Nosotros </h2>
              <div className="space-y-6 md:space-y-8 text-base md:text-lg text-zinc-400 leading-relaxed bg-zinc-900/50 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-zinc-800/50 shadow-2xl text-justify md:text-center">
                <p>Nacimos con un propósito claro: reunir a los apasionados por el rol bajo un mismo estandarte en La Pampa. Somos un espacio creado por y para jugadores y Narradores.</p>
                <p>Nuestra misión es que nadie se quede sin un grupo con el cual compartir una tarde de imaginación y estrategia.</p>
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN FUNDADORES */}
        {seccionActiva === 'fundadores' && (
          <section className="py-12 px-4 md:px-6 w-full max-w-[1400px] mx-auto flex-grow animate-in fade-in slide-in-from-bottom-8 duration-500 flex flex-col justify-center">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">👑 Fundadores</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-sm">Héroes de la Primera Era</p>
            </div>
            <div className="relative group/carrusel">
              <div ref={carruselRef} className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-6 md:py-8 px-2 md:px-4">
                {fundadores.map((fundador, index) => (
                  <div key={index} onClick={() => setIndiceFundador(index)} className={`min-w-[260px] md:min-w-[320px] snap-center shrink-0 bg-zinc-900 border rounded-[2rem] p-6 md:p-8 cursor-pointer transition-all duration-500 relative overflow-hidden ${fundador.color.shadow} ${fundador.color.border}`}>
                    <div className={`absolute inset-0 bg-gradient-to-tr ${fundador.color.foil} animate-foil z-10 pointer-events-none`}></div>
                    <div className={`w-20 h-20 md:w-24 md:h-24 bg-zinc-950 rounded-full border-2 flex items-center justify-center text-3xl md:text-4xl mb-6 relative z-20 ${fundador.color.bgIcon}`}>{fundador.icono}</div>
                    <h3 className={`text-xl md:text-2xl font-black uppercase mb-1 relative z-20 ${fundador.color.text}`}>{fundador.nombre}</h3>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 relative z-20">{fundador.titulo}</p>
                    <span className={`mt-auto text-[9px] md:text-[10px] font-black uppercase bg-zinc-950/50 px-4 py-2 rounded-xl border border-zinc-800/50 relative z-20 ${fundador.color.text}`}>Ver Historia →</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-zinc-600 text-[10px] italic mt-4 md:hidden">Desliza para conocerlos</p>
          </section>
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="py-6 mt-auto text-center border-t border-zinc-900 text-zinc-700 text-[10px] md:text-xs font-bold uppercase bg-zinc-950 px-4">
        <p>Asociación de Rol La Pampa © 2026</p>
      </footer>

      {/* MODAL (AJUSTADO PARA MÓVIL) */}
      {indiceFundador !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIndiceFundador(null)}>
          <div className={`bg-zinc-900 border w-full max-w-lg rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative ${fundadores[indiceFundador].color.modalGlow} ${fundadores[indiceFundador].color.modalBorder}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIndiceFundador(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white text-lg w-8 h-8 flex items-center justify-center border border-zinc-800 rounded-full">✕</button>
            <div className={`w-20 h-20 md:w-24 md:h-24 bg-zinc-950 rounded-full border-2 flex items-center justify-center text-3xl md:text-4xl mb-6 mx-auto ${fundadores[indiceFundador].color.modalBorder}`}>{fundadores[indiceFundador].icono}</div>
            <h3 className="text-2xl md:text-4xl font-black text-white text-center uppercase tracking-tighter mb-1">{fundadores[indiceFundador].nombre}</h3>
            <p className={`text-center font-black uppercase tracking-widest text-[10px] md:text-xs mb-6 ${fundadores[indiceFundador].color.text}`}>{fundadores[indiceFundador].titulo}</p>
            <p className="text-zinc-300 leading-relaxed italic text-center text-base md:text-lg px-2">"{fundadores[indiceFundador].descripcion}"</p>
            
            <div className="flex justify-between mt-8">
               <button onClick={anteriorFundador} className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">‹ Anterior</button>
               <button onClick={siguienteFundador} className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">Siguiente ›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;