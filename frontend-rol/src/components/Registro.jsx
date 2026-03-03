import { useState } from 'react';
import Swal from 'sweetalert2'; 

function Registro({ irALogin }) {
  const [nombre, setNombre] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState(''); // ✨ NUEVO ESTADO
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false); 

  const manejarRegistro = async (e) => {
    e.preventDefault();
    
    Swal.fire({
      title: 'Tu nombre está siendo registrado...',
      text: 'Los escribas te están registrando en el Gremio.',
      background: '#09090b',
      color: '#fff',
      allowOutsideClick: false,
      customClass: {
        popup: 'border border-zinc-800 rounded-[2rem]'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch('https://gestor-eventos-rol.onrender.com/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✨ INCLUIMOS nombre_completo EN EL ENVÍO
        body: JSON.stringify({ nombre, nombre_completo: nombreCompleto, email, password })
      });
      
      const datos = await res.json();
      Swal.close();

      if (res.ok) {
        Swal.fire({
          title: '¡Aventurero Aceptado!',
          text: 'Tu ficha ha sido creada. Prepárate para entrar a la taberna.',
          icon: 'success',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#10b981', 
          timer: 2000, 
          timerProgressBar: true,
          customClass: {
            popup: 'border border-emerald-500/30 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.1)]'
          },
          willClose: () => {
            if(irALogin) irALogin();
          }
        });
        
        setNombre(''); setNombreCompleto(''); setEmail(''); setPassword('');
        
      } else {
        Swal.fire({
          title: 'Rechazo del Gremio',
          text: datos.error || 'Error en el registro',
          icon: 'warning',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#f59e0b',
          customClass: {
            popup: 'border border-amber-500/30 rounded-[2rem]'
          }
        });
      }
    } catch (error) {
      Swal.close();
      Swal.fire({
        title: 'Error de Magia Oscura',
        text: 'No pudimos conectar con los servidores centrales.',
        icon: 'error',
        background: '#09090b',
        color: '#fff',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'border border-red-500/30 rounded-[2rem]'
        }
      });
    }
  };

  return (
    <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
      
      {/* Efectos de luz interna */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>

      <h2 className="text-sm font-black text-zinc-400 mb-10 text-center uppercase tracking-[0.3em] border-b border-zinc-800 pb-4">
          Forjar Nueva Identidad
      </h2>
      
      <form onSubmit={manejarRegistro} className="space-y-5 relative z-10">
        
        {/* NICKNAME / NOMBRE DE HÉROE */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Apodo del Héroe (Nickname)
          </label>
          <input 
            type="text" 
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-5 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner font-bold"
            placeholder="Ej: Sterbern"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        {/* ✨ NOMBRE COMPLETO (NUEVO CAMPO) */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Nombre Real Completo
          </label>
          <input 
            type="text" 
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-5 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner italic"
            placeholder="Ej: Víctor Lastre"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            required
          />
        </div>

        {/* EMAIL */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Correo Electrónico
          </label>
          <input 
            type="email" 
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 px-5 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner font-mono text-sm"
            placeholder="aventurero@gremio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* CONTRASEÑA */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Contraseña Segura
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
              title={mostrarPassword ? "Ocultar runas" : "Revelar runas"}
            >
              {mostrarPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* BOTÓN SUBMIT */}
        <button 
          type="submit" 
          className="group relative w-full overflow-hidden rounded-2xl mt-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:scale-105 transition-transform duration-500"></div>
          <div className="relative py-5 font-black text-white text-xs uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3">
              <span>📜</span> Sellar Contrato
          </div>
        </button>

        <div className="mt-8 text-center">
            <button 
              type="button" 
              onClick={irALogin}
              className="text-[10px] text-zinc-500 hover:text-emerald-400 font-bold uppercase tracking-widest transition-colors"
            >
                ¿Ya eres miembro? Volver al Portal
            </button>
        </div>
      </form>
    </div>
  );
}

export default Registro;