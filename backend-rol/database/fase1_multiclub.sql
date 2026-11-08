-- ===================================================================================
-- 🏛️ SCRIPT DE MIGRACIÓN: MULTI-COMUNIDAD Y ROL SUPERADMIN (FASE 1 Y 2)
-- ===================================================================================

-- 1. Crear tabla de 'clubes' (Comunidades / Agrupaciones) con identidad propia
CREATE TABLE IF NOT EXISTS clubes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  ciudad VARCHAR(100) NOT NULL DEFAULT 'Santa Rosa',
  provincia VARCHAR(100) NOT NULL DEFAULT 'La Pampa',
  logo VARCHAR(255) NULL,
  banner VARCHAR(255) NULL,
  foto_grupal VARCHAR(255) NULL,
  historia TEXT NULL,
  whatsapp_url VARCHAR(255) NULL,
  instagram_url VARCHAR(255) NULL,
  organizadores LONGTEXT NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Registrar el Club #1 fundador (Asociación de Rol La Pampa) con su identidad
INSERT INTO clubes (id, nombre, slug, descripcion, ciudad, provincia, foto_grupal, historia, whatsapp_url, activo)
VALUES (
  1, 
  'Asociación de Rol La Pampa', 
  'la-pampa', 
  'Comunidad y gremio principal de rol y juegos de mesa en La Pampa.', 
  'Santa Rosa', 
  'La Pampa',
  '/assets/FotoGrupal.png',
  'Somos una comunidad de apasionados por el rol y los juegos de mesa. Organizamos jornadas periódicas para compartir mundos, dados y grandes historias.',
  'https://chat.whatsapp.com/FIiKyN8QkZd0DEXs8pRZzC',
  1
)
ON DUPLICATE KEY UPDATE id = id;

-- 3. Agregar columna 'club_id' a la tabla 'eventos' (por defecto 1 = La Pampa)
ALTER TABLE eventos ADD COLUMN club_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE eventos ADD INDEX idx_eventos_club (club_id);

-- 4. Agregar columna 'club_id' a la tabla 'usuarios' (por defecto 1 = La Pampa)
ALTER TABLE usuarios ADD COLUMN club_id INT NOT NULL DEFAULT 1 AFTER id;
ALTER TABLE usuarios ADD INDEX idx_usuarios_club (club_id);

-- 5. Actualizar el ENUM de roles para permitir 'superadmin'
ALTER TABLE usuarios MODIFY COLUMN rol ENUM('jugador', 'dm', 'admin', 'superadmin') DEFAULT 'jugador';

-- 6. Asignar el rol de 'superadmin' a Víctor (Sterbern)
UPDATE usuarios SET rol = 'superadmin' WHERE email = 'rockzila2011@gmail.com' OR nombre = 'Sterbern';

-- 7. (Verificación)
SELECT id, nombre, email, rol, club_id FROM usuarios WHERE rol = 'superadmin';
SELECT * FROM clubes;
