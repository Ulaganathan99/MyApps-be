const express = require('express');
const path = require('path');
const dotenv = require("dotenv").config();
const connectDb = require('./config/mongoDB');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const socket = require('socket.io')
const corsOptions= require('./config/corsOptions');
const User = require('./models/usermodel');


connectDb();
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors(corsOptions));

app.use(express.urlencoded({extended:false}))  //it is importent to get req boy from browser



app.use('/user', require("./routes/user"))
app.use('/contact', require("./routes/contact"))
app.use('/chat', require("./routes/chat"))

const deleteExpiredUsers = async () => {
    try {
      const expiredUsers = await User.find({ otpExpires: { $lte: new Date() }, isVerified: false });
      if (expiredUsers.length > 0) {
        console.log(`Deleting ${expiredUsers.length} expired users`);
        for (const user of expiredUsers) {
          await User.deleteOne({ _id: user._id });
        }
        console.log('Expired users deleted successfully');
      }
        const expiredOTP = await User.find({ otpExpires: { $lte: new Date() }, isVerified: true });
        if (expiredOTP.length > 0) {
          console.log(`Deleting ${expiredUsers.length} expired otp`);
          for (const user of expiredVerifiedUsers) {
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
          }
          console.log('Expired users deleted successfully');
          

      } else {
        console.log('No expired users found');
        console.log('core changes');
      }
    } catch (error) {
      console.error('Error deleting expired users:', error);
    }
  };
  
  // Call deleteExpiredUsers function every hour
  setInterval(deleteExpiredUsers, 60 * 1000);


const server = app.listen(3000, () => {
    console.log("Server runs at port 3000");
})

const io = socket(server, {
  cors: {
    origin:['http://localhost:4200', 'https://myapps-jbmx.onrender.com'], // Adjust this to match your Angular application's URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  }
})

io.on('connection', (socket) => {
  console.log(`New Connection ${socket.id}`);

  socket.on('chat', function(data) {
    io.sockets.emit('chat', data)
  })
  socket.on('typing', function(data) {
    io.sockets.emit('typing', data)
  })
})
