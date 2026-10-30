// Administrador de Assets: precarga y cachea los sprites e iconos del crawler

class AssetManager {
  constructor() {
    this.images = {};
    this.cargados = 0;
    this.total = 0;
    this.listo = false;
  }

  cargarImagen(clave, url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images[clave] = img;
        this.cargados++;
        resolve(img);
      };
      img.onerror = () => {
        // Fallback silencioso si una imagen particular falta
        this.images[clave] = null;
        this.cargados++;
        resolve(null);
      };
      img.src = url;
    });
  }

  async precargarTodo(onProgreso) {
    if (this.listo) return true;

    const lista = [
      // Héroes: Guerrero (Knight)
      { k: 'hero_guerrero_m_idle_0', u: '/assets/crawler/heroes/knight_m_idle_anim_f0.png' },
      { k: 'hero_guerrero_m_idle_1', u: '/assets/crawler/heroes/knight_m_idle_anim_f1.png' },
      { k: 'hero_guerrero_m_idle_2', u: '/assets/crawler/heroes/knight_m_idle_anim_f2.png' },
      { k: 'hero_guerrero_m_idle_3', u: '/assets/crawler/heroes/knight_m_idle_anim_f3.png' },
      { k: 'hero_guerrero_m_run_0', u: '/assets/crawler/heroes/knight_m_run_anim_f0.png' },
      { k: 'hero_guerrero_m_run_1', u: '/assets/crawler/heroes/knight_m_run_anim_f1.png' },
      { k: 'hero_guerrero_m_run_2', u: '/assets/crawler/heroes/knight_m_run_anim_f2.png' },
      { k: 'hero_guerrero_m_run_3', u: '/assets/crawler/heroes/knight_m_run_anim_f3.png' },

      { k: 'hero_guerrero_f_idle_0', u: '/assets/crawler/heroes/knight_f_idle_anim_f0.png' },
      { k: 'hero_guerrero_f_idle_1', u: '/assets/crawler/heroes/knight_f_idle_anim_f1.png' },
      { k: 'hero_guerrero_f_idle_2', u: '/assets/crawler/heroes/knight_f_idle_anim_f2.png' },
      { k: 'hero_guerrero_f_idle_3', u: '/assets/crawler/heroes/knight_f_idle_anim_f3.png' },
      { k: 'hero_guerrero_f_run_0', u: '/assets/crawler/heroes/knight_f_run_anim_f0.png' },
      { k: 'hero_guerrero_f_run_1', u: '/assets/crawler/heroes/knight_f_run_anim_f1.png' },
      { k: 'hero_guerrero_f_run_2', u: '/assets/crawler/heroes/knight_f_run_anim_f2.png' },
      { k: 'hero_guerrero_f_run_3', u: '/assets/crawler/heroes/knight_f_run_anim_f3.png' },

      // Héroes: Mago (Wizard)
      { k: 'hero_mago_m_idle_0', u: '/assets/crawler/heroes/wizzard_m_idle_anim_f0.png' },
      { k: 'hero_mago_m_idle_1', u: '/assets/crawler/heroes/wizzard_m_idle_anim_f1.png' },
      { k: 'hero_mago_m_idle_2', u: '/assets/crawler/heroes/wizzard_m_idle_anim_f2.png' },
      { k: 'hero_mago_m_idle_3', u: '/assets/crawler/heroes/wizzard_m_idle_anim_f3.png' },
      { k: 'hero_mago_m_run_0', u: '/assets/crawler/heroes/wizzard_m_run_anim_f0.png' },
      { k: 'hero_mago_m_run_1', u: '/assets/crawler/heroes/wizzard_m_run_anim_f1.png' },

      { k: 'hero_mago_f_idle_0', u: '/assets/crawler/heroes/wizzard_f_idle_anim_f0.png' },
      { k: 'hero_mago_f_idle_1', u: '/assets/crawler/heroes/wizzard_f_idle_anim_f1.png' },
      { k: 'hero_mago_f_idle_2', u: '/assets/crawler/heroes/wizzard_f_idle_anim_f2.png' },
      { k: 'hero_mago_f_idle_3', u: '/assets/crawler/heroes/wizzard_f_idle_anim_f3.png' },
      { k: 'hero_mago_f_run_0', u: '/assets/crawler/heroes/wizzard_f_run_anim_f0.png' },
      { k: 'hero_mago_f_run_1', u: '/assets/crawler/heroes/wizzard_f_run_anim_f1.png' },

      // Héroes: Pícaro (Elf)
      { k: 'hero_picaro_m_idle_0', u: '/assets/crawler/heroes/elf_m_idle_anim_f0.png' },
      { k: 'hero_picaro_m_idle_1', u: '/assets/crawler/heroes/elf_m_idle_anim_f1.png' },
      { k: 'hero_picaro_m_idle_2', u: '/assets/crawler/heroes/elf_m_idle_anim_f2.png' },
      { k: 'hero_picaro_m_idle_3', u: '/assets/crawler/heroes/elf_m_idle_anim_f3.png' },
      { k: 'hero_picaro_m_run_0', u: '/assets/crawler/heroes/elf_m_run_anim_f0.png' },
      { k: 'hero_picaro_m_run_1', u: '/assets/crawler/heroes/elf_m_run_anim_f1.png' },

      { k: 'hero_picaro_f_idle_0', u: '/assets/crawler/heroes/elf_f_idle_anim_f0.png' },
      { k: 'hero_picaro_f_idle_1', u: '/assets/crawler/heroes/elf_f_idle_anim_f1.png' },
      { k: 'hero_picaro_f_idle_2', u: '/assets/crawler/heroes/elf_f_idle_anim_f2.png' },
      { k: 'hero_picaro_f_idle_3', u: '/assets/crawler/heroes/elf_f_idle_anim_f3.png' },
      { k: 'hero_picaro_f_run_0', u: '/assets/crawler/heroes/elf_f_run_anim_f0.png' },
      { k: 'hero_picaro_f_run_1', u: '/assets/crawler/heroes/elf_f_run_anim_f1.png' },

      // Enemigos: Esqueleto
      { k: 'skelet_idle_0', u: '/assets/crawler/enemies/skelet_idle_anim_f0.png' },
      { k: 'skelet_idle_1', u: '/assets/crawler/enemies/skelet_idle_anim_f1.png' },
      { k: 'skelet_idle_2', u: '/assets/crawler/enemies/skelet_idle_anim_f2.png' },
      { k: 'skelet_idle_3', u: '/assets/crawler/enemies/skelet_idle_anim_f3.png' },
      { k: 'skelet_run_0', u: '/assets/crawler/enemies/skelet_run_anim_f0.png' },
      { k: 'skelet_run_1', u: '/assets/crawler/enemies/skelet_run_anim_f1.png' },
      { k: 'skelet_run_2', u: '/assets/crawler/enemies/skelet_run_anim_f2.png' },
      { k: 'skelet_run_3', u: '/assets/crawler/enemies/skelet_run_anim_f3.png' },

      // Enemigos: Hongos caminantes (Piso 2)
      { k: 'mushroom_idle_0', u: '/assets/crawler/enemies/mushrooms/NormalMushroom_Idle_1.png' },
      { k: 'mushroom_idle_1', u: '/assets/crawler/enemies/mushrooms/NormalMushroom_Idle_2.png' },
      { k: 'mushroom_idle_2', u: '/assets/crawler/enemies/mushrooms/NormalMushroom_Idle_3.png' },
      { k: 'mushroom_idle_3', u: '/assets/crawler/enemies/mushrooms/NormalMushroom_Idle_4.png' },
      { k: 'mushroom_run_0', u: '/assets/crawler/enemies/mushrooms/NormalMushroom_Walk_1.png' },
      { k: 'mushroom_run_1', u: '/assets/crawler/enemies/mushrooms/NormalMushroom_Walk_2.png' },
      { k: 'mushroom_run_2', u: '/assets/crawler/enemies/mushrooms/NormalMushroom_Walk_3.png' },
      { k: 'mushroom_run_3', u: '/assets/crawler/enemies/mushrooms/NormalMushroom_Walk_4.png' },

      // Jefes / Mini-jefes
      { k: 'chort_idle_0', u: '/assets/crawler/enemies/chort_idle_anim_f0.png' },
      { k: 'chort_idle_1', u: '/assets/crawler/enemies/chort_idle_anim_f1.png' },
      { k: 'big_zombie_idle_0', u: '/assets/crawler/enemies/big_zombie_idle_anim_f0.png' },
      { k: 'big_zombie_idle_1', u: '/assets/crawler/enemies/big_zombie_idle_anim_f1.png' },
      { k: 'necromancer_0', u: '/assets/crawler/enemies/necromancer_anim_f0.png' },
      { k: 'necromancer_1', u: '/assets/crawler/enemies/necromancer_anim_f1.png' },
      { k: 'necromancer_2', u: '/assets/crawler/enemies/necromancer_anim_f2.png' },
      { k: 'necromancer_3', u: '/assets/crawler/enemies/necromancer_anim_f3.png' },

      // Baldosas y Elementos del Entorno
      { k: 'tile_floor', u: '/assets/crawler/tiles/floor_1.png' },
      { k: 'tile_floor_alt', u: '/assets/crawler/tiles/floor_2.png' },
      { k: 'tile_stairs', u: '/assets/crawler/tiles/floor_stairs.png' },
      { k: 'tile_wall', u: '/assets/crawler/tiles/wall_mid.png' },
      { k: 'chest_closed', u: '/assets/crawler/tiles/chest_empty_open_anim_f0.png' },
      { k: 'chest_open', u: '/assets/crawler/tiles/chest_full_open_anim_f2.png' },

      // Armas e Íconos
      { k: 'weapon_regular_sword', u: '/assets/crawler/items/weapon_regular_sword.png' },
      { k: 'weapon_red_magic_staff', u: '/assets/crawler/items/weapon_red_magic_staff.png' },
      { k: 'weapon_knife', u: '/assets/crawler/items/weapon_knife.png' },
      { k: 'weapon_hammer', u: '/assets/crawler/items/weapon_hammer.png' },
      { k: 'item_sword', u: '/assets/crawler/items/weapon_regular_sword.png' },
      { k: 'item_staff', u: '/assets/crawler/items/weapon_red_magic_staff.png' },
      { k: 'item_knife', u: '/assets/crawler/items/weapon_knife.png' },
      { k: 'flask_red', u: '/assets/crawler/items/flask_red.png' },
      { k: 'flask_blue', u: '/assets/crawler/items/flask_blue.png' },
      { k: 'coin', u: '/assets/crawler/items/coin_anim_f0.png' },

      // Retratos HD de la Asociación de Rol La Pampa
      { k: 'portrait_npc_diny', u: '/assets/crawler/portraits/npc_diny_portrait.png' },
      { k: 'portrait_npc_delo', u: '/assets/crawler/portraits/npc_delo_portrait.png' },
      { k: 'portrait_npc_angel', u: '/assets/crawler/portraits/npc_angel_portrait.png' },
      { k: 'portrait_npc_chiquito', u: '/assets/crawler/portraits/npc_chiquito_portrait.png' },
      { k: 'portrait_npc_ayrton', u: '/assets/crawler/portraits/npc_ayrton_portrait.png' },
      { k: 'portrait_npc_mati', u: '/assets/crawler/portraits/npc_mati_portrait.png' },
      { k: 'portrait_npc_keith', u: '/assets/crawler/portraits/npc_keith_portrait.png' },
      { k: 'portrait_npc_javi', u: '/assets/crawler/portraits/npc_javi_portrait.png' },
      { k: 'portrait_npc_strerbern', u: '/assets/crawler/portraits/npc_strerbern_portrait.png' },

      // Sprites de los Miembros de la Asociación de Rol La Pampa
      { k: 'npc_diny_0', u: '/assets/crawler/npcs/npc_diny_idle_anim_f0.png' },
      { k: 'npc_diny_1', u: '/assets/crawler/npcs/npc_diny_idle_anim_f1.png' },
      { k: 'npc_diny_2', u: '/assets/crawler/npcs/npc_diny_idle_anim_f2.png' },
      { k: 'npc_diny_3', u: '/assets/crawler/npcs/npc_diny_idle_anim_f3.png' },

      { k: 'npc_delo_0', u: '/assets/crawler/npcs/npc_delo_idle_anim_f0.png' },
      { k: 'npc_delo_1', u: '/assets/crawler/npcs/npc_delo_idle_anim_f1.png' },
      { k: 'npc_delo_2', u: '/assets/crawler/npcs/npc_delo_idle_anim_f2.png' },
      { k: 'npc_delo_3', u: '/assets/crawler/npcs/npc_delo_idle_anim_f3.png' },
      { k: 'npc_delo_4', u: '/assets/crawler/npcs/npc_delo_idle_anim_f4.png' },

      { k: 'npc_angel_0', u: '/assets/crawler/npcs/npc_angel_idle_anim_f0.png' },
      { k: 'npc_angel_1', u: '/assets/crawler/npcs/npc_angel_idle_anim_f1.png' },
      { k: 'npc_angel_2', u: '/assets/crawler/npcs/npc_angel_idle_anim_f2.png' },
      { k: 'npc_angel_3', u: '/assets/crawler/npcs/npc_angel_idle_anim_f3.png' },
      { k: 'npc_angel_4', u: '/assets/crawler/npcs/npc_angel_idle_anim_f4.png' },

      { k: 'npc_chiquito_0', u: '/assets/crawler/npcs/npc_chiquito_idle_anim_f0.png' },
      { k: 'npc_chiquito_1', u: '/assets/crawler/npcs/npc_chiquito_idle_anim_f1.png' },
      { k: 'npc_chiquito_2', u: '/assets/crawler/npcs/npc_chiquito_idle_anim_f2.png' },
      { k: 'npc_chiquito_3', u: '/assets/crawler/npcs/npc_chiquito_idle_anim_f3.png' },
      { k: 'npc_chiquito_4', u: '/assets/crawler/npcs/npc_chiquito_idle_anim_f4.png' },

      { k: 'npc_ayrton_0', u: '/assets/crawler/npcs/npc_ayrton_idle_anim_f0.png' },
      { k: 'npc_ayrton_1', u: '/assets/crawler/npcs/npc_ayrton_idle_anim_f1.png' },
      { k: 'npc_ayrton_2', u: '/assets/crawler/npcs/npc_ayrton_idle_anim_f2.png' },
      { k: 'npc_ayrton_3', u: '/assets/crawler/npcs/npc_ayrton_idle_anim_f3.png' },
      { k: 'npc_ayrton_4', u: '/assets/crawler/npcs/npc_ayrton_idle_anim_f4.png' },

      { k: 'npc_mati_0', u: '/assets/crawler/npcs/npc_mati_idle_anim_f0.png' },
      { k: 'npc_mati_1', u: '/assets/crawler/npcs/npc_mati_idle_anim_f1.png' },
      { k: 'npc_mati_2', u: '/assets/crawler/npcs/npc_mati_idle_anim_f2.png' },
      { k: 'npc_mati_3', u: '/assets/crawler/npcs/npc_mati_idle_anim_f3.png' },
      { k: 'npc_mati_4', u: '/assets/crawler/npcs/npc_mati_idle_anim_f4.png' },

      { k: 'npc_keith_0', u: '/assets/crawler/npcs/npc_keith_idle_anim_f0.png' },
      { k: 'npc_keith_1', u: '/assets/crawler/npcs/npc_keith_idle_anim_f1.png' },
      { k: 'npc_keith_2', u: '/assets/crawler/npcs/npc_keith_idle_anim_f2.png' },
      { k: 'npc_keith_3', u: '/assets/crawler/npcs/npc_keith_idle_anim_f3.png' },
      { k: 'npc_keith_4', u: '/assets/crawler/npcs/npc_keith_idle_anim_f4.png' },

      { k: 'npc_javi_0', u: '/assets/crawler/npcs/npc_javi_idle_anim_f0.png' },
      { k: 'npc_javi_1', u: '/assets/crawler/npcs/npc_javi_idle_anim_f1.png' },
      { k: 'npc_javi_2', u: '/assets/crawler/npcs/npc_javi_idle_anim_f2.png' },
      { k: 'npc_javi_3', u: '/assets/crawler/npcs/npc_javi_idle_anim_f3.png' },
      { k: 'npc_javi_4', u: '/assets/crawler/npcs/npc_javi_idle_anim_f4.png' },

      { k: 'npc_strerbern_0', u: '/assets/crawler/npcs/npc_strerbern_idle_anim_f0.png' },
      { k: 'npc_strerbern_1', u: '/assets/crawler/npcs/npc_strerbern_idle_anim_f1.png' },
      { k: 'npc_strerbern_2', u: '/assets/crawler/npcs/npc_strerbern_idle_anim_f2.png' },
      { k: 'npc_strerbern_3', u: '/assets/crawler/npcs/npc_strerbern_idle_anim_f3.png' },
      { k: 'npc_strerbern_4', u: '/assets/crawler/npcs/npc_strerbern_idle_anim_f4.png' }
    ];

    this.total = lista.length;
    this.cargados = 0;

    const promesas = lista.map(item => 
      this.cargarImagen(item.k, item.u).then(() => {
        if (onProgreso) {
          onProgreso(Math.round((this.cargados / this.total) * 100));
        }
      })
    );

    await Promise.all(promesas);
    this.listo = true;
    return true;
  }

  get(clave) {
    return this.images[clave] || null;
  }
}

export const assets = new AssetManager();
