import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchProtegido } from './utils/api';
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
import CriptaJuego from './components/DungeonCrawler/CriptaJuego';
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

  const pedirFechaNacimiento = async (usuarioActual) => {
    const { value: fechaIngresada } = await Swal.fire({
      title: '🎂 Requisito del Gremio: Tu Edad',
      html: `
        <div style="text-align: left; font-size: 0.9rem; color: #a1a1aa; line-height: 1.5; margin-bottom: 1rem;">
          <p style="margin-bottom: 0.75rem;">
            ¡Saludos, aventurero! Con la incorporación de <b style="color: #fff;">Mesas Exclusivas (+18 y para Menores)</b>, 
            el Gremio requiere que registres tu <b>fecha de nacimiento</b> de forma obligatoria para clasificar tu participación en los eventos.
          </p>
          <label style="display: block; font-size: 0.75rem; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
            Ingresa tu Fecha de Nacimiento:
          </label>
        </div>
      `,
      input: 'date',
      inputAttributes: {
        max: new Date().toISOString().split('T')[0],
        min: '1920-01-01',
        style: 'color-scheme: dark; font-weight: 700;'
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: 'Registrar en mi Ficha',
      confirmButtonColor: '#10b981',
      background: '#09090b',
      color: '#fff',
      preConfirm: (val) => {
        if (!val) {
          Swal.showValidationMessage('Debes seleccionar una fecha de nacimiento.');
          return false;
        }
        const hoy = new Date();
        const nac = new Date(val);
        let e = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
        if (e < 6 || e > 110 || isNaN(e)) {
          Swal.showValidationMessage('Por favor ingresa una fecha válida (edad entre 6 y 110 años).');
          return false;
        }
        return { fecha: val, edad: e };
      }
    });

    if (fechaIngresada) {
      try {
        const res = await fetchProtegido('/api/usuarios/fecha-nacimiento', {
          method: 'PUT',
          body: JSON.stringify({ fecha_nacimiento: fechaIngresada.fecha })
        });
        if (res.ok) {
          const uActualizado = { 
            ...(usuarioActual || usuarioLogueado), 
            fecha_nacimiento: fechaIngresada.fecha, 
            edad: fechaIngresada.edad 
          };
          localStorage.setItem('usuario', JSON.stringify(uActualizado));
          setUsuarioLogueado(uActualizado);

          Swal.fire({
            title: '¡Ficha Actualizada!',
            text: `Se ha registrado tu edad (${fechaIngresada.edad} años). ${fechaIngresada.edad >= 18 ? 'Acceso habilitado a mesas +18 y ATP.' : 'Acceso habilitado a mesas para menores y ATP.'}`,
            icon: 'success',
            background: '#09090b',
            color: '#fff',
            confirmButtonColor: '#10b981'
          });
        } else {
          const errData = await res.json();
          Swal.fire({
            title: 'Error',
            text: errData.error || 'No se pudo guardar la fecha.',
            icon: 'error',
            background: '#09090b',
            color: '#fff'
          }).then(() => pedirFechaNacimiento(usuarioActual));
        }
      } catch (err) {
        if (err !== 'Sesión expirada') {
          console.error(err);
          pedirFechaNacimiento(usuarioActual);
        }
      }
    }
  };

  useEffect(() => {
    if (!usuarioLogueado) return;

    const verificarFechaNacimiento = async () => {
      try {
        const res = await fetchProtegido('/api/usuarios/yo');
        if (res.ok) {
          const datos = await res.json();
          if (datos.fecha_nacimiento) {
            if (!usuarioLogueado.fecha_nacimiento || usuarioLogueado.fecha_nacimiento !== datos.fecha_nacimiento) {
              const uActualizado = { ...usuarioLogueado, fecha_nacimiento: datos.fecha_nacimiento, edad: datos.edad };
              localStorage.setItem('usuario', JSON.stringify(uActualizado));
              setUsuarioLogueado(uActualizado);
            }
          } else {
            pedirFechaNacimiento(usuarioLogueado);
          }
        }
      } catch (e) {
        if (e !== 'Sesión expirada') console.error(e);
      }
    };

    verificarFechaNacimiento();
  }, [usuarioLogueado?.id]);

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
        {vistaActual === 'cripta' && (
          <CriptaJuego 
            usuarioLogueado={usuarioLogueado} 
            alActualizarUsuario={setUsuarioLogueado}
            volver={() => setVistaActual('eventos')} 
          />
        )}
      </main>
      <BuzonFlotante />
    </div>
  );
}

export default App;
