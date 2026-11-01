import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  RAZAS_VE,
  CLASES_VE,
  HABILIDADES_VE,
  CATALOGO_ARMAS_VE,
  CATALOGO_ARMADURAS_VE,
  CATALOGO_ESCUDOS_VE,
  CONJUROS_VE,
  MIEMBROS_ASOCIACION_VE,
  getModificador,
  formatearMod,
  crearPersonajeInicial,
  calcularEstadisticasPersonaje,
  resolverTiradaD20,
  calcularDanoMedioArma,
  tirarSieteVeces3d6,
  guardarPersonajeLocal,
  cargarPersonajeLocal
} from './ViejaEscuelaEngine';

export default function HojaPersonajeVE({ usuarioLogueado, alCerrar, alVincularConJuego }) {
  // Estado del personaje
  const [pj, setPj] = useState(() => {
    const guardado = cargarPersonajeLocal();
    if (guardado) return guardado;
    return crearPersonajeInicial({
      nombre: usuarioLogueado?.nombre_completo || usuarioLogueado?.apodo || 'Aventurero',
      raza: 'humano',
      clase: 'guerrero'
    });
  });

  // Estadísticas derivadas calculadas
  const [stats, setStats] = useState(() => calcularEstadisticasPersonaje(pj));

  // Modales y estados auxiliares
  const [modalTirada, setModalTirada] = useState(null);
  const [tiradas3d6Disponibles, setTiradas3d6Disponibles] = useState([]);
  const [armaSeleccionada, setArmaSeleccionada] = useState(null);
  const [mostrarAyudaReglas, setMostrarAyudaReglas] = useState(false);
  const [mostrarAliadosAsociacion, setMostrarAliadosAsociacion] = useState(false);

  // Recalcular estadísticas cuando cambia el personaje
  useEffect(() => {
    const s = calcularEstadisticasPersonaje(pj);
    setStats(s);
    guardarPersonajeLocal(pj);
  }, [pj]);

  // Manejador de cambios directos en campos de texto/número
  const actualizarCampo = (campo, valor) => {
    setPj(prev => ({ ...prev, [campo]: valor }));
  };

  const actualizarAtributo = (atr, valor) => {
    const num = Math.max(3, Math.min(18, parseInt(valor, 10) || 10));
    setPj(prev => ({
      ...prev,
      atributos: {
        ...prev.atributos,
        [atr]: num
      }
    }));
  };

  const actualizarHabilidad = (habId, valor) => {
    const num = Math.max(0, Math.min(10, parseInt(valor, 10) || 0));
    setPj(prev => ({
      ...prev,
      habilidades: {
        ...prev.habilidades,
        [habId]: num
      }
    }));
  };

  // Cambiar Raza
  const cambiarRaza = (nuevaRazaId) => {
    const razaObj = RAZAS_VE[nuevaRazaId];
    if (!razaObj) return;

    // Actualizar talentos raciales
    const claseObj = CLASES_VE[pj.clase];
    const nuevosTalentos = [...razaObj.talentos, ...(claseObj ? claseObj.talentos : [])];

    setPj(prev => ({
      ...prev,
      raza: nuevaRazaId,
      talentos: nuevosTalentos
    }));
  };

  // Cambiar Clase
  const cambiarClase = (nuevaClaseId) => {
    const claseObj = CLASES_VE[nuevaClaseId];
    if (!claseObj) return;

    const razaObj = RAZAS_VE[pj.raza];
    const nuevosTalentos = [...(razaObj ? razaObj.talentos : []), ...claseObj.talentos];

    // Armas y armaduras recomendadas
    let nuevaArmadura = 'sin_armadura';
    let nuevoEscudo = false;
    let armasNuevas = [];

    if (nuevaClaseId === 'guerrero') {
      nuevaArmadura = 'cuero';
      nuevoEscudo = true;
      armasNuevas = [
        { id: 'espada_larga', nombre: 'Espada Larga', dado: '1d8', danoMedio: 4, atqBono: '+0', tipo: 'CaC' },
        { id: 'daga', nombre: 'Daga', dado: '1d4', danoMedio: 2, atqBono: '+0', tipo: 'CaC/Proyectil' }
      ];
    } else if (nuevaClaseId === 'bribon') {
      nuevaArmadura = 'cuero';
      nuevoEscudo = false;
      armasNuevas = [
        { id: 'espada_corta', nombre: 'Espada Corta', dado: '1d6', danoMedio: 3, atqBono: '+0', tipo: 'CaC' },
        { id: 'arco', nombre: 'Arco', dado: '1d6', danoMedio: 3, atqBono: '+0', tipo: 'Proyectil' }
      ];
    } else if (nuevaClaseId === 'hechicero') {
      nuevaArmadura = 'sin_armadura';
      nuevoEscudo = false;
      armasNuevas = [
        { id: 'baston', nombre: 'Bastón (a dos manos)', dado: '1d6', danoMedio: 3, atqBono: '+0', tipo: 'CaC' },
        { id: 'daga', nombre: 'Daga', dado: '1d4', danoMedio: 2, atqBono: '+0', tipo: 'CaC/Proyectil' }
      ];
    } else {
      nuevaArmadura = 'mallas';
      nuevoEscudo = true;
      armasNuevas = [
        { id: 'maza_pesada', nombre: 'Maza Pesada', dado: '1d6', danoMedio: 3, atqBono: '+0', tipo: 'CaC' }
      ];
    }

    setPj(prev => ({
      ...prev,
      clase: nuevaClaseId,
      talentos: nuevosTalentos,
      armadura: nuevaArmadura,
      escudo: nuevoEscudo,
      armas: armasNuevas
    }));
  };

  // Tirar 3d6 para los 6 atributos
  const ejecutarTirada3d6 = () => {
    const tiradas = tirarSieteVeces3d6();
    setTiradas3d6Disponibles(tiradas);
    Swal.fire({
      title: '🎲 Tirada Oficial (3d6 siete veces)',
      html: `
        <div class="text-left text-sm space-y-2">
          <p class="text-zinc-300">Has obtenido 7 tiradas. En <b>Vieja Escuela</b> te quedas con las 6 mejores para tus atributos:</p>
          <div class="flex gap-2 justify-center py-3 flex-wrap">
            ${tiradas.map((val, i) => `<span class="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600 text-amber-200 font-black text-base shadow">${val}</span>`).join('')}
          </div>
          <p class="text-xs text-zinc-400">¿Deseas asignar automáticamente los mejores valores a tu clase actual (${pj.clase.toUpperCase()})?</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: '✨ Asignar automáticamente',
      cancelButtonText: 'Asignar manual',
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#3f3f46',
      background: '#1c1917',
      color: '#f5f5f4'
    }).then((res) => {
      if (res.isConfirmed) {
        // Asignación inteligente por clase
        const [a, b, c, d, e, f] = tiradas.slice(0, 6);
        let nuevosAtributos = { fue: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 };

        if (pj.clase === 'guerrero') {
          nuevosAtributos = { fue: a, con: b, des: c, sab: d, car: e, int: f };
        } else if (pj.clase === 'hechicero') {
          nuevosAtributos = { int: a, des: b, con: c, sab: d, car: e, fue: f };
        } else if (pj.clase === 'bribon') {
          nuevosAtributos = { des: a, fue: b, con: c, car: d, sab: e, int: f };
        } else {
          nuevosAtributos = { sab: a, con: b, fue: c, car: d, des: e, int: f };
        }

        setPj(prev => ({ ...prev, atributos: nuevosAtributos }));
        Swal.fire({
          title: '¡Atributos asignados!',
          text: `FUE ${nuevosAtributos.fue}, DES ${nuevosAtributos.des}, CON ${nuevosAtributos.con}, INT ${nuevosAtributos.int}, SAB ${nuevosAtributos.sab}, CAR ${nuevosAtributos.car}`,
          icon: 'success',
          background: '#1c1917',
          color: '#f5f5f4',
          timer: 2000
        });
      }
    });
  };

  // Ejecutar tirada d20 interactiva
  const ejecutarTirada = ({ tipo, nombre, bono, dificultad = 11, modNombre = '' }) => {
    const res = resolverTiradaD20({ bono, dificultad });
    setModalTirada({
      tipo,
      nombre,
      bono,
      dificultad,
      modNombre,
      res
    });
  };

  // Tirar Ataque de Arma con Daño Medio
  const ejecutarAtaqueArma = (arma, esDosManos = false) => {
    const esCac = arma.tipo.includes('CaC');
    const bonoAtq = esCac ? stats.atqCac : stats.atqDistancia;
    const res = resolverTiradaD20({ bono: bonoAtq, dificultad: 12 }); // DEF 12 promedio enemigo

    // Cálculo del daño medio
    const danoObj = calcularDanoMedioArma({
      arma,
      modFue: stats.modificadores.fue,
      esCritico: res.esCritico,
      dosManos: esDosManos,
      emboscar: pj.clase === 'bribon'
    });

    setModalTirada({
      tipo: 'ataque',
      nombre: `Ataque con ${arma.nombre}`,
      bono: bonoAtq,
      dificultad: 12,
      modNombre: esCac ? 'Bono ATQ CaC (Base + FUE)' : 'Bono ATQ Distancia (Base + DES)',
      res,
      danoObj,
      arma
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 py-6 px-3 sm:px-6 font-serif select-text">
      {/* TIPOGRAFÍAS GÓTICAS FRAKTUR & MEDIEVALES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=MedievalSharp&family=Spectral:ital,wght@0,400;0,600;0,700;1,400&family=UnifrakturMaguntia&display=swap');

        .font-fraktur {
          font-family: 'UnifrakturMaguntia', 'MedievalSharp', serif;
        }
        .font-spectral {
          font-family: 'Spectral', 'Georgia', serif;
        }
        .parchment-sheet {
          background-color: #f7f1e5;
          background-image: 
            radial-gradient(#e8d8be 15%, transparent 16%),
            radial-gradient(#dccba8 15%, transparent 16%);
          background-size: 60px 60px;
          background-position: 0 0, 30px 30px;
          box-shadow: 
            0 0 0 1px #a48c68,
            0 20px 40px -15px rgba(0,0,0,0.8),
            inset 0 0 80px rgba(160, 130, 80, 0.25);
        }
        .ink-line {
          border-bottom: 1.5px solid #2b2621;
        }
        .ink-border {
          border: 1.5px solid #2b2621;
        }
        .ink-text {
          color: #1a1510;
        }
      `}</style>

      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-3 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <div>
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              Vieja Escuela: el juego de rol
            </h2>
            <p className="text-xs text-stone-400">
              Hoja de Personaje oficial (Página 16) • Combate con Daño Medio Ágil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={ejecutarTirada3d6}
            className="px-3 py-1.5 bg-amber-700/30 hover:bg-amber-600/40 text-amber-300 border border-amber-600/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            title="Tirar 3d6 siete veces según el manual oficial"
          >
            <span>🎲</span>
            <span>Tirar 3d6</span>
          </button>

          <button
            onClick={() => setMostrarAliadosAsociacion(true)}
            className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 border border-purple-600/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            title="Ver los miembros de la Asociación que asisten al grupo"
          >
            <span>👥</span>
            <span>Asociación</span>
          </button>

          <button
            onClick={() => setMostrarAyudaReglas(!mostrarAyudaReglas)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>📖</span>
            <span>Reglas</span>
          </button>

          <button
            onClick={() => {
              if (alVincularConJuego) alVincularConJuego(pj);
              Swal.fire({
                title: '¡Personaje Guardado!',
                text: 'La hoja de personaje ha quedado sincronizada con la Cripta.',
                icon: 'success',
                timer: 1500,
                background: '#1c1917',
                color: '#f5f5f4'
              });
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow flex items-center gap-1.5"
          >
            <span>💾</span>
            <span>Guardar</span>
          </button>

          {alCerrar && (
            <button
              onClick={alCerrar}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-xl text-xs font-bold transition border border-stone-700"
            >
              ✕ Cerrar
            </button>
          )}
        </div>
      </div>

      {/* PANEL EXPANDIBLE DE RESUMEN DE REGLAS */}
      {mostrarAyudaReglas && (
        <div className="max-w-4xl mx-auto mb-4 bg-stone-900/95 border border-amber-800/40 p-4 rounded-2xl text-xs text-stone-300 space-y-2 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-stone-800 pb-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span>📖</span> Resumen de Reglas Oficiales (Vieja Escuela OSR)
            </h4>
            <span className="text-[10px] text-stone-500">Manual oficial VE_jdr.pdf</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
              <p className="font-bold text-amber-300 mb-1">🎯 Resolución de Acciones</p>
              <p>Tira <b>1d20 + Habilidad o Atributo</b>. Superar <b>11+</b> suele ser éxito (14+ difícil, 17+ muy difícil, 20+ casi imposible). 20 siempre es éxito; 1 siempre es pifia.</p>
            </div>
            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
              <p className="font-bold text-amber-300 mb-1">⚔️ Combate y Daño Medio</p>
              <p>Iniciativa por DES. Tirada de ataque vs <b>Defensa</b>. Si aciertas, se aplica el <b>Daño Medio Fijo</b> del arma (+FUE en CaC), haciendo el combate ágil sin pérdida de tiempo en dados de daño.</p>
            </div>
            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
              <p className="font-bold text-amber-300 mb-1">⚡ Instintos y Peligros</p>
              <p>Para evitar trampas, venenos o conjuros: <b>1d20 + Ins + Atributo</b> (FUE parálisis, DES esquivar trampa, CON veneno, INT control mental, SAB ilusión).</p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* HOJA DE PERSONAJE EXACTA (PÁGINA 16 DE VIEJA ESCUELA) */}
      {/* ===================================================================== */}
      <div className="max-w-3xl mx-auto parchment-sheet ink-text p-6 sm:p-10 rounded-lg border-2 border-[#544637] shadow-2xl relative font-spectral">

        {/* CABECERA (LOGO + METADATOS) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pb-4 border-b-2 border-[#2b2621]">

          {/* COLUMNA IZQUIERDA: LOGO VIEJA ESCUELA + NIVEL & PX */}
          <div className="sm:col-span-4 flex flex-col justify-between pr-2 border-r-0 sm:border-r-2 sm:border-[#2b2621]">
            <div>
              <h1 className="font-fraktur text-4xl sm:text-5xl tracking-normal text-stone-900 leading-none">
                Vieja
              </h1>
              <h1 className="font-fraktur text-4xl sm:text-5xl tracking-normal text-stone-900 leading-none">
                Escuela
              </h1>
              <p className="font-fraktur text-sm text-stone-800 tracking-wider mt-1">
                • el juego de rol •
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-[#8c7b64] flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="font-fraktur text-lg text-stone-900">nivel</span>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={pj.nivel || 1}
                  onChange={(e) => actualizarCampo('nivel', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-transparent ink-line text-center font-bold text-stone-900 outline-none text-base"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-1">
                <span className="font-fraktur text-lg text-stone-900">px</span>
                <input
                  type="number"
                  min="0"
                  value={pj.px || 0}
                  onChange={(e) => actualizarCampo('px', parseInt(e.target.value) || 0)}
                  className="w-16 bg-transparent ink-line text-center font-bold text-stone-900 outline-none text-base"
                />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: NOMBRE, RAZA, CLASE, TALENTOS, TRASFONDOS */}
          <div className="sm:col-span-8 flex flex-col justify-between pl-0 sm:pl-2 space-y-3">
            {/* FILA 1: NOMBRE, RAZA, CLASE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="font-fraktur text-base block text-stone-900">nombre</span>
                <input
                  type="text"
                  value={pj.nombre || ''}
                  onChange={(e) => actualizarCampo('nombre', e.target.value)}
                  className="w-full bg-transparent ink-line text-stone-900 font-semibold px-1 py-0.5 outline-none text-sm"
                  placeholder="Ej: Sigfrido"
                />
              </div>

              <div>
                <span className="font-fraktur text-base block text-stone-900">raza</span>
                <select
                  value={pj.raza || 'humano'}
                  onChange={(e) => cambiarRaza(e.target.value)}
                  className="w-full bg-transparent ink-line text-stone-900 font-semibold px-1 py-0.5 outline-none text-sm cursor-pointer"
                >
                  {Object.values(RAZAS_VE).map(r => (
                    <option key={r.id} value={r.id} className="bg-[#f7f1e5] text-stone-900">
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="font-fraktur text-base block text-stone-900">clase</span>
                <select
                  value={pj.clase || 'guerrero'}
                  onChange={(e) => cambiarClase(e.target.value)}
                  className="w-full bg-transparent ink-line text-stone-900 font-semibold px-1 py-0.5 outline-none text-sm cursor-pointer"
                >
                  {Object.values(CLASES_VE).map(c => (
                    <option key={c.id} value={c.id} className="bg-[#f7f1e5] text-stone-900">
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FILA 2: TALENTOS Y TRASFONDOS (3 LÍNEAS CADA UNO COMO EN EL MANUAL) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* TALENTOS */}
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-fraktur text-lg text-stone-900">talentos</span>
                  <span className="text-[10px] text-stone-600 italic">Raza y Clase</span>
                </div>
                <div className="space-y-1">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={`talento-${idx}`}
                      type="text"
                      value={pj.talentos?.[idx] || ''}
                      onChange={(e) => {
                        const arr = [...(pj.talentos || [])];
                        arr[idx] = e.target.value;
                        actualizarCampo('talentos', arr);
                      }}
                      className="w-full bg-transparent ink-line text-xs text-stone-900 px-1 py-0.5 outline-none font-medium"
                      placeholder={idx === 0 ? 'Ej: Vista Aguda' : idx === 1 ? 'Ej: Lucha con Arma y Escudo' : ''}
                    />
                  ))}
                </div>
              </div>

              {/* TRASFONDOS */}
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-fraktur text-lg text-stone-900">trasfondos</span>
                  <span className="text-[10px] text-stone-600 italic">Historia previa</span>
                </div>
                <div className="space-y-1">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={`trasfondo-${idx}`}
                      type="text"
                      value={pj.trasfondos?.[idx] || ''}
                      onChange={(e) => {
                        const arr = [...(pj.trasfondos || [])];
                        arr[idx] = e.target.value;
                        actualizarCampo('trasfondos', arr);
                      }}
                      className="w-full bg-transparent ink-line text-xs text-stone-900 px-1 py-0.5 outline-none font-medium"
                      placeholder={idx === 0 ? 'Ej: Soldado en las guerras del norte' : ''}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN MEDIA: 3 COLUMNAS (HABILIDADES | ATRIBUTOS | COMBATE) */}
        {/* Separadas con las 2 líneas verticales clásicas del manual */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-12 py-5 border-b-2 border-[#2b2621] divide-y sm:divide-y-0 sm:divide-x-2 divide-[#2b2621]">

          {/* COLUMNA 1: HABILIDADES */}
          <div className="sm:col-span-4 pr-0 sm:pr-4 pb-4 sm:pb-0">
            <h3 className="font-fraktur text-2xl text-center text-stone-900 mb-3 tracking-wide">
              habilidades
            </h3>

            <div className="space-y-2">
              {HABILIDADES_VE.map((hab) => {
                const valorPuntos = pj.habilidades?.[hab.id] || 0;
                const modAtr = stats.modificadores[hab.atributo] || 0;
                const bonoTotal = valorPuntos + modAtr;

                return (
                  <div
                    key={hab.id}
                    className="flex items-center justify-between group hover:bg-[#ede3cf]/50 p-1 rounded transition"
                  >
                    <button
                      onClick={() => ejecutarTirada({
                        tipo: 'habilidad',
                        nombre: `Prueba de ${hab.nombre}`,
                        bono: bonoTotal,
                        dificultad: 11,
                        modNombre: `${valorPuntos} Hab + ${formatearMod(modAtr)} ${hab.atributo.toUpperCase()}`
                      })}
                      className="font-fraktur text-lg text-left text-stone-900 group-hover:text-amber-900 flex-1 flex items-center gap-1.5"
                      title={`Tirar 1d20 + ${bonoTotal} (${hab.desc})`}
                    >
                      <span>{hab.nombre.toLowerCase()}</span>
                      <span className="text-[10px] text-stone-500 font-sans group-hover:inline hidden">🎲</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={valorPuntos}
                        onChange={(e) => actualizarHabilidad(hab.id, e.target.value)}
                        className="w-10 text-center font-bold bg-transparent ink-line text-stone-900 outline-none text-base"
                      />
                      <span className="text-[11px] font-sans text-stone-600 w-8 text-right font-semibold">
                        ({formatearMod(bonoTotal)})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-stone-600 italic text-center mt-3">
              Clic en el nombre para tirar 1d20 + bono vs 11+
            </p>
          </div>

          {/* COLUMNA 2: ATRIBUTOS (FUE, DES, CON, INT, SAB, CAR) */}
          <div className="sm:col-span-4 px-0 sm:px-4 py-4 sm:py-0">
            <div className="space-y-2.5">
              {[
                { id: 'fue', nombre: 'fue', full: 'Fuerza' },
                { id: 'des', nombre: 'des', full: 'Destreza' },
                { id: 'con', nombre: 'con', full: 'Constitución' },
                { id: 'int', nombre: 'int', full: 'Inteligencia' },
                { id: 'sab', nombre: 'sab', full: 'Sabiduría' },
                { id: 'car', nombre: 'car', full: 'Carisma' }
              ].map((atr) => {
                const valor = pj.atributos?.[atr.id] || 10;
                const mod = stats.modificadores[atr.id];

                return (
                  <div
                    key={atr.id}
                    className="flex items-center justify-between group hover:bg-[#ede3cf]/50 p-1 rounded transition"
                  >
                    <button
                      onClick={() => ejecutarTirada({
                        tipo: 'atributo',
                        nombre: `Prueba de ${atr.full}`,
                        bono: mod,
                        dificultad: 11,
                        modNombre: `Modificador ${formatearMod(mod)}`
                      })}
                      className="font-fraktur text-2xl text-stone-900 group-hover:text-amber-900 flex-1 text-left flex items-center gap-1.5"
                      title={`Tirar 1d20 + ${mod} (${atr.full})`}
                    >
                      <span>{atr.nombre}</span>
                      <span className="text-[10px] text-stone-500 font-sans group-hover:inline hidden">🎲</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* VALOR BRUTO (3-18) */}
                      <input
                        type="number"
                        min="3"
                        max="18"
                        value={valor}
                        onChange={(e) => actualizarAtributo(atr.id, e.target.value)}
                        className="w-12 text-center font-bold bg-transparent ink-line text-stone-900 outline-none text-lg"
                        title="Puntuación de 3 a 18"
                      />

                      {/* MODIFICADOR (-2 a +2) */}
                      <span className="w-10 text-center font-bold font-sans text-stone-900 text-sm bg-[#ede3cf] px-1 py-0.5 rounded border border-[#8c7b64]">
                        {formatearMod(mod)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-3">
              <span className="text-[10px] text-stone-600 block">
                Valor (3 a 18) &nbsp;|&nbsp; Modificador (-2 a +2)
              </span>
            </div>
          </div>

          {/* COLUMNA 3: COMBATE (PV, MOV, DEF, ATQ, INS, POD) */}
          <div className="sm:col-span-4 pl-0 sm:pl-4 pt-4 sm:pt-0">
            <div className="space-y-2.5">

              {/* PV (PUNTOS DE VIDA) */}
              <div className="flex items-center justify-between group hover:bg-[#ede3cf]/50 p-1 rounded transition">
                <span className="font-fraktur text-2xl text-stone-900" title="Puntos de Vida / Aguante">
                  pv
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={pj.pvActual !== undefined ? pj.pvActual : stats.pv}
                    onChange={(e) => actualizarCampo('pvActual', parseInt(e.target.value) || 0)}
                    className="w-12 text-center font-bold bg-transparent ink-line text-stone-900 outline-none text-lg"
                    title="PV Actuales"
                  />
                  <span className="text-sm font-sans text-stone-600">/ {stats.pv}</span>
                </div>
              </div>

              {/* MOV (MOVIMIENTO) */}
              <div className="flex items-center justify-between group hover:bg-[#ede3cf]/50 p-1 rounded transition">
                <span className="font-fraktur text-2xl text-stone-900" title="Metros por asalto">
                  mov
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-14 text-center font-bold font-sans text-stone-900 text-lg">
                    {stats.mov}m
                  </span>
                </div>
              </div>

              {/* DEF (DEFENSA) */}
              <div className="flex items-center justify-between group hover:bg-[#ede3cf]/50 p-1 rounded transition">
                <span className="font-fraktur text-2xl text-stone-900" title="Defensa = 10 + DES + Armadura + Escudo">
                  def
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-14 text-center font-bold font-sans text-stone-900 text-lg bg-[#ede3cf] px-1 py-0.5 rounded border border-[#8c7b64]">
                    {stats.def}
                  </span>
                </div>
              </div>

              {/* ATQ (ATAQUE) */}
              <div className="flex items-center justify-between group hover:bg-[#ede3cf]/50 p-1 rounded transition">
                <button
                  onClick={() => ejecutarTirada({
                    tipo: 'ataque',
                    nombre: 'Ataque Cuerpo a Cuerpo Genérico',
                    bono: stats.atqCac,
                    dificultad: 12,
                    modNombre: `ATQ Base (${stats.atqBase}) + FUE (${formatearMod(stats.modificadores.fue)})`
                  })}
                  className="font-fraktur text-2xl text-stone-900 group-hover:text-amber-900 flex items-center gap-1 text-left"
                  title="Bono de ataque = Nivel + FUE (CaC) o DES (Proyectil)"
                >
                  <span>atq</span>
                  <span className="text-[10px] text-stone-500 font-sans group-hover:inline hidden">🎲</span>
                </button>
                <div className="flex items-center gap-1 text-right">
                  <span className="text-xs font-sans text-stone-700">CaC:</span>
                  <span className="font-bold font-sans text-stone-900 text-base">
                    {formatearMod(stats.atqCac)}
                  </span>
                  <span className="text-xs font-sans text-stone-700 ml-1">Dist:</span>
                  <span className="font-bold font-sans text-stone-900 text-base">
                    {formatearMod(stats.atqDistancia)}
                  </span>
                </div>
              </div>

              {/* INS (INSTINTOS) */}
              <div className="flex items-center justify-between group hover:bg-[#ede3cf]/50 p-1 rounded transition">
                <button
                  onClick={() => ejecutarTirada({
                    tipo: 'instintos',
                    nombre: 'Tirada de Instintos (Peligro / Trampa)',
                    bono: stats.ins,
                    dificultad: 11,
                    modNombre: `Bono Base de Instintos (${stats.ins})`
                  })}
                  className="font-fraktur text-2xl text-stone-900 group-hover:text-amber-900 flex items-center gap-1 text-left"
                  title="Resistir o evitar peligros de forma instintiva (trampas, venenos, conjuros)"
                >
                  <span>ins</span>
                  <span className="text-[10px] text-stone-500 font-sans group-hover:inline hidden">🎲</span>
                </button>
                <div className="flex items-center gap-1">
                  <span className="w-14 text-center font-bold font-sans text-stone-900 text-lg">
                    {formatearMod(stats.ins)}
                  </span>
                </div>
              </div>

              {/* POD (PUNTOS DE PODER) */}
              <div className="flex items-center justify-between group hover:bg-[#ede3cf]/50 p-1 rounded transition">
                <span className="font-fraktur text-2xl text-stone-900" title="Puntos para gastar en conjuros">
                  pod
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={pj.podActual !== undefined ? pj.podActual : stats.pod}
                    onChange={(e) => actualizarCampo('podActual', parseInt(e.target.value) || 0)}
                    className="w-12 text-center font-bold bg-transparent ink-line text-stone-900 outline-none text-lg"
                    title="Puntos de Poder Actuales"
                  />
                  <span className="text-sm font-sans text-stone-600">/ {stats.pod}</span>
                </div>
              </div>

            </div>

            {/* ARMADURA & ESCUDO EQUIPADOS */}
            <div className="mt-4 pt-2 border-t border-[#8c7b64] text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-fraktur text-stone-800">armadura:</span>
                <select
                  value={pj.armadura || 'cuero'}
                  onChange={(e) => actualizarCampo('armadura', e.target.value)}
                  className="bg-transparent text-right text-stone-900 font-medium outline-none text-xs cursor-pointer max-w-[140px]"
                >
                  {CATALOGO_ARMADURAS_VE.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#f7f1e5]">
                      {a.nombre} (+{a.defBono})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] font-fraktur text-stone-800">escudo:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!pj.escudo}
                    onChange={(e) => actualizarCampo('escudo', e.target.checked)}
                    className="accent-amber-800"
                  />
                  <span className="text-stone-900 text-xs font-medium">+1 DEF</span>
                </label>
              </div>
            </div>

          </div>

        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN INFERIOR: 2 COLUMNAS (ARMAS | EQUIPO) */}
        {/* Con las 8 líneas horizontales regladas del manual oficial */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">

          {/* COLUMNA ARMAS CON DAÑO MEDIO */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-fraktur text-3xl text-stone-900">
                armas
              </h3>
              <span className="text-[11px] text-amber-900 font-bold bg-[#ede3cf] px-2 py-0.5 rounded border border-[#8c7b64]">
                ⚔️ Combate con Daño Medio
              </span>
            </div>

            <p className="text-[10px] text-stone-600 mb-2 italic">
              Ataque = 1d20 vs DEF • Al impactar: aplica el <b>Daño Medio</b> sin tirar dados de daño.
            </p>

            <div className="space-y-1.5">
              {(pj.armas || []).map((arma, idx) => {
                const esCac = arma.tipo.includes('CaC');
                const bonoAtq = esCac ? stats.atqCac : stats.atqDistancia;
                const danoObj = calcularDanoMedioArma({
                  arma,
                  modFue: stats.modificadores.fue,
                  dosManos: false,
                  emboscar: false
                });

                return (
                  <div
                    key={`arma-${idx}`}
                    className="flex items-center justify-between ink-line py-1 text-xs group hover:bg-[#ede3cf]/60 px-1 rounded transition"
                  >
                    <div className="flex-1">
                      <span className="font-bold text-stone-900 block">
                        {arma.nombre}
                      </span>
                      <span className="text-[10px] text-stone-600">
                        {arma.tipo} • {arma.dado} • Alcance: {arma.alcance || 'CaC'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-stone-500 block">Daño Medio</span>
                        <span className="font-bold text-stone-900 text-sm">
                          {danoObj.danoTotal}
                        </span>
                      </div>

                      <button
                        onClick={() => ejecutarAtaqueArma(arma)}
                        className="px-2 py-1 bg-[#2b2621] hover:bg-amber-950 text-amber-100 rounded text-xs font-bold transition flex items-center gap-1 shadow"
                        title="Tirar Ataque y calcular Daño Medio automático"
                      >
                        <span>🎲</span>
                        <span>{formatearMod(bonoAtq)}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* SELECTOR PARA AÑADIR ARMAS DEL CATÁLOGO */}
              <div className="pt-2">
                <select
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const armaEncontrada = CATALOGO_ARMAS_VE.find(a => a.id === id);
                    if (armaEncontrada) {
                      setPj(prev => ({
                        ...prev,
                        armas: [...(prev.armas || []), { ...armaEncontrada }]
                      }));
                    }
                    e.target.value = '';
                  }}
                  className="w-full bg-[#ede3cf] ink-border text-xs text-stone-900 font-semibold p-1.5 rounded outline-none cursor-pointer"
                >
                  <option value="">➕ Añadir arma del manual...</option>
                  {CATALOGO_ARMAS_VE.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} — Daño Medio: {a.danoMedio} ({a.dado}) — {a.coste}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* COLUMNA EQUIPO, BULTOS Y MONEDAS */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-fraktur text-3xl text-stone-900">
                equipo
              </h3>

              {/* MONEDAS (mo, mp, mc) */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-amber-800" title="Monedas de Oro">
                  {pj.monedas?.mo || 0} mo
                </span>
                <span className="text-stone-500" title="Monedas de Plata">
                  {pj.monedas?.mp || 0} mp
                </span>
                <span className="text-amber-950" title="Monedas de Cobre">
                  {pj.monedas?.mc || 0} mc
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-stone-600 mb-2">
              <span>Capacidad de carga: <b>{stats.bultosMax} bultos máx</b> (igual a FUE)</span>
              <span>1 mo = 10 mp = 100 mc</span>
            </div>

            <div className="space-y-1">
              {(pj.equipo || []).slice(0, 8).map((item, idx) => (
                <div key={`item-${idx}`} className="flex items-center ink-line py-0.5 text-xs">
                  <span className="text-stone-400 mr-2 text-[10px]">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const arr = [...(pj.equipo || [])];
                      arr[idx] = e.target.value;
                      actualizarCampo('equipo', arr);
                    }}
                    className="w-full bg-transparent text-xs text-stone-900 outline-none font-medium"
                  />
                </div>
              ))}
            </div>

            {/* EDICIÓN DE MONEDAS */}
            <div className="mt-3 pt-2 border-t border-[#8c7b64] flex items-center justify-between text-xs">
              <span className="font-fraktur text-base text-stone-900">monedas:</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 font-bold text-amber-800">
                  <span>mo:</span>
                  <input
                    type="number"
                    value={pj.monedas?.mo || 0}
                    onChange={(e) => setPj(prev => ({
                      ...prev,
                      monedas: { ...prev.monedas, mo: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-10 bg-transparent ink-line text-center text-stone-900 text-xs"
                  />
                </label>
                <label className="flex items-center gap-1 font-bold text-stone-600">
                  <span>mp:</span>
                  <input
                    type="number"
                    value={pj.monedas?.mp || 0}
                    onChange={(e) => setPj(prev => ({
                      ...prev,
                      monedas: { ...prev.monedas, mp: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-10 bg-transparent ink-line text-center text-stone-900 text-xs"
                  />
                </label>
                <label className="flex items-center gap-1 font-bold text-amber-950">
                  <span>mc:</span>
                  <input
                    type="number"
                    value={pj.monedas?.mc || 0}
                    onChange={(e) => setPj(prev => ({
                      ...prev,
                      monedas: { ...prev.monedas, mc: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-10 bg-transparent ink-line text-center text-stone-900 text-xs"
                  />
                </label>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ===================================================================== */}
      {/* MODAL DE RESULTADO DE TIRADA D20 */}
      {/* ===================================================================== */}
      {modalTirada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-stone-900 border-2 border-amber-600/70 max-w-md w-full rounded-3xl p-6 shadow-2xl relative text-stone-200">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                  {modalTirada.tipo.toUpperCase()}
                </span>
                <h3 className="text-lg font-black text-white font-fraktur">
                  {modalTirada.nombre}
                </h3>
              </div>
              <button
                onClick={() => setModalTirada(null)}
                className="text-stone-400 hover:text-white w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* DADOS GRANDES */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-20 h-20 rounded-2xl bg-amber-950 border-2 border-amber-500 flex flex-col items-center justify-center shadow-lg">
                <span className="text-[10px] uppercase font-bold text-amber-300">d20</span>
                <span className={`text-3xl font-black ${
                  modalTirada.res.esCritico
                    ? 'text-yellow-300 animate-pulse'
                    : modalTirada.res.esPifia
                    ? 'text-red-400'
                    : 'text-white'
                }`}>
                  {modalTirada.res.dadoFinal}
                </span>
              </div>

              <div className="text-2xl font-black text-stone-500">+</div>

              <div className="w-16 h-16 rounded-xl bg-stone-800 border border-stone-700 flex flex-col items-center justify-center">
                <span className="text-[9px] uppercase font-bold text-stone-400">Bono</span>
                <span className="text-xl font-bold text-stone-200">
                  {formatearMod(modalTirada.bono)}
                </span>
              </div>

              <div className="text-2xl font-black text-stone-500">=</div>

              <div className="w-20 h-20 rounded-2xl bg-stone-950 border-2 border-stone-600 flex flex-col items-center justify-center shadow-lg">
                <span className="text-[10px] uppercase font-bold text-stone-400">Total</span>
                <span className="text-3xl font-black text-amber-400">
                  {modalTirada.res.total}
                </span>
              </div>
            </div>

            {/* VEREDICTO DE LA TIRADA */}
            <div className={`p-3 rounded-2xl text-center font-bold text-sm my-3 border ${
              modalTirada.res.esCritico
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : modalTirada.res.esPifia
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : modalTirada.res.exito
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}>
              {modalTirada.res.esCritico ? (
                <span>👑 ¡ÉXITO CRÍTICO NATURAL! (20)</span>
              ) : modalTirada.res.esPifia ? (
                <span>💀 ¡PIFIA NATURAL! (1)</span>
              ) : modalTirada.res.exito ? (
                <span>✅ ¡ÉXITO! Supera dificultad {modalTirada.dificultad}</span>
              ) : (
                <span>❌ NO SUPERA (Requiere {modalTirada.dificultad}+)</span>
              )}
            </div>

            {/* SECCIÓN ESPECIAL DE ATAQUE: APLICACIÓN DEL DAÑO MEDIO */}
            {modalTirada.tipo === 'ataque' && modalTirada.danoObj && (
              <div className="mt-3 bg-stone-950/80 p-3.5 rounded-2xl border border-amber-900/40">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    ⚔️ Daño Medio Infligido (Ágil):
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {modalTirada.danoObj.formula}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-stone-300">
                    {modalTirada.res.esCritico ? '¡Impacto Crítico Devastador!' : 'Impacto certero en el blanco:'}
                  </span>
                  <span className="text-2xl font-black text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-600/40 shadow">
                    {modalTirada.danoObj.danoTotal} PV
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setModalTirada(null)}
              className="w-full mt-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl uppercase tracking-wider text-xs transition shadow"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE MIEMBROS DE LA ASOCIACIÓN (ROLES OFICIALES) */}
      {/* ===================================================================== */}
      {mostrarAliadosAsociacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-700 max-w-2xl w-full rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-amber-400 font-fraktur">
                  👥 Miembros del Gremio & Sus Roles en Vieja Escuela
                </h3>
                <p className="text-xs text-stone-400">
                  Aliados oficiales que asisten a los jugadores en la mazmorra y el santuario
                </p>
              </div>
              <button
                onClick={() => setMostrarAliadosAsociacion(false)}
                className="text-stone-400 hover:text-white w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.values(MIEMBROS_ASOCIACION_VE).map((npc, idx) => (
                <div
                  key={idx}
                  className="bg-stone-950 p-3 rounded-2xl border border-stone-800 hover:border-amber-600/50 transition space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300 font-fraktur text-base">
                      {npc.nombre}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/40">
                      {npc.rol}
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px] leading-relaxed">
                    {npc.descripcion}
                  </p>
                  {npc.arma && (
                    <p className="text-amber-500 text-[10px] font-mono">
                      ⚔️ {npc.arma}
                    </p>
                  )}
                  {npc.beneficio && (
                    <p className="text-emerald-400 text-[10px] font-mono">
                      ✨ {npc.beneficio}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setMostrarAliadosAsociacion(false)}
              className="w-full mt-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-black rounded-xl uppercase tracking-wider text-xs transition"
            >
              Volver a la Hoja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
