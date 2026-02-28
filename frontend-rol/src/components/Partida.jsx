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
  
  const [sistemas, setSistemas] = useState([]);

  const [datosEdicion, setDatosEdicion] = useState({
    titulo: props.titulo || '',
    descripcion: props.descripcion || props.description || '',
    requisitos: props.requisitos || '',
    sistema_id: props.sistema_id || '', 
    cupo: props.cupo || 4,
    turno: props.turno || 'Tarde',
    etiqueta: props.etiqueta || 'Fantasía Medieval',
    apta_novatos: Boolean(props.apta_novatos),
    materiales_pedidos: props.materiales_pedidos || '' 
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
    background: '#09090b', 
    color: '#fff',
    customClass: {
      popup: 'border border-zinc-800 shadow-2xl rounded-2xl'
    }
  });

  useEffect(() => {
    if (modalAbierto || modoEdicion) {
      document.body.style.overflow = 'hidden';
      if (modalAbierto) cargarListaJugadores();
      
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
          background: '#09090b',
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
      background: '#09090b', 
      color: '#fff',
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#27272a', 
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
            background: '#09090b',
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
            background: '#09090b',
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
        return Swal.fire({ title: 'Aviso', text: 'Debes seleccionar un sistema', icon: 'warning', background: '#09090b', color: '#fff' });
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
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#f59e0b'
        }).then(() => {
          window.location.reload(); 
        });
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Aviso del Gremio', text: data.error, icon: 'warning', background: '#09090b', color: '#fff' });
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
      {/* 🃏 TARJETA DE LA MESA */}
      <div 
        onClick={() => setModalAbierto(true)}
        className={`relative p-8 rounded-[2rem] border transition-all duration-500 shadow-2xl flex flex-col h-[450px] cursor-pointer group overflow-hidden ${
          soyElMaster 
          ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-zinc-950 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]' 
          : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]'
        }`}
      >
        {soyElMaster && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none"></div>}

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="max-w-[75%] space-y-3">
            <div className="flex flex-wrap gap-2">
              {Boolean(props.apta_novatos) && (
                <span className="text-[9px] font-black text-emerald-950 uppercase tracking-widest bg-emerald-400 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.5)] flex items-center gap-1.5 animate-pulse">
                  🌱 Novatos
                </span>
              )}
              {props.etiqueta && (
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5">
                  {iconoEtiqueta} {props.etiqueta}
                </span>
              )}
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700 shadow-inner">
                🎲 {props.sistema || 'Sistema Desconocido'}
              </span>
              
              {soyElMaster && (
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  ✨ Tu Mesa
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none line-clamp-2 drop-shadow-md group-hover:text-emerald-400 transition-colors">
              {props.titulo}
            </h3>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <p className={`text-4xl font-mono font-black leading-none drop-shadow-lg ${jugadoresAnotados >= props.cupo ? 'text-red-500' : 'text-emerald-500'}`}>
              {jugadoresAnotados}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 border-t border-zinc-800 pt-1 w-full text-center">
              de {props.cupo}
            </p>
          </div>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed mb-6 border-l-2 border-zinc-800 pl-4 py-1 italic line-clamp-4 flex-grow relative z-10">
          "{props.description || props.descripcion}"
        </p>

        <div className="mb-6 bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 flex justify-between items-center transition-all group-hover:bg-zinc-950 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-sm shadow-inner">
              🛡️
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Director de Juego</p>
              <p className="text-sm text-zinc-200 font-bold truncate">{props.dmNombre || 'Desconocido'}</p>
            </div>
          </div>
          
          {(soyElMaster || soyAdmin) && !props.eventoEsPasado && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={abrirEdicion}
                className="w-8 h-8 bg-zinc-800 hover:bg-amber-500 text-zinc-400 hover:text-black rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-amber-500/50 shadow-lg"
                title="Editar Mesa"
              >
                ✏️
              </button>
              <button 
                onClick={borrarMesa}
                className="w-8 h-8 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-red-500/50 shadow-lg"
                title="Borrar Mesa"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-auto relative z-10">
          {!soyElMaster && !props.eventoEsPasado && (
            <button 
              onClick={alternarInscripcion}
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${
                anotado 
                ? 'bg-red-500/10 text-red-500 border border-red-500/40 hover:bg-red-600 hover:text-white' 
                : 'bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-500 shadow-emerald-900/40 active:scale-95'
              }`}
            >
              {anotado ? 'Abandonar' : 'Alistarse'}
            </button>
          )}
          <div className={`px-6 flex items-center justify-center bg-zinc-950 text-zinc-500 rounded-2xl border transition-all ${soyElMaster || props.eventoEsPasado ? 'w-full py-4 text-xs tracking-widest hover:text-white hover:bg-zinc-800 uppercase font-black border-zinc-800 cursor-pointer' : 'border-zinc-800/80 group-hover:border-zinc-700 group-hover:text-zinc-300'}`}>
            {soyElMaster || props.eventoEsPasado ? '👁️ Ver Pergamino' : '👁️'}
          </div>
        </div>
      </div>

      {/* ✏️ MODAL DE EDICIÓN */}
      {modoEdicion && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-zinc-900 border border-amber-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-10 relative shadow-[0_0_80px_rgba(245,158,11,0.15)] scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button onClick={() => setModoEdicion(false)} className="absolute top-6 right-6 w-10 h-10 bg-zinc-950 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800">✕</button>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
              <span className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">📜</span> Reescribir Aventura
            </h3>
            
            <form onSubmit={guardarEdicion} className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título de la Gesta</label>
                <input type="text" value={datosEdicion.titulo} onChange={e => setDatosEdicion({...datosEdicion, titulo: e.target.value})} required className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all font-bold shadow-inner" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sinopsis</label>
                <textarea value={datosEdicion.descripcion} onChange={e => setDatosEdicion({...datosEdicion, descripcion: e.target.value})} required rows="4" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all resize-none italic font-medium shadow-inner" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Género</label>
                  <select value={datosEdicion.etiqueta} onChange={e => setDatosEdicion({...datosEdicion, etiqueta: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-amber-500 outline-none font-bold appearance-none cursor-pointer">
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
                
                <div onClick={() => setDatosEdicion({...datosEdicion, apta_novatos: !datosEdicion.apta_novatos})} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 select-none mt-6 ${datosEdicion.apta_novatos ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                  <div>
                    <h4 className={`font-black uppercase tracking-widest text-[11px] ${datosEdicion.apta_novatos ? 'text-emerald-400' : 'text-zinc-500'}`}>🌱 Apta Novatos</h4>
                  </div>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${datosEdicion.apta_novatos ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700'}`}>
                    {datosEdicion.apta_novatos && <span className="font-black text-sm">✓</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Requisitos de Personaje</label>
                <input type="text" value={datosEdicion.requisitos} onChange={e => setDatosEdicion({...datosEdicion, requisitos: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none font-medium shadow-inner" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sistema</label>
                  <select 
                    value={datosEdicion.sistema_id} 
                    onChange={e => setDatosEdicion({...datosEdicion, sistema_id: e.target.value})}
                    required
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-amber-500 outline-none font-bold cursor-pointer"
                  >
                    <option value="">Seleccionar...</option>
                    {sistemas.map(s => (
                      <option key={s.id} value={s.id} className="bg-zinc-900">
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cupo Máx.</label>
                  <input type="number" value={datosEdicion.cupo} onChange={e => setDatosEdicion({...datosEdicion, cupo: e.target.value})} min="1" max="10" required className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-amber-500 outline-none font-black text-center" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Turno</label>
                  <select value={datosEdicion.turno} onChange={e => setDatosEdicion({...datosEdicion, turno: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-amber-500 outline-none font-bold cursor-pointer">
                    <option value="Mañana" className="bg-zinc-900">Mañana</option>
                    <option value="Tarde" className="bg-zinc-900">Tarde</option>
                    <option value="Noche" className="bg-zinc-900">Noche</option>
                    <option value="Madrugada" className="bg-zinc-900">Madrugada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> 
                  Petición Logística
                </label>
                <input 
                  type="text" 
                  value={datosEdicion.materiales_pedidos} 
                  onChange={e => setDatosEdicion({...datosEdicion, materiales_pedidos: e.target.value})} 
                  placeholder="Manuales, mapas, dados extras..."
                  className="w-full bg-amber-500/5 border border-amber-500/30 rounded-2xl py-4 px-5 text-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none italic text-sm shadow-inner"
                />
              </div>

              <button type="submit" className="group relative overflow-hidden bg-amber-500 text-black font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-[0.2em] mt-4 border border-amber-400">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10">💾 Consagrar Cambios</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📖 MODAL DE VISTA DETALLADA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-12 relative shadow-[0_0_100px_rgba(0,0,0,0.8)] scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex justify-end gap-3 absolute top-6 right-6 z-20">
              {(soyElMaster || soyAdmin) && !props.eventoEsPasado && (
                <>
                  <button 
                    onClick={abrirEdicion}
                    className="bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/30 font-black uppercase tracking-widest text-[9px] px-4 py-2 rounded-xl transition-colors shadow-lg shadow-amber-900/10"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={borrarMesa}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 font-black uppercase tracking-widest text-[9px] px-4 py-2 rounded-xl transition-colors shadow-lg shadow-red-900/10"
                  >
                    🗑️ Borrar
                  </button>
                </>
              )}
              <button 
                onClick={() => setModalAbierto(false)}
                className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-xl transition-colors hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="relative z-10 pt-4 md:pt-0">
              <div className="flex flex-wrap gap-2 mb-6">
                {Boolean(props.apta_novatos) && (
                  <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest bg-emerald-400 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.4)] flex items-center gap-1.5">
                    🌱 Apta Novatos
                  </span>
                )}
                {props.etiqueta && (
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/30 flex items-center gap-1.5">
                    {iconoEtiqueta} {props.etiqueta}
                  </span>
                )}
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
                  🎲 {props.sistema || 'Sistema Desconocido'}
                </span>
                {soyElMaster && (
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    ✨ Tu Mesa
                  </span>
                )}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8 uppercase italic tracking-tighter leading-none border-b border-zinc-800 pb-8">
                {props.titulo}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-800/80 shadow-inner flex items-center gap-4">
                  <div className="w-14 h-14 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-2xl">🛡️</div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Director de Juego</p>
                    <p className="text-xl text-zinc-200 font-black">{props.dmNombre}</p>
                  </div>
                </div>
                
                <div className="bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-800/80 shadow-inner flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Disponibilidad</p>
                    <p className={`text-xl font-black ${jugadoresAnotados >= props.cupo ? 'text-red-500' : 'text-emerald-500'}`}>
                      {jugadoresAnotados} de {props.cupo}
                    </p>
                  </div>
                  <div className={`text-4xl font-mono font-black opacity-20 ${jugadoresAnotados >= props.cupo ? 'text-red-500' : 'text-emerald-500'}`}>
                     {jugadoresAnotados >= props.cupo ? 'FULL' : 'OPEN'}
                  </div>
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Compañía Aventurera
                </h4>
                <div className="bg-black/40 rounded-[2rem] p-6 md:p-8 border border-zinc-800/50 shadow-inner">
                  {cargandoJugadores ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                      <p className="text-emerald-500 text-xs font-black uppercase tracking-widest animate-pulse">Consultando Registros...</p>
                    </div>
                  ) : listaJugadores.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {listaJugadores.map((jugador, idx) => {
                        let estilosRol = 'bg-blue-500/10 text-blue-400 border-blue-500/30'; 
                        let iconoRol = '👤';

                        if (jugador.rol === 'admin') {
                          estilosRol = 'bg-amber-500/10 text-amber-500 border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.15)]'; 
                          iconoRol = '👑';
                        } else if (jugador.rol === 'dm') {
                          estilosRol = 'bg-purple-500/10 text-purple-400 border-purple-500/40'; 
                          iconoRol = '🛡️';
                        }

                        return (
                          <span 
                            key={idx} 
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${estilosRol}`}
                          >
                            <span className="text-base">{iconoRol}</span> {jugador.nombre}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-xs italic font-bold">La mesa está vacía aguardando héroes...</p>
                  )}
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">El Relato</h4>
                <p className="text-zinc-300 text-lg md:text-xl leading-relaxed italic whitespace-pre-line border-l-4 border-zinc-800 pl-6 py-2">
                  {props.description || props.descripcion}
                </p>
              </div>

              {props.requisitos && (
                <div className="mb-10 p-8 bg-amber-500/5 border border-amber-500/20 rounded-[2rem]">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <span>⚠️</span> Condiciones del Gremio
                  </h4>
                  <p className="text-zinc-300 text-sm font-medium leading-relaxed">
                    {props.requisitos}
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-zinc-800">
                {!soyElMaster && !props.eventoEsPasado && (
                  <button 
                    onClick={alternarInscripcion}
                    className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 ${
                      anotado 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/40 hover:bg-red-500 hover:text-white' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/40 border border-emerald-500 active:scale-95'
                    }`}
                  >
                    {anotado ? 'Abandonar Expedición' : 'Firmar el Contrato (Unirse)'}
                  </button>
                )}
                <button 
                  onClick={() => setModalAbierto(false)}
                  className={`py-5 px-8 bg-zinc-950 text-zinc-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800 ${soyElMaster || props.eventoEsPasado ? 'w-full' : ''}`}
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Partida;