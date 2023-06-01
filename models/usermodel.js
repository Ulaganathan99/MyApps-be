
const chatSchema = require('./chatmodel')
const contactSchema = require('./contactmodel')

const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    userID:{
        type:String,
        unique: [true, "userID already registered"]
    },
    name: {
        type:String,
        required: [true, "Please add the name"]
    },
    email: {
        type:String,
        required: [true, "Please add the user email address"],
        unique: [true, "Email address already registered"]
    },
    number: {
        type:String,
        required: [true, "Please add the Number"],
        unique: [true, "Number already registered"]
    },
    password: {
        type:String,
        required: [true, "Please add the user password"]
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date, 
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    noOfAttempt: {
        type: Number
    },
    avatar: {
        data: Buffer,
        contentType: String
    },
    contacts: [contactSchema],
    messages: [chatSchema]
}, {
    timestamps: true
})

module.exports = mongoose.model("User", userSchema)