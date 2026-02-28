import { useState } from 'react';

function Landing({ irALogin }) {
  // Estado para el modal de los fundadores
  const [fundadorSeleccionado, setFundadorSeleccionado] = useState(null);
  
  // ✨ NUEVO ESTADO: Controla qué sección se está mostrando en pantalla
  const [seccionActiva, setSeccionActiva] = useState('inicio'); // 'inicio', 'nosotros', 'fundadores'

  // 📜 Aquí es donde agregarás los textos que te pasen los miembros más adelante
  const fundadores = [
    {
      id: 1,
      nombre: "Nombre Fundador 1",
      titulo: "Gran Maestre de Mesa",
      icono: "🧙‍♂️",
      descripcion: "Aquí irá la historia de sus primeras campañas, los sistemas que domina y su visión para unir a los jugadores..."
    },
    {
      id: 2,
      nombre: "Nombre Fundador 2",
      titulo: "Guardián del Lore",
      icono: "🛡️",
      descripcion: "Aquí irá el relato de cómo ayudó a forjar la Asociación, sus anécdotas con los dados y los mundos que prefiere explorar..."
    },
    {
      id: 3,
      nombre: "Nombre Fundador 3",
      titulo: "Forjador de Mundos",
      icono: "📜",
      descripcion: "Aquí irá su experiencia diseñando partidas épicas, su rol en la comunidad y su mensaje para los nuevos aventureros..."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative flex flex-col">
      
      {/* 🧭 BARRA DE NAVEGACIÓN SUPERIOR (AHORA FUNCIONA COMO PESTAÑAS) */}
      <nav className="fixed top-0 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setSeccionActiva('inicio')}
          >
            <span className="text-3xl">⚔️</span>
            <span className="text-xl font-black text-white uppercase tracking-tighter hidden sm:block">
              Rol <span className="text-emerald-500">La Pampa</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSeccionActiva('inicio')}
              className={`text-xs font-bold uppercase tracking-widest transition-colors hidden md:block ${seccionActiva === 'inicio' ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1' : 'hover:text-emerald-400'}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => setSeccionActiva('nosotros')}
              className={`text-xs font-bold uppercase tracking-widest transition-colors hidden md:block ${seccionActiva === 'nosotros' ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1' : 'hover:text-emerald-400'}`}
            >
              Sobre Nosotros
            </button>
            <button 
              onClick={() => setSeccionActiva('fundadores')}
              className={`text-xs font-bold uppercase tracking-widest transition-colors hidden md:block flex items-center gap-2 ${seccionActiva === 'fundadores' ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1' : 'hover:text-emerald-400'}`}
            >
              <span>👑</span> Fundadores
            </button>
            
            <div className="h-6 w-px bg-zinc-800 hidden md:block"></div>

            <button 
              onClick={irALogin}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            >
              Ingresar
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENEDOR PRINCIPAL QUE CAMBIA SEGÚN LA PESTAÑA */}
      <main className="flex-grow flex flex-col justify-center mt-20">
        
        {/* 🏰 PESTAÑA 1: PORTADA ÉPICA (HERO) */}
        {seccionActiva === 'inicio' && (
          <header className="relative py-20 px-6 flex flex-col items-center justify-center text-center flex-grow animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 max-w-4xl">
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter mb-6 drop-shadow-2xl">
                Forja tu leyenda en <br />
                <span className="text-emerald-500 not-italic">Santa Rosa</span>
              </h1>
              <p className="text-xl md:text-2xl text-zinc-400 mb-12 font-medium italic max-w-2xl mx-auto leading-relaxed border-l-4 border-emerald-500/50 pl-6 text-left md:text-center md:border-l-0 md:pl-0">
                Únete a la Asociación de Rol. Encuentra mesas, descubre nuevos sistemas y comparte aventuras épicas con la comunidad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={irALogin}
                  className="bg-zinc-100 text-zinc-950 hover:bg-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl hover:scale-105 flex items-center justify-center gap-3"
                >
                  Comenzar Aventura <span>→</span>
                </button>
                <button 
                  onClick={() => setSeccionActiva('nosotros')}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all hover:bg-zinc-800"
                >
                  Conocer más
                </button>
              </div>
            </div>
          </header>
        )}

        {/* 📜 PESTAÑA 2: SOBRE NOSOTROS */}
        {seccionActiva === 'nosotros' && (
          <section className="py-20 px-6 max-w-4xl mx-auto flex-grow flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-10 flex items-center justify-center gap-4">
                <span className="text-amber-500">📜</span> Sobre el Gremio
              </h2>
              <div className="space-y-8 text-lg text-zinc-400 leading-relaxed text-justify md:text-center bg-zinc-900/50 p-8 md:p-12 rounded-[3rem] border border-zinc-800/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <p>
                  Nacimos con un propósito claro: reunir a los apasionados por el rol bajo un mismo estandarte. Somos un espacio creado por y para jugadores y Directores de Juego, donde no importa si eres un veterano curtido en mil batallas o si recién vas a tirar tu primer dado de 20 caras.
                </p>
                <p>
                  Organizamos eventos, facilitamos mesas de juego y promovemos la difusión de todos los sistemas (desde la fantasía medieval hasta el horror cósmico y la ciencia ficción). Nuestra misión es que nadie se quede sin un grupo con el cual compartir una tarde de imaginación y estrategia.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 👑 PESTAÑA 3: FUNDADORES */}
        {seccionActiva === 'fundadores' && (
          <section className="py-12 px-6 max-w-6xl mx-auto flex-grow animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 flex items-center justify-center gap-4">
                <span className="text-purple-500">👑</span> Los Fundadores
              </h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
                Quienes iniciaron la cruzada
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {fundadores.map((fundador) => (
                <div 
                  key={fundador.id}
                  onClick={() => setFundadorSeleccionado(fundador)}
                  className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-3xl p-8 cursor-pointer group transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-800/50 rounded-bl-full -z-10 group-hover:bg-emerald-500/10 transition-colors"></div>
                  
                  <div className="w-24 h-24 bg-zinc-950 rounded-full border-2 border-zinc-800 group-hover:border-emerald-500 flex items-center justify-center text-4xl mb-6 shadow-inner transition-colors">
                    {fundador.icono}
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-emerald-400 transition-colors">
                    {fundador.nombre}
                  </h3>
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">
                    {fundador.titulo}
                  </p>
                  
                  <span className="mt-auto text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-emerald-500 flex items-center gap-2 bg-zinc-950/50 px-4 py-2 rounded-lg border border-zinc-800/50">
                    Leer Pergamino <span>→</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 👁️ MODAL DEL FUNDADOR */}
      {fundadorSeleccionado && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" 
          onClick={() => setFundadorSeleccionado(null)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-10 relative shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setFundadorSeleccionado(null)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white text-xl p-2 bg-zinc-950 rounded-full transition-colors w-10 h-10 flex items-center justify-center border border-zinc-800"
            >
              ✕
            </button>
            
            <div className="w-20 h-20 bg-zinc-950 rounded-full border-2 border-emerald-500 flex items-center justify-center text-3xl mb-6 mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              {fundadorSeleccionado.icono}
            </div>
            
            <h3 className="text-3xl font-black text-white text-center uppercase tracking-tighter mb-2">
              {fundadorSeleccionado.nombre}
            </h3>
            <p className="text-center text-emerald-500 font-bold uppercase tracking-widest text-xs mb-8">
              {fundadorSeleccionado.titulo}
            </p>
            
            <div className="w-12 h-1 bg-zinc-800 mx-auto mb-8 rounded-full"></div>
            
            <p className="text-zinc-300 leading-relaxed italic text-center">
              "{fundadorSeleccionado.descripcion}"
            </p>
          </div>
        </div>
      )}

      {/* PIE DE PÁGINA */}
      <footer className="py-6 mt-auto text-center border-t border-zinc-900 text-zinc-600 text-xs font-bold uppercase tracking-widest bg-zinc-950">
        <p>Asociación de Rol La Pampa © 2026</p>
      </footer>
    </div>
  );
}

export default Landing;