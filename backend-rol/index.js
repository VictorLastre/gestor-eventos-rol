require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 

const app = express();
const server = http.createServer(app);

// ✨ 1. LISTA DE DOMINIOS AUTORIZADOS (Ajustado para Hostinger)
const dominiosAutorizados = [
  'http://localhost:5173',
  'https://hotpink-butterfly-694113.hostingersite.com',
  'https://rollapampa.org',
  'https://www.rollapampa.org',
  'https://gestor-eventos-rol.vercel.app'
];

// ✨ 2. CONFIGURACIÓN DEL MEGÁFONO (SOCKET.IO)
const io = new Server(server, {
  path: '/api/socket.io', // Ajuste para que Passenger (Hostinger) no se confunda
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

// Ruta de supervivencia (Configurada para responder en la raíz y en /api)
app.get('/', (req, res) => {
  res.status(200).send('🏰 ¡La fortaleza del Gremio está en pie y los servidores respiran!');
});

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

// ✨ RESTAURAMOS EL PREFIJO '/api' PORQUE EXPRESS RECIBE LA RUTA COMPLETA DESDE PASSENGER ✨
app.use('/api', authRoutes); 
app.use('/api/eventos', eventosRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/usuarios', usuariosRoutes); 
app.use('/api/sistemas', sistemasRoutes);
app.use('/api/escapes', escapeRoutes);

// ✨ 4. PUERTO DINÁMICO PARA HOSTINGER
// Hostinger (Passenger) asigna el puerto automáticamente
const PUERTO = process.env.PORT || 8080;

server.listen(PUERTO, () => {
  console.log(`⚔️ Asociación de Rol La Pampa activa en el puerto ${PUERTO}`);
  console.log(`🔮 Red telepática inicializada.`);
});