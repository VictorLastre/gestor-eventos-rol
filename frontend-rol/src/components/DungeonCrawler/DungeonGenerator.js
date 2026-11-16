export function escalarMonstruoSegunNivel(monstruoBase, nivelJugador = 1) {
  const n = Math.max(1, Number(nivelJugador) || 1);
  const factor = 1 + (n - 1) * 0.22;
  const hpEscalado = Math.max(4, Math.round((monstruoBase.hp || 5) * factor));
  const defEscalada = (monstruoBase.defensa || 11) + Math.floor((n - 1) / 2);
  const atqEscalado = (monstruoBase.atqBono || 1) + Math.floor((n - 1) / 2);
  const danoEscalado = (monstruoBase.dano || monstruoBase.dano_medio || 3) + Math.floor((n - 1) / 2);
  const oroEscalado = Math.round((monstruoBase.oro || 4) * factor);
  const xpEscalado = Math.round((monstruoBase.xp || 10) * (1 + (n - 1) * 0.3));

  return {
    ...monstruoBase,
    nivel: Math.max(monstruoBase.nivel || 1, n),
    hp: hpEscalado,
    maxHp: hpEscalado,
    defensa: defEscalada,
    atqBono: atqEscalado,
    dano: danoEscalado,
    dano_medio: danoEscalado,
    oro: oroEscalado,
    oro_recompensa: oroEscalado,
    xp: xpEscalado,
    xp_recompensa: xpEscalado
  };
}

// =====================================================================
// GENERADOR PROCEDURAL DE MEGA-DUNGEON: GRAN CRIPTA WEST MARCHES
// Mapa ultra-gigante continuo (110x110 tiles), 36 salas, puertas y cerraduras.
// =====================================================================

export const TILE_VOID = 0;
export const TILE_FLOOR = 1;
export const TILE_WALL = 2;
export const TILE_SANCTUARY = 3;
export const TILE_WATER_MOSS = 4;
export const TILE_STAIRS = 5;
export const TILE_BOSS_GATE = 6;

export const BESTIARIO_PISOS = {
  1: [
    { nombre: 'Esqueleto Centinela', tipo: 'skelet', nivel: 1, hp: 5, maxHp: 5, defensa: 11, atqBono: 1, dano: 3, oro: 4, xp: 10, ataque_nombre: 'Espada herrumbrosa' },
    { nombre: 'Trasgo Explorador', tipo: 'chort', nivel: 1, hp: 5, maxHp: 5, defensa: 12, atqBono: 1, dano: 3, oro: 3, xp: 10, ataque_nombre: 'Daga serrada' },
    { nombre: 'Zombi Errante', tipo: 'zombie', nivel: 2, hp: 10, maxHp: 10, defensa: 11, atqBono: 2, dano: 3, oro: 5, xp: 15, ataque_nombre: 'Garras cadavéricas' },
    { nombre: 'Rata Gigante', tipo: 'imp', nivel: 0, hp: 4, maxHp: 4, defensa: 10, atqBono: 0, dano: 2, oro: 2, xp: 5, ataque_nombre: 'Mordisco infecto' },
    { nombre: 'Guardia de la Cripta', tipo: 'skelet', nivel: 2, hp: 8, maxHp: 8, defensa: 12, atqBono: 2, dano: 4, oro: 6, xp: 15, ataque_nombre: 'Lanza de hueso' },
    { nombre: 'Espora Tóxica', tipo: 'mushroom', nivel: 2, hp: 7, maxHp: 7, defensa: 11, atqBono: 1, dano: 3, oro: 4, xp: 12, ataque_nombre: 'Micelio cáustico' }
  ]
};

export const JEFES_PISOS = {
  1: { nombre: 'El Custodio Ancestral de la Cripta', tipo: 'ogre', nivel: 5, hp: 38, maxHp: 38, defensa: 14, atqBono: 4, dano: 7, esJefe: true, oro: 70, xp: 120, ataque_nombre: 'Maza de piedra titánica' }
};

export const BIOMAS = {
  1: {
    nombre: 'Gran Cripta Ancestral West Marches',
    subtitulo: 'Laberinto Profundo de la Asociación de Rol La Pampa',
    tipo: 'piedra',
    colorAmbiente: 'rgba(10, 10, 16, 0.85)',
    luzAntorcha: '#fbbf24',
    murosColor: '#3f3f46',
    sueloColor: '#18181b',
    sueloDetalle: '#27272a',
    mobTipos: ['skelet', 'zombie', 'mushroom'],
    bossNombre: 'El Custodio Ancestral',
    bossTipo: 'ogre',
    bossHP: 600,
    bossDano: 26
  }
};

export class DungeonGenerator {
  constructor(piso = 1) {
    this.piso = piso;
    // Mapa ULTRA GIGANTE para exploración West Marches continúa
    this.tamano = 110; 
    this.grid = [];
    this.habitaciones = [];
    this.puertas = [];
    this.spawnPoint = { x: 0, y: 0 };
    this.hogueraPoint = { x: 0, y: 0 };
    this.forjaPoint = { x: 0, y: 0 };
    this.dinyPoint = { x: 0, y: 0 };
    this.deloPoint = { x: 0, y: 0 };
    this.guillePoint = { x: 0, y: 0 };
    this.ayrtonPoint = { x: 0, y: 0 };
    this.keithPoint = { x: 0, y: 0 };
    this.javiPoint = { x: 0, y: 0 };
    this.martinPoint = { x: 0, y: 0 };
    this.matiPoint = { x: 0, y: 0 };
    this.strerbernPoint = { x: 0, y: 0 };
    this.bossPoint = { x: 0, y: 0 };
    this.stairsPoint = null; // Eliminadas las escaleras para evitar bajar de piso
    this.entradasJefe = [];
    this.habJefe = null;
    this.spawnsEnemigos = [];
    this.cofres = [];
    this.bioma = BIOMAS[1];
  }

  generar() {
    this.grid = Array.from({ length: this.tamano }, () => 
      Array(this.tamano).fill(TILE_VOID)
    );

    // 36 salas distribuidas a lo largo del mapa ultra gigante
    const numHabitaciones = 36;
    const minTam = 7;
    const maxTam = 13;

    this.habitaciones = [];

    let intentos = 0;
    while (this.habitaciones.length < numHabitaciones && intentos < 3000) {
      intentos++;
      const ancho = Math.floor(Math.random() * (maxTam - minTam + 1)) + minTam;
      const alto = Math.floor(Math.random() * (maxTam - minTam + 1)) + minTam;
      const x = Math.floor(Math.random() * (this.tamano - ancho - 6)) + 3;
      const y = Math.floor(Math.random() * (this.tamano - alto - 6)) + 3;

      let solapa = false;
      for (const h of this.habitaciones) {
        if (
          x < h.x + h.ancho + 2 &&
          x + ancho + 2 > h.x &&
          y < h.y + h.alto + 2 &&
          y + alto + 2 > h.y
        ) {
          solapa = true;
          break;
        }
      }

      if (!solapa) {
        this.habitaciones.push({
          x, y, ancho, alto,
          centroX: Math.floor(x + ancho / 2),
          centroY: Math.floor(y + alto / 2),
          tipo: 'normal',
          descubierta: false
        });
      }
    }

    // 1. Asignar sala de inicio (Spawn)
    this.habitaciones[0].tipo = 'spawn';
    this.habitaciones[0].descubierta = true;
    this.spawnPoint = { x: this.habitaciones[0].centroX, y: this.habitaciones[0].centroY };

    // 2. Gran Santuario de la Asociación (Campamento central espacioso)
    const santuario = this.habitaciones[1];
    santuario.tipo = 'santuario';
    santuario.descubierta = false;
    if (santuario.ancho < 13) santuario.ancho = 13;
    if (santuario.alto < 13) santuario.alto = 13;
    if (santuario.x + santuario.ancho >= this.tamano - 3) {
      santuario.x = Math.max(3, this.tamano - santuario.ancho - 3);
    }
    if (santuario.y + santuario.alto >= this.tamano - 3) {
      santuario.y = Math.max(3, this.tamano - santuario.alto - 3);
    }
    santuario.centroX = Math.floor(santuario.x + santuario.ancho / 2);
    santuario.centroY = Math.floor(santuario.y + santuario.alto / 2);

    const scx = santuario.centroX;
    const scy = santuario.centroY;

    this.hogueraPoint = { x: scx, y: scy };
    this.matiPoint = { x: scx, y: scy - 4 };
    this.martinPoint = { x: scx - 2, y: scy - 3 };
    this.guillePoint = { x: scx + 2, y: scy - 3 };
    this.deloPoint = { x: scx - 4, y: scy - 1 };
    this.dinyPoint = { x: scx - 4, y: scy + 2 };
    this.forjaPoint = { x: scx + 4, y: scy - 1 };
    this.strerbernPoint = { x: scx + 4, y: scy + 2 };
    this.keithPoint = { x: scx - 2, y: scy + 4 };
    this.ayrtonPoint = { x: scx, y: scy + 4 };
    this.javiPoint = { x: scx + 2, y: scy + 4 };

    // 3. Sala del Gran Custodio (última sala)
    const habJefe = this.habitaciones[this.habitaciones.length - 1];
    habJefe.tipo = 'jefe';
    habJefe.descubierta = false;
    this.habJefe = habJefe;
    this.bossPoint = { x: habJefe.centroX, y: habJefe.centroY };

    // 4. Tallar baldosas de habitaciones
    for (const h of this.habitaciones) {
      const tileTipo = h.tipo === 'santuario' ? TILE_SANCTUARY : TILE_FLOOR;
      for (let cy = h.y; cy < h.y + h.alto; cy++) {
        for (let cx = h.x; cx < h.x + h.ancho; cx++) {
          if (tileTipo === TILE_FLOOR && Math.random() < 0.12) {
            this.grid[cy][cx] = TILE_WATER_MOSS;
          } else {
            this.grid[cy][cx] = tileTipo;
          }
        }
      }
    }

    // 5. Interconectar la red de pasillos
    for (let i = 0; i < this.habitaciones.length - 1; i++) {
      const hA = this.habitaciones[i];
      const hB = this.habitaciones[i + 1];
      this.conectarHabitaciones(hA.centroX, hA.centroY, hB.centroX, hB.centroY);
    }

    // Conectar cada sala a su vecina más próxima para crear un laberinto con rutas alternativas
    for (let i = 0; i < this.habitaciones.length; i++) {
      const h = this.habitaciones[i];
      const otros = this.habitaciones.filter((_, idx) => idx !== i);
      otros.sort((a, b) => 
        Math.hypot(a.centroX - h.centroX, a.centroY - h.centroY) - 
        Math.hypot(b.centroX - h.centroX, b.centroY - h.centroY)
      );
      if (otros.length > 0) {
        this.conectarHabitaciones(h.centroX, h.centroY, otros[0].centroX, otros[0].centroY);
      }
    }

    // Conexiones cardinales desde el Santuario para que sea un nexo central
    const sant = this.habitaciones[1];
    if (this.habitaciones.length > 8) {
      this.conectarHabitaciones(sant.centroX, sant.centroY, this.habitaciones[4].centroX, this.habitaciones[4].centroY);
      this.conectarHabitaciones(sant.centroX, sant.centroY, this.habitaciones[8].centroX, this.habitaciones[8].centroY);
    }

    // 6. Construir Muros perimetrales
    this.construirMuros();

    // 7. Generar PUERTAS en los accesos de las salas (con cerraduras trancadas y normales)
    this.generarPuertas();

    // 8. Entradas de la arena del jefe
    this.entradasJefe = [];
    for (let cy = habJefe.y - 1; cy <= habJefe.y + habJefe.alto; cy++) {
      for (let cx = habJefe.x - 1; cx <= habJefe.x + habJefe.ancho; cx++) {
        const esBordeExterior = (cx === habJefe.x - 1 || cx === habJefe.x + habJefe.ancho || cy === habJefe.y - 1 || cy === habJefe.y + habJefe.alto);
        if (esBordeExterior && cy >= 0 && cy < this.tamano && cx >= 0 && cx < this.tamano) {
          if (this.grid[cy][cx] === TILE_FLOOR) {
            this.entradasJefe.push({ x: cx, y: cy });
          }
        }
      }
    }

    // 9. Distribuir enemigos y cofres con llaves
    this.distribuirContenido();

    return {
      grid: this.grid,
      tamano: this.tamano,
      habitaciones: this.habitaciones,
      spawnPoint: this.spawnPoint,
      hogueraPoint: this.hogueraPoint,
      forjaPoint: this.forjaPoint,
      dinyPoint: this.dinyPoint,
      deloPoint: this.deloPoint,
      guillePoint: this.guillePoint,
      ayrtonPoint: this.ayrtonPoint,
      keithPoint: this.keithPoint,
      javiPoint: this.javiPoint,
      martinPoint: this.martinPoint,
      matiPoint: this.matiPoint,
      strerbernPoint: this.strerbernPoint,
      bossPoint: this.bossPoint,
      stairsPoint: null, // NO hay escaleras para descender
      habJefe: this.habJefe,
      entradasJefe: this.entradasJefe,
      spawnsEnemigos: this.spawnsEnemigos,
      cofres: this.cofres,
      puertas: this.puertas,
      bioma: this.bioma
    };
  }

  conectarHabitaciones(x1, y1, x2, y2) {
    let curX = x1;
    let curY = y1;
    const horizontalPrimero = Math.random() < 0.5;

    if (horizontalPrimero) {
      while (curX !== x2) {
        if (this.grid[curY][curX] === TILE_VOID) this.grid[curY][curX] = TILE_FLOOR;
        curX += curX < x2 ? 1 : -1;
      }
      while (curY !== y2) {
        if (this.grid[curY][curX] === TILE_VOID) this.grid[curY][curX] = TILE_FLOOR;
        curY += curY < y2 ? 1 : -1;
      }
    } else {
      while (curY !== y2) {
        if (this.grid[curY][curX] === TILE_VOID) this.grid[curY][curX] = TILE_FLOOR;
        curY += curY < y2 ? 1 : -1;
      }
      while (curX !== x2) {
        if (this.grid[curY][curX] === TILE_VOID) this.grid[curY][curX] = TILE_FLOOR;
        curX += curX < x2 ? 1 : -1;
      }
    }
  }

  construirMuros() {
    for (let y = 0; y < this.tamano; y++) {
      for (let x = 0; x < this.tamano; x++) {
        if (this.grid[y][x] === TILE_VOID) {
          let tocaSuelo = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < this.tamano && nx >= 0 && nx < this.tamano) {
                const tipo = this.grid[ny][nx];
                if (tipo === TILE_FLOOR || tipo === TILE_SANCTUARY || tipo === TILE_WATER_MOSS) {
                  tocaSuelo = true;
                  break;
                }
              }
            }
            if (tocaSuelo) break;
          }
          if (tocaSuelo) {
            this.grid[y][x] = TILE_WALL;
          }
        }
      }
    }
  }

  generarPuertas() {
    this.puertas = [];
    const tileSize = 32;

    // Colocar puertas en los vanos que entran a las salas (excepto spawn y santuario)
    for (let i = 2; i < this.habitaciones.length; i++) {
      const h = this.habitaciones[i];

      // Perímetro Superior e Inferior
      for (let px = h.x; px < h.x + h.ancho; px++) {
        for (const py of [h.y - 1, h.y + h.alto]) {
          if (py >= 0 && py < this.tamano && this.grid[py][px] === TILE_FLOOR) {
            if (px > 0 && px < this.tamano - 1 && this.grid[py][px - 1] === TILE_WALL && this.grid[py][px + 1] === TILE_WALL) {
              const muyCerca = this.puertas.some(d => Math.hypot(d.x - px, d.y - py) <= 2.2);
              if (!muyCerca && Math.random() < 0.75) {
                const esTrancada = Math.random() < 0.42; // 42% trancadas con cerradura
                this.puertas.push({
                  id: `puerta_${px}_${py}`,
                  x: px,
                  y: py,
                  pixelX: (px + 0.5) * tileSize,
                  pixelY: (py + 0.5) * tileSize,
                  orientacion: 'h',
                  estado: esTrancada ? 'trancada' : 'cerrada',
                  requiereLlave: esTrancada,
                  hp: esTrancada ? 45 : 30,
                  maxHp: esTrancada ? 45 : 30,
                  nombre: esTrancada ? 'Puerta Trancada con Cerradura de Hierro' : 'Puerta de Madera Maciza'
                });
              }
            }
          }
        }
      }

      // Perímetro Izquierdo y Derecho
      for (let py = h.y; py < h.y + h.alto; py++) {
        for (const px of [h.x - 1, h.x + h.ancho]) {
          if (px >= 0 && px < this.tamano && this.grid[py][px] === TILE_FLOOR) {
            if (py > 0 && py < this.tamano - 1 && this.grid[py - 1][px] === TILE_WALL && this.grid[py + 1][px] === TILE_WALL) {
              const muyCerca = this.puertas.some(d => Math.hypot(d.x - px, d.y - py) <= 2.2);
              if (!muyCerca && Math.random() < 0.75) {
                const esTrancada = Math.random() < 0.42;
                this.puertas.push({
                  id: `puerta_${px}_${py}`,
                  x: px,
                  y: py,
                  pixelX: (px + 0.5) * tileSize,
                  pixelY: (py + 0.5) * tileSize,
                  orientacion: 'v',
                  estado: esTrancada ? 'trancada' : 'cerrada',
                  requiereLlave: esTrancada,
                  hp: esTrancada ? 45 : 30,
                  maxHp: esTrancada ? 45 : 30,
                  nombre: esTrancada ? 'Puerta Trancada con Cerradura de Hierro' : 'Puerta de Madera Maciza'
                });
              }
            }
          }
        }
      }
    }
  }

  distribuirContenido() {
    this.spawnsEnemigos = [];
    this.cofres = [];

    let llavesRestantes = 9; // Cantidad de llaves antiguas ocultas en cofres

    for (const h of this.habitaciones) {
      if (h.tipo === 'spawn' || h.tipo === 'santuario') continue;

      if (h.tipo === 'normal') {
        // En una super dungeon West Marches, ~45% de salas son de exploración y secretos
        const tieneMonstruos = Math.random() < 0.55;

        if (tieneMonstruos) {
          const cantidad = Math.random() < 0.85 ? 1 : 2;
          const poolEnemigos = BESTIARIO_PISOS[1];

          for (let i = 0; i < cantidad; i++) {
            const ex = Math.floor(Math.random() * (h.ancho - 2)) + h.x + 1;
            const ey = Math.floor(Math.random() * (h.alto - 2)) + h.y + 1;
            const plantilla = poolEnemigos[Math.floor(Math.random() * poolEnemigos.length)];

            this.spawnsEnemigos.push({
              x: ex,
              y: ey,
              ...plantilla,
              hp: plantilla.hp,
              maxHp: plantilla.maxHp,
              materiales: Math.floor(Math.random() * 2) + 1
            });
          }
        }

        // Cofres en las salas (algunos contienen Llaves Antiguas para abrir las puertas trancadas)
        if (Math.random() < 0.60) {
          const cx = Math.floor(Math.random() * (h.ancho - 2)) + h.x + 1;
          const cy = Math.floor(Math.random() * (h.alto - 2)) + h.y + 1;
          const tieneLlave = llavesRestantes > 0 && Math.random() < 0.45;
          if (tieneLlave) llavesRestantes--;

          this.cofres.push({
            x: cx,
            y: cy,
            abierto: false,
            oro: 15 + Math.floor(Math.random() * 20),
            materiales: Math.floor(Math.random() * 3) + 2,
            pocion: Math.random() < 0.5 ? 'vida' : 'durabilidad',
            tieneLlave: tieneLlave
          });
        }
      }
    }

    // Jefe Custodio en la sala final
    const habJefe = this.habitaciones[this.habitaciones.length - 1];
    const jefePlantilla = JEFES_PISOS[1];

    this.spawnsEnemigos.push({
      x: habJefe.centroX,
      y: habJefe.centroY,
      ...jefePlantilla,
      materiales: 15
    });
  }
}