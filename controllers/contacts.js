const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");
const Contact = require("../models/contactmodel");

exports.addContact = asyncHandler(async (req, res) => {

    const userID = req.body.userID
    const dbUser = await User.findOne({ userID })
    const name = req.body.contactName.trim()
    const number= req.body.contactNumber.trim()
    const isContactName = dbUser.contacts.find(c => c.name === name);
    const isContactNumber = dbUser.contacts.find(c => c.number === number);

    if(isContactName){
        return res.json({statusCode: 1, error: "Contact name already saved." });
    }else if(isContactNumber){
        return res.json({statusCode: 1, error: "Contact number already saved." });
    } else{
        dbUser.contacts.push({name,number})
        await dbUser.save();
        return res.json({statusCode: 1, success: "Contact saved successfully." });
    }
})

exports.getContact = asyncHandler(async (req, res) => {

   const { userID } = req.body;
   const dbUser = await User.findOne({ userID })

   const contactList = dbUser.contacts
   console.log(contactList);
   return res.json({statusCode: 1, contactList });



})