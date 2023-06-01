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
  const { message, sender, receiver } = req.body;
  const sendUser = await User.findOne({ userID: sender });
  const receiveUser = await User.findOne({ number: receiver });

  if (!sendUser || !receiveUser) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  // Create a new message object
  const newMessage = {
    message: message,
    sender: sender,
    receiver: receiver,
  };
  // Update the sendUser's database with the new message
  sendUser.messages.push(newMessage);
  await sendUser.save();

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
    const { sender, receiver } = req.body;

    const sendUser = await User.findOne({ userID: sender });

    // Check if sender exists
    if (!sendUser) {
      return res.status(404).json({ success: false, message: 'Sender not found.' });
    }

    // Find the messages between the sender and receiver
    const messages = sendUser.messages.filter(
      (message) => message.sender === sender && message.receiver === receiver
    );

    // Set up change stream
    const changeStream = User.collection.watch();
    changeStream.on('change', (change) => {
      if (
        change.operationType === 'update' &&
        change.fullDocument.userID === sender &&
        change.fullDocument.number === receiver
      ) {
        // Retrieve the updated document
        const updatedDocument = change.fullDocument;

        // Extract the messages field from the updated document
        const updatedMessages = updatedDocument.messages.filter(
          (message) => message.sender === sender && message.receiver === receiver
        );

        // Send the updated messages to the client
        res.status(200).json({ statusCode: 2, messages: updatedMessages });
      }
    });

    // Return the initial messages to the frontend
    res.status(200).json({ statusCode: 1, messages });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
})
