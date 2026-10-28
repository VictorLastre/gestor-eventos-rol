// Generador Procedural de Mazmorras de la Cripta
// Crea niveles crecientes con biomas diferenciados, zona segura (Hoguera) y sala del Jefe.

export const TILE_VOID = 0;
export const TILE_FLOOR = 1;
export const TILE_WALL = 2;
export const TILE_SANCTUARY = 3;
export const TILE_WATER_MOSS = 4;
export const TILE_STAIRS = 5;

export const BIOMAS = {
  1: {
    nombre: 'Catacumbas Ancestrales',
    subtitulo: 'Piedra Antigua & Huesos Olvidados',
    tipo: 'piedra',
    colorAmbiente: 'rgba(10, 10, 16, 0.82)',
    luzAntorcha: '#fbbf24',
    murosColor: '#3f3f46',
    sueloColor: '#18181b',
    sueloDetalle: '#27272a',
    mobTipos: ['skelet'],
    bossNombre: 'Esqueleto Campeón',
    bossTipo: 'chort',
    bossHP: 320,
    bossDano: 20
  },
  2: {
    nombre: 'Cripta de la Espora',
    subtitulo: 'Hongos Tóxicos & Musgo Rastreador',
    tipo: 'espora',
    colorAmbiente: 'rgba(8, 20, 14, 0.82)',
    luzAntorcha: '#34d399',
    murosColor: '#1e293b',
    sueloColor: '#0f172a',
    sueloDetalle: '#064e3b',
    mobTipos: ['mushroom', 'skelet'],
    bossNombre: 'Espora Ancestral Primigenia',
    bossTipo: 'big_mushroom',
    bossHP: 480,
    bossDano: 26
  },
  3: {
    nombre: 'Bóvedas Inundadas',
    subtitulo: 'Canales Sumergidos & Sombras del Nigromante',
    tipo: 'agua',
    colorAmbiente: 'rgba(6, 14, 28, 0.84)',
    luzAntorcha: '#60a5fa',
    murosColor: '#1e1b4b',
    sueloColor: '#0c1322',
    sueloDetalle: '#1e3a8a',
    mobTipos: ['zombie', 'skelet'],
    bossNombre: 'El Custodio Nigromante',
    bossTipo: 'necromancer',
    bossHP: 650,
    bossDano: 32
  }
};

export class DungeonGenerator {
  constructor(piso = 1) {
    this.piso = piso;
    // Escala del mapa: cada piso es más grande que el anterior
    // Piso 1: 36x36 | Piso 2: 46x46 | Piso 3: 56x56
    this.tamano = 36 + (piso - 1) * 10;
    this.grid = [];
    this.habitaciones = [];
    this.spawnPoint = { x: 0, y: 0 };
    this.hogueraPoint = { x: 0, y: 0 };
    this.bossPoint = { x: 0, y: 0 };
    this.stairsPoint = { x: 0, y: 0 };
    this.spawnsEnemigos = [];
    this.cofres = [];
    this.bioma = BIOMAS[piso] || BIOMAS[1];
  }

  generar() {
    // 1. Inicializar grilla con vacío
    this.grid = Array.from({ length: this.tamano }, () => 
      Array(this.tamano).fill(TILE_VOID)
    );

    // 2. Determinar cantidad de habitaciones según el piso
    const numHabitaciones = 5 + (this.piso - 1) * 3;
    const minTam = 6;
    const maxTam = 10 + Math.min(this.piso, 4);

    this.habitaciones = [];

    let intentos = 0;
    while (this.habitaciones.length < numHabitaciones && intentos < 250) {
      intentos++;
      const ancho = Math.floor(Math.random() * (maxTam - minTam + 1)) + minTam;
      const alto = Math.floor(Math.random() * (maxTam - minTam + 1)) + minTam;
      const x = Math.floor(Math.random() * (this.tamano - ancho - 4)) + 2;
      const y = Math.floor(Math.random() * (this.tamano - alto - 4)) + 2;

      const nuevaHab = {
        x, y, ancho, alto,
        centroX: Math.floor(x + ancho / 2),
        centroY: Math.floor(y + alto / 2),
        tipo: 'normal'
      };

      // Verificar superposición con margen de 2 celdas
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
        this.habitaciones.push(nuevaHab);
      }
    }

    // Si por azar salieron pocas, garantizamos al menos 4
    if (this.habitaciones.length < 3) {
      this.habitaciones.push({
        x: 3, y: 3, ancho: 7, alto: 7,
        centroX: 6, centroY: 6, tipo: 'normal'
      });
      this.habitaciones.push({
        x: this.tamano - 11, y: this.tamano - 11, ancho: 8, alto: 8,
        centroX: this.tamano - 7, centroY: this.tamano - 7, tipo: 'normal'
      });
    }

    // 3. Asignar roles especiales a las habitaciones
    // Habitación 0: Entrada / Spawn
    this.habitaciones[0].tipo = 'spawn';
    this.spawnPoint = { x: this.habitaciones[0].centroX, y: this.habitaciones[0].centroY };

    // Habitación 1: Santuario Seguro (Hoguera de Descanso y Reparación)
    this.habitaciones[1].tipo = 'santuario';
    this.hogueraPoint = { x: this.habitaciones[1].centroX, y: this.habitaciones[1].centroY };

    // Última habitación: Sala del Jefe y Escaleras
    const habJefe = this.habitaciones[this.habitaciones.length - 1];
    habJefe.tipo = 'jefe';
    this.bossPoint = { x: habJefe.centroX, y: habJefe.centroY };
    this.stairsPoint = { x: habJefe.x + 2, y: habJefe.y + 2 };

    // 4. Tallar habitaciones en la grilla
    for (const h of this.habitaciones) {
      const tileTipo = h.tipo === 'santuario' ? TILE_SANCTUARY : TILE_FLOOR;
      for (let cy = h.y; cy < h.y + h.alto; cy++) {
        for (let cx = h.x; cx < h.x + h.ancho; cx++) {
          // Si es bioma de agua o musgo, agregar parches orgánicos
          if (tileTipo === TILE_FLOOR && (this.piso === 2 || this.piso === 3)) {
            const esBorde = (cx === h.x || cx === h.x + h.ancho - 1 || cy === h.y || cy === h.y + h.alto - 1);
            if (!esBorde && Math.random() < 0.22) {
              this.grid[cy][cx] = TILE_WATER_MOSS;
              continue;
            }
          }
          this.grid[cy][cx] = tileTipo;
        }
      }
    }

    // 5. Conectar habitaciones con pasillos en L
    for (let i = 0; i < this.habitaciones.length - 1; i++) {
      const hA = this.habitaciones[i];
      const hB = this.habitaciones[i + 1];
      this.conectarHabitaciones(hA.centroX, hA.centroY, hB.centroX, hB.centroY);
    }
    // Conexión circular aleatoria extra para evitar mapas estrictamente lineales
    if (this.habitaciones.length > 3) {
      const hA = this.habitaciones[1];
      const hB = this.habitaciones[this.habitaciones.length - 2];
      this.conectarHabitaciones(hA.centroX, hA.centroY, hB.centroX, hB.centroY);
    }

    // 6. Colocar la baldosa de escaleras
    this.grid[this.stairsPoint.y][this.stairsPoint.x] = TILE_STAIRS;

    // 7. Generar muros perimetrales alrededor de cada suelo
    this.construirMuros();

    // 8. Distribuir enemigos y cofres
    this.distribuirContenido();

    return {
      grid: this.grid,
      tamano: this.tamano,
      habitaciones: this.habitaciones,
      spawnPoint: this.spawnPoint,
      hogueraPoint: this.hogueraPoint,
      bossPoint: this.bossPoint,
      stairsPoint: this.stairsPoint,
      spawnsEnemigos: this.spawnsEnemigos,
      cofres: this.cofres,
      bioma: this.bioma
    };
  }

  conectarHabitaciones(x1, y1, x2, y2) {
    let curX = x1;
    let curY = y1;

    // Conectar horizontal primero, luego vertical (o viceversa)
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
          // Si tiene algún vecino suelo o santuario, se convierte en muro
          let tocaSuelo = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < this.tamano && nx >= 0 && nx < this.tamano) {
                const tipo = this.grid[ny][nx];
                if (tipo === TILE_FLOOR || tipo === TILE_SANCTUARY || tipo === TILE_WATER_MOSS || tipo === TILE_STAIRS) {
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

  distribuirContenido() {
    this.spawnsEnemigos = [];
    this.cofres = [];

    // Habitaciones normales (excluyendo spawn, santuario y jefe)
    for (const h of this.habitaciones) {
      if (h.tipo === 'spawn' || h.tipo === 'santuario') continue;

      if (h.tipo === 'normal') {
        // Generar 2 a 4 enemigos por habitación
        const cantidad = Math.floor(Math.random() * 3) + 2 + (this.piso - 1);
        for (let i = 0; i < cantidad; i++) {
          const ex = Math.floor(Math.random() * (h.ancho - 2)) + h.x + 1;
          const ey = Math.floor(Math.random() * (h.alto - 2)) + h.y + 1;
          
          // Elegir tipo según bioma
          let tipo = 'skelet';
          if (this.piso === 2) {
            tipo = Math.random() < 0.6 ? 'mushroom' : 'skelet';
          } else if (this.piso === 3) {
            tipo = Math.random() < 0.5 ? 'zombie' : 'skelet';
          }

          this.spawnsEnemigos.push({
            x: ex,
            y: ey,
            tipo,
            hp: 35 + (this.piso - 1) * 20,
            maxHp: 35 + (this.piso - 1) * 20,
            dano: 8 + (this.piso - 1) * 5,
            oro: Math.floor(Math.random() * 8) + 4
          });
        }

        // Posibilidad de cofre del tesoro
        if (Math.random() < 0.65) {
          const cx = Math.floor(Math.random() * (h.ancho - 2)) + h.x + 1;
          const cy = Math.floor(Math.random() * (h.alto - 2)) + h.y + 1;
          this.cofres.push({
            x: cx,
            y: cy,
            abierto: false,
            oro: 15 + this.piso * 10,
            pocion: Math.random() < 0.5 ? 'vida' : 'durabilidad'
          });
        }
      }
    }

    // Añadir el Jefe en la habitación del jefe
    const habJefe = this.habitaciones[this.habitaciones.length - 1];
    this.spawnsEnemigos.push({
      x: habJefe.centroX,
      y: habJefe.centroY,
      tipo: this.bioma.bossTipo,
      nombre: this.bioma.bossNombre,
      esJefe: true,
      hp: this.bioma.bossHP,
      maxHp: this.bioma.bossHP,
      dano: this.bioma.bossDano,
      oro: 100 * this.piso
    });
  }
}
