// Motor Central de la Cripta del Nigromante v2.2
// Combate pulido, sin atravesar muros, deslizamiento de IA, Forja de armas, recuperación gradual,
// Santuario descubierto y Sellado de Arena de Jefes (Anti-Exploit / Niebla de Jefe).

import { TILE_VOID, TILE_FLOOR, TILE_WALL, TILE_SANCTUARY, TILE_WATER_MOSS, TILE_STAIRS, TILE_BOSS_GATE, DungeonGenerator } from './DungeonGenerator';
import { sound } from './SoundEngine';
import { assets } from './AssetManager';

export const CLASES = {
  guerrero: {
    nombre: 'Guerrero',
    rolDnd: 'Tanque / Melé Pesado',
    maxHp: 160,
    maxRecurso: 50,
    tipoRecurso: 'estamina',
    velocidad: 140,
    danoBase: 30,
    durabilidadMax: 70,
    nombreArma: 'Espada de Acero Templado',
    iconoArma: 'weapon_regular_sword',
    cadenciaAtaque: 0.38,
    descripcion: 'Ataques circulares de amplio rango con espada. Alto blindaje y resistencia.',
    spritePrefijo: 'guerrero',
    nombreMaterial: 'Fragmentos de Hierro'
  },
  mago: {
    nombre: 'Mago Arcano',
    rolDnd: 'Distancia / Daño en Área',
    maxHp: 90,
    maxRecurso: 100,
    tipoRecurso: 'mana',
    velocidad: 125,
    danoBase: 36,
    durabilidadMax: 50,
    nombreArma: 'Báculo de Fuego Infernal',
    iconoArma: 'weapon_red_magic_staff',
    cadenciaAtaque: 0.45,
    costoRecurso: 18,
    descripcion: 'Lanza proyectiles arcanos que explotan al impactar. Consume maná.',
    spritePrefijo: 'mago',
    nombreMaterial: 'Esencia Arcana'
  },
  picaro: {
    nombre: 'Pícaro',
    rolDnd: 'Agilidad / Críticos / Evasión',
    maxHp: 110,
    maxRecurso: 100,
    tipoRecurso: 'energia',
    velocidad: 175,
    danoBase: 24,
    durabilidadMax: 60,
    nombreArma: 'Daga Sombría Envenenada',
    iconoArma: 'weapon_knife',
    cadenciaAtaque: 0.22,
    probCritico: 0.35,
    descripcion: 'Estocadas veloces con alta probabilidad de golpe crítico. Esquive con dash.',
    spritePrefijo: 'picaro',
    nombreMaterial: 'Piedras de Afilar'
  }
};

export class GameEngine {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;

    this.piso = config.pisoInicial || 1;
    this.oro = config.oroInicial || 0;
    this.materiales = config.materialesInicial || 8;
    this.llaves = 0;
    this.claseId = config.claseId || 'guerrero';
    this.genero = config.genero || 'm';
    this.datosClase = CLASES[this.claseId] || CLASES.guerrero;

    this.santuarioDescubierto = false;
    this.combateJefeActivo = false;

    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radio: 10,
      nivel: config.nivelInicial || 1,
      xp: 0,
      xpSiguiente: 100,
      hp: this.datosClase.maxHp,
      maxHp: this.datosClase.maxHp,
      recurso: this.datosClase.maxRecurso,
      maxRecurso: this.datosClase.maxRecurso,
      durabilidad: this.datosClase.durabilidadMax,
      maxDurabilidad: this.datosClase.durabilidadMax,
      direccionX: 1,
      animFrame: 0,
      animTimer: 0,
      estaMoviendose: false,
      cooldownAtaque: 0,
      tiempoInvulnerable: 0,
      estaDasheando: false,
      dashCooldown: 0,
      enSantuario: false,
      cercaHoguera: false,
      cercaForja: false
    };

    this.dungeon = null;
    this.enemigos = [];
    this.proyectiles = [];
    this.textosFlotantes = [];
    this.particulas = [];
    this.cofres = [];
    this.jefeActual = null;
    this.escaleraDesbloqueada = false;

    this.camera = { x: 0, y: 0 };
    this.tileSize = 32;

    this.teclas = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, presionado: false };

    this.ultimoTiempo = performance.now();
    this.animId = null;
    this.pausado = false;

    this.onNotificacion = config.onNotificacion || (() => {});
    this.onActualizarStats = config.onActualizarStats || (() => {});
    this.onMuerte = config.onMuerte || (() => {});
    this.onJefeDerrotado = config.onJefeDerrotado || (() => {});
    this.onCambioPiso = config.onCambioPiso || (() => {});
    this.onInteractuarNPC = config.onInteractuarNPC || (() => {});

    this.npcs = [];
    this.npcCercano = null;
    this.buffMorfi = 0;

    this.bindEvents();
    this.iniciarPiso(this.piso);
  }

  setClase(claseId, genero = 'm') {
    this.claseId = claseId;
    this.genero = genero;
    this.datosClase = CLASES[claseId] || CLASES.guerrero;
    this.player.maxHp = this.datosClase.maxHp + (this.player.nivel - 1) * 20;
    this.player.hp = this.player.maxHp;
    this.player.maxRecurso = this.datosClase.maxRecurso;
    this.player.recurso = this.player.maxRecurso;
    this.player.maxDurabilidad = this.datosClase.durabilidadMax;
    this.player.durabilidad = this.datosClase.durabilidadMax;
    this.notificarStats();
  }

  iniciarPiso(numPiso) {
    this.piso = numPiso;
    this.santuarioDescubierto = false;
    this.combateJefeActivo = false;
    this.escaleraDesbloqueada = false;
    this.jefeActual = null;
    this.proyectiles = [];
    this.textosFlotantes = [];
    this.particulas = [];

    const gen = new DungeonGenerator(this.piso);
    this.dungeon = gen.generar();

    this.player.x = (this.dungeon.spawnPoint.x + 0.5) * this.tileSize;
    this.player.y = (this.dungeon.spawnPoint.y + 0.5) * this.tileSize;

    this.enemigos = this.dungeon.spawnsEnemigos.map((sp, idx) => ({
      id: idx,
      x: (sp.x + 0.5) * this.tileSize,
      y: (sp.y + 0.5) * this.tileSize,
      tipo: sp.tipo,
      nombre: sp.nombre || (sp.tipo === 'mushroom' ? 'Hongo Errante' : sp.tipo === 'zombie' ? 'Necrófago' : 'Esqueleto Guardián'),
      esJefe: !!sp.esJefe,
      hp: sp.hp,
      maxHp: sp.maxHp,
      dano: sp.dano,
      oro: sp.oro,
      materiales: sp.materiales || 1,
      velocidad: sp.esJefe ? 60 : (sp.tipo === 'mushroom' ? 50 : 80),
      radio: sp.esJefe ? 22 : 12,
      cooldownAtaque: 0,
      cooldownEspecial: 3.5,
      animFrame: 0,
      animTimer: 0,
      direccionX: 1,
      tiempoHerido: 0
    }));

    this.jefeActual = this.enemigos.find(e => e.esJefe) || null;

    this.cofres = this.dungeon.cofres.map((c, idx) => ({
      id: idx,
      x: (c.x + 0.5) * this.tileSize,
      y: (c.y + 0.5) * this.tileSize,
      abierto: false,
      oro: c.oro,
      materiales: c.materiales,
      pocion: c.pocion
    }));

    // NPCs presentes en la mazmorra (Santuario / Salas de apoyo)
    this.npcs = [];
    if (this.dungeon.dinyPoint) {
      this.npcs.push({
        id: 'diny',
        tipo: 'diny',
        x: (this.dungeon.dinyPoint.x + 0.5) * this.tileSize,
        y: (this.dungeon.dinyPoint.y + 0.5) * this.tileSize,
        radio: 14,
        nombre: 'Diana "Diny"',
        cargo: 'Cartógrafa',
        spriteKey: 'npc_diny',
        colorTema: '#38bdf8',
        animFrame: 0,
        animTimer: 0
      });
    }
    if (this.dungeon.deloPoint) {
      this.npcs.push({
        id: 'delo',
        tipo: 'delo',
        x: (this.dungeon.deloPoint.x + 0.5) * this.tileSize,
        y: (this.dungeon.deloPoint.y + 0.5) * this.tileSize,
        radio: 14,
        nombre: 'Agustina "Delo"',
        cargo: 'Alquimista',
        spriteKey: 'npc_delo',
        colorTema: '#c084fc',
        animFrame: 0,
        animTimer: 0
      });
    }

    this.onNotificacion({
      tipo: 'piso',
      titulo: `¡Has descendido al Piso ${this.piso}!`,
      mensaje: `${this.dungeon.bioma.nombre} - Encuentra el Santuario Sagrado para asegurar tu reaparición.`
    });

    this.notificarStats();
  }

  // ✨ SISTEMA DE SELLADO DE ARENA: Bloquea las entradas con barrera rúnica
  sellarEntradasJefe(sellar) {
    if (!this.dungeon || !this.dungeon.entradasJefe) return;
    for (const ent of this.dungeon.entradasJefe) {
      this.dungeon.grid[ent.y][ent.x] = sellar ? TILE_BOSS_GATE : TILE_FLOOR;
    }
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      this.teclas[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.ejecutarDash();
      }
      if (e.key.toLowerCase() === 'e') {
        this.interactuar();
      }
      if (e.key.toLowerCase() === 'f') {
        this.usarForja();
      }
    };

    this.handleKeyUp = (e) => {
      this.teclas[e.key.toLowerCase()] = false;
    };

    this.handleMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.worldX = this.mouse.x + this.camera.x;
      this.mouse.worldY = this.mouse.y + this.camera.y;
    };

    this.handleMouseDown = (e) => {
      if (e.button === 0) {
        this.mouse.presionado = true;
        this.atacar();
      }
    };

    this.handleMouseUp = (e) => {
      if (e.button === 0) {
        this.mouse.presionado = false;
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  hayLineaDeVision(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist / 10);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      const tx = Math.floor(sx / this.tileSize);
      const ty = Math.floor(sy / this.tileSize);
      const tile = this.getTile(tx, ty);
      if (tile === TILE_WALL || tile === TILE_VOID || tile === TILE_BOSS_GATE) {
        return false;
      }
    }
    return true;
  }

  interactuar() {
    // 1. Interacción con NPCs (Diny, Delo, etc.)
    if (this.npcCercano) {
      if (this.onInteractuarNPC) {
        this.onInteractuarNPC(this.npcCercano);
      }
      return;
    }

    const distEscalera = Math.hypot(
      this.player.x - (this.dungeon.stairsPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.stairsPoint.y + 0.5) * this.tileSize
    );

    if (distEscalera < 45) {
      if (this.escaleraDesbloqueada || !this.jefeActual || this.jefeActual.hp <= 0) {
        sound.playLevelUp();
        this.onCambioPiso(this.piso + 1);
        this.iniciarPiso(this.piso + 1);
      } else {
        sound.playHit();
        this.crearTextoFlotante(this.player.x, this.player.y - 20, '¡El Sello del Jefe bloquea la escalera!', '#ef4444');
      }
      return;
    }

    for (const c of this.cofres) {
      if (!c.abierto && Math.hypot(this.player.x - c.x, this.player.y - c.y) < 40) {
        c.abierto = true;
        this.oro += c.oro;
        this.materiales += c.materiales;
        sound.playCoin();
        this.crearTextoFlotante(c.x, c.y - 15, `+${c.oro} Oro  +${c.materiales} Materiales`, '#fbbf24');
        if (c.pocion === 'vida') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
          this.crearTextoFlotante(this.player.x, this.player.y - 30, '+40 Vida (Poción)', '#10b981');
        }
        this.notificarStats();
        break;
      }
    }

    const distHoguera = Math.hypot(
      this.player.x - (this.dungeon.hogueraPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.hogueraPoint.y + 0.5) * this.tileSize
    );
    if (distHoguera < 50) {
      this.crearTextoFlotante(this.player.x, this.player.y - 20, 'Descansando junto al fuego...', '#10b981');
      this.notificarStats(true);
    }
  }

  usarForja() {
    const distForja = Math.hypot(
      this.player.x - (this.dungeon.forjaPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.forjaPoint.y + 0.5) * this.tileSize
    );

    if (distForja > 55) return;

    if (this.player.durabilidad >= this.player.maxDurabilidad) {
      this.crearTextoFlotante(this.player.x, this.player.y - 25, '¡Tu arma ya está en perfecto estado!', '#34d399');
      return;
    }

    const costoMateriales = 5;
    const costoOro = 10;

    if (this.materiales < costoMateriales || this.oro < costoOro) {
      sound.playHit();
      this.crearTextoFlotante(
        this.player.x, this.player.y - 30,
        `Requieres ${costoMateriales} Materiales y ${costoOro} Oro para forjar.`,
        '#ef4444'
      );
      return;
    }

    this.materiales -= costoMateriales;
    this.oro -= costoOro;
    this.player.durabilidad = Math.min(this.player.maxDurabilidad, this.player.durabilidad + 35);
    sound.playHit();

    for (let i = 0; i < 15; i++) {
      this.particulas.push({
        x: this.player.x + (Math.random() - 0.5) * 20,
        y: this.player.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 60 - 20,
        vida: 0.5, maxVida: 0.5,
        color: '#fbbf24', radio: 3
      });
    }

    this.crearTextoFlotante(this.player.x, this.player.y - 25, '¡ARMA FORJADA Y AFILADA! (+35 Durabilidad)', '#10b981', 14);
    this.notificarStats(true);
  }

  ejecutarDash() {
    if (this.player.dashCooldown > 0 || this.player.recurso < 20) return;
    this.player.recurso -= 20;
    this.player.estaDasheando = true;
    this.player.tiempoInvulnerable = 0.35;
    this.player.dashCooldown = 0.9;

    const angulo = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);
    this.player.vx = Math.cos(angulo) * 340;
    this.player.vy = Math.sin(angulo) * 340;

    sound.playSlash();

    for (let i = 0; i < 8; i++) {
      this.particulas.push({
        x: this.player.x + (Math.random() - 0.5) * 15,
        y: this.player.y + (Math.random() - 0.5) * 15,
        vx: 0, vy: 0,
        vida: 0.25, maxVida: 0.25,
        color: '#6366f1', radio: 5
      });
    }
  }

  atacar() {
    if (this.player.cooldownAtaque > 0 || this.player.hp <= 0) return;

    this.player.cooldownAtaque = this.datosClase.cadenciaAtaque;

    if (this.player.durabilidad > 0) {
      this.player.durabilidad -= 1;
      if (this.player.durabilidad === 0) {
        sound.playHit();
        this.crearTextoFlotante(this.player.x, this.player.y - 30, '¡ARMA ROTA! Visita la Forja', '#ef4444');
      }
    }

    const danoMult = this.player.durabilidad <= 0 ? 0.35 : (this.player.durabilidad < this.player.maxDurabilidad * 0.3 ? 0.75 : 1.0);
    const danoFinal = Math.round(this.datosClase.danoBase * danoMult);
    const angulo = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);

    if (this.claseId === 'mago') {
      if (this.player.recurso < (this.datosClase.costoRecurso || 15)) {
        this.crearTextoFlotante(this.player.x, this.player.y - 20, '¡Sin Maná!', '#60a5fa');
        return;
      }
      this.player.recurso -= (this.datosClase.costoRecurso || 15);
      sound.playMagic();

      this.proyectiles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angulo) * 320,
        vy: Math.sin(angulo) * 320,
        radio: 6,
        dano: danoFinal,
        esJugador: true,
        vida: 2.0,
        color: '#f97316'
      });

    } else if (this.claseId === 'picaro') {
      sound.playSlash();
      const esCrit = Math.random() < (this.datosClase.probCritico || 0.35);
      const golpe = esCrit ? danoFinal * 2 : danoFinal;
      this.realizarCorteMele(angulo, 45, Math.PI / 3, golpe, esCrit);

    } else {
      sound.playSlash();
      this.realizarCorteMele(angulo, 55, Math.PI / 2.2, danoFinal, false);
    }

    this.notificarStats();
  }

  realizarCorteMele(anguloCentro, alcance, arco, dano, esCrit) {
    for (let a = -arco / 2; a <= arco / 2; a += 0.25) {
      const dir = anguloCentro + a;
      this.particulas.push({
        x: this.player.x + Math.cos(dir) * (alcance * 0.75),
        y: this.player.y + Math.sin(dir) * (alcance * 0.75),
        vx: Math.cos(dir) * 40, vy: Math.sin(dir) * 40,
        vida: 0.15, maxVida: 0.15,
        color: esCrit ? '#fbbf24' : '#e4e4e7',
        radio: esCrit ? 4 : 2.5
      });
    }

    for (const e of this.enemigos) {
      if (e.hp <= 0) continue;
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist <= alcance + e.radio) {
        if (!this.hayLineaDeVision(this.player.x, this.player.y, e.x, e.y)) {
          continue;
        }

        const anguloEnemigo = Math.atan2(e.y - this.player.y, e.x - this.player.x);
        let diff = Math.abs(anguloCentro - anguloEnemigo);
        while (diff > Math.PI) diff -= Math.PI * 2;
        diff = Math.abs(diff);

        if (diff <= arco / 1.7) {
          this.infligirDanoEnemigo(e, dano, esCrit);
        }
      }
    }
  }

  infligirDanoEnemigo(e, dano, esCrit = false) {
    // ✨ ANTI-EXPLOIT: El Jefe es inmune a ataques si el jugador intenta dispararle desde afuera
    if (e.esJefe && !this.combateJefeActivo) {
      sound.playHit();
      this.crearTextoFlotante(e.x, e.y - 25, '🛡️ ¡ESCUDO RÚNICO! Entra a la arena.', '#c084fc', 13);
      return;
    }

    e.hp -= dano;
    e.tiempoHerido = 0.2;
    sound.playHit();

    const angulo = Math.atan2(e.y - this.player.y, e.x - this.player.x);
    const pushDist = e.esJefe ? 4 : 14;
    const px = e.x + Math.cos(angulo) * pushDist;
    const py = e.y + Math.sin(angulo) * pushDist;
    if (!this.colisionaConMuro(px, py, e.radio)) {
      e.x = px;
      e.y = py;
    }

    this.crearTextoFlotante(
      e.x + (Math.random() - 0.5) * 10,
      e.y - 15,
      esCrit ? `¡CRÍTICO! -${dano}` : `-${dano}`,
      esCrit ? '#f59e0b' : '#ffffff',
      esCrit ? 15 : 12
    );

    if (e.hp <= 0) {
      this.procesarMuerteEnemigo(e);
    }
  }

  procesarMuerteEnemigo(e) {
    sound.playCoin();
    this.oro += e.oro;
    this.materiales += e.materiales;
    const xpGanada = e.esJefe ? 250 : 25;
    this.player.xp += xpGanada;

    this.crearTextoFlotante(e.x, e.y - 25, `+${e.oro} Oro  +${e.materiales} Materiales`, '#fbbf24');
    this.crearTextoFlotante(e.x, e.y - 40, `+${xpGanada} XP`, '#60a5fa');

    for (let i = 0; i < (e.esJefe ? 35 : 12); i++) {
      this.particulas.push({
        x: e.x, y: e.y,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120,
        vida: 0.6, maxVida: 0.6,
        color: e.esJefe ? '#a855f7' : '#ef4444',
        radio: Math.random() * 4 + 2
      });
    }

    if (this.player.xp >= this.player.xpSiguiente) {
      this.subirNivel();
    }

    // ✨ AL MORIR EL JEFE: Desbloquea la barrera y las escaleras
    if (e.esJefe) {
      this.combateJefeActivo = false;
      this.sellarEntradasJefe(false);
      this.escaleraDesbloqueada = true;
      this.llaves += 1;
      sound.playBossRoar();
      this.crearTextoFlotante(this.player.x, this.player.y - 45, '¡LLAVE DEL SELLO OBTENIDA! ESCALERA ABIERTA', '#34d399', 16);
      this.onJefeDerrotado({ piso: this.piso, nombre: e.nombre });
    }

    this.notificarStats();
  }

  subirNivel() {
    this.player.nivel += 1;
    this.player.xp -= this.player.xpSiguiente;
    this.player.xpSiguiente = Math.round(this.player.xpSiguiente * 1.5);
    this.player.maxHp += 15;
    this.player.hp = this.player.maxHp;
    this.player.recurso = this.player.maxRecurso;

    sound.playLevelUp();
    this.crearTextoFlotante(this.player.x, this.player.y - 50, `¡NIVEL ${this.player.nivel}!`, '#34d399', 18);
  }

  aplicarMuerteJugador() {
    sound.playDeath();
    this.player.hp = 0;
    this.player.durabilidad = 0;

    // ✨ LIBERAR ARENA Y REINICIAR JEFE
    this.combateJefeActivo = false;
    this.sellarEntradasJefe(false);
    if (this.jefeActual && this.jefeActual.hp > 0) {
      this.jefeActual.hp = this.jefeActual.maxHp; // Se cura al 100% para reiniciar el duelo limpio
    }

    const oroPerdido = Math.floor(this.oro * 0.25);
    this.oro -= oroPerdido;

    if (this.santuarioDescubierto) {
      this.player.x = (this.dungeon.hogueraPoint.x + 0.5) * this.tileSize;
      this.player.y = (this.dungeon.hogueraPoint.y + 0.5) * this.tileSize;
      this.player.hp = Math.round(this.player.maxHp * 0.5);

      this.onNotificacion({
        tipo: 'muerte',
        titulo: '¡Has sido rescatado por la Hoguera!',
        mensaje: `Penalización: Tu arma se ha partido y perdiste ${oroPerdido} monedas de oro.`
      });
    } else {
      if (this.piso > 1) {
        this.onNotificacion({
          tipo: 'muerte',
          titulo: '¡Expulsado de la Cripta!',
          mensaje: `Caíste sin descubrir el Santuario del Piso ${this.piso}. Has sido devuelto al Santuario del Piso ${this.piso - 1}.`
        });
        this.onMuerte({ piso: this.piso, oroPerdido, expulsado: true, armaQuebrada: true });
        this.onCambioPiso(this.piso - 1);
        this.iniciarPiso(this.piso - 1);
        return;
      } else {
        this.player.x = (this.dungeon.spawnPoint.x + 0.5) * this.tileSize;
        this.player.y = (this.dungeon.spawnPoint.y + 0.5) * this.tileSize;
        this.player.hp = Math.round(this.player.maxHp * 0.5);

        this.onNotificacion({
          tipo: 'muerte',
          titulo: '¡Caído en las Catacumbas!',
          mensaje: `Penalización: Arma rota y pérdida de ${oroPerdido} monedas de oro.`
        });
      }
    }

    this.onMuerte({ piso: this.piso, oroPerdido, expulsado: false, armaQuebrada: true });
    this.notificarStats(true);
  }

  crearTextoFlotante(x, y, texto, color = '#ffffff', tam = 12) {
    this.textosFlotantes.push({
      x, y, texto, color, tam,
      vida: 1.2, maxVida: 1.2,
      vy: -25
    });
  }

  notificarStats(guardarEnDB = false) {
    const mostrarBarraJefe = this.combateJefeActivo || (this.jefeActual && this.jefeActual.hp < this.jefeActual.maxHp && this.jefeActual.hp > 0);

    this.onActualizarStats({
      piso: this.piso,
      clase: this.claseId,
      genero: this.genero,
      nivel: this.player.nivel,
      xp: this.player.xp,
      xpSiguiente: this.player.xpSiguiente,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      recurso: Math.round(this.player.recurso),
      maxRecurso: this.player.maxRecurso,
      durabilidad: this.player.durabilidad,
      maxDurabilidad: this.player.maxDurabilidad,
      armaRota: this.player.durabilidad <= 0,
      oro: this.oro,
      materiales: this.materiales,
      llaves: this.llaves,
      enSantuario: this.player.enSantuario,
      santuarioDescubierto: this.santuarioDescubierto,
      cercaHoguera: this.player.cercaHoguera,
      cercaForja: this.player.cercaForja,
      escaleraAbierta: this.escaleraDesbloqueada,
      jefeHP: mostrarBarraJefe ? this.jefeActual.hp : 0,
      jefeMaxHP: this.jefeActual ? this.jefeActual.maxHp : 1,
      jefeNombre: this.jefeActual ? this.jefeActual.nombre : '',
      guardarEnDB
    });
  }

  start() {
    this.ultimoTiempo = performance.now();
    const bucle = (tiempoActual) => {
      const dt = Math.min((tiempoActual - this.ultimoTiempo) / 1000, 0.1);
      this.ultimoTiempo = tiempoActual;

      if (!this.pausado) {
        this.update(dt);
        this.render();
      }

      this.animId = requestAnimationFrame(bucle);
    };
    this.animId = requestAnimationFrame(bucle);
  }

  update(dt) {
    // 1. Movimiento del Jugador
    let dx = 0;
    let dy = 0;
    if (this.teclas['w'] || this.teclas['arrowup']) dy -= 1;
    if (this.teclas['s'] || this.teclas['arrowdown']) dy += 1;
    if (this.teclas['a'] || this.teclas['arrowleft']) dx -= 1;
    if (this.teclas['d'] || this.teclas['arrowright']) dx += 1;

    const vel = this.datosClase.velocidad;
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (!this.player.estaDasheando) {
      this.player.vx = dx * vel;
      this.player.vy = dy * vel;
    } else {
      this.player.vx *= 0.92;
      this.player.vy *= 0.92;
      if (Math.hypot(this.player.vx, this.player.vy) < vel) {
        this.player.estaDasheando = false;
      }
    }

    this.player.direccionX = this.mouse.worldX >= this.player.x ? 1 : -1;
    this.player.estaMoviendose = Math.hypot(this.player.vx, this.player.vy) > 10;

    this.player.animTimer += dt;
    if (this.player.animTimer >= 0.14) {
      this.player.animTimer = 0;
      this.player.animFrame = (this.player.animFrame + 1) % 4;
    }

    if (this.player.cooldownAtaque > 0) this.player.cooldownAtaque -= dt;
    if (this.player.tiempoInvulnerable > 0) this.player.tiempoInvulnerable -= dt;
    if (this.player.dashCooldown > 0) this.player.dashCooldown -= dt;

    if (this.player.recurso < this.player.maxRecurso) {
      this.player.recurso = Math.min(this.player.maxRecurso, this.player.recurso + dt * 10);
    }

    this.moverConColision(this.player, dt);

    // 2. Detección de Santuario, Hoguera y Forja
    const curTileX = Math.floor(this.player.x / this.tileSize);
    const curTileY = Math.floor(this.player.y / this.tileSize);
    const tileTipo = this.getTile(curTileX, curTileY);
    this.player.enSantuario = (tileTipo === TILE_SANCTUARY);

    if (this.player.enSantuario && !this.santuarioDescubierto) {
      this.santuarioDescubierto = true;
      sound.playCampfire();
      this.crearTextoFlotante(this.player.x, this.player.y - 30, '¡SANTUARIO DESCUBIERTO!', '#10b981', 16);
      this.onNotificacion({
        tipo: 'santuario',
        titulo: 'Santuario Asegurado',
        mensaje: 'Has descubierto la Hoguera de este piso. Si caes en combate, renacerás aquí.'
      });
    }

    const distHoguera = Math.hypot(
      this.player.x - (this.dungeon.hogueraPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.hogueraPoint.y + 0.5) * this.tileSize
    );
    this.player.cercaHoguera = distHoguera < 48;

    const distForja = Math.hypot(
      this.player.x - (this.dungeon.forjaPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.forjaPoint.y + 0.5) * this.tileSize
    );
    this.player.cercaForja = distForja < 48;

    if (this.player.cercaHoguera) {
      if (this.player.hp < this.player.maxHp) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt * 25);
      }
      if (this.player.recurso < this.player.maxRecurso) {
        this.player.recurso = Math.min(this.player.maxRecurso, this.player.recurso + dt * 30);
      }
    }

    // Actualizar animación de NPCs y detectar cercanía
    this.npcCercano = null;
    let menorDistNPC = 46;
    for (const npc of this.npcs) {
      npc.animTimer = (npc.animTimer || 0) + dt;
      if (npc.animTimer > 0.18) {
        npc.animTimer = 0;
        npc.animFrame = ((npc.animFrame || 0) + 1) % 4;
      }
      const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      if (dist < menorDistNPC) {
        menorDistNPC = dist;
        this.npcCercano = npc;
      }
    }

    // Buff de regeneración pasiva por Morfi de Delo
    if (this.buffMorfi > 0) {
      this.buffMorfi -= dt;
      if (this.player.hp < this.player.maxHp) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt * 4);
      }
    }

    // ✨ ACTIVACIÓN DE ARENA: Si el jugador entra a la sala del jefe, sellar puertas
    const hj = this.dungeon.habJefe;
    if (hj && this.jefeActual && this.jefeActual.hp > 0) {
      const pxTile = this.player.x / this.tileSize;
      const pyTile = this.player.y / this.tileSize;
      const jugadorEnSalaJefe = (
        pxTile >= hj.x + 0.5 && pxTile <= hj.x + hj.ancho - 0.5 &&
        pyTile >= hj.y + 0.5 && pyTile <= hj.y + hj.alto - 0.5
      );

      if (jugadorEnSalaJefe && !this.combateJefeActivo) {
        this.combateJefeActivo = true;
        this.sellarEntradasJefe(true);
        sound.playBossRoar();
        this.crearTextoFlotante(this.player.x, this.player.y - 40, '⚔️ ¡ARENA SELLADA! VENCE AL JEFE O MUERE', '#ef4444', 16);
        this.onNotificacion({
          tipo: 'jefe',
          titulo: `⚔️ Duelo de Custodio: ${this.jefeActual.nombre}`,
          mensaje: '¡Las salidas han sido selladas por magia ancestral! No hay escape hasta que uno caiga.'
        });
      }
    }

    if (this.mouse.presionado) {
      this.atacar();
    }

    // 3. Actualizar IA de Enemigos
    for (let i = 0; i < this.enemigos.length; i++) {
      const e = this.enemigos[i];
      if (e.hp <= 0) continue;

      if (e.tiempoHerido > 0) e.tiempoHerido -= dt;
      if (e.cooldownAtaque > 0) e.cooldownAtaque -= dt;
      if (e.cooldownEspecial > 0) e.cooldownEspecial -= dt;

      e.animTimer += dt;
      if (e.animTimer >= 0.16) {
        e.animTimer = 0;
        e.animFrame = (e.animFrame + 1) % 4;
      }

      const distAlJugador = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      const radioVision = e.esJefe ? 450 : 230;

      // El jefe solo persigue dentro de su combate activo o si está dentro de su radio
      const puedePerseguir = e.esJefe ? (this.combateJefeActivo || distAlJugador < 200) : (distAlJugador < radioVision && !this.player.enSantuario);

      if (puedePerseguir) {
        e.direccionX = this.player.x >= e.x ? 1 : -1;
        const angulo = Math.atan2(this.player.y - e.y, this.player.x - e.x);

        if (distAlJugador > e.radio + this.player.radio + 4) {
          const moveX = Math.cos(angulo) * e.velocidad * dt;
          const moveY = Math.sin(angulo) * e.velocidad * dt;

          const nextX = e.x + moveX;
          const nextY = e.y + moveY;

          const nTileX = this.getTile(Math.floor(nextX / this.tileSize), Math.floor(e.y / this.tileSize));
          if (!this.colisionaConMuro(nextX, e.y, e.radio) && nTileX !== TILE_SANCTUARY) {
            e.x = nextX;
          }

          const nTileY = this.getTile(Math.floor(e.x / this.tileSize), Math.floor(nextY / this.tileSize));
          if (!this.colisionaConMuro(e.x, nextY, e.radio) && nTileY !== TILE_SANCTUARY) {
            e.y = nextY;
          }

          // Separación entre monstruos
          for (let j = 0; j < this.enemigos.length; j++) {
            if (i === j) continue;
            const otro = this.enemigos[j];
            if (otro.hp <= 0) continue;
            const distOtros = Math.hypot(e.x - otro.x, e.y - otro.y);
            if (distOtros < e.radio + otro.radio) {
              const pushAng = Math.atan2(e.y - otro.y, e.x - otro.x);
              e.x += Math.cos(pushAng) * 1.5;
              e.y += Math.sin(pushAng) * 1.5;
            }
          }
        }

        // Ataque cuerpo a cuerpo
        if (distAlJugador <= e.radio + this.player.radio + 10 && e.cooldownAtaque <= 0) {
          if (this.hayLineaDeVision(e.x, e.y, this.player.x, this.player.y)) {
            e.cooldownAtaque = e.esJefe ? 1.1 : 0.95;
            this.infligirDanoJugador(e.dano, e.nombre);
          }
        }

        // ✨ HABILIDADES ESPECIALES DE LOS JEFES
        if (e.esJefe && this.combateJefeActivo && e.cooldownEspecial <= 0) {
          e.cooldownEspecial = 4.0;
          this.ejecutarAtaqueEspecialJefe(e);
        }
      }
    }

    // 4. Proyectiles
    for (let i = this.proyectiles.length - 1; i >= 0; i--) {
      const p = this.proyectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vida -= dt;

      const pTile = this.getTile(Math.floor(p.x / this.tileSize), Math.floor(p.y / this.tileSize));
      if (pTile === TILE_WALL || pTile === TILE_VOID || pTile === TILE_BOSS_GATE || p.vida <= 0) {
        for (let k = 0; k < 6; k++) {
          this.particulas.push({
            x: p.x, y: p.y,
            vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
            vida: 0.2, maxVida: 0.2,
            color: p.color, radio: 3
          });
        }
        this.proyectiles.splice(i, 1);
        continue;
      }

      // Proyectil del jugador impacta a enemigos
      if (p.esJugador) {
        let impacto = false;
        for (const e of this.enemigos) {
          if (e.hp <= 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) < e.radio + p.radio) {
            this.infligirDanoEnemigo(e, p.dano, true);
            impacto = true;
            break;
          }
        }
        if (impacto) this.proyectiles.splice(i, 1);
      } else {
        // Proyectil del enemigo impacta al jugador
        if (Math.hypot(this.player.x - p.x, this.player.y - p.y) < this.player.radio + p.radio) {
          this.infligirDanoJugador(p.dano, 'Hechizo Oscuro');
          this.proyectiles.splice(i, 1);
        }
      }
    }

    // 5. Textos Flotantes
    for (let i = this.textosFlotantes.length - 1; i >= 0; i--) {
      const t = this.textosFlotantes[i];
      t.y += t.vy * dt;
      t.vida -= dt;
      if (t.vida <= 0) this.textosFlotantes.splice(i, 1);
    }

    // 6. Partículas
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const pt = this.particulas[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vida -= dt;
      if (pt.vida <= 0) this.particulas.splice(i, 1);
    }

    // 7. Cámara suave
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;

    this.mouse.worldX = this.mouse.x + this.camera.x;
    this.mouse.worldY = this.mouse.y + this.camera.y;

    this.notificarStats();
  }

  ejecutarAtaqueEspecialJefe(jefe) {
    if (this.piso === 1) {
      // Salto de impacto y onda expansiva hacia el jugador
      sound.playHit();
      const angulo = Math.atan2(this.player.y - jefe.y, this.player.x - jefe.x);
      jefe.x += Math.cos(angulo) * 45;
      jefe.y += Math.sin(angulo) * 45;

      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        this.particulas.push({
          x: jefe.x, y: jefe.y,
          vx: Math.cos(a) * 90, vy: Math.sin(a) * 90,
          vida: 0.4, maxVida: 0.4, color: '#f59e0b', radio: 4
        });
      }
      this.crearTextoFlotante(jefe.x, jefe.y - 30, '¡PISOTÓN SÍSMICO!', '#f59e0b', 14);

      if (Math.hypot(this.player.x - jefe.x, this.player.y - jefe.y) < 65) {
        this.infligirDanoJugador(18, jefe.nombre);
      }

    } else if (this.piso === 2) {
      // Espora gigante: ráfaga de 6 esporas en círculo
      sound.playMagic();
      this.crearTextoFlotante(jefe.x, jefe.y - 30, '¡ESTALLIDO DE ESPORAS!', '#34d399', 14);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        this.proyectiles.push({
          x: jefe.x, y: jefe.y,
          vx: Math.cos(a) * 160, vy: Math.sin(a) * 160,
          radio: 5, dano: 16, esJugador: false, vida: 2.2, color: '#34d399'
        });
      }

    } else {
      // Nigromante: 2 orbes oscuros teledirigidos hacia el jugador
      sound.playMagic();
      this.crearTextoFlotante(jefe.x, jefe.y - 30, '¡DESCARGA PROFANA!', '#c084fc', 14);
      const ang = Math.atan2(this.player.y - jefe.y, this.player.x - jefe.x);
      [-0.2, 0.2].forEach(offset => {
        this.proyectiles.push({
          x: jefe.x, y: jefe.y,
          vx: Math.cos(ang + offset) * 190, vy: Math.sin(ang + offset) * 190,
          radio: 6, dano: 20, esJugador: false, vida: 2.5, color: '#a855f7'
        });
      });
    }
  }

  infligirDanoJugador(dano, atacante) {
    if (this.player.tiempoInvulnerable > 0 || this.player.hp <= 0) return;

    this.player.tiempoInvulnerable = 0.45;
    this.player.hp -= dano;
    sound.playHit();

    this.crearTextoFlotante(this.player.x, this.player.y - 25, `-${dano}`, '#ef4444', 15);

    if (this.player.hp <= 0) {
      this.aplicarMuerteJugador();
    } else {
      this.notificarStats();
    }
  }

  moverConColision(entidad, dt) {
    const nextX = entidad.x + entidad.vx * dt;
    const nextY = entidad.y + entidad.vy * dt;
    const r = entidad.radio;

    if (!this.colisionaConMuro(nextX, entidad.y, r)) {
      entidad.x = nextX;
    }
    if (!this.colisionaConMuro(entidad.x, nextY, r)) {
      entidad.y = nextY;
    }
  }

  colisionaConMuro(x, y, radio) {
    const minTileX = Math.floor((x - radio) / this.tileSize);
    const maxTileX = Math.floor((x + radio) / this.tileSize);
    const minTileY = Math.floor((y - radio) / this.tileSize);
    const maxTileY = Math.floor((y + radio) / this.tileSize);

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const t = this.getTile(tx, ty);
        if (t === TILE_WALL || t === TILE_VOID || t === TILE_BOSS_GATE) {
          return true;
        }
      }
    }
    return false;
  }

  getTile(tx, ty) {
    if (!this.dungeon || ty < 0 || ty >= this.dungeon.tamano || tx < 0 || tx >= this.dungeon.tamano) {
      return TILE_VOID;
    }
    return this.dungeon.grid[ty][tx];
  }

  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    this.renderTilemap(ctx);
    this.renderCofres(ctx);
    this.renderEnemigos(ctx);
    this.renderNPCs(ctx);
    this.renderJugador(ctx);
    this.renderProyectiles(ctx);
    this.renderParticulas(ctx);
    this.renderIluminacion(ctx);
    this.renderTextosFlotantes(ctx);

    ctx.restore();

    this.renderHUDContextual(ctx);
  }

  renderTilemap(ctx) {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(this.camera.x / ts));
    const endCol = Math.min(this.dungeon.tamano - 1, Math.floor((this.camera.x + this.canvas.width) / ts) + 1);
    const startRow = Math.max(0, Math.floor(this.camera.y / ts));
    const endRow = Math.min(this.dungeon.tamano - 1, Math.floor((this.camera.y + this.canvas.height) / ts) + 1);

    const imgFloor = assets.get('tile_floor');
    const imgWall = assets.get('tile_wall');
    const imgStairs = assets.get('tile_stairs');

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const t = this.dungeon.grid[y][x];
        const px = x * ts;
        const py = y * ts;

        if (t === TILE_FLOOR) {
          if (imgFloor) {
            ctx.drawImage(imgFloor, px, py, ts, ts);
          } else {
            ctx.fillStyle = this.dungeon.bioma.sueloColor;
            ctx.fillRect(px, py, ts, ts);
          }
        } else if (t === TILE_SANCTUARY) {
          ctx.fillStyle = '#27272a';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
        } else if (t === TILE_WATER_MOSS) {
          ctx.fillStyle = this.piso === 2 ? '#064e3b' : '#1e3a8a';
          ctx.fillRect(px, py, ts, ts);
        } else if (t === TILE_WALL) {
          if (imgWall) {
            ctx.drawImage(imgWall, px, py, ts, ts);
          } else {
            ctx.fillStyle = this.dungeon.bioma.murosColor;
            ctx.fillRect(px, py, ts, ts);
          }
        } else if (t === TILE_STAIRS) {
          if (imgStairs) {
            ctx.drawImage(imgStairs, px, py, ts, ts);
          } else {
            ctx.fillStyle = '#8b5cf6';
            ctx.fillRect(px, py, ts, ts);
          }
          if (this.escaleraDesbloqueada) {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
            ctx.beginPath();
            ctx.arc(px + ts / 2, py + ts / 2, ts * 0.75, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (t === TILE_BOSS_GATE) {
          // ✨ BARRERA RÚNICA SELLADA
          ctx.fillStyle = 'rgba(147, 51, 234, 0.85)';
          ctx.fillRect(px, py, ts, ts);
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', px + ts / 2, py + ts / 2 + 4);
        }
      }
    }

    // Hoguera
    const hx = (this.dungeon.hogueraPoint.x + 0.5) * ts;
    const hy = (this.dungeon.hogueraPoint.y + 0.5) * ts;

    ctx.save();
    const glow = ctx.createRadialGradient(hx, hy, 5, hx, hy, 50);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(hx - 8, hy + 2, 16, 6);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(hx, hy - 4, 6 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(hx, hy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Forja
    const fx = (this.dungeon.forjaPoint.x + 0.5) * ts;
    const fy = (this.dungeon.forjaPoint.y + 0.5) * ts;

    ctx.save();
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(fx - 10, fy - 4, 20, 14);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(fx - 8, fy - 10, 16, 7);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(fx - 12, fy - 11, 6, 4);

    const imgMartillo = assets.get('weapon_hammer');
    if (imgMartillo) {
      ctx.drawImage(imgMartillo, fx - 8, fy - 18, 16, 16);
    }
    ctx.restore();
  }

  renderCofres(ctx) {
    const imgCerrado = assets.get('chest_closed');
    const imgAbierto = assets.get('chest_open');

    for (const c of this.cofres) {
      if (c.abierto) {
        if (imgAbierto) ctx.drawImage(imgAbierto, c.x - 12, c.y - 12, 24, 24);
        else {
          ctx.fillStyle = '#71717a';
          ctx.fillRect(c.x - 10, c.y - 10, 20, 20);
        }
      } else {
        if (imgCerrado) ctx.drawImage(imgCerrado, c.x - 12, c.y - 12, 24, 24);
        else {
          ctx.fillStyle = '#eab308';
          ctx.fillRect(c.x - 10, c.y - 10, 20, 20);
        }
      }
    }
  }

  renderEnemigos(ctx) {
    for (const e of this.enemigos) {
      if (e.hp <= 0) continue;

      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.direccionX < 0) {
        ctx.scale(-1, 1);
      }

      if (e.tiempoHerido > 0) {
        ctx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
      }

      let spriteClave = null;
      if (e.tipo === 'skelet') {
        spriteClave = `skelet_${e.hp > 0 ? 'run' : 'idle'}_${e.animFrame}`;
      } else if (e.tipo === 'mushroom' || e.tipo === 'big_mushroom') {
        spriteClave = `mushroom_run_${e.animFrame}`;
      } else if (e.tipo === 'necromancer') {
        spriteClave = `necromancer_${e.animFrame}`;
      } else if (e.tipo === 'chort') {
        spriteClave = `chort_idle_${e.animFrame % 2}`;
      } else if (e.tipo === 'zombie' || e.tipo === 'big_zombie') {
        spriteClave = `big_zombie_idle_${e.animFrame % 2}`;
      }

      const img = spriteClave ? assets.get(spriteClave) : null;
      const tam = e.esJefe ? 48 : 28;

      if (img) {
        ctx.drawImage(img, -tam / 2, -tam / 2, tam, tam);
      } else {
        ctx.fillStyle = e.esJefe ? '#9333ea' : '#e4e4e7';
        ctx.beginPath();
        ctx.arc(0, 0, e.radio, 0, Math.PI * 2);
        ctx.fill();
      }

      // ✨ ESCUDO RÚNICO VISUAL SI EL JEFE AÚN NO HA SIDO DESAFIADO
      if (e.esJefe && !this.combateJefeActivo) {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, e.radio + 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      if (!e.esJefe && e.hp < e.maxHp) {
        const barraW = 24;
        const barraH = 3;
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(e.x - barraW / 2, e.y - e.radio - 8, barraW, barraH);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x - barraW / 2, e.y - e.radio - 8, barraW * (e.hp / e.maxHp), barraH);
      }
    }
  }

  renderNPCs(ctx) {
    if (!this.npcs) return;

    for (const npc of this.npcs) {
      const frame = npc.animFrame || 0;
      const img = assets.get(`${npc.spriteKey}_${frame}`);
      const tam = 28;

      ctx.save();
      ctx.translate(npc.x, npc.y);

      // Sombra bajo el personaje
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura distintiva
      ctx.fillStyle = npc.colorTema || '#38bdf8';
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Sprite animado
      if (img) {
        ctx.drawImage(img, -tam / 2, -tam / 2 - 2, tam, tam);
      } else {
        ctx.fillStyle = npc.colorTema || '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, npc.radio, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nombre y Rol
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = npc.colorTema || '#ffffff';
      ctx.fillText(npc.nombre, 0, -npc.radio - 6);

      ctx.font = '8px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(npc.cargo, 0, -npc.radio + 3);

      // Indicador [E] Hablar si el jugador está cerca
      const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      if (dist < 46) {
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('💬 [E] Hablar', 0, -npc.radio - 16);
      }

      ctx.restore();
    }
  }

  // ✨ SERVICIOS DE LOS NPCS DE LA ASOCIACIÓN
  revelarMinimapa(tipo) {
    if (!this.dungeon) return;
    if (tipo === 'completo') {
      for (const h of this.dungeon.habitaciones) {
        h.descubierta = true;
      }
      this.santuarioDescubierto = true;
      this.crearTextoFlotante(this.player.x, this.player.y - 25, '🗺️ ¡Plano completo revelado por Diny!', '#38bdf8', 14);
      this.notificarStats();
    } else if (tipo === 'seguridad') {
      const habSantuario = this.dungeon.habitaciones.find(h => h.tipo === 'santuario');
      if (habSantuario) habSantuario.descubierta = true;
      const habJefe = this.dungeon.habitaciones.find(h => h.tipo === 'jefe');
      if (habJefe) habJefe.descubierta = true;
      this.santuarioDescubierto = true;
      this.crearTextoFlotante(this.player.x, this.player.y - 25, '📍 ¡Santuario y Escalera trazados!', '#38bdf8', 14);
      this.notificarStats();
    }
  }

  curarJugador(cantidad) {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + cantidad);
    sound.playHeal();
    this.crearTextoFlotante(this.player.x, this.player.y - 25, `+${cantidad} Vida (Delo)`, '#10b981', 14);
    this.notificarStats();
  }

  repararArma(cantidad) {
    this.player.durabilidad = Math.min(this.player.maxDurabilidad, this.player.durabilidad + cantidad);
    sound.playShopBuy();
    this.crearTextoFlotante(this.player.x, this.player.y - 25, `+${cantidad} Filo de Arma`, '#38bdf8', 14);
    this.notificarStats();
  }

  aplicarBuffMorfi() {
    this.buffMorfi = 30; // 30 segundos
    sound.playHeal();
    this.crearTextoFlotante(this.player.x, this.player.y - 25, '🥟 ¡Morfi de Delo activado! (+HP continuo)', '#a855f7', 14);
    this.notificarStats();
  }

  renderJugador(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    if (this.player.tiempoInvulnerable > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    if (this.player.direccionX < 0) {
      ctx.scale(-1, 1);
    }

    const estado = this.player.estaMoviendose ? 'run' : 'idle';
    const clave = `hero_${this.claseId}_${this.genero}_${estado}_${this.player.animFrame}`;
    const imgHeroe = assets.get(clave);

    if (imgHeroe) {
      ctx.drawImage(imgHeroe, -16, -18, 32, 32);
    } else {
      ctx.fillStyle = this.claseId === 'guerrero' ? '#3b82f6' : this.claseId === 'mago' ? '#a855f7' : '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radio, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderProyectiles(ctx) {
    for (const p of this.proyectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.esJugador ? 'rgba(251, 146, 60, 0.4)' : 'rgba(168, 85, 247, 0.4)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderParticulas(ctx) {
    for (const pt of this.particulas) {
      const alfa = pt.vida / pt.maxVida;
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radio, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderIluminacion(ctx) {
    const grad = ctx.createRadialGradient(
      this.player.x, this.player.y, 25,
      this.player.x, this.player.y, 160
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, this.dungeon.bioma.colorAmbiente);

    ctx.fillStyle = grad;
    ctx.fillRect(this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);
  }

  renderTextosFlotantes(ctx) {
    for (const t of this.textosFlotantes) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.vida / t.maxVida);
      ctx.font = `900 ${t.tam}px monospace`;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(t.texto, t.x, t.y);
      ctx.fillText(t.texto, t.x, t.y);
      ctx.restore();
    }
  }

  renderHUDContextual(ctx) {
    if (this.player.cercaHoguera) {
      this.dibujarBurbujaAccion(ctx, 'Hoguera Sagrada', 'Restaurando Salud y Maná con el fuego...');
      return;
    }

    if (this.player.cercaForja) {
      this.dibujarBurbujaAccion(ctx, 'Forja del Gremio', '[F] Reparar Arma (Costo: 5 Materiales, 10 Oro)');
      return;
    }

    const distEscalera = Math.hypot(
      this.player.x - (this.dungeon.stairsPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.stairsPoint.y + 0.5) * this.tileSize
    );

    if (distEscalera < 45) {
      if (this.escaleraDesbloqueada || !this.jefeActual || this.jefeActual.hp <= 0) {
        this.dibujarBurbujaAccion(ctx, 'Escaleras Abiertas', '[E] Descender al Siguiente Piso');
      } else {
        this.dibujarBurbujaAccion(ctx, 'Sello del Jefe', 'Vence al Custodio para desbloquear el paso');
      }
    }
  }

  dibujarBurbujaAccion(ctx, titulo, subtitulo) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height - 70;

    ctx.save();
    ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 190, cy, 380, 48, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = '900 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(titulo.toUpperCase(), cx, cy + 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(subtitulo, cx, cy + 36);
    ctx.restore();
  }
}
