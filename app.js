const express = require('express');
const path = require('path');
const dotenv = require("dotenv").config();
const connectDb = require('./config/mongoDB');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions= require('./config/corsOptions');
const util = require('./common/util')
const socket = require('./middleware/socket'); 



connectDb();
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors(corsOptions));

app.use(express.urlencoded({extended:false}))  //it is importent to get req boy from browser



app.use('/user', require("./routes/user"))
app.use('/contact', require("./routes/contact"))
app.use('/chat', require("./routes/chat"))
  
  // Call deleteExpiredUsers function every hour
  setInterval(util.deleteExpiredUsers, 60 * 1000);


const server = app.listen(3000, () => {
    console.log("Server runs at port 3000");
})

// Call the initializeSocket function and pass the server instance
socket(server);

// const io = socket(server, {
//   cors: {
//     origin:['http://localhost:4200', 'https://myapps-jbmx.onrender.com'], // Adjust this to match your Angular application's URL
//     methods: ['GET', 'POST'],
//     allowedHeaders: ['Content-Type']
//   }
// })
// // Maintain a list of connected clients and their online status
// const connectedClients = {};

// io.on('connection', (socket) => {
//   console.log(`New Connection ${socket.id}`);
// socket.on('updatedOnlineStatus', function(data) {
//   console.log('updateStatus');
//   io.sockets.emit('updatedOnlineStatus', connectedClients)
// })
// socket.on('online', function(data) {
//   connectedClients[data.userNumber] = { online: 'online' };
//   console.log(connectedClients);
//   io.sockets.emit('online', data)
// })
// socket.on('disConnect', function(data) {
//   console.log(data);
//   connectedClients[data.userNumber] = { online: 'offline' };
  
//   io.sockets.emit('disConnect', data)
//   delete connectedClients[data.userId];
//   console.log(connectedClients);
// })
//   socket.on('chat', function(data) {
//     io.sockets.emit('chat', data)
//   })
//   socket.on('typing', function(data) {
//     io.sockets.emit('typing', data)
//   })
// })
