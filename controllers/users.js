const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/usermodel");
const nodemailer = require('nodemailer')
const jwt = require("jsonwebtoken");
const path = require('path');



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
  const { name, email, number, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ error: "All Fields are Mandatory." });
  }
  const userAvailableEmail = await User.findOne({ email });
  const userAvailableNumber = await User.findOne({ number });
  if (userAvailableEmail) {
    return res.json({ error: "Email already Registered." });
  } else if(userAvailableNumber){
    return res.json({ error: "Number already Registered." });
  }else{
    const hashPassword = await bcrypt.hash(password, 10);
    function generateOTP() {
      let otp = "";
      for (let i = 0; i < 6; i++) {
        otp += Math.floor(Math.random() * 10);
      }
      return otp;
    }

    const otp = generateOTP();
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
      userId = generateUserId();

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
  console.log('login');
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
              user_logo: userDetails.avatar
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
  console.log(req.body);
    const userID = req.body.userID;
    const name = req.body.name;
    const imageLocation = req.file.path;
    const dbUser = await User.findOne({ userID })
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if(name){
      dbUser.name = name
    }
    if(imageLocation){
      dbUser.avatar = imageLocation
      console.log(imageLocation);
    }
    // Save the updated user
    dbUser.save();

    if(imageLocation){
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
        return res.status(200).json({ statusCode: 1, success: 'Account Deleted.' });
    }
    return res.status(500).send('Server error');
})


exports.getProfileImg = asyncHandler(async (req, res) => {
  const imagePath = path.join(__dirname, '..', req.body.imgUrl); // Adjust the path according to your file structure
  res.sendFile(path.resolve(imagePath));
});
