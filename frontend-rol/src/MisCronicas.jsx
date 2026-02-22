import { useState, useEffect } from 'react';

function MisCronicas({ alActualizarUsuario }) { // Recibimos la función para avisar a App.jsx
  const [cronicas, setCronicas] = useState({ dirigiendo: [], jugando: [] });
  const [cargando, setCargando] = useState(true);
  
  const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
  const [editando, setEditando] = useState(false);
  
  // Sincronizamos el perfil con los datos actuales
  const [perfil, setPerfil] = useState({ 
    nombre: usuarioGuardado?.nombre || '', 
    email: usuarioGuardado?.email || '',
    avatar: usuarioGuardado?.avatar || 'guerrero'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('https://gestor-eventos-rol.onrender.com/api/mis-cronicas', {
      headers: { 'authorization': token }
    })
      .then(res => res.json())
      .then(datos => {
        setCronicas(datos);
        setCargando(false);
      })
      .catch(err => console.error("Error cargando crónicas:", err));
  }, []);

  const manejarCambioPerfil = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const guardarPerfil = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://gestor-eventos-rol.onrender.com/api/usuarios/perfil', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'authorization': token 
        },
        body: JSON.stringify(perfil)
      });
      
      if (res.ok) {
        const nuevoUsuario = { ...usuarioGuardado, ...perfil };
        localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
        
        // ¡IMPORTANTE! Avisamos a App.jsx para que el Navbar se actualice
        if (alActualizarUsuario) alActualizarUsuario(nuevoUsuario);
        
        setEditando(false);
        alert("✨ ¡Perfil y Avatar actualizados!");
      } else {
        alert("❌ Error al actualizar el perfil.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ... (solicitarDM y formatearFecha igual que antes)
  const solicitarDM = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://gestor-eventos-rol.onrender.com/api/usuarios/solicitar-dm', {
        method: 'POST',
        headers: { 'authorization': token }
      });
      const texto = await res.text();
      alert(res.ok ? `✅ ${texto}` : `❌ ${texto}`);
    } catch (error) { console.error(error); }
  };

  const formatearFecha = (fechaString) => {
    return new Date(fechaString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (cargando) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <p className="text-emerald-500 font-black animate-pulse uppercase tracking-widest text-left">Consultando Archivos...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500 text-left">
      <h2 className="text-4xl font-black text-white text-center mb-10 italic uppercase tracking-tighter">
        📖 Mi Diario de Aventuras
      </h2>

      <section className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl mb-12 relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Ficha del Aventurero
        </h3>
        
        {editando ? (
          <div className="space-y-6 max-w-md text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase ml-2">Elige tu Avatar</label>
              <div className="flex gap-4 p-3 bg-zinc-950 rounded-2xl border border-zinc-800 justify-around">
                {['guerrero', 'mago', 'esqueleto', 'goblin'].map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setPerfil({...perfil, avatar: tipo})}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all ${
                      perfil.avatar === tipo ? 'bg-emerald-500 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-zinc-800 hover:bg-zinc-700 opacity-50'
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
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase ml-2">Nombre</label>
              <input name="nombre" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-emerald-500 outline-none" value={perfil.nombre} onChange={manejarCambioPerfil} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase ml-2">Email</label>
              <input name="email" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-emerald-500 outline-none" value={perfil.email} onChange={manejarCambioPerfil} />
            </div>
            <div className="flex gap-3">
              <button onClick={guardarPerfil} className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl uppercase text-xs">Guardar</button>
              <button onClick={() => setEditando(false)} className="px-6 bg-zinc-800 text-zinc-400 rounded-xl uppercase text-xs">Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-4xl border-2 border-emerald-500 shadow-lg">
                  {perfil.avatar === 'guerrero' && '⚔️'}
                  {perfil.avatar === 'mago' && '🧙'}
                  {perfil.avatar === 'esqueleto' && '💀'}
                  {perfil.avatar === 'goblin' && '👺'}
               </div>
               <div>
                  <p className="text-3xl font-black text-white">{perfil.nombre}</p>
                  <p className="text-zinc-500 font-mono text-sm">{perfil.email}</p>
               </div>
            </div>
            <button onClick={() => setEditando(true)} className="bg-zinc-800 text-zinc-300 px-6 py-3 rounded-xl text-xs font-black uppercase">✏️ Editar Ficha</button>
          </div>
        )}
      </section>

      {/* ... (Resto de las secciones de crónicas igual que antes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        <div className="space-y-6">
          <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase"><span className="w-8 h-1 bg-emerald-500 rounded-full"></span>Jugando</h3>
          {cronicas.jugando.map(p => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <h4 className="font-bold text-white">{p.titulo}</h4>
              <p className="text-zinc-500 text-xs mt-2 uppercase">{p.evento_nombre} | {formatearFecha(p.evento_fecha)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase"><span className="w-8 h-1 bg-amber-500 rounded-full"></span>Dirigiendo</h3>
          {cronicas.dirigiendo.map(p => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <h4 className="font-bold text-white">{p.titulo}</h4>
              <p className="text-zinc-500 text-xs mt-2 uppercase">{p.evento_nombre} | {formatearFecha(p.evento_fecha)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MisCronicas;