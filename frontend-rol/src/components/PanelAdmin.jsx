import { useState } from 'react';
import CrearEvento from './CrearEvento'; 
import GestionUsuarios from './GestionUsuarios'; 
import Estadisticas from './Estadisticas';

function PanelAdmin() {
  const [pestanaAdmin, setPestanaAdmin] = useState('eventos');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-2xl border border-purple-500/30 text-3xl shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          👑
        </div>
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none italic">
            Mesa de Comando
          </h2>
          <p className="text-[10px] text-purple-500/70 font-black uppercase tracking-[0.4em] mt-2">
            Acceso Restringido - Alto Mando
          </p>
        </div>
      </div>

      <section className="bg-zinc-900 rounded-[3rem] border border-purple-500/20 shadow-2xl overflow-hidden">
        <nav className="flex flex-col sm:flex-row bg-zinc-950/80 p-3 gap-2 border-b border-zinc-800">
          {['eventos', 'usuarios', 'stats'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setPestanaAdmin(tab)} 
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                pestanaAdmin === tab 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              {tab === 'eventos' ? '⚔️ Gestor de Jornadas' : tab === 'usuarios' ? '🛡️ Alistamiento' : '📊 Oráculo de Datos'}
            </button>
          ))}
        </nav>
        <div className="p-6 md:p-12">
          {pestanaAdmin === 'eventos' && <CrearEvento alCrearEvento={() => {}} />}
          {pestanaAdmin === 'usuarios' && <GestionUsuarios />}
          {pestanaAdmin === 'stats' && <Estadisticas />}
        </div>
      </section>

    </div>
  );
}

export default PanelAdmin;