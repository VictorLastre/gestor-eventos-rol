import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { fetchProtegido } from '../utils/api';

function EvaluarMesaModal({ partida, cerrar, usuarioActualId }) {
  const [participantes, setParticipantes] = useState([]);
  const [votosEmitidos, setVotosEmitidos] = useState({});
  const [cargando, setCargando] = useState(true);

  // Opciones de tags
  const tagsDM_honor = ['🎭 Buen narrador', '📚 Sabe las reglas', '🤝 Amistoso', '🗺️ Mundo Inmersivo', '⚔️ Combates Épicos', '😂 Divertido'];
  const tagsDM_deshonor = ['🚂 Railroading', '📖 Reglas estrictas', '🥱 Aburrido', '⏳ Impuntual'];

  const tagsJugador_honor = ['🛡️ Buen compañero', '⏳ Respeta el turno', '🧙‍♂️ Buen roleador', '🧠 Táctico', '📖 Conoce su clase', '🍕 Trae comida'];
  const tagsJugador_deshonor = ['📱 Distraído', '🗣️ Interrumpe mucho', '🥇 Síndrome de Protagonista', '🤬 Mal perdedor', '⏳ Impuntual'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resJugadores, resVotos] = await Promise.all([
          fetchProtegido(`/api/partidas/${partida.id}/jugadores`),
          fetchProtegido(`/api/reputacion/partida/${partida.id}/mis-votos`)
        ]);

        const jugadores = await resJugadores.json();
        const misVotos = await resVotos.json();

        // Mapear votos para acceso rapido: { evaluado_id: { voto: 1, etiqueta: '...' } }
        const mapaVotos = {};
        if (Array.isArray(misVotos)) {
          misVotos.forEach(v => {
            mapaVotos[v.evaluado_id] = v;
          });
        }
        setVotosEmitidos(mapaVotos);

        let lista = [];
        // Si yo NO soy el DM, agrego al DM a la lista para evaluarlo
        if (partida.dungeon_master_id !== usuarioActualId) {
          lista.push({
            id: partida.dungeon_master_id,
            nombre: partida.dm_nombre || 'El Dungeon Master',
            esDM: true
          });
        }
        
        // Agregar a los jugadores (excepto a mí mismo)
        jugadores.forEach(j => {
          if (j.id !== usuarioActualId) {
            lista.push({
              id: j.id,
              nombre: j.nombre,
              esDM: false
            });
          }
        });
        
        setParticipantes(lista);
        setCargando(false);
      } catch (err) {
        console.error(err);
        setCargando(false);
      }
    };

    fetchData();
  }, [partida.id, partida.dungeon_master_id, usuarioActualId]);

  const enviarEvaluacion = async (evaluado_id, voto, etiqueta, btnEvent) => {
    const btn = btnEvent.currentTarget;
    const oldText = btn.innerHTML;
    btn.innerHTML = '⏳';
    btn.disabled = true;

    try {
      const res = await fetchProtegido('/api/reputacion', {
        method: 'POST',
        body: JSON.stringify({
          evaluado_id,
          partida_id: partida.id,
          voto,
          etiqueta
        })
      });
      if (res.ok) {
        Swal.fire({ title: 'Voto registrado', icon: 'success', timer: 1500, showConfirmButton: false, background: '#09090b', color: '#fff' });
        
        // Actualizar el estado local
        setVotosEmitidos(prev => ({
          ...prev,
          [evaluado_id]: { voto, etiqueta }
        }));

      } else {
        const err = await res.json();
        Swal.fire({ title: 'Error', text: err.error, icon: 'error', background: '#09090b', color: '#fff' });
        btn.innerHTML = oldText;
        btn.disabled = false;
      }
    } catch (error) {
      console.error(error);
      btn.innerHTML = oldText;
      btn.disabled = false;
    }
  };

  const seleccionarTagYVotar = async (participante, voto) => {
    let opciones = [];
    if (participante.esDM) {
      if (voto === 1) opciones = tagsDM_honor;
      else opciones = tagsDM_deshonor;
    } else {
      if (voto === 1) opciones = tagsJugador_honor;
      else opciones = tagsJugador_deshonor;
    }

    const htmlSelect = `
      <div class="mt-4 text-left">
        <label class="block text-zinc-400 text-sm mb-2 font-bold uppercase tracking-widest">Etiqueta a otorgar:</label>
        <select id="swal-etiqueta" class="w-full bg-zinc-900 text-white p-3 rounded-xl border border-zinc-700 outline-none focus:border-emerald-500 transition-colors">
          <option value="" disabled selected>Selecciona una etiqueta...</option>
          ${opciones.map(opt => `<option value="${opt}" class="bg-zinc-900 text-white">${opt}</option>`).join('')}
        </select>
      </div>
    `;

    const { value: etiqueta } = await Swal.fire({
      title: voto === 1 ? `Otorgar Honor a ${participante.nombre}` : `Dar Deshonor a ${participante.nombre}`,
      html: htmlSelect,
      showCancelButton: true,
      background: '#09090b', 
      color: '#fff',
      confirmButtonColor: voto === 1 ? '#10b981' : '#ef4444',
      preConfirm: () => {
        const val = document.getElementById('swal-etiqueta').value;
        if (!val) {
          Swal.showValidationMessage('Debes seleccionar una etiqueta');
        }
        return val;
      }
    });

    if (etiqueta) {
      // Dummy event para que la API no rompa si le paso un boton
      const dummyBtn = { currentTarget: { innerHTML: '', classList: { add: () => {} } } };
      await enviarEvaluacion(participante.id, voto, etiqueta, dummyBtn);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl">
        
        <button 
          onClick={cerrar} 
          className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900 w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center transition-colors shadow-lg"
        >
          ✕
        </button>

        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 text-center">
          Evaluar Mesa
        </h2>
        <p className="text-zinc-400 text-sm text-center mb-6">
          {partida.titulo}
        </p>

        {cargando ? (
          <p className="text-zinc-500 text-center py-8">Cargando participantes...</p>
        ) : participantes.length === 0 ? (
          <p className="text-zinc-500 text-center py-8 font-bold">No hay otros participantes en esta mesa.</p>
        ) : (
          <div className="space-y-3">
            {participantes.map(p => {
              const votoPrevio = votosEmitidos[p.id];
              return (
                <div key={p.id} className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 ${votoPrevio ? (votoPrevio.voto === 1 ? 'border-emerald-500/50' : 'border-red-500/50') : 'border-zinc-800'}`}>
                  <div>
                    <h3 className="font-bold text-white text-lg">{p.nombre}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.esDM ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {p.esDM ? 'Dungeon Master' : 'Jugador'}
                    </span>
                  </div>
                  
                  {votoPrevio ? (
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-black uppercase tracking-widest ${votoPrevio.voto === 1 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {votoPrevio.voto === 1 ? 'Honor Otorgado' : 'Deshonor Otorgado'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold bg-zinc-950 px-2 py-1 rounded mt-1 border border-zinc-800">
                        {votoPrevio.etiqueta}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => seleccionarTagYVotar(p, 1)}
                        className="bg-zinc-800 hover:bg-emerald-900/50 text-emerald-500 border border-zinc-700 hover:border-emerald-500/50 px-4 py-2 rounded-xl text-sm font-black transition-colors"
                      >
                        + Honor
                      </button>
                      <button 
                        onClick={(e) => seleccionarTagYVotar(p, -1)}
                        className="bg-zinc-800 hover:bg-red-900/50 text-red-500 border border-zinc-700 hover:border-red-500/50 px-4 py-2 rounded-xl text-sm font-black transition-colors"
                      >
                        - Deshonor
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EvaluarMesaModal;
