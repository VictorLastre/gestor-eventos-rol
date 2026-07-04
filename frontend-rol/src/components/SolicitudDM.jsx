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

      <div className="text-center mb-6 border-b border-zinc-800/80 pb-4">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-purple-400">
          📜 Reglamento y Términos
        </h2>
        <p className="text-emerald-500 text-[10px] font-black tracking-[0.3em] uppercase mt-1">
          Asociación de Rol La Pampa
        </p>
      </div>

      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 md:p-6 mb-6 max-h-[50vh] overflow-y-auto space-y-5 text-sm leading-relaxed text-zinc-300 font-medium scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        
        <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4 mb-4">
          <p className="font-bold text-white text-base mb-1">¡Saludos, Dungeon Master (DM)!</p>
          <p className="text-xs text-zinc-400">
            Te agradecemos enormemente por tu voluntad de dirigir y compartir tu tiempo e imaginación. Los eventos de rol del <strong>"Molino Rolero"</strong> están diseñados para ser espacios abiertos a todo el público, familiares e inclusivos. A menudo, nuestras mesas son el primer contacto que muchas personas (incluyendo menores de edad) tienen con los juegos de rol.
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Para garantizar que todos tengan una experiencia épica, segura y memorable, te pedimos que leas y aceptes los siguientes Términos y Condiciones antes de convocar tu mesa.
          </p>
        </div>

        <div className="space-y-4">
          {/* Sección 1 */}
          <div className="border-l-2 border-purple-500/50 pl-3 space-y-2">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider">
              1. Tono y Contenido de las Partidas (Mesa Family-Friendly)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Al ser un evento en un espacio público y cultural, todas las mesas deben ser aptas para un público amplio (similar a una clasificación de cine PG-13 o ATP).
            </p>
            <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1">
              <li><strong>Ausencia de contenido explícito:</strong> Queda estrictamente prohibido el contenido sexual explícito, el "gore" o violencia gráfica detallada, la tortura, y temáticas de abuso de cualquier tipo.</li>
              <li><strong>Violencia Heroica:</strong> El combate es parte del rol, pero te pedimos que las descripciones se centren en la acción heroica o cinemática, evitando el ensañamiento o el sadismo.</li>
              <li><strong>Temas Sensibles:</strong> Evita tramas que giren en torno a fobias extremas, suicidio, discriminación realista profunda o violencia hacia menores/animales.</li>
            </ul>
          </div>

          {/* Sección 2 */}
          <div className="border-l-2 border-purple-500/50 pl-3 space-y-2">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider">
              2. Herramientas de Seguridad (Mesa Segura)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Incluso en partidas de tono ligero, la seguridad emocional de los jugadores es prioridad.
            </p>
            <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1">
              <li><strong>Uso Obligatorio de Herramientas:</strong> Es obligatorio implementar y explicar brevemente al menos una herramienta de seguridad al inicio de la sesión. Recomendamos la Tarjeta X (X-Card) o el sistema de Líneas y Velos.</li>
              <li><strong>Respeto a los límites:</strong> Si un jugador utiliza una herramienta de seguridad para detener una escena o evitar un tema, como DM debes adaptar la narrativa inmediatamente y sin pedir justificaciones.</li>
            </ul>
          </div>

          {/* Sección 3 */}
          <div className="border-l-2 border-purple-500/50 pl-3 space-y-2">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider">
              3. Trato hacia los Jugadores (Mesa Inclusiva)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Tú eres el embajador de la Asociación y del hobby durante esas horas.
            </p>
            <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1">
              <li><strong>Paciencia con los Novatos:</strong> Muchos jugadores estarán tirando un d20 por primera vez. Se espera que como DM expliques las reglas con paciencia, fomentes la participación y priorices la diversión por encima de la rigurosidad extrema de las reglas ("Rule of Cool"). Recuerda que tú también fuiste novato.</li>
              <li><strong>Prohibición de PvP Tóxico:</strong> No fomentes ni permitas el combate entre jugadores (PvP) ni el robo entre miembros del grupo si esto genera malestar en la mesa. El juego debe ser colaborativo.</li>
              <li><strong>Respeto Absoluto:</strong> Fomentamos un ambiente libre de discriminación por género, orientación sexual, religión, etnia o capacidades. Cualquier comentario o actitud discriminatoria (dentro o fuera de personaje) es inaceptable.</li>
            </ul>
          </div>

          {/* Sección 4 */}
          <div className="border-l-2 border-purple-500/50 pl-3 space-y-2">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider">
              4. Compromiso, Horarios y Logística
            </h3>
            <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1">
              <li><strong>Puntualidad:</strong> Te pedimos llegar al menos 15 minutos antes del inicio de tu turno (Mañana, Tarde o Noche) para preparar tu espacio, recibir a los jugadores y acomodar los materiales.</li>
              <li><strong>Respeto del Horario:</strong> Las jornadas tienen un cronograma estricto. Debes calcular el clímax de tu aventura para terminar a tiempo, permitiendo que la siguiente tanda de mesas pueda comenzar sin demoras.</li>
              <li><strong>Materiales:</strong> Procura traer lo necesario para tu mesa (dados extra, lápices, hojas de personaje pre-generadas). Si necesitas algo puedes solicitarlo a la Asociación, indícalo con antelación en la inscripción.</li>
            </ul>
          </div>

          {/* Sección 5 */}
          <div className="border-l-2 border-purple-500/50 pl-3 space-y-2">
            <h3 className="font-bold text-purple-300 uppercase text-xs tracking-wider">
              5. Política de Tolerancia Cero
            </h3>
            <p className="text-[11px] text-zinc-400">
              La organización de la Asociación se reserva el derecho de intervenir, suspender la mesa o pedirle a un DM o jugador que se retire del evento si se violan flagrantemente estas normas de convivencia, alterando la paz del evento o vulnerando la seguridad de los asistentes.
            </p>
          </div>
        </div>

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
          Al enviar el formulario de creación de partida, confirmo que he leído este reglamento, comprendo sus directrices y me comprometo a guiar mi mesa bajo los valores de respeto, diversión e inclusión de la Asociación de Rol La Pampa.
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