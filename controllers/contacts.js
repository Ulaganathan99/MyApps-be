const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");
const Contact = require("../models/contactmodel");

exports.addContact = asyncHandler(async (req, res) => {
  const userID = req.body.userID;
  const dbUser = await User.findOne({ userID });
  const name = req.body.contactName.trim();
  const number = req.body.contactNumber.trim();
  const isContactName = dbUser.contacts.find((c) => c.name === name);
  const isContactNumber = dbUser.contacts.find((c) => c.number === number);

  if (isContactName) {
    return res.json({ statusCode: 1, error: "Contact name already saved." });
  } else if (isContactNumber) {
    return res.json({ statusCode: 1, error: "Contact number already saved." });
  } else {
    dbUser.contacts.push({ name, number });
    await dbUser.save();
    return res.json({ statusCode: 1, success: "Contact saved successfully." });
  }
});

exports.getContact = asyncHandler(async (req, res) => {
  const { userID } = req.body;
  const dbUser = await User.findOne({ userID });
  const contactList = dbUser.contacts;
  return res.json({ statusCode: 1, contactList });
});

exports.deleteContact = asyncHandler(async (req, res) => {
  console.log(req.body);
  try {
    const { userID, contactNumber } = req.body;
    const dbUser = await User.findOne({ userID });
    console.log("contact");
    dbUser.contacts = dbUser.contacts.filter(
      (contact) => contact.number !== contactNumber
    );
    await dbUser.save();
    return res.json({ statusCode: 1 });
  } catch (error) {
    console.error(error);
  }
});

exports.editContact = asyncHandler(async (req, res) => {});

exports.deleteAllContacts = asyncHandler(async (req, res) => {
  try {
    const userID = req.body.userID;
    const contactList = req.body.contactNumbers;

    // Extract the numbers from the contactList
    const numbersToDelete = contactList.map((contact) => contact.number);

    // Find the user by userID
    const user = await User.findOne({ userID: userID });

    // Filter the contacts to be deleted
    const updatedContacts = user.contacts.filter(
      (contact) => !numbersToDelete.includes(contact.number)
    );

    // Update the user's contacts with the filtered contacts
    user.contacts = updatedContacts;

    // Save the updated user
    await user.save();

    res
      .status(200)
      .json({
        statusCode: 1,
        success: true,
        message: "Contacts deleted successfully.",
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
