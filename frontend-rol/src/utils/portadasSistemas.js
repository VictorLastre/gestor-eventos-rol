// ✨ Catálogo de portadas oficiales y emblemáticas de sistemas de rol y juegos de mesa
// Diseñadas para proyectarse de fondo en las tarjetas de partidas.

export const PORTADAS_SISTEMAS = {
  // D&D 2024 / 5.5 - Portada oficial Player's Handbook (D&D Beyond)
  dnd55: 'https://media.dndbeyond.com/compendium-images/phb/MKDHZ1nxSXDDLOw2/phb-2024-cover.jpeg',
  
  // D&D 5e (2014) - Portada oficial Player's Handbook
  dnd5e: 'https://upload.wikimedia.org/wikipedia/en/8/86/Player%27s_Handbook%2C_2014_standard_print_cover.png',
  
  // Call of Cthulhu 7e - Portada oficial Chaosium Keeper Rulebook
  cthulhu: 'https://d1vzi28wh99zvq.cloudfront.net/images/2/150997.webp',
  
  // Pathfinder 2e - Portada oficial Core Rulebook (Paizo)
  pathfinder: 'https://d1vzi28wh99zvq.cloudfront.net/images/5549/443387.webp',
  
  // Cyberpunk RED - Portada oficial (R. Talsorian Games)
  cyberpunk: 'https://d1vzi28wh99zvq.cloudfront.net/images/13/333585.webp',
  
  // Vampire: The Masquerade 5e - Portada oficial
  vampiro: 'https://d1vzi28wh99zvq.cloudfront.net/images/18205/256795.webp',
  
  // Alien RPG - Portada oficial Free League
  alien: 'https://d1vzi28wh99zvq.cloudfront.net/images/11437/520969.webp',

  // Warhammer (40k / Fantasy)
  warhammer: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',

  // Star Wars RPG
  starwars: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',

  // El Anillo Único / Tolkien
  tolkien: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',

  // Western / Deadlands
  western: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',

  // Juegos de Mesa
  juegosMesa: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',

  // Steampunk
  steampunk: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
};

// Fallbacks de ambientación (si el sistema no tiene una portada oficial directa)
export const PORTADAS_AMBIENTACION = {
  "Fantasía Medieval": PORTADAS_SISTEMAS.dnd55,
  "Fantasía Oscura": PORTADAS_SISTEMAS.dnd5e,
  "Fantasía Urbana": PORTADAS_SISTEMAS.cyberpunk,
  "Terror / Horror": PORTADAS_SISTEMAS.vampiro,
  "Horror Cósmico": PORTADAS_SISTEMAS.cthulhu,
  "Terror Espacial": PORTADAS_SISTEMAS.alien,
  "Ciencia Ficción": PORTADAS_SISTEMAS.starwars,
  "Space Opera": PORTADAS_SISTEMAS.starwars,
  "Cyberpunk": PORTADAS_SISTEMAS.cyberpunk,
  "Steampunk": PORTADAS_SISTEMAS.steampunk,
  "Post-Apocalíptico": PORTADAS_SISTEMAS.cyberpunk,
  "Misterio / Investigación": PORTADAS_SISTEMAS.cthulhu,
  "Mundo de Tinieblas": PORTADAS_SISTEMAS.vampiro,
  "Superhéroes": PORTADAS_SISTEMAS.cyberpunk,
  "Western / Weird West": PORTADAS_SISTEMAS.western,
  "Piratas / Naval": 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  "Anime / Manga": 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  "Juegos de Mesa": PORTADAS_SISTEMAS.juegosMesa,
  "Escape Room": PORTADAS_SISTEMAS.cthulhu
};

/**
 * Resuelve la portada para la partida:
 * 1. Portada manual configurada por el admin (sistema_imagen)
 * 2. Mapeo específico por nombre de sistema
 * 3. Mapeo por ambientación/etiqueta
 */
export function obtenerPortadaSistema({ sistema = '', etiqueta = '', sistema_imagen = '' } = {}) {
  // 1. Imagen manual específica si fue configurada
  if (sistema_imagen && typeof sistema_imagen === 'string' && sistema_imagen.trim().startsWith('http')) {
    return sistema_imagen.trim();
  }

  const s = String(sistema || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 2. Detección precisa de sistema
  if (s.includes('5.5') || s.includes('2024')) {
    return PORTADAS_SISTEMAS.dnd55;
  }
  if (s.includes('5e') || s.includes('dungeons') || s.includes('d&d') || s.includes('dnd') || s.includes('dragons')) {
    return PORTADAS_SISTEMAS.dnd5e;
  }
  if (s.includes('cthulhu') || s.includes('llamada') || s.includes('arkham') || s.includes('delta green') || s.includes('lovecraft')) {
    return PORTADAS_SISTEMAS.cthulhu;
  }
  if (s.includes('pathfinder') || s.includes('starfinder')) {
    return PORTADAS_SISTEMAS.pathfinder;
  }
  if (s.includes('cyberpunk') || s.includes('shadowrun')) {
    return PORTADAS_SISTEMAS.cyberpunk;
  }
  if (s.includes('vampir') || s.includes('tinieblas') || s.includes('mascarada') || s.includes('werewolf') || s.includes('hombre lobo')) {
    return PORTADAS_SISTEMAS.vampiro;
  }
  if (s.includes('alien') || s.includes('mothership') || s.includes('nemesis')) {
    return PORTADAS_SISTEMAS.alien;
  }
  if (s.includes('warhammer') || s.includes('40k') || s.includes('sigmar') || s.includes('wh40k')) {
    return PORTADAS_SISTEMAS.warhammer;
  }
  if (s.includes('star wars') || s.includes('starwars')) {
    return PORTADAS_SISTEMAS.starwars;
  }
  if (s.includes('anillo') || s.includes('tolkien') || s.includes('one ring') || s.includes('moria')) {
    return PORTADAS_SISTEMAS.tolkien;
  }
  if (s.includes('savage') || s.includes('deadlands')) {
    return PORTADAS_SISTEMAS.western;
  }
  if (s.includes('mesa') || s.includes('catan') || s.includes('board') || s.includes('carcassonne') || s.includes('magic')) {
    return PORTADAS_SISTEMAS.juegosMesa;
  }
  if (s.includes('steampunk')) {
    return PORTADAS_SISTEMAS.steampunk;
  }

  // 3. Fallback por Ambientación / Etiqueta
  if (etiqueta && PORTADAS_AMBIENTACION[etiqueta]) {
    return PORTADAS_AMBIENTACION[etiqueta];
  }

  // 4. Default: D&D clásico
  return PORTADAS_SISTEMAS.dnd5e;
}
