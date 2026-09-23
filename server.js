const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(__dirname));

const players = {};

io.on('connection', (socket) => {
    console.log('¡Nueva persona conectada! ID:', socket.id);

    socket.on('joinRoom', (userData) => {
        players[socket.id] = {
            x: Math.floor(Math.random() * 500) + 150,
            y: Math.floor(Math.random() * 200) + 250,
            playerId: socket.id,
            name: userData.name || 'Granjero',
            color: userData.color || 'blue',
            isTyping: false
        };

        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('chatMessage', (message) => {
        io.emit('chatMessage', {
            id: socket.id,
            text: message
        });
    });

    socket.on('emoteMessage', (emote) => {
        io.emit('emoteMessage', {
            id: socket.id,
            emote: emote
        });
    });

    // --- NUEVO: Sincronizar estado de "Escribiendo..." ---
    socket.on('typingState', (isTyping) => {
        if (players[socket.id]) {
            players[socket.id].isTyping = isTyping;
            socket.broadcast.emit('playerTyping', {
                id: socket.id,
                isTyping: isTyping
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Jugador desconectado ID:', socket.id);
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor de la sala corriendo en el puerto ${PORT}`);
});