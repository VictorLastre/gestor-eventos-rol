// Motor Central de la Cripta del Nigromante
// Combate en tiempo real, colisiones, IA de monstruos, jefes, durabilidad y zona segura.

import { TILE_VOID, TILE_FLOOR, TILE_WALL, TILE_SANCTUARY, TILE_WATER_MOSS, TILE_STAIRS, DungeonGenerator } from './DungeonGenerator';
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
    iconoArma: 'item_sword',
    cadenciaAtaque: 0.38,
    descripcion: 'Ataques circulares de amplio rango con espada. Alto blindaje y resistencia.',
    spritePrefijo: 'guerrero'
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
    iconoArma: 'item_staff',
    cadenciaAtaque: 0.45,
    costoRecurso: 18,
    descripcion: 'Lanza proyectiles arcanos que explotan al impactar. Consume maná.',
    spritePrefijo: 'mago'
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
    iconoArma: 'item_knife',
    cadenciaAtaque: 0.22,
    probCritico: 0.35,
    descripcion: 'Estocadas veloces con alta probabilidad de golpe crítico. Esquive con dash.',
    spritePrefijo: 'picaro'
  }
};

export class GameEngine {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;

    // Estado de la partida
    this.piso = config.pisoInicial || 1;
    this.oro = config.oroInicial || 0;
    this.llaves = 0;
    this.claseId = config.claseId || 'guerrero';
    this.genero = config.genero || 'm'; // 'm' o 'f'
    this.datosClase = CLASES[this.claseId] || CLASES.guerrero;

    // Estadísticas del Jugador
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radio: 10,
      nivel: 1,
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
      enSantuario: false
    };

    // Entidades del mundo
    this.dungeon = null;
    this.enemigos = [];
    this.proyectiles = [];
    this.textosFlotantes = [];
    this.particulas = [];
    this.cofres = [];
    this.jefeActual = null;
    this.escaleraDesbloqueada = false;

    // Cámara
    this.camera = { x: 0, y: 0 };
    this.tileSize = 32;

    // Entrada del usuario
    this.teclas = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, presionado: false };

    // Loop
    this.ultimoTiempo = performance.now();
    this.animId = null;
    this.pausado = false;

    // Callbacks para UI de React
    this.onNotificacion = config.onNotificacion || (() => {});
    this.onActualizarStats = config.onActualizarStats || (() => {});
    this.onMuerte = config.onMuerte || (() => {});
    this.onJefeDerrotado = config.onJefeDerrotado || (() => {});
    this.onCambioPiso = config.onCambioPiso || (() => {});

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
    this.escaleraDesbloqueada = false;
    this.jefeActual = null;
    this.proyectiles = [];
    this.textosFlotantes = [];
    this.particulas = [];

    // Generar mazmorra
    const gen = new DungeonGenerator(this.piso);
    this.dungeon = gen.generar();

    // Posicionar jugador en el spawn
    this.player.x = (this.dungeon.spawnPoint.x + 0.5) * this.tileSize;
    this.player.y = (this.dungeon.spawnPoint.y + 0.5) * this.tileSize;

    // Cargar enemigos
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
      velocidad: sp.esJefe ? 65 : (sp.tipo === 'mushroom' ? 55 : 85),
      radio: sp.esJefe ? 22 : 12,
      cooldownAtaque: 0,
      animFrame: 0,
      animTimer: 0,
      direccionX: 1,
      tiempoHerido: 0
    }));

    // Localizar al jefe
    this.jefeActual = this.enemigos.find(e => e.esJefe) || null;

    // Cargar cofres
    this.cofres = this.dungeon.cofres.map((c, idx) => ({
      id: idx,
      x: (c.x + 0.5) * this.tileSize,
      y: (c.y + 0.5) * this.tileSize,
      abierto: false,
      oro: c.oro,
      pocion: c.pocion
    }));

    this.onNotificacion({
      tipo: 'piso',
      titulo: `¡Has descendido al Piso ${this.piso}!`,
      mensaje: `${this.dungeon.bioma.nombre} - ${this.dungeon.bioma.subtitulo}`
    });

    this.notificarStats();
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

  // Interacción contextual con tecla E (Hoguera o Escalera)
  interactuar() {
    const tileX = Math.floor(this.player.x / this.tileSize);
    const tileY = Math.floor(this.player.y / this.tileSize);

    // 1. Hoguera del Santuario
    const distHoguera = Math.hypot(
      this.player.x - (this.dungeon.hogueraPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.hogueraPoint.y + 0.5) * this.tileSize
    );

    if (distHoguera < 50) {
      this.descansarEnHoguera();
      return;
    }

    // 2. Escalera al Siguiente Piso
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
        this.crearTextoFlotante(this.player.x, this.player.y - 20, '¡El Sello del Jefe bloquea el paso!', '#ef4444');
      }
      return;
    }

    // 3. Abrir cofres cercanos
    for (const c of this.cofres) {
      if (!c.abierto && Math.hypot(this.player.x - c.x, this.player.y - c.y) < 40) {
        c.abierto = true;
        this.oro += c.oro;
        sound.playCoin();
        this.crearTextoFlotante(c.x, c.y - 15, `+${c.oro} Monedas de Oro`, '#fbbf24');
        if (c.pocion === 'vida') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
          this.crearTextoFlotante(this.player.x, this.player.y - 30, '+40 Vida (Poción)', '#10b981');
        } else {
          this.player.durabilidad = Math.min(this.player.maxDurabilidad, this.player.durabilidad + 25);
          this.crearTextoFlotante(this.player.x, this.player.y - 30, '+25 Durabilidad (Piedra de afilar)', '#f59e0b');
        }
        this.notificarStats();
        break;
      }
    }
  }

  descansarEnHoguera() {
    sound.playCampfire();
    this.player.hp = this.player.maxHp;
    this.player.recurso = this.player.maxRecurso;
    this.player.durabilidad = this.player.maxDurabilidad;

    // Crear partículas de fuego y sanación
    for (let i = 0; i < 20; i++) {
      this.particulas.push({
        x: this.player.x + (Math.random() - 0.5) * 30,
        y: this.player.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 30,
        vy: -Math.random() * 50 - 20,
        vida: 1.2,
        maxVida: 1.2,
        color: Math.random() < 0.5 ? '#10b981' : '#f59e0b',
        radio: Math.random() * 3 + 2
      });
    }

    this.crearTextoFlotante(this.player.x, this.player.y - 25, '¡VIDA Y ARMA RESTAURADAS!', '#10b981');
    this.onNotificacion({
      tipo: 'santuario',
      titulo: 'Descanso en la Hoguera Sagrada',
      mensaje: 'Has recuperado toda tu vida, tu arma fue afilada y tu progreso ha sido protegido.'
    });
    this.notificarStats(true); // true = guardar en DB
  }

  ejecutarDash() {
    if (this.player.dashCooldown > 0 || this.player.recurso < 20) return;
    this.player.recurso -= 20;
    this.player.estaDasheando = true;
    this.player.tiempoInvulnerable = 0.35;
    this.player.dashCooldown = 1.0;

    // Impulso en dirección del movimiento o del ratón
    const angulo = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);
    this.player.vx = Math.cos(angulo) * 340;
    this.player.vy = Math.sin(angulo) * 340;

    sound.playSlash();

    // Rastro de sombras
    for (let i = 0; i < 8; i++) {
      this.particulas.push({
        x: this.player.x + (Math.random() - 0.5) * 15,
        y: this.player.y + (Math.random() - 0.5) * 15,
        vx: 0, vy: 0,
        vida: 0.25, maxVida: 0.25,
        color: '#6366f1',
        radio: 5
      });
    }
  }

  atacar() {
    if (this.player.cooldownAtaque > 0 || this.player.hp <= 0) return;

    this.player.cooldownAtaque = this.datosClase.cadenciaAtaque;

    // Desgaste de durabilidad de arma
    if (this.player.durabilidad > 0) {
      this.player.durabilidad -= 1;
      if (this.player.durabilidad === 0) {
        sound.playHit();
        this.crearTextoFlotante(this.player.x, this.player.y - 30, '¡ARMA ROTA! (Daño Reducido)', '#ef4444');
      }
    }

    const danoMult = this.player.durabilidad <= 0 ? 0.4 : (this.player.durabilidad < this.player.maxDurabilidad * 0.3 ? 0.8 : 1.0);
    const danoFinal = Math.round(this.datosClase.danoBase * danoMult);

    const angulo = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);

    // ATAQUE SEGÚN CLASE
    if (this.claseId === 'mago') {
      // Mago: Disparo de proyectil arcano
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
      // Pícaro: Estocada veloz con posibilidad de crítico
      sound.playSlash();
      const esCrit = Math.random() < (this.datosClase.probCritico || 0.35);
      const golpe = esCrit ? danoFinal * 2 : danoFinal;

      this.realizarCorteMele(angulo, 45, Math.PI / 3, golpe, esCrit);

    } else {
      // Guerrero: Corte amplio y pesado
      sound.playSlash();
      this.realizarCorteMele(angulo, 55, Math.PI / 2.2, danoFinal, false);
    }

    this.notificarStats();
  }

  realizarCorteMele(anguloCentro, alcance, arco, dano, esCrit) {
    // Generar arco visual de corte
    for (let a = -arco / 2; a <= arco / 2; a += 0.25) {
      const dir = anguloCentro + a;
      this.particulas.push({
        x: this.player.x + Math.cos(dir) * (alcance * 0.75),
        y: this.player.y + Math.sin(dir) * (alcance * 0.75),
        vx: Math.cos(dir) * 40,
        vy: Math.sin(dir) * 40,
        vida: 0.15,
        maxVida: 0.15,
        color: esCrit ? '#fbbf24' : '#e4e4e7',
        radio: esCrit ? 4 : 2.5
      });
    }

    // Comprobar colisión con enemigos
    for (const e of this.enemigos) {
      if (e.hp <= 0) continue;
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist <= alcance + e.radio) {
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
    e.hp -= dano;
    e.tiempoHerido = 0.2;
    sound.playHit();

    // Retroceso ligero
    const angulo = Math.atan2(e.y - this.player.y, e.x - this.player.x);
    e.x += Math.cos(angulo) * (e.esJefe ? 4 : 16);
    e.y += Math.sin(angulo) * (e.esJefe ? 4 : 16);

    this.crearTextoFlotante(
      e.x + (Math.random() - 0.5) * 10,
      e.y - 15,
      esCrit ? `¡CRÍTICO! -${dano}` : `-${dano}`,
      esCrit ? '#f59e0b' : '#ffffff',
      esCrit ? 15 : 12
    );

    // Muerte del enemigo
    if (e.hp <= 0) {
      this.procesarMuerteEnemigo(e);
    }
  }

  procesarMuerteEnemigo(e) {
    sound.playCoin();
    this.oro += e.oro;
    const xpGanada = e.esJefe ? 250 : 25;
    this.player.xp += xpGanada;

    this.crearTextoFlotante(e.x, e.y - 25, `+${e.oro} Oro`, '#fbbf24');
    this.crearTextoFlotante(e.x, e.y - 40, `+${xpGanada} XP`, '#60a5fa');

    // Partículas de muerte
    for (let i = 0; i < (e.esJefe ? 35 : 12); i++) {
      this.particulas.push({
        x: e.x,
        y: e.y,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120,
        vida: 0.6,
        maxVida: 0.6,
        color: e.esJefe ? '#a855f7' : '#ef4444',
        radio: Math.random() * 4 + 2
      });
    }

    // Comprobar Subida de Nivel
    if (this.player.xp >= this.player.xpSiguiente) {
      this.subirNivel();
    }

    // Si es el Jefe del Piso
    if (e.esJefe) {
      this.escaleraDesbloqueada = true;
      this.llaves += 1;
      sound.playBossRoar();
      this.crearTextoFlotante(this.player.x, this.player.y - 45, '¡LLAVE DEL SELLO OBTENIDA! ESCALERA ABIERTA', '#34d399', 16);
      this.onJefeDerrotado({ piso: this.piso, nombre: e.nombre });
      this.onNotificacion({
        tipo: 'jefe',
        titulo: `¡${e.nombre} ha caído!`,
        mensaje: 'El sello mágico de la escalera ha sido roto. Ya puedes avanzar al siguiente piso.'
      });
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

    // Penalización por muerte:
    // 1. Se rompe la durabilidad del arma equipada
    this.player.durabilidad = 0;
    // 2. Pérdida del 25% de oro
    const oroPerdido = Math.floor(this.oro * 0.25);
    this.oro -= oroPerdido;

    // 3. Reaparecer en la Hoguera Segura del piso
    this.player.x = (this.dungeon.hogueraPoint.x + 0.5) * this.tileSize;
    this.player.y = (this.dungeon.hogueraPoint.y + 0.5) * this.tileSize;
    this.player.hp = Math.round(this.player.maxHp * 0.6); // Revive con 60% vida

    this.onNotificacion({
      tipo: 'muerte',
      titulo: '¡Has sido derrotado en la Cripta!',
      mensaje: `Tu cuerpo fue arrastrado hasta la Hoguera Sagrada. Penalización: Tu arma se ha partido (0 durabilidad) y perdiste ${oroPerdido} monedas de oro.`
    });

    this.crearTextoFlotante(this.player.x, this.player.y - 30, '¡ARMA QUEBRADA AL MORIR!', '#ef4444', 16);
    this.onMuerte({ piso: this.piso, oroPerdido });
    this.notificarStats(true);
  }

  crearTextoFlotante(x, y, texto, color = '#ffffff', tam = 12) {
    this.textosFlotantes.push({
      x, y, texto, color, tam,
      vida: 1.1, maxVida: 1.1,
      vy: -25
    });
  }

  notificarStats(guardarEnDB = false) {
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
      llaves: this.llaves,
      enSantuario: this.player.enSantuario,
      escaleraAbierta: this.escaleraDesbloqueada,
      jefeHP: this.jefeActual && this.jefeActual.hp > 0 ? this.jefeActual.hp : 0,
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
      // Fricción durante el dash
      this.player.vx *= 0.92;
      this.player.vy *= 0.92;
      if (Math.hypot(this.player.vx, this.player.vy) < vel) {
        this.player.estaDasheando = false;
      }
    }

    // Dirección del sprite según ratón
    this.player.direccionX = this.mouse.worldX >= this.player.x ? 1 : -1;
    this.player.estaMoviendose = Math.hypot(this.player.vx, this.player.vy) > 10;

    // Animación de frames
    this.player.animTimer += dt;
    if (this.player.animTimer >= 0.14) {
      this.player.animTimer = 0;
      this.player.animFrame = (this.player.animFrame + 1) % 4;
    }

    // Timers de cooldown
    if (this.player.cooldownAtaque > 0) this.player.cooldownAtaque -= dt;
    if (this.player.tiempoInvulnerable > 0) this.player.tiempoInvulnerable -= dt;
    if (this.player.dashCooldown > 0) this.player.dashCooldown -= dt;

    // Regeneración pasiva de recurso
    if (this.player.recurso < this.player.maxRecurso) {
      this.player.recurso = Math.min(this.player.maxRecurso, this.player.recurso + dt * 12);
    }

    // Mover con colisiones
    this.moverConColision(this.player, dt);

    // Detectar si está en la Zona Segura (Santuario)
    const curTileX = Math.floor(this.player.x / this.tileSize);
    const curTileY = Math.floor(this.player.y / this.tileSize);
    const tileTipo = this.getTile(curTileX, curTileY);
    const antesEnSantuario = this.player.enSantuario;
    this.player.enSantuario = (tileTipo === TILE_SANCTUARY);

    if (this.player.enSantuario) {
      // Regeneración suave en santuario
      if (this.player.hp < this.player.maxHp) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt * 10);
      }
    }

    if (antesEnSantuario !== this.player.enSantuario) {
      this.notificarStats();
    }

    // Si mantiene presionado el ratón, atacar continuamente
    if (this.mouse.presionado) {
      this.atacar();
    }

    // 2. Actualizar Enemigos
    for (const e of this.enemigos) {
      if (e.hp <= 0) continue;

      if (e.tiempoHerido > 0) e.tiempoHerido -= dt;
      if (e.cooldownAtaque > 0) e.cooldownAtaque -= dt;

      // Animación del enemigo
      e.animTimer += dt;
      if (e.animTimer >= 0.16) {
        e.animTimer = 0;
        e.animFrame = (e.animFrame + 1) % 4;
      }

      // IA: No entrar al Santuario y perseguir si está cerca
      const distAlJugador = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      const radioVision = e.esJefe ? 400 : 220;

      if (distAlJugador < radioVision && !this.player.enSantuario) {
        e.direccionX = this.player.x >= e.x ? 1 : -1;
        const angulo = Math.atan2(this.player.y - e.y, this.player.x - e.x);

        // Mover hacia el jugador
        if (distAlJugador > e.radio + this.player.radio + 4) {
          const moveX = Math.cos(angulo) * e.velocidad * dt;
          const moveY = Math.sin(angulo) * e.velocidad * dt;

          const nextX = e.x + moveX;
          const nextY = e.y + moveY;
          const nTile = this.getTile(Math.floor(nextX / this.tileSize), Math.floor(nextY / this.tileSize));

          // No entrar al santuario ni atravesar muros
          if (nTile !== TILE_WALL && nTile !== TILE_VOID && nTile !== TILE_SANCTUARY) {
            e.x = nextX;
            e.y = nextY;
          }
        }

        // Ataque del enemigo al jugador
        if (distAlJugador <= e.radio + this.player.radio + 12 && e.cooldownAtaque <= 0) {
          e.cooldownAtaque = e.esJefe ? 1.2 : 0.9;
          this.infligirDanoJugador(e.dano, e.nombre);
        }
      }
    }

    // 3. Proyectiles
    for (let i = this.proyectiles.length - 1; i >= 0; i--) {
      const p = this.proyectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vida -= dt;

      // Colisión con muro
      const pTile = this.getTile(Math.floor(p.x / this.tileSize), Math.floor(p.y / this.tileSize));
      if (pTile === TILE_WALL || pTile === TILE_VOID || p.vida <= 0) {
        // Explosión de partículas
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

      // Colisión de proyectil con enemigos
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
        if (impacto) {
          this.proyectiles.splice(i, 1);
        }
      }
    }

    // 4. Textos Flotantes
    for (let i = this.textosFlotantes.length - 1; i >= 0; i--) {
      const t = this.textosFlotantes[i];
      t.y += t.vy * dt;
      t.vida -= dt;
      if (t.vida <= 0) this.textosFlotantes.splice(i, 1);
    }

    // 5. Partículas
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const pt = this.particulas[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vida -= dt;
      if (pt.vida <= 0) this.particulas.splice(i, 1);
    }

    // 6. Centrar Cámara suavemente en el jugador
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;

    this.mouse.worldX = this.mouse.x + this.camera.x;
    this.mouse.worldY = this.mouse.y + this.camera.y;
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

    // Intentar mover en X
    if (!this.colisionaConMuro(nextX, entidad.y, r)) {
      entidad.x = nextX;
    }
    // Intentar mover en Y
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
        if (t === TILE_WALL || t === TILE_VOID) {
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

    // Limpiar pantalla con color abisal
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // 1. Renderizar Mazmorra (Baldosas visibles)
    this.renderTilemap(ctx);

    // 2. Renderizar Cofres
    this.renderCofres(ctx);

    // 3. Renderizar Enemigos
    this.renderEnemigos(ctx);

    // 4. Renderizar Jugador
    this.renderJugador(ctx);

    // 5. Renderizar Proyectiles y Partículas
    this.renderProyectiles(ctx);
    this.renderParticulas(ctx);

    // 6. Niebla de oscuridad ambiental y halo de luz de antorchas
    this.renderIluminacion(ctx);

    // 7. Textos flotantes de daño
    this.renderTextosFlotantes(ctx);

    ctx.restore();

    // 8. Retícula o indicadores de HUD contextuales
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
          // Santuario Cálido
          ctx.fillStyle = '#27272a';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
        } else if (t === TILE_WATER_MOSS) {
          // Musgo o Agua según piso
          if (this.piso === 2) {
            ctx.fillStyle = '#064e3b'; // Verde musgo
          } else {
            ctx.fillStyle = '#1e3a8a'; // Azul agua profunda
          }
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
          // Si está desbloqueada, dibuja aura mágica
          if (this.escaleraDesbloqueada) {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
            ctx.beginPath();
            ctx.arc(px + ts / 2, py + ts / 2, ts * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Dibujar la Hoguera en el Santuario
    const hx = (this.dungeon.hogueraPoint.x + 0.5) * ts;
    const hy = (this.dungeon.hogueraPoint.y + 0.5) * ts;

    ctx.save();
    // Resplandor cálido
    const glow = ctx.createRadialGradient(hx, hy, 5, hx, hy, 45);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, 45, 0, Math.PI * 2);
    ctx.fill();

    // Troncos y fuego
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
  }

  renderCofres(ctx) {
    const ts = this.tileSize;
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

      // Si mira a la izquierda, invertir horizontalmente
      if (e.direccionX < 0) {
        ctx.scale(-1, 1);
      }

      // Parpadeo rojo cuando recibe daño
      if (e.tiempoHerido > 0) {
        ctx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
      }

      // Obtener sprite
      let spriteClave = null;
      if (e.tipo === 'skelet') {
        spriteClave = `skelet_${e.hp > 0 ? 'run' : 'idle'}_${e.animFrame}`;
      } else if (e.tipo === 'mushroom') {
        spriteClave = `mushroom_${e.animFrame}`;
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
        // Fallback vectorial
        ctx.fillStyle = e.esJefe ? '#9333ea' : '#e4e4e7';
        ctx.beginPath();
        ctx.arc(0, 0, e.radio, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Barra de vida pequeña sobre los enemigos normales
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

  renderJugador(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Parpadeo de invulnerabilidad
    if (this.player.tiempoInvulnerable > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    if (this.player.direccionX < 0) {
      ctx.scale(-1, 1);
    }

    // Obtener sprite animado del héroe
    const estado = this.player.estaMoviendose ? 'run' : 'idle';
    const clave = `hero_${this.claseId}_${this.genero}_${estado}_${this.player.animFrame}`;
    const imgHeroe = assets.get(clave);

    if (imgHeroe) {
      ctx.drawImage(imgHeroe, -16, -18, 32, 32);
    } else {
      // Fallback si la imagen no terminó de cargar
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

      // Resplandor
      ctx.fillStyle = 'rgba(251, 146, 60, 0.4)';
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
    // Halo de antorcha alrededor del jugador
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
    // Si está cerca de la hoguera
    const distHoguera = Math.hypot(
      this.player.x - (this.dungeon.hogueraPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.hogueraPoint.y + 0.5) * this.tileSize
    );

    if (distHoguera < 50) {
      this.dibujarBurbujaAccion(ctx, 'Hoguera Sagrada', '[E] Descansar y Reparar Equipo');
      return;
    }

    // Si está cerca de la escalera
    const distEscalera = Math.hypot(
      this.player.x - (this.dungeon.stairsPoint.x + 0.5) * this.tileSize,
      this.player.y - (this.dungeon.stairsPoint.y + 0.5) * this.tileSize
    );

    if (distEscalera < 45) {
      if (this.escaleraDesbloqueada || !this.jefeActual || this.jefeActual.hp <= 0) {
        this.dibujarBurbujaAccion(ctx, 'Escaleras Abiertas', '[E] Descender al Siguiente Piso');
      } else {
        this.dibujarBurbujaAccion(ctx, 'Sello del Jefe', 'Derrota al Custodio para abrir el paso');
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
    ctx.roundRect(cx - 150, cy, 300, 48, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = '900 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(titulo.toUpperCase(), cx, cy + 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(subtitulo, cx, cy + 36);
    ctx.restore();
  }
}
