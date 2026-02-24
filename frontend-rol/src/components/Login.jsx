import { useState } from 'react';
import Swal from 'sweetalert2'; // ✨ IMPORTAMOS SWEETALERT

function Login(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ✨ Adiós al estado "mensaje", SweetAlert se encarga ahora.

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

        // ✨ TOAST DE BIENVENIDA
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: '#18181b', // zinc-900
          color: '#fff'
        });

        Toast.fire({
          icon: 'success',
          title: `¡Bienvenido de vuelta, ${datos.usuario.nombre}!`
        });

        setEmail('');
        setPassword('');
        
        props.alLoguearse(datos.usuario);
        
      } else {
        const textoError = await respuesta.text();
        // ✨ ALERTA DE ERROR DE CREDENCIALES
        Swal.fire({
          title: 'Acceso Denegado',
          text: textoError,
          icon: 'error',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#10b981' // emerald-500
        });
      }
    } catch (error) {
      console.error("Error de comunicación:", error);
      // ✨ ALERTA DE ERROR DE CONEXIÓN
      Swal.fire({
        title: 'Error de Conexión',
        text: 'No se pudo contactar con los servidores del Gremio.',
        icon: 'error',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#ef4444' // red-500
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fadeIn">
      {/* Encabezado con el nuevo nombre */}
      <div className="mb-8 text-center">                
        <p className="text-zinc-500 text-sm font-bold tracking-widest mt-2">PORTAL DE CRÓNICAS Y AVENTURAS</p>
      </div>

      {/* Tarjeta de Login */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl shadow-black relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <h2 className="text-xl font-black text-zinc-200 mb-8 text-center uppercase tracking-tight">Acceso de Usuarios</h2>
        
        <form onSubmit={manejarLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              placeholder="nombre@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">
              Contraseña
            </label>
            <input 
              type="password" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-900/30 transition-all transform active:scale-95 mt-4 uppercase tracking-widest text-xs"
          >
            Entrar al Portal
          </button>
        </form>

        {/* ✨ El div del "mensaje" en texto plano fue eliminado */}
      </div>

    </div>
  );
}

export default Login;