const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/usermodel");
const nodemailer = require('nodemailer')
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const fs = require("fs");
const { log } = require("console");

function generateUserId() {
  const numbers = '0123456789';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let userId = '';

  // Generate 6-digit random number
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    userId += numbers[randomIndex];
  }

  // Add 2 random characters at random positions
  for (let i = 0; i < 2; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    const randomPosition = Math.floor(Math.random() * userId.length);
    userId = userId.slice(0, randomPosition) + characters[randomIndex] + userId.slice(randomPosition);
  }

  return userId;
}



exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ error: "All Fields are Mandatory." });
  }
  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    return res.json({ error: "Email already Registered." });
  } else {
    const hashPassword = await bcrypt.hash(password, 10);
    function generateOTP() {
      let otp = "";
      for (let i = 0; i < 6; i++) {
        otp += Math.floor(Math.random() * 10);
      }
      return otp;
    }

    const otp = generateOTP();
    console.log(otp);
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // OTP valid for 15 minutes
    const user = new User({
      name,
      email,
      password: hashPassword,
      otp,
      otpExpires,
    });

    try {
      await user.save();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "ulagaoffice@gmail.com",
          pass: process.env.MAIL_PASS,
        },
      });

      const option = {
        from: "ulagaoffice@gmail.com",
        to: email,
        subject: "OTP for account activation",
        html: `
                <h1>Hi ${name}</h1>
                <h2>Your OTP for account activation is ${otp}. It is valid for 15 minutes.</h2>
              `,
      };
      await new Promise((resolve, reject) => {
        transporter.sendMail(option, (err, info) => {
          if (err) {
            reject(err);
          } else {
            return res.json({ success: "OTP send to your Email." });
            resolve();
          }
        });
      });

      return res.status(200).json({statusCode: 1, email: email, success: "OTP Sent." });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).send("Error registering user");
    }
  }
});

exports.signupVerification = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check if the email exists in the database
    const user = await User.findOne({ email });

    // Check if the OTP is valid and hasn't expired
    const currentTime = new Date();
    if (user.otp !== otp || currentTime > user.otpExpires) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Generate a unique user ID
    let userId;
    let isUnique = false;
    while (!isUnique) {
      userId = generateUserId();

      // Check if the generated ID already exists in the database
      const existingUser = await User.findOne({ userID: userId });
      if (!existingUser) {
        isUnique = true;
      }
    }

    // Activate the user's account
    user.isVerified = true;
    user.userID = userId;
    user.otp = undefined;
    user.otpExpires = undefined;

    // Save the user to the database
    await user.save();

    return res.status(200).json({ statusCode: 1, success: 'Account activated.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error.' });
  }
};

exports.login =asyncHandler(async(req,res) => { 
  try{
      const { email, password} = req.body;
      if(!email || !password) {
          return res.json({ error: 'All fields are mandatory ' });
      }
      const userDetails = await User.findOne({ email })

      if(!userDetails){
          return res.json({ error: 'Invalid email.' });
      } else if (userDetails.isVerified === false){
        return res.json({ error: 'Verify your email.' });
      }
      
      if(userDetails&&(userDetails.isVerified === true) && (await bcrypt.compare(password, userDetails.password))) {
          const id = userDetails.email
          const token = jwt.sign({id: id}, 
          process.env.JWT_SECRET,
          {expiresIn: process.env.JWT_EXPIRES_IN}
          )
          
          return res.json({
            statusCode:1,
            user: {
              user_name: userDetails.name,
              user_id: userDetails.userID

            },
            session_id : token
            });            
      }else {
          return res.json({ error: 'Incorrect Password.' });
      }

  }catch(error){
      console.log(error);
      return res.status(500).send('Server error');
  }
})

exports.getUserInfo =asyncHandler(async(req,res) => { 

  const { user_id } = req.body;
  const userDetails = await User.findOne({ userID : user_id })
   res.status(200).json({
    success: true,
    data: userDetails
  });  

})



