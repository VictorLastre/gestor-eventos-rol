import { useState, useMemo } from 'react';
import { sound } from './SoundEngine';
import {
  CATALOGO_ARMAS_VE,
  CATALOGO_ARMADURAS_VE,
  CATALOGO_ESCUDOS_VE,
  calcularEstadisticasPersonaje,
  guardarPersonajeLocal,
  getModificador,
  formatearMod
} from './ViejaEscuelaEngine';

// =====================================================================
// CATÁLOGOS OFICIALES DE TIENDAS DE LA ASOCIACIÓN DE ROL LA PAMPA
// =====================================================================
export const TIENDA_DELO = [
  {
    id: 'pocion_curacion_std',
    nombre: 'Poción de Curación VE',
    tipo: 'Consumible',
    icono: '🧪',
    efecto: 'curar_6',
    desc: 'Elixir rojo preparado con hierbas medicinales. Restaura +6 PV al consumirse.',
    costeMo: 25,
    valorVenta: 12
  },
  {
    id: 'pocion_pod_std',
    nombre: 'Poción de Concentración (POD)',
    tipo: 'Consumible',
    icono: '🔮',
    efecto: 'pod_3',
    desc: 'Brebaje azul místico. Restaura +3 Puntos de Poder para clérigos y hechiceros.',
    costeMo: 30,
    valorVenta: 15
  },
  {
    id: 'antidoto_veneno',
    nombre: 'Antídoto Purificador',
    tipo: 'Consumible',
    icono: '🌿',
    efecto: 'curar_veneno',
    desc: 'Destilado halfling capaz de neutralizar venenos de serpientes y arañas.',
    costeMo: 15,
    valorVenta: 7
  },
  {
    id: 'raciones_viaje_x3',
    nombre: 'Raciones de Viaje (x3)',
    tipo: 'Consumible',
    icono: '🍖',
    efecto: 'curar_3',
    desc: 'Morfi seco y empanadillas del gremio. Recupera +3 PV fuera de combate.',
    costeMo: 5,
    valorVenta: 2
  },
  {
    id: 'antorchas_pack',
    nombre: 'Paquete de Antorchas (x3)',
    tipo: 'Utilidad',
    icono: '🔥',
    efecto: 'luz',
    desc: 'Antorchas resinosas de larga duración para explorar criptas oscuras.',
    costeMo: 1,
    valorVenta: 0
  }
];

export const TIENDA_GUILLERMO = [
  {
    id: 'daga',
    nombre: 'Daga de Acero',
    tipo: 'Arma',
    icono: '🗡️',
    dado: '1d4',
    danoMedio: 2,
    tipoAtaque: 'CaC / Proyectil',
    desc: 'Hoja corta y ligera. Arrojadiza a corta distancia (1d4 daño).',
    costeMo: 2,
    valorVenta: 1
  },
  {
    id: 'espada_corta',
    nombre: 'Espada Corta',
    tipo: 'Arma',
    icono: '⚔️',
    dado: '1d6',
    danoMedio: 3,
    tipoAtaque: 'CaC',
    desc: 'Arma clásica de filo equilibrada y letal en pasillos estrechos (1d6 daño).',
    costeMo: 6,
    valorVenta: 3
  },
  {
    id: 'espada_larga',
    nombre: 'Espada Larga',
    tipo: 'Arma',
    icono: '⚔️',
    dado: '1d8',
    danoMedio: 4,
    tipoAtaque: 'CaC',
    desc: 'El arma insignia del guerrero de vanguardia (1d8 daño).',
    costeMo: 10,
    valorVenta: 5
  },
  {
    id: 'hacha_batalla',
    nombre: 'Hacha de Batalla',
    tipo: 'Arma',
    icono: '🪓',
    dado: '1d8',
    danoMedio: 4,
    tipoAtaque: 'CaC',
    desc: 'Contundente y brutal para quebrar armaduras (1d8 daño).',
    costeMo: 7,
    valorVenta: 3
  },
  {
    id: 'gran_hacha',
    nombre: 'Gran Hacha a Dos Manos',
    tipo: 'Arma',
    icono: '🪓',
    dado: '1d10',
    danoMedio: 5,
    tipoAtaque: 'CaC',
    dosManos: true,
    desc: 'El arma favorita de Ayrton. Requiere dos manos pero inflige 1d10 daño devastador.',
    costeMo: 15,
    valorVenta: 7
  },
  {
    id: 'arco_corto',
    nombre: 'Arco Corto & Carcaj',
    tipo: 'Arma',
    icono: '🏹',
    dado: '1d6',
    danoMedio: 3,
    tipoAtaque: 'Proyectil',
    desc: 'Arco de madera flexible con 20 flechas (1d6 daño a distancia).',
    costeMo: 12,
    valorVenta: 6
  },
  {
    id: 'cuero',
    nombre: 'Armadura de Cuero',
    tipo: 'Armadura',
    icono: '🛡️',
    defBono: 2,
    desc: 'Cuero curtido resistente (+2 DEF). No penaliza el movimiento ni el sigilo.',
    costeMo: 5,
    valorVenta: 2
  },
  {
    id: 'anillos',
    nombre: 'Armadura de Anillos',
    tipo: 'Armadura',
    icono: '🛡️',
    defBono: 3,
    desc: 'Refuerzos metálicos cosidos (+3 DEF). Protección confiable.',
    costeMo: 30,
    valorVenta: 15
  },
  {
    id: 'mallas',
    nombre: 'Cota de Mallas',
    tipo: 'Armadura',
    icono: '🛡️',
    defBono: 4,
    desc: 'Malla de acero templado entrelazado (+4 DEF). Máxima defensa estándar.',
    costeMo: 75,
    valorVenta: 35
  },
  {
    id: 'placas',
    nombre: 'Armadura de Placas Completa',
    tipo: 'Armadura',
    icono: '🛡️',
    defBono: 6,
    penalizaMov: true,
    desc: 'Arnés de acero macizo (+6 DEF). Protección absoluta, pero reduce mov a 6m.',
    costeMo: 100,
    valorVenta: 50
  },
  {
    id: 'escudo',
    nombre: 'Escudo de Batalla',
    tipo: 'Escudo',
    icono: '🛡️',
    defBono: 1,
    desc: 'Escudo heráldico con emblema del gremio (+1 DEF adicional).',
    costeMo: 15,
    valorVenta: 7
  }
];

export const TIENDA_DINY = [
  {
    id: 'pergamino_sector',
    nombre: 'Pergamino de Revelación del Sector',
    tipo: 'Consumible',
    icono: '📜',
    efecto: 'revelar_mapa',
    desc: 'Mapa cartografiado por Diny que descubre todas las salas y pasillos del nivel.',
    costeMo: 20,
    valorVenta: 10
  },
  {
    id: 'cuerda_canamo',
    nombre: 'Cuerda de Cáñamo (15m)',
    tipo: 'Utilidad',
    icono: '🪢',
    desc: 'Resistente y fundamental para descender a pozos y fosas de la cripta.',
    costeMo: 2,
    valorVenta: 1
  },
  {
    id: 'juego_ganzuas',
    nombre: 'Juego de Ganzúas de Precisión',
    tipo: 'Utilidad',
    icono: '🗝️',
    desc: 'Herramientas de ladrón para forzar cerraduras antiguas de cofres.',
    costeMo: 10,
    valorVenta: 5
  }
];

export function normalizarIdArmadura(itemOId) {
  if (!itemOId) return 'sin_armadura';
  let s = typeof itemOId === 'object' ? (itemOId.idBase || itemOId.id || itemOId.nombre || '') : String(itemOId);
  s = s.toLowerCase();
  if (s.includes('placa')) return 'placas';
  if (s.includes('malla')) return 'mallas';
  if (s.includes('anillo')) return 'anillos';
  if (s.includes('cuero')) return 'cuero';
  if (s.includes('sin_armadura') || s.includes('ropa')) return 'sin_armadura';
  return s.split('_')[0];
}

export default function InventarioVE({
  personaje,
  alActualizarPersonaje,
  alCerrar,
  engine,
  modoInicial = 'inventario',
  onMostrarMensaje
}) {
  const [pestaña, setPestaña] = useState(modoInicial); // 'inventario', 'tienda', 'vender'
  const [mercaderActivo, setMercaderActivo] = useState('delo'); // 'delo', 'guillermo', 'diny'
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [mensajeLocal, setMensajeLocal] = useState(null);

  if (!personaje) return null;

  const stats = calcularEstadisticasPersonaje(personaje);
  const capacidadMax = stats.bultosMax || personaje.atributos?.fue || 10;

  // Normalizar lista de equipo en objetos manipulables
  const itemsMochila = useMemo(() => {
    return (personaje.equipo || []).map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          id: item.id || `item_${idx}`,
          idBase: item.idBase || (typeof item.id === 'string' ? item.id.split('_')[0] : null),
          nombre: item.nombre || 'Objeto misterioso',
          tipo: item.tipo || 'Varios',
          icono: item.icono || '🎒',
          desc: item.desc || '',
          efecto: item.efecto || null,
          dado: item.dado,
          defBono: item.defBono,
          valorMo: item.valorMo !== undefined ? item.valorMo : (item.valorVenta || 1),
          esLegendario: item.rareza === 'legendaria' || item.nombre?.includes('LEGENDARI')
        };
      }
      // Si viene como string antiguo (ej: 'Raciones de viaje (3 días)')
      const str = String(item);
      let tipo = 'Varios';
      let icono = '🎒';
      let efecto = null;
      let defBono = undefined;
      let valorMo = 1;

      if (str.toLowerCase().includes('poción') || str.toLowerCase().includes('pocion')) {
        tipo = 'Consumible';
        icono = '🧪';
        efecto = 'curar_6';
        valorMo = 12;
      } else if (str.toLowerCase().includes('ración') || str.toLowerCase().includes('racion')) {
        tipo = 'Consumible';
        icono = '🍖';
        efecto = 'curar_3';
        valorMo = 2;
      } else if (str.toLowerCase().includes('antorcha')) {
        tipo = 'Utilidad';
        icono = '🔥';
        valorMo = 1;
      } else if (str.toLowerCase().includes('anillo')) {
        tipo = 'Armadura';
        icono = '🛡️';
        defBono = 3;
        valorMo = 15;
      } else if (str.toLowerCase().includes('malla')) {
        tipo = 'Armadura';
        icono = '🛡️';
        defBono = 4;
        valorMo = 35;
      } else if (str.toLowerCase().includes('placa')) {
        tipo = 'Armadura';
        icono = '🛡️';
        defBono = 6;
        valorMo = 50;
      } else if (str.toLowerCase().includes('cuero')) {
        tipo = 'Armadura';
        icono = '🛡️';
        defBono = 2;
        valorMo = 2;
      } else if (str.toLowerCase().includes('daga') || str.toLowerCase().includes('espada') || str.toLowerCase().includes('hacha')) {
        tipo = 'Arma';
        icono = '🗡️';
        valorMo = 5;
      }

      return {
        id: `legacy_${idx}_${str.slice(0, 8)}`,
        idBase: normalizarIdArmadura(str),
        nombre: str,
        tipo,
        icono,
        desc: str,
        efecto,
        defBono,
        valorMo,
        esLegendario: false
      };
    });
  }, [personaje.equipo]);

  const bultosUsados = itemsMochila.length;
  const sobrecargado = bultosUsados > capacidadMax;
  const oroActual = personaje.monedas?.mo || 0;

  const notificar = (msg) => {
    setMensajeLocal(msg);
    if (onMostrarMensaje) onMostrarMensaje(msg);
    setTimeout(() => setMensajeLocal(null), 3500);
  };

  // -------------------------------------------------------------------
  // ACCIONES DEL INVENTARIO
  // -------------------------------------------------------------------
  const handleUsarObjeto = (item, indice) => {
    if (!item.efecto) {
      notificar(`ℹ️ ${item.nombre} no se puede consumir en este momento.`);
      return;
    }

    const nuevoPj = { ...personaje };
    let consumido = false;

    if (item.efecto === 'curar_6' || item.efecto === 'curar_3') {
      const cura = item.efecto === 'curar_6' ? 6 : 3;
      const pvMax = stats.pvMax || stats.pv || 16;
      const pvAntes = nuevoPj.pvActual || stats.pv || 16;

      if (pvAntes >= pvMax) {
        notificar('⚠️ Tu vitalidad ya está al máximo.');
        return;
      }

      const pvDespues = Math.min(pvMax, pvAntes + cura);
      nuevoPj.pvActual = pvDespues;
      sound.playHeal();
      consumido = true;
      notificar(`✨ ¡Bebiste ${item.nombre}! Recuperaste +${pvDespues - pvAntes} PV (${pvDespues}/${pvMax} PV).`);

      if (engine) {
        engine.curarJugador(cura * 10);
      }
    } else if (item.efecto === 'pod_3') {
      const podMax = stats.pod || (personaje.clase === 'hechicero' || personaje.clase === 'clerigo' ? 5 : 0);
      const podAntes = nuevoPj.podActual || 0;
      if (podAntes >= podMax) {
        notificar('⚠️ Tu Poder arcano ya está colmado.');
        return;
      }
      const podDespues = Math.min(podMax, podAntes + 3);
      nuevoPj.podActual = podDespues;
      sound.playMagic();
      consumido = true;
      notificar(`🔮 ¡Consumes ${item.nombre}! Recuperas +${podDespues - podAntes} POD.`);
    } else if (item.efecto === 'revelar_mapa') {
      if (engine) {
        engine.revelarMinimapa('completo');
      }
      sound.playMagic();
      consumido = true;
      notificar('📜 ¡El pergamino se disuelve revelando los secretos del piso!');
    }

    if (consumido) {
      const nuevoEquipo = [...(personaje.equipo || [])];
      nuevoEquipo.splice(indice, 1);
      nuevoPj.equipo = nuevoEquipo;
      guardarPersonajeLocal(nuevoPj);
      alActualizarPersonaje(nuevoPj);
    }
  };

  const handleEquiparArma = (item) => {
    sound.playSlash();
    const nuevoPj = { ...personaje };
    const armaAEquipar = {
      id: item.idBase || item.id,
      nombre: item.nombre,
      dado: item.dado || '1d6',
      danoMedio: item.danoMedio || 3,
      tipo: item.tipoAtaque || 'CaC'
    };

    const armasActuales = (nuevoPj.armas || []).filter(a => a.id !== item.id && a.nombre !== item.nombre);
    nuevoPj.armas = [armaAEquipar, ...armasActuales];

    guardarPersonajeLocal(nuevoPj);
    alActualizarPersonaje(nuevoPj);
    if (engine && engine.sincronizarConPersonajeVE) {
      engine.sincronizarConPersonajeVE(nuevoPj);
    }
    notificar(`⚔️ Has equipado "${item.nombre}" como tu arma principal.`);
  };

  const handleEquiparArmadura = (item) => {
    sound.playBlock();
    const idCanonico = normalizarIdArmadura(item);
    const armaduraActual = normalizarIdArmadura(personaje.armadura);
    
    // Si ya la tiene equipada, alternar a desequipar (volver a ropa)
    const nuevaArmadura = (armaduraActual === idCanonico) ? 'sin_armadura' : idCanonico;

    const nuevoPj = { ...personaje, armadura: nuevaArmadura };
    guardarPersonajeLocal(nuevoPj);
    alActualizarPersonaje(nuevoPj);
    if (engine && engine.sincronizarConPersonajeVE) {
      engine.sincronizarConPersonajeVE(nuevoPj);
    }
    const armObj = CATALOGO_ARMADURAS_VE.find(a => a.id === nuevaArmadura) || CATALOGO_ARMADURAS_VE[0];
    if (nuevaArmadura === 'sin_armadura') {
      notificar('🛡️ Te has quitado la armadura. Ahora vas con ropa común (10 + DES).');
    } else {
      notificar(`🛡️ Te has equipado: "${armObj.nombre}" (+${armObj.defBono} DEF).`);
    }
  };

  const handleToggleEscudo = () => {
    sound.playBlock();
    const nuevoPj = { ...personaje, escudo: !personaje.escudo };
    guardarPersonajeLocal(nuevoPj);
    alActualizarPersonaje(nuevoPj);
    if (engine && engine.sincronizarConPersonajeVE) {
      engine.sincronizarConPersonajeVE(nuevoPj);
    }
    notificar(nuevoPj.escudo ? '🛡️ Has empuñado el Escudo (+1 DEF).' : '🛡️ Has guardado el escudo a la espalda.');
  };

  const handleDescartarObjeto = (indice) => {
    const item = itemsMochila[indice];
    const nuevoPj = { ...personaje };
    const nuevoEquipo = [...(personaje.equipo || [])];
    nuevoEquipo.splice(indice, 1);
    nuevoPj.equipo = nuevoEquipo;
    guardarPersonajeLocal(nuevoPj);
    alActualizarPersonaje(nuevoPj);
    notificar(`🗑️ Descartaste "${item.nombre}" para aligerar carga.`);
  };

  // -------------------------------------------------------------------
  // TIENDA Y COMERCIO CON MIEMBROS DE LA ASOCIACIÓN
  // -------------------------------------------------------------------
  const handleComprarItem = (item) => {
    if (oroActual < item.costeMo) {
      sound.playMiss();
      notificar(`❌ Oro insuficiente: Requiere ${item.costeMo} mo y solo tienes ${oroActual} mo.`);
      return;
    }

    if (bultosUsados >= capacidadMax) {
      sound.playBlock();
      notificar(`⚠️ Mochila llena: Tienes ${bultosUsados}/${capacidadMax} bultos. Descarta o vende algo primero.`);
      return;
    }

    sound.playShopBuy();
    const nuevoOro = oroActual - item.costeMo;
    const nuevoPj = {
      ...personaje,
      monedas: {
        ...(personaje.monedas || {}),
        mo: nuevoOro
      },
      equipo: [
        ...(personaje.equipo || []),
        {
          id: `${item.id}_${Date.now()}`,
          idBase: item.id,
          nombre: item.nombre,
          tipo: item.tipo,
          icono: item.icono,
          desc: item.desc,
          efecto: item.efecto,
          dado: item.dado,
          danoMedio: item.danoMedio,
          defBono: item.defBono,
          valorMo: item.valorVenta || Math.max(1, Math.floor(item.costeMo / 2))
        }
      ]
    };

    if (engine) {
      engine.oro = nuevoOro;
    }

    guardarPersonajeLocal(nuevoPj);
    alActualizarPersonaje(nuevoPj);
    notificar(`🛒 ¡Compraste "${item.nombre}" por ${item.costeMo} mo! Guardado en la mochila.`);
  };

  const handleVenderItem = (indice) => {
    const item = itemsMochila[indice];
    const valorVenta = item.valorMo || 1;

    sound.playCoin();
    const nuevoOro = oroActual + valorVenta;
    const nuevoEquipo = [...(personaje.equipo || [])];
    nuevoEquipo.splice(indice, 1);

    const nuevoPj = {
      ...personaje,
      monedas: {
        ...(personaje.monedas || {}),
        mo: nuevoOro
      },
      equipo: nuevoEquipo
    };

    if (engine) {
      engine.oro = nuevoOro;
    }

    guardarPersonajeLocal(nuevoPj);
    alActualizarPersonaje(nuevoPj);
    notificar(`💰 Vendiste "${item.nombre}" por +${valorVenta} monedas de oro.`);
  };

  const handleVenderTodoElBotin = () => {
    const valiosos = itemsMochila.filter(i => i.tipo === 'Valioso' || i.nombre.includes('Trofeo') || i.nombre.includes('Colmillo') || i.nombre.includes('Gema'));
    if (valiosos.length === 0) {
      notificar('ℹ️ No tienes trofeos o gemas para vender en bloque.');
      return;
    }

    sound.playCoin();
    let oroGanado = 0;
    const nombresVendidos = new Set(valiosos.map(v => v.nombre));
    const nuevoEquipo = (personaje.equipo || []).filter(item => {
      const nombre = typeof item === 'object' ? item.nombre : String(item);
      if (nombresVendidos.has(nombre)) {
        const val = typeof item === 'object' ? (item.valorMo || item.valorVenta || 5) : 5;
        oroGanado += val;
        return false;
      }
      return true;
    });

    const nuevoOro = oroActual + oroGanado;
    const nuevoPj = {
      ...personaje,
      monedas: {
        ...(personaje.monedas || {}),
        mo: nuevoOro
      },
      equipo: nuevoEquipo
    };

    if (engine) engine.oro = nuevoOro;
    guardarPersonajeLocal(nuevoPj);
    alActualizarPersonaje(nuevoPj);
    notificar(`💰 ¡Liquidación de botín! Vendiste ${valiosos.length} tesoros por +${oroGanado} mo.`);
  };

  // Filtrado de objetos de la mochila
  const itemsFiltrados = itemsMochila.filter(i => {
    if (filtroTipo === 'consumibles') return i.tipo === 'Consumible';
    if (filtroTipo === 'equipo') return i.tipo === 'Arma' || i.tipo === 'Armadura' || i.tipo === 'Escudo';
    if (filtroTipo === 'botin') return i.tipo === 'Valioso' || i.tipo === 'Varios' || i.esLegendario;
    return true;
  });

  const armaEquipada = personaje.armas?.[0] || { nombre: 'Espada Básica', dado: '1d6', tipo: 'CaC' };
  const armaduraEquipadaObj = CATALOGO_ARMADURAS_VE.find(a => a.id === normalizarIdArmadura(personaje.armadura)) || CATALOGO_ARMADURAS_VE[0];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in select-none">
      <div className="bg-stone-950 border-2 border-amber-900/60 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] text-stone-200 font-sans">
        
        {/* HEADER VIEJA ESCUELA */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 px-5 py-3.5 border-b border-amber-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-xl shadow-inner">
              🎒
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-widest flex items-center gap-2">
                Inventario & Suministros VE
                <span className="text-[10px] bg-amber-950 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-800/80">
                  OSR OFICIAL
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                {personaje.nombre} • {personaje.raza?.toUpperCase()} {personaje.clase?.toUpperCase()} NVL {personaje.nivel || 1}
              </p>
            </div>
          </div>

          {/* MONEDERO Y CAPACIDAD */}
          <div className="flex items-center gap-3">
            <div className="bg-stone-900/90 border border-stone-800 px-3 py-1.5 rounded-xl flex items-center gap-2.5 text-xs font-bold">
              <span className="text-amber-400 flex items-center gap-1" title="Monedas de Oro">
                🪙 {oroActual} <span className="text-[10px] text-stone-400">mo</span>
              </span>
              <span className="text-stone-400" title="Monedas de Plata">
                ⚪ {personaje.monedas?.mp || 0} <span className="text-[10px] text-stone-500">mp</span>
              </span>
            </div>

            <button
              onClick={alCerrar}
              className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center font-bold text-sm border border-stone-800 transition active:scale-95"
              title="Cerrar (ESC)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BARRA DE PESTAÑAS */}
        <div className="flex border-b border-stone-800 bg-stone-900/50 px-5 pt-2 gap-2 text-xs font-bold uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setPestaña('inventario')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              pestaña === 'inventario'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>🎒</span> Mochila & Ranuras ({bultosUsados}/{capacidadMax})
          </button>
          <button
            onClick={() => setPestaña('tienda')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              pestaña === 'tienda'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>🛒</span> Tienda del Gremio
          </button>
          <button
            onClick={() => setPestaña('vender')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              pestaña === 'vender'
                ? 'border-amber-600 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>💰</span> Vender Botín
          </button>
        </div>

        {/* NOTIFICACIÓN TOAST LOCAL */}
        {mensajeLocal && (
          <div className="bg-amber-950/80 border-b border-amber-600/50 px-5 py-2 text-xs text-amber-200 font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <span>{mensajeLocal}</span>
            <span className="text-[10px] text-amber-400/80">● notificación</span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* ========================================================= */}
          {/* 1. PESTAÑA: MOCHILA Y RANURAS ACTIVAS                     */}
          {/* ========================================================= */}
          {pestaña === 'inventario' && (
            <div className="space-y-4">
              
              {/* RANURAS DE EQUIPO ACTIVO (ARMADURA, ARMA, ESCUDO) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* ARMA PRINCIPAL */}
                <div className="bg-stone-900/80 border border-amber-900/40 p-3 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1">⚔️ Arma Activa</span>
                    <span className="text-[10px] text-stone-400">Ranura Mano</span>
                  </div>
                  <div className="my-1">
                    <h4 className="text-sm font-black text-stone-100 truncate">{armaEquipada.nombre}</h4>
                    <p className="text-xs text-stone-400">
                      Daño: <strong className="text-amber-300">{armaEquipada.dado}</strong> ({armaEquipada.tipo})
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-500">Empuñada en combates</span>
                </div>

                {/* ARMADURA */}
                <div className="bg-stone-900/80 border border-amber-900/40 p-3 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1">🛡️ Armadura</span>
                    <span className="text-[10px] text-stone-400">+{armaduraEquipadaObj.defBono} DEF</span>
                  </div>
                  <div className="my-1">
                    <h4 className="text-sm font-black text-stone-100 truncate">{armaduraEquipadaObj.nombre}</h4>
                    <p className="text-xs text-stone-400">
                      {armaduraEquipadaObj.penalizaMov ? '⚠️ Reduce Mov a 6m' : 'Movimiento normal'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <span>Cambiar en tienda o mochila</span>
                  </div>
                </div>

                {/* ESCUDO Y DEFENSA TOTAL */}
                <div className="bg-stone-900/80 border border-amber-900/40 p-3 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1">🛡️ Escudo & CA</span>
                    <span className="text-[10px] font-black text-emerald-400">CA TOTAL: {stats.def}</span>
                  </div>
                  <div className="my-1 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-stone-100">
                        {personaje.escudo ? 'Escudo Equipado (+1)' : 'Sin Escudo'}
                      </h4>
                      <p className="text-xs text-stone-400">
                        Base: 10 + DES ({formatearMod(getModificador(personaje.atributos?.des || 10))})
                      </p>
                    </div>
                    <button
                      onClick={handleToggleEscudo}
                      className="px-2.5 py-1 text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-lg border border-stone-700 transition"
                    >
                      {personaje.escudo ? 'Guardar' : 'Empuñar'}
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-500">Fórmula: 10 + DES + Armadura + Escudo</span>
                </div>
              </div>

              {/* MEDIDOR DE CAPACIDAD DE CARGA (BULTOS) */}
              <div className="bg-stone-900/50 border border-stone-800 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-300 flex items-center gap-1.5">
                    <span>⚖️ Capacidad de Carga:</span>
                    <strong className={sobrecargado ? 'text-red-400' : 'text-amber-300'}>
                      {bultosUsados} / {capacidadMax} bultos
                    </strong>
                    <span className="text-[10px] text-stone-500">(Igual al atributo FUE)</span>
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {sobrecargado ? '⚠️ ¡SOBRECARGADO!' : 'Carga dentro del límite reglamentario'}
                  </span>
                </div>

                {/* BARRA DE PROGRESO */}
                <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      sobrecargado
                        ? 'bg-red-600'
                        : bultosUsados / capacidadMax > 0.8
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (bultosUsados / capacidadMax) * 100)}%` }}
                  ></div>
                </div>

                {sobrecargado && (
                  <p className="text-[11px] text-red-400 font-medium">
                    ⚠️ <strong>Regla Vieja Escuela:</strong> Superas tu Fuerza en bultos. Sufres penalización al movimiento y desventaja en maniobras atléticas.
                  </p>
                )}
              </div>

              {/* FILTROS DE MOCHILA */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="text-stone-400 text-[11px] mr-1">Filtrar:</span>
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'consumibles', label: '🧪 Pociones' },
                    { id: 'equipo', label: '⚔️ Equipo' },
                    { id: 'botin', label: '💎 Botín & Trofeos' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFiltroTipo(f.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs transition ${
                        filtroTipo === f.id
                          ? 'bg-amber-600 text-stone-950 font-black shadow'
                          : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-stone-500 font-medium">
                  Mostrando {itemsFiltrados.length} objeto(s)
                </span>
              </div>

              {/* LISTA / GRID DE OBJETOS EN MOCHILA */}
              {itemsFiltrados.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-stone-800 rounded-3xl text-stone-500 text-xs">
                  <span className="text-3xl block mb-2">🕸️</span>
                  No tienes objetos en esta categoría. Explora la cripta o visita a los comerciantes.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {itemsFiltrados.map((item, idx) => {
                    const esArma = item.tipo === 'Arma' || item.dado;
                    const esArmadura = item.tipo === 'Armadura' || item.defBono;
                    const esConsumible = item.tipo === 'Consumible' || item.efecto;

                    return (
                      <div
                        key={`mochila_${idx}_${item.id}`}
                        className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          item.esLegendario
                            ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-stone-900/60 hover:bg-stone-900 border-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl flex-shrink-0">{item.icono || '🎒'}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-stone-100 truncate">
                                {item.nombre}
                              </h4>
                              {item.esLegendario && (
                                <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-1.5 rounded-full">
                                  LEGENDARIO
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-400 truncate">
                              {item.desc || `${item.tipo} • Valor: ${item.valorMo} mo`}
                            </p>
                          </div>
                        </div>

                        {/* BOTONES DE ACCIÓN */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {esConsumible && (
                            <button
                              onClick={() => handleUsarObjeto(item, idx)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-stone-100 font-bold text-[11px] rounded-lg shadow transition active:scale-95"
                              title="Consumir ahora"
                            >
                              Usar
                            </button>
                          )}

                          {esArma && (
                            <button
                              onClick={() => handleEquiparArma(item)}
                              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg shadow transition active:scale-95 ${
                                (armaEquipada.nombre === item.nombre || armaEquipada.id === item.id)
                                  ? 'bg-amber-500 text-stone-950 font-black border border-amber-300'
                                  : 'bg-amber-700 hover:bg-amber-600 text-stone-100'
                              }`}
                              title="Equipar como arma principal"
                            >
                              {(armaEquipada.nombre === item.nombre || armaEquipada.id === item.id) ? '✅ Empuñada' : 'Equipar'}
                            </button>
                          )}

                          {esArmadura && (
                            <button
                              onClick={() => handleEquiparArmadura(item)}
                              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg shadow transition active:scale-95 ${
                                normalizarIdArmadura(personaje.armadura) === normalizarIdArmadura(item)
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                                  : 'bg-blue-700 hover:bg-blue-600 text-stone-100'
                              }`}
                              title={
                                normalizarIdArmadura(personaje.armadura) === normalizarIdArmadura(item)
                                  ? 'Armadura puesta actualmente. Clic para desvestir.'
                                  : 'Ponerse esta armadura'
                              }
                            >
                              {normalizarIdArmadura(personaje.armadura) === normalizarIdArmadura(item) ? '✅ Puesta' : 'Vestir'}
                            </button>
                          )}

                          <button
                            onClick={() => handleDescartarObjeto(idx)}
                            className="p-1 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-lg transition text-xs"
                            title="Tirar al suelo (Descartar)"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. PESTAÑA: TIENDA DEL GREMIO (MIEMBROS ASOCIACIÓN)       */}
          {/* ========================================================= */}
          {pestaña === 'tienda' && (
            <div className="space-y-4">
              
              {/* SELECTOR DE MIEMBRO COMERCIANTE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => setMercaderActivo('delo')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                    mercaderActivo === 'delo'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md'
                      : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span className="text-2xl">🧪</span>
                  <div>
                    <h4 className="text-xs font-black uppercase">Agustina "Delo"</h4>
                    <p className="text-[10px] text-stone-400">Alquimia, Pociones & Raciones</p>
                  </div>
                </button>

                <button
                  onClick={() => setMercaderActivo('guillermo')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                    mercaderActivo === 'guillermo'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md'
                      : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <h4 className="text-xs font-black uppercase">Guillermo "Chiquito"</h4>
                    <p className="text-[10px] text-stone-400">Arsenal, Armaduras & Forja</p>
                  </div>
                </button>

                <button
                  onClick={() => setMercaderActivo('diny')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                    mercaderActivo === 'diny'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md'
                      : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span className="text-2xl">🗺️</span>
                  <div>
                    <h4 className="text-xs font-black uppercase">Diana "Diny"</h4>
                    <p className="text-[10px] text-stone-400">Mapas, Ganzúas & Cuerdas</p>
                  </div>
                </button>
              </div>

              {/* LISTA DE ARTÍCULOS EN VENTA */}
              <div className="bg-stone-900/30 border border-stone-800/80 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-stone-800 text-xs font-bold">
                  <span className="text-stone-300">
                    Catálogo de{' '}
                    <strong className="text-amber-300">
                      {mercaderActivo === 'delo'
                        ? 'Agustina "Delo"'
                        : mercaderActivo === 'guillermo'
                        ? 'Guillermo "Chiquito" & Javier'
                        : 'Diana "Diny"'}
                    </strong>
                  </span>
                  <span className="text-stone-400">Tu Saldo: <strong className="text-amber-400">{oroActual} mo</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(mercaderActivo === 'delo'
                    ? TIENDA_DELO
                    : mercaderActivo === 'guillermo'
                    ? TIENDA_GUILLERMO
                    : TIENDA_DINY
                  ).map((art) => {
                    const puedeComprar = oroActual >= art.costeMo && bultosUsados < capacidadMax;

                    return (
                      <div
                        key={art.id}
                        className="p-3 bg-stone-900/70 border border-stone-800 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-700/50 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl flex-shrink-0">{art.icono}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-stone-100 truncate">
                                {art.nombre}
                              </h5>
                              <span className="text-[10px] font-black text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 flex-shrink-0">
                                {art.costeMo} mo
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 truncate">
                              {art.desc}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleComprarItem(art)}
                          disabled={!puedeComprar}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex-shrink-0 active:scale-95 ${
                            puedeComprar
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-md'
                              : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
                          }`}
                        >
                          Comprar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. PESTAÑA: VENDER BOTÍN Y TROFEOS                        */}
          {/* ========================================================= */}
          {pestaña === 'vender' && (
            <div className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💰</span> Casa de Empeño & Correduría de Guillermo
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Vende gemas, colmillos de bestias y equipo sobrante recuperado de los monstruos por monedas de oro directas.
                  </p>
                </div>
                <button
                  onClick={handleVenderTodoElBotin}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase rounded-xl transition shadow active:scale-95 flex-shrink-0"
                >
                  Vender Todos los Trofeos
                </button>
              </div>

              {/* LISTADO DE OBJETOS VENDIBLES */}
              {itemsMochila.length === 0 ? (
                <div className="py-12 text-center border border-stone-800 rounded-3xl text-stone-500 text-xs">
                  No tienes ningún objeto en la mochila para vender.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {itemsMochila.map((item, idx) => (
                    <div
                      key={`vender_${idx}_${item.id}`}
                      className="p-3 bg-stone-900/70 border border-stone-800 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-700/50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl flex-shrink-0">{item.icono || '🎒'}</span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-stone-100 truncate">{item.nombre}</h5>
                          <p className="text-[11px] text-stone-400 truncate">
                            {item.desc || item.tipo}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleVenderItem(idx)}
                        className="px-3 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase rounded-xl transition shadow active:scale-95 flex-shrink-0"
                      >
                        +{item.valorMo || 1} mo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER INFORMATIVO */}
        <div className="bg-stone-900/80 px-5 py-2.5 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span>
            Reglas Oficiales: <strong>Vieja Escuela: El Juego de Rol</strong>
          </span>
          <span className="hidden sm:inline">
            Pulsa <strong>ESC</strong> o <strong>I</strong> para volver a la exploración
          </span>
        </div>

      </div>
    </div>
  );
}
