const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");
const Contact = require("../models/contactmodel");
const Chats = require("../models/chatmodel");

exports.getChatContacts = asyncHandler(async (req, res) => {
  const { userID } = req.body;
  const dbUser = await User.findOne({ userID });
  const chatContactList = dbUser.contacts.filter(
    (contact) => contact.isUser === true && contact.messages.length !== 0
  );

  return res.json({ statusCode: 1, chatContactList });
});
exports.getAllChatContacts = asyncHandler(async (req, res) => {
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
  const newMessage = {
      sender: ownerUser.number,
      receiver: receiver,
      message: message,
      };
     // Find the specific contact in ownerUser's contacts
    const ownerContact = ownerUser.contacts.find(contact => contact.number === receiver);
    if (!ownerContact) {
      return res.status(404).json({ success: false, message: 'Contact owner not found.' });
    }
    
    // Find the specific contact in receiveUser's contacts
    const receiveContact = receiveUser.contacts.find(contact => contact.number === ownerUser.number);
    if (!receiveContact) {
      return res.status(404).json({ success: false, message: 'Contact receive not found.' });
    }
    
    // Push the newMessage into the messages array of ownerContact
    ownerContact.messages.push(newMessage);
    await ownerUser.save();
    
    // Push the newMessage into the messages array of receiveContact
    receiveContact.messages.push(newMessage);
    await receiveUser.save();

    console.log('Message stored successfully');
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

    if (!ownerUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!ownerUser.contacts || !Array.isArray(ownerUser.contacts)) {
      return res.status(400).json({ success: false, message: 'Invalid contacts data.' });
    }

    const sendMessages = ownerUser.contacts.reduce((result, contact) => {
      if (
        contact.number === receiver &&
        Array.isArray(contact.messages)
      ) {
        const messages = contact.messages.filter(
          (message) => message.sender === ownerUser.number && message.receiver === receiver
        );
        result.push(...messages);
      }
      return result;
    }, []);

    const receiveMessages = ownerUser.contacts.reduce((result, contact) => {
      if (
        contact.number === receiver &&
        Array.isArray(contact.messages)
      ) {
        const messages = contact.messages.filter(
          (message) => message.sender === receiver && message.receiver === ownerUser.number
        );
        result.push(...messages);
      }
      return result;
    }, []);

    res.status(200).json({ statusCode: 1, sendMessages, receiveMessages });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
});

exports.deleteChatHistory = asyncHandler(async (req, res) => {
  try {
    const { owner, receiver } = req.body;
    const ownerUser = await User.findOne({ userID: owner });
    if (!ownerUser) {
      return res.status(404).json({ success: false, message: 'Sender not found.' });
    }
    const ownerContact = ownerUser.contacts.find(contact => contact.number === receiver);
    ownerContact.messages = [];
    await ownerUser.save();
    res.status(200).json({  statusCode: 1, message: 'Chat history deleted successfully.' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Failed to delete chat history.' });
  }
})
