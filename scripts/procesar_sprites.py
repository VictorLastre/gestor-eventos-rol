import os
import sys
import glob

# Forzar salida en UTF-8 para consola de Windows
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from PIL import Image
import numpy as np

# Rutas del proyecto
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SPRITES_DIR = os.path.join(BASE_DIR, 'Sprites')

FRONTEND_PUBLIC = os.path.join(BASE_DIR, 'frontend-rol', 'public', 'assets', 'crawler')
BACKEND_PUBLIC = os.path.join(BASE_DIR, 'backend-rol', 'public', 'assets', 'crawler')

PORTRAITS_DIR_F = os.path.join(FRONTEND_PUBLIC, 'portraits')
PORTRAITS_DIR_B = os.path.join(BACKEND_PUBLIC, 'portraits')

NPCS_DIR_F = os.path.join(FRONTEND_PUBLIC, 'npcs')
NPCS_DIR_B = os.path.join(BACKEND_PUBLIC, 'npcs')

for d in [PORTRAITS_DIR_F, PORTRAITS_DIR_B, NPCS_DIR_F, NPCS_DIR_B]:
    os.makedirs(d, exist_ok=True)

# Mapeo de miembros a prefijos de archivos y configuración
CONFIG_MIEMBROS = {
    'diny': {
        'archivo_posible': ['Diny..jpg', 'Diny.jpg', 'diny.jpg'],
        'prefijo': 'npc_diny',
        'idle_row': (80, 520),
        'idle_frames': 4,
        'idle_cols': (950, 2380),
        'coffee_row': (1410, 1760),
        'coffee_frames': 5,
        'coffee_cols': (680, 2380)
    },
    'delo': {
        'archivo_posible': ['Delo.jpg', 'delo.jpg'],
        'prefijo': 'npc_delo',
        'idle_row': (100, 480),
        'idle_frames': 5,
        'idle_cols': (900, 2300),
        'eating_row': (1050, 1390),
        'eating_frames': 6,
        'eating_cols': (650, 2350)
    },
    'guille': {
        'archivo_posible': ['Guille.jpg', 'guille.jpg'],
        'prefijo': 'npc_chiquito',
        'idle_row': (100, 480),
        'idle_frames': 5,
        'idle_cols': (900, 2350),
        'walk_row': (530, 920),
        'walk_frames': 5,
        'walk_cols': (650, 2350)
    },
    'ayrton': {
        'archivo_posible': ['Ayrton.jpg', 'ayrton.jpg'],
        'prefijo': 'npc_ayrton',
        'idle_row': (110, 480),
        'idle_frames': 5,
        'idle_cols': (950, 2350),
        'walk_row': (500, 860),
        'walk_frames': 5,
        'walk_cols': (950, 2350)
    },
    'martin': {
        'archivo_posible': ['Martin.jpg', 'martin.jpg'],
        'prefijo': 'npc_angel',
        'idle_row': (110, 390),
        'idle_frames': 5,
        'idle_cols': (900, 2300),
        'walk_row': (420, 710),
        'walk_frames': 5,
        'walk_cols': (900, 2300)
    },
    'mati': {
        'archivo_posible': ['Mati.jpg', 'mati.jpg'],
        'prefijo': 'npc_mati',
        'idle_row': (90, 460),
        'idle_frames': 5,
        'idle_cols': (920, 2350),
        'attack_row': (490, 820),
        'attack_frames': 5,
        'attack_cols': (920, 2350)
    },
    'keith': {
        'archivo_posible': ['Keith.jpg', 'keith.jpg'],
        'prefijo': 'npc_keith',
        'idle_row': (100, 480),
        'idle_frames': 5,
        'idle_cols': (900, 2300),
        'walk_row': (500, 870),
        'walk_frames': 6,
        'walk_cols': (630, 2350)
    },
    'javi': {
        'archivo_posible': ['Javi.jpg', 'javi.jpg'],
        'prefijo': 'npc_javi',
        'idle_row': (100, 480),
        'idle_frames': 5,
        'idle_cols': (900, 2350),
        'walk_row': (530, 930),
        'walk_frames': 5,
        'walk_cols': (880, 2350)
    },
    'dm': {
        'archivo_posible': ['DM.jpg', 'dm.jpg'],
        'prefijo': 'npc_strerbern',
        'idle_row': (110, 490),
        'idle_frames': 5,
        'idle_cols': (820, 2300),
        'dice_row': (1360, 1760),
        'dice_frames': 4,
        'dice_cols': (560, 2100)
    }
}

def remover_fondo_gris(img_rgba, color_bg=(57, 64, 72), umbral_exacto=32, umbral_fade=48):
    """Convierte el fondo gris neutro de la imagen en transparente con suavizado alfa."""
    arr = np.array(img_rgba, dtype=np.float32)
    rgb = arr[:, :, :3]
    
    # Distancia euclídea al color de fondo
    bg = np.array(color_bg, dtype=np.float32)
    dist = np.sqrt(np.sum((rgb - bg) ** 2, axis=2))
    
    alpha = np.ones(dist.shape, dtype=np.float32) * 255.0
    
    # Menor que umbral exacto -> transparente total
    alpha[dist <= umbral_exacto] = 0.0
    
    # Entre exacto y fade -> transición suave para evitar bordes dentados
    mask_fade = (dist > umbral_exacto) & (dist < umbral_fade)
    factor = (dist[mask_fade] - umbral_exacto) / (umbral_fade - umbral_exacto)
    alpha[mask_fade] = factor * 255.0
    
    arr[:, :, 3] = alpha
    return Image.fromarray(np.uint8(arr), 'RGBA')

def encontrar_archivo(nombres_posibles):
    for n in nombres_posibles:
        p = os.path.join(SPRITES_DIR, n)
        if os.path.exists(p):
            return p
    return None

def procesar_miembro(clave, cfg):
    ruta_origen = encontrar_archivo(cfg['archivo_posible'])
    if not ruta_origen:
        print(f"⚠️ No se encontró imagen para {clave} (buscado: {cfg['archivo_posible']})")
        return

    print(f"🎨 Procesando {clave.upper()} desde {os.path.basename(ruta_origen)}...")
    im = Image.open(ruta_origen)

    # 1. Extraer Retrato HD (Portraits)
    # Coordenadas estándar del marco superior izquierdo: (54, 64, 532, 542)
    portrait_box = (54, 64, 532, 542)
    portrait = im.crop(portrait_box)
    
    # Guardar Portrait en Frontend y Backend
    p_name = f"{cfg['prefijo']}_portrait.png"
    p_path_f = os.path.join(PORTRAITS_DIR_F, p_name)
    p_path_b = os.path.join(PORTRAITS_DIR_B, p_name)
    portrait.save(p_path_f, 'PNG')
    portrait.save(p_path_b, 'PNG')
    print(f"  ✅ Retrato guardado: {p_name}")

    # 2. Extraer fotogramas de animación IDLE
    y1, y2 = cfg['idle_row']
    x1, x2 = cfg['idle_cols']
    num_frames = cfg['idle_frames']
    step_w = (x2 - x1) / num_frames

    for f_idx in range(num_frames):
        fx1 = int(x1 + f_idx * step_w)
        fx2 = int(x1 + (f_idx + 1) * step_w)
        frame_crop = im.crop((fx1, y1, fx2, y2)).convert('RGBA')
        
        # Quitar fondo gris
        frame_transp = remover_fondo_gris(frame_crop)
        
        # Guardar como frame f0, f1, f2, etc.
        frame_name = f"{cfg['prefijo']}_idle_anim_f{f_idx}.png"
        f_path_f = os.path.join(NPCS_DIR_F, frame_name)
        f_path_b = os.path.join(NPCS_DIR_B, frame_name)
        frame_transp.save(f_path_f, 'PNG')
        frame_transp.save(f_path_b, 'PNG')
    print(f"  ✅ {num_frames} frames de IDLE transparentes guardados para {cfg['prefijo']}")

def main():
    print("==================================================")
    print("🚀 PIPELINE AUTOMÁTICO DE SPRITES - ASOCIACIÓN ROL")
    print("==================================================")
    print(f"Buscando sprites en: {SPRITES_DIR}\n")

    for clave, cfg in CONFIG_MIEMBROS.items():
        procesar_miembro(clave, cfg)

    print("\n✨ ¡Proceso completado exitosamente! Todos los retratos y sprites han sido actualizados.")

if __name__ == '__main__':
    main()
