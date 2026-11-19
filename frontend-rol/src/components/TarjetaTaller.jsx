import { useState } from 'react';

function TarjetaTaller({
  taller,
  usuarioGuardado,
  esAdmin,
  onInscribirse,
  onDesinscribirse,
  onEditar,
  onBorrar,
  onVerInscriptos
}) {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  const porcentajeCupo = Math.min(100, Math.round(((taller.inscritos_count || 0) / (taller.cupo || 1)) * 100));
  const estaLleno = (taller.inscritos_count || 0) >= (taller.cupo || 1);
  const estaInscrito = Boolean(taller.esta_inscrito);
  const estaCerrado = taller.estado === 'Finalizado' || taller.estado === 'Cancelado';

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Fecha a confirmar';
    const soloFecha = fechaStr.split('T')[0];
    const [anio, mes, dia] = soloFecha.split('-');
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${parseInt(dia, 10)} de ${meses[parseInt(mes, 10) - 1]} de ${anio}`;
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Curso / Ciclo':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Masterclass':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Charla / Conversatorio':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/40 rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-purple-950/20 group relative overflow-hidden">
      
      {/* Resplandor decorativo de fondo */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-purple-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/10 transition-colors"></div>

      <div>
        {/* Encabezado: Badges de Tipo, Modalidad y Costo */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getTipoColor(taller.tipo)}`}>
              🎓 {taller.tipo || 'Taller'}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {taller.modalidad === 'Virtual' ? '💻 Virtual' : taller.modalidad === 'Híbrido' ? '🌐 Híbrido' : '🏛️ Presencial'}
            </span>
            {taller.evento_nombre ? (
              <span className="text-[9px] font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                Jornada: {taller.evento_nombre}
              </span>
            ) : (
              <span className="text-[9px] font-bold text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                ✨ Autónomo (Fecha propia)
              </span>
            )}
          </div>

          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
            taller.costo && taller.costo.toLowerCase() !== 'gratuito' 
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}>
            {taller.costo || 'Gratuito'}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight mb-2 group-hover:text-purple-300 transition-colors">
          {taller.titulo}
        </h3>

        {/* Instructor y Audiencia */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs font-bold text-zinc-400">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="text-purple-400">🧙</span> {taller.instructor_nombre || 'Coordinación del Gremio'}
          </span>
          {taller.destinatarios && (
            <span className="text-zinc-500 font-mono text-[11px]">
              🎯 {taller.destinatarios}
            </span>
          )}
        </div>

        {/* Descripción corta */}
        <p className="text-zinc-400 text-xs sm:text-sm italic line-clamp-3 mb-5 leading-relaxed">
          {taller.descripcion}
        </p>

        {/* Datos Logísticos: Fecha, Hora, Lugar */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <span className="text-amber-400">📅</span>
            <span>{formatearFecha(taller.fecha)}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-mono">{taller.hora_inicio} a {taller.hora_fin} hs</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 truncate">
            <span className="text-purple-400">📍</span>
            <span className="truncate">{taller.lugar || (taller.modalidad === 'Virtual' ? 'Discord / Sala Online' : 'Sede de la Asociación')}</span>
          </div>
        </div>

        {/* Barra de Cupo y Participantes */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-1.5">
            <span className="text-zinc-500">Cupo de Aprendices</span>
            <span className={estaLleno ? 'text-rose-400 font-bold' : 'text-purple-400'}>
              {taller.inscritos_count || 0} / {taller.cupo} plazas
            </span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
            <div 
              className={`h-full transition-all duration-500 ${
                estaLleno 
                  ? 'bg-rose-500' 
                  : porcentajeCupo > 75 
                    ? 'bg-amber-500' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}
              style={{ width: `${porcentajeCupo}%` }}
            />
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        
        {/* Fila Principal de Inscripción / Ver Más */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarDetalles(true)}
            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
            title="Ver temario, requisitos y materiales"
          >
            📜 Ficha
          </button>

          {!usuarioGuardado ? (
            <button
              disabled
              className="flex-1 py-3 px-4 bg-zinc-800/50 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-not-allowed"
            >
              Inicia sesión para participar
            </button>
          ) : estaInscrito ? (
            <button
              onClick={() => onDesinscribirse && onDesinscribirse(taller.id)}
              className="flex-1 py-3 px-4 bg-emerald-500/10 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/40 hover:border-rose-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 group/btn"
            >
              <span className="group-hover/btn:hidden">✓ Inscripto</span>
              <span className="hidden group-hover/btn:inline">✕ Cancelar Inscripción</span>
            </button>
          ) : estaCerrado ? (
            <button
              disabled
              className="flex-1 py-3 px-4 bg-zinc-800/50 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
            >
              Inscripciones Finalizadas
            </button>
          ) : estaLleno ? (
            <button
              disabled
              className="flex-1 py-3 px-4 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed text-center"
            >
              🔒 Cupo Agotado
            </button>
          ) : (
            <button
              onClick={() => onInscribirse && onInscribirse(taller.id)}
              className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-900/30 hover:scale-[1.02] cursor-pointer"
            >
              🎓 Inscribirme al Taller
            </button>
          )}
        </div>

        {/* Barra de Control de Administrador */}
        {esAdmin && (
          <div className="flex items-center gap-2 pt-2 border-t border-dashed border-zinc-800 text-[10px]">
            <button
              onClick={() => onVerInscriptos && onVerInscriptos(taller)}
              className="flex-1 py-2 px-3 bg-zinc-950 border border-zinc-800 hover:border-purple-500 text-purple-400 hover:text-purple-300 rounded-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Ver participantes y tomar asistencia"
            >
              <span>👥</span> Inscriptos ({taller.inscritos_count || 0})
            </button>
            <button
              onClick={() => onEditar && onEditar(taller)}
              className="py-2 px-3 bg-zinc-950 border border-zinc-800 hover:border-amber-500 text-amber-400 rounded-lg font-black uppercase tracking-widest transition-all cursor-pointer"
              title="Editar taller"
            >
              ✏️
            </button>
            <button
              onClick={() => onBorrar && onBorrar(taller.id)}
              className="py-2 px-3 bg-zinc-950 border border-zinc-800 hover:border-rose-500 text-rose-400 rounded-lg font-black uppercase tracking-widest transition-all cursor-pointer"
              title="Eliminar taller"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* MODAL DETALLES COMPLETOS / PERGAMINO */}
      {mostrarDetalles && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-zinc-950 border border-purple-500/30 w-full max-w-2xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-zinc-800">
              <div>
                <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border mb-2 ${getTipoColor(taller.tipo)}`}>
                  🎓 {taller.tipo || 'Taller'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
                  {taller.titulo}
                </h3>
                <p className="text-xs text-purple-400 font-bold mt-1">
                  Instructor: {taller.instructor_nombre}
                </p>
              </div>
              <button
                onClick={() => setMostrarDetalles(false)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 scrollbar-hide flex-1">
              {/* Descripción */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Acerca del Taller</h4>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/80">
                  {taller.descripcion}
                </p>
              </div>

              {/* Ficha técnica en rejilla */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] font-black uppercase tracking-wider mb-1">📅 Fecha y Horario</span>
                  <span className="text-white font-bold">{formatearFecha(taller.fecha)}</span>
                  <span className="text-zinc-400 block font-mono mt-0.5">{taller.hora_inicio} a {taller.hora_fin} hs</span>
                </div>

                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] font-black uppercase tracking-wider mb-1">📍 Sede / Lugar</span>
                  <span className="text-white font-bold">{taller.lugar || 'Sede de la Asociación'}</span>
                  <span className="text-purple-400 block text-[10px] uppercase font-bold mt-0.5">{taller.modalidad}</span>
                </div>

                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] font-black uppercase tracking-wider mb-1">🏷️ Costo e Inscripción</span>
                  <span className="text-emerald-400 font-bold">{taller.costo || 'Gratuito'}</span>
                  <span className="text-zinc-400 block text-[10px] mt-0.5">{taller.destinatarios}</span>
                </div>

                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] font-black uppercase tracking-wider mb-1">👥 Ocupación</span>
                  <span className="text-white font-bold">{taller.inscritos_count || 0} de {taller.cupo} inscriptos</span>
                  <span className="text-zinc-400 block text-[10px] mt-0.5">{estaLleno ? 'Cupo completo' : `${taller.cupo - (taller.inscritos_count || 0)} lugares disponibles`}</span>
                </div>
              </div>

              {/* Requisitos y Materiales */}
              {(taller.requisitos || taller.materiales_incluidos) && (
                <div className="space-y-3 pt-2">
                  {taller.requisitos && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1.5">
                        <span>📜</span> Requisitos del Aprendiz
                      </h5>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                        {taller.requisitos}
                      </p>
                    </div>
                  )}

                  {taller.materiales_incluidos && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1.5">
                        <span>🎁</span> Materiales Provistos por la Asociación
                      </h5>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                        {taller.materiales_incluidos}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 mt-4">
              <button
                onClick={() => setMostrarDetalles(false)}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border border-zinc-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TarjetaTaller;
