require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const path = require('path'); // ✨ IMPORTANTE: Necesario para unir las rutas de los archivos

const app = express();
const server = http.createServer(app);

// ✨ 1. LISTA DE DOMINIOS AUTORIZADOS
const dominiosAutorizados = [
  'http://localhost:5173',
  'https://hotpink-butterfly-694113.hostingersite.com',
  'https://rollapampa.org',
  'https://www.rollapampa.org',
  'https://gestor-eventos-rol.vercel.app'
];

// ✨ 2. CONFIGURACIÓN DEL MEGÁFONO (SOCKET.IO)
const io = new Server(server, {
  path: '/api/socket.io',
  cors: {
    origin: dominiosAutorizados,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'authorization'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔮 Un aventurero se ha conectado a la red telepática:', socket.id);
  socket.on('disconnect', () => {
    console.log('💨 Un aventurero ha dejado la red telepática:', socket.id);
  });
});

// ✨ 3. CONFIGURACIÓN DE CORS PARA EXPRESS
app.use(cors({
  origin: dominiosAutorizados,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'authorization'],
  credentials: true
}));

app.use(express.json());

// Ruta de supervivencia del backend (Solo responde en /api ahora)
app.get('/api', (req, res) => {
  res.status(200).send('🏰 ¡La fortaleza del Gremio está en pie y los servidores respiran!');
});

// Importamos las rutas modulares
const authRoutes = require('./routes/authRoutes');
const eventosRoutes = require('./routes/eventosRoutes');
const partidasRoutes = require('./routes/partidasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const sistemasRoutes = require('./routes/sistemasRoutes'); 
const escapeRoutes = require('./routes/escapeRoutes'); 

// ✨ RUTAS DEL BACKEND ✨
app.use('/api', authRoutes); 
app.use('/api/eventos', eventosRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/usuarios', usuariosRoutes); 
app.use('/api/sistemas', sistemasRoutes);
app.use('/api/escapes', escapeRoutes);

// ✨ NUEVO: SERVIR EL FRONTEND DE REACT ✨
// Le decimos a Express que la carpeta 'public' contiene tu página web visual
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all: Si un usuario entra a cualquier ruta que no sea /api (ej: /login, /mesas), 
// Express le enviará el index.html de React para que el enrutador visual haga su magia.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✨ 4. PUERTO DINÁMICO
const PUERTO = process.env.PORT || 8080;

server.listen(PUERTO, () => {
  console.log(`⚔️ Asociación de Rol La Pampa activa en el puerto ${PUERTO}`);
  console.log(`🔮 Red telepática inicializada.`);
});