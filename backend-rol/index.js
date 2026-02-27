require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://gestor-eventos-rol.vercel.app',
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'authorization']
}));

app.use(express.json());

// Importamos las rutas modulares
const authRoutes = require('./routes/authRoutes');
const eventosRoutes = require('./routes/eventosRoutes');
const partidasRoutes = require('./routes/partidasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
// ✨ AQUÍ IMPORTAMOS EL NUEVO PERGAMINO DE SISTEMAS
const sistemasRoutes = require('./routes/sistemas'); // Asegúrate de que el archivo se llame sistemas.js (o sistemasRoutes.js si seguiste ese patrón)

// Usamos las rutas
app.use('/api', authRoutes); // /api/registro y /api/login
app.use('/api/eventos', eventosRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/usuarios', usuariosRoutes); // Cambiamos /api/admin y /api/mis-cronicas a esta ruta
// ✨ AQUÍ LE DECIMOS AL SERVIDOR QUE ABRA LAS PUERTAS A LOS SISTEMAS
app.use('/api/sistemas', sistemasRoutes);

const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
  console.log(`⚔️  Asociación de Rol La Pampa activa en puerto ${PUERTO}`);
});