import { useState } from 'react';
import Landing from './components/Landing'; 
import Login from './components/Login';
import Registro from './components/Registro';
import Eventos from './components/Eventos';
import MisCronicas from './components/MisCronicas';
import Navbar from './components/Navbar'; 
import PanelAdmin from './components/PanelAdmin'; 
import PerfilPublico from './components/PerfilPublico'; 
import BuzonAdmin from './components/BuzonAdmin';
import BuzonFlotante from './components/BuzonFlotante';
import SalonFama from './components/SalonFama';
import './App.css';

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(JSON.parse(localStorage.getItem('usuario')));
  
  // Maneja la navegaciÃ³n de los que no tienen sesiÃ³n ('landing', 'login', 'registro')
  const [vistaInvitado, setVistaInvitado] = useState('landing'); 
  // Maneja la navegaciÃ³n interna ('eventos', 'mis-cronicas', 'admin')
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
        
        {/* BotÃ³n para volver al inicio */}
        <button 
          onClick={() => setVistaInvitado('landing')}
          className="absolute top-8 left-8 text-zinc-500 hover:text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors z-10"
        >
          <span>â†</span> Volver al Inicio
        </button>

        {vistaInvitado === 'registro' ? (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Registro irALogin={() => setVistaInvitado('login')} />
            
            <p className="text-center mt-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              Â¿Ya eres miembro? {' '}
              <button 
                onClick={() => setVistaInvitado('login')} 
                className="text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
              >
                Inicia sesiÃ³n
              </button>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Login alLoguearse={manejarLogin} />
            <p className="text-center mt-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              Â¿No tienes cuenta? {' '}
              <button 
                onClick={() => setVistaInvitado('registro')} 
                className="text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
              >
                RegÃ­strate aquÃ­
              </button>
            </p>
          </div>
        )}
        <BuzonFlotante />
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

      {/* âœ¨ REEMPLAZAMOS EL TERNARIO POR RENDERIZADO CONDICIONAL LIMPIO */}
      <main className="container mx-auto pb-20 relative z-0">
        {vistaActual === 'eventos' && <Eventos setVista={setVistaActual} />}
        {vistaActual === 'mis-cronicas' && <MisCronicas alActualizarUsuario={setUsuarioLogueado} />}
        {vistaActual === 'admin' && <PanelAdmin setVista={setVistaActual} />}
        {vistaActual.startsWith('perfil:') && (
          <PerfilPublico 
            usuarioId={vistaActual.split(':')[1]} 
            volver={() => setVistaActual('eventos')} 
          />
        )}
        {vistaActual === 'buzon' && <BuzonAdmin usuarioLogueado={usuarioLogueado} />}
        {vistaActual === 'salon-fama' && <SalonFama cambiarVista={(v, params) => { if(v === 'perfilPublico') setVistaActual(`perfil:${params.id}`) }} />}
      </main>
      <BuzonFlotante />
    </div>
  );
}

export default App;
