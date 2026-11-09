import { useState, useEffect } from 'react';

import Swal from 'sweetalert2';
import { io } from 'socket.io-client';

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

import CelebracionCumpleanos from './components/CelebracionCumpleanos';

import SalonFama from './components/SalonFama';

import CriptaJuego from './components/DungeonCrawler/CriptaJuego';

import './App.css';



function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(JSON.parse(localStorage.getItem('usuario')));
  
  // 🏛️ ESTADOS GLOBALES DE COMUNIDADES / CLUBES
  const [clubes, setClubes] = useState([]);
  const [clubActivo, setClubActivo] = useState(null);
  
  // Maneja la navegación de los que no tienen sesión ('landing', 'login', 'registro')
  const [vistaInvitado, setVistaInvitado] = useState(() => {
    if (window.history.state?.tipo === 'vista-invitado' && window.history.state?.vistaInvitado) {
      return window.history.state.vistaInvitado;
    }
    return 'landing';
  }); 

  // Maneja la navegación interna ('eventos', 'mis-cronicas', 'admin', 'perfil:123', etc.)
  const [vistaActual, setVistaActual] = useState(() => {
    if (window.history.state?.vista) {
      return window.history.state.vista;
    }
    return 'eventos';
  });

  // ID de la mesa que debe abrirse si el usuario volvió atrás desde un perfil
  const [mesaActivaId, setMesaActivaId] = useState(() => {
    if (window.history.state?.partidaId) {
      return window.history.state.partidaId;
    }
    return null;
  });

  const [mostrarCumpleanos, setMostrarCumpleanos] = useState(false); 

  // Cambiar vista interna y registrar paso en el historial del navegador
  const cambiarVista = (nuevaVista, metadata = {}) => {
    setVistaActual(nuevaVista);
    if (metadata.partidaId) {
      setMesaActivaId(metadata.partidaId);
    }

    const payload = {
      tipo: 'vista-interna',
      vista: nuevaVista,
      partidaId: metadata.partidaId || null,
      ...metadata
    };

    window.history.pushState(payload, '');
  };

  // Cambiar vista de invitado y registrar paso en el historial del navegador
  const cambiarVistaInvitado = (nuevaVistaInvitado) => {
    setVistaInvitado(nuevaVistaInvitado);
    window.history.pushState({ tipo: 'vista-invitado', vistaInvitado: nuevaVistaInvitado }, '');
  };

  const manejarLogin = (usuario) => {
    setUsuarioLogueado(usuario);
    setVistaActual('eventos');
    setMesaActivaId(null);
    window.history.replaceState({ tipo: 'vista-interna', vista: 'eventos' }, '');

    // 🔒 REGLA: Si no es superadmin, forzar inmediatamente a su propio club registrado
    if (usuario && usuario.rol !== 'superadmin') {
      const idClub = usuario.club_id || 1;
      const clubEncontrado = clubes.find(c => c.id === idClub) || clubes.find(c => c.id === 1);
      if (clubEncontrado) {
        setClubActivo(clubEncontrado);
        localStorage.setItem('club_activo_id', clubEncontrado.id);
      }
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuarioLogueado(null);
    setVistaInvitado('landing'); 
    setVistaActual('eventos'); 
    setMesaActivaId(null);
    window.history.replaceState({ tipo: 'vista-invitado', vistaInvitado: 'landing' }, '');
  };


  // 🏛️ GESTIÓN Y RESOLUCIÓN DE COMUNIDAD ACTIVA
  const cargarClubes = async () => {
    try {
      const res = await fetch('/api/clubes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setClubes(data);
          resolverClubInicial(data);
        }
      }
    } catch (err) {
      console.error('Error al cargar comunidades:', err);
    }
  };

  const resolverClubInicial = async (listaClubes) => {
    if (!listaClubes || listaClubes.length === 0) return;

    // 🔒 REGLA ESTRICTA: SI EL USUARIO ESTÁ LOGUEADO Y NO ES SUPERADMIN,
    // SU SEDE ES ÚNICA Y OBLIGATORIAMENTE LA DE SU REGISTRO (usuario.club_id).
    // NO PUEDE CAMBIAR A OTRO CLUB NI USAR HISTORIAL PREVIO.
    if (usuarioLogueado && usuarioLogueado.rol !== 'superadmin') {
      const idClubUsuario = usuarioLogueado.club_id || 1;
      const clubUsuario = listaClubes.find(c => c.id === idClubUsuario) || listaClubes.find(c => c.id === 1) || listaClubes[0];
      setClubActivo(clubUsuario);
      localStorage.setItem('club_activo_id', clubUsuario.id);
      return;
    }

    const esSuperAdmin = usuarioLogueado?.rol === 'superadmin';

    // 1. URL Query parameter ?club=merlo-san-luis o ?club=2 (para superadmin o invitados)
    const urlParams = new URLSearchParams(window.location.search);
    const paramClub = urlParams.get('club');
    if (paramClub) {
      const paramLower = paramClub.toLowerCase();
      const encontrado = listaClubes.find(c => 
        (c.slug && c.slug.toLowerCase() === paramLower) || c.id.toString() === paramClub
      );
      if (encontrado) {
        setClubActivo(encontrado);
        if (esSuperAdmin) localStorage.setItem('club_activo_id', encontrado.id);
        return;
      }
    }

    // 2. LocalStorage guardado previamente (SOLO PARA SUPERADMIN)
    if (esSuperAdmin) {
      const guardadoId = localStorage.getItem('club_activo_id');
      if (guardadoId === 'todos') {
        setClubActivo({ id: 'todos', nombre: 'Todas las Comunidades', slug: 'todos', ciudad: 'Multiverso', provincia: 'Argentina' });
        return;
      }
      if (guardadoId) {
        const encontrado = listaClubes.find(c => c.id.toString() === guardadoId.toString());
        if (encontrado) {
          setClubActivo(encontrado);
          return;
        }
      }
      const clubSuper = listaClubes.find(c => c.id === (usuarioLogueado?.club_id || 1)) || listaClubes[0];
      setClubActivo(clubSuper);
      return;
    }

    // 3. Invitados no logueados: Detección automática por IP (geolocalización)
    try {
      const resGeo = await fetch('/api/clubes/detectar/geo');
      if (resGeo.ok) {
        const dataGeo = await resGeo.json();
        if (dataGeo.clubSugerido) {
          const coincidencia = listaClubes.find(c => c.id === dataGeo.clubSugerido.id);
          if (coincidencia) {
            setClubActivo(coincidencia);
            return;
          }
        }
      }
    } catch (e) {
      // Fallback silencioso
    }

    // 4. Fallback por defecto para invitados: Club 1 (La Pampa) o el primero disponible
    const defecto = listaClubes.find(c => c.id === 1) || listaClubes[0];
    setClubActivo(defecto);
  };

  const cambiarClubActivo = (nuevoClub) => {
    // 🛡️ SEGURIDAD: Solo el superadmin tiene permiso de cambiar de sede voluntariamente
    if (usuarioLogueado && usuarioLogueado.rol !== 'superadmin') {
      return;
    }
    setClubActivo(nuevoClub);
    if (nuevoClub) {
      localStorage.setItem('club_activo_id', nuevoClub.id);
    }
  };

  useEffect(() => {
    cargarClubes();

    const socket = io('/', { path: '/api/socket.io' });
    socket.on('actualizacion-clubes', () => {
      fetch('/api/clubes')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setClubes(data);
            setClubActivo(actual => {
              if (!actual || actual.id === 'todos') return actual;
              const act = data.find(c => c.id === actual.id);
              return act || actual;
            });
          }
        })
        .catch(err => console.error(err));
    });

    return () => socket.disconnect();
  }, [usuarioLogueado?.id, usuarioLogueado?.rol, usuarioLogueado?.club_id]);

  // 📱 ESCUCHAR EVENTO POPSTATE PARA SOPORTAR EL BOTÓN "ATRÁS" DEL CELULAR
  useEffect(() => {
    if (!window.history.state) {
      if (usuarioLogueado) {
        window.history.replaceState({ tipo: 'vista-interna', vista: vistaActual }, '');
      } else {
        window.history.replaceState({ tipo: 'vista-invitado', vistaInvitado: vistaInvitado }, '');
      }
    }

    const manejarPopState = (event) => {
      const state = event.state;
      if (!state) {
        if (usuarioLogueado) {
          setVistaActual('eventos');
          setMesaActivaId(null);
        } else {
          setVistaInvitado('landing');
        }
        return;
      }

      if (state.tipo === 'vista-invitado') {
        setVistaInvitado(state.vistaInvitado || 'landing');
      } else if (state.tipo === 'vista-interna') {
        setVistaActual(state.vista || 'eventos');
        setMesaActivaId(state.partidaId || null);
      } else if (state.tipo === 'modal-mesa') {
        setVistaActual('eventos');
        setMesaActivaId(state.partidaId || null);
      }
    };

    window.addEventListener('popstate', manejarPopState);
    return () => window.removeEventListener('popstate', manejarPopState);
  }, [usuarioLogueado]);

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

  }, [usuarioLogueado?.id, usuarioLogueado?.rol, usuarioLogueado?.club_id]);



  // 🎂 DETECTOR DE CUMPLEAÑOS DEL AVENTURERO

  useEffect(() => {

    if (!usuarioLogueado || !usuarioLogueado.fecha_nacimiento) return;



    try {

      const parts = usuarioLogueado.fecha_nacimiento.split('T')[0].split('-');

      if (parts.length >= 3) {

        const mesNac = parseInt(parts[1], 10);

        const diaNac = parseInt(parts[2], 10);



        // Fecha actual en Argentina (UTC-3)

        const hoyArg = new Date(Date.now() - 3 * 3600 * 1000);

        const hoyMes = hoyArg.getUTCMonth() + 1;

        const hoyDia = hoyArg.getUTCDate();

        const hoyAnio = hoyArg.getUTCFullYear();



        if (mesNac === hoyMes && diaNac === hoyDia) {

          const claveStorage = `cumple_celebrado_${usuarioLogueado.id}_${hoyAnio}_${hoyMes}_${hoyDia}`;

          const yaCelebradoHoy = sessionStorage.getItem(claveStorage);

          if (!yaCelebradoHoy) {

            setMostrarCumpleanos(true);

            sessionStorage.setItem(claveStorage, 'true');

          }

        }

      }

    } catch (err) {

      console.warn('Error al verificar cumpleaños:', err);

    }

  }, [usuarioLogueado?.id, usuarioLogueado?.fecha_nacimiento]);



  // 1. VISTA PARA USUARIOS NO LOGUEADOS
  if (!usuarioLogueado) {
    if (vistaInvitado === 'landing') {
      return <Landing irALogin={() => cambiarVistaInvitado('login')} />;
    }

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 py-12 relative overflow-y-auto">
        
        {/* Botón para volver al inicio */}
        <button 
          onClick={() => {
            if (window.history.length > 1 && vistaInvitado !== 'landing') {
              window.history.back();
            } else {
              cambiarVistaInvitado('landing');
            }
          }}
          className="fixed top-6 left-6 md:top-8 md:left-8 text-zinc-400 hover:text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all hover:scale-105 z-20 bg-zinc-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-zinc-800 shadow-xl cursor-pointer"
        >
          <span className="text-sm font-black">&larr;</span> Volver al Inicio
        </button>

        {vistaInvitado === 'registro' ? (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Registro irALogin={() => cambiarVistaInvitado('login')} clubActivo={clubActivo} clubes={clubes} />
            
            <p className="text-center mt-6 text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
              {"\u00bfYa eres miembro? "}
              <button 
                onClick={() => cambiarVistaInvitado('login')} 
                className="text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer transition-colors font-black ml-1"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <Login alLoguearse={manejarLogin} />
            <p className="text-center mt-6 text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
              {"\u00bfNo tienes cuenta? "}
              <button 
                onClick={() => cambiarVistaInvitado('registro')} 
                className="text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer transition-colors font-black ml-1"
              >
                Regístrate aquí
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
        setVista={cambiarVista}
        clubActivo={clubActivo}
        setClubActivo={cambiarClubActivo}
        clubes={clubes}
      />

      <main className="container mx-auto pb-20 relative z-0">
        {vistaActual === 'eventos' && (
          <Eventos 
            setVista={cambiarVista} 
            mesaActivaId={mesaActivaId} 
            setMesaActivaId={setMesaActivaId}
            clubActivo={clubActivo}
            setClubActivo={cambiarClubActivo}
            clubes={clubes}
          />
        )}
        {vistaActual === 'mis-cronicas' && <MisCronicas alActualizarUsuario={setUsuarioLogueado} clubActivo={clubActivo} />}
        {vistaActual === 'admin' && <PanelAdmin setVista={cambiarVista} clubActivo={clubActivo} clubes={clubes} />}
        {vistaActual.startsWith('perfil:') && (
          <PerfilPublico 
            usuarioId={vistaActual.split(':')[1]} 
            clubActivo={clubActivo}
            volver={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                cambiarVista('eventos');
              }
            }} 
          />
        )}
        {vistaActual === 'buzon' && <BuzonAdmin usuarioLogueado={usuarioLogueado} />}
        {vistaActual === 'salon-fama' && (
          <SalonFama 
            clubActivo={clubActivo}
            cambiarVista={(v, params) => { 
              if (v === 'perfilPublico') cambiarVista(`perfil:${params.id}`);
            }} 
          />
        )}
        {vistaActual === 'cripta' && (!clubActivo || clubActivo.id === 1) && (
          <CriptaJuego 
            usuarioLogueado={usuarioLogueado} 
            alActualizarUsuario={setUsuarioLogueado}
            volver={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                cambiarVista('eventos');
              }
            }} 
          />
        )}
      </main>
      <BuzonFlotante />

      {/* 🎈 CELEBRACIÓN DE CUMPLEAÑOS CON GLOBOS Y MENSAJE */}
      {mostrarCumpleanos && (
        <CelebracionCumpleanos 
          usuario={usuarioLogueado}
          onCerrar={() => setMostrarCumpleanos(false)}
        />
      )}
    </div>
  );
}

export default App;
