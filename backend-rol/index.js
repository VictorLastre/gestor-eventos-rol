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

// Usamos las rutas
app.use('/api', authRoutes); // /api/registro y /api/login
app.use('/api/eventos', eventosRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/usuarios', usuariosRoutes); // Cambiamos /api/admin y /api/mis-cronicas a esta ruta

const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, '0.0.0.0', () => {
  console.log(`⚔️  Asociación de Rol La Pampa activa en puerto ${PUERTO}`);
});