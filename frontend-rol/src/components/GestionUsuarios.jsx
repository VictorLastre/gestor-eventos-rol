import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { fetchProtegido } from '../utils/api'; 
import * as XLSX from 'xlsx'; 
import CertificadoBase from '../assets/CertificadoBase.png'; 
import { io } from 'socket.io-client';
// ✨ IMPORTAMOS EL NUEVO COMPONENTE DE AVATARES
import AvatarUsuario from '../components/AvatarUsuario';

function GestionUsuarios() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [votaciones, setVotaciones] = useState([]); 
  const [eventos, setEventos] = useState([]); 
  const [pestanaActiva, setPestanaActiva] = useState('peticiones');
  const [filtroRol, setFiltroRol] = useState('todos'); 
  const [busqueda, setBusqueda] = useState('');
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [paginaCenso, setPaginaCenso] = useState(1);
  const usuariosPorPagina = 10; 

  const cargarDatosPrincipales = () => {
    fetchProtegido('/api/usuarios/solicitudes-dm')
      .then(res => res.json())
      .then(datos => setSolicitudes(Array.isArray(datos) ? datos : []))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });

    fetchProtegido('/api/usuarios/votaciones/activas')
      .then(res => res.json())
      .then(datos => setVotaciones(Array.isArray(datos) ? datos : []))
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });

    fetchProtegido('/api/eventos')
      .then(res => res.json())
      .then(datos => setEventos(Array.isArray(datos) ? datos : []))
      .catch(err => console.error(err));
  };

  const cargarCenso = () => {
    fetchProtegido('/api/usuarios?limit=1000')
      .then(res => res.json())
      .then(data => {
        const usuarios = data.datos ? data.datos : (Array.isArray(data) ? data : []);
        setTodosLosUsuarios(usuarios);
      })
      .catch(err => { if (err !== 'Sesión expirada') console.error(err); });
  };

  useEffect(() => { 
    cargarDatosPrincipales(); 
    cargarCenso();

    // ✨ Conexión a socket usando ruta relativa
    const socket = io('/', { path: '/api/socket.io' });

    socket.on('actualizacion-solicitudes', cargarDatosPrincipales);
    socket.on('actualizacion-senado', cargarDatosPrincipales);
    socket.on('actualizacion-usuarios', cargarCenso);
    socket.on('actualizacion-sistemas', cargarDatosPrincipales);

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    setPaginaCenso(1);
  }, [filtroRol, busqueda]);

  const exportarLogistica = async () => {
    if (eventos.length === 0) return Swal.fire({ title: 'Error', text: 'No hay eventos registrados.', icon: 'error', background: '#09090b', color: '#fff' });

    const hoyObj = new Date();
    const fechaHoyLocal = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;

    const eventosExportables = eventos.filter(e => e.fecha?.startsWith(fechaHoyLocal) && e.estado !== 'Suspendido' && e.estado !== 'Finalizado');

    if (eventosExportables.length === 0) {
      return Swal.fire({ title: 'El Tablón está en calma', text: 'No hay jornadas activas para hoy.', icon: 'info', background: '#09090b', color: '#fff' });
    }

    const { value: eventoId } = await Swal.fire({
      title: '📊 Reporte Logístico',
      input: 'select',
      inputOptions: Object.fromEntries(eventosExportables.map(e => [e.id, e.nombre])),
      background: '#09090b', color: '#fff', confirmButtonColor: '#10b981'
    });

    if (eventoId) {
      try {
        const res = await fetchProtegido(`/api/partidas/reporte-logistico/${eventoId}`);
        const datos = await res.json();
        const filas = datos.map(m => ({
          "ESTADO": m.es_dm_nuevo ? "⚠️ NUEVO" : "VETERANO",
          "DIRECTOR": (m.nombre_completo || m.dm_nombre).toUpperCase(), 
          "TURNO": m.turno, "MESA": m.mesa, "SISTEMA": m.sistema,
          "JUGADORES": m.jugadores || "Sin inscritos", "MATERIALES": m.materiales_pedidos || "✅ NADA"
        }));
        const hoja = XLSX.utils.json_to_sheet(filas);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Planilla");
        XLSX.writeFile(libro, `Logistica_${eventoId}.xlsx`);
      } catch (e) { console.error(e); }
    }
  };

  const generarCertificado = (idDM, nombreDM, nombreReal) => {
    const nombreAFijar = nombreReal || nombreDM;

    Swal.fire({
      title: 'Forjando Certificado...',
      text: `Preparando el pergamino oficial para ${nombreAFijar}`,
      background: '#09090b', color: '#fff', allowOutsideClick: false,
      customClass: { popup: 'border border-amber-500/30 rounded-[2rem]' },
      didOpen: () => Swal.showLoading()
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imagen = new Image();
    
    imagen.src = CertificadoBase;
    
    imagen.onload = async () => {
      canvas.width = imagen.width;
      canvas.height = imagen.height;
      ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
      
      ctx.font = 'bold 80px "Georgia", serif'; 
      ctx.fillStyle = '#111827'; 
      ctx.textAlign = 'center';
      const centroX = canvas.width / 2;
      const posicionY_Nombre = canvas.height * 0.55; 
      ctx.fillText(nombreAFijar.toUpperCase(), centroX, posicionY_Nombre);
      
      const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
      const fechaHoy = new Date().toLocaleDateString('es-ES', opcionesFecha);
      ctx.font = 'italic 40px "Georgia", serif';
      ctx.fillStyle = '#374151'; 
      const posicionY_Fecha = canvas.height * 0.75; 
      ctx.fillText(`Otorgado en Santa Rosa, a ${fechaHoy}`, centroX, posicionY_Fecha);
      
      const urlImagen = canvas.toDataURL('image/png');
      const enlaceDescarga = document.createElement('a');
      enlaceDescarga.href = urlImagen;
      enlaceDescarga.download = `Certificado_DM_${nombreAFijar.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(enlaceDescarga);
      enlaceDescarga.click();
      document.body.removeChild(enlaceDescarga);

      try {
        await fetchProtegido(`/api/usuarios/${idDM}/certificado-entregado`, { method: 'PUT' });
        cargarCenso(); 
      } catch (e) {
        console.error("No se pudo actualizar el estado del DM:", e);
      }

      Swal.close();
      Swal.fire({
        title: '¡Pergamino Entregado!',
        text: `${nombreAFijar} ahora es oficialmente un DM Veterano del Gremio.`,
        icon: 'success',
        background: '#09090b', color: '#fff', confirmButtonColor: '#10b981',
        customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' }
      });
    };

    imagen.onerror = () => {
      Swal.close();
      Swal.fire({
        title: 'Error de Tinta',
        text: 'No se encontró la plantilla "CertificadoBase.png" en la carpeta assets.',
        icon: 'error',
        background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444',
        customClass: { popup: 'border border-red-500/30 rounded-[2rem]' }
      });
    };
  };

  const promoverUsuario = async (id, nombre) => {
    const result = await Swal.fire({
      title: 'Forjar un nuevo Director',
      text: `¿Ascender a ${nombre.toUpperCase()} al rango de Dungeon Master?`,
      icon: 'warning',
      showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#f59e0b', confirmButtonText: '🪄 Ascender',
      customClass: { popup: 'border border-amber-500/30 rounded-[2rem]' }
    });
    if (result.isConfirmed) {
      const res = await fetchProtegido(`/api/usuarios/${id}/promover`, { method: 'PUT' });
      if (res.ok) { 
        cargarDatosPrincipales(); 
        cargarCenso(); 
        Swal.fire({ 
          title: '¡Ascenso Concedido!', 
          text: 'El gremio le notificará cuando abra su primera mesa para generarle el certificado.', 
          icon: 'success', 
          background: '#09090b', color: '#fff', 
          customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' } 
        }); 
      }
    }
  };

  const rechazarUsuario = async (id, nombre) => {
    const result = await Swal.fire({
      title: 'Denegar Petición',
      text: `¿Estás seguro de rechazar la solicitud de ${nombre.toUpperCase()}?`,
      icon: 'error',
      showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444', confirmButtonText: '❌ Rechazar Petición',
      customClass: { popup: 'border border-red-500/30 rounded-[2rem]' }
    });
    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/usuarios/${id}/rechazar-dm`, { method: 'PUT' });
        if (res.ok) { Swal.fire({ title: 'Petición Rechazada', icon: 'success', background: '#09090b', color: '#fff', customClass: { popup: 'border border-zinc-700 rounded-[2rem]' } }); cargarDatosPrincipales(); cargarCenso(); }
      } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
    }
  };

  const cambiarRolDirecto = async (id, nombre, nuevoRol) => {
    const result = await Swal.fire({
      title: 'Alterar Rango',
      text: `¿Convertir a ${nombre} en ${nuevoRol === 'dm' ? 'Dungeon Master' : 'Jugador'}?`,
      icon: 'question',
      showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#0ea5e9', confirmButtonText: 'Sí, aplicar',
      customClass: { popup: 'border border-zinc-800 rounded-[2rem]' }
    });
    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/usuarios/${id}/rol`, { method: 'PUT', body: JSON.stringify({ rol: nuevoRol }) });
        if (res.ok) { Swal.fire({ title: '¡Rango Alterado!', icon: 'success', background: '#09090b', color: '#fff', customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' } }); cargarCenso(); }
      } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
    }
  };

  const proponerAdmin = async (id, nombre) => {
    const result = await Swal.fire({
      title: '👑 Convocar al Senado',
      text: `¿Proponer a ${nombre} para formar parte de los Administradores?`,
      icon: 'info',
      showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#f59e0b', confirmButtonText: 'Sí, abrir moción',
      customClass: { popup: 'border border-amber-500/30 rounded-[2rem]' }
    });
    if (result.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/usuarios/${id}/proponer-admin`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) { Swal.fire({ title: 'Senado Convocado', text: data.mensaje, icon: 'success', background: '#09090b', color: '#fff', customClass: { popup: 'border border-amber-500/30 rounded-[2rem]' } }); setPestanaActiva('senado'); cargarDatosPrincipales(); } 
        else { Swal.fire({ title: 'Aviso del Consejo', text: data.error, icon: 'warning', background: '#09090b', color: '#fff', customClass: { popup: 'border border-red-500/30 rounded-[2rem]' } }); }
      } catch (e) { if (e !== 'Sesión expirada') console.error(e); }
    }
  };

  const emitirVoto = async (votacionId, candidatoNombre, voto) => {
    const res = await fetchProtegido(`/api/usuarios/votaciones/${votacionId}/votar`, {
      method: 'POST',
      body: JSON.stringify({ voto })
    });
    if (res.ok) { cargarDatosPrincipales(); cargarCenso(); Swal.fire({ title: 'Voto Registrado', icon: 'info', background: '#09090b', color: '#fff', customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' } }); }
  };

  const aplicarHardReset = async (usuario) => {
    const confirmacion = await Swal.fire({
      title: '¿Forzar Contraseña?',
      html: `Estás a punto de borrar la contraseña de <b class="text-emerald-400">${usuario.nombre}</b>.<br/><br/>Se le asignará una contraseña temporal por defecto.`,
      icon: 'warning',
      showCancelButton: true,
      background: '#09090b', color: '#fff',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, aplicar Hard Reset',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'border border-red-500/30 rounded-[2rem]' }
    });

    if (confirmacion.isConfirmed) {
      try {
        const res = await fetchProtegido(`/api/usuarios/${usuario.id}/hard-reset`, {
          method: 'PUT'
        });
        
        const data = await res.json();

        if (res.ok) {
          Swal.fire({
            title: '¡Magia Aplicada!',
            html: `La nueva contraseña temporal para el usuario es:<br/><br/><b class="text-2xl text-emerald-500 font-mono bg-black p-4 rounded-xl border border-zinc-800">${data.temporal}</b><br/><br/><span class="text-sm text-zinc-400">Copia esta contraseña y entrégasela al aventurero para que pueda entrar y cambiarla en su perfil.</span>`,
            icon: 'success',
            background: '#09090b', color: '#fff',
            confirmButtonColor: '#10b981',
            customClass: { popup: 'border border-emerald-500/30 rounded-[2rem]' }
          });
        } else {
          Swal.fire({ title: 'Error', text: data.error, icon: 'error', background: '#09090b', color: '#fff', customClass: { popup: 'border border-red-500/30 rounded-[2rem]' } });
        }
      } catch (error) {
        Swal.fire({ title: 'Error', text: 'El servidor no responde.', icon: 'error', background: '#09090b', color: '#fff' });
      }
    }
  };

  const jerarquiaRoles = { admin: 1, dm: 2, jugador: 3 };

  const usuariosProcesados = todosLosUsuarios
    .filter(user => {
      const coincideRol = filtroRol === 'todos' || user.rol === filtroRol;
      const busquedaMinus = busqueda.toLowerCase();
      const coincideBusqueda = 
        user.nombre.toLowerCase().includes(busquedaMinus) || 
        (user.nombre_completo && user.nombre_completo.toLowerCase().includes(busquedaMinus));
      
      return coincideRol && coincideBusqueda;
    })
    .sort((a, b) => jerarquiaRoles[a.rol] - jerarquiaRoles[b.rol]);

  const totalPaginas = Math.ceil(usuariosProcesados.length / usuariosPorPagina) || 1;
  const startIndex = (paginaCenso - 1) * usuariosPorPagina;
  const usuariosPaginados = usuariosProcesados.slice(startIndex, startIndex + usuariosPorPagina);


  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button onClick={() => setPestanaActiva('peticiones')} className={`flex items-center gap-2 px-4 md:px-6 py-3 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all rounded-xl ${pestanaActiva === 'peticiones' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          🛡️ Peticiones DM {solicitudes.length > 0 && <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-[9px]">{solicitudes.length}</span>}
        </button>
        <button onClick={() => setPestanaActiva('censo')} className={`flex items-center gap-2 px-4 md:px-6 py-3 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all rounded-xl ${pestanaActiva === 'censo' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          📜 Registro Gremial
        </button>
        <button onClick={() => setPestanaActiva('senado')} className={`flex items-center gap-2 px-4 md:px-6 py-3 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all rounded-xl ${pestanaActiva === 'senado' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          🏛️ Senado {votaciones.length > 0 && <span className="bg-white text-amber-600 px-2 py-0.5 rounded-full text-[9px] animate-pulse">{votaciones.length}</span>}
        </button>      
      </div>

      {pestanaActiva === 'peticiones' && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-12 h-12 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-2xl border border-purple-500/20 text-xl">🛡️</div>
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Aspirantes a Director</h3>
           </div>
           {solicitudes.length === 0 ? (
             <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-10 md:p-20 text-center text-zinc-700 font-black uppercase tracking-[0.3em] text-xs">No hay peticiones en el tablón</div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {solicitudes.map(user => (
                 <div key={user.id} className="bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-purple-500/30 group">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      {/* ✨ AVATAR INVOCADO AQUÍ */}
                      <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800 group-hover:border-purple-500/50 transition-colors overflow-hidden">
                        <AvatarUsuario nombre={user.nombre} tamaño={56} variante="beam" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg md:text-xl font-black text-white tracking-tighter uppercase italic truncate">{user.nombre}</p>
                        <p className="text-xs text-zinc-500 font-mono italic truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <button onClick={() => rechazarUsuario(user.id, user.nombre)} className="flex-1 sm:flex-none bg-zinc-800 text-zinc-500 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all whitespace-nowrap">✕ Denegar</button>
                      <button onClick={() => promoverUsuario(user.id, user.nombre)} className="flex-1 sm:flex-none bg-amber-500 text-black py-3 px-4 md:px-6 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap">🪄 Ascender</button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {pestanaActiva === 'censo' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-2xl border border-emerald-500/20 text-xl">📜</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Censo del Gremio</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={exportarLogistica} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3.5 rounded-2xl text-[9px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-950/20">📊 Exportar Logística</button>
              
              <div className="flex gap-1 bg-zinc-950 border border-zinc-800 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide">
                {['todos', 'admin', 'dm', 'jugador'].map(rol => (
                  <button 
                    key={rol} 
                    onClick={() => setFiltroRol(rol)} 
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filtroRol === rol ? 'bg-zinc-800 text-emerald-400 shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {rol === 'todos' ? 'Todos' : rol === 'admin' ? '👑 Admins' : rol === 'dm' ? '🛡️ DMs' : '⚔️ Jugadores'}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:flex-none">
                <input type="text" placeholder="Buscar héroe..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-white text-xs font-bold rounded-2xl py-3.5 pl-10 pr-4 w-full sm:w-56 focus:border-emerald-500 outline-none transition-all" />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">🔍</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-[2rem] md:rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-950/50 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black border-b border-zinc-800">
                    <th className="p-4 md:p-6 whitespace-nowrap">Héroe / Identidad Real</th>
                    <th className="p-4 md:p-6 hidden sm:table-cell whitespace-nowrap">Rango Actual</th>
                    <th className="p-4 md:p-6 text-center whitespace-nowrap">Acciones de Comando</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {usuariosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 md:p-12 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs italic">
                        No se encontraron registros en el archivo.
                      </td>
                    </tr>
                  ) : (
                    usuariosPaginados.map(user => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                          {/* ✨ AVATAR INVOCADO AQUÍ */}
                          <span className="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800 group-hover:border-zinc-600 transition-all overflow-hidden">
                            <AvatarUsuario nombre={user.nombre} tamaño={48} variante="beam" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-zinc-200 uppercase italic tracking-tight flex flex-wrap items-center gap-1 md:gap-2">
                              <span className="truncate">{user.nombre}</span>
                              {user.nombre_completo && <span className="text-[9px] md:text-[10px] text-emerald-500/50 not-italic font-bold tracking-widest border-l border-zinc-800 pl-1 md:pl-2 whitespace-nowrap">{user.nombre_completo.toUpperCase()}</span>}
                            </p>
                            <p className="text-[9px] md:text-[10px] text-zinc-600 font-mono lowercase truncate">{user.email}</p>
                            {/* Mostrar rango en móviles si se oculta la columna */}
                            <span className={`sm:hidden mt-1 inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border whitespace-nowrap ${user.rol === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : user.rol === 'dm' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'}`}>
                              {user.rol === 'admin' ? '👑 Admin' : user.rol === 'dm' ? '🛡️ DM' : '⚔️ Jugador'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 md:p-6 hidden sm:table-cell">
                          {/* ✨ ESTA ES LA ETIQUETA CORREGIDA PARA QUE NO SALTE DE LÍNEA */}
                          <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border whitespace-nowrap ${user.rol === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : user.rol === 'dm' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'}`}>
                            {user.rol === 'admin' ? '👑 Administrador' : user.rol === 'dm' ? '🛡️ Dungeon Master' : '⚔️ Aventurero'}
                          </span>
                        </td>
                        <td className="p-4 md:p-6">
                          <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                            
                            {user.rol === 'dm' && user.es_dm_nuevo && (
                              <button onClick={() => generarCertificado(user.id, user.nombre, user.nombre_completo)} className="w-8 h-8 md:w-10 md:h-10 bg-amber-500/10 border border-amber-500/50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-black transition-all text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse" title="Generar Certificado del Gremio">📜</button>
                            )}

                            {user.rol !== 'admin' && <button onClick={() => proponerAdmin(user.id, user.nombre)} className="w-8 h-8 md:w-10 md:h-10 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-amber-500 hover:text-amber-500 transition-all text-sm" title="Proponer al Senado">👑</button>}
                            {user.rol !== 'dm' && user.rol !== 'admin' && <button onClick={() => cambiarRolDirecto(user.id, user.nombre, 'dm')} className="w-8 h-8 md:w-10 md:h-10 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-purple-500 hover:text-purple-400 transition-all text-sm" title="Ascender a DM">🛡️</button>}
                            {user.rol !== 'jugador' && <button onClick={() => cambiarRolDirecto(user.id, user.nombre, 'jugador')} className="w-8 h-8 md:w-10 md:h-10 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-500 hover:text-red-500 transition-all text-sm" title="Revocar Rango">✕</button>}
                            
                            <button onClick={() => aplicarHardReset(user)} className="w-8 h-8 md:w-10 md:h-10 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-500 hover:text-red-500 transition-all text-sm" title="Forzar restablecimiento de contraseña (Hard Reset)">🔑</button>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 md:p-6 bg-zinc-950/30 border-t border-zinc-800">
                 <button onClick={() => setPaginaCenso(p => Math.max(1, p - 1))} disabled={paginaCenso === 1} className="w-full sm:w-auto px-6 py-2 bg-zinc-900 text-zinc-500 font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-20 transition-all hover:text-white">← Anterior</button>
                 <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">Página {paginaCenso} de {totalPaginas} ({usuariosProcesados.length} héroes)</span>
                 <button onClick={() => setPaginaCenso(p => Math.min(totalPaginas, p + 1))} disabled={paginaCenso >= totalPaginas} className="w-full sm:w-auto px-6 py-2 bg-zinc-900 text-zinc-500 font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-20 transition-all hover:text-white">Siguiente →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {pestanaActiva === 'senado' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-2xl border border-amber-500/20 text-xl animate-pulse">🏛️</div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Senado del Gremio</h3>
              <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.4em]">Mociones de Ascenso de Élite</p>
            </div>
          </div>
          
          {votaciones.length === 0 ? (
            <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-900 rounded-[2rem] md:rounded-[3rem] p-10 md:p-24 text-center">
               <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-xs italic">El Senado está en silencio absoluto...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {votaciones.map(v => (
                <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-2xl group transition-all hover:border-amber-500/40">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] rounded-full group-hover:bg-amber-500/10 transition-all"></div>
                  
                  <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-1 uppercase italic break-words">{v.candidato_nombre}</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-8">Propuesto por: <span className="text-amber-500">{v.proponente_nombre}</span></p>
                  
                  <div className="bg-zinc-950 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 border border-zinc-800/50 mb-8">
                    <div className="flex justify-between items-end mb-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">A Favor</span>
                        <span className="text-2xl font-black text-emerald-400 leading-none">{v.votos_favor}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">En Contra</span>
                        <span className="text-2xl font-black text-red-400 leading-none">{v.votos_contra}</span>
                      </div>
                    </div>
                    
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
                      <div style={{ width: `${(v.votos_favor / (v.total_admins || 1)) * 100}%` }} className="bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <div style={{ width: `${(v.votos_contra / (v.total_admins || 1)) * 100}%` }} className="bg-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    </div>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] text-center mt-4">Requiere {Math.floor(v.total_admins / 2) + 1} votos para resolución</p>
                  </div>

                  {v.ya_vote > 0 ? (
                    <div className="bg-zinc-800/30 text-zinc-600 text-center py-4 md:py-5 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] border border-zinc-800/50">⚖️ Tu veredicto ha sido sellado</div>
                  ) : (
                    <div className="flex gap-2 md:gap-3">
                      <button onClick={() => emitirVoto(v.id, v.candidato_nombre, 'en contra')} className="flex-1 bg-zinc-950 border border-zinc-800 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all">👎 Rechazar</button>
                      <button onClick={() => emitirVoto(v.id, v.candidato_nombre, 'a favor')} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all">👍 Apoyar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}


    </div>
  );
}

export default GestionUsuarios;