import { useEffect } from 'react';

const COLORES_GLOBOS = [
  { bg: '#ef4444', borde: '#b91c1c' }, // Rojo
  { bg: '#f59e0b', borde: '#d97706' }, // Ámbar / Dorado
  { bg: '#10b981', borde: '#059669' }, // Esmeralda
  { bg: '#3b82f6', borde: '#2563eb' }, // Azul
  { bg: '#8b5cf6', borde: '#7c3aed' }, // Púrpura
  { bg: '#ec4899', borde: '#db2777' }, // Rosa
  { bg: '#06b6d4', borde: '#0891b2' }  // Cian
];

export default function CelebracionCumpleanos({ usuario, onCerrar }) {
  // Generar un set de 22 globos con posiciones y retrasos aleatorios
  const globos = Array.from({ length: 22 }).map((_, i) => {
    const color = COLORES_GLOBOS[i % COLORES_GLOBOS.length];
    const left = Math.floor(Math.random() * 92) + 2; // %
    const animDuration = 6 + (i % 5) * 1.5; // segs
    const animDelay = (i * 0.35) % 4; // segs
    const scale = 0.75 + (i % 4) * 0.15;
    return { id: i, color, left, animDuration, animDelay, scale };
  });

  // Confeti brillante
  const confetis = Array.from({ length: 30 }).map((_, i) => {
    const color = COLORES_GLOBOS[i % COLORES_GLOBOS.length].bg;
    const left = Math.floor(Math.random() * 96) + 2;
    const animDuration = 4 + (i % 4);
    const animDelay = (i * 0.2) % 3;
    const shape = i % 2 === 0 ? 'rounded-full' : 'rounded-sm rotate-45';
    return { id: i, color, left, animDuration, animDelay, shape };
  });

  useEffect(() => {
    // Si la tecla Escape es presionada, cerrar
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  const nombreMostrado = usuario.nombre_completo || usuario.nombre || 'Aventurero';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-500">
      {/* ESTILOS DE ANIMACIÓN DE GLOBOS Y CONFETI */}
      <style>{`
        @keyframes subirGlobo {
          0% {
            transform: translateY(115vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          50% {
            transform: translateY(50vh) rotate(6deg);
          }
          80% {
            transform: translateY(15vh) rotate(-6deg);
          }
          100% {
            transform: translateY(-25vh) rotate(4deg);
            opacity: 0;
          }
        }
        @keyframes caerConfeti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* 🎈 CAPA DE GLOBOS FLOTANTES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {globos.map(g => (
          <div
            key={g.id}
            style={{
              position: 'absolute',
              left: `${g.left}%`,
              bottom: '-120px',
              animation: `subirGlobo ${g.animDuration}s ease-in infinite`,
              animationDelay: `${g.animDelay}s`,
              transform: `scale(${g.scale})`,
              zIndex: 10
            }}
            className="flex flex-col items-center select-none"
          >
            {/* Globo con brillo */}
            <div
              className="w-14 h-18 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] relative shadow-2xl"
              style={{
                backgroundColor: g.color.bg,
                border: `2px solid ${g.color.borde}`
              }}
            >
              {/* Brillo del globo */}
              <div className="absolute top-2 left-2.5 w-3 h-5 bg-white/40 rounded-full rotate-[-25deg]"></div>
            </div>
            {/* Nudo del globo */}
            <div
              className="w-2.5 h-2 -mt-0.5 rounded-b-md"
              style={{ backgroundColor: g.color.borde }}
            ></div>
            {/* Hilo del globo */}
            <div className="w-0.5 h-16 bg-white/40"></div>
          </div>
        ))}

        {/* 🎊 CAPA DE CONFETI */}
        {confetis.map(c => (
          <div
            key={c.id}
            style={{
              position: 'absolute',
              left: `${c.left}%`,
              top: '-20px',
              width: '10px',
              height: '10px',
              backgroundColor: c.color,
              animation: `caerConfeti ${c.animDuration}s linear infinite`,
              animationDelay: `${c.animDelay}s`,
              zIndex: 11
            }}
            className={`${c.shape} shadow-md`}
          ></div>
        ))}
      </div>

      {/* 📜 TARJETA FESTIVA DEL GREMIO */}
      <div className="relative z-20 max-w-lg w-full bg-stone-950/95 border-2 border-amber-500/50 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] text-center text-stone-200 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 mx-auto mb-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce">
          🎂
        </div>

        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 inline-block mb-3">
          🎉 ¡El Gremio está de Fiesta! 🎉
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tight mb-2">
          ¡Feliz Cumpleaños, {nombreMostrado}!
        </h3>

        {usuario.edad && (
          <p className="text-amber-300 font-bold text-sm mb-3">
            ✨ Celebrando hoy tus <strong>{usuario.edad} años</strong> de vida y aventuras ✨
          </p>
        )}

        <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
          Que tus tiradas siempre saquen <strong>20s naturales</strong>, que la inspiración nunca abandone tu hoja de personaje y que tus travesías por el reino estén colmadas de risas, botín legendario y buena compañía.
        </p>

        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-3 mb-6 text-xs text-stone-400 italic">
          ⚔️ Con el cariño y honor de toda la comunidad de la <strong>Asociación de Rol La Pampa</strong>.
        </div>

        <button
          onClick={onCerrar}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🎲</span>
          <span>¡A Rodar los Dados y Festejar!</span>
          <span>🎈</span>
        </button>
      </div>
    </div>
  );
}
