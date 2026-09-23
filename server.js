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
    console.log('¡Nuevo gato conectado! ID:', socket.id);

    players[socket.id] = {
        x: Math.floor(Math.random() * 600) + 100,
        y: Math.floor(Math.random() * 400) + 100,
        playerId: socket.id
    };

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // --- NUEVO: Escuchar y transmitir mensajes del chat ---
    socket.on('chatMessage', (message) => {
        // Enviar el mensaje a TODOS los jugadores (incluyendo al emisor)
        io.emit('chatMessage', {
            id: socket.id,
            text: message
        });
    });

    socket.on('disconnect', () => {
        console.log('Gato desconectado ID:', socket.id);
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor multijugador corriendo en el puerto ${PORT}`);
});