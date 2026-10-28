import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { GameEngine, CLASES } from './GameEngine';
import { assets } from './AssetManager';
import { sound } from './SoundEngine';
import { fetchProtegido } from '../../utils/api';

export default function CriptaJuego({ usuarioLogueado, alActualizarUsuario, volver }) {
  const canvasRef = useRef(null);
  const contenedorRef = useRef(null);
  const engineRef = useRef(null);

  // Estados de carga e interfaz
  const [cargandoAssets, setCargandoAssets] = useState(true);
  const [progresoCarga, setProgresoCarga] = useState(0);
  const [modalPersonaje, setModalPersonaje] = useState(false);
  const [sonidoSilenciado, setSonidoSilenciado] = useState(false);
  const [esFullscreen, setEsFullscreen] = useState(false);
  const [esDispositivoTactil, setEsDispositivoTactil] = useState(false);

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
    xpSiguiente: 100,
    hp: 160,
    maxHp: 160,
    recurso: 50,
    maxRecurso: 50,
    durabilidad: 70,
    maxDurabilidad: 70,
    armaRota: false,
    oro: 0,
    materiales: 8,
    llaves: 0,
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

  // 2. Precargar Assets
  useEffect(() => {
    let montado = true;
    assets.precargarTodo((progreso) => {
      if (montado) setProgresoCarga(progreso);
    }).then(() => {
      if (montado) {
        setCargandoAssets(false);
        if (!localStorage.getItem('crawler_clase')) {
          setModalPersonaje(true);
        }
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
      onActualizarStats: (nuevasStats) => {
        setStats(nuevasStats);
        if (nuevasStats.guardarEnDB) {
          guardarProgresoEnStorage(nuevasStats);
        }
      },
      onNotificacion: (notif) => {
        mostrarNotificacionToast(notif);
      },
      onMuerte: (data) => {
        Swal.fire({
          title: data.expulsado ? '⚠️ ¡Expulsado de la Cripta!' : '💀 ¡Caído en Combate!',
          text: data.expulsado 
            ? `Caíste sin haber descubierto el Santuario de este piso. Has sido devuelto al Santuario del Piso ${data.piso - 1}. Tu arma se ha quebrado.`
            : `Has sido rescatado por la Hoguera Sagrada. Tu arma se ha partido y perdiste ${data.oroPerdido} monedas.`,
          icon: 'warning',
          background: '#09090b',
          color: '#ffffff',
          confirmButtonText: 'Continuar Aventura',
          confirmButtonColor: '#ef4444'
        });
      },
      onJefeDerrotado: (data) => {
        Swal.fire({
          title: '👑 ¡JEFE DERROTADO!',
          text: `Has vencido a ${data.nombre}. El Sello Mágico se ha disipado y la escalera está libre.`,
          icon: 'success',
          background: '#09090b',
          color: '#ffffff',
          confirmButtonText: '¡Descender!',
          confirmButtonColor: '#10b981'
        });
      },
      onCambioPiso: (nuevoPiso) => {
        localStorage.setItem('crawler_piso', nuevoPiso);
      }
    });

    engine.start();
    engineRef.current = engine;

    return () => {
      window.removeEventListener('resize', ajustarTamano);
      engine.destroy();
    };
  }, [cargandoAssets]);

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

  const hpPorcentaje = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const recursoPorcentaje = Math.max(0, Math.min(100, (stats.recurso / stats.maxRecurso) * 100));
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
                  Piso {stats.piso} / 100
                </span>
                {stats.enSantuario && (
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                    🔥 Zona Segura
                  </span>
                )}
                {stats.escaleraAbierta && (
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                    🗝️ Escalera Abierta
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-bold mt-0.5">
                {stats.piso === 1 ? 'Catacumbas de Piedra' : stats.piso === 2 ? 'Cripta de la Espora & Hongos' : 'Bóvedas Sumergidas'}
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
              onClick={toggleFullscreen}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-xl border border-zinc-700 transition-all flex items-center gap-1"
              title="Alternar Pantalla Completa"
            >
              <span>{esFullscreen ? '🗗' : '⛶'}</span>
              <span className="hidden sm:inline">{esFullscreen ? 'Ventana' : 'Pantalla Completa'}</span>
            </button>
            <button
              onClick={() => setModalPersonaje(true)}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-xl border border-zinc-700 transition-all flex items-center gap-1"
              title="Cambiar Héroe & Avatar"
            >
              <span>🧙‍♂️</span>
              <span className="hidden sm:inline">Avatar</span>
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
            <div className="absolute bottom-3 left-3 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-xl text-[10px] text-zinc-400 font-bold uppercase tracking-wider pointer-events-none hidden sm:flex items-center gap-3 z-10">
              <span>⌨️ [WASD] Mover</span>
              <span>🖱️ [Clic] Atacar</span>
              <span>⚡ [Espacio] Dash</span>
              <span>🔥 [E] Hoguera/Bajar</span>
              <span>🔨 [F] Forja</span>
            </div>
          )}
        </div>

        {/* HUD INFERIOR: ESTADÍSTICAS DEL HÉROE, ARMA Y MATERIALES */}
        <div className="bg-zinc-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 z-10">
          
          {/* IDENTIDAD DEL HÉROE */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-zinc-950 rounded-2xl border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden shadow-inner relative shrink-0">
              <img
                src={`/assets/crawler/heroes/${
                  claseSeleccionada === 'guerrero' ? 'knight' : claseSeleccionada === 'mago' ? 'wizzard' : 'elf'
                }_${generoSeleccionado}_idle_anim_f0.png`}
                alt="Avatar"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white uppercase italic">
                  {usuarioLogueado?.nombre}
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Nvl {stats.nivel}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {datosClaseActual.nombre}
              </p>
            </div>
          </div>

          {/* BARRAS DE VIDA Y RECURSO */}
          <div className="flex-1 max-w-xs sm:max-w-sm flex flex-col gap-1">
            <div className="flex flex-col">
              <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-400 mb-0.5">
                <span>❤️ Salud</span>
                <span>{Math.round(stats.hp)} / {stats.maxHp}</span>
              </div>
              <div className="w-full h-2.5 sm:h-3 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-150"
                  style={{ width: `${hpPorcentaje}%` }}
                ></div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-0.5">
                <span>{claseSeleccionada === 'mago' ? '🔮 Maná' : '⚡ Estamina'}</span>
                <span>{stats.recurso} / {stats.maxRecurso}</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${claseSeleccionada === 'mago' ? 'bg-indigo-500' : 'bg-amber-500'} transition-all duration-150`}
                  style={{ width: `${recursoPorcentaje}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* DURABILIDAD DEL ARMA (CON ÍCONO CORRECTO RESUELTO) */}
          <div className="flex items-center gap-2.5 bg-zinc-950 px-3 py-1.5 rounded-2xl border border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <img
                src={`/assets/crawler/items/${datosClaseActual.iconoArma}.png`}
                alt="Arma"
                className="w-5 h-5 object-contain"
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col min-w-[95px]">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">
                <span>Durabilidad</span>
                <span className={stats.armaRota ? 'text-red-500 font-black animate-pulse' : 'text-zinc-300'}>
                  {stats.armaRota ? '¡ROTA!' : `${stats.durabilidad}/${stats.maxDurabilidad}`}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    stats.armaRota
                      ? 'bg-red-600'
                      : durabilidadPorcentaje < 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${durabilidadPorcentaje}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* BOTÍN, MATERIALES Y ORO */}
          <div className="flex items-center gap-2 text-xs font-black">
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-zinc-300" title={datosClaseActual.nombreMaterial}>
              <span>🧱</span>
              <span>{stats.materiales}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20 text-amber-400" title="Oro">
              <span>🪙</span>
              <span>{stats.oro}</span>
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
                onClick={vincularAvatarAlGremio}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚔️</span> Establecer como mi Avatar del Gremio
              </button>
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
    </div>
  );
}
