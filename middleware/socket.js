// socket.js

const socket = require('socket.io');
const connectedClients = {};

function initializeSocket(server) {
  const io = socket(server, {
    cors: {
      origin: ['http://localhost:4200', 'https://myapps-jbmx.onrender.com', 'https://myapps-frontend-container.onrender.com'], // Adjust this to match your Angular application's URL
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type']
    }
  });

  io.on('connection', (socket) => {
    console.log(`New Connection ${socket.id}`);

    socket.on('updatedOnlineStatus', function(data) {
      console.log('updateStatus');
      io.sockets.emit('updatedOnlineStatus', connectedClients);
    });

    socket.on('online', function(data) {
      connectedClients[data.userNumber] = { online: 'online' };
      console.log(connectedClients);
      io.sockets.emit('online', data);
    });

    socket.on('disConnect', function(data) {
      console.log(data);
      connectedClients[data.userNumber] = { online: 'offline' };
      io.sockets.emit('disConnect', data);
      delete connectedClients[data.userId];
      console.log(connectedClients);
    });

    socket.on('chat', function(data) {
      io.sockets.emit('chat', data);
    });

    socket.on('typing', function(data) {
      io.sockets.emit('typing', data);
    });

    socket.on('video-chat-request', function(data) {
      io.sockets.emit('video-chat-request', data);
    });
    socket.on('video-chat-accept', function(data) {
      io.sockets.emit('video-chat-accept', data);
    });
    socket.on('video-chat-data', function(data) {
      io.sockets.emit('video-chat-data', data);
    });
  });
}

module.exports = initializeSocket;