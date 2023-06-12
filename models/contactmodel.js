const mongoose = require('mongoose');
const { Schema } = mongoose;
const chatSchema = require('./chatmodel')


const contactSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  isUser: {
    type: Boolean,
    required: true
  },
  messages: {
    type: [chatSchema],
    default: []
  }
});

module.exports = contactSchema;