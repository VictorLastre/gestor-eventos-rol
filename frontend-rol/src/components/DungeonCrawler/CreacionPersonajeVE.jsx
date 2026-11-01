import { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  RAZAS_VE,
  CLASES_VE,
  tirarSieteVeces3d6,
  getModificador,
  formatearMod,
  crearPersonajeInicial,
  calcularEstadisticasPersonaje
} from './ViejaEscuelaEngine';

export default function CreacionPersonajeVE({ usuarioLogueado, alCrearPersonaje, alCancelar }) {
  // 1. Estados principales de la creación
  const [nombre, setNombre] = useState(
    usuarioLogueado?.nombre_completo || usuarioLogueado?.apodo || usuarioLogueado?.nombre || 'Valiente Aventurero'
  );
  const [razaSeleccionada, setRazaSeleccionada] = useState('humano');
  const [claseSeleccionada, setClaseSeleccionada] = useState('guerrero');
  const [generoSeleccionado, setGeneroSeleccionado] = useState('m');
  const [trasfondo, setTrasfondo] = useState('Veterano de las Guerras Fronterizas');

  // Atributos iniciales estándar
  const [atributos, setAtributos] = useState({
    fue: 14,
    des: 12,
    con: 13,
    int: 10,
    sab: 10,
    car: 10
  });

  // Tiradas de 3d6 (7 tiradas OSR)
  const [tiradasGuardadas, setTiradasGuardadas] = useState([]);
  const [tirandoDados, setTirandoDados] = useState(false);

  // 2. Mapeo de Sprites según clase y género
  const spriteBase = useMemo(() => {
    switch (claseSeleccionada) {
      case 'guerrero':
        return 'knight';
      case 'hechicero':
        return 'wizzard';
      case 'bribon':
        return 'elf';
      case 'clerigo':
        return 'knight';
      default:
        return 'knight';
    }
  }, [claseSeleccionada]);

  // 3. Crear personaje temporal para previsualizar estadísticas
  const pjPreview = useMemo(() => {
    return crearPersonajeInicial({
      nombre,
      raza: razaSeleccionada,
      clase: claseSeleccionada,
      atributos,
      trasfondos: [trasfondo]
    });
  }, [nombre, razaSeleccionada, claseSeleccionada, atributos, trasfondo]);

  const stats = useMemo(() => {
    return calcularEstadisticasPersonaje(pjPreview);
  }, [pjPreview]);

  // 4. Tirar 3d6 siete veces como indica el manual
  const ejecutarTiradas3d6 = () => {
    setTirandoDados(true);
    setTimeout(() => {
      const tiradas = tirarSieteVeces3d6();
      setTiradasGuardadas(tiradas);
      setTirandoDados(false);
      autoAsignarTiradas(tiradas, claseSeleccionada);
    }, 450);
  };

  // 5. Asignar las mejores tiradas al atributo primordial de la clase
  const autoAsignarTiradas = (tiradas, clase) => {
    const ordenadas = [...tiradas].sort((a, b) => b - a);
    const mejoresSeis = ordenadas.slice(0, 6);

    let nuevosAtr = { fue: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 };

    if (clase === 'guerrero') {
      nuevosAtr = {
        fue: mejoresSeis[0] || 15,
        con: mejoresSeis[1] || 14,
        des: mejoresSeis[2] || 13,
        sab: mejoresSeis[3] || 11,
        car: mejoresSeis[4] || 10,
        int: mejoresSeis[5] || 9
      };
    } else if (clase === 'bribon') {
      nuevosAtr = {
        des: mejoresSeis[0] || 15,
        fue: mejoresSeis[1] || 13,
        con: mejoresSeis[2] || 13,
        car: mejoresSeis[3] || 12,
        int: mejoresSeis[4] || 11,
        sab: mejoresSeis[5] || 9
      };
    } else if (clase === 'hechicero') {
      nuevosAtr = {
        int: mejoresSeis[0] || 16,
        des: mejoresSeis[1] || 13,
        con: mejoresSeis[2] || 12,
        sab: mejoresSeis[3] || 12,
        car: mejoresSeis[4] || 10,
        fue: mejoresSeis[5] || 8
      };
    } else {
      // Clérigo
      nuevosAtr = {
        sab: mejoresSeis[0] || 15,
        con: mejoresSeis[1] || 14,
        fue: mejoresSeis[2] || 13,
        car: mejoresSeis[3] || 12,
        des: mejoresSeis[4] || 10,
        int: mejoresSeis[5] || 9
      };
    }

    setAtributos(nuevosAtr);
  };

  const cambiarAtributoManual = (atr, valor) => {
    const num = Math.max(3, Math.min(18, parseInt(valor, 10) || 10));
    setAtributos(prev => ({ ...prev, [atr]: num }));
  };

  // 6. Confirmar y Comenzar Aventura
  const handleFinalizarCreacion = () => {
    if (!nombre.trim()) {
      Swal.fire({
        title: 'Falta el nombre',
        text: 'Por favor asigna un nombre a tu héroe para que sea recordado en las crónicas.',
        icon: 'warning',
        background: '#1c1917',
        color: '#f5f5f4'
      });
      return;
    }

    const nuevoPjFinal = {
      ...pjPreview,
      nombre: nombre.trim(),
      genero: generoSeleccionado,
      reiniciarAventura: true // Bandera para que el backend reinicie al Piso 1
    };

    alCrearPersonaje(nuevoPjFinal);
  };

  return (
    <div className="bg-stone-950 border border-stone-800 max-w-4xl w-full mx-auto rounded-3xl p-6 sm:p-8 text-stone-200 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Luz decorativa superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* ENCABEZADO */}
      <div className="border-b border-stone-800 pb-5 mb-6 flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div>
          <span className="text-[11px] font-black tracking-widest text-amber-500 uppercase flex items-center gap-1.5 mb-1">
            <span>⚔️</span> Forja de Héroe Oficial • Vieja Escuela OSR
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-200 tracking-wide">
            Crea tu Aventurero
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Personaliza tu raza, clase, tiradas 3d6 y desciende limpio a la Mazmorra desde el Piso 1.
          </p>
        </div>

        {alCancelar && (
          <button
            onClick={alCancelar}
            className="text-stone-500 hover:text-stone-300 w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center transition"
            title="Cerrar"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN BÁSICA (7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. NOMBRE DEL HÉROE */}
          <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl shadow-inner">
            <label className="block text-xs font-black uppercase tracking-wider text-amber-400 mb-2">
              1. Nombre del Aventurero
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Roderick el Valiente"
              className="w-full bg-stone-950 border border-stone-700/80 rounded-xl px-3.5 py-2 text-stone-100 font-bold text-sm focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          {/* 2. ELECCIÓN DE RAZA */}
          <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl">
            <label className="block text-xs font-black uppercase tracking-wider text-amber-400 mb-3">
              2. Elige tu Raza
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(RAZAS_VE).map(([id, r]) => {
                const activa = razaSeleccionada === id;
                const iconoRaza = id === 'humano' ? '🧔' : id === 'elfo' ? '🧝' : id === 'enano' ? '⛏️' : '🦶';
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRazaSeleccionada(id)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      activa
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-2xl">{iconoRaza}</span>
                    <span className="text-xs font-black uppercase tracking-wider">{r.nombre}</span>
                    <span className="text-[10px] text-stone-500 font-medium">Mov: {r.mov}m</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-amber-300/80 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 mt-3 leading-relaxed">
              <strong>{RAZAS_VE[razaSeleccionada]?.nombre}:</strong> {RAZAS_VE[razaSeleccionada]?.descripcion}
            </p>
          </div>

          {/* 3. ELECCIÓN DE CLASE */}
          <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl">
            <label className="block text-xs font-black uppercase tracking-wider text-amber-400 mb-3">
              3. Elige tu Clase OSR
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(CLASES_VE).map(([id, c]) => {
                const activa = claseSeleccionada === id;
                const iconoClase = id === 'guerrero' ? '🛡️' : id === 'bribon' ? '🗡️' : id === 'hechicero' ? '🔮' : '✝️';
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setClaseSeleccionada(id);
                      if (tiradasGuardadas.length > 0) {
                        autoAsignarTiradas(tiradasGuardadas, id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      activa
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-2xl">{iconoClase}</span>
                    <span className="text-xs font-black uppercase tracking-wider">{c.nombre}</span>
                    <span className="text-[10px] text-stone-500 font-medium">Aguante: {c.daNom}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-emerald-300/80 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 mt-3 leading-relaxed">
              <strong>{CLASES_VE[claseSeleccionada]?.nombre}:</strong> {CLASES_VE[claseSeleccionada]?.descripcion}
            </p>
          </div>

          {/* 4. GÉNERO Y AVATAR VISUAL */}
          <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <span className="block text-xs font-black uppercase tracking-wider text-amber-400">
                4. Aspecto Visual
              </span>
              <p className="text-[11px] text-stone-400">
                Determina el sprite pixel-art de tu héroe en la mazmorra.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGeneroSeleccionado('m')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                  generoSeleccionado === 'm'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Masculino
              </button>
              <button
                type="button"
                onClick={() => setGeneroSeleccionado('f')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                  generoSeleccionado === 'f'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Femenino
              </button>
            </div>
          </div>

          {/* 5. TRASFONDO DEL AVENTURERO */}
          <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl shadow-inner">
            <label className="block text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
              5. Trasfondo del Aventurero
            </label>
            <p className="text-[11px] text-stone-400 mb-2.5">
              ¿Cuál es la historia u origen de tu héroe antes de descender a la Cripta?
            </p>

            <input
              type="text"
              value={trasfondo}
              onChange={(e) => setTrasfondo(e.target.value)}
              placeholder="Ej: Soldado veterano en busca de honor y redención"
              className="w-full bg-stone-950 border border-stone-700/80 rounded-xl px-3.5 py-2 text-stone-100 font-medium text-xs focus:outline-none focus:border-amber-500 shadow-inner mb-2.5"
            />

            <div className="flex flex-wrap gap-1.5">
              {[
                '⚔️ Soldado veterano',
                '🗝️ Ladrón de tumbas',
                '📜 Erudito de ruinas arcanas',
                '🌲 Cazador y rastreador',
                '⛪ Acólito devoto expulsado',
                '⛓️ Fugitivo de la Mazmorra',
                '🍷 Tabernero arruinado',
                '⚒️ Aprendiz de forja'
              ].map(sug => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setTrasfondo(sug)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition font-medium ${
                    trasfondo === sug
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                      : 'bg-stone-950/50 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: ATRIBUTOS 3D6 Y TARJETA PREVIEW (5 columnas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* TARJETA DE PREVIEW DEL PERSONAJE */}
          <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-900/40 rounded-2xl p-5 shadow-xl text-center relative">
            <div className="w-20 h-20 mx-auto bg-stone-900 rounded-2xl border-2 border-amber-600/40 shadow-inner flex items-center justify-center mb-3">
              <img
                src={`/assets/crawler/heroes/${spriteBase}_${generoSeleccionado}_idle_anim_f0.png`}
                alt={claseSeleccionada}
                className="w-14 h-14 object-contain"
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                  e.target.src = '/assets/crawler/heroes/knight_m_idle_anim_f0.png';
                }}
              />
            </div>

            <h3 className="text-base font-black text-amber-300 uppercase tracking-wide">
              {nombre || 'Sin Nombre'}
            </h3>
            <p className="text-xs text-stone-400">
              {RAZAS_VE[razaSeleccionada]?.nombre} {CLASES_VE[claseSeleccionada]?.nombre} • Nivel 1
            </p>
            <p className="text-[11px] text-amber-300/80 italic mt-1 truncate px-2">
              📜 "{trasfondo || 'Aventurero errante'}"
            </p>

            {/* ESTADÍSTICAS RÁPIDAS DE COMBATE */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-800/80 text-xs font-bold">
              <div className="bg-stone-900/90 p-2 rounded-xl border border-stone-800">
                <span className="block text-[10px] text-red-400 uppercase">P. Vida</span>
                <span className="text-sm font-black text-red-200">{stats.pv} PV</span>
              </div>
              <div className="bg-stone-900/90 p-2 rounded-xl border border-stone-800">
                <span className="block text-[10px] text-blue-400 uppercase">Defensa</span>
                <span className="text-sm font-black text-blue-200">{stats.def} DEF</span>
              </div>
              <div className="bg-stone-900/90 p-2 rounded-xl border border-stone-800">
                <span className="block text-[10px] text-emerald-400 uppercase">Oro Inicial</span>
                <span className="text-sm font-black text-emerald-200">30 MO</span>
              </div>
            </div>
          </div>

          {/* GENERADOR DE ATRIBUTOS 3D6 */}
          <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-amber-400">
                Atributos Oficiales (3d6)
              </label>
              <button
                type="button"
                onClick={ejecutarTiradas3d6}
                disabled={tirandoDados}
                className="px-3 py-1 bg-amber-700/40 hover:bg-amber-600/50 text-amber-300 border border-amber-600/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <span>{tirandoDados ? '🌀' : '🎲'}</span>
                <span>{tirandoDados ? 'Tirando...' : 'Tirar 3d6 (x7)'}</span>
              </button>
            </div>

            {tiradasGuardadas.length > 0 && (
              <div className="mb-3 p-2 bg-stone-950/70 rounded-xl border border-stone-800 text-[11px] text-stone-300 flex items-center justify-between">
                <span>Tiradas: <strong>{tiradasGuardadas.join(', ')}</strong></span>
                <button
                  type="button"
                  onClick={() => autoAsignarTiradas(tiradasGuardadas, claseSeleccionada)}
                  className="text-amber-400 hover:text-amber-300 underline font-bold"
                >
                  Re-optimizar
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'fue', label: 'Fuerza (FUE)' },
                { id: 'des', label: 'Destreza (DES)' },
                { id: 'con', label: 'Constitución (CON)' },
                { id: 'int', label: 'Inteligencia (INT)' },
                { id: 'sab', label: 'Sabiduría (SAB)' },
                { id: 'car', label: 'Carisma (CAR)' }
              ].map(atr => {
                const valor = atributos[atr.id] || 10;
                const mod = getModificador(valor);
                return (
                  <div key={atr.id} className="bg-stone-950/70 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-bold text-stone-400">{atr.label}</span>
                      <span className="text-[10px] font-black text-amber-400">{formatearMod(mod)} mod</span>
                    </div>
                    <input
                      type="number"
                      min={3}
                      max={18}
                      value={valor}
                      onChange={(e) => cambiarAtributoManual(atr.id, e.target.value)}
                      className="w-12 bg-stone-900 border border-stone-700 rounded-lg py-1 text-center font-black text-white focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN FINAL: COMENZAR EN EL PISO 1 */}
          <button
            type="button"
            onClick={handleFinalizarCreacion}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 border border-emerald-400/40"
          >
            <span>🏰</span>
            <span>¡Forjar Héroe y Comenzar en Piso 1!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
