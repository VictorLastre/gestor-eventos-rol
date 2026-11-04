import { useState, useEffect } from 'react';

export default function CuentaRegresivaEvento({ fecha, horaInicio, horaFin, estado, compacta = false }) {
  const [tiempoRestante, setTiempoRestante] = useState(null);

  useEffect(() => {
    if (!fecha) return;

    const calcular = () => {
      const hInicio = horaInicio ? horaInicio.substring(0, 5) : '16:00';
      const hFin = horaFin ? horaFin.substring(0, 5) : '20:00';
      const fechaLimpia = fecha.split('T')[0];

      // Zona horaria de Argentina UTC-3
      const targetInicio = Date.parse(`${fechaLimpia}T${hInicio}:00-03:00`);
      const targetFin = Date.parse(`${fechaLimpia}T${hFin}:00-03:00`);
      const ahora = Date.now();

      if (estado === 'Finalizado' || ahora > targetFin) {
        setTiempoRestante({ estado: 'finalizado' });
        return;
      }

      if (ahora >= targetInicio && ahora <= targetFin) {
        setTiempoRestante({ estado: 'en_curso' });
        return;
      }

      const diff = targetInicio - ahora;
      if (diff <= 0) {
        setTiempoRestante({ estado: 'en_curso' });
        return;
      }

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);

      setTiempoRestante({
        estado: 'cuenta_regresiva',
        dias,
        horas,
        minutos,
        segundos
      });
    };

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [fecha, horaInicio, horaFin, estado]);

  if (!tiempoRestante) return null;

  if (tiempoRestante.estado === 'finalizado') {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-500 font-bold text-xs uppercase tracking-widest shadow-inner">
        <span>🏁</span> Jornada Finalizada
      </div>
    );
  }

  if (tiempoRestante.estado === 'en_curso') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-xs uppercase tracking-widest animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)]">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>⚔️ ¡Jornada en Curso!</span>
      </div>
    );
  }

  if (compacta) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-sm">
        <span>⏳ Faltan:</span>
        <span className="font-mono">
          {tiempoRestante.dias > 0 ? `${tiempoRestante.dias}d ` : ''}
          {String(tiempoRestante.horas).padStart(2, '0')}h {String(tiempoRestante.minutos).padStart(2, '0')}m
        </span>
      </div>
    );
  }

  // Vista destacada para la Ficha del Evento
  return (
    <div className="bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.12)] relative overflow-hidden group">
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 blur-2xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm">⏳</span>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-amber-300">
            Cuenta Regresiva para la Jornada
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          En Vivo
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
        {/* DÍAS */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-center shadow-inner group-hover:border-amber-500/40 transition-colors">
          <span className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter leading-none font-mono">
            {String(tiempoRestante.dias).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-500 mt-1">
            Días
          </span>
        </div>

        {/* HORAS */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-center shadow-inner group-hover:border-amber-500/40 transition-colors">
          <span className="text-2xl sm:text-3xl font-black text-amber-400 italic tracking-tighter leading-none font-mono">
            {String(tiempoRestante.horas).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-500 mt-1">
            Horas
          </span>
        </div>

        {/* MINUTOS */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-center shadow-inner group-hover:border-amber-500/40 transition-colors">
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 italic tracking-tighter leading-none font-mono">
            {String(tiempoRestante.minutos).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-500 mt-1">
            Minutos
          </span>
        </div>

        {/* SEGUNDOS */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-center shadow-inner group-hover:border-amber-500/40 transition-colors">
          <span className="text-2xl sm:text-3xl font-black text-zinc-300 italic tracking-tighter leading-none font-mono animate-pulse">
            {String(tiempoRestante.segundos).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-500 mt-1">
            Segs
          </span>
        </div>
      </div>
    </div>
  );
}
