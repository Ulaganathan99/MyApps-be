const User = require("../models/usermodel");


exports.generateOTP = () => {
    let otp = "";
    for (let i = 0; i < 6; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  exports.generateUserId = () => {
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

  exports.deleteExpiredUsers = async () => {
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
      }
    } catch (error) {
      console.error('Error deleting expired users:', error);
    }
  };