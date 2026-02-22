import { useState } from 'react';

function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const manejarRegistro = async (e) => {
    e.preventDefault();
    try {
      // AGREGAMOS /api/registro AL FINAL DE LA URL
      const res = await fetch('https://gestor-eventos-rol.onrender.com/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
      });
      
      const texto = await res.text();
      if (res.ok) {
        setMensaje(`✅ ${texto}`);
        setNombre(''); setEmail(''); setPassword('');
      } else {
        setMensaje(`❌ ${texto}`);
      }
    } catch (error) {
      setMensaje("❌ Error de conexión.");
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fadeIn">
      <div className="mb-8 text-center">
        <span className="text-6xl mb-4 block drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">📜</span>
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
          Asociación de Rol La Pampa
        </h1>
        <p className="text-zinc-500 text-sm font-bold tracking-widest mt-2">NUEVA FICHA DE PERSONAJE</p>
      </div>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl shadow-black relative overflow-hidden">
        <h2 className="text-xl font-black text-zinc-200 mb-8 text-center uppercase tracking-tight">Crear Cuenta</h2>
        
        <form onSubmit={manejarRegistro} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Nombre del Héroe</label>
            <input 
              type="text" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
              placeholder="Ej: Sterbern"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-widest text-xs">
            Forjar Cuenta
          </button>
        </form>

        {mensaje && (
          <div className={`mt-6 p-3 rounded-lg text-xs text-center font-bold border ${mensaje.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
            {mensaje}
          </div>
        )}
      </div>
      
      <div className="mt-8 text-zinc-500 text-xs font-bold uppercase">
        <a href="/" className="text-emerald-500 hover:underline font-black">← Volver al inicio</a>
      </div>
    </div>
  );
}

export default Registro;