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

  const dimensionEstilo = {
    width: typeof tamaño === 'number' ? `${tamaño}px` : tamaño,
    height: typeof tamaño === 'number' ? `${tamaño}px` : tamaño
  };

  // 1. Si el usuario eligió un Retrato Oficial de la Asociación (PNJ / Mesa Directiva)
  if (avatar && avatar.startsWith('portrait:')) {
    const prefijo = avatar.replace('portrait:', '');
    const rutaRetrato = `/assets/crawler/portraits/${prefijo}_portrait.png`;

    return (
      <div
        className="rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden border-2 border-amber-500/50 shadow-md shrink-0 select-none group"
        style={dimensionEstilo}
        title={`${nombre} (Retrato de la Asociación)`}
      >
        <img
          src={rutaRetrato}
          alt={nombre}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // 2. Si el usuario eligió un avatar Pixel Art de la Cripta
  if (avatar && avatar.startsWith('crawler:')) {
    const partes = avatar.replace('crawler:', '').split('_');
    const clase = partes[0] || 'guerrero';
    const genero = partes[1] || 'm';

    const spriteClase = clase === 'guerrero' ? 'knight' : clase === 'mago' ? 'wizzard' : 'elf';
    const rutaSprite = `/assets/crawler/heroes/${spriteClase}_${genero}_idle_anim_f0.png`;

    return (
      <div
        className="rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden border border-emerald-500/50 shadow-md shrink-0 select-none"
        style={dimensionEstilo}
        title={`${nombre} (${clase})`}
      >
        <img
          src={rutaSprite}
          alt={nombre}
          className="w-full h-full object-contain scale-125"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // 3. Si el avatar es una URL directa (externa o de assets)
  if (avatar && (avatar.startsWith('http') || avatar.startsWith('/assets/'))) {
    return (
      <div
        className="rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-700 shadow-md shrink-0 select-none"
        style={dimensionEstilo}
        title={nombre}
      >
        <img
          src={avatar}
          alt={nombre}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // 4. Retrato Dinámico de Aventurero (Boring-Avatars)
  return (
    <div style={dimensionEstilo} className="shrink-0 flex items-center justify-center overflow-hidden rounded-full">
      <Avatar
        size="100%"
        name={nombre || "Aventurero Desconocido"}
        variant={variante}
        colors={paletaGremio}
      />
    </div>
  );
}

export default AvatarUsuario;
