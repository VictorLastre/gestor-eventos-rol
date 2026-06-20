import { useState, useEffect } from 'react';
import puertaDungeon from '../assets/dungeon_door.png'; 
import forjaAventura from '../assets/forja_tu_aventura.gif'; 
import LogoSVG from '../assets/Logo.svg'; 
import FotoGrupal from '../assets/FotoGrupal.png'; 

const fundadores = [
  {
    nombre: "Agus",
    titulo: "Dungeon Master Novata",
    descripcion: "Prefiero dirigir a: Jugadores con o sin experiencia entre 4 a 17 años.\n\nSistemas: Magissa, Detectives de Monstruos, D&D 5e.\n\nEstilo: Bastante teatro de la mente, haciendo hincapié en el world building y la conexión con los personajes. ¡Me encanta que todos aportemos ideas!\n\nMonstruo Favorito: Mímicos.\n\nSnacks: Cosas chocolatosas (brownies) y bebidas frescas.",
    color: {
      border: "border-emerald-500/40 hover:border-emerald-500",
      shadow: "shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]",
      text: "text-emerald-400",
      modalGlow: "shadow-[0_0_40px_rgba(16,185,129,0.2)]",
      modalBorder: "border-emerald-500"
    }
  },
  {
    nombre: "Diny",
    titulo: "Dungeon Master",
    descripcion: "Prefiero dirigir a: Mayores de 15 años y veteranos con ganas de reírse.\n\nSistemas: D&D 5e, Vampiro La Mascarada 5e.\n\nEstilo: Mucho teatro mental, me centro más en el role-play y la historia antes que en el combate. (Por el poder de las risas puedo saltarme reglas si el momento es épico).\n\nMonstruo Favorito: Dragones.\n\nSnacks: Cualquier cosa con chocolate y papitas de limón.",
    color: {
      border: "border-purple-500/40 hover:border-purple-500",
      shadow: "shadow-[0_0_25px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]",
      text: "text-purple-400",
      modalGlow: "shadow-[0_0_40px_rgba(168,85,247,0.2)]",
      modalBorder: "border-purple-500"
    }
  },
  {
    nombre: "Guille",
    titulo: "Dungeon Master",
    descripcion: "Prefiero dirigir a: Adolescentes y/o adultos, con y sin experiencia.\n\nSistemas: Pampa Primigenia, Blades in the Dark, Pathfinder 1e, D&D 5e, Estrellas Innumerables.\n\nEstilo: Balance entre narrativa y combate, improviso más de lo que preparo. Utilizo mapas dibujables, grillas transparentes y teatro mental.\n\nMonstruo Favorito: Cubo Gelatinoso.\n\nSnacks: Mate cuando hace frío, Tereré cuando hace calor y 9 de Oros en abundancia.",
    color: {
      border: "border-blue-500/40 hover:border-blue-500",
      shadow: "shadow-[0_0_25px_rgba(59,130,246,0.15)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]",
      text: "text-blue-400",
      modalGlow: "shadow-[0_0_40px_rgba(59,130,246,0.2)]",
      modalBorder: "border-blue-500"
    }
  },
  {
    nombre: "Keith",
    titulo: "Dungeon Master",
    descripcion: "Prefiero dirigir a: Jugadores con o sin experiencia.\n\nSistemas: D&D 5e, Magissa, La Bruja Ha Muerto.\n\nEstilo: Me gusta tener el manual cerca, pero priorizo que el jugador disfrute. Uso objetos para mayor inmersión y disfruto cuando inventan cosas raras e inesperadas.\n\nMonstruo Favorito: Cait Sith.\n\nSnacks: Café, energizantes, papas fritas y ¡AGUANTEN LOS ALFAJORES DE FRUTA!",
    color: {
      border: "border-indigo-500/40 hover:border-indigo-500",
      shadow: "shadow-[0_0_25_rgba(99,102,241,0.15)]",
      text: "text-indigo-400",
      modalGlow: "shadow-[0_0_40px_rgba(99,102,241,0.2)]",
      modalBorder: "border-indigo-500"
    }
  },
  {
    nombre: "Mati",
    titulo: "Dungeon Master",
    descripcion: "Prefiero dirigir a: Jugadores mayores de 15 años y veteranos.\n\nSistemas: D&D 5e, D&D 3.5, Savage Worlds, Pathfinder.\n\nEstilo: Equilibrado. Buen rol y también combate estratégico. Fiel a las reglas salvo que la situación sea muy meme (¡Un buen 20 lo justifica todo!).\n\nMonstruo Favorito: Archiliches.\n\nSnacks: Coca Cola, pastafrola y tarta de frutilla.",
    color: {
      border: "border-amber-500/40 hover:border-amber-500",
      shadow: "shadow-[0_0_25_rgba(245,158,11,0.15)]",
      text: "text-amber-400",
      modalGlow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]",
      modalBorder: "border-amber-500"
    }
  },
  {
    nombre: "Smoke",
    titulo: "Dungeon Master",
    descripcion: "Prefiero dirigir a: Mayores de 15 años y veteranos con ganas de reírse.\n\nSistemas: D&D 5e, LANCER, Vampiro La Mascarada 5e, La Llamada de Cthulhu 7e.\n\nEstilo: Equilibrado. Teatro de la mente para narrativa y mapas para combate táctico. Suelo escribir mis propias historias integrando los trasfondos de los personajes.\n\nMonstruo Favorito: Goblins.\n\nSnacks: Alfajores, galletitas, facturas y todo lo que tenga alto porcentaje de azúcar.",
    color: {
      border: "border-red-500/40 hover:border-red-500",
      shadow: "shadow-[0_0_25_rgba(239,68,68,0.15)]",
      text: "text-red-400",
      modalGlow: "shadow-[0_0_40px_rgba(239,68,68,0.2)]",
      modalBorder: "border-red-500"
    }
  },
  {
    nombre: "Sterbern",
    titulo: "Zombie Master",
    descripcion: "Prefiero dirigir a: ¡Todos son bienvenidos mientras tengan ganas de divertirse! (Dependiendo de la ambientación, obvio).\n\nSistemas: D&D 5e, Cthulhu 7e, Warhammer Fantasy, Star Wars d20, Vieja Escuela, Indies.\n\nEstilo: Consulto manuales pero doy total libertad a las ideas (y que se la banquen si se mandan macanas). Mapas, miniaturas y mucho teatro mental.\n\nMonstruo Favorito: Zombies.\n\nSnacks: MATE (si no hay, me pongo de mal humor) y pastelitos o pastafrola.",
    color: {
      border: "border-green-500/40 hover:border-green-500",
      shadow: "shadow-[0_0_25_rgba(34,197,94,0.15)]",
      text: "text-green-400",
      modalGlow: "shadow-[0_0_40px_rgba(34,197,94,0.2)]",
      modalBorder: "border-green-500"
    }
  }
];

function Landing({ irALogin }) {
  const [indiceFundador, setIndiceFundador] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('inicio'); 
  const [menuAbierto, setMenuAbierto] = useState(false); 

  const siguienteFundador = (e) => { e.stopPropagation(); setIndiceFundador((prev) => (prev + 1) % fundadores.length); };
  const anteriorFundador = (e) => { e.stopPropagation(); setIndiceFundador((prev) => (prev - 1 + fundadores.length) % fundadores.length); };

  return (
    <div className="h-screen max-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-hidden relative flex flex-col">
      
      <style>
        {`
          .img-glow { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)); }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* 🧭 NAVBAR RESPONSIVE */}
      <nav className="fixed top-0 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 z-[100] h-20 md:h-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => {setSeccionActiva('inicio'); setMenuAbierto(false);}}>
            <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center img-glow transition-transform duration-300 group-hover:scale-105">
              <img src={LogoSVG} alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm md:text-2xl font-black text-white uppercase tracking-tighter">Asociación de Rol</span>
              <span className="text-emerald-500 text-[10px] md:text-sm font-black uppercase tracking-[0.2em]">La Pampa</span>
            </div>
          </div>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setSeccionActiva('inicio')} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${seccionActiva === 'inicio' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-emerald-400'}`}>Inicio</button>
            <button onClick={() => setSeccionActiva('nosotros')} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${seccionActiva === 'nosotros' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-emerald-400'}`}>Nosotros</button>
            <div className="h-6 w-px bg-zinc-800"></div>
            <button onClick={irALogin} className="relative group transition-all duration-300 hover:scale-110 flex flex-col items-center justify-center h-full">
              <img src={puertaDungeon} alt="Entrar" className="w-12 h-12 object-contain img-glow" />
              <span className="absolute -bottom-4 text-[8px] font-black uppercase text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">Entrar</span>
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
        <div className={`fixed inset-0 bg-zinc-950/98 z-[105] flex flex-col items-center justify-center gap-8 transition-transform duration-500 md:hidden ${menuAbierto ? 'translate-x-0' : 'translate-x-full'}`}>
          <button onClick={() => {setSeccionActiva('inicio'); setMenuAbierto(false);}} className="text-xl font-black uppercase tracking-widest text-white">Inicio</button>
          <button onClick={() => {setSeccionActiva('nosotros'); setMenuAbierto(false);}} className="text-xl font-black uppercase tracking-widest text-white">Nosotros</button>
          <button onClick={irALogin} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest">Ingresar</button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col pt-20 md:pt-24 pb-4 overflow-hidden">
        
        {/* SECCIÓN INICIO */}
        {seccionActiva === 'inicio' && (
          <header className="relative w-full h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500 px-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <button onClick={irALogin} className="group relative transition-transform duration-500 hover:scale-105 active:scale-95 mb-4 outline-none flex flex-col items-center z-10">
              <img src={forjaAventura} alt="Comenzar" className="w-[120px] md:w-[150px] h-auto object-contain img-glow" />
              <span className="mt-2 text-emerald-500 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[9px] md:text-[10px] animate-pulse">Haz clic para entrar →</span>
            </button>
            
            <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed z-10">
              Únete a la Asociación de Rol. Encuentra mesas, descubre nuevos sistemas y comparte aventuras épicas con la comunidad.
            </p>
          </header>
        )}

        {/* SECCIÓN NOSOTROS */}
        {seccionActiva === 'nosotros' && (
          <section className="h-full w-full max-w-5xl mx-auto flex flex-col items-center px-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto scrollbar-hide pb-24">
            
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-8 mt-4 flex items-center justify-center gap-3">
              📜 La Asociación
            </h2>
            
            {/* ✨ CUADRO ROLERO PARA LA FOTO GRUPAL CORREGIDO ✨ */}
            <div className="relative p-2 bg-zinc-950 border-4 border-double border-amber-700/80 rounded-sm shadow-[0_0_30px_rgba(180,83,9,0.2)] mb-8 max-w-4xl w-full group overflow-hidden before:absolute before:inset-0 before:border-[1px] before:border-amber-500/30 before:pointer-events-none transition-transform hover:scale-[1.01] duration-500">
               {/* 
                 Se agregó min-h-[200px] md:min-h-[400px] para asegurar que la imagen tenga espacio 
                 y object-cover para que llene el contenedor sin aplastarse.
               */}
               <div className="w-full h-48 md:h-96 relative overflow-hidden">
                 <img src={FotoGrupal} alt="Asociación de Rol La Pampa" className="absolute inset-0 w-full h-full object-cover border border-zinc-900 shadow-inner sepia-[.15] contrast-[1.1] grayscale-[0.2]" />
               </div>
               
               {/* Detalles de esquina metálicos */}
               <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400"></div>
               <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400"></div>
               <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400"></div>
               <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400"></div>
            </div>

            {/* Texto Descriptivo */}
            <div className="space-y-4 text-sm md:text-base text-zinc-300 leading-relaxed bg-zinc-900/50 p-6 md:p-8 rounded-[2rem] border border-zinc-800/50 shadow-2xl mb-12 text-center max-w-3xl w-full relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest px-4 py-1 border border-zinc-800 rounded-full">Nuestra Historia</div>
              <p>Nacimos con un propósito claro: reunir a los apasionados por el rol bajo un mismo estandarte en La Pampa. Somos un espacio creado por y para jugadores y Narradores.</p>
              <p>Nuestra misión es que nadie se quede sin un grupo con el cual compartir una tarde de imaginación y estrategia.</p>
            </div>

            {/* BOTONERA DE FUNDADORES */}
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-1">👑 Los Fundadores</h3>
                <p className="text-amber-500/80 font-bold uppercase tracking-widest text-[9px] md:text-[10px] animate-pulse">Toca un nombre para leer sus crónicas</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full">
                {fundadores.map((fundador, index) => (
                  <button 
                    key={index} 
                    onClick={() => setIndiceFundador(index)}
                    className={`px-5 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl border-2 bg-zinc-950/80 font-black uppercase tracking-widest text-xs md:text-sm transition-all duration-300 transform hover:-translate-y-1 ${fundador.color.border} ${fundador.color.text} hover:bg-zinc-900 shadow-lg`}
                  >
                    {fundador.nombre}
                  </button>
                ))}
              </div>
            </div>

          </section>
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="h-24 md:h-28 flex flex-col items-center justify-center border-t border-zinc-900 bg-zinc-950 px-4 z-10 shrink-0">
        
        {/* Enlaces a Redes */}
        <div className="flex gap-4 mb-3">
          <a 
            href="https://www.instagram.com/asociacionderollapampa/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 transition-all duration-300 hover:text-white hover:bg-gradient-to-tr hover:from-orange-500 hover:via-red-500 hover:to-fuchsia-500 hover:border-transparent hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] group"
            title="Instagram"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

          <a 
            href="https://www.facebook.com/AsociacionDeRolLaPampa/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 transition-all duration-300 hover:text-white hover:bg-[#1877F2] hover:border-transparent hover:shadow-[0_0_15px_rgba(24,119,242,0.5)] group"
            title="Facebook"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
            </svg>
          </a>

          <a 
            href="https://chat.whatsapp.com/FIiKyN8QkZd0DEXs8pRZzC" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 transition-all duration-300 hover:text-white hover:bg-[#25D366] hover:border-transparent hover:shadow-[0_0_15px_rgba(37,211,102,0.5)] group"
            title="Grupo de WhatsApp"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </a>
        </div>

        <p className="text-zinc-600 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center">
          Asociación de Rol La Pampa © 2026
        </p>
      </footer>

      {/* MODAL FUNDADORES */}
      {indiceFundador !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIndiceFundador(null)}>
          <div className={`bg-zinc-900 border w-full max-w-[400px] md:max-w-md rounded-[2rem] p-6 relative ${fundadores[indiceFundador].color.modalGlow} ${fundadores[indiceFundador].color.modalBorder}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIndiceFundador(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white text-lg w-8 h-8 flex items-center justify-center border border-zinc-800 rounded-full z-10">✕</button>
            
            <h3 className="text-2xl md:text-3xl font-black text-white text-center uppercase tracking-tighter mb-1 mt-4">{fundadores[indiceFundador].nombre}</h3>
            <p className={`text-center font-black uppercase tracking-widest text-[9px] md:text-[10px] mb-4 border-b border-zinc-800/50 pb-4 ${fundadores[indiceFundador].color.text}`}>{fundadores[indiceFundador].titulo}</p>
            
            <p className="text-zinc-300 leading-relaxed italic text-left text-sm md:text-base px-2 whitespace-pre-line">{fundadores[indiceFundador].descripcion}</p>
            
            <div className="flex justify-between mt-6 pt-4 border-t border-zinc-800">
               <button onClick={anteriorFundador} className="text-zinc-500 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors">‹ Anterior</button>
               <button onClick={siguienteFundador} className="text-zinc-500 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors">Siguiente ›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;