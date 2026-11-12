const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

const verificarToken = (req, res, next) => {
  // 1. Definimos las rutas que NO necesitan validación de token
  const rutasPublicas = ['/olvide-password', '/reset-password'];
  
  // 2. Comprobamos si la petición actual incluye alguna de esas rutas públicas
  const esRutaPublica = rutasPublicas.some(ruta => req.path.includes(ruta));
  
  // Si es una ruta pública, le decimos "pasa sin problemas" y cortamos la función aquí
  if (esRutaPublica) {
    return next();
  }

  // 3. Si NO es una ruta pública, aplicamos la validación normal del Gremio
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: '¡Alto ahí! Necesitas estar logueado.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Tu Pase VIP es inválido o ha caducado.' });
    req.usuario = decoded; 
    // Flag de conveniencia para roles con privilegios
    req.usuario.esAdmin = decoded.rol === 'admin' || decoded.rol === 'superadmin';
    req.usuario.esSuperAdmin = decoded.rol === 'superadmin';
    next();
  });
};

// Middleware exclusivo para Superadministrador (Fundador / Alto Mando Supremo)
const verificarSuperAdmin = (req, res, next) => {
  verificarToken(req, res, () => {
    if (req.usuario && req.usuario.rol === 'superadmin') {
      return next();
    }
    return res.status(403).json({ error: 'Acceso reservado exclusivamente para el Superadministrador del Gremio.' });
  });
};

verificarToken.verificarToken = verificarToken;
verificarToken.verificarSuperAdmin = verificarSuperAdmin;

module.exports = verificarToken;
