import { useState } from 'react';
import Landing from './components/Landing'; 
import Login from './components/Login';
import Registro from './components/Registro';
import Eventos from './components/Eventos';
import MisCronicas from './components/MisCronicas';
import Navbar from './components/Navbar'; 
import PanelAdmin from './components/PanelAdmin'; // ✨ IMPORTAMOS EL CENTRO DE MANDO
import './App.css';

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(JSON.parse(localStorage.getItem('usuario')));
  
  // Maneja la navegación de los que no tienen sesión ('landing', 'login', 'registro')
  const [vistaInvitado, setVistaInvitado] = useState('landing'); 
  // Maneja la navegación interna ('eventos', 'mis-cronicas', 'admin')
  const [vistaActual, setVistaActual] = useState('eventos'); 

  const manejarLogin = (usuario) => {
    setUsuarioLogueado(usuario);
    setVistaActual('eventos');
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuarioLogueado(null);
    setVistaInvitado('landing'); 
    setVistaActual('eventos'); 
  };

  // 1. VISTA PARA USUARIOS NO LOGUEADOS
  if (!usuarioLogueado) {
    if (vistaInvitado === 'landing') {
      return <Landing irALogin={() => setVistaInvitado('login')} />;
    }

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative">
        
        {/* Botón para volver al inicio */}
        <button 
          onClick={() => setVistaInvitado('landing')}
          className="absolute top-8 left-8 text-zinc-500 hover:text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors z-10"
        >
          <span>←</span> Volver al Inicio
        </button>

        {vistaInvitado === 'registro' ? (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Registro irALogin={() => setVistaInvitado('login')} />
            
            <p className="text-center mt-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              ¿Ya eres miembro? {' '}
              <button 
                onClick={() => setVistaInvitado('login')} 
                className="text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Login alLoguearse={manejarLogin} />
            <p className="text-center mt-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              ¿No tienes cuenta? {' '}
              <button 
                onClick={() => setVistaInvitado('registro')} 
                className="text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        )}
      </div>
    );
  }

  // 2. VISTA PARA USUARIOS LOGUEADOS
  return (
    <div className="min-h-screen bg-zinc-950 text-left overflow-x-hidden">
      <Navbar 
        usuario={usuarioLogueado} 
        alCerrarSesion={cerrarSesion} 
        setVista={setVistaActual} 
      />

      {/* ✨ REEMPLAZAMOS EL TERNARIO POR RENDERIZADO CONDICIONAL LIMPIO */}
      <main className="container mx-auto pb-20 relative z-0">
        {vistaActual === 'eventos' && <Eventos />}
        {vistaActual === 'mis-cronicas' && <MisCronicas alActualizarUsuario={setUsuarioLogueado} />}
        {vistaActual === 'admin' && <PanelAdmin />}
      </main>
    </div>
  );
}

export default App;