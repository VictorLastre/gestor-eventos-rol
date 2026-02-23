import { useState, useEffect } from 'react';

function Partida(props) {
  // Sincronización de estados con las propiedades que vienen del servidor
  const [jugadoresAnotados, setJugadoresAnotados] = useState(props.jugadoresIniciales || 0);
  const [anotado, setAnotado] = useState(props.anotadoInicialmente || false);
  const [verJugadores, setVerJugadores] = useState(false);
  const [listaJugadores, setListaJugadores] = useState([]);

  // Este Efecto es vital: actualiza el contador si los datos del padre cambian
  useEffect(() => {
    setJugadoresAnotados(props.jugadoresIniciales);
    setAnotado(props.anotadoInicialmente);
  }, [props.jugadoresIniciales, props.anotadoInicialmente]);

  const usuarioActivo = JSON.parse(localStorage.getItem('usuario'));
  const soyElMaster = props.esMiMesa; 
  const soyAdmin = props.esAdmin;

  // Función para disolver la mesa
  const manejarBorradoMesa = async () => {
    if (!window.confirm("⚠️ ¿Estás seguro de que quieres disolver esta mesa de la Asociación de Rol La Pampa?")) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://gestor-eventos-rol.onrender.com/api/partidas/${props.id}`, {
        method: 'DELETE',
        headers: { 'authorization': token }
      });

      if (res.ok) {
        window.location.reload(); 
      } else {
        const error = await res.text();
        alert(`❌ Error: ${error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Función para anotarse o bajarse
  const alternarInscripcion = async () => {
    const token = localStorage.getItem('token');
    const metodo = anotado ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`https://gestor-eventos-rol.onrender.com/api/partidas/${props.id}/inscripciones`, {
        method: metodo,
        headers: { 'authorization': token }
      });

      if (res.ok) {
        setAnotado(!anotado);
        setJugadoresAnotados(anotado ? jugadoresAnotados - 1 : jugadoresAnotados + 1);
      } else {
        const mensaje = await res.text();
        alert(mensaje);
      }
    } catch (err) {
      console.error("Error en la inscripción:", err);
    }
  };

  // Obtener lista de nombres de jugadores (Solo DM/Admin)
  const obtenerListaJugadores = () => {
    const token = localStorage.getItem('token');
    fetch(`https://gestor-eventos-rol.onrender.com/api/partidas/${props.id}/jugadores`, {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(datos => {
        setListaJugadores(datos);
        setVerJugadores(!verJugadores);
      })
      .catch(err => console.error(err));
  };

  return (
    <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 shadow-xl mb-6 ${
      soyElMaster 
      ? 'border-amber-500 bg-amber-500/5 shadow-amber-500/10' 
      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
    }`}>
      
      {/* Etiqueta distintiva de 'Tu Mesa' */}
      {soyElMaster && (
        <span className="absolute -top-3 right-6 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
          Tu Mesa
        </span>
      )}

      {/* Encabezado: Título y Contador */}
      <div className="flex justify-between items-start mb-4">
        <div className="max-w-[70%]">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">
            {props.sistema}
          </span>
          <h3 className="text-2xl font-black text-white mt-2 italic uppercase tracking-tighter leading-tight">
            {props.titulo}
          </h3>
        </div>
        
        <div className="text-right">
          <p className={`text-3xl font-mono font-black leading-none ${jugadoresAnotados >= props.cupo ? 'text-red-500' : 'text-emerald-500'}`}>
            {jugadoresAnotados}/{props.cupo}
          </p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Aventureros</p>
        </div>
      </div>

      {/* Descripción de la aventura */}
      <p className="text-zinc-400 text-sm leading-relaxed mb-6 border-l-2 border-zinc-800 pl-4 py-1 italic">
        {props.descripcion}
      </p>

      {/* Información técnica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="bg-black/30 p-3 rounded-xl border border-white/5">
          <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1 tracking-tighter">Director de Juego</p>
          <p className="text-sm text-zinc-200 font-bold">🛡️ {props.dmNombre}</p>
        </div>
        <div className="bg-black/30 p-3 rounded-xl border border-white/5">
          <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1 tracking-tighter">Requisitos del Gremio</p>
          <p className="text-sm text-zinc-200 font-bold truncate">📜 {props.requisitos || 'Ninguno'}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        {!soyElMaster && !props.eventoEsPasado && (
          <button 
            onClick={alternarInscripcion}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 ${
              anotado 
              ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white' 
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'
            }`}
          >
            {anotado ? 'Abandonar Misión' : 'Unirse a la partida'}
          </button>
        )}

        {(soyElMaster || soyAdmin) && (
          <>
            <button 
              onClick={obtenerListaJugadores}
              className="px-4 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 border border-white/10 transition-colors"
              title="Ver Jugadores"
            >
              👥
            </button>
            <button 
              onClick={manejarBorradoMesa}
              className="px-4 py-3 bg-zinc-800 text-red-500 rounded-xl hover:bg-red-600 hover:text-white border border-red-500/20 transition-all"
              title="Borrar Mesa"
            >
              🗑️
            </button>
          </>
        )}
      </div>

      {/* Lista Desplegable de Jugadores */}
      {verJugadores && (
        <div className="mt-4 p-4 bg-black/40 rounded-xl border border-zinc-800 animate-fadeIn">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest border-b border-zinc-800 pb-2">
            Registro de Inscritos
          </h4>
          {listaJugadores.length === 0 ? (
            <p className="text-xs text-zinc-600 italic text-center py-2">Nadie se ha anotado todavía...</p>
          ) : (
            <ul className="space-y-2">
              {listaJugadores.map(j => (
                <li key={j.id} className="text-xs flex justify-between items-center bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                  <span className="font-bold text-zinc-200">✨ {j.nombre}</span>
                  <span className="text-zinc-500 text-[10px]">{j.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Partida;