import { useState, useEffect } from 'react';

function Partida(props) {
  const cantJugadores = props.jugadoresIniciales ?? props.jugadores_anotados ?? 0;
  const yaEstaAnotado = Boolean(props.anotadoInicialmente || props.estoy_anotado || false);

  const [jugadoresAnotados, setJugadoresAnotados] = useState(cantJugadores);
  const [anotado, setAnotado] = useState(yaEstaAnotado);
  const [verJugadores, setVerJugadores] = useState(false);
  const [listaJugadores, setListaJugadores] = useState([]);
  
  // NUEVO: Estado para el Modal de Pantalla Completa
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    setJugadoresAnotados(cantJugadores);
    setAnotado(yaEstaAnotado);
  }, [cantJugadores, yaEstaAnotado]);

  const soyElMaster = props.esMiMesa; 
  const soyAdmin = props.esAdmin;

  const alternarInscripcion = async (e) => {
    e.stopPropagation(); // Evita que al hacer clic en el botón se abra el modal
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
        alert(`Aviso del Gremio: ${mensaje}`);
      }
    } catch (err) { console.error(err); }
  };

  const obtenerListaJugadores = (e) => {
    e.stopPropagation();
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
    <>
      {/* CARD DEL CARRUSEL (Tamaño Fijo) */}
      <div 
        onClick={() => setModalAbierto(true)}
        className={`relative p-6 rounded-2xl border-2 transition-all duration-300 shadow-xl flex flex-col h-[420px] cursor-pointer group ${
          soyElMaster 
          ? 'border-amber-500 bg-amber-500/5 shadow-amber-500/10' 
          : 'border-zinc-800 bg-zinc-900/40 hover:border-emerald-500/30'
        }`}
      >
        {soyElMaster && (
          <span className="absolute -top-3 right-6 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-10">
            Tu Mesa
          </span>
        )}

        <div className="flex justify-between items-start mb-4">
          <div className="max-w-[70%]">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">
              {props.sistema}
            </span>
            <h3 className="text-xl font-black text-white mt-2 italic uppercase tracking-tighter leading-tight line-clamp-2">
              {props.titulo}
            </h3>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-mono font-black leading-none ${jugadoresAnotados >= props.cupo ? 'text-red-500' : 'text-emerald-500'}`}>
              {jugadoresAnotados}/{props.cupo}
            </p>
          </div>
        </div>

        {/* Descripción con límite de líneas para mantener el tamaño */}
        <p className="text-zinc-400 text-xs leading-relaxed mb-4 border-l-2 border-zinc-800 pl-4 py-1 italic line-clamp-4 flex-grow">
          {props.description || props.descripcion}
        </p>

        <div className="space-y-2 mb-6">
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Director</p>
            <p className="text-xs text-zinc-200 font-bold truncate">🛡️ {props.dmNombre || 'Desconocido'}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          {!soyElMaster && !props.eventoEsPasado && (
            <button 
              onClick={alternarInscripcion}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                anotado 
                ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'
              }`}
            >
              {anotado ? 'Abandonar' : 'Unirse'}
            </button>
          )}
          {(soyElMaster || soyAdmin) && (
            <button onClick={obtenerListaJugadores} className="px-4 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 border border-white/10">
              👥
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE INFORMACIÓN COMPLETA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-12 relative shadow-2xl">
            <button 
              onClick={() => setModalAbierto(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white text-2xl"
            >
              ✕
            </button>

            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {props.sistema}
            </span>
            
            <h2 className="text-4xl font-black text-white mt-6 mb-4 uppercase italic tracking-tighter leading-none">
              {props.titulo}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Director de Juego</p>
                <p className="text-lg text-zinc-200 font-black">🛡️ {props.dmNombre}</p>
              </div>
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Disponibilidad</p>
                <p className={`text-lg font-black ${jugadoresAnotados >= props.cupo ? 'text-red-500' : 'text-emerald-500'}`}>
                  {jugadoresAnotados} de {props.cupo} Aventureros
                </p>
              </div>
            </div>

            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Relato de la Misión</h4>
            <p className="text-zinc-300 text-lg leading-relaxed mb-8 italic whitespace-pre-line">
              {props.description || props.descripcion}
            </p>

            {props.requisitos && (
              <div className="mb-8 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Requisitos del Gremio</h4>
                <p className="text-zinc-400 text-sm">📜 {props.requisitos}</p>
              </div>
            )}

            <button 
              onClick={() => setModalAbierto(false)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all"
            >
              Cerrar Pergamino
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Partida;