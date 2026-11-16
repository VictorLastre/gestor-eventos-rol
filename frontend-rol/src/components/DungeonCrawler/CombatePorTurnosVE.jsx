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
import { escalarMonstruoSegunNivel } from './DungeonGenerator';


// =====================================================================
// GENERADOR DE BOTÍN (LOOT) OFICIAL VIEJA ESCUELA
// =====================================================================
export function generarBotinEncuentro(listaMonstruos, nivelGrupo = 1) {
  const oroBase = listaMonstruos.reduce((acc, m) => acc + (m.oro || m.oro_recompensa || Math.floor(Math.random() * 5) + 3), 0);
  const plataBase = Math.floor(Math.random() * 10) + 5;
  const xpTotal = listaMonstruos.reduce((acc, m) => acc + (m.xp || m.xp_recompensa || 15), 0);
  const items = [];

  // Probabilidad de 0.00000001 de equipo legendario (1 en 100 millones)
  const rollLegendario = Math.random();
  if (rollLegendario < 0.00000001) {
    items.push({
      id: 'legendario_arma_' + Date.now(),
      nombre: '⭐ Hoja Solar Ancestral (LEGENDARIA)',
      tipo: 'Arma',
      icono: '⚔️',
      dado: '2d10',
      danoMedio: 11,
      desc: '¡GOTA LEGENDARIA! Forjada con luz pura (2d10 de daño ígneo).',
      valorMo: 500,
      rareza: 'legendaria'
    });
  } else if (rollLegendario < 0.00000002) {
    items.push({
      id: 'legendario_armadura_' + Date.now(),
      nombre: '⭐ Cota de Malla Astral (LEGENDARIA)',
      tipo: 'Armadura',
      icono: '🛡️',
      defBono: 7,
      desc: '¡GOTA LEGENDARIA! Cota tejida con hilos de estrellas (+7 a la DEF).',
      valorMo: 500,
      rareza: 'legendaria'
    });
  }

  // Tirar botín por cada monstruo vencido (45% chance de soltar objeto en vez de solo monedas)
  listaMonstruos.forEach((mon) => {
    const roll = Math.random();
    if (roll < 0.45) {
      const subRoll = Math.random();
      if (subRoll < 0.35) {
        items.push({
          id: 'pocion_curacion_' + Math.random().toString(36).substr(2, 6),
          nombre: 'Poción de Curación VE',
          tipo: 'Consumible',
          icono: '🧪',
          efecto: 'curar_6',
          desc: 'Restaura +6 PV al consumirse.',
          valorMo: 25,
          cantidad: 1
        });
      } else if (subRoll < 0.50) {
        items.push({
          id: 'pocion_pod_' + Math.random().toString(36).substr(2, 6),
          nombre: 'Poción de Concentración (POD)',
          tipo: 'Consumible',
          icono: '🔮',
          efecto: 'pod_3',
          desc: 'Restaura +3 Puntos de Poder.',
          valorMo: 30,
          cantidad: 1
        });
      } else if (subRoll < 0.70) {
        const trofeos = [
          { nombre: 'Gema de Cuarzo Rúnico', desc: 'Cristal brillante de la cripta.', valorMo: 15, icono: '💎' },
          { nombre: 'Colmillo Afilado de Bestia', desc: 'Trofeo vendible a los forjadores.', valorMo: 8, icono: '🦷' },
          { nombre: 'Fragmento de Ágata Antigua', desc: 'Piedra semipreciosa intacta.', valorMo: 20, icono: '💎' },
          { nombre: 'Retal de Cota Herrumbrada', desc: 'Restos de metal de aventureros caídos.', valorMo: 6, icono: '🛡️' }
        ];
        const t = trofeos[Math.floor(Math.random() * trofeos.length)];
        items.push({
          id: 'trofeo_' + Math.random().toString(36).substr(2, 6),
          nombre: t.nombre,
          tipo: 'Valioso',
          icono: t.icono,
          desc: t.desc,
          valorMo: t.valorMo,
          cantidad: 1
        });
      } else if (subRoll < 0.85) {
        const armasDrop = [
          { nombre: 'Daga Mellada de Goblin', dado: '1d4', danoMedio: 2, valorMo: 3, icono: '🗡️' },
          { nombre: 'Hacha de Mano de Esqueleto', dado: '1d6', danoMedio: 3, valorMo: 5, icono: '🪓' },
          { nombre: 'Maza de Hueso Tallada', dado: '1d6', danoMedio: 3, valorMo: 6, icono: '🔨' }
        ];
        const a = armasDrop[Math.floor(Math.random() * armasDrop.length)];
        items.push({
          id: 'arma_drop_' + Math.random().toString(36).substr(2, 6),
          nombre: a.nombre,
          tipo: 'Arma',
          icono: a.icono,
          dado: a.dado,
          danoMedio: a.danoMedio,
          desc: `Arma capturada en combate (${a.dado} daño).`,
          valorMo: a.valorMo,
          cantidad: 1
        });
      } else {
        items.push({
          id: 'pergamino_mapa_' + Math.random().toString(36).substr(2, 6),
          nombre: 'Pergamino de Revelación de Sector',
          tipo: 'Consumible',
          icono: '📜',
          efecto: 'revelar_mapa',
          desc: 'Pergamino que desvela habitaciones en la cripta.',
          valorMo: 20,
          cantidad: 1
        });
      }
    }
  });

  return {
    oro: oroBase,
    plata: plataBase,
    xp: xpTotal,
    items
  };
}

export default function CombatePorTurnosVE({
  enemigo,
  enemigos,
  personaje,
  party = [],
  onFinalizarCombate,
  onHuir
}) {
  // Garantizar objeto de personaje valido con Vieja Escuela
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
  const nivelPromedioGrupo = Math.max(
    1,
    party.length > 0
      ? Math.round(party.reduce((acc, p) => acc + (p.nivel || 1), 0) / party.length)
      : (heroeSeguro.nivel || 1)
  );

  // Normalizar lista de enemigos en la sala (escalados segun nivel del grupo)
  const listaInicialEnemigos = (() => {
    let crudos = [];
    if (Array.isArray(enemigos) && enemigos.length > 0) {
      crudos = enemigos;
    } else if (enemigo) {
      crudos = Array.isArray(enemigo) ? enemigo : [enemigo];
    } else {
      crudos = [{ nombre: 'Esqueleto Guardián', hp: 8, maxHp: 8, defensa: 11, atqBono: 1, dano: 3 }];
    }

    return crudos.map((m, idx) => {
      const escalado = escalarMonstruoSegunNivel(m, nivelPromedioGrupo);
      return {
        ...escalado,
        idCombate: m.id || `enemigo_${idx}_${Date.now()}`,
        nombreUnico: crudos.length > 1 ? `${escalado.nombre} #${idx + 1}` : escalado.nombre,
        pvMaximo: escalado.maxHp || escalado.hp || 8,
        pvActual: escalado.hp || escalado.maxHp || 8,
        derrotado: false,
        originalRef: m
      };
    });
  })();

  const [listaEnemigos, setListaEnemigos] = useState(listaInicialEnemigos);
  const [enemigoObjetivoId, setEnemigoObjetivoId] = useState(listaInicialEnemigos[0]?.idCombate);

  // Estados del combate
  const [fase, setFase] = useState('INICIATIVA'); // 'INICIATIVA', 'TURNO_JUGADOR', 'TURNO_ENEMIGO', 'TURNO_COMPANERO', 'VICTORIA', 'DERROTA'
  const [pvHeroe, setPvHeroe] = useState(heroeSeguro.pvActual || statsHeroe.pv || 16);
  const [maxPvHeroe] = useState(statsHeroe.pv || 16);
  const [podHeroe, setPodHeroe] = useState(heroeSeguro.podActual !== undefined ? heroeSeguro.podActual : (statsHeroe.pod || 0));
  const [maxPodHeroe] = useState(statsHeroe.pod || (claseHeroe === 'hechicero' || claseHeroe === 'clerigo' ? 5 : 0));
  const [pociones, setPociones] = useState(2);

  // Modificadores temporales y estado tactico
  const [defensaHeroeTemporal, setDefensaHeroeTemporal] = useState(0);
  const [bombaHumoActiva, setBombaHumoActiva] = useState(false);
  const [penalizacionesEnemigos, setPenalizacionesEnemigos] = useState({});
  const [segundoAlientoUsado, setSegundoAlientoUsado] = useState(false);
  const [bombaHumoUsada, setBombaHumoUsada] = useState(false);
  const [turnoNumero, setTurnoNumero] = useState(1);
  const [botinGenerado, setBotinGenerado] = useState(null);

  // Sistema de Iniciativa Grupal (heroes + monstruos)
  const [ordenIniciativa, setOrdenIniciativa] = useState([]);
  const [indiceTurnoActual, setIndiceTurnoActual] = useState(0);

  // Sistema de retroalimentacion visual y textos flotantes
  const [screenShake, setScreenShake] = useState(false);
  const [animImpactoHeroe, setAnimImpactoHeroe] = useState(false);
  const [animBloqueoHeroe, setAnimBloqueoHeroe] = useState(false);
  const [impactosEnemigos, setImpactosEnemigos] = useState({});
  const [bloqueosEnemigos, setBloqueosEnemigos] = useState({});
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [ultimaAccion, setUltimaAccion] = useState(null);
  const [ejecutandoAccion, setEjecutandoAccion] = useState(false);

  // Historial / Bitacora de combate
  const [log, setLog] = useState([
    `⚔️ ¡Encuentro en la sala! ${listaInicialEnemigos.length} criatura(s) bloquean el paso. Prepara tu estrategia.`
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
  const emitirTextoFlotante = (targetId, texto, tipo = 'dano') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, targetId, texto, tipo }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1150);
  };

  const vibrarPantalla = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 280);
  };

  // Sprite del heroe
  const spriteHeroe = (() => {
    const gen = heroeSeguro.genero || 'm';
    const base = claseHeroe === 'guerrero' ? 'knight' : (claseHeroe === 'hechicero' ? 'wizzard' : 'elf');
    return `/assets/crawler/heroes/${base}_${gen}_idle_anim_f0.png`;
  })();

  // Modificadores de atributo del heroe
  const modFue = getModificador(heroeSeguro.atributos?.fue || 10);
  const modDes = getModificador(heroeSeguro.atributos?.des || 10);
  const modInt = getModificador(heroeSeguro.atributos?.int || 10);
  const modSab = getModificador(heroeSeguro.atributos?.sab || 10);
  const bonoAtqClase = statsHeroe.atqBono || 0;
  const caHeroeTotal = (statsHeroe.def || 12) + defensaHeroeTemporal;

  // Obtener enemigo objetivo actual
  const enemigoObjetivo = listaEnemigos.find(e => e.idCombate === enemigoObjetivoId && !e.derrotado)
    || listaEnemigos.find(e => !e.derrotado)
    || listaEnemigos[0];

  // Actualizar objetivo si el actual murio
  useEffect(() => {
    if (enemigoObjetivo && enemigoObjetivo.idCombate !== enemigoObjetivoId) {
      setEnemigoObjetivoId(enemigoObjetivo.idCombate);
    }
  }, [listaEnemigos, enemigoObjetivoId]);

  // -------------------------------------------------------------------
  // 1. FASE DE INICIATIVA GRUPAL (Todos los heroes y monstruos tiran d20)
  // -------------------------------------------------------------------
  const ejecutarIniciativa = () => {
    if (ejecutandoAccion) return;
    setEjecutandoAccion(true);
    sound.playSlash();

    const turnos = [];

    // Tirada del heroe principal
    const d20Heroe = Math.floor(Math.random() * 20) + 1;
    const totalHeroe = d20Heroe + modDes;
    turnos.push({
      id: 'heroe_principal',
      nombre: heroeSeguro.nombre,
      esHeroe: true,
      esJugadorPrincipal: true,
      d20: d20Heroe,
      mod: modDes,
      iniciativa: totalHeroe
    });

    // Tirada de companeros en la party (si hay)
    party.forEach((comp, idx) => {
      if (comp.id !== heroeSeguro.id && comp.usuarioId !== heroeSeguro.usuarioId) {
        const d20C = Math.floor(Math.random() * 20) + 1;
        const modC = comp.clase === 'bribon' ? 2 : 1;
        turnos.push({
          id: `companero_${idx}`,
          nombre: comp.nombre,
          esHeroe: true,
          esCompanero: true,
          companeroData: comp,
          d20: d20C,
          mod: modC,
          iniciativa: d20C + modC
        });
      }
    });

    // Tiradas de cada monstruo en la sala
    listaEnemigos.forEach((enem) => {
      const d20M = Math.floor(Math.random() * 20) + 1;
      const bonoM = enem.atqBono !== undefined ? enem.atqBono : (enem.nivel || 1);
      turnos.push({
        id: enem.idCombate,
        nombre: enem.nombreUnico || enem.nombre,
        esHeroe: false,
        enemigoRef: enem,
        d20: d20M,
        mod: bonoM,
        iniciativa: d20M + bonoM
      });
    });

    // Ordenar de mayor a menor iniciativa
    turnos.sort((a, b) => b.iniciativa - a.iniciativa);
    setOrdenIniciativa(turnos);
    setIndiceTurnoActual(0);

    const primero = turnos[0];
    agregarLog(`🎲 ¡Tiradas de Iniciativa! ${turnos.map(t => `${t.nombre}: ${t.iniciativa}`).join(' | ')}.`);

    if (primero.esJugadorPrincipal) {
      emitirTextoFlotante('heroe_principal', '¡PRIMERO!', 'buff');
      agregarLog(`🟢 ¡Tienes la iniciativa máxima (${primero.iniciativa})! Es tu turno.`);
      setFase('TURNO_JUGADOR');
      setEjecutandoAccion(false);
    } else if (primero.esHeroe) {
      agregarLog(`🛡️ Tu aliado ${primero.nombre} toma la delantera (${primero.iniciativa}).`);
      setFase('TURNO_COMPANERO');
      setTimeout(() => procesarTurnoCompanero(primero, turnos, 0), 650);
    } else {
      emitirTextoFlotante(primero.id, '¡PRIMERO!', 'buff');
      agregarLog(`⚠️ ¡${primero.nombre} reacciona con rapidez salvaje (${primero.iniciativa}) y asalta primero!`);
      setFase('TURNO_ENEMIGO');
      setTimeout(() => procesarTurnoEnemigo(primero, turnos, 0), 650);
    }
  };

  // -------------------------------------------------------------------
  // AVANZAR AL SIGUIENTE COMBATIENTE EN EL ORDEN DE INICIATIVA
  // -------------------------------------------------------------------
  const pasarSiguienteTurno = (turnosActuales, indiceActual) => {
    // Verificar si todos los monstruos murieron
    const quedanEnemigosVivos = listaEnemigos.some(e => !e.derrotado && e.pvActual > 0);
    if (!quedanEnemigosVivos) {
      sound.playLevelUp();
      agregarLog(`🏆 ¡Todos los monstruos de la sala han sido derrotados!`);
      if (!botinGenerado) {
        setBotinGenerado(generarBotinEncuentro(listaEnemigos, heroeSeguro.nivel || 1));
      }
      setFase('VICTORIA');
      setEjecutandoAccion(false);
      return;
    }

    // Verificar si el heroe murio
    if (pvHeroe <= 0) {
      setFase('DERROTA');
      setEjecutandoAccion(false);
      return;
    }

    const proxIndice = (indiceActual + 1) % turnosActuales.length;
    if (proxIndice === 0) {
      setTurnoNumero(prev => prev + 1);
    }
    setIndiceTurnoActual(proxIndice);

    const siguiente = turnosActuales[proxIndice];

    // Si el siguiente es un enemigo ya muerto, saltarlo
    if (!siguiente.esHeroe) {
      const monVivo = listaEnemigos.find(e => e.idCombate === siguiente.id && !e.derrotado);
      if (!monVivo) {
        pasarSiguienteTurno(turnosActuales, proxIndice);
        return;
      }
    }

    if (siguiente.esJugadorPrincipal) {
      setFase('TURNO_JUGADOR');
      setEjecutandoAccion(false);
    } else if (siguiente.esHeroe) {
      setFase('TURNO_COMPANERO');
      setTimeout(() => procesarTurnoCompanero(siguiente, turnosActuales, proxIndice), 600);
    } else {
      setFase('TURNO_ENEMIGO');
      setTimeout(() => procesarTurnoEnemigo(siguiente, turnosActuales, proxIndice), 600);
    }
  };

  // -------------------------------------------------------------------
  // 2. ACCIONES DEL JUGADOR PRINCIPAL
  // -------------------------------------------------------------------
  const ejecutarAccionJugador = (config) => {
    if (fase !== 'TURNO_JUGADOR' || ejecutandoAccion || !enemigoObjetivo) return;
    setEjecutandoAccion(true);

    if (config.costePod && podHeroe < config.costePod) {
      agregarLog(`⚠️ No tienes suficientes Puntos de Poder (${podHeroe}/${config.costePod} POD).`);
      setEjecutandoAccion(false);
      return;
    }

    if (config.costePod) {
      setPodHeroe(prev => Math.max(0, prev - config.costePod));
    }

    // ACCION: MISIL MAGICO (Auto-acierto certero)
    if (config.tipo === 'misil_magico') {
      sound.playMagic();
      vibrarPantalla();

      const d1 = Math.floor(Math.random() * 4) + 2;
      const d2 = Math.floor(Math.random() * 4) + 2;
      const d3 = Math.floor(Math.random() * 4) + 2;
      const danoTotal = d1 + d2 + d3;

      aplicarDanoAEnemigo(enemigoObjetivo.idCombate, danoTotal, true, 'Misil Mágico', 'magia');

      setUltimaAccion({
        nombre: 'Misil Mágico',
        impacto: true,
        autoAcierto: true,
        dano: danoTotal,
        objetivo: enemigoObjetivo.nombreUnico
      });

      setTimeout(() => {
        pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
      }, 650);
      return;
    }

    // ACCION: ESCUDO ARCANO
    if (config.tipo === 'escudo_arcano') {
      sound.playMagic();
      setDefensaHeroeTemporal(prev => prev + 5);
      emitirTextoFlotante('heroe_principal', '+5 CA 🛡️', 'buff');
      agregarLog(`🛡️ Escudo Arcano: Creas una barrera mística (+5 CA temporal).`);

      setUltimaAccion({
        nombre: 'Escudo Arcano',
        impacto: true,
        buff: '+5 CA'
      });

      setTimeout(() => {
        pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
      }, 600);
      return;
    }

    // ACCION: BOMBA DE HUMO (Afecta a toda la sala)
    if (config.tipo === 'bomba_humo') {
      sound.playSlash();
      setBombaHumoActiva(true);
      setBombaHumoUsada(true);
      emitirTextoFlotante('heroe_principal', '¡EN HUMO! 💨', 'esquiva');
      agregarLog(`💨 Bomba de Humo: Envuelves la sala en humo alquímico. ¡El próximo ataque enemigo fallará!`);

      setUltimaAccion({
        nombre: 'Bomba de Humo',
        impacto: true,
        buff: 'Evasión Total'
      });

      setTimeout(() => {
        pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
      }, 600);
      return;
    }

    // ACCION: SEGUNDO ALIENTO
    if (config.tipo === 'segundo_aliento') {
      sound.playHeal();
      setSegundoAlientoUsado(true);
      const curacion = Math.floor(Math.random() * 8) + 1 + (heroeSeguro.nivel || 1);
      const nuevoPv = Math.min(maxPvHeroe, pvHeroe + curacion);
      setPvHeroe(nuevoPv);
      emitirTextoFlotante('heroe_principal', `+${curacion} PV 💖`, 'cura');
      agregarLog(`🩹 Segundo Aliento: Recuperas ${curacion} PV en pleno combate.`);

      setUltimaAccion({
        nombre: 'Segundo Aliento',
        impacto: true,
        cura: curacion
      });

      setTimeout(() => {
        pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
      }, 600);
      return;
    }

    // ACCION: CURACION CLERIGO
    if (config.tipo === 'palabra_curacion') {
      sound.playHeal();
      const curacion = Math.floor(Math.random() * 8) + 1 + modSab + 2;
      const nuevoPv = Math.min(maxPvHeroe, pvHeroe + curacion);
      setPvHeroe(nuevoPv);
      emitirTextoFlotante('heroe_principal', `+${curacion} PV ✨`, 'cura');
      agregarLog(`💖 Palabra de Curación: La luz sagrada sana ${curacion} PV.`);

      setUltimaAccion({
        nombre: 'Palabra de Curación',
        impacto: true,
        cura: curacion
      });

      setTimeout(() => {
        pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
      }, 600);
      return;
    }

    // ATAQUES ESTANDAR CONTRA EL OBJETIVO ENFOCADO
    if (config.sonido === 'magia') {
      sound.playMagic();
    } else {
      sound.playSlash();
    }

    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonoAtaque = (config.modAtributo || 0) + bonoAtqClase + (config.bonoAtqExtra || 0);
    const totalAtaque = d20 + bonoAtaque;
    const esCritico = d20 === 20;
    const esPifia = d20 === 1;
    const caTarget = enemigoObjetivo.defensa || 11;
    const superaCA = !esPifia && (esCritico || totalAtaque >= caTarget);

    setUltimaAccion({
      nombre: config.nombre,
      d20,
      bono: bonoAtaque,
      total: totalAtaque,
      caObjetivo: caTarget,
      impacto: superaCA,
      critico: esCritico,
      pifia: esPifia,
      objetivo: enemigoObjetivo.nombreUnico
    });

    if (superaCA) {
      if (esCritico) {
        sound.playCrit();
        vibrarPantalla();
      } else {
        sound.playHit();
      }

      let danoBase = config.danoCalculado ? config.danoCalculado(esCritico) : (
        calcularDanoMedioArma({
          arma: armaActiva,
          modFue: config.esMagia ? 0 : modFue,
          esCritico
        }).danoTotal + (config.bonoDanoExtra || 0)
      );
      danoBase = Math.max(1, danoBase);

      aplicarDanoAEnemigo(enemigoObjetivo.idCombate, danoBase, esCritico, config.nombre, config.tipoColor || 'dano');
    } else {
      sound.playBlock();
      setBloqueosEnemigos(prev => ({ ...prev, [enemigoObjetivo.idCombate]: true }));
      setTimeout(() => setBloqueosEnemigos(prev => ({ ...prev, [enemigoObjetivo.idCombate]: false })), 350);

      if (esPifia) {
        emitirTextoFlotante(enemigoObjetivo.idCombate, '¡PIFIA! 💀', 'fallo');
        agregarLog(`💀 ¡PIFIA (1)! Tu ${config.nombre} falla estrepitosamente ante ${enemigoObjetivo.nombreUnico}.`);
      } else if (totalAtaque >= caTarget - 2) {
        emitirTextoFlotante(enemigoObjetivo.idCombate, '¡BLOQUEADO! 🛡️', 'bloqueo');
        agregarLog(`🛡️ Bloqueo [${totalAtaque} vs CA ${caTarget}]: La armadura de ${enemigoObjetivo.nombreUnico} detiene tu golpe.`);
      } else {
        emitirTextoFlotante(enemigoObjetivo.idCombate, '¡FALLO! 💨', 'fallo');
        agregarLog(`💨 Fallo [${totalAtaque} vs CA ${caTarget}]: ${enemigoObjetivo.nombreUnico} esquiva tu golpe.`);
      }
    }

    setTimeout(() => {
      pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
    }, 650);
  };

  // Aplicar dano a un enemigo en el estado
  const aplicarDanoAEnemigo = (enemigoId, dano, esCritico, nombreAtaque, tipoColor) => {
    setImpactosEnemigos(prev => ({ ...prev, [enemigoId]: true }));
    setTimeout(() => setImpactosEnemigos(prev => ({ ...prev, [enemigoId]: false })), 300);

    setListaEnemigos(prev => {
      return prev.map(mon => {
        if (mon.idCombate !== enemigoId) return mon;
        const nuevoPv = Math.max(0, mon.pvActual - dano);
        const estaMuerto = nuevoPv <= 0;

        if (esCritico) {
          emitirTextoFlotante(enemigoId, `💥 -${dano} CRÍTICO!`, 'critico');
          agregarLog(`💥 ¡CRÍTICO (20)! ${nombreAtaque} inflige ${dano} de daño fulminante a ${mon.nombreUnico}.`);
        } else {
          emitirTextoFlotante(enemigoId, `-${dano}`, tipoColor);
          agregarLog(`🎯 ${nombreAtaque}: Aciertas a ${mon.nombreUnico} por ${dano} de daño.`);
        }

        if (estaMuerto) {
          agregarLog(`💀 ¡${mon.nombreUnico} ha sucumbido en combate!`);
          if (mon.originalRef) {
            mon.originalRef.hp = 0;
            mon.originalRef.derrotado = true;
          }
        }

        return {
          ...mon,
          pvActual: nuevoPv,
          derrotado: estaMuerto
        };
      });
    });
  };

  // -------------------------------------------------------------------
  // 3. TURNO DE UN COMPANERO DE LA PARTY
  // -------------------------------------------------------------------
  const procesarTurnoCompanero = (companero, turnos, idxActual) => {
    const target = listaEnemigos.find(e => !e.derrotado);
    if (!target) {
      pasarSiguienteTurno(turnos, idxActual);
      return;
    }

    sound.playSlash();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const bono = companero.mod || 2;
    const total = d20 + bono;
    const acierta = total >= target.defensa;

    if (acierta) {
      sound.playHit();
      const danoC = Math.floor(Math.random() * 6) + 2;
      aplicarDanoAEnemigo(target.idCombate, danoC, d20 === 20, `Tajo de ${companero.nombre}`, 'dano');
      agregarLog(`🗡️ ${companero.nombre} asiste al grupo y golpea a ${target.nombreUnico} por ${danoC} de daño.`);
    } else {
      sound.playBlock();
      emitirTextoFlotante(target.idCombate, '¡BLOQUEO!', 'bloqueo');
      agregarLog(`🛡️ ${companero.nombre} ataca a ${target.nombreUnico} pero su golpe es desviado.`);
    }

    setTimeout(() => {
      pasarSiguienteTurno(turnos, idxActual);
    }, 650);
  };

  // -------------------------------------------------------------------
  // 4. TURNO DE UN ENEMIGO
  // -------------------------------------------------------------------
  const procesarTurnoEnemigo = (enemigoTurno, turnos, idxActual) => {
    const mon = listaEnemigos.find(e => e.idCombate === enemigoTurno.id && !e.derrotado && e.pvActual > 0);
    if (!mon) {
      pasarSiguienteTurno(turnos, idxActual);
      return;
    }

    // Bomba de humo activa: esquiva automatica
    if (bombaHumoActiva) {
      setBombaHumoActiva(false);
      sound.playMiss();
      emitirTextoFlotante('heroe_principal', '¡ESQUIVADO EN HUMO! 💨', 'esquiva');
      agregarLog(`💨 ¡${mon.nombreUnico} ataca a ciegas a través del humo denso y falla!`);
      setDefensaHeroeTemporal(0);
      setTimeout(() => pasarSiguienteTurno(turnos, idxActual), 650);
      return;
    }

    sound.playSlash();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonoAtq = mon.atqBono !== undefined ? mon.atqBono : (mon.nivel || 1);
    const totalAtaque = d20 + bonoAtq;
    const defJugador = caHeroeTotal;
    setDefensaHeroeTemporal(0);

    const esCritico = d20 === 20;
    const esPifia = d20 === 1;
    const acierta = !esPifia && (esCritico || totalAtaque >= defJugador);

    setUltimaAccion({
      enemigoAtacando: true,
      nombre: mon.ataque_nombre || 'Zarpazo',
      atacante: mon.nombreUnico,
      d20,
      bono: bonoAtq,
      total: totalAtaque,
      caObjetivo: defJugador,
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

      const danoBase = esCritico ? (mon.dano || 3) * 2 : (mon.dano || 3);
      const nuevoPv = Math.max(0, pvHeroe - danoBase);
      setPvHeroe(nuevoPv);

      if (esCritico) {
        emitirTextoFlotante('heroe_principal', `💥 -${danoBase} CRÍTICO!`, 'critico');
        agregarLog(`⚠️ ¡CRÍTICO DE ${mon.nombreUnico}! Golpea con furia causando ${danoBase} de daño.`);
      } else {
        emitirTextoFlotante('heroe_principal', `-${danoBase}`, 'dano');
        agregarLog(`🩸 ${mon.nombreUnico} [${d20}+${bonoAtq}=${totalAtaque} vs CA ${defJugador}]: Impacta por ${danoBase} de daño.`);
      }

      if (nuevoPv <= 0) {
        agregarLog(`💀 ¡Has caído en combate ante ${mon.nombreUnico}!`);
        setFase('DERROTA');
        return;
      }
    } else {
      sound.playBlock();
      setAnimBloqueoHeroe(true);
      setTimeout(() => setAnimBloqueoHeroe(false), 350);

      if (esPifia) {
        emitirTextoFlotante('heroe_principal', '¡PIFIA ENEMIGA! 💨', 'esquiva');
        agregarLog(`🛡️ ¡Pifia de ${mon.nombreUnico}! Tropieza en el asalto.`);
      } else if (totalAtaque >= defJugador - 2) {
        emitirTextoFlotante('heroe_principal', '¡BLOQUEADO! 🛡️', 'bloqueo');
        agregarLog(`🛡️ Bloqueo [${totalAtaque} vs CA ${defJugador}]: Desvías el ataque de ${mon.nombreUnico}.`);
      } else {
        emitirTextoFlotante('heroe_principal', '¡ESQUIVASTE! 💨', 'esquiva');
        agregarLog(`💨 Esquiva [${totalAtaque} vs CA ${defJugador}]: Esquivas el golpe de ${mon.nombreUnico}.`);
      }
    }

    setTimeout(() => {
      pasarSiguienteTurno(turnos, idxActual);
    }, 650);
  };

  // -------------------------------------------------------------------
  // 5. DEFENDERSE, BEBER POCION Y HUIR
  // -------------------------------------------------------------------
  const handleDefenderse = () => {
    if (fase !== 'TURNO_JUGADOR' || ejecutandoAccion) return;
    setEjecutandoAccion(true);
    sound.playBlock();
    setDefensaHeroeTemporal(prev => prev + 2);
    emitirTextoFlotante('heroe_principal', '+2 DEF 🛡️', 'buff');
    agregarLog(`🛡️ Adoptas una postura defensiva cerrada (+2 DEF).`);

    setTimeout(() => {
      pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
    }, 600);
  };

  const handleBeberPocion = () => {
    if (fase !== 'TURNO_JUGADOR' || pociones <= 0 || ejecutandoAccion) return;
    setEjecutandoAccion(true);
    setPociones(prev => prev - 1);
    sound.playHeal();
    const curacion = 6;
    const nuevoPv = Math.min(maxPvHeroe, pvHeroe + curacion);
    setPvHeroe(nuevoPv);
    emitirTextoFlotante('heroe_principal', `+${curacion} PV 🧪`, 'cura');
    agregarLog(`🧪 Bebes una poción (+${curacion} PV). Restan ${pociones - 1}.`);

    setTimeout(() => {
      pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
    }, 600);
  };

  const handleIntentarHuir = () => {
    if (fase !== 'TURNO_JUGADOR' || ejecutandoAccion) return;
    setEjecutandoAccion(true);
    sound.playSlash();

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + modDes;

    if (total >= 11) {
      emitirTextoFlotante('heroe_principal', '¡HUIDA EXITOSA! 🏃', 'esquiva');
      agregarLog(`🏃 ¡Tirada de Huida exitosa (${total} vs 11+)! Logras replegarte.`);
      setTimeout(() => {
        if (onHuir) onHuir();
      }, 700);
    } else {
      emitirTextoFlotante('heroe_principal', '¡TROPIEZO! ❌', 'fallo');
      agregarLog(`❌ Fallas al huir (${total} vs 11+). ¡Tropiezas y quedas expuesto!`);
      setTimeout(() => {
        pasarSiguienteTurno(ordenIniciativa, indiceTurnoActual);
      }, 650);
    }
  };

  const handleCerrarVictoria = () => {
    sound.playCoin();
    const botin = botinGenerado || generarBotinEncuentro(listaEnemigos, heroeSeguro.nivel || 1);

    onFinalizarCombate({
      victoria: true,
      pvRestante: pvHeroe,
      podRestante: podHeroe,
      oroGanado: botin.oro,
      plataGanada: botin.plata,
      xpGanada: botin.xp,
      botin: botin.items,
      enemigosDerrotados: listaEnemigos
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
  // ARSENAL TACTICO SEGUN LA CLASE DEL JUGADOR
  // -------------------------------------------------------------------
  const obtenerAtaquesClase = () => {
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
          desc: 'Esfera ígnea pesada (1d10 + INT).',
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
          sub: '1 POD • Ineludible',
          desc: '3 dardos arcanos. ¡Ignora la CA enemiga!',
          icono: '✨',
          tipo: 'misil_magico',
          costePod: 1,
          estiloBoton: 'from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-purple-100 border-purple-400/40'
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

    if (claseHeroe === 'clerigo') {
      return [
        {
          id: 'maza_sagrada',
          nombre: '🔨 Maza Bendita',
          sub: 'Físico / Radiante',
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
          sub: 'Cantrip • 0 POD',
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
        }
      ];
    }

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
          desc: 'El próximo ataque enemigo en la sala fallará.',
          icono: '💨',
          tipo: 'bomba_humo',
          disabled: bombaHumoUsada,
          estiloBoton: 'from-stone-700 to-stone-600 hover:from-stone-600 hover:to-stone-500 text-stone-100 border-stone-400/40'
        }
      ];
    }

    // GUERRERO (Default marcial)
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
        desc: 'Golpe con broquel que afianza tu defensa.',
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
        sub: segundoAlientoUsado ? 'Usado' : 'Recupera PV',
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

      <div className="bg-stone-950 border border-stone-800 max-w-5xl w-full rounded-3xl p-3 sm:p-5 shadow-2xl text-stone-200 relative overflow-hidden flex flex-col max-h-[96vh]">
        {/* ENCABEZADO SUPERIOR TACTICO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2.5 border-b border-stone-800/80 gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                Combate Táctico • West Marches
                <span className="text-[10px] text-stone-400 font-mono font-normal">
                  (Ronda {turnoNumero})
                </span>
                <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                  Desafío Nvl {nivelPromedioGrupo}
                </span>
              </h3>
              <p className="text-[10px] text-stone-400">
                Tiradas automáticas con iniciativa grupal contra CA/DEF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
              fase === 'TURNO_JUGADOR'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse'
                : fase === 'TURNO_ENEMIGO'
                ? 'bg-red-950/80 text-red-300 border-red-500/60'
                : fase === 'TURNO_COMPANERO'
                ? 'bg-blue-950/80 text-blue-300 border-blue-500/60'
                : 'bg-stone-900 text-stone-300 border-stone-800'
            }`}>
              {fase === 'TURNO_JUGADOR' && '🟢 Tu Turno'}
              {fase === 'TURNO_ENEMIGO' && '🔴 Turno Enemigo'}
              {fase === 'TURNO_COMPANERO' && '🔵 Turno Aliado'}
              {fase === 'INICIATIVA' && '🎲 Iniciativa'}
              {fase === 'VICTORIA' && '🏆 Victoria'}
              {fase === 'DERROTA' && '💀 Derrota'}
            </div>
          </div>
        </div>

        {/* BARRA DE COLA DE INICIATIVA */}
        {ordenIniciativa.length > 0 && fase !== 'VICTORIA' && fase !== 'DERROTA' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-thin">
            <span className="text-[9px] font-black uppercase text-stone-400 flex-shrink-0 tracking-wider">
              Orden:
            </span>
            {ordenIniciativa.map((t, idx) => {
              const esActual = idx === indiceTurnoActual;
              return (
                <div
                  key={t.id}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 flex-shrink-0 transition-all ${
                    esActual
                      ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-105 ring-1 ring-amber-400'
                      : t.esHeroe
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80 opacity-80'
                      : 'bg-red-950/70 text-red-300 border-red-800/80 opacity-80'
                  }`}
                >
                  <span>{t.esHeroe ? '🟢' : '🔴'}</span>
                  <span className="truncate max-w-[90px]">{t.nombre}</span>
                  <span className="text-[9px] opacity-75">({t.iniciativa})</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ARENA DE DUELO: HEROES VS MULTI-MONSTRUOS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch mb-2.5">
          {/* LADO DE LOS HEROES (4 cols) */}
          <div className={`lg:col-span-4 bg-stone-900/95 border rounded-2xl p-3 transition-all duration-150 relative ${
            fase === 'TURNO_JUGADOR'
              ? 'border-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
              : 'border-stone-800/80'
          } ${animImpactoHeroe ? 'bg-red-950/60 border-red-500 scale-[0.98]' : ''} ${
            animBloqueoHeroe ? 'animate-shield-pulse border-cyan-400 bg-cyan-950/40' : ''
          }`}>
            {/* FLOATING COMBAT TEXT OVER HERO */}
            {floatingTexts.filter(ft => ft.targetId === 'heroe_principal').map(ft => (
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

            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 relative">
                <img
                  src={spriteHeroe}
                  alt={heroeSeguro.nombre}
                  className="w-9 h-9 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => { e.target.src = '/assets/crawler/heroes/knight_m_idle_anim_f0.png'; }}
                />
                {defensaHeroeTemporal > 0 && (
                  <span className="absolute bottom-0 right-0 bg-blue-600 text-[8px] font-black px-1 rounded text-white">
                    +{defensaHeroeTemporal}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-amber-200 truncate">{heroeSeguro.nombre}</h4>
                  <span className="text-[9px] uppercase font-bold text-stone-400 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                    Nvl {heroeSeguro.nivel || 1}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 capitalize">
                  {heroeSeguro.raza || 'Humano'} {claseHeroe}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[9px] text-stone-300 font-bold">
                  <span className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 text-cyan-300">
                    🛡️ CA: <strong>{caHeroeTotal}</strong>
                  </span>
                  <span className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 text-amber-300">
                    🗡️ +{modFue + bonoAtqClase}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de PV Heroe */}
            <div className="space-y-0.5 mb-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-red-400">❤️ PV</span>
                <span className="font-mono">{pvHeroe} / {maxPvHeroe}</span>
              </div>
              <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (pvHeroe / maxPvHeroe) * 100)}%` }}
                />
              </div>
            </div>

            {/* Barra de POD */}
            {(claseHeroe === 'hechicero' || claseHeroe === 'clerigo' || maxPodHeroe > 0) && (
              <div className="space-y-0.5 mb-1.5">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className="text-purple-400">✨ POD</span>
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

            {/* Companeros de la party si existen */}
            {party.length > 1 && (
              <div className="border-t border-stone-800/60 pt-1.5 mt-1">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Compañía Aventurera ({party.length})
                </span>
                <div className="space-y-1">
                  {party.filter(p => p.id !== heroeSeguro.id).map((comp, idx) => (
                    <div key={idx} className="bg-stone-950/60 border border-stone-800/80 rounded-lg p-1.5 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-400">🛡️</span>
                        <span className="font-bold text-stone-200">{comp.nombre}</span>
                        <span className="text-[9px] text-stone-400">({comp.clase})</span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[9px]">Listo</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* INDICADOR CENTRAL VS / ESTADO TACTICO (2 cols) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-2 text-center bg-stone-950/60 border border-stone-800/80 rounded-2xl min-h-[80px]">
            <div className="text-lg font-black text-amber-400 tracking-widest mb-1">
              VS
            </div>

            {ultimaAccion ? (
              <div className="text-[9px] font-mono text-stone-300 bg-stone-900 border border-stone-800 p-1.5 rounded-lg w-full">
                {ultimaAccion.autoAcierto ? (
                  <div className="text-purple-300 font-bold">
                    ✨ Ineludible ({ultimaAccion.dano} DMG)
                  </div>
                ) : ultimaAccion.total !== undefined ? (
                  <div>
                    <span className={ultimaAccion.impacto ? 'text-emerald-400 font-bold' : 'text-stone-400'}>
                      {ultimaAccion.impacto ? '🎯 Impacto' : '🛡️ Fallo'}
                    </span>
                    <div className="text-[8px] text-stone-400 mt-0.5">
                      {ultimaAccion.d20}+{ultimaAccion.bono}=<strong className="text-stone-200">{ultimaAccion.total}</strong> vs CA {ultimaAccion.caObjetivo}
                    </div>
                  </div>
                ) : (
                  <div className="text-stone-400 text-[9px]">
                    {ultimaAccion.buff || ultimaAccion.nombre}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">
                West Marches
              </span>
            )}
          </div>

          {/* LADO DE LOS MONSTRUOS (6 cols - SOPORTE MULTI-MONSTRUO) */}
          <div className="lg:col-span-6 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                👹 Enemigos en la Sala ({listaEnemigos.filter(e => !e.derrotado).length})
              </span>
              <span className="text-[9px] text-stone-400">
                Haz clic en un monstruo para enfocarlo 🎯
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
              {listaEnemigos.map((mon) => {
                const esObjetivo = mon.idCombate === enemigoObjetivoId && !mon.derrotado;
                const estaMuerto = mon.derrotado;

                const spriteM = (() => {
                  const base = mon.tipo || mon.sprite_base || 'skelet';
                  return `/assets/crawler/enemies/${base}_idle_anim_f0.png`;
                })();

                return (
                  <div
                    key={mon.idCombate}
                    onClick={() => {
                      if (!estaMuerto) setEnemigoObjetivoId(mon.idCombate);
                    }}
                    className={`bg-stone-900/95 border rounded-2xl p-2.5 transition-all duration-150 relative cursor-pointer ${
                      estaMuerto
                        ? 'border-stone-800/40 bg-stone-950/40 opacity-40 cursor-not-allowed'
                        : esObjetivo
                        ? 'border-amber-400/90 shadow-[0_0_14px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/60 bg-amber-950/20'
                        : 'border-stone-800/80 hover:border-red-500/50'
                    } ${impactosEnemigos[mon.idCombate] ? 'bg-red-950/70 border-red-500 scale-[0.98]' : ''} ${
                      bloqueosEnemigos[mon.idCombate] ? 'animate-shield-pulse border-cyan-400 bg-cyan-950/40' : ''
                    }`}
                  >
                    {/* FLOATING TEXT OVER THIS MONSTER */}
                    {floatingTexts.filter(ft => ft.targetId === mon.idCombate).map(ft => (
                      <div
                        key={ft.id}
                        className={`absolute pointer-events-none z-30 font-black text-xs sm:text-sm animate-combat-float ${
                          ft.tipo === 'critico'
                            ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)] text-base scale-110'
                            : ft.tipo === 'dano'
                            ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                            : ft.tipo === 'magia'
                            ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]'
                            : ft.tipo === 'bloqueo'
                            ? 'text-cyan-300 bg-cyan-950/90 border border-cyan-400/60 px-1.5 py-0.5 rounded shadow'
                            : 'text-stone-300 bg-stone-900/90 border border-stone-700 px-1.5 py-0.5 rounded'
                        }`}
                        style={{ top: '20%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      >
                        {ft.texto}
                      </div>
                    ))}

                    {/* BADGE DE OBJETIVO SELECCIONADO */}
                    {esObjetivo && (
                      <span className="absolute -top-2 left-3 bg-amber-500 text-stone-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        🎯 Objetivo
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-10 h-10 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                        <img
                          src={spriteM}
                          alt={mon.nombreUnico}
                          className="w-8 h-8 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                          onError={(e) => { e.target.src = '/assets/crawler/enemies/skelet_idle_anim_f0.png'; }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-red-300 truncate">
                            {mon.esJefe && '👑 '} {mon.nombreUnico}
                          </h4>
                          <span className="text-[8px] uppercase font-bold text-stone-400 bg-stone-950 px-1 rounded border border-stone-800">
                            Nvl {mon.nivel || 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-stone-300 font-bold">
                          <span className="bg-stone-950 px-1 rounded border border-stone-800 text-cyan-300">
                            🛡️ CA: {mon.defensa || 11}
                          </span>
                          <span className="bg-stone-950 px-1 rounded border border-stone-800 text-rose-300">
                            💥 ~{mon.dano || 3}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de PV de este monstruo */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-red-400">❤️ Salud</span>
                        <span className="font-mono">{mon.pvActual} / {mon.pvMaximo}</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-rose-700 transition-all duration-200"
                          style={{ width: `${Math.max(0, (mon.pvActual / mon.pvMaximo) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BITACORA DE COMBATE AGIL */}
        <div
          ref={logRef}
          className="bg-stone-950/90 border border-stone-800/80 rounded-2xl p-2.5 text-[11px] font-mono space-y-1 overflow-y-auto mb-2.5 min-h-[65px] max-h-[95px] shadow-inner"
        >
          {log.map((linea, idx) => (
            <div key={idx} className="text-stone-300 leading-snug">
              {linea}
            </div>
          ))}
        </div>

        {/* PANEL DE ACCIONES TACTICAS */}
        <div className="border-t border-stone-800/90 pt-2">
          {fase === 'INICIATIVA' && (
            <button
              onClick={ejecutarIniciativa}
              disabled={ejecutandoAccion}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span className="text-base">🎲</span>
              <span>Tirar Iniciativa Grupal (Héroes vs Monstruos)</span>
            </button>
          )}

          {fase === 'TURNO_JUGADOR' && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {listaAtaques.map((atq) => {
                  const sinPod = atq.costePod && podHeroe < atq.costePod;
                  const bloqueado = atq.disabled || sinPod || ejecutandoAccion;

                  return (
                    <button
                      key={atq.id}
                      onClick={() => ejecutarAccionJugador(atq)}
                      disabled={bloqueado}
                      className={`p-2 rounded-xl border text-left transition flex flex-col justify-between relative overflow-hidden group ${
                        bloqueado
                          ? 'bg-stone-900/60 border-stone-800/60 text-stone-600 cursor-not-allowed opacity-60'
                          : atq.estiloBoton
                          ? `bg-gradient-to-br ${atq.estiloBoton} shadow-md active:scale-[0.98]`
                          : 'bg-stone-900 hover:bg-stone-800/90 border-stone-700/80 hover:border-amber-500/50 text-stone-100 shadow active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-0.5">
                        <span className="text-xs font-black truncate">{atq.nombre}</span>
                        {atq.costePod > 0 && (
                          <span className="text-[9px] bg-purple-950 text-purple-300 font-bold px-1 rounded border border-purple-800 flex-shrink-0">
                            {atq.costePod} POD
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-stone-400 truncate">{atq.sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* UTILIDADES COMUNES */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800/50">
                <button
                  onClick={handleDefenderse}
                  disabled={ejecutandoAccion}
                  className="py-2 px-2 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1 border border-stone-700 active:scale-[0.98]"
                >
                  <span>🛡️</span>
                  <span className="truncate">Guardia (+2 DEF)</span>
                </button>

                <button
                  onClick={handleBeberPocion}
                  disabled={pociones <= 0 || ejecutandoAccion}
                  className={`py-2 px-2 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1 border active:scale-[0.98] ${
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
                  className="py-2 px-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-1 border border-stone-800 active:scale-[0.98]"
                >
                  <span>🏃</span>
                  <span className="truncate">Huir (Instintos)</span>
                </button>
              </div>
            </div>
          )}

          {(fase === 'TURNO_ENEMIGO' || fase === 'TURNO_COMPANERO') && (
            <div className="w-full py-2.5 bg-stone-900/80 border border-stone-800 rounded-2xl text-center text-xs text-amber-300 font-bold flex items-center justify-center gap-2 animate-pulse">
              <span>⚔️</span>
              <span>
                {fase === 'TURNO_ENEMIGO' ? 'Los monstruos de la sala ejecutan su ofensiva...' : 'Un camarada de la Compañía apoya el ataque...'}
              </span>
            </div>
          )}

          {fase === 'VICTORIA' && (
            <div className="bg-emerald-950/70 border-2 border-emerald-500/80 p-4 rounded-2xl flex flex-col gap-3 animate-in fade-in shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-2">
                <div>
                  <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <span>🏆</span> ¡Victoria Táctica en la Sala!
                  </h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Has derrotado a todas las criaturas del sector. Recompensas:
                    <strong className="text-amber-300 ml-1">+{botinGenerado?.oro || 8} MO</strong>,{' '}
                    <strong className="text-stone-300">+{botinGenerado?.plata || 12} MP</strong> y{' '}
                    <strong className="text-blue-300">+{botinGenerado?.xp || 25} PX</strong>.
                  </p>
                </div>
                <button
                  onClick={handleCerrarVictoria}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black uppercase text-xs rounded-xl shadow-lg transition active:scale-[0.98] flex-shrink-0"
                >
                  Reclamar Botín y Continuar
                </button>
              </div>

              {/* LISTA DE OBJETOS SOLTADOS POR LOS MONSTRUOS */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  🎒 Botín obtenido de las criaturas ({botinGenerado?.items?.length || 0} objetos):
                </span>
                {botinGenerado?.items?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {botinGenerado.items.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                          item.rareza === 'legendaria'
                            ? 'bg-amber-950/70 border-amber-500 animate-pulse'
                            : 'bg-stone-900/90 border-emerald-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{item.icono || '🎁'}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-200 block truncate">
                              {item.nombre}
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {item.desc || `${item.tipo} • Valor: ${item.valorMo} mo`}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800 flex-shrink-0">
                          {item.valorMo} mo
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">
                    Las criaturas no portaban equipo aprovechable esta vez; recuperaste monedas y experiencia.
                  </p>
                )}
              </div>
            </div>
          )}

          {fase === 'DERROTA' && (
            <div className="bg-red-950/50 border border-red-500/60 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-red-300 uppercase tracking-wide flex items-center gap-1.5">
                  💀 Has Caído en Combate
                </h4>
                <p className="text-xs text-stone-300 mt-0.5">
                  El Guardián del Umbral vela tu descanso en el Santuario de Resurrección.
                </p>
              </div>
              <button
                onClick={handleCerrarDerrota}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs rounded-xl shadow-lg transition active:scale-[0.98]"
              >
                Regresar al Santuario
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
