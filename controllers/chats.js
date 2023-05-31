const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");
const Contact = require("../models/contactmodel");
const Chats = require("../models/chatmodel");

exports.getChatContacts = asyncHandler(async (req, res) => {
  const { userID } = req.body;
  const dbUser = await User.findOne({ userID });
  const chatContactList = dbUser.contacts.filter(contact => contact.isUser === true);
  return res.json({ statusCode: 1, chatContactList });
});
exports.getInviteContacts = asyncHandler(async (req, res) => {
  const { userID } = req.body;
  const dbUser = await User.findOne({ userID });
  const inviteContactList = dbUser.contacts.filter(contact => contact.isUser === false);
  return res.json({ statusCode: 1, inviteContactList });
});
