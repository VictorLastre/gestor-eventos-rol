import { useState } from 'react';
import Swal from 'sweetalert2';
import LogoSVG from '../assets/Logo.svg'; 

function Login(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false); // ✨ ESTADO PARA EL OJO MÁGICO

  const manejarLogin = async (e) => {
    e.preventDefault();

    try {
      const respuesta = await fetch('https://gestor-eventos-rol.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (respuesta.ok) {
        const datos = await respuesta.json(); 
        
        localStorage.setItem('token', datos.token);
        localStorage.setItem('usuario', JSON.stringify(datos.usuario)); 

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: '#09090b',
          color: '#fff',
          customClass: {
            popup: 'border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
          }
        });

        Toast.fire({
          icon: 'success',
          title: `¡Bienvenido, ${datos.usuario.nombre}!`
        });

        setEmail('');
        setPassword('');
        props.alLoguearse(datos.usuario);
        
      } else {
        const textoError = await respuesta.text();
        Swal.fire({
          title: 'Acceso Denegado',
          text: textoError || 'Credenciales inválidas en los anales.',
          icon: 'error',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#10b981',
          customClass: {
            popup: 'border border-red-500/30 rounded-[2rem]'
          }
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error de Conexión',
        text: 'El Oráculo no responde. Intenta más tarde.',
        icon: 'warning',
        background: '#09090b',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-700">
      
      {/* 🛡️ ESCUDO DEL GREMIO */}
      <div className="mb-8 flex flex-col items-center group">
        <div className="relative w-24 h-24 mb-4">
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full group-hover:bg-emerald-500/40 transition-all duration-500"></div>
            <img 
                src={LogoSVG} 
                alt="Logo Gremio" 
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-110 duration-500" 
            />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            Asociación de Rol <span className="text-emerald-500">La Pampa</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase mt-2">
            Portal de Crónicas y Aventuras
        </p>
      </div>

      {/* 🏰 TARJETA DE LOGIN */}
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        
        {/* Efectos de luz interna */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        <h2 className="text-sm font-black text-zinc-400 mb-10 text-center uppercase tracking-[0.3em] border-b border-zinc-800 pb-4">
            Identificación de Héroe
        </h2>
        
        <form onSubmit={manejarLogin} className="space-y-8 relative z-10">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Correo Electrónico
            </label>
            <input 
              type="email" 
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-5 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner font-bold"
              placeholder="aventurero@gremio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Contraseña
            </label>
            <div className="relative">
              <input 
                type={mostrarPassword ? "text" : "password"} // ✨ ALTERNAMOS EL TIPO DE INPUT
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
                title={mostrarPassword ? "Ocultar runas" : "Revelar runas"}
              >
                {mostrarPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="group relative w-full overflow-hidden rounded-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:scale-105 transition-transform duration-500"></div>
            <div className="relative py-5 font-black text-white text-xs uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3">
               <span>⚔️</span> Entrar al Portal
            </div>
          </button>
        </form>

        <div className="mt-10 text-center">
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                ¿Has olvidado tus pergaminos? Contacta a un Administrador
            </p>
        </div>
      </div>

    </div>
  );
}

export default Login;