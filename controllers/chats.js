const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");
const Contact = require("../models/contactmodel");
const Chats = require("../models/chatmodel");

exports.getChatContacts = asyncHandler(async (req, res) => {
  const { userID } = req.body;
  const dbUser = await User.findOne({ userID });
  const chatContactList = dbUser.contacts.filter(
    (contact) => contact.isUser === true
  );
  return res.json({ statusCode: 1, chatContactList });
});
exports.getInviteContacts = asyncHandler(async (req, res) => {
  const { userID } = req.body;
  const dbUser = await User.findOne({ userID });
  const inviteContactList = dbUser.contacts.filter(
    (contact) => contact.isUser === false
  );
  return res.json({ statusCode: 1, inviteContactList });
});
exports.sendChat = asyncHandler(async (req, res) => {
  try{
  const { message, owner, receiver } = req.body;
  const ownerUser = await User.findOne({ userID: owner });
  const receiveUser = await User.findOne({ number: receiver });

  if (!ownerUser || !receiveUser) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  // Create a new message object
  const newMessage = {
    message: message,
    sender: ownerUser.number,
    receiver: receiver,
  };
  // Update the sendUser's database with the new message
  ownerUser.messages.push(newMessage);
  await ownerUser.save();

  // Update the receiveUser's database with the new message
  receiveUser.messages.push(newMessage);
  await receiveUser.save();
 console.log('stored success');
 res.status(200).json({ statusCode: 1 });
} catch (err) {
  console.log(err);
  res.status(500).json({ success: false, message: 'Failed to store message.' });
}
});
exports.getChat = asyncHandler(async (req, res) => {
  try {
    const { owner, receiver } = req.body;

    const ownerUser = await User.findOne({ userID: owner });

    // Check if sender exists
    if (!ownerUser) {
      return res.status(404).json({ success: false, message: 'Sender not found.' });
    }

    // Find the messages between the sender and receiver
    const sendMessages = ownerUser.messages.filter(
      (message) => message.sender === ownerUser.number && message.receiver === receiver
    );

    const receiveMessages = ownerUser.messages.filter(
      (message) => message.sender === receiver && message.receiver === ownerUser.number
    );
    // Return the initial messages to the frontend
    res.status(200).json({ statusCode: 1, sendMessages, receiveMessages });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
})

exports.deleteChatHistory = asyncHandler(async (req, res) => {
  try{
    const { owner, receiver } = req.body;

    const ownerUser = await User.findOne({ userID: owner });

    // Check if sender exists
    if (!ownerUser) {
      return res.status(404).json({ success: false, message: 'Sender not found.' });
    }

  } catch(err){
    console.log(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
})
