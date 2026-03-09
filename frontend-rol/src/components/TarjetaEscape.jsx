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
        Swal.fire({ title: 'Aviso', text: data.error, icon: 'warning', background: '#09090b', color: '#fff' });
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
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group flex flex-col h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
      
      {/* CABECERA */}
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic pr-8">{sala.titulo}</h4>
        <span className="w-10 h-10 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center flex-shrink-0 text-lg">🔐</span>
      </div>
      
      <p className="text-zinc-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow">"{sala.descripcion}"</p>
      
      {/* DETALLES */}
      <div className="space-y-2 mb-6 border-l-2 border-indigo-500/30 pl-4">
        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">🧠 Dificultad: <span className="text-white">{sala.dificultad}</span></p>
        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">🔞 Edad Mínima: <span className="text-white">{sala.edad_minima}</span></p>
        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">👤 Organiza: <span className="text-indigo-400">{sala.organizador_nombre}</span></p>
      </div>

      {/* HORARIOS (PASES) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mt-auto">
        <p className="text-center text-zinc-500 font-black uppercase tracking-[0.2em] text-[9px] mb-3">Horarios Habilitados</p>
        
        <div className="space-y-3">
          {sala.turnos?.map(turno => {
            const estaLleno = turno.anotados >= sala.cupo_por_turno;
            const estoyAnotado = turno.estoy_anotado > 0;
            const lugaresLibres = sala.cupo_por_turno - turno.anotados;

            return (
              <div key={turno.id} className={`flex items-center justify-between p-3 rounded-xl border ${estoyAnotado ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex flex-col">
                  <span className="text-white font-black text-sm">{turno.hora_inicio.substring(0, 5)} a {turno.hora_fin.substring(0, 5)}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${estaLleno && !estoyAnotado ? 'text-red-500' : 'text-emerald-500'}`}>
                    {estoyAnotado ? '✅ Tu lugar está reservado' : estaLleno ? '❌ Cupo Lleno' : `Libre: ${lugaresLibres} de ${sala.cupo_por_turno}`}
                  </span>
                </div>

                {/* BOTONERA DEL TURNO */}
                {!esOrganizador && usuarioGuardado && (
                  estoyAnotado ? (
                    <button onClick={() => abandonar(turno.id)} disabled={cargando} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Cancelar</button>
                  ) : (
                    <button onClick={() => inscribirse(turno.id, turno.hora_inicio)} disabled={cargando || estaLleno} className="bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                      {estaLleno ? 'Lleno' : 'Unirse'}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTONES DE ADMINISTRACIÓN */}
      {(esOrganizador || esAdmin) && (
        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-end">
          <button onClick={eliminarSala} className="text-[10px] text-red-500 hover:text-white hover:bg-red-500 px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all border border-red-500/20">
            🗑️ Clausurar Sala
          </button>
        </div>
      )}
    </div>
  );
}

export default TarjetaEscape;