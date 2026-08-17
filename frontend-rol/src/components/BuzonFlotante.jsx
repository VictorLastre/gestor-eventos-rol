import React, { useState } from 'react';
import Swal from 'sweetalert2';

const BuzonFlotante = () => {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState('Sugerencia');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      return Swal.fire('Alto ahí', 'El mensaje no puede estar vacío.', 'warning');
    }
    
    setEnviando(true);
    try {
      const response = await fetch('/api/buzon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, mensaje })
      });
      
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Mensaje Enviado!',
          text: 'Gracias por tu aporte. Tu voz nos ayuda a mejorar.',
          background: '#18181b',
          color: '#fff',
          confirmButtonColor: '#10b981'
        });
        setMensaje('');
        setAbierto(false);
      }
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema de conexión al enviar el mensaje.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button 
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-lg shadow-indigo-500/30 transition-all hover:scale-110 flex items-center justify-center group"
        title="Buzón de Dudas y Sugerencias"
      >
        <span className="text-2xl">📬</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap group-hover:ml-2 font-bold tracking-widest text-sm">
          BUZÓN ANÓNIMO
        </span>
      </button>

      {/* Modal */}
      {abierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-indigo-500/30 rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in relative">
            <button 
              onClick={() => setAbierto(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-red-500/20 p-2 rounded-full transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">📮</span>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">Buzón de la Taberna</h2>
              <p className="text-zinc-400 text-sm mt-2">Déjanos tu duda, queja o sugerencia. Este mensaje es <strong className="text-indigo-400">100% anónimo</strong>, no guardaremos rastro de quién lo envió.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-300 font-bold mb-2 text-sm uppercase tracking-wider">Tipo de Mensaje</label>
                <select 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option value="Sugerencia">💡 Sugerencia</option>
                  <option value="Duda">❓ Duda</option>
                  <option value="Queja">📢 Queja</option>
                </select>
              </div>
              
              <div>
                <label className="block text-zinc-300 font-bold mb-2 text-sm uppercase tracking-wider">Tu Mensaje</label>
                <textarea 
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe aquí tu aporte con total libertad..."
                  rows="5"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={enviando}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 rounded-lg uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
              >
                {enviando ? 'Depositando...' : 'Enviar de forma Anónima'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BuzonFlotante;
