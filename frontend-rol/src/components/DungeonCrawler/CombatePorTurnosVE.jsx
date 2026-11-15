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

  const statsHeroe = calcularEstadisticasPersonaje(heroeSeguro);
  const armaActiva = heroeSeguro.armas?.[0] || {
    nombre: 'Espada de Batalla',
    dado: '1d6',
    danoMedio: 3,
    tipo: 'CaC'
  };

  const claseHeroe = (heroeSeguro.clase || 'guerrero').toLowerCase();

  // Estados del combate
  const [fase, setFase] = useState('INICIATIVA'); // 'INICIATIVA', 'TURNO_JUGADOR', 'TURNO_ENEMIGO', 'VICTORIA', 'DERROTA'
  const [pvHeroe, setPvHeroe] = useState(heroeSeguro.pvActual || statsHeroe.pv || 16);
  const [maxPvHeroe] = useState(statsHeroe.pv || 16);
  const [podHeroe, setPodHeroe] = useState(heroeSeguro.podActual !== undefined ? heroeSeguro.podActual : (statsHeroe.pod || 0));
  const [maxPodHeroe] = useState(statsHeroe.pod || (claseHeroe === 'hechicero' || claseHeroe === 'clerigo' ? 5 : 0));
  const [pociones, setPociones] = useState(2);

  const [pvEnemigo, setPvEnemigo] = useState(enemigo.hp || enemigo.pv_max || 12);
  const [maxPvEnemigo] = useState(enemigo.maxHp || enemigo.pv_max || enemigo.hp || 12);

  // Modificadores temporales y estado táctico
  const [defensaHeroeTemporal, setDefensaHeroeTemporal] = useState(0);
  const [bombaHumoActiva, setBombaHumoActiva] = useState(false);
  const [penalizacionEnemigo, setPenalizacionEnemigo] = useState(0);
  const [segundoAlientoUsado, setSegundoAlientoUsado] = useState(false);
  const [bombaHumoUsada, setBombaHumoUsada] = useState(false);
  const [turnoNumero, setTurnoNumero] = useState(1);

  // Sistema de retroalimentación visual y textos flotantes
  const [screenShake, setScreenShake] = useState(false);
  const [animImpactoHeroe, setAnimImpactoHeroe] = useState(false);
  const [animImpactoEnemigo, setAnimImpactoEnemigo] = useState(false);
  const [animBloqueoHeroe, setAnimBloqueoHeroe] = useState(false);
  const [animBloqueoEnemigo, setAnimBloqueoEnemigo] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [ultimaAccion, setUltimaAccion] = useState(null);
  const [ejecutandoAccion, setEjecutandoAccion] = useState(false);

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

  // Disparar texto flotante (Floating Combat Text)
  const emitirTextoFlotante = (target, texto, tipo = 'dano') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, target, texto, tipo }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1100);
  };

  const vibrarPantalla = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 280);
  };

  // Sprites
  const spriteHeroe = (() => {
    const gen = heroeSeguro.genero || 'm';
    const base = claseHeroe === 'guerrero' ? 'knight' : (claseHeroe === 'hechicero' ? 'wizzard' : 'elf');
    return `/assets/crawler/heroes/${base}_${gen}_idle_anim_f0.png`;
  })();

  const spriteEnemigo = (() => {
    const base = enemigo.tipo || enemigo.sprite_base || 'skelet';
    return `/assets/crawler/enemies/${base}_idle_anim_f0.png`;
  })();

  // Modificadores de atributo del héroe
  const modFue = getModificador(heroeSeguro.atributos?.fue || 10);
  const modDes = getModificador(heroeSeguro.atributos?.des || 10);
  const modInt = getModificador(heroeSeguro.atributos?.int || 10);
  const modSab = getModificador(heroeSeguro.atributos?.sab || 10);
  const bonoAtqClase = statsHeroe.atqBono || 0;
  const caEnemigo = enemigo.defensa || 11;
  const caHeroeTotal = (statsHeroe.def || 12) + defensaHeroeTemporal;

  // -------------------------------------------------------------------
  // 1. FASE DE INICIATIVA SILENCIOSA (1d20 + DES vs Monstruo)
  // -------------------------------------------------------------------
  const ejecutarIniciativa = () => {
    if (ejecutandoAccion) return;
    setEjecutandoAccion(true);
    sound.playSlash();

    const d20Heroe = Math.floor(Math.random() * 20) + 1;
    const totalHeroe = d20Heroe + modDes;
    const bonoEnemigo = enemigo.atqBono !== undefined ? enemigo.atqBono : (enemigo.nivel || 1);
    const d20Enemigo = Math.floor(Math.random() * 20) + 1;
    const totalEnemigo = d20Enemigo + bonoEnemigo;

    setUltimaAccion({
      tipo: 'iniciativa',
      heroe: { d20: d20Heroe, mod: modDes, total: totalHeroe },
      enemigo: { d20: d20Enemigo, mod: bonoEnemigo, total: totalEnemigo }
    });

    if (totalHeroe >= totalEnemigo) {
      agregarLog(`🎲 Iniciativa: Sacas ${d20Heroe} (${formatearMod(modDes)} DES = ${totalHeroe}) vs ${totalEnemigo} del ${enemigo.nombre}. ¡Tomas la iniciativa!`);
      emitirTextoFlotante('heroe', '¡PRIMERO!', 'buff');
      setFase('TURNO_JUGADOR');
      setEjecutandoAccion(false);
    } else {
      agregarLog(`🎲 Iniciativa: El ${enemigo.nombre} reacciona con ${totalEnemigo} vs tus ${totalHeroe}. ¡El enemigo ataca primero!`);
      emitirTextoFlotante('enemigo', '¡PRIMERO!', 'buff');
      setFase('TURNO_ENEMIGO');
      setTimeout(() => {
        ejecutarTurnoEnemigo();
        setEjecutandoAccion(false);
      }, 700);
    }
  };

  // -------------------------------------------------------------------
  // 2. RESOLUCIÓN UNIVERSAL DE ATAQUES DEL JUGADOR (POR DETRÁS)
  // -------------------------------------------------------------------
  const ejecutarAccionJugador = (config) => {
    if (fase !== 'TURNO_JUGADOR' || ejecutandoAccion) return;
    setEjecutandoAccion(true);

    // Verificar si cuesta POD
    if (config.costePod && podHeroe < config.costePod) {
      agregarLog(`⚠️ No tienes suficientes Puntos de Poder (${podHeroe}/${config.costePod} POD).`);
      setEjecutandoAccion(false);
      return;
    }

    if (config.costePod) {
      setPodHeroe(prev => Math.max(0, prev - config.costePod));
    }

    // ACCIÓN: MISIL MÁGICO (Auto-acierto garantizado ineludible)
    if (config.tipo === 'misil_magico') {
      sound.playMagic();
      vibrarPantalla();
      setAnimImpactoEnemigo(true);
      setTimeout(() => setAnimImpactoEnemigo(false), 300);

      // 3 dardos de 1d4 + 1
      const dardo1 = Math.floor(Math.random() * 4) + 2;
      const dardo2 = Math.floor(Math.random() * 4) + 2;
      const dardo3 = Math.floor(Math.random() * 4) + 2;
      const danoTotal = dardo1 + dardo2 + dardo3;

      const nuevoPvEnemigo = Math.max(0, pvEnemigo - danoTotal);
      setPvEnemigo(nuevoPvEnemigo);

      emitirTextoFlotante('enemigo', `-${danoTotal} ✨`, 'magia');
      agregarLog(`✨ ¡Misil Mágico! 3 dardos de fuerza infalibles golpean al ${enemigo.nombre} infligiendo ${danoTotal} de daño arcano puro (Ignora CA).`);

      setUltimaAccion({
        nombre: 'Misil Mágico',
        impacto: true,
        autoAcierto: true,
        dano: danoTotal
      });

      if (nuevoPvEnemigo <= 0) {
        sound.playLevelUp();
        agregarLog(`🏆 ¡El ${enemigo.nombre} cae pulverizado ante tu magia!`);
        setFase('VICTORIA');
        setEjecutandoAccion(false);
        return;
      }

      setFase('TURNO_ENEMIGO');
      setTimeout(() => {
        ejecutarTurnoEnemigo();
        setEjecutandoAccion(false);
      }, 650);
      return;
    }

    // ACCIÓN: ESCUDO ARCANO (Reacción de defensa)
    if (config.tipo === 'escudo_arcano') {
      sound.playMagic();
      setDefensaHeroeTemporal(prev => prev + 5);
      emitirTextoFlotante('heroe', '+5 CA 🛡️', 'buff');
      agregarLog(`🛡️ Escudo Arcano: Creas una barrera translúcida que eleva tu Defensa en +5 hasta tu siguiente turno.`);

      setUltimaAccion({
        nombre: 'Escudo Arcano',
        impacto: true,
        buff: '+5 CA'
      });

      setFase('TURNO_ENEMIGO');
      setTimeout(() => {
        ejecutarTurnoEnemigo();
        setEjecutandoAccion(false);
      }, 650);
      return;
    }

    // ACCIÓN: BOMBA DE HUMO (Pícaro - evasión garantizada)
    if (config.tipo === 'bomba_humo') {
      sound.playSlash();
      setBombaHumoActiva(true);
      setBombaHumoUsada(true);
      emitirTextoFlotante('heroe', '¡EN HUMO! 💨', 'esquiva');
      agregarLog(`💨 Bomba de Humo: Detonas una cápsula cegadora. ¡El próximo ataque del enemigo fallará automáticamente!`);

      setUltimaAccion({
        nombre: 'Bomba de Humo',
        impacto: true,
        buff: 'Evasión Total'
      });

      setFase('TURNO_ENEMIGO');
      setTimeout(() => {
        ejecutarTurnoEnemigo();
        setEjecutandoAccion(false);
      }, 650);
      return;
    }

    // ACCIÓN: SEGUNDO ALIENTO (Guerrero)
    if (config.tipo === 'segundo_aliento') {
      sound.playHeal();
      setSegundoAlientoUsado(true);
      const curacion = Math.floor(Math.random() * 8) + 1 + (heroeSeguro.nivel || 1);
      const nuevoPv = Math.min(maxPvHeroe, pvHeroe + curacion);
      setPvHeroe(nuevoPv);
      emitirTextoFlotante('heroe', `+${curacion} PV 💖`, 'cura');
      agregarLog(`🩹 Segundo Aliento: Tomas una bocanada de aire y recuperas ${curacion} PV en pleno fragor marcial.`);

      setUltimaAccion({
        nombre: 'Segundo Aliento',
        impacto: true,
        cura: curacion
      });

      setFase('TURNO_ENEMIGO');
      setTimeout(() => {
        ejecutarTurnoEnemigo();
        setEjecutandoAccion(false);
      }, 650);
      return;
    }

    // ACCIÓN: PALABRA DE CURACIÓN (Clérigo)
    if (config.tipo === 'palabra_curacion') {
      sound.playHeal();
      const curacion = Math.floor(Math.random() * 8) + 1 + modSab + 2;
      const nuevoPv = Math.min(maxPvHeroe, pvHeroe + curacion);
      setPvHeroe(nuevoPv);
      emitirTextoFlotante('heroe', `+${curacion} PV ✨`, 'cura');
      agregarLog(`💖 Palabra de Curación: Invocas la gracia celestial restaurando ${curacion} PV.`);

      setUltimaAccion({
        nombre: 'Palabra de Curación',
        impacto: true,
        cura: curacion
      });

      setFase('TURNO_ENEMIGO');
      setTimeout(() => {
        ejecutarTurnoEnemigo();
        setEjecutandoAccion(false);
      }, 650);
      return;
    }

    // -----------------------------------------------------------------
    // ATAQUES ESTÁNDAR O CONJUROS QUE REQUIEREN TIRADA VS CA
    // -----------------------------------------------------------------
    if (config.sonido === 'magia') {
      sound.playMagic();
    } else {
      sound.playSlash();
    }

    // Cálculo silencioso de la tirada
    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonoAtaque = (config.modAtributo || 0) + bonoAtqClase + (config.bonoAtqExtra || 0);
    const totalAtaque = d20 + bonoAtaque;
    const esCritico = d20 === 20;
    const esPifia = d20 === 1;
    const superaCA = !esPifia && (esCritico || totalAtaque >= caEnemigo);

    setUltimaAccion({
      nombre: config.nombre,
      d20,
      bono: bonoAtaque,
      total: totalAtaque,
      caObjetivo: caEnemigo,
      impacto: superaCA,
      critico: esCritico,
      pifia: esPifia
    });

    if (superaCA) {
      // IMPACTO EXITOSO
      if (esCritico) {
        sound.playCrit();
        vibrarPantalla();
      } else {
        sound.playHit();
      }

      setAnimImpactoEnemigo(true);
      setTimeout(() => setAnimImpactoEnemigo(false), 300);

      // Cálculo de daño
      let danoBase = config.danoCalculado ? config.danoCalculado(esCritico) : (
        calcularDanoMedioArma({
          arma: armaActiva,
          modFue: config.esMagia ? 0 : modFue,
          esCritico
        }).danoTotal + (config.bonoDanoExtra || 0)
      );

      danoBase = Math.max(1, danoBase);
      const nuevoPvEnemigo = Math.max(0, pvEnemigo - danoBase);
      setPvEnemigo(nuevoPvEnemigo);

      // Efecto secundario (ej: Rayo de Escarcha entorpece al enemigo)
      if (config.aplicaPenalizacionEnemigo) {
        setPenalizacionEnemigo(config.aplicaPenalizacionEnemigo);
      }

      if (esCritico) {
        emitirTextoFlotante('enemigo', `💥 -${danoBase} CRÍTICO!`, 'critico');
        agregarLog(`💥 ¡GOLPE CRÍTICO (20 natural)! ${config.nombre} destroza la defensa del ${enemigo.nombre} causando ${danoBase} de daño devastador!`);
      } else {
        emitirTextoFlotante('enemigo', `-${danoBase}`, config.tipoColor || 'dano');
        agregarLog(`🎯 ${config.nombre} [Tirada ${d20} + ${bonoAtaque} = ${totalAtaque} vs CA ${caEnemigo}]: ¡Impactas infligiendo ${danoBase} de daño!`);
      }

      if (nuevoPvEnemigo <= 0) {
        sound.playLevelUp();
        agregarLog(`🏆 ¡El ${enemigo.nombre} ha sido derrotado!`);
        setFase('VICTORIA');
        setEjecutandoAccion(false);
        return;
      }
    } else {
      // FALLO / BLOQUEO
      sound.playBlock();
      setAnimBloqueoEnemigo(true);
      setTimeout(() => setAnimBloqueoEnemigo(false), 350);

      if (esPifia) {
        emitirTextoFlotante('enemigo', '¡PIFIA! 💀', 'fallo');
        agregarLog(`💀 ¡PIFIA (1 natural)! Tu ${config.nombre} tropieza y deja tu guardia completamente expuesta.`);
      } else if (totalAtaque >= caEnemigo - 2) {
        emitirTextoFlotante('enemigo', '¡BLOQUEADO! 🛡️', 'bloqueo');
        agregarLog(`🛡️ Bloqueo [${totalAtaque} vs CA ${caEnemigo}]: La gruesa armadura del ${enemigo.nombre} absorbe el golpe sin recibir daño.`);
      } else {
        emitirTextoFlotante('enemigo', '¡FALLO! 💨', 'fallo');
        agregarLog(`💨 Fallo [${totalAtaque} vs CA ${caEnemigo}]: El ${enemigo.nombre} esquiva ágilmente tu ataque.`);
      }
    }

    // Transición fluida al turno enemigo
    setFase('TURNO_ENEMIGO');
    setTimeout(() => {
      ejecutarTurnoEnemigo();
      setEjecutandoAccion(false);
    }, 650);
  };

  // -------------------------------------------------------------------
  // 3. DEFENDERSE / GUARDIA (+2 DEF)
  // -------------------------------------------------------------------
  const handleDefenderse = () => {
    if (fase !== 'TURNO_JUGADOR' || ejecutandoAccion) return;
    setEjecutandoAccion(true);
    sound.playBlock();
    setDefensaHeroeTemporal(prev => prev + 2);
    emitirTextoFlotante('heroe', '+2 DEF 🛡️', 'buff');
    agregarLog(`🛡️ Adoptas una guardia firme y cerrada (+2 a tu Defensa hasta tu próximo turno).`);

    setFase('TURNO_ENEMIGO');
    setTimeout(() => {
      ejecutarTurnoEnemigo();
      setEjecutandoAccion(false);
    }, 600);
  };

  // -------------------------------------------------------------------
  // 4. BEBER POCIÓN DE SALUD
  // -------------------------------------------------------------------
  const handleBeberPocion = () => {
    if (fase !== 'TURNO_JUGADOR' || pociones <= 0 || ejecutandoAccion) return;
    setEjecutandoAccion(true);
    setPociones(prev => prev - 1);
    sound.playHeal();
    const curacion = 6;
    const nuevoPv = Math.min(maxPvHeroe, pvHeroe + curacion);
    setPvHeroe(nuevoPv);
    emitirTextoFlotante('heroe', `+${curacion} PV 🧪`, 'cura');
    agregarLog(`🧪 Bebes un trago vigorizante de poción (+${curacion} PV restaurados). Te quedan ${pociones - 1} frascos.`);

    setFase('TURNO_ENEMIGO');
    setTimeout(() => {
      ejecutarTurnoEnemigo();
      setEjecutandoAccion(false);
    }, 600);
  };

  // -------------------------------------------------------------------
  // 5. TURNO DEL ENEMIGO (CALCULADO POR DETRÁS CON FALLOS & BLOQUEOS)
  // -------------------------------------------------------------------
  const ejecutarTurnoEnemigo = () => {
    // Si la bomba de humo está activa, fallo automático
    if (bombaHumoActiva) {
      setBombaHumoActiva(false);
      sound.playMiss();
      emitirTextoFlotante('heroe', '¡ESQUIVADO EN HUMO! 💨', 'esquiva');
      agregarLog(`💨 ¡El ${enemigo.nombre} lanza un zarpazo a ciegas a través de la densa humareda y no encuentra nada!`);
      setDefensaHeroeTemporal(0);
      setTurnoNumero(prev => prev + 1);
      setFase('TURNO_JUGADOR');
      return;
    }

    sound.playSlash();

    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonoEnemigoBase = enemigo.atqBono !== undefined ? enemigo.atqBono : (enemigo.nivel || 1);
    const bonoFinalEnemigo = Math.max(0, bonoEnemigoBase - penalizacionEnemigo);
    const totalAtaqueEnemigo = d20 + bonoFinalEnemigo;
    const caHeroe = (statsHeroe.def || 12) + defensaHeroeTemporal;

    // Resetear penalizaciones y buffs temporales de este turno
    setPenalizacionEnemigo(0);
    setDefensaHeroeTemporal(0);

    const esCritico = d20 === 20;
    const esPifia = d20 === 1;
    const acierta = !esPifia && (esCritico || totalAtaqueEnemigo >= caHeroe);

    setUltimaAccion({
      enemigoAtacando: true,
      nombre: enemigo.ataque_nombre || 'Zarpazo Feroz',
      d20,
      bono: bonoFinalEnemigo,
      total: totalAtaqueEnemigo,
      caObjetivo: caHeroe,
      impacto: acierta,
      critico: esCritico,
      pifia: esPifia
    });

    if (acierta) {
      if (esCritico) {
        sound.playCrit();
        vibrarPantalla();
      } else {
        sound.playHit();
      }

      setAnimImpactoHeroe(true);
      setTimeout(() => setAnimImpactoHeroe(false), 300);

      const danoBase = esCritico
        ? (enemigo.dano_medio || enemigo.dano || 3) * 2
        : (enemigo.dano_medio || enemigo.dano || 3);

      const nuevoPv = Math.max(0, pvHeroe - danoBase);
      setPvHeroe(nuevoPv);

      if (esCritico) {
        emitirTextoFlotante('heroe', `💥 -${danoBase} CRÍTICO!`, 'critico');
        agregarLog(`⚠️ ¡GOLPE CRÍTICO DEL ENEMIGO! El ${enemigo.nombre} impacta con salvajismo infligiendo ${danoBase} de daño letal.`);
      } else {
        emitirTextoFlotante('heroe', `-${danoBase}`, 'dano');
        agregarLog(`🩸 Ataque del ${enemigo.nombre} [${d20} + ${bonoFinalEnemigo} = ${totalAtaqueEnemigo} vs CA ${caHeroe}]: Acierta con ${enemigo.ataque_nombre || 'sus garras'} causando ${danoBase} de daño.`);
      }

      if (nuevoPv <= 0) {
        agregarLog(`💀 ¡Has caído en combate ante el ${enemigo.nombre}!`);
        setFase('DERROTA');
        return;
      }
    } else {
      // Bloqueo o esquiva del héroe
      sound.playBlock();
      setAnimBloqueoHeroe(true);
      setTimeout(() => setAnimBloqueoHeroe(false), 350);

      if (esPifia) {
        emitirTextoFlotante('heroe', '¡PIFIA ENEMIGA! 💨', 'esquiva');
        agregarLog(`🛡️ ¡Pifia del ${enemigo.nombre}! Su ataque choca torpemente contra las piedras del suelo.`);
      } else if (totalAtaqueEnemigo >= caHeroe - 2) {
        emitirTextoFlotante('heroe', '¡BLOQUEADO! 🛡️', 'bloqueo');
        agregarLog(`🛡️ Bloqueo [${totalAtaqueEnemigo} vs CA ${caHeroe}]: Tu escudo y armadura rechazan limpiamente el golpe del ${enemigo.nombre}. ¡Cero daño!`);
      } else {
        emitirTextoFlotante('heroe', '¡ESQUIVASTE! 💨', 'esquiva');
        agregarLog(`💨 Esquiva [${totalAtaqueEnemigo} vs CA ${caHeroe}]: Te mueves ágilmente y el asalto del ${enemigo.nombre} corta el aire en vano.`);
      }
    }

    setTurnoNumero(prev => prev + 1);
    setFase('TURNO_JUGADOR');
  };

  // -------------------------------------------------------------------
  // 6. HUIR DEL COMBATE (Instintos DES 11+)
  // -------------------------------------------------------------------
  const handleIntentarHuir = () => {
    if (fase !== 'TURNO_JUGADOR' || ejecutandoAccion) return;
    setEjecutandoAccion(true);
    sound.playSlash();

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + modDes;

    if (total >= 11) {
      emitirTextoFlotante('heroe', '¡HUIDA EXITOSA! 🏃', 'esquiva');
      agregarLog(`🏃 ¡Tirada de Huida exitosa (${d20} + ${modDes} = ${total} vs dif 11+)! Logras zafarte del combate.`);
      setTimeout(() => {
        if (onHuir) onHuir();
      }, 700);
    } else {
      emitirTextoFlotante('heroe', '¡TROPIEZO! ❌', 'fallo');
      agregarLog(`❌ Fallas al huir (${total} vs dif 11+). ¡Tropiezas y el enemigo aprovecha la oportunidad!`);
      setFase('TURNO_ENEMIGO');
      setTimeout(() => {
        ejecutarTurnoEnemigo();
        setEjecutandoAccion(false);
      }, 650);
    }
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

  // -------------------------------------------------------------------
  // ARSENAL TÁCTICO SEGÚN LA CLASE DEL JUGADOR
  // -------------------------------------------------------------------
  const obtenerAtaquesClase = () => {
    // MAGO / HECHICERO
    if (claseHeroe === 'hechicero') {
      return [
        {
          id: 'rayo_arcano',
          nombre: '⚡ Descarga Arcana',
          sub: 'Cantrip • 0 POD',
          desc: 'Rayo elemental a distancia (d20 + INT vs CA).',
          icono: '⚡',
          sonido: 'magia',
          costePod: 0,
          esMagia: true,
          modAtributo: modInt,
          bonoAtqExtra: 1,
          tipoColor: 'magia',
          danoCalculado: (crit) => {
            const roll = Math.floor(Math.random() * 8) + 1 + Math.max(0, modInt);
            return crit ? roll * 2 : roll;
          }
        },
        {
          id: 'proyectil_igneo',
          nombre: '🔥 Proyectil Ígneo',
          sub: 'Cantrip • 0 POD',
          desc: 'Esfera ígnea de alto impacto (1d10 + INT).',
          icono: '🔥',
          sonido: 'magia',
          costePod: 0,
          esMagia: true,
          modAtributo: modInt,
          tipoColor: 'dano',
          danoCalculado: (crit) => {
            const roll = Math.floor(Math.random() * 10) + 1 + Math.max(0, modInt);
            return crit ? roll * 2 : roll;
          }
        },
        {
          id: 'misil_magico',
          nombre: '✨ Misil Mágico',
          sub: '1 POD • Acierto Seguro',
          desc: '3 dardos ineludibles. ¡Ignora la CA enemiga!',
          icono: '✨',
          tipo: 'misil_magico',
          costePod: 1,
          estiloBoton: 'from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-purple-100 border-purple-400/40'
        },
        {
          id: 'rayo_escarcha',
          nombre: '❄️ Ráfaga Helada',
          sub: '1 POD • Ralentiza',
          desc: '2d6 daño y entorpece (-2 al ataque enemigo).',
          icono: '❄️',
          sonido: 'magia',
          costePod: 1,
          esMagia: true,
          modAtributo: modInt,
          bonoAtqExtra: 1,
          tipoColor: 'bloqueo',
          aplicaPenalizacionEnemigo: 2,
          danoCalculado: (crit) => {
            const roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2 + Math.max(0, modInt);
            return crit ? roll * 2 : roll;
          }
        },
        {
          id: 'escudo_arcano',
          nombre: '🛡️ Escudo Arcano',
          sub: '1 POD • Reacción',
          desc: 'Invoca una barrera que otorga +5 CA temporal.',
          icono: '🛡️',
          tipo: 'escudo_arcano',
          costePod: 1,
          estiloBoton: 'from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-blue-100 border-blue-400/40'
        }
      ];
    }

    // CLÉRIGO
    if (claseHeroe === 'clerigo') {
      return [
        {
          id: 'maza_sagrada',
          nombre: '🔨 Maza Bendita',
          sub: 'Ataque Físico/Radiante',
          desc: 'Golpe contundente con bono sagrado (1d6 + FUE + 2).',
          icono: '🔨',
          sonido: 'corte',
          modAtributo: modFue,
          bonoAtqExtra: 1,
          danoCalculado: (crit) => {
            const roll = Math.floor(Math.random() * 6) + 1 + Math.max(0, modFue) + 2;
            return crit ? roll * 2 : roll;
          }
        },
        {
          id: 'llama_sagrada',
          nombre: '☀️ Llama Sagrada',
          sub: 'Cantrip Divino • 0 POD',
          desc: 'Fuego purificador del cielo (1d8 + SAB).',
          icono: '☀️',
          sonido: 'magia',
          costePod: 0,
          esMagia: true,
          modAtributo: modSab,
          tipoColor: 'critico',
          danoCalculado: (crit) => {
            const roll = Math.floor(Math.random() * 8) + 1 + Math.max(0, modSab);
            return crit ? roll * 2 : roll;
          }
        },
        {
          id: 'palabra_curacion',
          nombre: '💖 Sanación Divina',
          sub: '1 POD • Milagro',
          desc: 'Restaura vida inmediatamente (1d8 + SAB + 2 PV).',
          icono: '💖',
          tipo: 'palabra_curacion',
          costePod: 1,
          estiloBoton: 'from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-emerald-100 border-emerald-400/40'
        },
        {
          id: 'escudo_fe',
          nombre: '🛡️ Escudo de Fe',
          sub: '1 POD • Protección',
          desc: 'Aura protectora bendita (+4 CA temporal).',
          icono: '🛡️',
          tipo: 'escudo_arcano',
          costePod: 1,
          estiloBoton: 'from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-amber-100 border-amber-400/40'
        }
      ];
    }

    // PÍCARO / BRIBÓN
    if (claseHeroe === 'bribon' || claseHeroe === 'picaro') {
      return [
        {
          id: 'punalada_furtiva',
          nombre: '🗡️ Puñalada Furtiva',
          sub: 'Precisión Letal',
          desc: 'Apunta a puntos vitales (+2 al ataque y +1d6 extra).',
          icono: '🗡️',
          sonido: 'corte',
          modAtributo: modDes,
          bonoAtqExtra: 2,
          tipoColor: 'critico',
          danoCalculado: (crit) => {
            const base = Math.floor(Math.random() * 6) + 1 + Math.max(0, modDes);
            const furtivo = Math.floor(Math.random() * 6) + 1;
            return crit ? (base + furtivo) * 2 : (base + furtivo);
          }
        },
        {
          id: 'daga_arrojadiza',
          nombre: '🎯 Daga Arrojadiza',
          sub: 'Distancia Rápida',
          desc: 'Lanzamiento certero a distancia con Destreza.',
          icono: '🎯',
          sonido: 'corte',
          modAtributo: modDes,
          bonoAtqExtra: 1,
          danoCalculado: (crit) => {
            const base = Math.floor(Math.random() * 4) + 1 + Math.max(0, modDes);
            return crit ? base * 2 : base;
          }
        },
        {
          id: 'bomba_humo',
          nombre: '💨 Bomba de Humo',
          sub: bombaHumoUsada ? 'Agotada en combate' : 'Táctica Evasiva',
          desc: 'El próximo ataque enemigo fallará automáticamente.',
          icono: '💨',
          tipo: 'bomba_humo',
          disabled: bombaHumoUsada,
          estiloBoton: 'from-stone-700 to-stone-600 hover:from-stone-600 hover:to-stone-500 text-stone-100 border-stone-400/40'
        }
      ];
    }

    // GUERRERO / PALADÍN (Default marcial)
    return [
      {
        id: 'tajo_rapido',
        nombre: '⚔️ Tajo Rápido',
        sub: '+2 Ataque vs CA',
        desc: 'Golpe veloz balanceado para penetrar armaduras.',
        icono: '⚔️',
        sonido: 'corte',
        modAtributo: modFue,
        bonoAtqExtra: 2,
        danoCalculado: (crit) => {
          const base = Math.floor(Math.random() * 6) + 1 + Math.max(0, modFue);
          return crit ? base * 2 : base;
        }
      },
      {
        id: 'golpe_demoledor',
        nombre: '💥 Golpe Demoledor',
        sub: '-2 Ataque • Daño x2',
        desc: 'Ataque pesado: más difícil de conectar, pero brutal.',
        icono: '💥',
        sonido: 'corte',
        modAtributo: modFue,
        bonoAtqExtra: -2,
        tipoColor: 'critico',
        danoCalculado: (crit) => {
          const base = Math.floor(Math.random() * 10) + 1 + Math.max(0, modFue) + 4;
          return crit ? base * 2 : base;
        }
      },
      {
        id: 'embestida_escudo',
        nombre: '🛡️ Embestida de Escudo',
        sub: '+3 DEF Temporal',
        desc: 'Impacto contundente con el broquel que afianza tu defensa.',
        icono: '🛡️',
        sonido: 'corte',
        modAtributo: modFue,
        bonoAtqExtra: 1,
        bonoDanoExtra: 1,
        danoCalculado: (crit) => {
          const base = Math.floor(Math.random() * 4) + 1 + Math.max(0, modFue);
          return crit ? base * 2 : base;
        }
      },
      {
        id: 'segundo_aliento',
        nombre: '🩹 Segundo Aliento',
        sub: segundoAlientoUsado ? 'Usado en combate' : 'Recupera PV',
        desc: 'Restaura vida marcial sin gastar pociones (1 uso).',
        icono: '🩹',
        tipo: 'segundo_aliento',
        disabled: segundoAlientoUsado,
        estiloBoton: 'from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-amber-100 border-amber-400/40'
      }
    ];
  };

  const listaAtaques = obtenerAtaquesClase();

  return (
    <div className={`fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in zoom-in-95 duration-150 ${
      screenShake ? 'animate-combat-shake' : ''
    }`}>
      {/* ESTILOS DE ANIMACIÓN COMBATE */}
      <style>{`
        @keyframes combatFloat {
          0% { opacity: 0; transform: translate(-50%, 15px) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -10px) scale(1.15); }
          75% { opacity: 1; transform: translate(-50%, -28px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -45px) scale(0.9); }
        }
        @keyframes combatShake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-6px, 4px); }
          40% { transform: translate(6px, -4px); }
          60% { transform: translate(-4px, 2px); }
          80% { transform: translate(4px, -2px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes shieldPulse {
          0% { box-shadow: 0 0 0 rgba(56, 189, 248, 0); }
          50% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.7); }
          100% { box-shadow: 0 0 0 rgba(56, 189, 248, 0); }
        }
        .animate-combat-float {
          animation: combatFloat 1.1s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
        }
        .animate-combat-shake {
          animation: combatShake 0.28s ease-in-out;
        }
        .animate-shield-pulse {
          animation: shieldPulse 0.45s ease-out;
        }
      `}</style>

      <div className="bg-stone-950 border border-stone-800 max-w-4xl w-full rounded-3xl p-4 sm:p-6 shadow-2xl text-stone-200 relative overflow-hidden flex flex-col max-h-[94vh]">
        {/* ENCABEZADO SUPERIOR TÁCTICO */}
        <div className="flex justify-between items-center pb-3 border-b border-stone-800/80 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                Combate Táctico por Turnos
                <span className="text-[10px] text-stone-400 font-mono font-normal">
                  (Ronda {turnoNumero})
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                Tiradas automáticas bajo cuerda contra Clase de Armadura (CA/DEF).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
              fase === 'TURNO_JUGADOR'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse'
                : fase === 'TURNO_ENEMIGO'
                ? 'bg-red-950/80 text-red-300 border-red-500/60'
                : 'bg-stone-900 text-stone-300 border-stone-800'
            }`}>
              {fase === 'TURNO_JUGADOR' && '🟢 Tu Turno'}
              {fase === 'TURNO_ENEMIGO' && '🔴 Turno Rival'}
              {fase === 'INICIATIVA' && '🎲 Iniciativa'}
              {fase === 'VICTORIA' && '🏆 Victoria'}
              {fase === 'DERROTA' && '💀 Derrota'}
            </div>
          </div>
        </div>

        {/* ARENA DE DUELO: HÉROE VS MONSTRUO CON FCT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch mb-3">
          {/* TARJETA DEL HÉROE (5 cols) */}
          <div className={`md:col-span-5 bg-stone-900/95 border rounded-2xl p-3.5 transition-all duration-150 relative ${
            fase === 'TURNO_JUGADOR'
              ? 'border-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
              : 'border-stone-800/80 opacity-90'
          } ${animImpactoHeroe ? 'bg-red-950/60 border-red-500 scale-[0.98]' : ''} ${
            animBloqueoHeroe ? 'animate-shield-pulse border-cyan-400 bg-cyan-950/40' : ''
          }`}>
            {/* FLOATING COMBAT TEXT OVER HERO */}
            {floatingTexts.filter(ft => ft.target === 'heroe').map(ft => (
              <div
                key={ft.id}
                className={`absolute pointer-events-none z-30 font-black text-sm sm:text-base animate-combat-float ${
                  ft.tipo === 'critico'
                    ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)] text-lg scale-110'
                    : ft.tipo === 'dano'
                    ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                    : ft.tipo === 'bloqueo'
                    ? 'text-cyan-300 bg-cyan-950/90 border border-cyan-400/60 px-2 py-0.5 rounded-lg shadow-lg'
                    : ft.tipo === 'esquiva'
                    ? 'text-emerald-300 bg-emerald-950/90 border border-emerald-400/60 px-2 py-0.5 rounded-lg shadow-lg'
                    : ft.tipo === 'cura'
                    ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)] text-base'
                    : 'text-amber-200 bg-amber-950/90 border border-amber-400/60 px-2 py-0.5 rounded-lg'
                }`}
                style={{ top: '25%', left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                {ft.texto}
              </div>
            ))}

            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-13 h-13 sm:w-14 sm:h-14 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 relative">
                <img
                  src={spriteHeroe}
                  alt={heroeSeguro.nombre}
                  className="w-10 h-10 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => { e.target.src = '/assets/crawler/heroes/knight_m_idle_anim_f0.png'; }}
                />
                {defensaHeroeTemporal > 0 && (
                  <span className="absolute bottom-0 right-0 bg-blue-600 text-[9px] font-black px-1 rounded text-white">
                    +{defensaHeroeTemporal}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-amber-200 truncate">{heroeSeguro.nombre}</h4>
                  <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                    Nvl {heroeSeguro.nivel || 1}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 capitalize">
                  {heroeSeguro.raza || 'Humano'} {claseHeroe}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-300 font-bold">
                  <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800 text-cyan-300 flex items-center gap-1">
                    🛡️ CA: <strong>{caHeroeTotal}</strong>
                  </span>
                  <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800 text-amber-300">
                    🗡️ ATQ: +{modFue + bonoAtqClase}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de PV Héroe */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-red-400 flex items-center gap-1">❤️ Puntos de Vida</span>
                <span className="font-mono">{pvHeroe} / {maxPvHeroe}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (pvHeroe / maxPvHeroe) * 100)}%` }}
                />
              </div>
            </div>

            {/* Barra de POD (Puntos de Poder si la clase usa magia) */}
            {(claseHeroe === 'hechicero' || claseHeroe === 'clerigo' || maxPodHeroe > 0) && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-purple-400 flex items-center gap-1">✨ Puntos de Poder (POD)</span>
                  <span className="font-mono text-purple-300">{podHeroe} / {maxPodHeroe}</span>
                </div>
                <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 transition-all duration-200"
                    style={{ width: `${maxPodHeroe > 0 ? Math.max(0, (podHeroe / maxPodHeroe) * 100) : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* INDICADOR CENTRAL VS / ESTADO TÁCTICO (2 cols) */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-2 text-center bg-stone-950/60 border border-stone-800/80 rounded-2xl min-h-[90px]">
            <div className="text-xl font-black text-amber-400 tracking-widest mb-1">
              VS
            </div>

            {ultimaAccion ? (
              <div className="text-[10px] font-mono text-stone-300 bg-stone-900 border border-stone-800 p-1.5 rounded-lg w-full">
                {ultimaAccion.autoAcierto ? (
                  <div className="text-purple-300 font-bold">
                    ✨ Ineludible ({ultimaAccion.dano} DMG)
                  </div>
                ) : ultimaAccion.total !== undefined ? (
                  <div>
                    <span className={ultimaAccion.impacto ? 'text-emerald-400 font-bold' : 'text-stone-400'}>
                      {ultimaAccion.impacto ? '🎯 Impacto' : '🛡️ Fallo'}
                    </span>
                    <div className="text-[9px] text-stone-400">
                      Tirada: {ultimaAccion.d20} + {ultimaAccion.bono} = <strong className="text-stone-200">{ultimaAccion.total}</strong> vs CA {ultimaAccion.caObjetivo}
                    </div>
                  </div>
                ) : (
                  <div className="text-stone-400 text-[10px]">
                    {ultimaAccion.buff || ultimaAccion.nombre}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-stone-500 font-bold uppercase">
                Duelo OSR
              </span>
            )}
          </div>

          {/* TARJETA DEL MONSTRUO (5 cols) */}
          <div className={`md:col-span-5 bg-stone-900/95 border rounded-2xl p-3.5 transition-all duration-150 relative ${
            fase === 'TURNO_ENEMIGO'
              ? 'border-red-500/80 shadow-[0_0_18px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50'
              : 'border-stone-800/80 opacity-90'
          } ${animImpactoEnemigo ? 'bg-red-950/60 border-red-500 scale-[0.98]' : ''} ${
            animBloqueoEnemigo ? 'animate-shield-pulse border-cyan-400 bg-cyan-950/40' : ''
          }`}>
            {/* FLOATING COMBAT TEXT OVER ENEMY */}
            {floatingTexts.filter(ft => ft.target === 'enemigo').map(ft => (
              <div
                key={ft.id}
                className={`absolute pointer-events-none z-30 font-black text-sm sm:text-base animate-combat-float ${
                  ft.tipo === 'critico'
                    ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)] text-lg scale-110'
                    : ft.tipo === 'dano'
                    ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                    : ft.tipo === 'magia'
                    ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)] text-base'
                    : ft.tipo === 'bloqueo'
                    ? 'text-cyan-300 bg-cyan-950/90 border border-cyan-400/60 px-2 py-0.5 rounded-lg shadow-lg'
                    : ft.tipo === 'esquiva'
                    ? 'text-emerald-300 bg-emerald-950/90 border border-emerald-400/60 px-2 py-0.5 rounded-lg shadow-lg'
                    : 'text-stone-300 bg-stone-900/90 border border-stone-700 px-2 py-0.5 rounded-lg'
                }`}
                style={{ top: '25%', left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                {ft.texto}
              </div>
            ))}

            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-13 h-13 sm:w-14 sm:h-14 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                <img
                  src={spriteEnemigo}
                  alt={enemigo.nombre}
                  className="w-10 h-10 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => { e.target.src = '/assets/crawler/enemies/skelet_idle_anim_f0.png'; }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-red-300 truncate">
                    {enemigo.esJefe && '👑 '} {enemigo.nombre}
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                    Nvl {enemigo.nivel || 1}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 capitalize">
                  {enemigo.tipo || 'Monstruo de Cripta'}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-300 font-bold">
                  <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800 text-cyan-300 flex items-center gap-1">
                    🛡️ CA: <strong>{caEnemigo}</strong>
                  </span>
                  <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800 text-rose-300">
                    💥 Daño: ~{enemigo.dano_medio || enemigo.dano || 3}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de PV Enemigo */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-red-400 flex items-center gap-1">❤️ Salud del Monstruo</span>
                <span className="font-mono">{pvEnemigo} / {maxPvEnemigo}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-700 transition-all duration-200"
                  style={{ width: `${Math.max(0, (pvEnemigo / maxPvEnemigo) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BITÁCORA DE COMBATE ÁGIL CON SCROLL */}
        <div
          ref={logRef}
          className="flex-1 bg-stone-950/90 border border-stone-800/80 rounded-2xl p-2.5 sm:p-3 text-[11px] font-mono space-y-1 overflow-y-auto mb-3 min-h-[75px] max-h-[110px] shadow-inner"
        >
          {log.map((linea, idx) => (
            <div key={idx} className="text-stone-300 leading-snug">
              {linea}
            </div>
          ))}
        </div>

        {/* PANEL DE ACCIONES TÁCTICAS DEL JUGADOR */}
        <div className="border-t border-stone-800/90 pt-2.5">
          {fase === 'INICIATIVA' && (
            <button
              onClick={ejecutarIniciativa}
              disabled={ejecutandoAccion}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span className="text-base">🎲</span>
              <span>Comenzar Asalto (Iniciativa Automática con DES)</span>
            </button>
          )}

          {fase === 'TURNO_JUGADOR' && (
            <div className="space-y-2">
              {/* ACCIONES Y CONJUROS SEGÚN LA CLASE */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {listaAtaques.map((atq) => {
                  const sinPod = atq.costePod && podHeroe < atq.costePod;
                  const bloqueado = atq.disabled || sinPod || ejecutandoAccion;

                  return (
                    <button
                      key={atq.id}
                      onClick={() => ejecutarAccionJugador(atq)}
                      disabled={bloqueado}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between relative overflow-hidden group ${
                        bloqueado
                          ? 'bg-stone-900/60 border-stone-800/60 text-stone-600 cursor-not-allowed opacity-60'
                          : atq.estiloBoton
                          ? `bg-gradient-to-br ${atq.estiloBoton} shadow-md active:scale-[0.98]`
                          : 'bg-stone-900 hover:bg-stone-800/90 border-stone-700/80 hover:border-amber-500/50 text-stone-100 shadow active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-black truncate">{atq.nombre}</span>
                        {atq.costePod > 0 && (
                          <span className="text-[10px] bg-purple-950 text-purple-300 font-bold px-1 rounded border border-purple-800 flex-shrink-0">
                            {atq.costePod} POD
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-stone-400 group-hover:text-stone-300">
                        <span className="truncate">{atq.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* UTILIDADES COMUNES (DEFENSA, POCIÓN, HUIR) */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800/50">
                <button
                  onClick={handleDefenderse}
                  disabled={ejecutandoAccion}
                  className="py-2.5 px-2 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 border border-stone-700 active:scale-[0.98]"
                >
                  <span>🛡️</span>
                  <span className="truncate">Guardia (+2 DEF)</span>
                </button>

                <button
                  onClick={handleBeberPocion}
                  disabled={pociones <= 0 || ejecutandoAccion}
                  className={`py-2.5 px-2 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 border active:scale-[0.98] ${
                    pociones > 0
                      ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-600/50 text-emerald-200'
                      : 'bg-stone-900/60 border-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <span>🧪</span>
                  <span className="truncate">Poción ({pociones})</span>
                </button>

                <button
                  onClick={handleIntentarHuir}
                  disabled={ejecutandoAccion}
                  className="py-2.5 px-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 border border-stone-800 active:scale-[0.98]"
                >
                  <span>🏃</span>
                  <span className="truncate">Huir (Instintos)</span>
                </button>
              </div>
            </div>
          )}

          {fase === 'TURNO_ENEMIGO' && (
            <div className="w-full py-3 bg-red-950/40 border border-red-500/40 rounded-2xl text-center text-xs text-red-300 font-bold flex items-center justify-center gap-2 animate-pulse">
              <span>⚠️</span>
              <span>El {enemigo.nombre} prepara su zarpazo...</span>
            </div>
          )}

          {fase === 'VICTORIA' && (
            <div className="bg-emerald-950/50 border border-emerald-500/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                  🎉 ¡Victoria Gloriosa!
                </h4>
                <p className="text-xs text-stone-300 mt-0.5">
                  Recompensa: <strong>+{enemigo.oro_recompensa || enemigo.oro || 5} MO</strong> y <strong>+{enemigo.xp_recompensa || enemigo.xp || 15} PX</strong>.
                </p>
              </div>
              <button
                onClick={handleCerrarVictoria}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black uppercase text-xs rounded-xl shadow-lg transition active:scale-[0.98]"
              >
                Continuar Exploración
              </button>
            </div>
          )}

          {fase === 'DERROTA' && (
            <div className="bg-red-950/50 border border-red-500/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-red-300 uppercase tracking-wide flex items-center gap-1.5">
                  💀 Has Caído en Combate
                </h4>
                <p className="text-xs text-stone-300 mt-0.5">
                  El Ángel Guardián Martín te aguarda en las puertas del juicio.
                </p>
              </div>
              <button
                onClick={handleCerrarDerrota}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs rounded-xl shadow-lg transition active:scale-[0.98]"
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
