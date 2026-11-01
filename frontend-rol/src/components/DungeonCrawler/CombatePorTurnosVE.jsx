import { useState, useEffect, useRef } from 'react';
import { sound } from './SoundEngine';
import {
  calcularDanoMedioArma,
  resolverTiradaD20,
  getModificador,
  formatearMod,
  calcularEstadisticasPersonaje,
  cargarPersonajeLocal
} from './ViejaEscuelaEngine';

export default function CombatePorTurnosVE({
  enemigo,
  personaje,
  onFinalizarCombate,
  onHuir
}) {
  // Garantizar objeto de personaje válido con Vieja Escuela
  const heroeSeguro = personaje || cargarPersonajeLocal() || {
    nombre: 'Aventurero',
    clase: 'guerrero',
    raza: 'humano',
    genero: 'm',
    nivel: 1,
    pvActual: 16,
    podActual: 0,
    atributos: { fue: 12, des: 12, con: 12, int: 10, sab: 10, car: 10 },
    armas: [{ nombre: 'Espada de Batalla', dado: '1d6', danoMedio: 3, tipo: 'CaC' }]
  };

  // Estadísticas calculadas del personaje
  const statsHeroe = calcularEstadisticasPersonaje(heroeSeguro);
  const armaActiva = heroeSeguro.armas?.[0] || {
    nombre: 'Espada de Batalla',
    dado: '1d6',
    danoMedio: 3,
    tipo: 'CaC'
  };

  // Estados del combate
  const [fase, setFase] = useState('INICIATIVA'); // 'INICIATIVA', 'TURNO_JUGADOR', 'TURNO_ENEMIGO', 'VICTORIA', 'DERROTA'
  const [pvHeroe, setPvHeroe] = useState(heroeSeguro.pvActual || statsHeroe.pv || 16);
  const [maxPvHeroe] = useState(statsHeroe.pv || 16);
  const [podHeroe, setPodHeroe] = useState(heroeSeguro.podActual || statsHeroe.pod || 0);
  const [pociones, setPociones] = useState(2);

  const [pvEnemigo, setPvEnemigo] = useState(enemigo.hp || enemigo.pv_max || 10);
  const [maxPvEnemigo] = useState(enemigo.maxHp || enemigo.pv_max || 10);
  const [defensaHeroeTemporal, setDefensaHeroeTemporal] = useState(0);

  // Animaciones y tirador de dados
  const [dadoHeroe, setDadoHeroe] = useState(null);
  const [dadoEnemigo, setDadoEnemigo] = useState(null);
  const [tirandoDado, setTirandoDado] = useState(false);
  const [animImpactoHeroe, setAnimImpactoHeroe] = useState(false);
  const [animImpactoEnemigo, setAnimImpactoEnemigo] = useState(false);

  // Historial / Bitácora de combate
  const [log, setLog] = useState([
    `⚔️ ¡Un ${enemigo.nombre} bloquea el paso! Prepara tu arma y tira iniciativa.`
  ]);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const agregarLog = (linea) => {
    setLog(prev => [...prev, linea]);
  };

  // Mapeo del sprite del héroe y enemigo
  const spriteHeroe = (() => {
    const clase = heroeSeguro.clase || 'guerrero';
    const gen = heroeSeguro.genero || 'm';
    const base = clase === 'guerrero' ? 'knight' : clase === 'hechicero' ? 'wizzard' : 'elf';
    return `/assets/crawler/heroes/${base}_${gen}_idle_anim_f0.png`;
  })();

  const spriteEnemigo = (() => {
    const base = enemigo.tipo || enemigo.sprite_base || 'skelet';
    return `/assets/crawler/enemies/${base}_idle_anim_f0.png`;
  })();

  // -------------------------------------------------------------------
  // 1. FASE DE INICIATIVA (1d20 + DES vs 1d20 + Bono)
  // -------------------------------------------------------------------
  const ejecutarIniciativa = () => {
    if (tirandoDado) return;
    setTirandoDado(true);
    sound.playSlash();

    setTimeout(() => {
      const modDes = getModificador(heroeSeguro.atributos?.des || 10);
      const tiradaHeroe = Math.floor(Math.random() * 20) + 1;
      const totalHeroe = tiradaHeroe + modDes;

      const bonoEnemigo = enemigo.atqBono !== undefined ? enemigo.atqBono : (enemigo.nivel || 1);
      const tiradaEnemigo = Math.floor(Math.random() * 20) + 1;
      const totalEnemigo = tiradaEnemigo + bonoEnemigo;

      setDadoHeroe({ valor: tiradaHeroe, mod: modDes, total: totalHeroe });
      setDadoEnemigo({ valor: tiradaEnemigo, mod: bonoEnemigo, total: totalEnemigo });
      setTirandoDado(false);

      if (totalHeroe >= totalEnemigo) {
        agregarLog(`🎲 Iniciativa: Sacas ${tiradaHeroe} (${formatearMod(modDes)}) = ${totalHeroe} vs ${totalEnemigo} del ${enemigo.nombre}. ¡Atacas primero!`);
        setFase('TURNO_JUGADOR');
      } else {
        agregarLog(`🎲 Iniciativa: Sacas ${totalHeroe} vs ${totalEnemigo} del ${enemigo.nombre}. ¡El enemigo reacciona más rápido!`);
        setFase('TURNO_ENEMIGO');
        setTimeout(() => ejecutarTurnoEnemigo(), 1000);
      }
    }, 450);
  };

  // -------------------------------------------------------------------
  // 2. TURNO DEL JUGADOR: ATAQUE
  // -------------------------------------------------------------------
  const handleAtaqueJugador = () => {
    if (fase !== 'TURNO_JUGADOR' || tirandoDado) return;
    setTirandoDado(true);
    sound.playSlash();

    setTimeout(() => {
      const modFue = getModificador(heroeSeguro.atributos?.fue || 10);
      const modDes = getModificador(heroeSeguro.atributos?.des || 10);
      const esProyectil = armaActiva.tipo?.includes('Proyectil');
      const modAtributo = esProyectil ? modDes : modFue;
      const bonoClaseAtq = statsHeroe.atqBono || 0;
      const bonoTotal = modAtributo + bonoClaseAtq;

      const d20 = Math.floor(Math.random() * 20) + 1;
      const totalAtaque = d20 + bonoTotal;
      const defEnemigo = enemigo.defensa || 11;

      setDadoHeroe({ valor: d20, mod: bonoTotal, total: totalAtaque, objetivo: defEnemigo });
      setTirandoDado(false);

      const esCritico = d20 === 20;
      const esPifia = d20 === 1;

      if (!esPifia && (esCritico || totalAtaque >= defEnemigo)) {
        // Impacto exitoso
        sound.playHit();
        setAnimImpactoEnemigo(true);
        setTimeout(() => setAnimImpactoEnemigo(false), 300);

        const calculoDano = calcularDanoMedioArma({
          arma: armaActiva,
          modFue: esProyectil ? 0 : modFue,
          esCritico
        });

        const dano = calculoDano.danoTotal;
        const nuevoPvEnemigo = Math.max(0, pvEnemigo - dano);
        setPvEnemigo(nuevoPvEnemigo);

        if (esCritico) {
          agregarLog(`💥 ¡CRÍTICO NATURAL (20)! Impactas al ${enemigo.nombre} infligiendo ${dano} de daño letal (${calculoDano.formula}).`);
        } else {
          agregarLog(`🎯 Impacto (${totalAtaque} vs DEF ${defEnemigo}): Golpeas con ${armaActiva.nombre} por ${dano} de daño (${calculoDano.formula}).`);
        }

        if (nuevoPvEnemigo <= 0) {
          // Victoria
          sound.playLevelUp();
          agregarLog(`🏆 ¡El ${enemigo.nombre} ha sido derrotado!`);
          setFase('VICTORIA');
          return;
        }
      } else {
        // Fallo
        sound.playHit();
        if (esPifia) {
          agregarLog(`💀 ¡PIFIA (1)! Tu golpe con ${armaActiva.nombre} tropieza en falso y dejas la guardia abierta.`);
        } else {
          agregarLog(`🛡️ Fallo (${totalAtaque} vs DEF ${defEnemigo}): El ${enemigo.nombre} esquiva o bloquea tu golpe.`);
        }
      }

      // Pasar al turno del enemigo
      setFase('TURNO_ENEMIGO');
      setTimeout(() => ejecutarTurnoEnemigo(), 1100);
    }, 450);
  };

  // -------------------------------------------------------------------
  // 3. TURNO DEL JUGADOR: DEFENDERSE
  // -------------------------------------------------------------------
  const handleDefenderse = () => {
    if (fase !== 'TURNO_JUGADOR' || tirandoDado) return;
    setDefensaHeroeTemporal(2);
    sound.playMagic();
    agregarLog(`🛡️ Adoptas una postura defensiva firme (+2 a tu Defensa hasta tu próximo turno).`);
    setFase('TURNO_ENEMIGO');
    setTimeout(() => ejecutarTurnoEnemigo(), 1000);
  };

  // -------------------------------------------------------------------
  // 4. TURNO DEL JUGADOR: BEBER POCIÓN
  // -------------------------------------------------------------------
  const handleBeberPocion = () => {
    if (fase !== 'TURNO_JUGADOR' || pociones <= 0 || tirandoDado) return;
    setPociones(prev => prev - 1);
    sound.playMagic();
    const curacion = 6; // Media oficial de poción curativa
    const nuevoPv = Math.min(maxPvHeroe, pvHeroe + curacion);
    setPvHeroe(nuevoPv);
    agregarLog(`🧪 Bebes una poción de curación reconfortante (+${curacion} PV restaurados).`);
    setFase('TURNO_ENEMIGO');
    setTimeout(() => ejecutarTurnoEnemigo(), 1000);
  };

  // -------------------------------------------------------------------
  // 5. TURNO DEL JUGADOR: HECHIZO ARCANO / SAGRADO
  // -------------------------------------------------------------------
  const handleLanzarHechizo = () => {
    if (fase !== 'TURNO_JUGADOR' || podHeroe <= 0 || tirandoDado) return;
    setPodHeroe(prev => prev - 1);
    sound.playMagic();
    setAnimImpactoEnemigo(true);
    setTimeout(() => setAnimImpactoEnemigo(false), 300);

    const danoMagico = 6; // Daño medio de conjuro de 1 POD
    const nuevoPv = Math.max(0, pvEnemigo - danoMagico);
    setPvEnemigo(nuevoPv);
    agregarLog(`✨ Canalizas 1 Punto de Poder y desatas un rayo arcano purificador por ${danoMagico} de daño mágico automático.`);

    if (nuevoPv <= 0) {
      sound.playLevelUp();
      agregarLog(`🏆 ¡El ${enemigo.nombre} ha sido pulverizado por la magia!`);
      setFase('VICTORIA');
      return;
    }

    setFase('TURNO_ENEMIGO');
    setTimeout(() => ejecutarTurnoEnemigo(), 1100);
  };

  // -------------------------------------------------------------------
  // 6. TURNO DEL ENEMIGO
  // -------------------------------------------------------------------
  const ejecutarTurnoEnemigo = () => {
    sound.playSlash();
    setTirandoDado(true);

    setTimeout(() => {
      const bonoAtq = enemigo.atqBono !== undefined ? enemigo.atqBono : (enemigo.nivel || 1);
      const d20 = Math.floor(Math.random() * 20) + 1;
      const totalAtaque = d20 + bonoAtq;
      const defJugador = (statsHeroe.def || 12) + defensaHeroeTemporal;

      setDadoEnemigo({ valor: d20, mod: bonoAtq, total: totalAtaque, objetivo: defJugador });
      setTirandoDado(false);
      setDefensaHeroeTemporal(0); // Reiniciar bono temporal

      const esCritico = d20 === 20;
      const esPifia = d20 === 1;

      if (!esPifia && (esCritico || totalAtaque >= defJugador)) {
        sound.playHit();
        setAnimImpactoHeroe(true);
        setTimeout(() => setAnimImpactoHeroe(false), 300);

        const dano = esCritico ? (enemigo.dano_medio || enemigo.dano || 3) * 2 : (enemigo.dano_medio || enemigo.dano || 3);
        const nuevoPv = Math.max(0, pvHeroe - dano);
        setPvHeroe(nuevoPv);

        if (esCritico) {
          agregarLog(`⚠️ ¡GOLPE CRÍTICO DEL ENEMIGO! El ${enemigo.nombre} impacta con ferocidad causando ${dano} de daño.`);
        } else {
          agregarLog(`🩸 Ataque enemigo (${totalAtaque} vs DEF ${defJugador}): El ${enemigo.nombre} acierta con ${enemigo.ataque_nombre || 'sus garras'} causando ${dano} de daño.`);
        }

        if (nuevoPv <= 0) {
          agregarLog(`💀 ¡Has caído en combate ante el ${enemigo.nombre}!`);
          setFase('DERROTA');
          return;
        }
      } else {
        agregarLog(`🛡️ Bloqueo (${totalAtaque} vs DEF ${defJugador}): El ataque del ${enemigo.nombre} rebota inofensivo contra tu armadura.`);
      }

      setFase('TURNO_JUGADOR');
    }, 450);
  };

  // -------------------------------------------------------------------
  // 7. HUIR DEL COMBATE (Instintos DES 11+)
  // -------------------------------------------------------------------
  const handleIntentarHuir = () => {
    if (fase !== 'TURNO_JUGADOR' || tirandoDado) return;
    setTirandoDado(true);

    setTimeout(() => {
      const modDes = getModificador(heroeSeguro.atributos?.des || 10);
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + modDes;
      setTirandoDado(false);

      if (total >= 11) {
        agregarLog(`🏃 ¡Tirada de Huida exitosa (${total} vs dif 11+)! Logras zafarte del combate.`);
        setTimeout(() => {
          if (onHuir) onHuir();
        }, 900);
      } else {
        agregarLog(`❌ Fallas al huir (${total} vs dif 11+). ¡Tropiezas y el enemigo aprovecha tu error!`);
        setFase('TURNO_ENEMIGO');
        setTimeout(() => ejecutarTurnoEnemigo(), 1000);
      }
    }, 400);
  };

  const handleCerrarVictoria = () => {
    sound.playCoin();
    onFinalizarCombate({
      victoria: true,
      pvRestante: pvHeroe,
      podRestante: podHeroe,
      oroGanado: enemigo.oro_recompensa || enemigo.oro || 5,
      xpGanada: enemigo.xp_recompensa || enemigo.xp || 15
    });
  };

  const handleCerrarDerrota = () => {
    onFinalizarCombate({
      victoria: false,
      derrota: true,
      pvRestante: 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-stone-950 border border-stone-800 max-w-4xl w-full rounded-3xl p-5 sm:p-7 shadow-2xl text-stone-200 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* ENCABEZADO SUPERIOR */}
        <div className="flex justify-between items-center pb-3 border-b border-stone-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider">
                Combate Táctico Oficial • Vieja Escuela OSR
              </h3>
              <p className="text-[11px] text-stone-400">
                Tiradas de iniciativa y ataque con d20 frente a la Defensa (DEF).
              </p>
            </div>
          </div>

          <div className="px-3 py-1 bg-stone-900 border border-stone-800 rounded-xl text-xs font-bold text-amber-400">
            Fase: <span className="uppercase text-stone-200">{fase.replace('_', ' ')}</span>
          </div>
        </div>

        {/* ARENA DE DUELO: HÉROE VS ENEMIGO */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-4">
          {/* TARJETA DEL HÉROE (5 col) */}
          <div className={`md:col-span-5 bg-stone-900/90 border rounded-2xl p-4 transition-all duration-200 relative ${
            fase === 'TURNO_JUGADOR'
              ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'border-stone-800 opacity-90'
          } ${animImpactoHeroe ? 'animate-bounce border-red-500 bg-red-950/40' : ''}`}>
            {fase === 'TURNO_JUGADOR' && (
              <span className="absolute -top-2.5 left-4 bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow">
                Tu Turno
              </span>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center overflow-hidden shadow-inner">
                <img
                  src={spriteHeroe}
                  alt={heroeSeguro.nombre}
                  className="w-10 h-10 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => { e.target.src = '/assets/crawler/heroes/knight_m_idle_anim_f0.png'; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-amber-200 truncate">{heroeSeguro.nombre}</h4>
                <p className="text-[11px] text-stone-400">
                  {heroeSeguro.raza?.toUpperCase()} {heroeSeguro.clase?.toUpperCase()} (Nvl {heroeSeguro.nivel || 1})
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-300 font-bold">
                  <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                    🛡️ DEF: {statsHeroe.def + defensaHeroeTemporal}
                  </span>
                  <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                    🗡️ ATQ: +{getModificador(heroeSeguro.atributos?.fue || 10) + (statsHeroe.atqBono || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de PV */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-red-400">❤️ Puntos de Vida</span>
                <span>{pvHeroe} / {maxPvHeroe}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (pvHeroe / maxPvHeroe) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* DADO D20 EN EL CENTRO (2 col) */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-2 text-center">
            <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all ${
              tirandoDado
                ? 'animate-spin border-amber-500 bg-amber-950/40 text-amber-300'
                : dadoHeroe
                ? (dadoHeroe.valor === 20 ? 'border-yellow-400 bg-yellow-950/60 text-yellow-300 scale-110' : 'border-stone-700 bg-stone-900 text-stone-100')
                : 'border-stone-800 bg-stone-950 text-stone-500'
            }`}>
              {tirandoDado ? '🎲' : (fase === 'TURNO_ENEMIGO' && dadoEnemigo ? dadoEnemigo.valor : (dadoHeroe ? dadoHeroe.valor : 'd20'))}
            </div>
            <span className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">
              {tirandoDado ? 'Rodando...' : 'Dado Oficial'}
            </span>
          </div>

          {/* TARJETA DEL ENEMIGO (5 col) */}
          <div className={`md:col-span-5 bg-stone-900/90 border rounded-2xl p-4 transition-all duration-200 relative ${
            fase === 'TURNO_ENEMIGO'
              ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
              : 'border-stone-800 opacity-90'
          } ${animImpactoEnemigo ? 'animate-bounce border-amber-400 bg-amber-950/40' : ''}`}>
            {fase === 'TURNO_ENEMIGO' && (
              <span className="absolute -top-2.5 right-4 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow">
                Turno Enemigo
              </span>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center overflow-hidden shadow-inner">
                <img
                  src={spriteEnemigo}
                  alt={enemigo.nombre}
                  className="w-10 h-10 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => { e.target.src = '/assets/crawler/enemies/skelet_idle_anim_f0.png'; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-red-300 truncate">
                  {enemigo.esJefe && '👑 '} {enemigo.nombre}
                </h4>
                <p className="text-[11px] text-stone-400">
                  {enemigo.tipo?.toUpperCase()} • Nivel {enemigo.nivel || 1}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-300 font-bold">
                  <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                    🛡️ DEF: {enemigo.defensa || 11}
                  </span>
                  <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                    🗡️ Daño: {enemigo.dano_medio || enemigo.dano || 3}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de PV Enemigo */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-red-400">❤️ Vida del Monstruo</span>
                <span>{pvEnemigo} / {maxPvEnemigo}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-700 transition-all duration-300"
                  style={{ width: `${Math.max(0, (pvEnemigo / maxPvEnemigo) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BITÁCORA DE COMBATE (LOG CON SCROLL) */}
        <div
          ref={logRef}
          className="flex-1 bg-stone-950/80 border border-stone-800/80 rounded-2xl p-3 text-xs font-mono space-y-1.5 overflow-y-auto mb-4 min-h-[90px] max-h-[140px] shadow-inner"
        >
          {log.map((linea, idx) => (
            <div key={idx} className="text-stone-300 leading-relaxed">
              {linea}
            </div>
          ))}
        </div>

        {/* PANEL DE ACCIONES TÁCTICAS DEL JUGADOR */}
        <div className="border-t border-stone-800 pt-3">
          {fase === 'INICIATIVA' && (
            <button
              onClick={ejecutarIniciativa}
              disabled={tirandoDado}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>🎲</span>
              <span>Tirar Iniciativa (1d20 + DES vs Monstruo)</span>
            </button>
          )}

          {fase === 'TURNO_JUGADOR' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleAtaqueJugador}
                disabled={tirandoDado}
                className="py-3 bg-red-700 hover:bg-red-600 text-white font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow"
              >
                <span>⚔️</span>
                <span>Atacar con {armaActiva.nombre?.split(' ')[0]}</span>
              </button>

              <button
                onClick={handleDefenderse}
                disabled={tirandoDado}
                className="py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 border border-stone-700"
              >
                <span>🛡️</span>
                <span>Guardia (+2 DEF)</span>
              </button>

              {heroeSeguro.clase === 'hechicero' || heroeSeguro.clase === 'clerigo' ? (
                <button
                  onClick={handleLanzarHechizo}
                  disabled={podHeroe <= 0 || tirandoDado}
                  className={`py-3 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 border ${
                    podHeroe > 0
                      ? 'bg-purple-900/60 hover:bg-purple-800/70 border-purple-600/50 text-purple-200'
                      : 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <span>✨</span>
                  <span>Magia ({podHeroe} POD)</span>
                </button>
              ) : (
                <button
                  onClick={handleBeberPocion}
                  disabled={pociones <= 0 || tirandoDado}
                  className={`py-3 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 border ${
                    pociones > 0
                      ? 'bg-emerald-900/60 hover:bg-emerald-800/70 border-emerald-600/50 text-emerald-200'
                      : 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <span>🧪</span>
                  <span>Poción ({pociones})</span>
                </button>
              )}

              <button
                onClick={handleIntentarHuir}
                disabled={tirandoDado}
                className="py-3 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 border border-stone-800"
              >
                <span>🏃</span>
                <span>Huir (Instintos)</span>
              </button>
            </div>
          )}

          {fase === 'TURNO_ENEMIGO' && (
            <div className="w-full py-3 bg-stone-900 border border-stone-800 rounded-2xl text-center text-xs text-amber-400 font-bold flex items-center justify-center gap-2 animate-pulse">
              <span>⚔️</span>
              <span>El {enemigo.nombre} está ejecutando su asalto...</span>
            </div>
          )}

          {fase === 'VICTORIA' && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                  🎉 ¡Victoria Gloriosa!
                </h4>
                <p className="text-xs text-stone-300">
                  Recompensa: <strong>+{enemigo.oro_recompensa || enemigo.oro || 5} Monedas de Oro</strong> y <strong>+{enemigo.xp_recompensa || enemigo.xp || 15} PX</strong>.
                </p>
              </div>
              <button
                onClick={handleCerrarVictoria}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-xl shadow-lg transition"
              >
                Continuar Exploración
              </button>
            </div>
          )}

          {fase === 'DERROTA' && (
            <div className="bg-red-950/40 border border-red-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-red-300 uppercase tracking-wide">
                  💀 Has Caído en Combate
                </h4>
                <p className="text-xs text-stone-300">
                  El Ángel Guardián Martín te aguarda en las puertas del juicio.
                </p>
              </div>
              <button
                onClick={handleCerrarDerrota}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs rounded-xl shadow-lg transition"
              >
                Comparecer ante Martín
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
