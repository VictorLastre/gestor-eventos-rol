import { useState, useRef, useEffect } from 'react';
import puertaDungeon from '../assets/dungeon_door.png'; 
import forjaAventura from '../assets/forja_tu_aventura.png'; 
import LogoSVG from '../assets/Logo.svg'; 

function Landing({ irALogin }) {
  const [indiceFundador, setIndiceFundador] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('inicio'); 
  const carruselRef = useRef(null);

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (carruselRef.current && seccionActiva === 'fundadores') {
        const { scrollLeft, scrollWidth, clientWidth } = carruselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carruselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carruselRef.current.scrollBy({ left: 350, behavior: 'smooth' });
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
      descripcion: "Aquí irá tu historia, la creación del sistema web y tu visión para el Gremio...",
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
        shadow: "shadow-[0_0_25px_rgba(245,158,11,0.15)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]",
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
        shadow: "shadow-[0_0_25px_rgba(239,68,68,0.15)] hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]",
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
        shadow: "shadow-[0_0_25px_rgba(99,102,241,0.15)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)]",
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
      descripcion: "Aquí irá la historia de Chiquito, su presencia en el Gremio y sus roles favoritos...",
      color: {
        border: "border-green-500/40 hover:border-green-500",
        shadow: "shadow-[0_0_25px_rgba(34,197,94,0.15)] hover:shadow-[0_0_40px_rgba(34,197,94,0.4)]",
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

  const deslizarIzquierda = () => { carruselRef.current?.scrollBy({ left: -350, behavior: 'smooth' }); };
  const deslizarDerecha = () => { carruselRef.current?.scrollBy({ left: 350, behavior: 'smooth' }); };

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
          .delay-0 { animation-delay: 0s; } .delay-1 { animation-delay: 0.5s; }
          .delay-2 { animation-delay: 1.0s; } .delay-3 { animation-delay: 1.5s; }
          .delay-4 { animation-delay: 2.0s; } .delay-5 { animation-delay: 2.5s; }
          .delay-6 { animation-delay: 3.0s; }
          
          .img-glow {
            filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));
            transition: filter 0.3s ease;
          }
        `}
      </style>

      {/* 🧭 NAV - Altura aumentada para el logo más grande */}
      <nav className="fixed top-0 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="max-w-7xl mx-auto px-6 h-32 flex items-center justify-between">
          <div className="flex items-center gap-6 cursor-pointer group" onClick={() => setSeccionActiva('inicio')}>
            
            {/* ✨ LOGO AGRANDADO Y ESTÁTICO */}
            <div className="relative w-28 h-28 flex items-center justify-center img-glow transition-transform duration-300 group-hover:scale-105">
              <img 
                src={LogoSVG} 
                alt="Logo Asociación" 
                className="w-20 h-20 object-contain relative z-20" 
              />
            </div>

            <span className="text-3xl font-black text-white uppercase tracking-tighter hidden lg:block transition-colors group-hover:text-emerald-500">
              Asociación de Rol <span className="text-emerald-500 group-hover:text-white">La Pampa</span>
            </span>
          </div>

          <div className="flex items-center gap-8">
            <button onClick={() => setSeccionActiva('inicio')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${seccionActiva === 'inicio' ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1' : 'hover:text-emerald-400'}`}>Inicio</button>
            <button onClick={() => setSeccionActiva('nosotros')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${seccionActiva === 'nosotros' ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1' : 'hover:text-emerald-400'}`}>Nosotros</button>
            <button onClick={() => setSeccionActiva('fundadores')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${seccionActiva === 'fundadores' ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1' : 'hover:text-emerald-400'}`}>Fundadores</button>
            <div className="h-8 w-px bg-zinc-800 hidden md:block"></div>
            <button onClick={irALogin} className="relative group transition-all duration-300 hover:scale-110 flex flex-col items-center">
              <img src={puertaDungeon} alt="Entrar" className="w-16 h-16 object-contain img-glow" />
              <span className="absolute -bottom-6 text-[10px] font-black uppercase text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">Entrar</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col justify-center mt-32">
        {seccionActiva === 'inicio' && (
          <header className="relative py-20 px-6 flex flex-col items-center justify-center text-center flex-grow animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 max-w-4xl flex flex-col items-center">
              <button onClick={irALogin} className="group relative transition-transform duration-500 hover:scale-105 active:scale-95 mb-8 outline-none">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img src={forjaAventura} alt="Comenzar Aventura" className="w-full max-w-[300px] md:max-w-[300px] h-auto object-contain relative z-10 img-glow" />
                <span className="mt-4 block text-emerald-500 font-black uppercase tracking-[0.4em] text-xs opacity-60 group-hover:opacity-100 transition-opacity animate-pulse">Haz clic para comenzar aventura →</span>
              </button>
              <p className="text-xl md:text-2xl text-zinc-400 mb-12 font-medium italic max-w-2xl mx-auto leading-relaxed border-l-4 border-emerald-500/50 pl-6 text-left md:text-center md:border-l-0 md:pl-0">Únete a la Asociación de Rol. Encuentra mesas, descubre nuevos sistemas y comparte aventuras épicas con la comunidad.</p>
              <button onClick={() => setSeccionActiva('nosotros')} className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 hover:text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:bg-zinc-800 shadow-xl">Conocer más del Gremio</button>
            </div>
          </header>
        )}

        {seccionActiva === 'nosotros' && (
          <section className="py-20 px-6 max-w-4xl mx-auto flex-grow flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="text-center relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-10 flex items-center justify-center gap-4">📜 Sobre el Gremio</h2>
              <div className="space-y-8 text-lg text-zinc-400 leading-relaxed bg-zinc-900/50 p-8 md:p-12 rounded-[3rem] border border-zinc-800/50 shadow-2xl relative overflow-hidden text-justify md:text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
                <p>Nacimos con un propósito claro: reunir a los apasionados por el rol bajo un mismo estandarte en La Pampa. Somos un espacio creado por y para jugadores y Narradores.</p>
                <p>Nuestra misión es que nadie se quede sin un grupo con el cual compartir una tarde de imaginación y estrategia.</p>
              </div>
            </div>
          </section>
        )}

        {seccionActiva === 'fundadores' && (
          <section className="py-12 px-6 w-full max-w-[1400px] mx-auto flex-grow animate-in fade-in slide-in-from-bottom-8 duration-500 flex flex-col justify-center">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 flex items-center justify-center gap-4">👑 Los Fundadores</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Quienes iniciaron la cruzada</p>
            </div>
            <div className="relative group/carrusel">
              <button onClick={deslizarIzquierda} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 z-30 bg-zinc-900 border border-zinc-700 text-white w-12 h-12 rounded-full hidden md:flex items-center justify-center shadow-xl opacity-0 group-hover/carrusel:opacity-100 transition-opacity">‹</button>
              <div ref={carruselRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-8 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {fundadores.map((fundador, index) => (
                  <div key={index} onClick={() => setIndiceFundador(index)} className={`min-w-[280px] md:min-w-[320px] snap-center shrink-0 bg-zinc-900 border rounded-[2rem] p-8 cursor-pointer group/card transition-all duration-500 hover:-translate-y-4 relative overflow-hidden ${fundador.color.shadow} ${fundador.color.border}`}>
                    <div className={`absolute inset-0 bg-gradient-to-tr ${fundador.color.foil} animate-foil delay-${index} z-10 pointer-events-none`}></div>
                    <div className={`w-24 h-24 bg-zinc-950 rounded-full border-2 flex items-center justify-center text-4xl mb-6 relative z-20 ${fundador.color.bgIcon}`}>{fundador.icono}</div>
                    <h3 className={`text-2xl font-black uppercase mb-2 relative z-20 ${fundador.color.text}`}>{fundador.nombre}</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-8 relative z-20">{fundador.titulo}</p>
                    <span className={`mt-auto text-[10px] font-black uppercase bg-zinc-950/50 px-4 py-2.5 rounded-xl border border-zinc-800/50 relative z-20 ${fundador.color.text}`}>Ver Historia →</span>
                  </div>
                ))}
              </div>
              <button onClick={deslizarDerecha} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 z-30 bg-zinc-900 border border-zinc-700 text-white w-12 h-12 rounded-full hidden md:flex items-center justify-center shadow-xl opacity-0 group-hover/carrusel:opacity-100 transition-opacity">›</button>
            </div>
          </section>
        )}
      </main>

      {indiceFundador !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setIndiceFundador(null)}>
          <button onClick={anteriorFundador} className="absolute left-4 md:left-12 text-zinc-500 hover:text-white text-4xl p-2 z-50">‹</button>
          <div className={`bg-zinc-900 border w-full max-w-lg rounded-[2.5rem] p-10 relative animate-in zoom-in-95 duration-300 ${fundadores[indiceFundador].color.modalGlow} ${fundadores[indiceFundador].color.modalBorder}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIndiceFundador(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white text-xl w-10 h-10 flex items-center justify-center border border-zinc-800 rounded-full">✕</button>
            <div className={`w-24 h-24 bg-zinc-950 rounded-full border-2 flex items-center justify-center text-4xl mb-6 mx-auto ${fundadores[indiceFundador].color.modalBorder}`}>{fundadores[indiceFundador].icono}</div>
            <h3 className="text-4xl font-black text-white text-center uppercase tracking-tighter mb-2">{fundadores[indiceFundador].nombre}</h3>
            <p className={`text-center font-black uppercase tracking-widest text-xs mb-8 ${fundadores[indiceFundador].color.text}`}>{fundadores[indiceFundador].titulo}</p>
            <div className="w-16 h-1 bg-zinc-800 mx-auto mb-8 rounded-full"></div>
            <p className="text-zinc-300 leading-relaxed italic text-center text-lg">"{fundadores[indiceFundador].descripcion}"</p>
          </div>
          <button onClick={siguienteFundador} className="absolute right-4 md:right-12 text-zinc-500 hover:text-white text-4xl p-2 z-50">›</button>
        </div>
      )}

      <footer className="py-6 mt-auto text-center border-t border-zinc-900 text-zinc-600 text-xs font-bold uppercase bg-zinc-950">
        <p>Asociación de Rol La Pampa © 2026</p>
      </footer>
    </div>
  );
}

export default Landing;