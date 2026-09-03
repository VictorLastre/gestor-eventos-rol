import { useState } from 'react';
import CrearEvento from './CrearEvento'; 
import GestionUsuarios from './GestionUsuarios'; 
import Estadisticas from './Estadisticas';

function PanelAdmin() {
  const [pestanaAdmin, setPestanaAdmin] = useState('eventos');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 👑 ENCABEZADO DE LA MESA DE COMANDO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8 md:mb-10">
        <div className="w-16 h-16 shrink-0 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-2xl border border-purple-500/30 text-3xl shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          👑
        </div>
        <div className="min-w-0 flex-1"> {/* min-w-0 previene que textos largos rompan el flex */}
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight italic break-words">
            Mesa de Comando
          </h2>
          <p className="text-[10px] text-purple-500/70 font-black uppercase tracking-[0.4em] mt-2">
            Acceso Restringido - Alto Mando
          </p>
        </div>
      </div>

      {/* 🏰 PANEL DE NAVEGACIÓN Y CONTENEDOR */}
      {/* Ajusté los bordes redondeados en móvil para que no ocupen tanto espacio */}
      <section className="bg-zinc-900 rounded-[2rem] md:rounded-[3rem] border border-purple-500/20 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Ajuste de padding y gap en el nav para móviles */}
        <nav className="flex flex-col sm:flex-row bg-zinc-950/80 p-2 sm:p-3 gap-2 border-b border-zinc-800 w-full">
          {['eventos', 'usuarios', 'stats'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setPestanaAdmin(tab)} 
              className={`flex-1 py-4 px-2 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all truncate ${
                pestanaAdmin === tab 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
              title={tab === 'eventos' ? 'Gestor de Jornadas' : tab === 'usuarios' ? 'Alistamiento' : 'Oráculo de Datos'}
            >
              {tab === 'eventos' ? '⚔️ Gestor de Jornadas' : tab === 'usuarios' ? '🛡️ Alistamiento' : '📊 Oráculo de Datos'}
            </button>
          ))}
        </nav>
        
        {/* overflow-x-hidden añadido por seguridad para evitar el scroll horizontal interno */}
        <div className="p-4 sm:p-6 md:p-12 w-full overflow-x-hidden">
          {pestanaAdmin === 'eventos' && <CrearEvento alCrearEvento={() => {}} />}
          {pestanaAdmin === 'usuarios' && <GestionUsuarios />}
          {pestanaAdmin === 'stats' && <Estadisticas />}
        </div>
      </section>

    </div>
  );
}

export default PanelAdmin;