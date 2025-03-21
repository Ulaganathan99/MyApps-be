const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/usermodel");
const nodemailer = require('nodemailer')
const jwt = require("jsonwebtoken");
const path = require('path');
const util = require('../common/util')
const fs = require('fs');


exports.signup = asyncHandler(async (req, res) => {
  const { name, email, number, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ error: "All Fields are Mandatory." });
  }
  const userAvailableEmail = await User.findOne({ email });
  const userAvailableNumber = await User.findOne({ number });
  if (userAvailableEmail) {
    return res.json({ error: "Email already Registered." });
  } 
 if(userAvailableNumber){
    return res.json({ error: "Number already Registered." });
  }
    const hashPassword = await bcrypt.hash(password, 10);
    const otp = util.generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // OTP valid for 15 minutes
    const user = new User({
      name,
      email,
      number,
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
            resolve();
          }
        });
      });
      console.log('mail sent');
      return res.json({statusCode: 1, email: email, success: "OTP Sent to your Email." });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).send("Error registering user");
    }
  
});

exports.signupVerification = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check if the email exists in the database
    const dbUser = await User.findOne({ email });

    // Check if the OTP is valid and hasn't expired
    const currentTime = new Date();
    if (dbUser.otp !== otp || currentTime > dbUser.otpExpires) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Generate a unique user ID
    let userId;
    let isUnique = false;
    while (!isUnique) {
      userId = util.generateUserId();

      // Check if the generated ID already exists in the database
      const existingUser = await User.findOne({ userID: userId });
      if (!existingUser) {
        isUnique = true;
      }
    }

    // Activate the user's account
    dbUser.isVerified = true;
    dbUser.userID = userId;
    dbUser.otp = undefined;
    dbUser.otpExpires = undefined;

    // Save the user to the database
    await dbUser.save();
    // Find users whose contact lists include the signup user's number
  const usersToUpdate = await User.find({ 'contacts.number': dbUser.number });

// Iterate over the users and update their contact details
  usersToUpdate.forEach(async (user) => {
  user.contacts.forEach((contact) => {
    if (contact.number === dbUser.number) {
      contact.isUser = true;
    }
  });
  // Save the changes to each user
  await user.save();


})
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
              user_id: userDetails.userID,
              user_email: userDetails.email,
              user_logo: userDetails.avatar,
              user_number: userDetails.number
            },
            session_id : token,
            message: 'Login Success'
            });            
      }else {
        return res.json({ error: 'Incorrect Password.' });
      }

  }catch(error){
      console.log(error);
      return res.json({ message: 'Server Error.' });
    }
})

exports.getUserInfo =asyncHandler(async(req,res) => { 

  const { user_id } = req.body;
  const dbUser = await User.findOne({ userID : user_id })
   res.status(200).json({
    statusCode: 1,
    success: true,
    data: {
      userID: dbUser.userID,
      name: dbUser.name,
      email: dbUser.email,
      avatar: dbUser.avatar,
      number: dbUser.number
    }
  });  

})

exports.editProfile = asyncHandler(async(req,res) => {
    const userID = req.body.userID;
    const name = req.body.name;
    const dbUser = await User.findOne({ userID })
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if(name){
      dbUser.name = name
    }
    if(req.file){
      if(dbUser.avatar){
         fs.unlink(dbUser.avatar, (err) => {
          if (err) {
            console.error('Error deleting previous image:', err);
          } else {
            // console.log('Previous image deleted successfully');
          }
        });
        dbUser.avatar = req.file.path;
      }else{
        dbUser.avatar = req.file.path;
      }
    }
    // Save the updated user
    dbUser.save();

    if(req.file){
      const imageLocation = req.file.path;
      // Find users whose contact lists include the signup user's number
      const usersToUpdate = await User.find({ 'contacts.number': dbUser.number });

    // Iterate over the users and update their contact details
    usersToUpdate.forEach(async (user) => {
      user.contacts.forEach((contact) => {
        if (contact.number === dbUser.number) {
          contact.avatar = imageLocation;
        }
      });
      // Save the changes to each user
      await user.save();

    })
    }
    
    const ChangedDbUser = await User.findOne({ userID })
    
   return res.json({
    statusCode: 1, 
    status: 'Image saved.', 
    user: {
      user_id: ChangedDbUser.userID,
      user_name: ChangedDbUser.name,
      user_email: ChangedDbUser.email,
      user_logo: ChangedDbUser.avatar,
  } });
})

exports.deleteProfile = asyncHandler(async(req,res) => {
  const {userID} = req.body
  const dbUser = await User.findOne({ userID })
    if(dbUser){
        await User.deleteOne({ userID });
            // Find users whose contact lists include the signup user's number
  const usersToUpdate = await User.find({ 'contacts.number': dbUser.number });

  // Iterate over the users and update their contact details
    usersToUpdate.forEach(async (user) => {
    user.contacts.forEach((contact) => {
      if (contact.number === dbUser.number) {
        contact.isUser = false;
        contact.avatar = undefined;
      }
    });
    // Save the changes to each user
    await user.save();
  
  
  })
        return res.status(200).json({ statusCode: 1, success: 'Account Deleted.' });
    }
    return res.status(500).send('Server error');
})


exports.getProfileImg = asyncHandler(async (req, res) => {
  if(req.body.imgUrl){
    const imagePath = path.join(__dirname, '..', req.body.imgUrl); // Adjust the path according to your file structure
     return res.sendFile(path.resolve(imagePath));
  }else{
    return res.status(200).json({message: 'Profile Not found'})
  }
});

exports.forgot = asyncHandler(async (req, res) => {
  const {email} = req.body
  const dbUser = await User.findOne({ email })

  if (!dbUser) {
    return res.json({ error: "Email Not Registered" });
  }
  const otp = util.generateOTP();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

  dbUser.otp = otp;
  dbUser.otpExpires = otpExpires;
  await dbUser.save();
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ulagaoffice@gmail.com",
        pass: process.env.MAIL_PASS,
      },
    });

    const option = {
      from: "ulagaoffice@gmail.com",
      to: dbUser.email,
      subject: "OTP for Forgot Password",
      html: `
              <h1>Hi ${dbUser.name}</h1>
              <h2>Your OTP for account activation is ${otp}. It is valid for 15 minutes.</h2>
            `,
    };
    await new Promise((resolve, reject) => {
      transporter.sendMail(option, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    console.log('mail sent');
    return res.json({statusCode: 1, success: "OTP Sent to your Email." });
  } catch (error) {
    console.error("Error sending forgot otp:", error);
    return res.status(500).send("Error sending otp");
  }
})

exports.forgotVerification = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check if the email exists in the database
    const dbUser = await User.findOne({ email });

    // Check if the OTP is valid and hasn't expired
    const currentTime = new Date();
    if (dbUser.otp !== otp || currentTime > dbUser.otpExpires) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Activate the user's account
    dbUser.otp = undefined;
    dbUser.otpExpires = undefined;
    // Save the user to the database
    await dbUser.save();
    return res.status(200).json({ statusCode: 1, success: 'OTP Verified.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error.' });
  }
})

exports.changePassword = asyncHandler(async (req, res) => {
  const {email, newPassword} = req.body
  const hashPassword = await bcrypt.hash(newPassword, 10);
  const dbUser = await User.findOne({ email });
  if(dbUser){
      await User.updateOne({ email },{ password:hashPassword })
      return res.status(200).json({ statusCode: 1, success: 'Password Changed.' });
  }
})
