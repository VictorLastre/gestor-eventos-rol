import Swal from 'sweetalert2';

// ✨ EL GUARDIÁN DE LAS PETICIONES ✨
// Esta función envuelve al fetch normal, le inyecta el token y vigila si la sesión caducó.

export const fetchProtegido = async (url, opciones = {}) => {
  const token = localStorage.getItem('token');
  
  // Preparamos los headers inyectando la autorización automáticamente
  const headers = {
    'Content-Type': 'application/json',
    ...opciones.headers,
    'authorization': token ? token : ''
  };

  try {
    const respuesta = await fetch(url, { ...opciones, headers });

    // 🛑 AQUÍ ESTÁ LA MAGIA: Si el servidor dice que el token está vencido o es inválido...
    if (respuesta.status === 401 || respuesta.status === 403) {
      // 1. Destruimos los datos corruptos/vencidos
      localStorage.removeItem('token');
      localStorage.removeItem('usuario'); // O el nombre que le hayas puesto a tus datos locales
      
      // 2. Avisamos al usuario
      Swal.fire({
        title: 'La magia se ha desvanecido',
        text: 'Tu sesión ha expirado. Por favor, vuelve a identificarte en el gremio.',
        icon: 'warning',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Volver a la Taberna'
      }).then(() => {
        // 3. Lo pateamos a la pantalla de inicio/login
        window.location.href = '/'; 
      });

      // Detenemos la ejecución de la promesa
      return Promise.reject('Sesión expirada');
    }

    return respuesta;
  } catch (error) {
    console.error("Error en la petición protegida:", error);
    throw error;
  }
};