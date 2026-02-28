import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 

function Partida(props) {
  const cantJugadores = props.jugadoresIniciales ?? props.jugadores_anotados ?? 0;
  const yaEstaAnotado = Boolean(props.anotadoInicialmente || props.estoy_anotado || false);

  const [jugadoresAnotados, setJugadoresAnotados] = useState(cantJugadores);
  const [anotado, setAnotado] = useState(yaEstaAnotado);
  const [listaJugadores, setListaJugadores] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargandoJugadores, setCargandoJugadores] = useState(false);

  const [modoEdicion, setModoEdicion] = useState(false);
  
  // ✨ NUEVO ESTADO PARA LA LISTA DE SISTEMAS EN EL EDITOR
  const [sistemas, setSistemas] = useState([]);

  // ✨ ACTUALIZAMOS EL ESTADO INICIAL PARA USAR sistema_id Y MATERIALES
  const [datosEdicion, setDatosEdicion] = useState({
    titulo: props.titulo || '',
    descripcion: props.descripcion || props.description || '',
    requisitos: props.requisitos || '',
    sistema_id: props.sistema_id || '', // Usamos ID en lugar de texto
    cupo: props.cupo || 4,
    turno: props.turno || 'Tarde',
    etiqueta: props.etiqueta || 'Fantasía Medieval',
    apta_novatos: Boolean(props.apta_novatos),
    materiales_pedidos: props.materiales_pedidos || '' // Permite editar los materiales
  });

  const iconoEtiqueta = {
    'Fantasía Medieval': '🏰',
    'Fantasía Oscura': '🌑',
    'Fantasía Urbana': '🏙️',
    'Terror / Horror': '🩸',
    'Horror Cósmico': '🐙', 
    'Terror Espacial': '🛰️', 
    'Ciencia Ficción': '🚀',
    'Cyberpunk': '🦾',
    'Steampunk': '⚙️',
    'Post-Apocalíptico': '☢️',
    'Misterio / Investigación': '🔎',
    'Mundo de Tinieblas': '🦇', 
    'Superhéroes': '🦸',
    'Western / Weird West': '🤠',
    'Piratas / Naval': '🏴‍☠️',
    'Space Opera': '🛸',
    'Histórico': '📜',
    'Anime / Manga': '🌸',
    'Espionaje / Acción': '🕶️',
    'Rol Infantil / Familiar': '🧸', 
    'Comedia': '🎭'
  }[props.etiqueta] || '🏷️';

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#18181b', 
    color: '#fff'
  });

  useEffect(() => {
    if (modalAbierto || modoEdicion) {
      document.body.style.overflow = 'hidden';
      if (modalAbierto) cargarListaJugadores();
      
      // ✨ CARGAMOS LA LISTA DE SISTEMAS SOLO SI SE ABRE EL EDITOR
      if (modoEdicion && sistemas.length === 0) {
        fetch('https://gestor-eventos-rol.onrender.com/api/sistemas')
          .then(res => res.json())
          .then(data => setSistemas(Array.isArray(data) ? data : []))
          .catch(err => console.error(err));
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [modalAbierto, modoEdicion, sistemas.length]);

  useEffect(() => {
    setJugadoresAnotados(cantJugadores);
    setAnotado(yaEstaAnotado);
  }, [cantJugadores, yaEstaAnotado]);

  const cargarListaJugadores = () => {
    setCargandoJugadores(true);
    fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/partidas/${props.id}/jugadores`)
      .then(res => res.json())
      .then(datos => {
        setListaJugadores(datos);
        setCargandoJugadores(false);
      })
      .catch(err => {
        if (err === 'Sesión expirada') return;
        console.error(err);
        setCargandoJugadores(false);
      });
  };

  const soyElMaster = props.esMiMesa; 
  const soyAdmin = props.esAdmin;

  const alternarInscripcion = async (e) => {
    e.stopPropagation(); 
    const metodo = anotado ? 'DELETE' : 'POST';

    try {
      const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/partidas/${props.id}/inscripciones`, {
        method: metodo
      });

      if (res.ok) {
        setAnotado(!anotado);
        setJugadoresAnotados(anotado ? jugadoresAnotados - 1 : jugadoresAnotados + 1);
        cargarListaJugadores();
        
        Toast.fire({
          icon: 'success',
          title: anotado ? 'Has abandonado la mesa' : '¡Te has unido a la aventura!'
        });
        
      } else {
        const mensaje = await res.text();
        Swal.fire({
          title: 'Aviso del Gremio',
          text: mensaje,
          icon: 'warning',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#f59e0b',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (err) { 
      if (err === 'Sesión expirada') return;
      console.error(err); 
    }
  };

  const borrarMesa = async (e) => {
    if (e) e.stopPropagation(); 
    
    const result = await Swal.fire({
      title: '¿Disolver la Mesa?',
      text: "Se cancelará la aventura y todos los aventureros inscritos perderán su lugar. Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      background: '#18181b', 
      color: '#fff',
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#3f3f46', 
      confirmButtonText: 'Sí, borrar mesa',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/partidas/${props.id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          Swal.fire({
            title: 'Mesa Borrada',
            text: 'La aventura ha sido cancelada.',
            icon: 'success',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#10b981'
          }).then(() => {
            window.location.reload(); 
          });
        } else {
          Swal.fire({
            title: 'Error Mágico',
            text: 'No se pudo disolver la mesa.',
            icon: 'error',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#ef4444'
          });
        }
      } catch (err) { 
        if (err === 'Sesión expirada') return;
        console.error(err); 
      }
    }
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();

    if (!datosEdicion.sistema_id) {
        return Swal.fire({ title: 'Aviso', text: 'Debes seleccionar un sistema', icon: 'warning', background: '#18181b', color: '#fff' });
    }

    try {
      const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/partidas/${props.id}`, {
        method: 'PUT',
        body: JSON.stringify(datosEdicion)
      });

      if (res.ok) {
        Swal.fire({
          title: '¡Aventura Reescríta!',
          text: 'Los detalles de la mesa han sido actualizados.',
          icon: 'success',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#f59e0b'
        }).then(() => {
          window.location.reload(); 
        });
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Aviso del Gremio', text: data.error, icon: 'warning', background: '#18181b', color: '#fff' });
      }
    } catch (err) {
      if (err === 'Sesión expirada') return;
      console.error(err);
    }
  };

  const abrirEdicion = (e) => {
    e.stopPropagation();
    setModoEdicion(true);
    setModalAbierto(false); 
  };

  return (
    <>
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
            <div className="flex flex-wrap gap-2">
              {Boolean(props.apta_novatos) && (
                <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest bg-emerald-400 px-2 py-0.5 rounded border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)] flex items-center gap-1 animate-pulse">
                  🌱 Apta Novatos
                </span>
              )}
              {props.etiqueta && (
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                  {iconoEtiqueta} {props.etiqueta}
                </span>
              )}
              {/* ✨ AQUÍ MUESTRA EL NOMBRE BONITO DEL SISTEMA */}
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                🎲 {props.sistema || 'Sistema Desconocido'}
              </span>
              
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

        <div className="mb-6 bg-black/30 p-2 rounded-lg border border-white/5 flex justify-between items-center transition-all group-hover:bg-black/50">
          <div>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Director</p>
            <p className="text-xs text-zinc-200 font-bold truncate">🛡️ {props.dmNombre || 'Desconocido'}</p>
          </div>
          
          {(soyElMaster || soyAdmin) && !props.eventoEsPasado && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={abrirEdicion}
                className="w-7 h-7 bg-zinc-800 hover:bg-amber-500 text-zinc-400 hover:text-black rounded-md flex items-center justify-center transition-colors border border-transparent hover:border-amber-500/50"
                title="Editar Mesa"
              >
                ✏️
              </button>
              <button 
                onClick={borrarMesa}
                className="w-7 h-7 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-md flex items-center justify-center transition-colors border border-transparent hover:border-red-500/50"
                title="Borrar Mesa"
              >
                🗑️
              </button>
            </div>
          )}
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

      {modoEdicion && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-amber-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-8 relative shadow-[0_0_50px_rgba(245,158,11,0.1)] scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button onClick={() => setModoEdicion(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white text-2xl">✕</button>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
              <span className="text-amber-500">📜</span> Reescribir Aventura
            </h3>
            
            <form onSubmit={guardarEdicion} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Título</label>
                <input type="text" value={datosEdicion.titulo} onChange={e => setDatosEdicion({...datosEdicion, titulo: e.target.value})} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all font-bold" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Descripción</label>
                <textarea value={datosEdicion.descripcion} onChange={e => setDatosEdicion({...datosEdicion, descripcion: e.target.value})} required rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none transition-all resize-none italic" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Género</label>
                  <select value={datosEdicion.etiqueta} onChange={e => setDatosEdicion({...datosEdicion, etiqueta: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 px-4 text-white focus:border-amber-500 outline-none font-bold">
                    <option value="Fantasía Medieval">🏰 Fantasía Medieval</option>
                    <option value="Fantasía Oscura">🌑 Fantasía Oscura</option>
                    <option value="Fantasía Urbana">🏙️ Fantasía Urbana</option>
                    <option value="Terror / Horror">🩸 Terror / Horror</option>
                    <option value="Horror Cósmico">🐙 Horror Cósmico</option>
                    <option value="Terror Espacial">🛰️ Terror Espacial</option>
                    <option value="Ciencia Ficción">🚀 Ciencia Ficción</option>
                    <option value="Cyberpunk">🦾 Cyberpunk</option>
                    <option value="Steampunk">⚙️ Steampunk</option>
                    <option value="Post-Apocalíptico">☢️ Post-Apocalíptico</option>
                    <option value="Misterio / Investigación">🔎 Misterio / Investigación</option>
                    <option value="Mundo de Tinieblas">🦇 Mundo de Tinieblas</option>
                    <option value="Superhéroes">🦸 Superhéroes</option>
                    <option value="Western / Weird West">🤠 Western / Weird West</option>
                    <option value="Piratas / Naval">🏴‍☠️ Piratas / Naval</option>
                    <option value="Space Opera">🛸 Space Opera</option>
                    <option value="Histórico">📜 Histórico</option>
                    <option value="Anime / Manga">🌸 Anime / Manga</option>
                    <option value="Espionaje / Acción">🕶️ Espionaje / Acción</option>
                    <option value="Rol Infantil / Familiar">🧸 Rol Infantil / Familiar</option>
                    <option value="Comedia">🎭 Comedia</option>
                  </select>
                </div>
                
                <div onClick={() => setDatosEdicion({...datosEdicion, apta_novatos: !datosEdicion.apta_novatos})} className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-4 select-none mt-5 ${datosEdicion.apta_novatos ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div>
                    <h4 className={`font-black uppercase tracking-widest text-xs ${datosEdicion.apta_novatos ? 'text-emerald-400' : 'text-zinc-500'}`}>🌱 Apta Novatos</h4>
                  </div>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${datosEdicion.apta_novatos ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700'}`}>
                    {datosEdicion.apta_novatos && <span className="font-black text-sm">✓</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Requisitos</label>
                <input type="text" value={datosEdicion.requisitos} onChange={e => setDatosEdicion({...datosEdicion, requisitos: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ✨ AQUÍ TRANSFORMAMOS EL INPUT DE SISTEMA EN UN SELECT */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Sistema</label>
                  <select 
                    value={datosEdicion.sistema_id} 
                    onChange={e => setDatosEdicion({...datosEdicion, sistema_id: e.target.value})}
                    required
                    className="bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none font-bold cursor-pointer"
                  >
                    <option value="">Seleccionar...</option>
                    {sistemas.map(s => (
                      <option key={s.id} value={s.id} className="bg-zinc-900">
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Cupo</label>
                  <input type="number" value={datosEdicion.cupo} onChange={e => setDatosEdicion({...datosEdicion, cupo: e.target.value})} min="1" max="10" required className="bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none font-bold" />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase ml-2 tracking-widest">Turno</label>
                  <select value={datosEdicion.turno} onChange={e => setDatosEdicion({...datosEdicion, turno: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-amber-500 outline-none font-bold cursor-pointer">
                    <option value="Mañana" className="bg-zinc-900">Mañana</option>
                    <option value="Tarde" className="bg-zinc-900">Tarde</option>
                    <option value="Noche" className="bg-zinc-900">Noche</option>
                    <option value="Madrugada" className="bg-zinc-900">Madrugada</option>
                  </select>
                </div>
              </div>

              {/* ✨ AÑADIMOS MATERIALES AL EDITOR */}
              <div className="space-y-1 mt-2">
                <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> 
                  Pedido al Gremio (Logística)
                </label>
                <input 
                  type="text" 
                  value={datosEdicion.materiales_pedidos} 
                  onChange={e => setDatosEdicion({...datosEdicion, materiales_pedidos: e.target.value})} 
                  className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl py-3 px-4 text-amber-200 focus:border-amber-500 outline-none italic text-sm"
                />
              </div>

              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest mt-2">
                💾 Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-12 relative shadow-2xl scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex justify-end gap-2 absolute top-6 right-6">
              {(soyElMaster || soyAdmin) && !props.eventoEsPasado && (
                <>
                  <button 
                    onClick={abrirEdicion}
                    className="bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/30 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={borrarMesa}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    🗑️ Borrar
                  </button>
                </>
              )}
              <button 
                onClick={() => setModalAbierto(false)}
                className="text-zinc-500 hover:text-white text-xl p-1 px-3 bg-zinc-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-2 mt-4 md:mt-0">
              {Boolean(props.apta_novatos) && (
                <span className="text-xs font-black text-emerald-950 uppercase tracking-widest bg-emerald-400 px-3 py-1 rounded-full border border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)] flex items-center gap-1">
                  🌱 Apta Novatos
                </span>
              )}
              {props.etiqueta && (
                <span className="text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
                  {iconoEtiqueta} {props.etiqueta}
                </span>
              )}
              {/* ✨ AQUÍ TAMBIÉN MUESTRA EL NOMBRE BONITO DENTRO DEL MODAL */}
              <span className="text-xs font-black text-zinc-300 uppercase tracking-widest bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                🎲 {props.sistema || 'Sistema Desconocido'}
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
                    {listaJugadores.map((jugador, idx) => {
                      let estilosRol = 'bg-blue-500/10 text-blue-400 border-blue-500/30'; 
                      let iconoRol = '👤';

                      if (jugador.rol === 'admin') {
                        estilosRol = 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.1)]'; 
                        iconoRol = '👑';
                      } else if (jugador.rol === 'dm') {
                        estilosRol = 'bg-purple-500/10 text-purple-400 border-purple-500/30'; 
                        iconoRol = '🛡️';
                      }

                      return (
                        <span 
                          key={idx} 
                          className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border flex items-center gap-1.5 ${estilosRol}`}
                        >
                          <span className="text-sm">{iconoRol}</span> {jugador.nombre}
                        </span>
                      );
                    })}
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
                    ? 'bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500 hover:text-white' 
                    : 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-500'
                  }`}
                >
                  {anotado ? 'Abandonar Partida' : 'Unirse a la Aventura'}
                </button>
              )}
              <button 
                onClick={() => setModalAbierto(false)}
                className="w-full bg-zinc-800 text-zinc-400 font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-zinc-700 hover:text-white transition-colors"
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