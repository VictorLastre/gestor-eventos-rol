import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 
import { io } from 'socket.io-client';
import { obtenerRangoDM } from '../utils/rangoHonor';

const CONFIG_TEMAS = {
  "Fantasía Medieval": { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", hoverBorder: "hover:border-amber-500/30", hoverText: "group-hover:text-amber-400", icon: "🏰" },
  "Fantasía Oscura": { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", hoverBorder: "hover:border-purple-500/30", hoverText: "group-hover:text-purple-400", icon: "🌑" },
  "Fantasía Urbana": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", hoverBorder: "hover:border-blue-500/30", hoverText: "group-hover:text-blue-400", icon: "🏙️" },
  "Terror / Horror": { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", hoverBorder: "hover:border-red-500/30", hoverText: "group-hover:text-red-500", icon: "🩸" },
  "Horror Cósmico": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", hoverBorder: "hover:border-emerald-500/30", hoverText: "group-hover:text-emerald-400", icon: "🐙" },
  "Terror Espacial": { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30", hoverBorder: "hover:border-rose-500/30", hoverText: "group-hover:text-rose-500", icon: "🛰️" },
  "Ciencia Ficción": { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", hoverBorder: "hover:border-cyan-500/30", hoverText: "group-hover:text-cyan-400", icon: "🚀" },
  "Cyberpunk": { color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", hoverBorder: "hover:border-fuchsia-500/30", hoverText: "group-hover:text-fuchsia-500", icon: "🦾" },
  "Steampunk": { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", hoverBorder: "hover:border-orange-500/30", hoverText: "group-hover:text-orange-400", icon: "⚙️" },
  "Post-Apocalíptico": { color: "text-orange-600", bg: "bg-orange-600/10", border: "border-orange-600/30", hoverBorder: "hover:border-orange-600/30", hoverText: "group-hover:text-orange-600", icon: "☢️" },
  "Misterio / Investigación": { color: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/30", hoverBorder: "hover:border-zinc-500/30", hoverText: "group-hover:text-zinc-300", icon: "🔎" },
  "Mundo de Tinieblas": { color: "text-red-600", bg: "bg-red-600/10", border: "border-red-600/30", hoverBorder: "hover:border-red-600/30", hoverText: "group-hover:text-red-600", icon: "🦇" },
  "Superhéroes": { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", hoverBorder: "hover:border-yellow-500/30", hoverText: "group-hover:text-yellow-400", icon: "🦸" },
  "Western / Weird West": { color: "text-amber-700", bg: "bg-amber-800/10", border: "border-amber-800/30", hoverBorder: "hover:border-amber-800/30", hoverText: "group-hover:text-amber-700", icon: "🤠" },
  "Piratas / Naval": { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30", hoverBorder: "hover:border-teal-500/30", hoverText: "group-hover:text-teal-400", icon: "🏴‍☠️" },
  "Space Opera": { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", hoverBorder: "hover:border-indigo-500/30", hoverText: "group-hover:text-indigo-400", icon: "🛸" },
  "Histórico": { color: "text-stone-400", bg: "bg-stone-500/10", border: "border-stone-500/30", hoverBorder: "hover:border-stone-500/30", hoverText: "group-hover:text-stone-400", icon: "📜" },
  "Anime / Manga": { color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30", hoverBorder: "hover:border-pink-500/30", hoverText: "group-hover:text-pink-400", icon: "🌸" },
  "Espionaje / Acción": { color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", hoverBorder: "hover:border-zinc-500/30", hoverText: "group-hover:text-zinc-400", icon: "🕶️" },
  "Rol Infantil / Familiar": { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", hoverBorder: "hover:border-sky-500/30", hoverText: "group-hover:text-sky-400", icon: "🧸" },
  "Comedia": { color: "text-yellow-300", bg: "bg-yellow-500/10", border: "border-yellow-500/30", hoverBorder: "hover:border-yellow-500/30", hoverText: "group-hover:text-yellow-300", icon: "🎭" },
  "Escape Room": { color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/30", hoverBorder: "hover:border-lime-500/30", hoverText: "group-hover:text-lime-400", icon: "🗝️" },
  "Juegos de Mesa": { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30", hoverBorder: "hover:border-rose-500/30", hoverText: "group-hover:text-rose-500", icon: "🃏" } 
};

function Partida(props) {
  const tema = CONFIG_TEMAS[props.etiqueta] || CONFIG_TEMAS['Fantasía Medieval'];
  const esJuegoMesa = props.etiqueta === 'Juegos de Mesa'; 

  const cantJugadores = props.jugadoresIniciales ?? props.anotados ?? props.jugadores_anotados ?? 0;
  const yaEstaAnotado = Boolean(props.anotadoInicialmente || props.estoy_anotado || false);

  const [jugadoresAnotados, setJugadoresAnotados] = useState(cantJugadores);
  const [anotado, setAnotado] = useState(yaEstaAnotado);
  const [listaJugadores, setListaJugadores] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargandoJugadores, setCargandoJugadores] = useState(false);
  const [mensajeTelegram, setMensajeTelegram] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [sistemas, setSistemas] = useState([]);

  const [datosEdicion, setDatosEdicion] = useState({
    titulo: props.titulo || '',
    descripcion: props.descripcion || props.description || '',
    requisitos: props.requisitos || '',
    sistema: props.sistema || '', 
    sistema_id: props.sistema_id || '', 
    cupo: props.cupo || 4,
    turno: props.turno || 'Tarde',
    etiqueta: props.etiqueta || 'Fantasía Medieval',
    apta_novatos: Boolean(props.apta_novatos),
    materiales_pedidos: props.materiales_pedidos || '',
    es_privada: Boolean(props.es_privada), // ✨ ESTADO PARA EDICIÓN
    codigo_privado: props.codigo_privado || '' // ✨ ESTADO PARA EDICIÓN
  });

  const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#09090b', color: '#fff',
    customClass: { popup: 'border border-zinc-800 shadow-2xl rounded-2xl' }
  });

  useEffect(() => {
    if (modalAbierto || modoEdicion) {
      document.body.style.overflow = 'hidden';
      if (modalAbierto) cargarListaJugadores();
      
      if (modoEdicion && sistemas.length === 0 && !esJuegoMesa) {
        fetch('/api/sistemas')
          .then(res => res.json())
          .then(data => {
            const sistemasCargados = Array.isArray(data) ? data : [];
            setSistemas(sistemasCargados);
            
            if (!datosEdicion.sistema_id && props.sistema) {
              const sistemaActual = sistemasCargados.find(s => s.nombre === props.sistema);
              if(sistemaActual) {
                setDatosEdicion(prev => ({ ...prev, sistema_id: sistemaActual.id }));
              }
            }
          })
          .catch(err => console.error(err));
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [modalAbierto, modoEdicion, sistemas.length, props.sistema, datosEdicion.sistema_id, esJuegoMesa]);

  useEffect(() => {
    setJugadoresAnotados(cantJugadores);
    setAnotado(yaEstaAnotado);
  }, [cantJugadores, yaEstaAnotado]);

  useEffect(() => {
    if (!modalAbierto) return; 
    
    const socket = io('/', { path: '/api/socket.io' });
    socket.on('actualizacion-mesas', () => {
       cargarListaJugadores();
    });

    return () => socket.disconnect();
  }, [modalAbierto]);

  const cargarListaJugadores = () => {
    setCargandoJugadores(true);
    fetchProtegido(`/api/partidas/${props.id}/jugadores`)
      .then(res => res.json())
      .then(datos => { setListaJugadores(datos); setCargandoJugadores(false); })
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); setCargandoJugadores(false); });
  };

  const soyElMaster = props.esMiMesa; 
  const soyAdmin = props.esAdmin;

  // ✨ INSCRIPCIÓN CON SOPORTE PARA MESAS PRIVADAS
  const enviarAvisoTelegram = async () => {
    if (!mensajeTelegram.trim()) {
      return Swal.fire({ title: 'Aviso', text: 'Escribe un mensaje antes de enviar.', icon: 'warning', background: '#09090b', color: '#fff' });
    }

    setEnviandoMensaje(true);
    try {
      const res = await fetchProtegido(`/api/partidas/${props.id}/notificar-jugadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: mensajeTelegram })
      });

      if (res.ok) {
        Swal.fire({
          title: 'Aviso Enviado',
          text: 'Tus jugadores han sido notificados.',
          icon: 'success',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#0ea5e9'
        });
        setMensajeTelegram('');
      } else {
        const text = await res.text();
        Swal.fire({ title: 'Error', text: text || 'No se pudo enviar el aviso.', icon: 'error', background: '#09090b', color: '#fff' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const alternarInscripcion = async (e) => {
    e.stopPropagation(); 
    const metodo = anotado ? 'DELETE' : 'POST';
    let payload = null;

    // Si intenta unirse y la mesa es privada, pedimos la clave
    if (metodo === 'POST' && props.es_privada) {
      const { value: claveIngresada } = await Swal.fire({
        title: 'Mesa Privada',
        text: 'Ingresa la contraseña secreta dictada por el Organizador:',
        input: 'password',
        inputPlaceholder: 'Contraseña...',
        background: '#09090b',
        color: '#fff',
        showCancelButton: true,
        confirmButtonColor: '#a855f7', // Color purpura
        cancelButtonColor: '#3f3f46',
        confirmButtonText: 'Desbloquear y Unirse',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'border border-purple-500/30 rounded-[2rem]' }
      });

      // Si el usuario cancela o no pone nada, abortamos
      if (!claveIngresada) return;
      
      payload = { codigo_privado: claveIngresada };
    }

    try {
      const opcionesFetch = { method: metodo };

      // Si tenemos un payload (la clave), la mandamos en el body
      if (payload) {
        opcionesFetch.headers = { 'Content-Type': 'application/json' };
        opcionesFetch.body = JSON.stringify(payload);
      }

      const res = await fetchProtegido(`/api/partidas/${props.id}/inscripciones`, opcionesFetch);
      
      if (res.ok) {
        setAnotado(!anotado);
        setJugadoresAnotados(anotado ? jugadoresAnotados - 1 : jugadoresAnotados + 1);
        cargarListaJugadores();
        Toast.fire({ icon: 'success', title: anotado ? 'Has abandonado la mesa' : '¡Te has unido a la aventura!' });
      } else {
        const mensaje = await res.text();
        Swal.fire({ title: 'Aviso del Gremio', text: mensaje, icon: 'warning', background: '#09090b', color: '#fff', confirmButtonColor: '#f59e0b' });
      }
    } catch (err) { if (err !== 'Sesión expirada') console.error(err); }
  };

  const borrarMesa = async (e) => {
    if (e) e.stopPropagation(); 
    const result = await Swal.fire({
      title: '¿Disolver la Mesa?', text: "Se cancelará la aventura y perderás a los aventureros. Es irreversible.", icon: 'warning', showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444', cancelButtonColor: '#27272a', confirmButtonText: 'Sí, borrar mesa', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/partidas/${props.id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({ title: 'Mesa Borrada', icon: 'success', background: '#09090b', color: '#fff', confirmButtonColor: '#10b981' });
          setModalAbierto(false); 
        } else {
          Swal.fire({ title: 'Error Mágico', text: 'No se pudo disolver la mesa.', icon: 'error', background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444' });
        }
      } catch (err) { if (err !== 'Sesión expirada') console.error(err); }
    }
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();

    let paqueteFinal;

    if (esJuegoMesa) {
        if (!datosEdicion.sistema.trim()) {
            return Swal.fire({ title: 'Aviso', text: 'Debes indicar el juego de mesa.', icon: 'warning', background: '#09090b', color: '#fff' });
        }
        paqueteFinal = {
            ...datosEdicion,
            sistema_id: null,
            codigo_privado: datosEdicion.es_privada ? datosEdicion.codigo_privado : null
        };
    } else {
        if (!datosEdicion.sistema_id) {
            return Swal.fire({ title: 'Aviso', text: 'Debes seleccionar un sistema', icon: 'warning', background: '#09090b', color: '#fff' });
        }
        const sistemaObj = sistemas.find(s => s.id.toString() === datosEdicion.sistema_id.toString());
        const nombreSistema = sistemaObj ? sistemaObj.nombre : props.sistema;

        paqueteFinal = {
          ...datosEdicion,
          sistema: nombreSistema,             
          sistema_id: datosEdicion.sistema_id,
          codigo_privado: datosEdicion.es_privada ? datosEdicion.codigo_privado : null
        };
    }

    try {
      const res = await fetchProtegido(`/api/partidas/${props.id}`, {
        method: 'PUT',
        body: JSON.stringify(paqueteFinal)
      });

      if (res.ok) {
        Swal.fire({ title: esJuegoMesa ? '¡Juego Actualizado!' : '¡Aventura Reescríta!', text: 'Los detalles de la mesa han sido actualizados.', icon: 'success', background: '#09090b', color: '#fff', confirmButtonColor: '#f59e0b' });
        setModoEdicion(false); 
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Aviso del Gremio', text: data.error, icon: 'warning', background: '#09090b', color: '#fff' });
      }
    } catch (err) {
      if (err !== 'Sesión expirada') console.error(err);
    }
  };

  const abrirEdicion = (e) => {
    e.stopPropagation();
    setModoEdicion(true);
    setModalAbierto(false); 
  };

  const generarClaveAleatoriaEdicion = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let clave = '';
    for (let i = 0; i < 6; i++) {
      clave += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setDatosEdicion({...datosEdicion, codigo_privado: clave});
  };

  // Lógica de colores por disponibilidad
  const estaLlena = jugadoresAnotados >= props.cupo;
  const tieneJugadores = jugadoresAnotados > 0 && !estaLlena;
  
  let estiloBordeDisponibilidad = "";
  if (estaLlena) {
    estiloBordeDisponibilidad = "border-red-500/60 hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"; // Rojo
  } else if (tieneJugadores) {
    estiloBordeDisponibilidad = "border-orange-500/60 hover:border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]"; // Naranja
  } else {
    estiloBordeDisponibilidad = "border-emerald-500/60 hover:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"; // Verde
  }

  return (
    <>
      <div 
        onClick={() => setModalAbierto(true)}
        className={`relative p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-500 flex flex-col min-h-[350px] sm:min-h-[450px] h-full cursor-pointer w-full min-w-0 group overflow-hidden ${
          soyElMaster 
          ? "bg-amber-900/10 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]" 
          : `bg-zinc-900/60 hover:bg-zinc-900 hover:shadow-xl ${estiloBordeDisponibilidad}`
        }`}
      >
        {soyElMaster && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none"></div>}

        <div className="flex justify-between items-start mb-6 relative z-10 gap-3">
          <div className="flex-1 min-w-0 space-y-3 pr-2">
            <div className="flex flex-wrap gap-2">
              {/* ✨ ETIQUETA DE MESA PRIVADA (NUEVO) */}
              {Boolean(props.es_privada) && (
                <span className="text-[9px] font-black text-purple-900 bg-purple-400 uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.5)] flex items-center gap-1.5 whitespace-nowrap animate-pulse">
                  🔒 Privada
                </span>
              )}

              {Boolean(props.apta_novatos) && (
                <span className={`text-[9px] font-black ${esJuegoMesa ? 'text-emerald-900 bg-emerald-400' : 'text-emerald-950 bg-emerald-400'} uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.5)] flex items-center gap-1.5 whitespace-nowrap`}>
                  🌱 {esJuegoMesa ? 'Enseña a jugar' : 'Novatos'}
                </span>
              )}
              {props.etiqueta && !esJuegoMesa && (
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none sm:whitespace-nowrap ${tema.color} ${tema.bg} ${tema.border}`}>
                  {tema.icon} {props.etiqueta}
                </span>
              )}
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700 shadow-inner truncate max-w-[200px] sm:max-w-none sm:whitespace-nowrap">
                {esJuegoMesa ? '🃏' : '🎲'} {props.sistema || 'Sistema Desconocido'}
              </span>
              
              {soyElMaster && (
                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-lg text-amber-500 bg-amber-500/10 border-amber-500/50 whitespace-nowrap">
                  ⭐ Tu Mesa
                </span>
              )}
            </div>

            <h3 className={`text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-tight line-clamp-2 drop-shadow-md break-words transition-colors ${soyElMaster ? 'group-hover:text-amber-400' : tema.hoverText}`}>
              {props.titulo}
            </h3>
          </div>
          
          <div className="shrink-0 text-right flex flex-col items-end">
            <p className={`text-3xl sm:text-4xl font-mono font-black leading-none drop-shadow-lg ${estaLlena ? 'text-red-500' : tieneJugadores ? 'text-orange-500' : 'text-emerald-500'}`}>
              {jugadoresAnotados}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 border-t border-zinc-800 pt-1 w-full text-center whitespace-nowrap">
              de {props.cupo}
            </p>
          </div>
        </div>

        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 border-l-2 border-zinc-800 pl-3 sm:pl-4 py-1 italic line-clamp-3 sm:line-clamp-4 flex-grow relative z-10 break-words whitespace-normal">
          "{props.description || props.descripcion}"
        </p>

        <div className="mb-4 sm:mb-6 bg-zinc-950/80 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/80 flex justify-between items-center transition-all group-hover:bg-zinc-950 relative z-10 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-sm shadow-inner relative">
              {esJuegoMesa ? '👑' : '🛡️'}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-600 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-zinc-900 shadow-md">
                Lv{props.dm_nivel || 1}
              </div>
            </div>
            <div className="min-w-0 flex-1 pr-1 sm:pr-2">
              <p className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] truncate">{esJuegoMesa ? 'Organizador' : 'Director de Juego'}</p>
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 min-w-0">
                <p className="text-xs sm:text-sm text-zinc-200 font-bold truncate">{props.dmNombre || props.dungeon_master_nombre || 'Desconocido'}</p>
                {!esJuegoMesa && props.dm_honor !== undefined && (
                  <span title={`Honor: ${props.dm_honor}`} className={`text-[10px] font-black uppercase tracking-widest ${obtenerRangoDM(props.dm_honor).colorClase}`}>
                    {obtenerRangoDM(props.dm_honor).icono}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {(soyElMaster || soyAdmin) && !props.eventoEsPasado && (
            <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={abrirEdicion}
                className={`w-8 h-8 bg-zinc-800 ${tema.color} hover:text-black rounded-xl flex items-center justify-center transition-colors border border-transparent ${tema.hoverBorder} hover:bg-zinc-300 shadow-lg`}
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

        <div className="flex gap-2 sm:gap-3 mt-auto relative z-10">
          {!soyElMaster && !props.eventoEsPasado && (
            <button 
              onClick={alternarInscripcion}
              disabled={cargandoJugadores || (props.inscripcionesCerradas && !anotado) || (estaLlena && !anotado)}
              className={`flex-1 min-w-0 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl truncate px-2 ${
                anotado 
                ? 'bg-red-500/10 text-red-500 border border-red-500/40 hover:bg-red-600 hover:text-white' 
                : props.inscripcionesCerradas
                  ? 'bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                  : estaLlena
                    ? 'bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    : 'bg-emerald-600 text-white border border-emerald-50 hover:bg-emerald-500 shadow-emerald-900/40 active:scale-95'
              }`}
            >
              {anotado ? 'Abandonar' : props.inscripcionesCerradas ? 'Cerrado' : estaLlena ? 'Llena' : (props.es_privada ? '🔒 Alistarse' : 'Alistarse')}
            </button>
          )}
          <div className={`px-4 sm:px-6 shrink-0 flex items-center justify-center bg-zinc-950 text-zinc-500 rounded-xl sm:rounded-2xl border transition-all ${soyElMaster || props.eventoEsPasado ? 'w-full py-3 sm:py-4 text-[10px] sm:text-xs tracking-widest hover:text-white hover:bg-zinc-800 uppercase font-black border-zinc-800 cursor-pointer' : 'border-zinc-800/80 group-hover:border-zinc-700 group-hover:text-zinc-300'}`}>
            {soyElMaster || props.eventoEsPasado ? '👁️ Ver Pergamino' : '👁️'}
          </div>
        </div>
      </div>

      {modoEdicion && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className={`bg-zinc-900 border ${CONFIG_TEMAS[datosEdicion.etiqueta]?.border || 'border-amber-500/30'} w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-10 relative shadow-[0_0_80px_rgba(0,0,0,0.5)] scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button onClick={() => setModoEdicion(false)} className="absolute top-6 right-6 w-10 h-10 bg-zinc-950 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800">✕</button>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
              <span className={`${CONFIG_TEMAS[datosEdicion.etiqueta]?.color || 'text-amber-500'} drop-shadow-md`}>{esJuegoMesa ? '📐' : '📜'}</span> {esJuegoMesa ? 'Modificar Partida' : 'Reescribir Aventura'}
            </h3>
            
            <form onSubmit={guardarEdicion} className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título de la Gesta</label>
                <input type="text" value={datosEdicion.titulo} onChange={e => setDatosEdicion({...datosEdicion, titulo: e.target.value})} required className={`w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:${tema.border} outline-none transition-all font-bold shadow-inner`} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{esJuegoMesa ? 'Notas del Organizador' : 'Sinopsis'}</label>
                <textarea value={datosEdicion.descripcion} onChange={e => setDatosEdicion({...datosEdicion, descripcion: e.target.value})} required rows="4" className={`w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:${tema.border} outline-none transition-all resize-none italic font-medium shadow-inner`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!esJuegoMesa && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Género</label>
                    <select value={datosEdicion.etiqueta} onChange={e => setDatosEdicion({...datosEdicion, etiqueta: e.target.value})} className={`bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white outline-none font-bold appearance-none cursor-pointer ${CONFIG_TEMAS[datosEdicion.etiqueta]?.color || ''}`}>
                      {Object.keys(CONFIG_TEMAS).filter(op => op !== 'Juegos de Mesa').map(opcion => (
                         <option key={opcion} value={opcion}>{CONFIG_TEMAS[opcion].icon} {opcion}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div onClick={() => setDatosEdicion({...datosEdicion, apta_novatos: !datosEdicion.apta_novatos})} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 select-none ${esJuegoMesa ? 'md:col-span-2 mt-0' : 'mt-6'} ${datosEdicion.apta_novatos ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                  <div>
                    <h4 className={`font-black uppercase tracking-widest text-[11px] ${datosEdicion.apta_novatos ? 'text-emerald-400' : 'text-zinc-500'}`}>🌱 {esJuegoMesa ? 'Enseño a Jugar' : 'Apta Novatos'}</h4>
                  </div>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${datosEdicion.apta_novatos ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700'}`}>
                    {datosEdicion.apta_novatos && <span className="font-black text-sm">✓</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Requisitos Específicos</label>
                <input type="text" value={datosEdicion.requisitos} onChange={e => setDatosEdicion({...datosEdicion, requisitos: e.target.value})} className={`w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:${tema.border} outline-none font-medium shadow-inner`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {esJuegoMesa ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Juego a jugar</label>
                    <input 
                      type="text" 
                      value={datosEdicion.sistema} 
                      onChange={e => setDatosEdicion({...datosEdicion, sistema: e.target.value})} 
                      required 
                      className={`bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:${tema.border} outline-none font-bold`} 
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sistema</label>
                    <select 
                      value={datosEdicion.sistema_id} 
                      onChange={e => setDatosEdicion({...datosEdicion, sistema_id: e.target.value})}
                      required
                      className={`bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:${tema.border} outline-none font-bold cursor-pointer`}
                    >
                      <option value="">Seleccionar...</option>
                      {sistemas.map(s => (
                        <option key={s.id} value={s.id} className="bg-zinc-900">{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cupo Máx.</label>
                  <input type="number" value={datosEdicion.cupo} onChange={e => setDatosEdicion({...datosEdicion, cupo: e.target.value})} min="1" max={esJuegoMesa ? "20" : "10"} required className={`bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:${tema.border} outline-none font-black text-center`} />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Turno</label>
                  <select value={datosEdicion.turno} onChange={e => setDatosEdicion({...datosEdicion, turno: e.target.value})} className={`bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:${tema.border} outline-none font-bold cursor-pointer`}>
                    <option value="Mañana" className="bg-zinc-900">Mañana</option>
                    <option value="Tarde" className="bg-zinc-900">Tarde</option>
                    <option value="Noche" className="bg-zinc-900">Noche</option>
                    <option value="Madrugada" className="bg-zinc-900">Madrugada</option>
                  </select>
                </div>
              </div>

              {/* ✨ NUEVO: CONFIGURACIÓN DE MESA PRIVADA EN EDICIÓN ✨ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-800/50">
                <div 
                  onClick={() => setDatosEdicion({...datosEdicion, es_privada: !datosEdicion.es_privada})}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between select-none h-[60px] ${
                    datosEdicion.es_privada 
                    ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xl ${datosEdicion.es_privada ? 'opacity-100' : 'opacity-30'}`}>🔒</span>
                    <div>
                      <h4 className={`font-black uppercase tracking-widest text-[11px] ${datosEdicion.es_privada ? 'text-purple-400' : 'text-zinc-500'}`}>Mesa Privada</h4>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${datosEdicion.es_privada ? 'bg-purple-500 border-purple-500 text-black' : 'border-zinc-700'}`}>
                    {datosEdicion.es_privada && <span className="font-black text-xs">✓</span>}
                  </div>
                </div>

                {datosEdicion.es_privada && (
                  <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                    <input 
                      type="text" 
                      placeholder="Contraseña Secreta" 
                      value={datosEdicion.codigo_privado} 
                      onChange={e => setDatosEdicion({...datosEdicion, codigo_privado: e.target.value})} 
                      className="w-full bg-purple-500/5 border border-purple-500/30 rounded-2xl py-4 px-6 text-white focus:border-purple-500 outline-none font-bold placeholder:text-purple-900/50 shadow-inner h-[60px]"
                    />
                    <button 
                      type="button" 
                      onClick={generarClaveAleatoriaEdicion}
                      className="w-[60px] h-[60px] shrink-0 bg-purple-500/10 border border-purple-500/50 text-purple-400 rounded-2xl flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                      title="Generar Clave Mágica"
                    >
                      🪄
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 flex items-center gap-2 ${CONFIG_TEMAS[datosEdicion.etiqueta]?.color || 'text-amber-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${CONFIG_TEMAS[datosEdicion.etiqueta]?.bg || 'bg-amber-500'}`}></span> 
                  Petición Logística
                </label>
                <input 
                  type="text" 
                  value={datosEdicion.materiales_pedidos} 
                  onChange={e => setDatosEdicion({...datosEdicion, materiales_pedidos: e.target.value})} 
                  placeholder={esJuegoMesa ? "Dados extra, tableros, fichas..." : "Manuales, mapas, dados extras..."}
                  className={`w-full bg-zinc-950 border ${CONFIG_TEMAS[datosEdicion.etiqueta]?.border || 'border-amber-500/30'} rounded-2xl py-4 px-5 text-white outline-none italic text-sm shadow-inner`}
                />
              </div>

              <button type="submit" className={`group relative overflow-hidden font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-[0.2em] mt-4 border ${CONFIG_TEMAS[datosEdicion.etiqueta]?.border || 'border-amber-400'} ${CONFIG_TEMAS[datosEdicion.etiqueta]?.bg || 'bg-amber-500'} ${CONFIG_TEMAS[datosEdicion.etiqueta]?.color || 'text-amber-500'}`}>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10">{esJuegoMesa ? '💾 Confirmar Cambios' : '💾 Consagrar Cambios'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-12 relative shadow-[0_0_100px_rgba(0,0,0,0.8)] scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex justify-end gap-2 md:gap-3 mb-6 md:mb-0 md:absolute md:top-6 md:right-6 z-20 w-full md:w-auto">
              {(soyElMaster || soyAdmin) && !props.eventoEsPasado && (
                <>
                  <button 
                    onClick={abrirEdicion}
                    className={`bg-zinc-900 text-zinc-400 hover:${tema.color} border border-zinc-800 ${tema.hoverBorder} font-black uppercase tracking-widest text-[9px] px-4 py-2 rounded-xl transition-colors shadow-lg`}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={borrarMesa}
                    className="bg-zinc-900 text-zinc-400 hover:text-red-500 border border-zinc-800 hover:border-red-500/50 font-black uppercase tracking-widest text-[9px] px-4 py-2 rounded-xl transition-colors shadow-lg"
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

            <div className="relative z-10">
              <div className="flex flex-wrap gap-2 mb-6">
                {/* ✨ ETIQUETA DE MESA PRIVADA EN EL MODAL (NUEVO) */}
                {Boolean(props.es_privada) && (
                  <span className="text-[10px] font-black text-purple-950 uppercase tracking-widest bg-purple-400 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-1.5 animate-pulse">
                    🔒 Mesa Privada
                  </span>
                )}

                {Boolean(props.apta_novatos) && (
                  <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest bg-emerald-400 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.4)] flex items-center gap-1.5">
                    🌱 {esJuegoMesa ? 'Enseña a jugar' : 'Apta Novatos'}
                  </span>
                )}
                {props.etiqueta && !esJuegoMesa && (
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${tema.color} ${tema.bg} ${tema.border}`}>
                    {tema.icon} {props.etiqueta}
                  </span>
                )}
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
                  {esJuegoMesa ? '🃏' : '🎲'} {props.sistema || 'Sistema Desconocido'}
                </span>
                {soyElMaster && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border text-amber-500 bg-amber-500/10 border-amber-500/50 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                    ✨ Tu Mesa
                  </span>
                )}
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-8 uppercase italic tracking-tighter leading-none border-b border-zinc-800 pb-8 break-words">
                {props.titulo}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-800/80 shadow-inner flex items-center gap-4 min-w-0">
                  <div className="shrink-0 w-14 h-14 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-2xl relative">
                    {esJuegoMesa ? '👑' : '🛡️'}
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-600 text-black text-[11px] font-black px-2 py-0.5 rounded-full border-2 border-zinc-900 shadow-md">
                      Lv{props.dm_nivel || 1}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1 truncate">{esJuegoMesa ? 'Organizador' : 'Director de Juego'}</p>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <p className="text-xl text-zinc-200 font-black truncate">{props.dmNombre || props.dungeon_master_nombre}</p>
                        {!esJuegoMesa && props.dm_honor !== undefined && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-black/30 border border-zinc-800 shadow-inner ${obtenerRangoDM(props.dm_honor).colorClase}`}>
                            {obtenerRangoDM(props.dm_honor).icono} Rango {obtenerRangoDM(props.dm_honor).nombre} ({props.dm_honor})
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-950/50 p-6 rounded-[2rem] border border-zinc-800/80 shadow-inner flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Disponibilidad</p>
                    <p className={`text-xl font-black ${estaLlena ? 'text-red-500' : 'text-emerald-500'}`}>
                      {jugadoresAnotados} de {props.cupo}
                    </p>
                  </div>
                  <div className={`text-4xl font-mono font-black opacity-20 ${estaLlena ? 'text-red-500' : 'text-emerald-500'}`}>
                     {estaLlena ? 'FULL' : 'OPEN'}
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

              {soyElMaster && !props.eventoEsPasado && (
                <div className="mb-10">
                  <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span> 
                    Enviar Aviso de Telegram (Solo DM)
                  </h4>
                  <div className="bg-sky-950/10 rounded-[2rem] p-6 border border-sky-500/20 shadow-inner space-y-4">
                    <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                      Escribe un aviso para tus jugadores. Se enviará un mensaje privado a través del bot a todos los inscritos en la mesa que tengan su Telegram vinculado.
                    </p>
                    <textarea 
                      value={mensajeTelegram} 
                      onChange={e => setMensajeTelegram(e.target.value)} 
                      placeholder="Ej: Recuerden traer hojas de personaje nivel 3. ¡Nos vemos en el evento!"
                      rows="3" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-sky-500 outline-none transition-all resize-none font-medium placeholder:text-zinc-700 shadow-inner"
                    />
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={enviarAvisoTelegram}
                        disabled={enviandoMensaje || cargandoJugadores || listaJugadores.length === 0}
                        className="bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-3 px-6 rounded-xl uppercase text-[10px] tracking-wider transition-all select-none active:scale-95 shadow-lg shadow-sky-900/10 flex items-center gap-2"
                      >
                        {enviandoMensaje ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            Enviando...
                          </>
                        ) : (
                          '📣 Enviar Mensaje'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-10">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">{esJuegoMesa ? 'Notas del Organizador' : 'El Relato'}</h4>
                <p className="text-zinc-300 text-lg md:text-xl leading-relaxed italic whitespace-pre-line border-l-4 border-zinc-800 pl-6 py-2">
                  {props.description || props.descripcion}
                </p>
              </div>

              {props.requisitos && (
                <div className={`mb-10 p-8 ${tema.bg} border ${tema.border} rounded-[2rem]`}>
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 ${tema.color}`}>
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
                    disabled={cargandoJugadores || (props.inscripcionesCerradas && !anotado) || (estaLlena && !anotado)}
                    className={`flex-1 min-w-0 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 truncate px-4 ${
                      anotado 
                      ? 'bg-red-500/10 text-red-500 border-red-500/40 hover:bg-red-500 hover:text-white' 
                      : props.inscripcionesCerradas
                        ? 'bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                        : estaLlena
                          ? 'bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/40 border border-emerald-50 active:scale-95'
                    }`}
                  >
                    {anotado ? 'Abandonar Expedición' : props.inscripcionesCerradas ? 'Inscripciones Cerradas' : estaLlena ? 'Mesa Llena' : (props.es_privada ? '🔒 Desbloquear y Unirse' : 'Firmar el Contrato (Unirse)')}
                  </button>
                )}
                <button 
                  onClick={() => setModalAbierto(false)}
                  className={`py-5 px-8 shrink-0 bg-zinc-950 text-zinc-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800 ${soyElMaster || props.eventoEsPasado ? 'w-full' : ''}`}
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