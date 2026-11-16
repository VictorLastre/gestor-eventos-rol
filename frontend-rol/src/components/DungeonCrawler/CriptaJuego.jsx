import { useState, useEffect, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';
import { GameEngine, CLASES } from './GameEngine';
import { assets } from './AssetManager';
import { sound } from './SoundEngine';
import { fetchProtegido } from '../../utils/api';
import CuadroDialogo from './CuadroDialogo';
import { PERSONALIDADES_NPC } from './PersonalidadesNPC';
import HojaPersonajeVE from './HojaPersonajeVE';
import CreacionPersonajeVE from './CreacionPersonajeVE';
import CombatePorTurnosVE from './CombatePorTurnosVE';
import InventarioVE from './InventarioVE';
import { cargarPersonajeLocal, guardarPersonajeLocal, calcularEstadisticasPersonaje, MIEMBROS_ASOCIACION_VE } from './ViejaEscuelaEngine';




export default function CriptaJuego({ usuarioLogueado, alActualizarUsuario, volver }) {
  const canvasRef = useRef(null);
  const contenedorRef = useRef(null);
  const engineRef = useRef(null);

  // Estados de carga e interfaz
  const [cargandoAssets, setCargandoAssets] = useState(true);
  const [progresoCarga, setProgresoCarga] = useState(0);
  const [modalPersonaje, setModalPersonaje] = useState(false);
  const [modalHojaVE, setModalHojaVE] = useState(false);
  const [modalCreacionVE, setModalCreacionVE] = useState(false);
  const [modalInventarioVE, setModalInventarioVE] = useState(false);
  const [subpestanaInventario, setSubpestanaInventario] = useState('inventario');
  const [modalMuerte, setModalMuerte] = useState(null);
  const [modalJefeDerrotado, setModalJefeDerrotado] = useState(null);
  const [sonidoSilenciado, setSonidoSilenciado] = useState(false);
  const [esFullscreen, setEsFullscreen] = useState(false);
  const [esDispositivoTactil, setEsDispositivoTactil] = useState(false);
  const [npcDialogoActivo, setNpcDialogoActivo] = useState(null);
  const [encuentroCombate, setEncuentroCombate] = useState(null);
  const [personajeVE, setPersonajeVE] = useState(null);

  // Estados de presencia y Compañía Aventurera (Party)
  const [exploradoresOnline, setExploradoresOnline] = useState([]);
  const [panelExploradores, setPanelExploradores] = useState(false);
  const [panelParty, setPanelParty] = useState(false);
  const [party, setParty] = useState([
    {
      id: usuarioLogueado?.id || 'lider',
      nombre: usuarioLogueado?.nombre || 'Tú',
      clase: localStorage.getItem('crawler_clase') || 'guerrero',
      nivel: 1,
      pv: 16,
      maxPv: 16,
      esLider: true
    }
  ]);

  // Clase y Avatar
  const [claseSeleccionada, setClaseSeleccionada] = useState(
    localStorage.getItem('crawler_clase') || 'guerrero'
  );
  const [generoSeleccionado, setGeneroSeleccionado] = useState(
    localStorage.getItem('crawler_genero') || 'm'
  );

  // Stats en tiempo real
  const [stats, setStats] = useState({
    piso: 1,
    clase: 'guerrero',
    nivel: 1,
    xp: 0,
    xpSiguiente: 2000,
    hp: 8,
    maxHp: 8,
    recurso: 0,
    maxRecurso: 0,
    durabilidad: 70,
    maxDurabilidad: 70,
    armaRota: false,
    oro: 30,
    materiales: 8,
    llaves: 0,
    def: 13,
    mov: 12,
    enSantuario: false,
    santuarioDescubierto: false,
    cercaHoguera: false,
    cercaForja: false,
    escaleraAbierta: false,
    jefeHP: 0,
    jefeMaxHP: 1,
    jefeNombre: ''
  });

  const [mensajeAlerta, setMensajeAlerta] = useState(null);


  // Sincronizar cambios de la Party con el motor del juego
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.party = party;
    }
  }, [party]);

  // Atajo de teclado: 'I' para abrir o cerrar el inventario OSR
  useEffect(() => {
    const handleKeyI = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setSubpestanaInventario('inventario');
        setModalInventarioVE(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyI);
    return () => window.removeEventListener('keydown', handleKeyI);
  }, []);

  // Sincronización de presencia en la Gran Cripta West Marches
  useEffect(() => {
    let intervalo = null;

    const reportarPresencia = async () => {
      try {
        const res = await fetchProtegido('/api/crawler/presencia', {
          method: 'POST',
          body: JSON.stringify({
            nombre: personajeVE?.nombre || usuarioLogueado?.nombre || 'Aventurero',
            clase: personajeVE?.clase || claseSeleccionada,
            nivel: personajeVE?.nivel || stats.nivel || 1,
            pvActual: stats.hp,
            maxPv: stats.maxHp,
            sector: stats.piso,
            avatar: usuarioLogueado?.avatar || null
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.exploradores) {
            setExploradoresOnline(data.exploradores);
          }
        }
      } catch (e) {
        // Silencioso
      }
    };

    reportarPresencia();
    intervalo = setInterval(reportarPresencia, 15000);

    return () => {
      if (intervalo) clearInterval(intervalo);
      fetchProtegido('/api/crawler/salir-presencia', { method: 'POST' }).catch(() => {});
    };
  }, [personajeVE, claseSeleccionada, stats.hp, stats.maxHp, stats.piso, stats.nivel]);

  const invitarAventurero = async (exp) => {
    try {
      const res = await fetchProtegido('/api/crawler/party/invitar', {
        method: 'POST',
        body: JSON.stringify({
          invitadoId: exp.usuarioId,
          nombreAnfitrion: personajeVE?.nombre || usuarioLogueado?.nombre,
          claseAnfitrion: personajeVE?.clase || claseSeleccionada,
          nivelAnfitrion: personajeVE?.nivel || stats.nivel
        })
      });
      if (res.ok) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Invitación enviada a ${exp.nombre}`,
          showConfirmButton: false,
          timer: 2500,
          background: '#09090b',
          color: '#ffffff'
        });
      }
    } catch (e) {
      console.warn('Error al invitar a party:', e);
    }
  };

  const reclutarCompaneroNPC = (clave) => {
    const ficha = MIEMBROS_ASOCIACION_VE[clave];
    if (!ficha) return;

    if (party.some(p => p.claveNPC === clave)) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: `${ficha.nombre} ya marcha en tu Compañía`,
        showConfirmButton: false,
        timer: 2000,
        background: '#09090b',
        color: '#ffffff'
      });
      return;
    }

    if (party.length >= 4) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Tu Compañía Aventurera está completa (Máximo 4)',
        showConfirmButton: false,
        timer: 2000,
        background: '#09090b',
        color: '#ffffff'
      });
      return;
    }

    sound.playLevelUp();
    setParty(prev => [
      ...prev,
      {
        id: `npc_${clave}`,
        claveNPC: clave,
        nombre: ficha.nombre,
        clase: (ficha.clase || 'Guerrero').toLowerCase(),
        nivel: stats.nivel || 1,
        pv: 16,
        maxPv: 16,
        esNPC: true,
        rol: ficha.rol
      }
    ]);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `¡${ficha.nombre} se unió a tu Compañía Aventurera!`,
      showConfirmButton: false,
      timer: 2500,
      background: '#09090b',
      color: '#ffffff'
    });
  };

  const expulsarDeParty = (idMiembro) => {
    setParty(prev => prev.filter(p => p.id !== idMiembro));
  };

  // 1. Detectar si es pantalla táctil/móvil
  useEffect(() => {
    const esTactil = ('ontouchstart' in window || navigator.maxTouchPoints > 0) || window.innerWidth < 850;
    setEsDispositivoTactil(esTactil);

    const onFullscreenChange = () => {
      setEsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // 2. Precargar Assets y Sincronizar Progreso desde la Bóveda del Gremio
  useEffect(() => {
    let montado = true;

    // Consultar progreso en backend y existencia de personaje
    const sincronizarProgresoGremio = async () => {
      try {
        // Verificar si existe personaje de Vieja Escuela en backend
        const localPj = cargarPersonajeLocal();
        const tieneLocal = !!localPj;
        if (localPj && montado) {
          setPersonajeVE(localPj);
        }

        const resPj = await fetchProtegido('/api/crawler/personaje');
        let tienePersonaje = false;
        if (resPj && resPj.ok) {
          const dataPj = await resPj.json();
          if (dataPj.existe && dataPj.personaje) {
            tienePersonaje = true;
            if (montado) setPersonajeVE(dataPj.personaje);
            guardarPersonajeLocal(dataPj.personaje);
          }
        }

        const aventuraIniciada = localStorage.getItem('ve_aventura_iniciada_v1');
        // Si no se ha forjado un héroe con el nuevo sistema, abrir creador inmediatamente y limpiar residuo de pruebas
        if (!aventuraIniciada && montado) {
          localStorage.removeItem('crawler_piso');
          localStorage.removeItem('crawler_oro');
          localStorage.removeItem('crawler_clase');
          setModalCreacionVE(true);
        } else if (!tienePersonaje && !tieneLocal && montado) {
          setModalCreacionVE(true);
        }

        // Consultar progreso previo de mazmorra
        const res = await fetchProtegido('/api/crawler/progreso');
        if (res && res.ok) {
          const data = await res.json();
          if (data.existe && montado) {
            if (data.piso_actual) localStorage.setItem('crawler_piso', data.piso_actual);
            if (data.oro !== undefined) localStorage.setItem('crawler_oro', data.oro);
            if (data.clase) {
              setClaseSeleccionada(data.clase);
              localStorage.setItem('crawler_clase', data.clase);
            }
            if (data.genero) {
              setGeneroSeleccionado(data.genero);
              localStorage.setItem('crawler_genero', data.genero);
            }
          }
        }
      } catch (e) {
        console.warn('Conexión con el servidor no disponible para progreso inicial:', e);
      }
    };
    sincronizarProgresoGremio();

    assets.precargarTodo((progreso) => {
      if (montado) setProgresoCarga(progreso);
    }).then(() => {
      if (montado) {
        setCargandoAssets(false);
      }
    });

    return () => {
      montado = false;
    };
  }, []);

  // 3. Inicializar el GameEngine
  useEffect(() => {
    if (cargandoAssets || !canvasRef.current) return;

    const canvas = canvasRef.current;
    
    const ajustarTamano = () => {
      if (!canvas) return;
      if (document.fullscreenElement) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 130;
      } else {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = Math.max(480, window.innerHeight - 160);
      }
    };
    ajustarTamano();
    window.addEventListener('resize', ajustarTamano);

    const pisoGuardado = parseInt(localStorage.getItem('crawler_piso')) || 1;
    const oroGuardado = parseInt(localStorage.getItem('crawler_oro')) || 0;

    const engine = new GameEngine(canvas, {
      pisoInicial: pisoGuardado,
      oroInicial: oroGuardado,
      claseId: claseSeleccionada,
      genero: generoSeleccionado,
      personaje: personajeVE || cargarPersonajeLocal(),
      party: party,
      onActualizarStats: (nuevasStats) => {
        setStats(nuevasStats);
        if (nuevasStats.guardarEnDB) {
          guardarProgresoEnStorage(nuevasStats);
        }
      },
      onNotificacion: (notif) => {
        mostrarNotificacionToast(notif);
      },
      onInteractuarNPC: (npcBasico) => {
        const ficha = PERSONALIDADES_NPC[npcBasico.tipo];
        if (ficha) {
          setNpcDialogoActivo(ficha);
        }
      },
      onMuerte: (data) => {
        const fichaMuerte = PERSONALIDADES_NPC.guardian_umbral || PERSONALIDADES_NPC.martin;
        const juicio = fichaMuerte.generarJuicioMuerte(data.armaQuebrada, data.oroPerdido, data.expulsado, data.piso);
        setModalMuerte(juicio);
      },
      onJefeDerrotado: (data) => {
        setModalJefeDerrotado(data);
      },
      onCambioPiso: (nuevoPiso) => {
        localStorage.setItem('crawler_piso', nuevoPiso);
      },
      onIniciarCombatePorTurnos: (enemigosGrupo) => {
        const pj = cargarPersonajeLocal() || personajeVE;
        const lista = Array.isArray(enemigosGrupo) ? enemigosGrupo : [enemigosGrupo];
        setEncuentroCombate({ enemigos: lista, enemigo: lista[0], personaje: pj });
      }
    });

    engine.start();
    engineRef.current = engine;

    return () => {
      window.removeEventListener('resize', ajustarTamano);
      engine.destroy();
    };
  }, [cargandoAssets]);

  // Forjar e Iniciar partida limpia con el nuevo personaje de Vieja Escuela
  const iniciarAventuraConPersonaje = async (nuevoPj) => {
    try {
      // 1. Guardar en MySQL marcando reiniciarAventura: true para volver a Piso 1
      await fetchProtegido('/api/crawler/personaje/guardar', {
        method: 'POST',
        body: JSON.stringify({
          ...nuevoPj,
          reiniciarAventura: true
        })
      });

      // 2. Limpiar residuos y resetear al Piso 1 en localStorage
      localStorage.setItem('crawler_piso', '1');
      localStorage.setItem('crawler_oro', String(nuevoPj.monedas?.mo || 30));
      localStorage.setItem('crawler_clase', nuevoPj.clase);
      localStorage.setItem('crawler_genero', nuevoPj.genero || 'm');
      localStorage.setItem('personaje_vieja_escuela_v1', JSON.stringify(nuevoPj));
      localStorage.setItem('ve_aventura_iniciada_v1', 'true');
      setPersonajeVE(nuevoPj);

      // 3. Actualizar estados de React
      setClaseSeleccionada(nuevoPj.clase);
      setGeneroSeleccionado(nuevoPj.genero || 'm');
      setStats(prev => ({
        ...prev,
        piso: 1,
        clase: nuevoPj.clase,
        oro: nuevoPj.monedas?.mo || 30,
        hp: nuevoPj.pvActual || 16,
        maxHp: nuevoPj.pvActual || 16,
        escaleraAbierta: false,
        jefeHP: 0
      }));

      // 4. Reiniciar el GameEngine en el Piso 1
      if (canvasRef.current) {
        if (engineRef.current) {
          engineRef.current.destroy();
        }
        const canvas = canvasRef.current;
        const nuevoEngine = new GameEngine(canvas, {
          pisoInicial: 1,
          oroInicial: nuevoPj.monedas?.mo || 30,
          claseId: nuevoPj.clase,
          genero: nuevoPj.genero || 'm',
          onActualizarStats: (nuevasStats) => {
            setStats(nuevasStats);
            if (nuevasStats.guardarEnDB) {
              guardarProgresoEnStorage(nuevasStats);
            }
          },
          onNotificacion: (notif) => {
            mostrarNotificacionToast(notif);
          },
          onInteractuarNPC: (npcBasico) => {
            const ficha = PERSONALIDADES_NPC[npcBasico.tipo];
            if (ficha) setNpcDialogoActivo(ficha);
          },
          onMuerte: (data) => {
            const fichaMuerte = PERSONALIDADES_NPC.guardian_umbral || PERSONALIDADES_NPC.martin;
            const juicio = fichaMuerte.generarJuicioMuerte(data.armaQuebrada, data.oroPerdido, data.expulsado, data.piso);
            setModalMuerte(juicio);
          },
          onCambioPiso: (nuevoPiso) => {
            localStorage.setItem('crawler_piso', nuevoPiso);
          },
          onIniciarCombatePorTurnos: (enemigosGrupo) => {
            const pj = cargarPersonajeLocal() || nuevoPj;
            const lista = Array.isArray(enemigosGrupo) ? enemigosGrupo : [enemigosGrupo];
            setEncuentroCombate({ enemigos: lista, enemigo: lista[0], personaje: pj });
          }
        });
        nuevoEngine.start();
        engineRef.current = nuevoEngine;
      }

      setModalCreacionVE(false);

      Swal.fire({
        title: '¡Aventura Iniciada!',
        html: `<p class="text-xs text-stone-300">Bienvenido a la Cripta, <strong>${nuevoPj.nombre}</strong> (${nuevoPj.raza.toUpperCase()} ${nuevoPj.clase.toUpperCase()}).<br/>Tu aventura comienza en el <strong>Piso 1</strong>.</p>`,
        icon: 'success',
        timer: 2500,
        showConfirmButton: false,
        background: '#1c1917',
        color: '#f5f5f4'
      });
    } catch (err) {
      console.error('Error al iniciar aventura con nuevo personaje:', err);
    }
  };

  // Preguntar al usuario si desea forjar un nuevo héroe
  const handlePreguntarNuevoHeroe = () => {
    Swal.fire({
      title: '¿Forjar un Nuevo Héroe?',
      html: `
        <p class="text-xs text-stone-300 mb-2">
          Podrás elegir tu <strong>raza</strong>, <strong>clase OSR</strong>, tirar <strong>3d6 para tus atributos</strong> y personalizar tu personaje oficial de Vieja Escuela.
        </p>
        <p class="text-[11px] text-amber-400 font-bold">
          ⚠️ Tu aventura comenzará desde el <strong>Piso 1</strong> con tu nuevo héroe.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '⚔️ Sí, Crear Personaje',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#292524',
      background: '#1c1917',
      color: '#f5f5f4'
    }).then((result) => {
      if (result.isConfirmed) {
        setModalCreacionVE(true);
      }
    });
  };

  // -------------------------------------------------------------------
  // CONTROL DEL SISTEMA DE COMBATE POR TURNOS (VIEJA ESCUELA OSR)
  // -------------------------------------------------------------------
  const handleFinalizarCombate = (resultado) => {
    if (!encuentroCombate) return;
    const { enemigo, enemigos } = encuentroCombate;
    const listaEnemigos = enemigos || (Array.isArray(enemigo) ? enemigo : [enemigo]);
    const engine = engineRef.current;

    if (resultado.victoria) {
      if (engine) {
        const derrotados = resultado.enemigosDerrotados || listaEnemigos;
        derrotados.forEach(e => {
          if (e) {
            const refOriginal = e.originalRef || e;
            refOriginal.hp = 0;
            refOriginal.derrotado = true;
            engine.procesarMuerteEnemigo(refOriginal);
          }
        });
        listaEnemigos.forEach(e => {
          if (e) {
            e.hp = 0;
            e.derrotado = true;
          }
        });

        // FILTRADO ESTRICTO: Eliminar criaturas muertas del array del motor para que jamás re-activen combate
        engine.enemigos = engine.enemigos.filter(e => e.hp > 0 && !e.derrotado);

        const pj = cargarPersonajeLocal() || personajeVE;
        if (pj) {
          pj.pvActual = resultado.pvRestante;
          if (resultado.podRestante !== undefined) pj.podActual = resultado.podRestante;

          // Integrar botín soltado por las criaturas (pociones, armas, trofeos)
          if (resultado.botin && Array.isArray(resultado.botin)) {
            const equipoActual = pj.equipo || [];
            pj.equipo = [...equipoActual, ...resultado.botin];
          }

          // Sumar monedas de recompensa
          if (resultado.oroGanado) {
            pj.monedas = pj.monedas || { mo: 30, mp: 15, mc: 40 };
            pj.monedas.mo = (pj.monedas.mo || 0) + resultado.oroGanado;
            if (resultado.plataGanada) pj.monedas.mp = (pj.monedas.mp || 0) + resultado.plataGanada;
            engine.oro = pj.monedas.mo;
            setStats(prev => ({ ...prev, oro: pj.monedas.mo }));
          }

          if (resultado.xpGanada) {
            pj.px = (pj.px || 0) + resultado.xpGanada;
          }

          guardarPersonajeLocal(pj);
          setPersonajeVE({ ...pj });
        }
        engine.pausado = false;
      }
    } else {
      if (engine) {
        engine.pausado = false;
        engine.infligirDanoJugador(9999, listaEnemigos[0]?.nombre || 'Monstruo');
      }
    }
    setEncuentroCombate(null);
  };

  const handleHuirCombate = () => {
    if (!encuentroCombate) return;
    const { enemigo, enemigos } = encuentroCombate;
    const listaEnemigos = enemigos || (Array.isArray(enemigo) ? enemigo : [enemigo]);
    const engine = engineRef.current;
    if (engine) {
      listaEnemigos.forEach(e => {
        if (e) {
          if (e.hp <= 0 || e.derrotado) {
            e.hp = 0;
            engine.procesarMuerteEnemigo(e);
          } else {
            e.cooldownAtaque = 8.0; // Margen muy amplio para escapar
          }
        }
      });
      engine.enemigos = engine.enemigos.filter(e => e.hp > 0 && !e.derrotado);

      const primerEnemigo = listaEnemigos[0];
      if (primerEnemigo) {
        const angulo = Math.atan2(engine.player.y - primerEnemigo.y, engine.player.x - primerEnemigo.x);
        const pushDist = 48;
        const nx = engine.player.x + Math.cos(angulo) * pushDist;
        const ny = engine.player.y + Math.sin(angulo) * pushDist;
        if (!engine.colisionaConMuro(nx, ny, engine.player.radio)) {
          engine.player.x = nx;
          engine.player.y = ny;
        }
      }
      engine.pausado = false;
    }
    setEncuentroCombate(null);
  };

  const guardarProgresoEnStorage = async (s) => {
    localStorage.setItem('crawler_piso', s.piso);
    localStorage.setItem('crawler_oro', s.oro);
    localStorage.setItem('crawler_clase', claseSeleccionada);
    localStorage.setItem('crawler_genero', generoSeleccionado);

    try {
      await fetchProtegido('/api/crawler/guardar', {
        method: 'POST',
        body: JSON.stringify({
          piso_actual: s.piso,
          clase: claseSeleccionada,
          genero: generoSeleccionado,
          nivel: s.nivel,
          xp: s.xp,
          hp_actual: Math.round(s.hp),
          durabilidad_actual: s.durabilidad,
          oro: s.oro,
          jefes_derrotados: (s.piso - 1) + (s.escaleraAbierta ? 1 : 0)
        })
      });
    } catch (e) {
      console.warn('Progreso guardado localmente.', e);
    }
  };

  const handleAccionDialogo = (accion, costoOro) => {
    if (!engineRef.current) return null;

    if (costoOro > 0) {
      if (engineRef.current.oro < costoOro) {
        return { error: true, mensaje: 'No tienes suficiente oro' };
      }
      engineRef.current.oro -= costoOro;
      setStats(prev => ({ ...prev, oro: engineRef.current.oro }));
    }

    if (accion === 'revelar_seguridad') {
      engineRef.current.revelarMinimapa('seguridad');
      return { mensaje: 'Santuario y Escalera trazados con éxito en el mapa.' };
    }
    if (accion === 'revelar_completo') {
      engineRef.current.revelarMinimapa('completo');
      return { mensaje: 'Todo el plano del piso ha sido revelado.' };
    }
    if (accion === 'pocion_vida') {
      engineRef.current.curarJugador(80);
      return { mensaje: '¡Recuperaste +80 puntos de vida con la poción de Delo!' };
    }
    if (accion === 'buff_morfi') {
      engineRef.current.aplicarBuffMorfi();
      return { mensaje: '¡Empanada halfling consumida! Regeneración continua activa (30s).' };
    }
    if (accion === 'reparar_arma') {
      engineRef.current.repararArma(35);
      return { mensaje: '¡Piedra de afilar aplicada! +35 durabilidad de arma.' };
    }
    if (accion === 'buff_fuerza') {
      engineRef.current.aplicarBuffFuerza(60);
      return { mensaje: '¡Furia de Ayrton activada (+50% daño por 60s)!' };
    }
    if (accion === 'buff_velocidad') {
      engineRef.current.aplicarBuffVelocidad(60);
      return { mensaje: '¡Táctica de Javier activada (+30% velocidad por 60s)!' };
    }
    if (accion === 'tirar_dados_keith') {
      return engineRef.current.tirarDadosKeith();
    }
    if (accion === 'aportar_gremio') {
      return { mensaje: '¡Oro transferido al fondo de reserva de la Asociación!' };
    }
    if (accion && accion.startsWith('abrir_tienda')) {
      setNpcDialogoActivo(null);
      setSubpestanaInventario('tienda');
      setModalInventarioVE(true);
      return { mensaje: 'Abriendo tienda de suministros del gremio...' };
    }

    return null;
  };

  const mostrarNotificacionToast = (notif) => {
    setMensajeAlerta(notif);
    setTimeout(() => {
      setMensajeAlerta(null);
    }, 4500);
  };

  const seleccionarClaseYGenero = (claseId, gen) => {
    setClaseSeleccionada(claseId);
    setGeneroSeleccionado(gen);
    localStorage.setItem('crawler_clase', claseId);
    localStorage.setItem('crawler_genero', gen);

    if (engineRef.current) {
      engineRef.current.setClase(claseId, gen);
    }
  };

  const vincularAvatarAlGremio = async () => {
    const avatarKey = `crawler:${claseSeleccionada}_${generoSeleccionado}`;
    try {
      const res = await fetchProtegido('/api/usuarios/perfil', {
        method: 'PUT',
        body: JSON.stringify({
          nombre: usuarioLogueado.nombre,
          nombre_completo: usuarioLogueado.nombre_completo,
          email: usuarioLogueado.email,
          avatar: avatarKey
        })
      });

      if (res.ok) {
        const uActualizado = { ...usuarioLogueado, avatar: avatarKey };
        localStorage.setItem('usuario', JSON.stringify(uActualizado));
        if (alActualizarUsuario) alActualizarUsuario(uActualizado);

        Swal.fire({
          title: '¡Avatar de la Cripta Forjado!',
          text: `Ahora tu héroe pixel art es tu imagen de perfil en todo el Gremio.`,
          icon: 'success',
          background: '#09090b',
          color: '#ffffff',
          confirmButtonColor: '#10b981'
        });
        setModalPersonaje(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (contenedorRef.current?.requestFullscreen) {
        contenedorRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleMute = () => {
    const m = sound.toggleMute();
    setSonidoSilenciado(m);
  };

  // Acciones táctiles para móvil
  const simularTecla = (tecla, estado) => {
    if (engineRef.current) {
      engineRef.current.teclas[tecla.toLowerCase()] = estado;
    }
  };

  const statsVE = useMemo(() => {
    if (!personajeVE) return null;
    return calcularEstadisticasPersonaje(personajeVE);
  }, [personajeVE]);

  const esCaster = (personajeVE?.clase || claseSeleccionada) === 'hechicero' || (personajeVE?.clase || claseSeleccionada) === 'clerigo';
  const pvMaxCalculado = statsVE?.pvMax || statsVE?.pv || stats.maxHp || 8;
  const pvActualCalculado = stats.hp !== undefined ? Math.round(stats.hp) : (personajeVE?.pvActual || pvMaxCalculado);
  const hpPorcentaje = Math.max(0, Math.min(100, (pvActualCalculado / pvMaxCalculado) * 100));

  const pxObjetivo = (personajeVE?.clase || claseSeleccionada) === 'bribon' ? 1500 : ((personajeVE?.clase || claseSeleccionada) === 'hechicero' ? 2500 : ((personajeVE?.clase || claseSeleccionada) === 'clerigo' ? 1500 : 2000));
  const pxActual = personajeVE?.px || stats.xp || 0;
  const pxPorcentaje = Math.min(100, Math.round((pxActual / pxObjetivo) * 100));

  const podMax = statsVE?.pod || stats.maxRecurso || 1;
  const podActual = stats.recurso !== undefined ? stats.recurso : (personajeVE?.podActual || podMax);
  const podPorcentaje = Math.min(100, Math.round((podActual / Math.max(1, podMax)) * 100));

  const armaActiva = useMemo(() => {
    return personajeVE?.armas?.[0] || { nombre: 'Espada Larga', dado: '1d8', tipo: 'CaC' };
  }, [personajeVE]);

  const durabilidadPorcentaje = Math.max(0, Math.min(100, (stats.durabilidad / stats.maxDurabilidad) * 100));
  const datosClaseActual = CLASES[claseSeleccionada] || CLASES.guerrero;

  return (
    <div 
      ref={contenedorRef}
      className={`w-full flex flex-col items-center select-none bg-zinc-950 ${
        esFullscreen ? 'fixed inset-0 z-50 p-0' : 'pt-2 pb-6 px-2 sm:px-4'
      }`}
    >
      {/* PANTALLA DE CARGA */}
      {cargandoAssets && (
        <div className="fixed inset-0 bg-zinc-950/95 flex flex-col items-center justify-center z-50 p-6">
          <div className="text-4xl mb-4 animate-bounce">💀</div>
          <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest mb-2">
            Adentrándose en la Cripta del Nigromante...
          </h2>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-6">
            Invocando sprites y mazmorras procedimentales ({progresoCarga}%)
          </p>
          <div className="w-64 h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${progresoCarga}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className={`w-full ${esFullscreen ? 'h-full flex flex-col' : 'max-w-6xl'} bg-zinc-950 border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden relative`}>
        
        {/* BARRA SUPERIOR: PISO, BIOMA, JEFE, PANTALLA COMPLETA Y SALIDA */}
        <div className="bg-zinc-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5 z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl">💀</span>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                  Gran Cripta West Marches
                </span>
                {stats.enSantuario && (
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                    🔥 Campamento de la Asociación
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-bold mt-0.5">
                Mega-Dungeon Contínua • Asociación de Rol La Pampa
              </p>
            </div>
          </div>

          {/* BARRA DEL JEFE (Solo si está vivo y a rango del jugador) */}
          {stats.jefeHP > 0 && (
            <div className="flex-1 max-w-xs sm:max-w-md mx-auto px-2 flex flex-col items-center animate-in fade-in duration-200">
              <div className="flex justify-between w-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">
                <span>👑 {stats.jefeNombre}</span>
                <span>{stats.jefeHP} / {stats.jefeMaxHP} HP</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 border border-red-500/30 rounded-full overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150"
                  style={{ width: `${(stats.jefeHP / stats.jefeMaxHP) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* ACCIONES SUPERIORES */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setSubpestanaInventario('inventario');
                setModalInventarioVE(true);
              }}
              className="text-xs font-bold text-amber-200 hover:text-white bg-amber-950/80 hover:bg-amber-900 px-2.5 py-1.5 rounded-xl border border-amber-600/60 transition-all flex items-center gap-1.5 shadow"
              title="Abrir Inventario & Mochila de Aventurero (I)"
            >
              <span>🎒</span>
              <span className="hidden sm:inline">
                Inventario ({(personajeVE?.equipo?.length || 0)}/{(personajeVE?.atributos?.fue || 10)})
              </span>
            </button>

            <button
              onClick={() => {
                setSubpestanaInventario('tienda');
                setModalInventarioVE(true);
              }}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shadow ${
                stats.enSantuario
                  ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border-emerald-500 animate-pulse'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border-stone-700'
              }`}
              title="Comprar pociones, armas y armaduras a miembros de la Asociación"
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Tienda</span>
            </button>

            <button
              onClick={() => setPanelExploradores(true)}
              className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/70 hover:bg-emerald-900/80 px-2.5 py-1.5 rounded-xl border border-emerald-600/50 transition-all flex items-center gap-1.5 shadow"
              title="Aventureros explorando la Cripta ahora"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>🧭</span>
              <span className="hidden sm:inline">Exploradores ({exploradoresOnline.length})</span>
            </button>

            <button
              onClick={() => setPanelParty(true)}
              className="text-xs font-bold text-blue-300 hover:text-white bg-blue-950/70 hover:bg-blue-900/80 px-2.5 py-1.5 rounded-xl border border-blue-600/50 transition-all flex items-center gap-1.5 shadow"
              title="Compañía Aventurera (Party)"
            >
              <span>🛡️</span>
              <span className="hidden sm:inline">Compañía ({party.length}/4)</span>
            </button>

            <button
              onClick={() => setModalHojaVE(true)}
              className="text-xs font-bold text-amber-300 hover:text-white bg-amber-950/70 hover:bg-amber-900/80 px-2.5 py-1.5 rounded-xl border border-amber-600/50 transition-all flex items-center gap-1.5 shadow"
              title="Abrir Hoja de Personaje oficial (Vieja Escuela OSR)"
            >
              <span>📜</span>
              <span className="hidden sm:inline">Hoja de Rol</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-xl border border-zinc-700 transition-all flex items-center gap-1"
              title="Alternar Pantalla Completa"
            >
              <span>{esFullscreen ? '🗗' : '⛶'}</span>
              <span className="hidden sm:inline">{esFullscreen ? 'Ventana' : 'Pantalla Completa'}</span>
            </button>
            <button
              onClick={handlePreguntarNuevoHeroe}
              className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/70 hover:bg-emerald-900/80 px-2.5 py-1.5 rounded-xl border border-emerald-600/50 transition-all flex items-center gap-1.5 shadow"
              title="Forjar un nuevo héroe desde cero (Reinicia al Piso 1)"
            >
              <span>✨</span>
              <span className="hidden sm:inline">Nuevo Héroe</span>
            </button>
            <button
              onClick={toggleMute}
              className="text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-xl border border-zinc-700 transition-all"
              title={sonidoSilenciado ? 'Activar Sonido' : 'Silenciar'}
            >
              {sonidoSilenciado ? '🔇' : '🔊'}
            </button>
            <button
              onClick={volver}
              className="text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/20 transition-all flex items-center gap-1"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* LIENZO DEL JUEGO (CANVAS) */}
        <div className={`relative w-full overflow-hidden bg-black flex items-center justify-center ${esFullscreen ? 'flex-1' : 'min-h-[480px]'}`}>
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* NOTIFICACIÓN TOAST FLOTANTE */}
          {mensajeAlerta && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-emerald-500/50 backdrop-blur-md px-4 py-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-center animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none z-20 max-w-sm">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-tight">
                {mensajeAlerta.titulo}
              </h4>
              <p className="text-[11px] text-zinc-300 font-bold mt-0.5 leading-tight">
                {mensajeAlerta.mensaje}
              </p>
            </div>
          )}

          {/* ACCIÓN CONTEXTUAL DE FORJA / HOGUERA EN MÓVIL O PC */}
          {stats.cercaForja && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-zinc-900/95 border border-amber-500 p-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 z-20">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">🔨 Forja del Gremio</span>
                <p className="text-xs text-white font-bold">Reparar {datosClaseActual.nombreArma}</p>
                <span className="text-[10px] text-zinc-400">Costo: 5 Materiales + 10 Oro (+35 Durabilidad)</span>
              </div>
              <button
                onClick={() => engineRef.current?.usarForja()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
              >
                Forjar [F]
              </button>
            </div>
          )}

          {/* CONTROLES TÁCTILES PARA MÓVIL (VIRTUAL D-PAD & ACTION BUTTONS) */}
          {esDispositivoTactil && (
            <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-4 z-20">
              {/* D-PAD TÁCTIL (IZQUIERDA) */}
              <div className="grid grid-cols-3 gap-1 pointer-events-auto bg-zinc-950/60 p-2 rounded-2xl backdrop-blur-sm border border-zinc-800">
                <div></div>
                <button
                  onTouchStart={() => simularTecla('w', true)}
                  onTouchEnd={() => simularTecla('w', false)}
                  className="w-12 h-12 bg-zinc-800/80 active:bg-emerald-500 text-white rounded-xl font-black text-lg flex items-center justify-center border border-zinc-700"
                >
                  ▲
                </button>
                <div></div>

                <button
                  onTouchStart={() => simularTecla('a', true)}
                  onTouchEnd={() => simularTecla('a', false)}
                  className="w-12 h-12 bg-zinc-800/80 active:bg-emerald-500 text-white rounded-xl font-black text-lg flex items-center justify-center border border-zinc-700"
                >
                  ◀
                </button>
                <div className="w-12 h-12 flex items-center justify-center text-zinc-600 font-black text-xs">
                  🕹️
                </div>
                <button
                  onTouchStart={() => simularTecla('d', true)}
                  onTouchEnd={() => simularTecla('d', false)}
                  className="w-12 h-12 bg-zinc-800/80 active:bg-emerald-500 text-white rounded-xl font-black text-lg flex items-center justify-center border border-zinc-700"
                >
                  ▶
                </button>

                <div></div>
                <button
                  onTouchStart={() => simularTecla('s', true)}
                  onTouchEnd={() => simularTecla('s', false)}
                  className="w-12 h-12 bg-zinc-800/80 active:bg-emerald-500 text-white rounded-xl font-black text-lg flex items-center justify-center border border-zinc-700"
                >
                  ▼
                </button>
                <div></div>
              </div>

              {/* BOTONES DE ACCIÓN TÁCTIL (DERECHA) */}
              <div className="flex flex-col gap-2 pointer-events-auto items-end">
                <div className="flex gap-2">
                  <button
                    onTouchStart={() => engineRef.current?.ejecutarDash()}
                    className="w-13 h-13 bg-indigo-600 active:bg-indigo-500 text-white rounded-2xl font-black text-xs flex flex-col items-center justify-center shadow-lg border border-indigo-400"
                  >
                    <span>⚡</span>
                    <span className="text-[8px] uppercase">Dash</span>
                  </button>
                  <button
                    onTouchStart={() => engineRef.current?.interactuar()}
                    className="w-13 h-13 bg-amber-600 active:bg-amber-500 text-white rounded-2xl font-black text-xs flex flex-col items-center justify-center shadow-lg border border-amber-400"
                  >
                    <span>🔥</span>
                    <span className="text-[8px] uppercase">Usar</span>
                  </button>
                </div>
                <button
                  onTouchStart={() => engineRef.current?.atacar()}
                  className="w-20 h-20 bg-red-600 active:bg-red-500 text-white rounded-3xl font-black text-base flex flex-col items-center justify-center shadow-2xl border-2 border-red-400"
                >
                  <span className="text-2xl">⚔️</span>
                  <span className="text-[9px] uppercase tracking-wider">Atacar</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTROLES / AYUDA TECLADO (PC) */}
          {!esDispositivoTactil && (
            <div className="absolute bottom-2 left-3 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 px-2.5 py-1 rounded-xl text-[9px] text-zinc-400 font-bold uppercase tracking-wider pointer-events-none hidden sm:flex items-center gap-2.5 z-10 shadow-lg">
              <span>⌨️ WASD</span>
              <span>🖱️ Clic</span>
              <span>⚡ Espacio</span>
              <span>🚪 [E] Abrir</span>
              <span>🎒 [I] Mochila</span>
            </div>
          )}
        </div>

        {/* HUD INFERIOR: ESTADÍSTICAS OFICIALES VIEJA ESCUELA OSR */}
        <div className="bg-zinc-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 z-10">
          
          {/* IDENTIDAD DEL HÉROE */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-zinc-950 rounded-2xl border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden shadow-inner relative shrink-0">
              <img
                src={`/assets/crawler/heroes/${
                  (personajeVE?.clase || claseSeleccionada) === 'guerrero' ? 'knight' : (personajeVE?.clase || claseSeleccionada) === 'hechicero' || (personajeVE?.clase || claseSeleccionada) === 'mago' ? 'wizzard' : 'elf'
                }_${generoSeleccionado}_idle_anim_f0.png`}
                alt="Avatar"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white uppercase italic">
                  {personajeVE?.nombre || usuarioLogueado?.nombre}
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Nvl {personajeVE?.nivel || stats.nivel || 1}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {personajeVE?.raza?.toUpperCase() || ''} {personajeVE?.clase?.toUpperCase() || datosClaseActual.nombre}
              </p>
            </div>
          </div>

          {/* BARRAS OFICIALES VIEJA ESCUELA: PV Y POD/PX */}
          <div className="flex-1 max-w-xs sm:max-w-sm flex flex-col gap-1">
            {/* PUNTOS DE VIDA (PV) */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-400 mb-0.5">
                <span>❤️ Puntos de Vida (PV)</span>
                <span>{pvActualCalculado} / {pvMaxCalculado}</span>
              </div>
              <div className="w-full h-2.5 sm:h-3 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-150"
                  style={{ width: `${hpPorcentaje}%` }}
                ></div>
              </div>
            </div>

            {/* SEGUNDA BARRA: POD PARA HECHICEROS/CLÉRIGOS O PX PARA GUERRERO/BRIBÓN */}
            {esCaster ? (
              <div className="flex flex-col">
                <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-0.5">
                  <span>🔮 Puntos de Poder (POD)</span>
                  <span>{podActual} / {podMax}</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-150"
                    style={{ width: `${podPorcentaje}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400 mb-0.5">
                  <span>✨ Experiencia (PX)</span>
                  <span>{pxActual} / {pxObjetivo} PX</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-150"
                    style={{ width: `${pxPorcentaje}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* EQUIPO TÁCTICO: DEFENSA (CA), ARMA ACTIVA Y MOVIMIENTO */}
          <div className="flex items-center gap-2.5 bg-zinc-950 px-3 py-1.5 rounded-2xl border border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-base">
              🛡️
            </div>
            <div className="flex flex-col min-w-[105px]">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-amber-300 mb-0.5">
                <span>CA: {stats.def || statsVE?.def || 13}</span>
                <span className="text-zinc-400">Mov: {stats.mov || statsVE?.mov || 12}m</span>
              </div>
              <div className="text-[10px] text-zinc-300 font-bold truncate max-w-[130px]" title={armaActiva.nombre}>
                ⚔️ {armaActiva.nombre} ({armaActiva.dado})
              </div>
            </div>
          </div>

          {/* MONEDAS Y MOCHILA */}
          <div className="flex items-center gap-2 text-xs font-black">
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20 text-amber-400" title="Monedas de Oro">
              <span>🪙</span>
              <span>{personajeVE?.monedas?.mo ?? stats.oro ?? 30} <span className="text-[9px] text-amber-500/70">MO</span></span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-stone-300" title="Monedas de Plata">
              <span>⚪</span>
              <span>{personajeVE?.monedas?.mp ?? 15} <span className="text-[9px] text-stone-500">MP</span></span>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DE SELECCIÓN DE CLASE & AVATAR */}
      {modalPersonaje && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 max-w-2xl w-full rounded-3xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  🧙‍♂️ Forja de tu Héroe & Avatar
                </h3>
                <p className="text-xs text-zinc-400">
                  Elige tu clase D&D para la Cripta. Puedes vincular este héroe como tu avatar en todo el Gremio.
                </p>
              </div>
              <button
                onClick={() => setModalPersonaje(false)}
                className="text-zinc-500 hover:text-white w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 justify-center">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Variante:</span>
              <button
                onClick={() => seleccionarClaseYGenero(claseSeleccionada, 'm')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  generoSeleccionado === 'm'
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                Masculino
              </button>
              <button
                onClick={() => seleccionarClaseYGenero(claseSeleccionada, 'f')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  generoSeleccionado === 'f'
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                Femenino
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(CLASES).map(([id, info]) => {
                const esActivo = claseSeleccionada === id;
                const spriteNombre = id === 'guerrero' ? 'knight' : id === 'mago' ? 'wizzard' : 'elf';
                return (
                  <div
                    key={id}
                    onClick={() => seleccionarClaseYGenero(id, generoSeleccionado)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
                      esActivo
                        ? 'bg-zinc-800/90 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                  >
                    {esActivo && (
                      <span className="absolute top-2 right-2 text-emerald-400 text-xs font-black">✓</span>
                    )}

                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-3">
                      <img
                        src={`/assets/crawler/heroes/${spriteNombre}_${generoSeleccionado}_idle_anim_f0.png`}
                        alt={info.nombre}
                        className="w-12 h-12 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>

                    <h4 className="text-sm font-black text-white uppercase">{info.nombre}</h4>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
                      {info.rolDnd}
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      {info.descripcion}
                    </p>

                    <div className="w-full text-[10px] font-bold text-zinc-500 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 flex flex-col gap-0.5 text-left">
                      <span className="text-zinc-300">❤️ Vida: {info.maxHp}</span>
                      <span className="text-zinc-300">🗡️ {info.nombreArma}</span>
                      <span className="text-zinc-300">🧱 Material: {info.nombreMaterial}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  setModalPersonaje(false);
                  setModalHojaVE(true);
                }}
                className="bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-600/50 font-bold text-xs uppercase tracking-widest px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <span>📜</span> Hoja Vieja Escuela
              </button>
              {usuarioLogueado?.rol === 'admin' && (
                <button
                  onClick={vincularAvatarAlGremio}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>⚔️</span> Establecer como mi Avatar del Gremio
                </button>
              )}
              <button
                onClick={() => setModalPersonaje(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
              >
                Jugar con esta Clase
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cuadro de Diálogo Interactivo con NPCs de la Asociación */}
      {npcDialogoActivo && (
        <CuadroDialogo
          npc={npcDialogoActivo}
          jugadorOro={stats.oro}
          onEjecutarAccion={handleAccionDialogo}
          onCerrar={() => setNpcDialogoActivo(null)}
        />
      )}

      {/* MODAL: AVENTUREROS CONECTADOS EN LA CRIPTA */}
      {panelExploradores && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-stone-950 border border-stone-800 max-w-lg w-full rounded-3xl p-5 shadow-2xl text-stone-200">
            <div className="flex justify-between items-center pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧭</span>
                <div>
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                    Aventureros en la Mazmorra ({exploradoresOnline.length})
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Jugadores explorando en tiempo real la Gran Cripta.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPanelExploradores(false)}
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto mb-4 scrollbar-thin">
              {exploradoresOnline.length === 0 ? (
                <div className="text-center py-6 text-xs text-stone-500">
                  No hay otros aventureros conectados en este momento.
                </div>
              ) : (
                exploradoresOnline.map((exp) => {
                  const esYo = exp.usuarioId === usuarioLogueado?.id;
                  const enParty = party.some(p => p.id === exp.usuarioId);

                  return (
                    <div
                      key={exp.usuarioId}
                      className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-sm font-bold text-amber-300">
                          {exp.avatar ? (
                            <img src={exp.avatar} alt={exp.nombre} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            exp.nombre?.charAt(0).toUpperCase() || 'A'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-100">{exp.nombre}</span>
                            {esYo && (
                              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                                Vos
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-400 capitalize">
                            {exp.clase} • Nivel {exp.nivel || 1} • Sector {exp.sector || 1}
                          </p>
                        </div>
                      </div>

                      {!esYo && (
                        <button
                          onClick={() => invitarAventurero(exp)}
                          disabled={enParty}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                            enParty
                              ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                              : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border-emerald-600/50'
                          }`}
                        >
                          {enParty ? 'En Grupo' : '➕ Invitar'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setPanelExploradores(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs uppercase rounded-xl border border-stone-800 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: GESTIÓN DE COMPAÑÍA AVENTURERA (PARTY) */}
      {panelParty && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-stone-950 border border-stone-800 max-w-lg w-full rounded-3xl p-5 shadow-2xl text-stone-200">
            <div className="flex justify-between items-center pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">
                    Compañía Aventurera ({party.length}/4)
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Tu grupo de exploración táctica estilo West Marches.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPanelParty(false)}
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* MIEMBROS ACTUALES */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">
                Miembros del Grupo:
              </span>
              {party.map((m) => (
                <div
                  key={m.id}
                  className="bg-stone-900/90 border border-stone-800 rounded-2xl p-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.esLider ? '👑' : '🛡️'}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-100">{m.nombre}</span>
                        {m.esNPC && (
                          <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800">
                            Asociación
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 capitalize">
                        {m.clase} • Nivel {m.nivel || 1} {m.rol ? `• ${m.rol}` : ''}
                      </p>
                    </div>
                  </div>

                  {!m.esLider && (
                    <button
                      onClick={() => expulsarDeParty(m.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 px-2 py-1 rounded-lg border border-red-800 transition"
                    >
                      Expulsar
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* RECLUTAR MIEMBROS DE LA ASOCIACIÓN */}
            <div className="border-t border-stone-800/80 pt-3 mb-4">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block mb-2">
                Reclutar Aliados de la Asociación de Rol:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => reclutarCompaneroNPC('martin')}
                  className="p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-blue-500/50 rounded-xl text-left transition"
                >
                  <div className="text-xs font-bold text-blue-300">⚔️ Martín</div>
                  <div className="text-[9px] text-stone-400">Guerrero de Vanguardia</div>
                </button>
                <button
                  onClick={() => reclutarCompaneroNPC('ayrton')}
                  className="p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-red-500/50 rounded-xl text-left transition"
                >
                  <div className="text-xs font-bold text-red-300">🪓 Ayrton</div>
                  <div className="text-[9px] text-stone-400">Bárbaro Mercenario</div>
                </button>
                <button
                  onClick={() => reclutarCompaneroNPC('delo')}
                  className="p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-emerald-500/50 rounded-xl text-left transition"
                >
                  <div className="text-xs font-bold text-emerald-300">🧪 Delo</div>
                  <div className="text-[9px] text-stone-400">Alquimista Halfling</div>
                </button>
                <button
                  onClick={() => reclutarCompaneroNPC('diny')}
                  className="p-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 rounded-xl text-left transition"
                >
                  <div className="text-xs font-bold text-amber-300">🗺️ Diny</div>
                  <div className="text-[9px] text-stone-400">Cartógrafa Enana</div>
                </button>
              </div>
            </div>

            <button
              onClick={() => setPanelParty(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs uppercase rounded-xl border border-stone-800 transition"
            >
              Confirmar Formación
            </button>
          </div>
        </div>
      )}


      {/* Modal Pantalla Completa: Creación de Personaje Vieja Escuela */}
      {modalCreacionVE && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto animate-in fade-in duration-200 flex items-center justify-center p-3 sm:p-6">
          <CreacionPersonajeVE
            usuarioLogueado={usuarioLogueado}
            alCancelar={() => setModalCreacionVE(false)}
            alCrearPersonaje={iniciarAventuraConPersonaje}
          />
        </div>
      )}

      {/* Modal de Combate por Turnos Oficial Vieja Escuela */}
      {encuentroCombate && (
        <CombatePorTurnosVE
          enemigo={encuentroCombate.enemigo}
          enemigos={encuentroCombate.enemigos}
          personaje={encuentroCombate.personaje || personajeVE}
          party={party}
          onFinalizarCombate={handleFinalizarCombate}
          onHuir={handleHuirCombate}
        />
      )}

      {/* MODAL NATIVO DE MUERTE: SIEMPRE VISIBLE EN PANTALLA COMPLETA */}
      {modalMuerte && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-stone-950 border-2 border-amber-600/70 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center text-stone-200">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-4 bg-stone-900 p-1">
              <img
                src="/assets/crawler/portraits/npc_angel_portrait.png"
                alt="El Guardián del Umbral"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <h3 className="text-base font-black text-amber-300 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <span>🕯️</span> {modalMuerte.titulo || '¡RESGUARDADO POR EL GUARDIÁN!'}
            </h3>
            <p className="text-xs text-stone-300 mb-6 leading-relaxed">
              {modalMuerte.mensaje}
            </p>
            <button
              onClick={() => {
                setModalMuerte(null);
                if (engineRef.current) {
                  engineRef.current.pausado = false;
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition active:scale-95"
            >
              Regresar al Santuario
            </button>
          </div>
        </div>
      )}

      {/* MODAL NATIVO DE JEFE DERROTADO: SIEMPRE VISIBLE EN PANTALLA COMPLETA */}
      {modalJefeDerrotado && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-stone-950 border-2 border-emerald-500/70 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center text-stone-200">
            <span className="text-4xl mb-3">👑</span>
            <h3 className="text-base font-black text-emerald-300 uppercase tracking-widest mb-2">
              ¡CUSTODIO DERROTADO!
            </h3>
            <p className="text-xs text-stone-300 mb-6 leading-relaxed">
              Has vencido a <strong>{modalJefeDerrotado.nombre}</strong>. El Sello Mágico se ha disipado y la gran Cripta reconoce tu valentía.
            </p>
            <button
              onClick={() => setModalJefeDerrotado(null)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition active:scale-95"
            >
              Continuar Exploración
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE INVENTARIO Y TIENDA OFICIAL VIEJA ESCUELA */}
      {modalInventarioVE && (
        <InventarioVE
          personaje={personajeVE || cargarPersonajeLocal()}
          alActualizarPersonaje={(nuevoPj) => {
            setPersonajeVE({ ...nuevoPj });
            if (engineRef.current) {
              engineRef.current.sincronizarConPersonajeVE(nuevoPj);
            }
          }}
          alCerrar={() => setModalInventarioVE(false)}
          engine={engineRef.current}
          modoInicial={subpestanaInventario}
          onMostrarMensaje={(msg) => mostrarNotificacionToast(msg)}
        />
      )}

      {/* Modal Pantalla Completa: Hoja de Personaje Oficial Vieja Escuela */}
      {modalHojaVE && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="min-h-full py-2">
            <HojaPersonajeVE
              usuarioLogueado={usuarioLogueado}
              alCerrar={() => setModalHojaVE(false)}
              alVincularConJuego={(pjVE) => {
                setPersonajeVE({ ...pjVE });
                if (pjVE.clase) {
                  seleccionarClaseYGenero(pjVE.clase, generoSeleccionado);
                }
                if (engineRef.current) {
                  engineRef.current.sincronizarConPersonajeVE(pjVE);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
