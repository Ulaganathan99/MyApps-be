
const contactSchema = require('./contactmodel')

const mongoose = require('mongoose')
const driveSchema = require('./drivemodel')

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
        type: String
    },
    contacts: [contactSchema],
    drive: [driveSchema]
}, {
    timestamps: true
})

module.exports = mongoose.model("User", userSchema)