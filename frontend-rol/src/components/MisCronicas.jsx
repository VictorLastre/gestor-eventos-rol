import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 

function MisCronicas({ alActualizarUsuario }) { 
  const [cronicas, setCronicas] = useState({ dirigiendo: [], jugando: [] });
  const [cargando, setCargando] = useState(true);
  
  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  const [editando, setEditando] = useState(false);
  
  const [peticionEnviada, setPeticionEnviada] = useState(usuarioGuardado?.solicitudDmPendiente || false);
  const esJugadorBase = usuarioGuardado?.rol === 'jugador';
  
  // ✨ AÑADIDO: nombre_completo para los certificados
  const [perfil, setPerfil] = useState({ 
    nombre: usuarioGuardado?.nombre || '', 
    nombre_completo: usuarioGuardado?.nombre_completo || '', 
    email: usuarioGuardado?.email || '',
    avatar: usuarioGuardado?.avatar || 'guerrero'
  });

  useEffect(() => {
    fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/mis-cronicas')
      .then(res => res.json())
      .then(datos => {
        setCronicas(datos);
        setCargando(false);
      })
      .catch(err => {
        if (err === 'Sesión expirada') return;
        console.error("Error cargando crónicas:", err);
      });
  }, []);

  const manejarCambioPerfil = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const guardarPerfil = async () => {
    try {
      const res = await fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/perfil', {
        method: 'PUT',
        body: JSON.stringify(perfil)
      });
      
      if (res.ok) {
        const nuevoUsuario = { ...usuarioGuardado, ...perfil };
        localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
        if (alActualizarUsuario) alActualizarUsuario(nuevoUsuario);
        setEditando(false);
        
        Swal.fire({
          title: '¡Ficha Actualizada!',
          text: 'Tus datos han sido grabados en los registros del gremio.',
          icon: 'success',
          background: '#09090b', 
          color: '#fff',
          confirmButtonColor: '#10b981'
        });
      }
    } catch (error) {
      if (error === 'Sesión expirada') return;
      console.error(error);
    }
  };

  const enviarPeticionDM = async () => {
    const result = await Swal.fire({
      title: '¿Sientes el llamado?',
      text: "Convertirse en Dungeon Master requiere sabiduría. ¿Enviar petición al Senado?",
      icon: 'question',
      showCancelButton: true,
      background: '#09090b',
      color: '#fff',
      confirmButtonColor: '#9333ea', 
      confirmButtonText: '🧙‍♂️ Sí, quiero dirigir'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetchProtegido('https://gestor-eventos-rol.onrender.com/api/usuarios/solicitar-dm', {
        method: 'POST'
      });
      
      if (res.ok) {
        setPeticionEnviada(true);
        const usuarioActualizado = { ...usuarioGuardado, solicitudDmPendiente: true };
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        if (alActualizarUsuario) alActualizarUsuario(usuarioActualizado);

        Swal.fire({
          title: 'Petición Enviada',
          icon: 'success',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#10b981'
        });
      }
    } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
  };

  // ✨ CORRECCIÓN MAGNA: Formateador de fechas a prueba de fallos
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "Fecha Desconocida";
    try {
      const soloFecha = fechaStr.split('T')[0];
      const [anio, mes, dia] = soloFecha.split('-');
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]} de ${anio}`;
    } catch (error) {
      return "Fecha en el limbo";
    }
  };

  if (cargando) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-black animate-pulse uppercase tracking-widest text-xs">Consultando Archivos...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      
      {/* 📜 ENCABEZADO DE PERFIL */}
      <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        {editando ? (
          <div className="relative z-10 flex flex-col gap-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Elige tu Identidad (Avatar)</label>
              <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-950/50 rounded-3xl border border-zinc-800">
                {['guerrero', 'mago', 'esqueleto', 'goblin'].map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setPerfil({...perfil, avatar: tipo})}
                    className={`aspect-square rounded-2xl flex items-center justify-center text-3xl md:text-4xl transition-all ${
                      perfil.avatar === tipo ? 'bg-emerald-500 scale-105 shadow-[0_0_25px_rgba(16,185,129,0.3)]' : 'bg-zinc-900 opacity-40 hover:opacity-100'
                    }`}
                  >
                    {tipo === 'guerrero' && '⚔️'}
                    {tipo === 'mago' && '🧙'}
                    {tipo === 'esqueleto' && '💀'}
                    {tipo === 'goblin' && '👺'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Nombre en los registros (Alias)</label>
                <input name="nombre" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-emerald-500 outline-none transition-all font-bold" value={perfil.nombre} onChange={manejarCambioPerfil} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Mensajería (Email)</label>
                <input name="email" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-emerald-500 outline-none transition-all font-mono" value={perfil.email} onChange={manejarCambioPerfil} />
              </div>
            </div>

            {/* ✨ NUEVO CAMPO: NOMBRE COMPLETO */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> 
                Nombre Real (Requerido para Certificados)
              </label>
              <input 
                name="nombre_completo" 
                placeholder="Ej: Bilbo Bolsón" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:border-emerald-500 outline-none transition-all font-bold" 
                value={perfil.nombre_completo} 
                onChange={manejarCambioPerfil} 
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button onClick={guardarPerfil} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-900/20">Grabar Ficha</button>
              <button onClick={() => setEditando(false)} className="px-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all">Descartar</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6 md:gap-8">
                <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/40 transition-all"></div>
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-950 rounded-full flex items-center justify-center text-5xl md:text-6xl border-2 border-emerald-500/50 shadow-2xl relative z-10">
                        {perfil.avatar === 'guerrero' && '⚔️'}
                        {perfil.avatar === 'mago' && '🧙'}
                        {perfil.avatar === 'esqueleto' && '💀'}
                        {perfil.avatar === 'goblin' && '👺'}
                    </div>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{perfil.nombre}</p>
                  
                  {/* ✨ MUESTRA EL NOMBRE REAL SI EXISTE */}
                  {perfil.nombre_completo && (
                    <p className="text-zinc-400 font-bold text-sm tracking-wide mb-2 flex items-center gap-2">
                      📜 {perfil.nombre_completo}
                    </p>
                  )}

                  <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">{usuarioGuardado?.rol === 'admin' ? '👑 Administrador' : usuarioGuardado?.rol === 'dm' ? '🛡️ Dungeon Master' : '⚔️ Aventurero'}</p>
                  <p className="text-zinc-500 font-mono text-sm">{perfil.email}</p>
                </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-50">
              <button onClick={() => setEditando(true)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 shadow-xl">
                ✏️ Editar Perfil
              </button>
              
              {esJugadorBase && (
                peticionEnviada ? (
                  <div className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center animate-pulse">
                    ⏳ Evaluación en curso...
                  </div>
                ) : (
                  <button onClick={enviarPeticionDM} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 transition-all active:scale-95">
                    🧙‍♂️ Pedir Rango DM
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/* ⚔️ LISTADO DE CRÓNICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* JUGANDO */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Jugando</h3>
            <span className="h-px flex-grow bg-emerald-500/20"></span>
            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-xs font-black">{cronicas.jugando.length}</span>
          </div>
          
          <div className="grid gap-4">
            {cronicas.jugando.length === 0 ? (
              <p className="text-zinc-600 italic text-sm py-4 border-2 border-dashed border-zinc-900 rounded-3xl text-center">Aún no has participado en ninguna mesa...</p>
            ) : (
              cronicas.jugando.map(p => (
                <div key={p.id} className="group bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl hover:border-emerald-500/30 transition-all hover:bg-zinc-900">
                  <h4 className="font-black text-lg text-white group-hover:text-emerald-400 transition-colors uppercase italic leading-tight">{p.titulo}</h4>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.evento_nombre}</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                    <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">{formatearFecha(p.evento_fecha)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* DIRIGIENDO */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Dirigiendo</h3>
            <span className="h-px flex-grow bg-amber-500/20"></span>
            <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-xs font-black">{cronicas.dirigiendo.length}</span>
          </div>
          
          <div className="grid gap-4">
            {cronicas.dirigiendo.length === 0 ? (
              <p className="text-zinc-600 italic text-sm py-4 border-2 border-dashed border-zinc-900 rounded-3xl text-center">No has convocado ninguna aventura aún...</p>
            ) : (
              cronicas.dirigiendo.map(p => (
                <div key={p.id} className="group bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl hover:border-amber-500/30 transition-all hover:bg-zinc-900">
                  <h4 className="font-black text-lg text-white group-hover:text-amber-400 transition-colors uppercase italic leading-tight">{p.titulo}</h4>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.evento_nombre}</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                    <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">{formatearFecha(p.evento_fecha)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MisCronicas;