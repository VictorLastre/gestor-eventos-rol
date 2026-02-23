const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal_de_emergencia';

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: '¡Alto ahí! Necesitas estar logueado.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Tu Pase VIP es inválido o ha caducado.' });
    req.usuario = decoded; 
    next();
  });
};

module.exports = verificarToken;