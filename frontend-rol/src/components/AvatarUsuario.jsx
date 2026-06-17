import Avatar from "boring-avatars";

function AvatarUsuario({ nombre, tamaño = 40, variante = "beam" }) {
  // Paleta de colores basada en los tonos mágicos de tu interfaz
  const paletaGremio = [
    "#10b981", // Esmeralda (Éxito/Naturaleza)
    "#6366f1", // Índigo (Magia/Arcano)
    "#f59e0b", // Ámbar (Advertencia/Fuego)
    "#ef4444", // Rojo (Peligro/Sangre)
    "#27272a"  // Zinc 800 (Oscuridad/Fondo)
  ];

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