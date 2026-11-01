// =====================================================================
// VIEJA ESCUELA: EL JUEGO DE ROL - MOTOR DE REGLAS & ESTADÍSTICAS
// Basado fielmente en el manual oficial "Vieja Escuela: el juego de rol"
// =====================================================================

export const TABLA_MODIFICADORES = [
  { min: 3, max: 3, mod: -2, label: '-2' },
  { min: 4, max: 6, mod: -1, label: '-1' },
  { min: 7, max: 14, mod: 0, label: '0' },
  { min: 15, max: 17, mod: 1, label: '+1' },
  { min: 18, max: 18, mod: 2, label: '+2' }
];

export function getModificador(valor) {
  const v = Math.max(3, Math.min(18, Number(valor) || 10));
  if (v <= 3) return -2;
  if (v <= 6) return -1;
  if (v <= 14) return 0;
  if (v <= 17) return 1;
  return 2;
}

export function formatearMod(mod) {
  return mod > 0 ? `+${mod}` : `${mod}`;
}

// ---------------------------------------------------------------------
// 1. RAZAS OFICIALES
// ---------------------------------------------------------------------
export const RAZAS_VE = {
  elfo: {
    id: 'elfo',
    nombre: 'Elfo',
    mov: 12,
    modAtributo: { des: 1, con: -1 },
    talentos: ['Vista Aguda', 'Infravisión'],
    descripcion: 'Ganas los talentos Vista Aguda (ventaja en pruebas de Alerta visuales) e Infravisión (20 metros). Movimiento: 12m.'
  },
  enano: {
    id: 'enano',
    nombre: 'Enano',
    mov: 9,
    modAtributo: { con: 1, car: -1 },
    talentos: ['Afín a la Piedra', 'Infravisión'],
    descripcion: 'Ganas los talentos Afín a la Piedra (ventaja en Erudición de roca y Alerta para trampas de piedra) e Infravisión (20 metros). Movimiento: 9m.'
  },
  mediano: {
    id: 'mediano',
    nombre: 'Mediano',
    mov: 9,
    modAtributo: { des: 1, fue: -1 },
    talentos: ['Escurridizo', 'Certero'],
    descripcion: 'Ganas los talentos Escurridizo (ventaja en Subterfugio para moverse en silencio) y Certero (+1 en ataques con proyectiles). Movimiento: 9m.'
  },
  humano: {
    id: 'humano',
    nombre: 'Humano',
    mov: 12,
    modAtributo: {},
    talentos: ['Ímpetu Emprendedor', 'Adaptable'],
    descripcion: 'Ganas los talentos Ímpetu Emprendedor (un trasfondo adicional) y Adaptable (+1 al rasgo de Instintos). Movimiento: 12m.'
  }
};

// ---------------------------------------------------------------------
// 2. CLASES OFICIALES (+ Clérigo OSR clásico)
// ---------------------------------------------------------------------
export const CLASES_VE = {
  guerrero: {
    id: 'guerrero',
    nombre: 'Guerrero',
    da: 8,
    daNom: 'd8',
    armasPermitidas: 'Todas las armas',
    armadurasPermitidas: 'Todas las armaduras y escudos',
    talentos: ['Lucha con Arma y Escudo', 'Ataques Múltiples'],
    descripcion: 'Experto en armas pesadas y táctica marcial. Puedes encadenar ataques extra al abatir enemigos.',
    requierePod: false
  },
  hechicero: {
    id: 'hechicero',
    nombre: 'Hechicero',
    da: 4,
    daNom: 'd4',
    armasPermitidas: 'Dagas, bastones y hondas',
    armadurasPermitidas: 'Ninguna',
    talentos: ['Sensibilidad Mágica', 'Transferir Esencia'],
    descripcion: 'Erudito de las artes arcanas. Utiliza Puntos de Poder (POD) para conjurar hechizos y puede convertir 3 PV en 1 POD.',
    requierePod: true
  },
  bribon: {
    id: 'bribon',
    nombre: 'Bribón',
    da: 6,
    daNom: 'd6',
    armasPermitidas: 'Cualquier arma',
    armadurasPermitidas: 'Armaduras ligeras (Cuero)',
    talentos: ['Emboscar', 'Dedos Ágiles'],
    descripcion: 'Especialista en subterfugio y ganzúas. Inflige +1d6 (o +3 de daño medio) al atacar a un enemigo desprevenido.',
    requierePod: false
  },
  clerigo: {
    id: 'clerigo',
    nombre: 'Clérigo',
    da: 6,
    daNom: 'd6',
    armasPermitidas: 'Mazas, martillos, bastones y hondas',
    armadurasPermitidas: 'Hasta cotas de malla y escudos',
    talentos: ['Sensibilidad Sagrada', 'Expulsar Muertos Vivientes'],
    descripcion: 'Devoto de los dioses sagrados. Canaliza bendiciones, cura heridas e impone su fe ante los no-muertos.',
    requierePod: true
  }
};

// ---------------------------------------------------------------------
// 3. TABLA DE AVANCE POR NIVEL (Página 6 del manual)
// ---------------------------------------------------------------------
export const TABLA_AVANCE_VE = {
  1: {
    guerrero:  { atq: 0, pod: 0, ins: 1 },
    hechicero: { atq: 0, pod: 1, ins: 0 },
    bribon:    { atq: 0, pod: 0, ins: 0 },
    clerigo:   { atq: 0, pod: 1, ins: 1 }
  },
  2: {
    guerrero:  { atq: 1, pod: 0, ins: 2 },
    hechicero: { atq: 0, pod: 2, ins: 1 },
    bribon:    { atq: 0, pod: 0, ins: 1 },
    clerigo:   { atq: 1, pod: 2, ins: 2 }
  },
  3: {
    guerrero:  { atq: 1, pod: 0, ins: 3 },
    hechicero: { atq: 0, pod: 4, ins: 2 },
    bribon:    { atq: 1, pod: 0, ins: 2 },
    clerigo:   { atq: 1, pod: 3, ins: 2 }
  },
  4: {
    guerrero:  { atq: 2, pod: 0, ins: 4 },
    hechicero: { atq: 1, pod: 5, ins: 3 },
    bribon:    { atq: 1, pod: 0, ins: 3 },
    clerigo:   { atq: 2, pod: 5, ins: 3 }
  },
  5: {
    guerrero:  { atq: 2, pod: 0, ins: 5 },
    hechicero: { atq: 1, pod: 7, ins: 4 },
    bribon:    { atq: 2, pod: 0, ins: 4 },
    clerigo:   { atq: 2, pod: 6, ins: 4 }
  },
  6: {
    guerrero:  { atq: 3, pod: 0, ins: 6 },
    hechicero: { atq: 2, pod: 8, ins: 5 },
    bribon:    { atq: 2, pod: 0, ins: 5 },
    clerigo:   { atq: 3, pod: 8, ins: 5 }
  },
  7: {
    guerrero:  { atq: 4, pod: 0, ins: 7 },
    hechicero: { atq: 2, pod: 10, ins: 6 },
    bribon:    { atq: 3, pod: 0, ins: 6 },
    clerigo:   { atq: 3, pod: 9, ins: 6 }
  },
  8: {
    guerrero:  { atq: 5, pod: 0, ins: 8 },
    hechicero: { atq: 3, pod: 12, ins: 7 },
    bribon:    { atq: 3, pod: 0, ins: 7 },
    clerigo:   { atq: 4, pod: 11, ins: 7 }
  },
  9: {
    guerrero:  { atq: 6, pod: 0, ins: 9 },
    hechicero: { atq: 3, pod: 14, ins: 8 },
    bribon:    { atq: 4, pod: 0, ins: 8 },
    clerigo:   { atq: 4, pod: 13, ins: 8 }
  },
  10: {
    guerrero:  { atq: 7, pod: 0, ins: 10 },
    hechicero: { atq: 3, pod: 15, ins: 9 },
    bribon:    { atq: 5, pod: 0, ins: 9 },
    clerigo:   { atq: 5, pod: 14, ins: 9 }
  }
};

// ---------------------------------------------------------------------
// 4. HABILIDADES
// ---------------------------------------------------------------------
export const HABILIDADES_VE = [
  { id: 'alerta', nombre: 'Alerta', atributo: 'sab', desc: 'Notar algo visible, oír un ruido, buscar o registrar un lugar.' },
  { id: 'comunicacion', nombre: 'Comunicación', atributo: 'car', desc: 'Influir, motivar, entenderse con otros seres y negociar.' },
  { id: 'manipulacion', nombre: 'Manipulación', atributo: 'des', desc: 'Abrir cerraduras, inutilizar trampas o sustraer objetos.' },
  { id: 'erudicion', nombre: 'Erudición', atributo: 'int', desc: 'Idiomas antiguos, leyendas, historia y conocimiento arcano.' },
  { id: 'subterfugio', nombre: 'Subterfugio', atributo: 'des', desc: 'Deslizarse en silencio, ocultarse en las sombras y emboscar.' },
  { id: 'supervivencia', nombre: 'Supervivencia', atributo: 'sab', desc: 'Seguir rastros, orientarse en la naturaleza y forrajear.' }
];

// ---------------------------------------------------------------------
// 5. CATÁLOGO DE ARMAS CON DAÑO MEDIO (Agilidad de Combate OSR)
// ---------------------------------------------------------------------
export const CATALOGO_ARMAS_VE = [
  {
    id: 'daga',
    nombre: 'Daga',
    dado: '1d4',
    danoMedio: 2,
    coste: '2 mo',
    tipo: 'CaC / Proyectil',
    alcance: '4 metros',
    dosManos: false,
    descripcion: 'Ligera y fácil de ocultar. Arrojadiza a 4 metros.'
  },
  {
    id: 'porra',
    nombre: 'Porra',
    dado: '1d4',
    danoMedio: 2,
    coste: '0 mo',
    tipo: 'CaC',
    dosManos: false,
    descripcion: 'Arma contundente básica improvisada.'
  },
  {
    id: 'honda',
    nombre: 'Honda',
    dado: '1d4',
    danoMedio: 2,
    coste: '2 mp',
    tipo: 'Proyectil',
    alcance: '20 metros',
    disparos: 1,
    dosManos: false,
    descripcion: 'Lanza piedras o balas de plomo con rapidez.'
  },
  {
    id: 'martillo_guerra',
    nombre: 'Martillo de Guerra',
    dado: '1d4+1',
    danoMedio: 3,
    coste: '1 mo',
    tipo: 'CaC',
    dosManos: false,
    descripcion: 'Eficaz contra armaduras pesadas y esqueletos.'
  },
  {
    id: 'espada_corta',
    nombre: 'Espada Corta',
    dado: '1d6',
    danoMedio: 3,
    coste: '8 mo',
    tipo: 'CaC',
    dosManos: false,
    descripcion: 'Rápida, maniobrable y letal en corredores estrechos.'
  },
  {
    id: 'maza_pesada',
    nombre: 'Maza Pesada',
    dado: '1d6',
    danoMedio: 3,
    coste: '10 mo',
    tipo: 'CaC',
    dosManos: false,
    descripcion: 'Arma pesada de impacto predilecta de clérigos.'
  },
  {
    id: 'lanza',
    nombre: 'Lanza',
    dado: '1d6',
    danoMedio: 3,
    coste: '1 mo',
    tipo: 'CaC / Proyectil',
    alcance: '8 metros',
    dosManos: false,
    bonoDosManos: 1,
    descripcion: 'Alcance medio. A dos manos causa +1 al daño (Media: 4). Arrojadiza a 8 metros.'
  },
  {
    id: 'baston',
    nombre: 'Bastón (a dos manos)',
    dado: '1d6',
    danoMedio: 3,
    coste: '0 mo',
    tipo: 'CaC',
    dosManos: true,
    bonoDosManos: 1,
    descripcion: 'Sencillo y versátil. A dos manos causa +1 al daño (Media: 4).'
  },
  {
    id: 'espada_larga',
    nombre: 'Espada Larga',
    dado: '1d8',
    danoMedio: 4,
    coste: '15 mo',
    tipo: 'CaC',
    dosManos: false,
    bonoDosManos: 1,
    descripcion: 'El arma predilecta del guerrero. A dos manos causa +1 al daño (Media: 5).'
  },
  {
    id: 'hacha_batalla',
    nombre: 'Hacha de Batalla',
    dado: '1d8',
    danoMedio: 4,
    coste: '5 mo',
    tipo: 'CaC',
    dosManos: false,
    bonoDosManos: 1,
    descripcion: 'Hoja pesada de corte tremendo. A dos manos causa +1 al daño (Media: 5).'
  },
  {
    id: 'mandoble',
    nombre: 'Espada a dos manos',
    dado: '1d10',
    danoMedio: 5,
    coste: '30 mo',
    tipo: 'CaC',
    dosManos: true,
    descripcion: 'Enorme mandoble que requiere ambas manos. Impacto demoledor.'
  },
  {
    id: 'arco',
    nombre: 'Arco',
    dado: '1d6',
    danoMedio: 3,
    coste: '15 mo',
    tipo: 'Proyectil',
    disparos: 2,
    alcance: '60 metros',
    dosManos: true,
    descripcion: 'Permite 2 disparos por asalto a blancos hasta 60 metros.'
  },
  {
    id: 'ballesta_ligera',
    nombre: 'Ballesta Ligera',
    dado: '1d4+1',
    danoMedio: 3,
    coste: '12 mo',
    tipo: 'Proyectil',
    disparos: 1,
    alcance: '70 metros',
    dosManos: true,
    descripcion: 'Disparo potente y preciso hasta 70 metros.'
  }
];

// ---------------------------------------------------------------------
// 6. CATÁLOGO DE ARMADURAS & PROTECCIÓN
// ---------------------------------------------------------------------
export const CATALOGO_ARMADURAS_VE = [
  { id: 'sin_armadura', nombre: 'Sin Armadura / Ropa', defBono: 0, coste: '0 mo', penalizaMov: false },
  { id: 'cuero', nombre: 'Armadura de Cuero', defBono: 2, coste: '5 mo', penalizaMov: false },
  { id: 'anillos', nombre: 'Armadura de Anillos', defBono: 3, coste: '30 mo', penalizaMov: false },
  { id: 'mallas', nombre: 'Cota de Mallas', defBono: 4, coste: '75 mo', penalizaMov: false },
  { id: 'placas', nombre: 'Armadura de Placas', defBono: 6, coste: '100 mo', penalizaMov: true, nota: 'Mov máximo 6m y sobrecargado' }
];

export const CATALOGO_ESCUDOS_VE = [
  { id: 'ninguno', nombre: 'Sin Escudo', defBono: 0, coste: '0 mo' },
  { id: 'escudo', nombre: 'Escudo de Madera / Metal', defBono: 1, coste: '15 mo' }
];

// ---------------------------------------------------------------------
// 7. CONJUROS Y HECHIZOS (Páginas 10-11)
// ---------------------------------------------------------------------
export const CONJUROS_VE = [
  {
    id: 'curar_heridas',
    nombre: 'Curar Heridas',
    costePod: 1,
    danoMedio: 3, // 1d6 cura
    dado: '1d6',
    tipo: 'Curación',
    descripcion: 'Restaura vitalidad a un aliado (Media: 3 PV por cada Pod invertido).'
  },
  {
    id: 'proyectil_arcano',
    nombre: 'Proyectil Ácido / Arcano',
    costePod: 1,
    danoMedio: 3, // 1d6 daño
    dado: '1d6',
    tipo: 'Ataque',
    descripcion: 'Dardo mágico certero que impacta sin fallo (Media: 3 de daño por cada Pod).'
  },
  {
    id: 'dormir',
    nombre: 'Dormir',
    costePod: 1,
    tipo: 'Control',
    descripcion: 'Sume a una criatura en un sueño profundo si falla tirada de Instintos.'
  },
  {
    id: 'escudo_magico',
    nombre: 'Escudo Mágico',
    costePod: 1,
    tipo: 'Defensa',
    descripcion: 'Otorga +4 a la Defensa durante un combate completo.'
  },
  {
    id: 'luz',
    nombre: 'Luz',
    costePod: 1,
    tipo: 'Utilidad',
    descripcion: 'Crea una esfera de luz radiante en un radio de 20 metros por 1 hora.'
  },
  {
    id: 'bola_fuego',
    nombre: 'Bola de Fuego',
    costePod: 3,
    danoMedio: 9, // 3d6
    dado: '3d6',
    tipo: 'Ataque en Área',
    descripcion: 'Devastadora explosión de llamas (Media: 9 de daño en área. Instintos DES para mitad).'
  }
];

// ---------------------------------------------------------------------
// 8. ROLES OFICIALES DE LOS MIEMBROS DE LA ASOCIACIÓN
// ---------------------------------------------------------------------
export const MIEMBROS_ASOCIACION_VE = {
  martin: {
    nombre: 'Martín',
    apodo: 'Compañero de Vanguardia',
    clase: 'Guerrero',
    raza: 'Humano',
    rol: 'Ayudante de Expedición',
    descripcion: 'Acude a las batallas junto al grupo con Espada Larga y Escudo. Firme en primera línea.',
    arma: 'Espada Larga (Media: 4+FUE)'
  },
  ayrton: {
    nombre: 'Ayrton',
    apodo: 'Bárbaro Mercenario',
    clase: 'Guerrero',
    raza: 'Humano',
    rol: 'Ayudante de Expedición',
    descripcion: 'Empuña un hacha de batalla a dos manos. Especialista en abrirse paso entre hordas enemigas.',
    arma: 'Hacha de Batalla (Media: 5+FUE)'
  },
  delo: {
    nombre: 'Agustina "Delo"',
    apodo: 'Alquimista Halfling',
    clase: 'Bribón',
    raza: 'Mediano',
    rol: 'Comerciante de Pociones & Raciones',
    descripcion: 'Vende pociones de curación (Media 6 PV por 25 mo), antídotos y raciones de viaje.',
    inventario: ['Poción de Curación', 'Antídoto', 'Raciones de viaje']
  },
  diny: {
    nombre: 'Diana "Diny"',
    apodo: 'Cartógrafa Enana',
    clase: 'Erudita',
    raza: 'Enano',
    rol: 'Guía de Mapas & Trampas de Roca',
    descripcion: 'Facilita mapas detallados y otorga ventaja en detectar trampas pétreas y puertas secretas.',
    beneficio: 'Ventaja en pruebas de Alerta y Afín a la Piedra'
  },
  javier: {
    nombre: 'Javier',
    apodo: 'Armero & Táctico',
    clase: 'Guerrero / Forjador',
    raza: 'Humano',
    rol: 'Comerciante de Armas & Equipos',
    descripcion: 'Forja y vende el arsenal oficial del manual: espadas, armaduras, arcos y herramientas.',
    tienda: 'Arsenal del Apéndice T'
  },
  keith: {
    nombre: 'Keith',
    apodo: 'Guardiana de los Bosques',
    clase: 'Exploradora',
    raza: 'Elfo',
    rol: 'Custodia de la Vegetación & Pantanos',
    descripcion: 'Vigila los mapas con flora, pantanos y la Cripta de la Espora. Otorga +2 en Supervivencia.',
    beneficio: '+2 en tiradas de Supervivencia'
  },
  guille: {
    nombre: 'Guille "Chiquito"',
    apodo: 'Tesorero & Corredor',
    clase: 'Mercader',
    raza: 'Humano',
    rol: 'Intercambio de Jugadores & Comisión',
    descripcion: 'Intermedia en el trueque y comercio seguro entre aventureros cobrando 10% de comisión gremial.',
    comision: '10% en mo/mp'
  },
  victor: {
    nombre: 'Víctor "DM"',
    apodo: 'Director de Juego',
    clase: 'Archimago Narrador',
    raza: 'Humano',
    rol: 'Narrador & Árbitro de Reglas',
    descripcion: 'Describe las salas, plantea los acertijos y decide las consecuencias de cada tirada.'
  },
  matias: {
    nombre: 'Matías',
    apodo: 'Presidente Supremo',
    clase: 'Lich Soberano',
    raza: 'Especial',
    rol: 'Presidente de la Mazmorra',
    descripcion: 'Supervisa que todo marche en orden en el gremio y desafía a los aventureros más osados.'
  }
};

// ---------------------------------------------------------------------
// 9. GENERACIÓN Y CÁLCULO DE PERSONAJE
// ---------------------------------------------------------------------

/**
 * Tira 3d6 siete veces y devuelve los resultados ordenados.
 */
export function tirarSieteVeces3d6() {
  const tiradas = [];
  for (let i = 0; i < 7; i++) {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    tiradas.push(d1 + d2 + d3);
  }
  return tiradas.sort((a, b) => b - a);
}

/**
 * Crea una plantilla de personaje inicial de nivel 1.
 */
export function crearPersonajeInicial({
  nombre = 'Aventurero',
  raza = 'humano',
  clase = 'guerrero',
  atributos = { fue: 14, des: 12, con: 13, int: 10, sab: 10, car: 10 },
  trasfondos = ['Soldado en las guerras del norte']
} = {}) {
  const razaData = RAZAS_VE[raza] || RAZAS_VE.humano;
  const claseData = CLASES_VE[clase] || CLASES_VE.guerrero;

  // Habilidades iniciales: 4 puntos a repartir (máx 1 por habilidad a nivel 1)
  const habilidades = {
    alerta: 1,
    comunicacion: 0,
    manipulacion: clase === 'bribon' ? 1 : 0,
    erudicion: clase === 'hechicero' ? 1 : 0,
    subterfugio: clase === 'bribon' ? 1 : 0,
    supervivencia: clase === 'guerrero' ? 1 : 0
  };

  // Completar hasta 4 puntos asignados
  let puntosAsignados = Object.values(habilidades).reduce((a, b) => a + b, 0);
  if (puntosAsignados < 4) {
    if (habilidades.alerta === 0) { habilidades.alerta = 1; puntosAsignados++; }
    if (puntosAsignados < 4 && habilidades.supervivencia === 0) { habilidades.supervivencia = 1; puntosAsignados++; }
    if (puntosAsignados < 4 && habilidades.comunicacion === 0) { habilidades.comunicacion = 1; puntosAsignados++; }
  }

  // Armas por defecto según la clase
  let armas = [];
  if (clase === 'guerrero') {
    armas = [
      { id: 'espada_larga', nombre: 'Espada Larga', dado: '1d8', danoMedio: 4, atqBono: '+0', tipo: 'CaC' },
      { id: 'daga', nombre: 'Daga', dado: '1d4', danoMedio: 2, atqBono: '+0', tipo: 'CaC/Proyectil' }
    ];
  } else if (clase === 'bribon') {
    armas = [
      { id: 'espada_corta', nombre: 'Espada Corta', dado: '1d6', danoMedio: 3, atqBono: '+0', tipo: 'CaC' },
      { id: 'arco', nombre: 'Arco', dado: '1d6', danoMedio: 3, atqBono: '+0', tipo: 'Proyectil' }
    ];
  } else if (clase === 'hechicero') {
    armas = [
      { id: 'baston', nombre: 'Bastón (a dos manos)', dado: '1d6', danoMedio: 3, atqBono: '+0', tipo: 'CaC' },
      { id: 'daga', nombre: 'Daga', dado: '1d4', danoMedio: 2, atqBono: '+0', tipo: 'CaC/Proyectil' }
    ];
  } else {
    armas = [
      { id: 'maza_pesada', nombre: 'Maza Pesada', dado: '1d6', danoMedio: 3, atqBono: '+0', tipo: 'CaC' }
    ];
  }

  const armadura = clase === 'guerrero' ? 'cuero' : clase === 'bribon' ? 'cuero' : 'sin_armadura';
  const escudo = clase === 'guerrero';

  const nuevoPj = {
    nombre,
    raza,
    clase,
    nivel: 1,
    px: 0,
    atributos: { ...atributos },
    habilidades,
    talentos: [...razaData.talentos, ...claseData.talentos],
    trasfondos: [...trasfondos],
    armas,
    armadura,
    escudo,
    equipo: [
      'Mochila de cuero (10 kg)',
      'Cantimplora de agua (2L)',
      'Raciones de viaje (3 días)',
      'Antorchas (x3)',
      'Yesca y pedernal'
    ],
    monedas: {
      mo: 30, // Oro
      mp: 15, // Plata
      mc: 40  // Cobre
    },
    pvActual: null // Calculado a continuación
  };

  const stats = calcularEstadisticasPersonaje(nuevoPj);
  nuevoPj.pvActual = stats.pv;
  nuevoPj.podActual = stats.pod;

  return nuevoPj;
}

/**
 * Calcula todas las estadísticas derivadas de la Hoja de Personaje.
 */
export function calcularEstadisticasPersonaje(pj) {
  const raza = RAZAS_VE[pj.raza] || RAZAS_VE.humano;
  const clase = CLASES_VE[pj.clase] || CLASES_VE.guerrero;
  const nivel = Math.max(1, Math.min(10, pj.nivel || 1));
  const avance = TABLA_AVANCE_VE[nivel]?.[clase.id] || { atq: 0, pod: 0, ins: 0 };

  // Modificadores de atributos
  const modFue = getModificador(pj.atributos?.fue || 10);
  const modDes = getModificador(pj.atributos?.des || 10);
  const modCon = getModificador(pj.atributos?.con || 10);
  const modInt = getModificador(pj.atributos?.int || 10);
  const modSab = getModificador(pj.atributos?.sab || 10);
  const modCar = getModificador(pj.atributos?.car || 10);

  // 1. PUNTOS DE VIDA (PV)
  // Nivel 1: Máximo del DA + mod CON. Mínimo 1.
  // Niveles superiores: se suma DA medio (o tirado) + mod CON por nivel.
  const pvNivel1 = Math.max(1, clase.da + modCon);
  const daMedio = Math.floor(clase.da / 2) + 1; // Media del dado de aguante
  const pvExtra = (nivel - 1) * Math.max(1, daMedio + modCon);
  const pvMax = pvNivel1 + pvExtra;

  // 2. DEFENSA (DEF)
  // Base 10 + mod DES + Armadura (+1 Escudo)
  const armaduraObj = CATALOGO_ARMADURAS_VE.find(a => a.id === pj.armadura) || CATALOGO_ARMADURAS_VE[0];
  const bonoArmadura = armaduraObj.defBono || 0;
  const bonoEscudo = pj.escudo ? 1 : 0;
  const def = 10 + modDes + bonoArmadura + bonoEscudo;

  // 3. MOVIMIENTO (MOV)
  // Raza base: 12m humano/elfo, 9m enano/mediano. Placas reduce a 6m.
  let mov = raza.mov;
  if (pj.armadura === 'placas') mov = 6;

  // 4. ATAQUE (ATQ)
  // Base por tabla + mod FUE (cuerpo a cuerpo) o mod DES (proyectiles)
  const atqBase = avance.atq || 0;
  const atqCac = atqBase + modFue;
  const atqDistancia = atqBase + modDes + (pj.raza === 'mediano' ? 1 : 0); // Certero

  // 5. INSTINTOS (INS)
  // Base por tabla (+1 si Adaptable de humano)
  const bonoHumano = pj.raza === 'humano' ? 1 : 0;
  const insBase = (avance.ins || 0) + bonoHumano;

  // 6. PODER (POD)
  // Para hechiceros y clérigos: avance.pod + mod INT (o SAB)
  let pod = 0;
  if (clase.requierePod) {
    pod = Math.max(0, (avance.pod || 0) + (clase.id === 'clerigo' ? modSab : modInt));
  }

  // 7. CAPACIDAD DE CARGA (BULTOS)
  const bultosMax = pj.atributos?.fue || 10;

  return {
    nivel,
    pv: pvMax,
    pvActual: pj.pvActual !== undefined && pj.pvActual !== null ? pj.pvActual : pvMax,
    def,
    mov,
    atqBase,
    atqCac,
    atqDistancia,
    ins: insBase,
    pod,
    podActual: pj.podActual !== undefined && pj.podActual !== null ? pj.podActual : pod,
    bultosMax,
    modificadores: {
      fue: modFue,
      des: modDes,
      con: modCon,
      int: modInt,
      sab: modSab,
      car: modCar
    }
  };
}

// ---------------------------------------------------------------------
// 10. RESOLUCIÓN DE TIRADAS & COMBATE ÁGIL (MEDIA DE DAÑO)
// ---------------------------------------------------------------------

/**
 * Resuelve una tirada d20 con modificadores y ventaja/desventaja.
 */
export function resolverTiradaD20({
  bono = 0,
  dificultad = 11,
  ventaja = false,
  desventaja = false,
  esCriticoEn19 = false
} = {}) {
  const d1 = Math.floor(Math.random() * 20) + 1;
  const d2 = Math.floor(Math.random() * 20) + 1;

  let dadoFinal = d1;
  let tipoTirada = 'normal';

  if (ventaja && !desventaja) {
    dadoFinal = Math.max(d1, d2);
    tipoTirada = 'ventaja';
  } else if (desventaja && !ventaja) {
    dadoFinal = Math.min(d1, d2);
    tipoTirada = 'desventaja';
  }

  const total = dadoFinal + bono;
  const criticoUmbral = esCriticoEn19 ? 19 : 20;
  const esCritico = dadoFinal >= criticoUmbral;
  const esPifia = dadoFinal === 1;

  let exito = false;
  if (esCritico) exito = true;
  else if (esPifia) exito = false;
  else exito = total >= dificultad;

  return {
    d1,
    d2,
    dadoFinal,
    bono,
    total,
    dificultad,
    exito,
    esCritico,
    esPifia,
    tipoTirada
  };
}

/**
 * Calcula el DAÑO MEDIO para que el combate sea ágil y no pierda tiempo en tiradas.
 * @param {object} arma - Objeto del catálogo de armas
 * @param {number} modFue - Modificador de fuerza del atacante
 * @param {boolean} esCritico - Si sacó crítico (20 natural), duplica el daño medio o maximiza
 * @param {boolean} dosManos - Si empuña a dos manos (+1 al daño)
 * @param {boolean} emboscar - Si el bribón ataca desprevenido (+3 daño medio)
 */
export function calcularDanoMedioArma({
  arma,
  modFue = 0,
  esCritico = false,
  dosManos = false,
  emboscar = false
}) {
  const danoBase = arma?.danoMedio || 3;
  const bonoFuerza = arma?.tipo?.includes('CaC') ? modFue : 0;
  const bonoDosManos = dosManos ? 1 : 0;
  const bonoEmboscar = emboscar ? 3 : 0; // Media de 1d6 es 3

  let totalDano = danoBase + bonoFuerza + bonoDosManos + bonoEmboscar;

  if (esCritico) {
    // Crítico OSR: Daño máximo del arma + 1 (o doble daño medio)
    // En VE: "siempre es posible elegir causar daño máximo + 1"
    const dadosMax = { '1d4': 4, '1d4+1': 5, '1d6': 6, '1d8': 8, '1d10': 10, '1d12': 12 };
    const maximo = dadosMax[arma?.dado] || (danoBase * 2);
    totalDano = maximo + 1 + bonoFuerza + bonoDosManos + bonoEmboscar;
  }

  return {
    danoTotal: Math.max(1, totalDano),
    danoBase,
    bonoFuerza,
    bonoDosManos,
    bonoEmboscar,
    esCritico,
    formula: `${danoBase}${bonoFuerza ? (bonoFuerza > 0 ? `+${bonoFuerza} FUE` : `${bonoFuerza} FUE`) : ''}${bonoDosManos ? '+1 (2 manos)' : ''}${bonoEmboscar ? '+3 (Emboscada)' : ''}${esCritico ? ' [¡CRÍTICO MÁX+1!]' : ''}`
  };
}

// ---------------------------------------------------------------------
// 11. PERSISTENCIA EN LOCALSTORAGE
// ---------------------------------------------------------------------
const CLAVE_STORAGE_VE = 'personaje_vieja_escuela_v1';

export function guardarPersonajeLocal(personaje) {
  try {
    localStorage.setItem(CLAVE_STORAGE_VE, JSON.stringify(personaje));
    return true;
  } catch (e) {
    console.error('Error al guardar personaje de Vieja Escuela:', e);
    return false;
  }
}

export function cargarPersonajeLocal() {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE_VE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al cargar personaje de Vieja Escuela:', e);
    return null;
  }
}
