import Avatar from "boring-avatars";

function AvatarUsuario({ nombre, avatar, tamaño = 40, variante = "beam" }) {
  // Paleta de colores basada en los tonos mágicos de tu interfaz
  const paletaGremio = [
    "#10b981", // Esmeralda (Éxito/Naturaleza)
    "#6366f1", // Índigo (Magia/Arcano)
    "#f59e0b", // Ámbar (Advertencia/Fuego)
    "#ef4444", // Rojo (Peligro/Sangre)
    "#27272a"  // Zinc 800 (Oscuridad/Fondo)
  ];

  // Si el usuario eligió un avatar de la Cripta del Nigromante
  if (avatar && avatar.startsWith('crawler:')) {
    const partes = avatar.replace('crawler:', '').split('_');
    const clase = partes[0] || 'guerrero';
    const genero = partes[1] || 'm';

    const spriteClase = clase === 'guerrero' ? 'knight' : clase === 'mago' ? 'wizzard' : 'elf';
    const rutaSprite = `/assets/crawler/heroes/${spriteClase}_${genero}_idle_anim_f0.png`;

    return (
      <div
        className="rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden border border-emerald-500/40 shrink-0"
        style={{ width: `${tamaño}px`, height: `${tamaño}px` }}
        title={`${nombre} (${clase})`}
      >
        <img
          src={rutaSprite}
          alt={nombre}
          className="w-full h-full object-contain scale-125"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => {
            // Fallback en caso de que no cargue
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <Avatar
      size={tamaño}
      name={nombre || "Aventurero Desconocido"} // El nombre genera el patrón único
      variant={variante} // Opciones: marble, beam, pixel, sunset, ring, bauhaus
      colors={paletaGremio}
    />
  );
}

export default AvatarUsuario;
