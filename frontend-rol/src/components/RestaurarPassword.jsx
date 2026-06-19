import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function RestaurarPassword() {
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [forjando, setForjando] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Extraemos el token mágico directamente de la URL (Ej: /reset-password/12345abc)
    const partesUrl = window.location.pathname.split('/');
    const tokenExtraido = partesUrl[partesUrl.length - 1];
    setToken(tokenExtraido);
  }, []);

  const manejarRestauracion = async (e) => {
    e.preventDefault();

    if (password !== confirmarPassword) {
      return Swal.fire({
        title: 'Las Runas no coinciden',
        text: 'Asegúrate de escribir exactamente la misma contraseña en ambos campos.',
        icon: 'warning',
        background: '#09090b',
        color: '#fff',
        confirmButtonColor: '#f59e0b'
      });
    }

    if (password.length < 6) {
        return Swal.fire({
            title: 'Magia Débil',
            text: 'Tu nueva contraseña debe tener al menos 6 caracteres para ser segura.',
            icon: 'warning',
            background: '#09090b', color: '#fff', confirmButtonColor: '#f59e0b'
        });
    }

    setForjando(true);

    try {
      const respuesta = await fetch(`/api/usuarios/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password })
      });

      if (respuesta.ok) {
        await Swal.fire({
          title: '¡Poder Restaurado!',
          text: 'Tu nueva contraseña ha sido forjada en los registros del Gremio.',
          icon: 'success',
          background: '#09090b', color: '#fff', confirmButtonColor: '#10b981',
          customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' }
        });
        // Redirigir al inicio para que pueda loguearse
        window.location.href = '/'; 
      } else {
        const dataError = await respuesta.json();
        Swal.fire({
          title: 'El Hechizo Falló',
          text: dataError.error || 'El enlace es inválido o su magia ya ha expirado.',
          icon: 'error',
          background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error de Conexión',
        text: 'El servidor no responde. Intenta más tarde.',
        icon: 'warning',
        background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444'
      });
    }

    setForjando(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="mb-8 flex flex-col items-center">
        <span className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">🔮</span>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            Forjar Nueva <span className="text-emerald-500">Runa</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase mt-2">
            Restablecimiento de Acceso
        </p>
      </div>

      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-emerald-500/30 p-8 md:p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
        
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <p className="text-sm font-medium text-zinc-400 mb-8 text-center italic relative z-10 border-b border-zinc-800 pb-6">
            Escribe tu nueva contraseña secreta. Guárdala bien en tu memoria de aventurero.
        </p>
        
        <form onSubmit={manejarRestauracion} className="space-y-6 relative z-10">
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Nueva Contraseña
            </label>
            <div className="relative">
              <input 
                type={mostrarPassword ? "text" : "password"}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-5 pr-14 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-40 hover:opacity-100 transition-opacity focus:outline-none"
                title={mostrarPassword ? "Ocultar" : "Revelar"}
              >
                {mostrarPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Confirmar Contraseña
            </label>
            <input 
              type={mostrarPassword ? "text" : "password"}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-5 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
              placeholder="••••••••"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={forjando || !password || !confirmarPassword}
            className="group relative w-full overflow-hidden rounded-2xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:scale-105 transition-transform duration-500"></div>
            <div className="relative py-5 font-black text-white text-xs uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3">
                {forjando ? 'Forjando Magia...' : 'Consagrar Contraseña'}
            </div>
          </button>
        </form>
        
        <div className="mt-8 text-center relative z-10 pt-6 border-t border-zinc-800">
            <a href="/" className="text-[10px] text-zinc-500 hover:text-white font-bold uppercase tracking-widest transition-colors">
                ← Regresar al Portal
            </a>
        </div>

      </div>
    </div>
  );
}

export default RestaurarPassword;