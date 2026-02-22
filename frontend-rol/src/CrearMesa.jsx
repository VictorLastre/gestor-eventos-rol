import { useState } from 'react';

function CrearMesa({ idEvento, alCrearMesa }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [sistema, setSistema] = useState('');
  const [cupo, setCupo] = useState(4);
  const [turno, setTurno] = useState('Tarde');
  const [mensaje, setMensaje] = useState('');

  const manejarCreacion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const nuevaMesa = { titulo, descripcion, requisitos, sistema, cupo, turno };

    try {
      const respuesta = await fetch(`https://gestor-eventos-rol.onrender.com/api/eventos/${idEvento}/partidas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify(nuevaMesa)
      });

      const texto = await respuesta.text();

      if (respuesta.ok) {
        setMensaje(`✅ ${texto}`);
        // Limpiamos el formulario
        setTitulo(''); setDescripcion(''); setRequisitos(''); setSistema(''); setCupo(4);
        
        // Le avisamos a Eventos.jsx que recargue la lista de mesas pasados 2 segundos
        setTimeout(() => {
          alCrearMesa(); 
        }, 2000);

      } else {
        setMensaje(`❌ ${texto}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("❌ Error de comunicación con el servidor.");
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #d4af37', marginBottom: '20px' }}>
      <h3 style={{ color: '#d4af37', marginTop: 0 }}>📜 Forjar Nueva Mesa de Rol</h3>
      
      <form onSubmit={manejarCreacion} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="text" placeholder="Título de la aventura" value={titulo} onChange={e => setTitulo(e.target.value)} required />
        
        <textarea placeholder="Descripción épica de la partida..." value={descripcion} onChange={e => setDescripcion(e.target.value)} required rows="3" />
        
        <input type="text" placeholder="Requisitos (opcional, ej: Nivel 5, Veteranos)" value={requisitos} onChange={e => setRequisitos(e.target.value)} />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Sistema (ej: D&D 5e)" value={sistema} onChange={e => setSistema(e.target.value)} required style={{ flex: 1 }} />
          
          <input type="number" placeholder="Cupo" value={cupo} onChange={e => setCupo(e.target.value)} min="1" max="10" required style={{ width: '80px' }} title="Cupo de jugadores" />
          
          <select value={turno} onChange={e => setTurno(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
            <option value="Noche">Noche</option>
            <option value="Madrugada">Madrugada</option>
          </select>
        </div>

        <button type="submit" style={{ backgroundColor: '#d4af37', color: 'black', fontWeight: 'bold', marginTop: '10px' }}>
          Crear Mesa
        </button>
      </form>

      {mensaje && <p style={{ marginTop: '15px', fontWeight: 'bold', color: mensaje.includes('✅') ? '#4CAF50' : '#f44336' }}>{mensaje}</p>}
    </div>
  );
}

export default CrearMesa;