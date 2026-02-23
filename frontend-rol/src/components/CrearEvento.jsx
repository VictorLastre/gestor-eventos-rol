import { useState } from 'react';

function CrearEvento({ alCrearEvento }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [mensaje, setMensaje] = useState('');

  const manejarCreacion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const nuevoEvento = { nombre, descripcion, fecha };

    try {
      const respuesta = await fetch('https://gestor-eventos-rol.onrender.com/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify(nuevoEvento)
      });

      const texto = await respuesta.text();

      if (respuesta.ok) {
        setMensaje(`✅ ${texto}`);
        setNombre(''); setDescripcion(''); setFecha('');
        
        // Recargamos la lista de eventos después de 1.5 segundos
        setTimeout(() => {
          alCrearEvento(); 
          setMensaje(''); // Limpiamos el mensaje
        }, 1500);

      } else {
        setMensaje(`❌ ${texto}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("❌ Error de comunicación con el servidor.");
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #9c27b0', marginBottom: '30px', boxShadow: '0 4px 8px rgba(156, 39, 176, 0.2)' }}>
      <h3 style={{ color: '#ce93d8', marginTop: 0 }}>👑 Convocar Nuevo Evento (Panel de Admin)</h3>
      
      <form onSubmit={manejarCreacion} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Nombre del Evento (Ej: Convención de Invierno)" 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          required 
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
        />
        
        <textarea 
          placeholder="Descripción del evento..." 
          value={descripcion} 
          onChange={e => setDescripcion(e.target.value)} 
          rows="3"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ color: '#ccc', fontWeight: 'bold' }}>Fecha del Encuentro:</label>
          <input 
            type="date" 
            value={fecha} 
            onChange={e => setFecha(e.target.value)} 
            required 
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
          />
        </div>

        <button type="submit" style={{ backgroundColor: '#9c27b0', color: 'white', fontWeight: 'bold', marginTop: '10px', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Forjar Evento
        </button>
      </form>

      {mensaje && <p style={{ marginTop: '15px', fontWeight: 'bold', color: mensaje.includes('✅') ? '#4CAF50' : '#f44336' }}>{mensaje}</p>}
    </div>
  );
}

export default CrearEvento;