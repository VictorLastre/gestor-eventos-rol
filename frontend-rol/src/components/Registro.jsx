import { useState } from 'react';
import Swal from 'sweetalert2'; 

// ✨ RECIBIMOS LA PROP 'irALogin'
function Registro({ irALogin }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const manejarRegistro = async (e) => {
    e.preventDefault();
    
    Swal.fire({
      title: 'Inscribiendo en los anales...',
      text: 'Los escribas están registrando tu nombre en el Gremio.',
      background: '#18181b',
      color: '#fff',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch('https://gestor-eventos-rol.onrender.com/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
      });
      
      const texto = await res.text();
      Swal.close();

      if (res.ok) {
        Swal.fire({
          title: '¡Aventurero Aceptado!',
          text: 'Tu ficha ha sido creada. Prepárate para entrar a la taberna.',
          icon: 'success',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#10b981', 
          timer: 2000, 
          timerProgressBar: true,
          willClose: () => {
            // ✨ EJECUTAMOS LA FUNCIÓN PARA CAMBIAR LA VISTA AL LOGIN
            if(irALogin) irALogin();
          }
        });
        
        setNombre(''); setEmail(''); setPassword('');
        
      } else {
        Swal.fire({
          title: 'Rechazo del Gremio',
          text: texto,
          icon: 'error',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#ef4444' 
        });
      }
    } catch (error) {
      Swal.close();
      Swal.fire({
        title: 'Error de Magia Oscura',
        text: 'No pudimos conectar con los servidores centrales.',
        icon: 'error',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl shadow-black relative overflow-hidden">
      <h2 className="text-xl font-black text-zinc-200 mb-8 text-center uppercase tracking-tight">Crear Cuenta</h2>
      
      <form onSubmit={manejarRegistro} className="space-y-5 relative z-10">
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

        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-widest text-xs mt-4">
          Forjar Cuenta
        </button>
      </form>
    </div>
  );
}

export default Registro;