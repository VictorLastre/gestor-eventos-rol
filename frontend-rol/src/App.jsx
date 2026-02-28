import { useState } from 'react';
import Landing from './components/Landing'; // ✨ IMPORTAMOS LA LANDING
import Login from './components/Login';
import Registro from './components/Registro';
import Eventos from './components/Eventos';
import MisCronicas from './components/MisCronicas';
import Navbar from './components/Navbar'; 
import './App.css';

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(JSON.parse(localStorage.getItem('usuario')));
  
  // ✨ NUEVO ESTADO: Maneja la navegación de los que no tienen sesión ('landing', 'login', 'registro')
  const [vistaInvitado, setVistaInvitado] = useState('landing'); 
  const [vistaActual, setVistaActual] = useState('eventos'); 

  const manejarLogin = (usuario) => {
    setUsuarioLogueado(usuario);
    setVistaActual('eventos');
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuarioLogueado(null);
    setVistaInvitado('landing'); // Volvemos a la landing al salir
    setVistaActual('eventos'); 
  };

  // 1. VISTA PARA USUARIOS NO LOGUEADOS
  if (!usuarioLogueado) {
    // Si la vista es la landing, mostramos la portada
    if (vistaInvitado === 'landing') {
      return <Landing irALogin={() => setVistaInvitado('login')} />;
    }

    // Si la vista es login o registro, mostramos el contenedor oscuro
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative">
        
        {/* Botón para volver al inicio */}
        <button 
          onClick={() => setVistaInvitado('landing')}
          className="absolute top-8 left-8 text-zinc-500 hover:text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors"
        >
          <span>←</span> Volver al Inicio
        </button>

        <div className="text-center mb-10">
          <span className="text-6xl mb-4 block animate-bounce">⚔️</span>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            Asociación de Rol <span className="text-emerald-500">La Pampa</span>
          </h1>
        </div>

        {vistaInvitado === 'registro' ? (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Registro irALogin={() => setVistaInvitado('login')} />
            
            <p className="text-center mt-6 text-zinc-500 text-sm font-bold uppercase tracking-widest">
              ¿Ya eres miembro? {' '}
              <button 
                onClick={() => setVistaInvitado('login')} 
                className="text-emerald-500 hover:underline cursor-pointer"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Login alLoguearse={manejarLogin} />
            <p className="text-center mt-6 text-zinc-500 text-sm font-bold uppercase tracking-widest">
              ¿No tienes cuenta? {' '}
              <button 
                onClick={() => setVistaInvitado('registro')} 
                className="text-emerald-500 hover:underline cursor-pointer"
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
    <div className="min-h-screen bg-zinc-950 text-left">
      <Navbar 
        usuario={usuarioLogueado} 
        alCerrarSesion={cerrarSesion} 
        setVista={setVistaActual} 
      />

      <main className="container mx-auto pb-20">
        {vistaActual === 'eventos' ? (
          <Eventos />
        ) : (
          <MisCronicas alActualizarUsuario={setUsuarioLogueado} />
        )}
      </main>
    </div>
  );
}

export default App;