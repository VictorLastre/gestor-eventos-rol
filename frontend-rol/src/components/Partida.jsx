import { useState, useEffect } from 'react';

function Partida(props) {
  const cantJugadores = props.jugadoresIniciales ?? props.jugadores_anotados ?? 0;
  const yaEstaAnotado = Boolean(props.anotadoInicialmente || props.estoy_anotado || false);

  const [jugadoresAnotados, setJugadoresAnotados] = useState(cantJugadores);
  const [anotado, setAnotado] = useState(yaEstaAnotado);
  const [listaJugadores, setListaJugadores] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargandoJugadores, setCargandoJugadores] = useState(false);

  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = 'hidden';
      cargarListaJugadores();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [modalAbierto]);

  useEffect(() => {
    setJugadoresAnotados(cantJugadores);
    setAnotado(yaEstaAnotado);
  }, [cantJugadores, yaEstaAnotado]);

  const cargarListaJugadores = () => {
    const token = localStorage.getItem('token');
    setCargandoJugadores(true);
    fetch(`https://gestor-eventos-rol.onrender.com/api/partidas/${props.id}/jugadores`, {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(datos => {
        setListaJugadores(datos);
        setCargandoJugadores(false);
      })
      .catch(err => {
        console.error(err);
        setCargandoJugadores(false);
      });
  };

  const soyElMaster = props.esMiMesa; 
  const soyAdmin = props.esAdmin;

  const alternarInscripcion = async (e) => {
    e.stopPropagation(); 
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
        cargarListaJugadores();
      } else {
        const mensaje = await res.text();
        alert(`Aviso del Gremio: ${mensaje}`);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <>
      {/* CARD DEL CARRUSEL */}
      <div 
        onClick={() => setModalAbierto(true)}
        className={`relative p-6 rounded-3xl border-2 transition-all duration-300 shadow-xl flex flex-col h-[420px] cursor-pointer group ${
          soyElMaster 
          ? 'border-amber-500/50 bg-amber-500/5 shadow-amber-500/10' 
          : 'border-zinc-800 bg-zinc-900/40 hover:border-emerald-500/30'
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="max-w-[75%] space-y-2">
            {/* CONTENEDOR DE BADGES (SISTEMA Y ROL) */}
            <div className="flex flex-wrap gap-2">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {props.sistema}
              </span>
              
              {/* ETIQUETA "TU MESA" REUBICADA DENTRO DEL FLUJO */}
              {soyElMaster && (
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ✨ Tu Mesa
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-white mt-1 italic uppercase tracking-tighter leading-tight line-clamp-2">
              {props.titulo}
            </h3>
          </div>
          
          <div className="text-right">
            <p className={`text-2xl font-mono font-black leading-none ${jugadoresAnotados >= props.cupo ? 'text-red-500' : 'text-emerald-500'}`}>
              {jugadoresAnotados}/{props.cupo}
            </p>
          </div>
        </div>

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
                ? 'bg-red-500/10 text-red-500 border border-red-500/40 hover:bg-red-600 hover:text-white' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'
              }`}
            >
              {anotado ? 'Abandonar' : 'Unirse'}
            </button>
          )}
          <div className="px-4 py-3 bg-zinc-800 text-zinc-400 rounded-xl border border-white/10 text-xs flex items-center gap-1 font-bold">
             🔍 Info
          </div>
        </div>
      </div>

      {/* MODAL DE INFORMACIÓN Y JUGADORES (Sin cambios aquí) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-12 relative shadow-2xl scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button 
              onClick={() => setModalAbierto(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white text-2xl p-2"
            >
              ✕
            </button>

            <div className="flex gap-2 mb-2">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {props.sistema}
              </span>
              {soyElMaster && (
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  ✨ Tu Mesa
                </span>
              )}
            </div>
            
            <h2 className="text-4xl font-black text-white mt-4 mb-4 uppercase italic tracking-tighter leading-none">
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

            <div className="mb-8">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Aventureros en la Mesa
              </h4>
              <div className="bg-black/20 rounded-2xl p-4 border border-zinc-800">
                {cargandoJugadores ? (
                  <p className="text-zinc-600 text-xs italic">Consultando lista de convocados...</p>
                ) : listaJugadores.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {listaJugadores.map((jugador, idx) => (
                      <span key={idx} className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs font-bold border border-white/5">
                        👤 {jugador.nombre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-xs italic">Aún no hay aventureros anotados...</p>
                )}
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

            <div className="flex flex-col gap-3">
              {!soyElMaster && !props.eventoEsPasado && (
                <button 
                  onClick={alternarInscripcion}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    anotado 
                    ? 'bg-red-500/20 text-red-500 border border-red-500/40' 
                    : 'bg-emerald-600 text-white shadow-lg'
                  }`}
                >
                  {anotado ? 'Abandonar Partida' : 'Unirse a la Aventura'}
                </button>
              )}
              <button 
                onClick={() => setModalAbierto(false)}
                className="w-full bg-zinc-800 text-zinc-400 font-black py-4 rounded-2xl uppercase text-xs tracking-widest"
              >
                Volver al Tablón
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Partida;