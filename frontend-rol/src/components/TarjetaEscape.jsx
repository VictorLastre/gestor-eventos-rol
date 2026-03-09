import { useState } from 'react';
import Swal from 'sweetalert2';
import { fetchProtegido } from '../utils/api';

function TarjetaEscape({ sala, usuarioGuardado, esAdmin }) {
  const [cargando, setCargando] = useState(false);

  const esOrganizador = usuarioGuardado?.id === sala.organizador_id;

  const inscribirse = async (turnoId, horaInicio) => {
    setCargando(true);
    try {
      const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/escapes/turnos/${turnoId}/inscripciones`, { method: 'POST' });
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
        // Mostrar mensaje de error (Ej: Ya en otra mesa, etc)
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
        const res = await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/escapes/turnos/${turnoId}/inscripciones`, { method: 'DELETE' });
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
        await fetchProtegido(`https://gestor-eventos-rol.onrender.com/api/escapes/${sala.id}`, { method: 'DELETE' });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 p-8 md:p-10 rounded-[3rem] relative overflow-hidden group flex flex-col h-full shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors"></div>
      
      {/* CABECERA GIGANTE */}
      <div className="flex justify-between items-start mb-6 border-b border-zinc-800/50 pb-6">
        <div>
          <h4 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic mb-2">{sala.titulo}</h4>
          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
            🔐 Escape Room
          </span>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Organiza</p>
          <span className="text-zinc-300 font-bold bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">{sala.organizador_nombre}</span>
        </div>
      </div>
      
      <p className="text-zinc-300 text-base md:text-lg mb-8 line-clamp-4 leading-relaxed italic border-l-4 border-indigo-500/50 pl-6 flex-grow">
        "{sala.descripcion}"
      </p>
      
      {/* DETALLES TÉCNICOS EN GRILLA */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Dificultad</span>
          <span className="text-white font-bold">{sala.dificultad}</span>
        </div>
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Restricción</span>
          <span className="text-white font-bold">{sala.edad_minima}</span>
        </div>
      </div>

      {/* SECCIÓN DE HORARIOS (PASES) AMPLIADA */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 mt-auto">
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
                      {estoyAnotado ? '✅ Aseguraste tu lugar en la sala' : estaLleno ? '❌ Cupo Lleno' : `Libres: ${lugaresLibres} de ${sala.cupo_por_turno}`}
                    </span>
                  </div>

                  {/* BOTONERA DEL TURNO */}
                  {!esOrganizador && usuarioGuardado && (
                    estoyAnotado ? (
                      <button onClick={() => abandonar(turno.id)} disabled={cargando} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full md:w-auto text-center border border-red-500/20">
                        Desertar
                      </button>
                    ) : (
                      <button onClick={() => inscribirse(turno.id, turno.hora_inicio)} disabled={cargando || estaLleno} className="bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg w-full md:w-auto text-center border border-indigo-500/20">
                        {estaLleno ? 'Cerrado' : 'Unirme'}
                      </button>
                    )
                  )}
                </div>

                {/* ✨ PANEL SECRETO PARA EL ORGANIZADOR (MUESTRA QUIÉN SE ANOTÓ) */}
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

      {/* BOTONES DE ADMINISTRACIÓN */}
      {(esOrganizador || esAdmin) && (
        <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-end">
          <button onClick={eliminarSala} className="text-[10px] text-zinc-500 hover:text-white hover:bg-red-500 px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all border border-zinc-800 hover:border-red-500 shadow-lg bg-zinc-950">
            🗑️ Destruir Instalación
          </button>
        </div>
      )}
    </div>
  );
}

export default TarjetaEscape;