import { useState } from 'react';

function SolicitudDM({ onCompletado }) {
  const [aceptado, setAceptado] = useState(false);

  const manejarEnvio = () => {
    if (aceptado && onCompletado) {
      onCompletado();
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden max-w-2xl w-full text-white mx-auto">
      {/* Glow Effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="text-center mb-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-purple-400">
          🧙‍♂️ Códice del Narrador
        </h2>
        <p className="text-zinc-400 text-[10px] font-black tracking-widest uppercase mt-2">
          Términos y condiciones para el Rango de Dungeon Master
        </p>
      </div>

      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 md:p-6 mb-6 max-h-[45vh] overflow-y-auto space-y-4 text-sm leading-relaxed text-zinc-300 font-medium scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <p>
          Bienvenido, aspirante a **Dungeon Master**. El rango de DM en la *Asociación de Rol La Pampa* no es solo un título; es un pacto de confianza para guiar, divertir y forjar grandes leyendas dentro de nuestra comunidad.
        </p>
        
        <div className="space-y-4">
          <div className="border-l-2 border-purple-500/50 pl-3">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider mb-1">1. Compromiso de Respeto e Inclusión</h3>
            <p className="text-xs text-zinc-400">
              Te comprometes a forjar una mesa segura y libre de discriminación (por género, orientación, raza o creencia). La toxicidad no tiene lugar en nuestras crónicas.
            </p>
          </div>

          <div className="border-l-2 border-purple-500/50 pl-3">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider mb-1">2. Preparación y Puntualidad</h3>
            <p className="text-xs text-zinc-400">
              Respetar el tiempo de los jugadores preparando tus sesiones con antelación y notificando cualquier cambio o cancelación al menos con 24 horas de antelación si es posible.
            </p>
          </div>

          <div className="border-l-2 border-purple-500/50 pl-3">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider mb-1">3. Arbitraje Justo y Narrativa Compartida</h3>
            <p className="text-xs text-zinc-400">
              El rol es un juego colaborativo. Actuarás como un mediador imparcial, priorizando la diversión de todos los participantes sobre las ganas de "derrotar" a los aventureros.
            </p>
          </div>

          <div className="border-l-2 border-purple-500/50 pl-3">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider mb-1">4. Cuidado de las Bóvedas y Espacios</h3>
            <p className="text-xs text-zinc-400">
              Cuidarás y respetarás los locales físicos, servidores de comunicación y materiales (libros, dados, pantallas) puestos a disposición de la asociación.
            </p>
          </div>

          <div className="border-l-2 border-purple-500/50 pl-3">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider mb-1">5. Registro en la Bitácora de Campañas</h3>
            <p className="text-xs text-zinc-400">
              Te comprometes a reportar la asistencia de los jugadores y el estado final de las mesas para que el gremio mantenga su base de datos de crónicas actualizada.
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-500 italic mt-4 pt-3 border-t border-zinc-900">
          Nota: Tu solicitud será enviada al Senado de Administradores, quienes deliberarán y votarán de forma colegiada tu ascenso en un plazo estimado de 48 horas.
        </p>
      </div>

      <div className="flex items-start gap-3 mb-6 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-950/60 transition-all select-none cursor-pointer" onClick={() => setAceptado(!aceptado)}>
        <input 
          type="checkbox" 
          id="termCheck"
          checked={aceptado}
          onChange={(e) => setAceptado(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 accent-purple-500 w-4 h-4 rounded border-zinc-700 bg-zinc-950 focus:ring-purple-500" 
        />
        <label htmlFor="termCheck" className="text-xs text-zinc-400 font-bold leading-tight cursor-pointer">
          He leído con atención el <span className="text-purple-400">Códice del Narrador</span> y acepto cumplir fielmente con todos los deberes y reglamentos allí descritos.
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={manejarEnvio} 
          disabled={!aceptado}
          className={`flex-1 font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2
            ${aceptado 
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20 cursor-pointer' 
              : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'}`}
        >
          ✍️ Firmar y Enviar Solicitud
        </button>
      </div>
    </div>
  );
}

export default SolicitudDM;