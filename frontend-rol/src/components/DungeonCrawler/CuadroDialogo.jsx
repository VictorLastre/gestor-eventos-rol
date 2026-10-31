import { useState, useEffect, useRef } from 'react';
import { sound } from './SoundEngine';
import { assets } from './AssetManager';

export default function CuadroDialogo({ 
  npc, 
  jugadorOro, 
  onEjecutarAccion, 
  onCerrar 
}) {
  const [textoVisible, setTextoVisible] = useState('');
  const [textoObjetivo, setTextoObjetivo] = useState(npc?.dialogoInicial || '');
  const [escribiendo, setEscribiendo] = useState(false);
  const [frameAnim, setFrameAnim] = useState(0);
  const [mensajeExito, setMensajeExito] = useState(null);
  const timerRef = useRef(null);

  // Animación del sprite del NPC
  useEffect(() => {
    const intervalo = setInterval(() => {
      setFrameAnim(prev => (prev + 1) % 4);
    }, 200);
    return () => clearInterval(intervalo);
  }, []);

  // Efecto máquina de escribir con sonido retro
  useEffect(() => {
    setTextoVisible('');
    setEscribiendo(true);
    let i = 0;
    
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (i < textoObjetivo.length) {
        const char = textoObjetivo[i];
        setTextoVisible(prev => prev + char);
        // Sonar un blip cada 2-3 caracteres para una cadencia suave
        if (i % 2 === 0 && char !== ' ') {
          sound.playDialogueBlip(npc?.pitchVoz || 440);
        }
        i++;
      } else {
        setEscribiendo(false);
        clearInterval(timerRef.current);
      }
    }, 20);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [textoObjetivo, npc]);

  // Manejar teclado para opciones 1-9 y ESC
  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') {
        onCerrar();
        return;
      }
      if (escribiendo) {
        if (e.key === ' ' || e.key === 'Enter') {
          // Saltear la máquina de escribir y mostrar texto completo
          if (timerRef.current) clearInterval(timerRef.current);
          setTextoVisible(textoObjetivo);
          setEscribiendo(false);
        }
        return;
      }

      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= (npc?.opciones?.length || 0)) {
        seleccionarOpcion(npc.opciones[num - 1]);
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [escribiendo, textoObjetivo, npc]);

  const seleccionarOpcion = (opcion) => {
    if (!opcion) return;

    if (opcion.accion === 'cerrar') {
      onCerrar();
      return;
    }

    if (opcion.costoOro && jugadorOro < opcion.costoOro) {
      setTextoObjetivo(`¡No tienes suficiente oro! Esta transacción requiere ${opcion.costoOro} monedas y solo llevas ${jugadorOro}.`);
      setMensajeExito(null);
      return;
    }

    // Ejecutar mecánica real del juego
    const resultado = onEjecutarAccion(opcion.accion, opcion.costoOro || 0);
    
    if (opcion.costoOro) {
      sound.playShopBuy();
    }

    setTextoObjetivo(opcion.respuesta);
    if (resultado?.mensaje) {
      setMensajeExito(resultado.mensaje);
    }
  };

  if (!npc) return null;

  // Obtener imagen del sprite animado y retrato HD
  const claveImg = `${npc.spritePrefijo}_${frameAnim}`;
  const imgElement = assets.get(claveImg);
  const imgSrc = imgElement?.src || null;
  const portraitUrl = `/assets/crawler/portraits/${npc.spritePrefijo}_portrait.png`;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center p-4 sm:p-8 bg-black/50 backdrop-blur-xs animate-fade-in pointer-events-auto">
      <div 
        className="w-full max-w-3xl bg-zinc-950/95 border-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-white"
        style={{ borderColor: npc.colorTema || '#eab308' }}
      >
        {/* Retrato del NPC */}
        <div className="w-full md:w-56 bg-zinc-900/90 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800 relative">
          <div 
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 flex items-center justify-center bg-zinc-950 shadow-inner overflow-hidden mb-3 relative group"
            style={{ borderColor: npc.colorTema }}
          >
            <img 
              src={portraitUrl} 
              alt={npc.nombre} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                if (imgSrc) {
                  e.target.src = imgSrc;
                  e.target.className = "w-20 h-20 sm:w-24 sm:h-24 object-contain pixelated transform scale-150";
                }
              }}
            />
            {/* Halo / Destello de aura */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{ backgroundColor: npc.colorTema }}
            />
          </div>

          <h3 className="font-bold text-base sm:text-lg text-center leading-tight" style={{ color: npc.colorTema }}>
            {npc.nombre}
          </h3>
          <p className="text-xs text-zinc-400 text-center mt-0.5">{npc.cargo}</p>
          <span className={`text-[10px] px-2 py-0.5 mt-2 rounded-full border ${npc.badgeColor}`}>
            {npc.gremio}
          </span>
        </div>

        {/* Cuerpo del Diálogo */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Cabecera con título del gremio y botón cerrar */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/80">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: npc.colorTema }} />
                Diálogo de Mazmorra
              </span>
              <button 
                onClick={onCerrar}
                className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                ✕ Cerrar [ESC]
              </button>
            </div>

            {/* Texto animado tipo RPG */}
            <div 
              onClick={() => {
                if (escribiendo) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setTextoVisible(textoObjetivo);
                  setEscribiendo(false);
                }
              }}
              className="min-h-[70px] sm:min-h-[85px] text-zinc-200 text-sm sm:text-base leading-relaxed font-sans cursor-pointer select-none"
            >
              {textoVisible}
              {escribiendo && (
                <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse" />
              )}
            </div>

            {/* Alerta de acción completada */}
            {mensajeExito && (
              <div className="mt-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span>✨</span> {mensajeExito}
              </div>
            )}
          </div>

          {/* Opciones de Interacción */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 grid grid-cols-1 gap-2">
            {npc.opciones.map((op, idx) => {
              const tieneOro = !op.costoOro || jugadorOro >= op.costoOro;
              return (
                <button
                  key={op.id}
                  onClick={() => seleccionarOpcion(op)}
                  disabled={escribiendo}
                  className={`text-left text-xs sm:text-sm px-3 py-2 rounded-xl border transition-all flex items-center justify-between group ${
                    tieneOro
                      ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700/60 hover:border-zinc-500 text-zinc-200'
                      : 'bg-zinc-950/60 border-zinc-800/40 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-xs bg-zinc-800 group-hover:bg-zinc-700 text-zinc-300"
                    >
                      {idx + 1}
                    </span>
                    <span>{op.texto}</span>
                  </div>

                  {op.costoOro && (
                    <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                      tieneOro ? 'text-amber-400 bg-amber-950/40' : 'text-red-400 bg-red-950/40'
                    }`}>
                      🪙 {op.costoOro}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
