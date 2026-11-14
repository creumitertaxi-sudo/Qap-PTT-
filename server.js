const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Armazena usuários online: { "31984280227": "socket_id" }
const usuariosOnline = {};

app.get('/', (req, res) => {
  res.send('Servidor Prancheta PTT Socket.io Online!');
});

io.on('connection', (socket) => {
  console.log('Nova conexão:', socket.id);

  // Registra o telefone na sala usando o número como chave
  socket.on('registrar', (numero) => {
    socket.numero = numero;
    socket.join(numero); // Entra na sala própria com o seu número
    usuariosOnline[numero] = socket.id;
    console.log(`Número registrado: ${numero}`);
    io.emit('lista-online', Object.keys(usuariosOnline));
  });

  // Sinalização WebRTC: Oferta (Offer)
  socket.on('webrtc-offer', ({ destino, remetente, offer }) => {
    io.to(destino).emit('webrtc-offer', { remetente, offer });
  });

  // Sinalização WebRTC: Resposta (Answer)
  socket.on('webrtc-answer', ({ destino, remetente, answer }) => {
    io.to(destino).emit('webrtc-answer', { remetente, answer });
  });

  // Sinalização WebRTC: Candidatos ICE (Rede)
  socket.on('webrtc-ice', ({ destino, candidate }) => {
    io.to(destino).emit('webrtc-ice', { candidate });
  });

  // Status de PTT (Falando / Escutando) e Mensagens/Comandos
  socket.on('ptt-status', ({ destino, remetente, acao }) => {
    io.to(destino).emit('ptt-status', { remetente, acao });
  });

  socket.on('ptt-comando', ({ destino, remetente, texto }) => {
    io.to(destino).emit('ptt-comando', { remetente, texto });
  });

  // Desconexão
  socket.on('disconnect', () => {
    if (socket.numero) {
      delete usuariosOnline[socket.numero];
      io.emit('lista-online', Object.keys(usuariosOnline));
      console.log(`Número desconectado: ${socket.numero}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor PTT rodando na porta ${PORT}`);
});
