const express = require('express');
require("dotenv").config();
const connectDb = require('./config/mongoDB');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions= require('./config/corsOptions');
const util = require('./common/util')
const socket = require('./middleware/socket'); 
const os = require('os')
const redis = require('ioredis')
const REDIS_HOST = '127.0.0.1'
const REDIS_PORT = process.env.REDIS_PORT || 6379

// const client = redis.createClient(REDIS_HOST,REDIS_PORT)

// client.on('connect', () => {
//   console.log('Connected to Redis');
// });

// client.on('error', (err) => {
//   console.error('Redis connection error:', err);
// });

connectDb();
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors(corsOptions));

app.use(express.urlencoded({extended:false}))  //it is importent to get req boy from browser
app.use('/user', require("./routes/user"))
app.use('/contact', require("./routes/contact"))
app.use('/chat', require("./routes/chat"))

app.use('/test', (req, res) => {
  res.send(`Nodejs project testing ${os.hostname()}`)
})
  
  // Call deleteExpiredUsers function every hour
  setInterval(util.deleteExpiredUsers, 60 * 1000);


const server = app.listen(3000, () => {
    console.log("Server runs at port 3000");
})

// Call the initializeSocket function and pass the server instance
socket(server);
