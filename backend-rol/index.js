require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // ✨ 1. IMPORTAMOS HTTP
const { Server } = require('socket.io'); // ✨ 2. IMPORTAMOS SOCKET.IO

const app = express();

// ✨ 3. CREAMOS EL SERVIDOR HTTP BASADO EN EXPRESS
const server = http.createServer(app);

// ✨ 4. CONFIGURAMOS EL MEGÁFONO (SOCKET.IO) CON LOS MISMOS PERMISOS CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://gestor-eventos-rol.vercel.app',
      /\.vercel\.app$/
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'authorization']
  }
});

// ✨ 5. GUARDAMOS 'io' EN APP PARA PODER USARLO DESDE CUALQUIER RUTA (ej: partidasRoutes.js)
app.set('io', io);

// ✨ 6. ESCUCHAMOS QUIÉN SE CONECTA A LA TABERNA
io.on('connection', (socket) => {
  console.log('🔮 Un aventurero se ha conectado a la red telepática:', socket.id);

  socket.on('disconnect', () => {
    console.log('💨 Un aventurero ha dejado la red telepática:', socket.id);
  });
});

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
const sistemasRoutes = require('./routes/sistemasRoutes'); 

// Usamos las rutas
app.use('/api', authRoutes); 
app.use('/api/eventos', eventosRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/usuarios', usuariosRoutes); 
// ✨ AQUÍ LE DECIMOS AL SERVIDOR QUE ABRA LAS PUERTAS A LOS SISTEMAS
app.use('/api/sistemas', sistemasRoutes);

const PUERTO = process.env.PORT || 3001;

// ✨ ATENCIÓN: AHORA INICIAMOS 'server' EN LUGAR DE 'app' PARA QUE SOCKET.IO FUNCIONE
server.listen(PUERTO, '0.0.0.0', () => {
  console.log(`⚔️  Asociación de Rol La Pampa activa en puerto ${PUERTO}`);
  console.log(`🔮 Red telepática (WebSockets) inicializada y en escucha.`);
});