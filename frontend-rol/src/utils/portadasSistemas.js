// ✨ Catálogo inteligente de portadas e ilustraciones de sistemas y ambientaciones
// Diseñadas para fondos de cartas de partidas con opacidad y gradientes cinemáticos.

export const PORTADAS_SISTEMAS = {
  // --- Sistemas Populares Específicos ---
  dnd55: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80', // Fantasía épica heroica / Dragón 2024
  dnd5e: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', // Pergaminos, dados y magia D&D
  cthulhu: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80', // Misterio oscuro y horror cósmico Lovecraft
  pathfinder: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80', // Gran aventura fantástica
  vampiro: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80', // Gotico, sombras y luna carmesí
  cyberpunk: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', // Luces de neón distópicas y rascacielos
  alien: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=800&q=80', // Terror espacial en nave abandonada
  warhammer: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80', // Fortaleza gótica sombría (Grimdark)
  starwars: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', // Nebulosa galáctica profunda
  tolkien: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', // Montañas y ruinas místicas de la Tierra Media
  western: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80', // Cañón polvoriento y atardecer del viejo oeste
  juegosMesa: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80', // Tablero de madera, dados y fichas
  steampunk: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' // Engranajes de cobre y vapor
};

// Mapeo por Ambientación / Temática (Fallback si el sistema no está en la lista de arriba)
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
  "Post-Apocalíptico": PORTADAS_SISTEMAS.cthulhu,
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
 * Resuelve la portada ideal para una partida según su sistema_imagen manual,
 * el nombre del sistema o su ambientación/etiqueta.
 */
export function obtenerPortadaSistema({ sistema = '', etiqueta = '', sistema_imagen = '' } = {}) {
  // 1. Imagen manual específica si fue configurada en el sistema
  if (sistema_imagen && typeof sistema_imagen === 'string' && sistema_imagen.trim().startsWith('http')) {
    return sistema_imagen.trim();
  }

  const s = String(sistema || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 2. Detección por nombre de sistema
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
  if (s.includes('vampir') || s.includes('tinieblas') || s.includes('mascarada') || s.includes('werewolf') || s.includes('hombre lobo') || s.includes('mage')) {
    return PORTADAS_SISTEMAS.vampiro;
  }
  if (s.includes('cyberpunk') || s.includes('shadowrun') || s.includes('netrun')) {
    return PORTADAS_SISTEMAS.cyberpunk;
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

  // 4. Fallback general: D&D / Fantasía clásica
  return PORTADAS_SISTEMAS.dnd5e;
}
