const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");
const Contact = require("../models/contactmodel");
const exceljs = require('exceljs')

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
    const isUser = await User.findOne ({ number })
    if(isUser){
      dbUser.contacts.push({ name, number, isUser : true });
    } else {
      dbUser.contacts.push({ name, number, isUser : false });
    }
    
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

exports.getContactTable = asyncHandler(async (req, res) => {
  console.log(req.body);
  const  userID  = req.body.userID;
  const dbUser = await User.findOne({ userID });
  const { pageIndex, pageSize, searchText } = req.body.pageSize;

  const startIndex = pageIndex * pageSize - pageSize;
  const endIndex = pageIndex * pageSize;
  if(searchText){
    contactList = dbUser.contacts
    contactList.sort((a, b) => a.name.localeCompare(b.name));
    const filteredContactList = contactList.filter(contact => {
    const regex = new RegExp(searchText, 'i'); // Case-insensitive regular expression
    return regex.test(contact.name) || regex.test(contact.number);
  });
  const totalRecords = filteredContactList.length
  const paginatedContactList = filteredContactList.slice(startIndex, endIndex);
  return res.json({ statusCode: 1, contactList: paginatedContactList, totalRecords });
  }else{
    contactList = dbUser.contacts
    contactList.sort((a, b) => a.name.localeCompare(b.name));
    const paginatedContactList = contactList.slice(startIndex, endIndex);
    paginatedContactList.sort((a, b) => a.name.localeCompare(b.name));
    const totalRecords = dbUser.contacts.length
    return res.json({ statusCode: 1, contactList: paginatedContactList, totalRecords });
  }
  
  console.log(totalRecords);
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

exports.editContact = asyncHandler(async (req, res) => {
  try{
   console.log('edit');
   console.log(req.body);
    const userID = req.body.userID;
    const contactID = req.body.contactID;
    const dbUser = await User.findOne({ userID });
    const contactName = req.body.contactName.trim()
    const contactNumber= req.body.contactNumber.trim()
    const isContactName = dbUser.contacts.find(c => c.name === contactName);
    const isContactNumber = dbUser.contacts.find(c => c.number === contactNumber);

    if (isContactName) {
      return res.json({ statusCode: 1, error: "Contact name already saved." });
    } else if (isContactNumber) {
      return res.json({ statusCode: 1, error: "Contact number already saved." });
    } 
    if(contactName || contactNumber){
      const contact = dbUser.contacts.find(c => c._id == contactID);
          if (contact) {
          if(contactName && contactNumber){
            if(contactNumber.length != 10){
              return res.json({ statusCode: 1, error: "Invalid Number." });
            }
            contact.name = contactName
            contact.number = contactNumber
            await dbUser.save();
            return res.json({ statusCode: 1, success: "Contact Details Updated." });
          } else if(contactName){
              contact.name = contactName
              await dbUser.save();
              console.log('name');
              return res.json({ statusCode: 1, success: "Contact Name Updated." });
            }else if(contactNumber){
              if(contactNumber.length != 10){
                return res.json({ statusCode: 1, error: "Invalid Number." });
              }
              contact.number = contactNumber
              await dbUser.save();
              return res.json({ statusCode: 1, success: "Contact Number Updated." });
            }
          
          } 
  }else{
      return res.json({ statusCode: 1, error: "Server Error." });
    }
  } catch (err){
    console.log(err);
  }
});

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
exports.download =  asyncHandler(async(req,res) => {
console.log('download');
  const userID = req.body.userID;
  const dbUser = await User.findOne({ userID });
  const contacts = dbUser.contacts

  try {
      if (!contacts || contacts.length === 0) {
          return res.status(404).json({ message: 'Contacts not found' });
        } 
        // create a new workbook and worksheet
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Contacts');
        // define the columns
        worksheet.columns = [
          { header: 'Name', key: 'name', width: 25 },
          { header: 'Phone Number', key: 'number', width: 25 },
          // add more columns if necessary
        ];  
        // add the rows
        contacts.forEach(contact => {
          worksheet.addRow({
            name: contact.name,
            number: contact.number,
            // add more fields if necessary
          });
        });   
        // write the workbook to a buffer
        const buffer = await workbook.xlsx.writeBuffer();  
        // set the headers for the response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx'); 
        // send the buffer as the response
        res.send(buffer);
    } catch (err) {
      console.log(err);
    }
})
