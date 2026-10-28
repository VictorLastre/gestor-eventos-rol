import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { GameEngine, CLASES } from './GameEngine';
import { assets } from './AssetManager';
import { sound } from './SoundEngine';
import { fetchProtegido } from '../../utils/api';

export default function CriptaJuego({ usuarioLogueado, alActualizarUsuario, volver }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Estados de carga e interfaz
  const [cargandoAssets, setCargandoAssets] = useState(true);
  const [progresoCarga, setProgresoCarga] = useState(0);
  const [modalPersonaje, setModalPersonaje] = useState(false);
  const [sonidoSilenciado, setSonidoSilenciado] = useState(false);

  // Clase y Avatar actual
  const [claseSeleccionada, setClaseSeleccionada] = useState(
    localStorage.getItem('crawler_clase') || 'guerrero'
  );
  const [generoSeleccionado, setGeneroSeleccionado] = useState(
    localStorage.getItem('crawler_genero') || 'm'
  );

  // Stats en tiempo real transmitidas desde el GameEngine
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
    llaves: 0,
    enSantuario: false,
    escaleraAbierta: false,
    jefeHP: 0,
    jefeMaxHP: 1,
    jefeNombre: ''
  });

  // Notificación flotante de juego
  const [mensajeAlerta, setMensajeAlerta] = useState(null);

  // 1. Precargar Assets de sprites al montar
  useEffect(() => {
    let montado = true;
    assets.precargarTodo((progreso) => {
      if (montado) setProgresoCarga(progreso);
    }).then(() => {
      if (montado) {
        setCargandoAssets(false);
        // Si no ha elegido personaje antes, abrir modal
        if (!localStorage.getItem('crawler_clase')) {
          setModalPersonaje(true);
        }
      }
    });

    return () => {
      montado = false;
    };
  }, []);

  // 2. Inicializar el GameEngine una vez que los assets están listos
  useEffect(() => {
    if (cargandoAssets || !canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Ajustar dimensiones del canvas
    const ajustarTamano = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = Math.max(500, window.innerHeight - 140);
    };
    ajustarTamano();
    window.addEventListener('resize', ajustarTamano);

    // Guardar / Cargar progreso desde LocalStorage o inicial
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
          title: '💀 ¡Caído en la Cripta!',
          text: `Has sido derrotado. Tu arma se ha partido y has perdido ${data.oroPerdido} monedas al ser rescatado hacia la hoguera.`,
          icon: 'error',
          background: '#09090b',
          color: '#ffffff',
          confirmButtonText: 'Levantarse en el Santuario',
          confirmButtonColor: '#ef4444'
        });
      },
      onJefeDerrotado: (data) => {
        Swal.fire({
          title: '👑 ¡JEFE DERROTADO!',
          text: `Has vencido a ${data.nombre}. El Sello Mágico ha desaparecido y la escalera hacia el piso siguiente está abierta.`,
          icon: 'success',
          background: '#09090b',
          color: '#ffffff',
          confirmButtonText: '¡Avanzar!',
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

    // Sincronización en la base de datos MySQL del Gremio
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
      // Si la red falla, el progreso local persiste
      console.warn('Progreso respaldado en almacenamiento local.', e);
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

  // 3. Vincular Avatar del Héroe al Perfil del Gremio (Base de Datos MySQL)
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
          text: `Ahora tu ${CLASES[claseSeleccionada].nombre} será tu foto de perfil visible en todo el sistema del Gremio.`,
          icon: 'success',
          background: '#09090b',
          color: '#ffffff',
          confirmButtonColor: '#10b981'
        });
        setModalPersonaje(false);
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo vincular el avatar a tu cuenta.',
          icon: 'error',
          background: '#09090b',
          color: '#ffffff'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMute = () => {
    const m = sound.toggleMute();
    setSonidoSilenciado(m);
  };

  // Porcentajes de barras
  const hpPorcentaje = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const recursoPorcentaje = Math.max(0, Math.min(100, (stats.recurso / stats.maxRecurso) * 100));
  const durabilidadPorcentaje = Math.max(0, Math.min(100, (stats.durabilidad / stats.maxDurabilidad) * 100));
  const datosClaseActual = CLASES[claseSeleccionada] || CLASES.guerrero;

  return (
    <div className="w-full flex flex-col items-center select-none pt-2 pb-6 px-2 sm:px-4">
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
      <div className="w-full max-w-6xl flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* BARRA SUPERIOR: PISO, BIOMA, JEFE Y SALIDA */}
        <div className="bg-zinc-900/90 backdrop-blur-md px-4 py-3 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💀</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                  Piso {stats.piso} / 100
                </span>
                {stats.enSantuario && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                    🔥 Zona Segura
                  </span>
                )}
                {stats.escaleraAbierta && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                    🗝️ Escalera Desbloqueada
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-bold mt-0.5">
                {stats.piso === 1 ? 'Catacumbas de Piedra' : stats.piso === 2 ? 'Cripta de la Espora & Hongos' : 'Bóvedas Sumergidas'}
              </p>
            </div>
          </div>

          {/* BARRA DEL JEFE (Si está vivo) */}
          {stats.jefeHP > 0 && (
            <div className="flex-1 max-w-md mx-auto px-4 hidden md:flex flex-col items-center">
              <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">
                <span>👑 {stats.jefeNombre}</span>
                <span>{stats.jefeHP} / {stats.jefeMaxHP} HP</span>
              </div>
              <div className="w-full h-3 bg-zinc-950 border border-red-500/30 rounded-full overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150"
                  style={{ width: `${(stats.jefeHP / stats.jefeMaxHP) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* ACCIONES Y BOTÓN SALIR */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalPersonaje(true)}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5"
              title="Cambiar Clase y Avatar"
            >
              <span>🧙‍♂️</span> Clase & Avatar
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
              className="text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3.5 py-1.5 rounded-xl border border-red-500/20 transition-all flex items-center gap-1"
            >
              <span>🚪</span> Salir
            </button>
          </div>
        </div>

        {/* LIENZO DEL JUEGO (CANVAS) */}
        <div className="relative w-full overflow-hidden bg-black flex items-center justify-center min-h-[500px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* NOTIFICACIÓN TOAST FLOTANTE DENTRO DEL JUEGO */}
          {mensajeAlerta && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-emerald-500/50 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-center animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none z-20">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-tight">
                {mensajeAlerta.titulo}
              </h4>
              <p className="text-[11px] text-zinc-300 font-bold mt-0.5">
                {mensajeAlerta.mensaje}
              </p>
            </div>
          )}

          {/* CONTROLES / AYUDA FLOTANTE EN ESQUINA */}
          <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-xl text-[10px] text-zinc-400 font-bold uppercase tracking-wider pointer-events-none hidden sm:flex items-center gap-3 z-10">
            <span>⌨️ [WASD] Mover</span>
            <span>🖱️ [Clic] Atacar</span>
            <span>⚡ [Espacio] Dash</span>
            <span>🔥 [E] Hoguera / Bajar</span>
          </div>
        </div>

        {/* HUD INFERIOR: ESTADÍSTICAS DEL HÉROE Y ARMA */}
        <div className="bg-zinc-900/95 backdrop-blur-md px-4 py-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 z-10">
          
          {/* IDENTIDAD DEL HÉROE */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-950 rounded-2xl border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden shadow-inner relative">
              <img
                src={`/assets/crawler/heroes/${
                  claseSeleccionada === 'guerrero' ? 'knight' : claseSeleccionada === 'mago' ? 'wizzard' : 'elf'
                }_${generoSeleccionado}_idle_anim_f0.png`}
                alt="Avatar"
                className="w-10 h-10 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white uppercase italic">
                  {usuarioLogueado?.nombre}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Nvl {stats.nivel}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {datosClaseActual.nombre} • {datosClaseActual.rolDnd}
              </p>
            </div>
          </div>

          {/* BARRAS DE VIDA Y RECURSO */}
          <div className="flex-1 max-w-sm flex flex-col gap-1.5">
            {/* SALUD */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-red-400 mb-0.5">
                <span>❤️ Salud</span>
                <span>{Math.round(stats.hp)} / {stats.maxHp}</span>
              </div>
              <div className="w-full h-3 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-150"
                  style={{ width: `${hpPorcentaje}%` }}
                ></div>
              </div>
            </div>

            {/* RECURSO (Maná / Estamina) */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-0.5">
                <span>{claseSeleccionada === 'mago' ? '🔮 Maná' : '⚡ Estamina'}</span>
                <span>{stats.recurso} / {stats.maxRecurso}</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${claseSeleccionada === 'mago' ? 'bg-indigo-500' : 'bg-amber-500'} transition-all duration-150`}
                  style={{ width: `${recursoPorcentaje}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* DURABILIDAD DEL ARMA */}
          <div className="flex items-center gap-3 bg-zinc-950 px-3.5 py-2 rounded-2xl border border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <img
                src={`/assets/crawler/items/${datosClaseActual.iconoArma}.png`}
                alt="Arma"
                className="w-6 h-6 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex flex-col min-w-[110px]">
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

          {/* BOTÍN Y ORO */}
          <div className="flex items-center gap-3 text-amber-400 font-black text-sm">
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
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

            {/* SELECTOR DE GÉNERO */}
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

            {/* TARJETAS DE LAS 3 CLASES */}
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
                      <span className="text-zinc-300">🛡️ Durabilidad: {info.durabilidadMax}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTONES DE CONFIRMACIÓN */}
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
