import { useState } from 'react';
import Swal from 'sweetalert2';
import { fetchProtegido } from '../utils/api';

function TarjetaEscape({ sala, usuarioGuardado, esAdmin, inscripcionesCerradas }) {
  const [cargando, setCargando] = useState(false);
  
  // ✨ Estados para la edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState({
    titulo: sala.titulo,
    descripcion: sala.descripcion,
    dificultad: sala.dificultad,
    edad_minima: sala.edad_minima,
    cupo_por_turno: sala.cupo_por_turno,
    materiales_pedidos: sala.materiales_pedidos || ''
  });

  const esOrganizador = usuarioGuardado?.id === sala.organizador_id;

  const inscribirse = async (turnoId, horaInicio) => {
    setCargando(true);
    try {
      const res = await fetchProtegido(`/api/escapes/turnos/${turnoId}/inscripciones`, { method: 'POST' });
      if (res.ok) {
        Swal.fire({
          title: '¡Estás dentro!',
          text: `Te has anotado en el pase de las ${horaInicio.substring(0, 5)}. ¡No llegues tarde!`,
          icon: 'success',
          background: '#09090b', color: '#fff', confirmButtonColor: '#10b981',
          customClass: { popup: 'border border-indigo-500/30 rounded-[2rem]' }
        });
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Las reglas del Gremio dictan:', text: data.error, icon: 'warning', background: '#09090b', color: '#fff' });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Error', text: 'Falló la conexión con el gremio.', icon: 'error', background: '#09090b', color: '#fff' });
    }
    setCargando(false);
  };

  const abandonar = async (turnoId) => {
    const result = await Swal.fire({
      title: '¿Abandonar el desafío?',
      text: "Perderás tu lugar en este horario.",
      icon: 'question',
      showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444', cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, retirarme',
      customClass: { popup: 'border border-zinc-800 rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      setCargando(true);
      try {
        const res = await fetchProtegido(`/api/escapes/turnos/${turnoId}/inscripciones`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al cancelar');
      } catch (error) {
        console.error(error);
      }
      setCargando(false);
    }
  };

  const eliminarSala = async () => {
    const result = await Swal.fire({
      title: '¿Clausurar la Sala?',
      text: "Se borrarán todos los horarios y se cancelarán las reservas de los jugadores.",
      icon: 'warning',
      showCancelButton: true,
      background: '#09090b', color: '#fff', confirmButtonColor: '#ef4444', cancelButtonColor: '#27272a',
      confirmButtonText: 'Clausurar permanentemente',
      customClass: { popup: 'border border-red-500/30 rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      try {
        await fetchProtegido(`/api/escapes/${sala.id}`, { method: 'DELETE' });
      } catch (error) {
        console.error(error);
      }
    }
  };

  // ✨ FUNCIÓN PARA GUARDAR LA EDICIÓN
  const guardarEdicion = async (e) => {
    e.preventDefault();
    setCargando(true);
    
    try {
      const res = await fetchProtegido(`/api/escapes/${sala.id}`, {
        method: 'PUT',
        body: JSON.stringify(datosEdicion)
      });

      if (res.ok) {
        Swal.fire({ title: '¡Planos Actualizados!', text: 'La estructura de la sala ha sido modificada con éxito.', icon: 'success', background: '#09090b', color: '#fff', confirmButtonColor: '#6366f1' });
        setModoEdicion(false); 
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Aviso del Gremio', text: data.error, icon: 'warning', background: '#09090b', color: '#fff' });
      }
    } catch (err) {
      if (err !== 'Sesión expirada') console.error(err);
    }
    setCargando(false);
  };

  return (
    <>
      <div className="bg-zinc-900/80 border border-zinc-800 p-8 md:p-10 rounded-[3rem] relative overflow-hidden group flex flex-col h-full shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors"></div>
        
        <div className="flex justify-between items-start mb-6 border-b border-zinc-800/50 pb-6 relative z-10">
          <div className="max-w-[70%]">
            <h4 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic mb-2 line-clamp-2">{sala.titulo}</h4>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
              🔐 Escape Room
            </span>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Arquitecto</p>
            <span className="text-zinc-300 font-bold bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 truncate max-w-[120px] sm:max-w-[180px]">{sala.organizador_nombre}</span>
          </div>
        </div>
        
        <p className="text-zinc-300 text-base md:text-lg mb-8 line-clamp-4 leading-relaxed italic border-l-4 border-indigo-500/50 pl-6 flex-grow relative z-10">
          "{sala.descripcion}"
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Dificultad</span>
            <span className="text-white font-bold">{sala.dificultad}</span>
          </div>
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Restricción</span>
            <span className="text-white font-bold">{sala.edad_minima}</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 mt-auto relative z-10">
          <p className="text-left text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
            <span>⏱️ Pases Habilitados</span>
            <span className="bg-zinc-900 px-2 py-0.5 rounded-md text-zinc-400">{sala.turnos?.length || 0}</span>
          </p>
          
          <div className="space-y-4">
            {sala.turnos?.map(turno => {
              const estaLleno = turno.anotados >= sala.cupo_por_turno;
              const estoyAnotado = turno.estoy_anotado > 0;
              const lugaresLibres = sala.cupo_por_turno - turno.anotados;

              return (
                <div key={turno.id} className={`flex flex-col p-4 md:p-5 rounded-2xl border transition-all ${estoyAnotado ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-zinc-900 border-zinc-800'}`}>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-white font-black text-lg tracking-tight mb-1">
                        {turno.hora_inicio.substring(0, 5)} <span className="text-zinc-600 font-normal mx-1">a</span> {turno.hora_fin.substring(0, 5)}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${estaLleno && !estoyAnotado ? 'text-red-500' : 'text-emerald-500'}`}>
                        {estoyAnotado ? '✅ Aseguraste tu lugar' : estaLleno ? '❌ Cupo Lleno' : `Libres: ${lugaresLibres} de ${sala.cupo_por_turno}`}
                      </span>
                    </div>

                    {!esOrganizador && usuarioGuardado && (
                      estoyAnotado ? (
                        <button onClick={() => abandonar(turno.id)} disabled={cargando} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full md:w-auto text-center border border-red-500/20">
                          Desertar
                        </button>
                      ) : (
                        <button 
                          onClick={() => inscribirse(turno.id, turno.hora_inicio)} 
                          disabled={cargando || estaLleno || inscripcionesCerradas} 
                          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full md:w-auto text-center border ${
                            (estaLleno || inscripcionesCerradas)
                            ? 'bg-zinc-950 text-zinc-600 border-zinc-800 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/20 shadow-lg'
                          }`}
                        >
                          {inscripcionesCerradas ? 'Cerrado' : estaLleno ? 'Lleno' : 'Unirme'}
                        </button>
                      )
                    )}
                  </div>

                  {(esOrganizador || esAdmin) && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Aventureros Confirmados:</p>
                      <p className="text-sm text-indigo-300 font-medium leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">
                        {turno.nombres_jugadores ? turno.nombres_jugadores : <span className="text-zinc-600 italic">La sala aún está vacía...</span>}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ✨ BOTONERA DE ADMINISTRACIÓN AÑADIDA ✨ */}
        {(esOrganizador || esAdmin) && (
          <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-wrap justify-end gap-3 relative z-10">
            <button onClick={() => setModoEdicion(true)} className="text-[10px] text-zinc-500 hover:text-black hover:bg-indigo-400 px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all border border-zinc-800 hover:border-indigo-400 shadow-lg bg-zinc-950 flex items-center gap-2">
              <span>✏️</span> Editar Planos
            </button>
            <button onClick={eliminarSala} className="text-[10px] text-zinc-500 hover:text-white hover:bg-red-500 px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all border border-zinc-800 hover:border-red-500 shadow-lg bg-zinc-950 flex items-center gap-2">
              <span>🗑️</span> Destruir Instalación
            </button>
          </div>
        )}
      </div>

      {/* ✨ MODAL DE EDICIÓN FLOTANTE ✨ */}
      {modoEdicion && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-zinc-900 border border-indigo-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-10 relative shadow-[0_0_80px_rgba(79,70,229,0.2)] scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button onClick={() => setModoEdicion(false)} className="absolute top-6 right-6 w-10 h-10 bg-zinc-950 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800 shadow-md">✕</button>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
              <span className="text-indigo-400 drop-shadow-md">📐</span> Alterar Estructura
            </h3>
            
            <form onSubmit={guardarEdicion} className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre de la Sala</label>
                <input type="text" value={datosEdicion.titulo} onChange={e => setDatosEdicion({...datosEdicion, titulo: e.target.value})} required className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-indigo-500 outline-none transition-all font-bold shadow-inner" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Historia / Ambientación</label>
                <textarea value={datosEdicion.descripcion} onChange={e => setDatosEdicion({...datosEdicion, descripcion: e.target.value})} required rows="4" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-indigo-500 outline-none transition-all resize-none italic font-medium shadow-inner" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Dificultad</label>
                  <select value={datosEdicion.dificultad} onChange={e => setDatosEdicion({...datosEdicion, dificultad: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-indigo-400 outline-none font-bold cursor-pointer focus:border-indigo-500">
                    <option value="Fácil">Fácil (Para novatos)</option>
                    <option value="Media">Media (Estándar)</option>
                    <option value="Difícil">Difícil (Veteranos)</option>
                    <option value="Extrema">Extrema (Mortal)</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Edad Mínima</label>
                  <select value={datosEdicion.edad_minima} onChange={e => setDatosEdicion({...datosEdicion, edad_minima: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white outline-none font-bold cursor-pointer focus:border-indigo-500">
                    <option value="ATP">ATP (Para toda la familia)</option>
                    <option value="+13">+13 Años</option>
                    <option value="+16">+16 Años</option>
                    <option value="+18">+18 (Adultos)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cupo por Turno</label>
                  <input type="number" value={datosEdicion.cupo_por_turno} onChange={e => setDatosEdicion({...datosEdicion, cupo_por_turno: e.target.value})} min="2" max="15" required className="bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-indigo-500 outline-none font-black text-center" />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Requerimientos Logísticos
                </label>
                <input 
                  type="text" 
                  value={datosEdicion.materiales_pedidos} 
                  onChange={e => setDatosEdicion({...datosEdicion, materiales_pedidos: e.target.value})} 
                  placeholder="Candados extra, luz ultravioleta, cajas..."
                  className="w-full bg-zinc-950 border border-indigo-500/30 rounded-2xl py-4 px-5 text-white outline-none italic text-sm shadow-inner focus:border-indigo-500"
                />
              </div>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mt-2">
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span>⚠️</span> Atención Arquitecto
                </p>
                <p className="text-zinc-400 text-xs mt-1 italic">
                  Por motivos de seguridad temporal del espacio continuo, los horarios de los turnos ya forjados no pueden modificarse desde aquí.
                </p>
              </div>

              <button type="submit" disabled={cargando} className="w-full group relative overflow-hidden font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-[0.2em] mt-4 border border-indigo-500 bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10">{cargando ? '⚙️ Sellando Paredes...' : '💾 Confirmar Nueva Estructura'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default TarjetaEscape;