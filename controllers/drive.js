const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");



exports.uploadFile = asyncHandler(async (req, res) => {
    try{
        let folderData = req.body
    const dbUser = await User.findOne({ userID : folderData.userId });
    if (!dbUser) {
        return res.status(404).json({ statusCode: 0, error: "User not found." });
      }
    if(folderData.fileType == 'folder'){
        let existingFolder = dbUser.drive.some(item => item.name == folderData.name && item.filePath == folderData.filePath)
        if(existingFolder){
            return res.json({ statusCode: 0, error: "Folder name already exist." });
        }
        dbUser.drive.push({
            userId: folderData.userId,
            filePath: folderData.filePath,
            fileType: folderData.fileType,
            name: folderData.name,
        });
        await dbUser.save();
        let folders = dbUser.drive.filter(item => item.filePath == folderData.filePath && item.fileType == 'folder')
        return res.status(201).json({ statusCode: 1, message: "Folder created successfully.", folderData: folders });
    } else {
        
    }
    } catch(err){
        console.log(err)
    }
});

exports.fetchFile = asyncHandler(async (req, res) => {
    let {filePath, userId} = req.body
    const dbUser = await User.findOne({ userID : userId });
    if (!dbUser) {
        return res.status(404).json({ statusCode: 0, error: "User not found." });
    }
    let folderData = dbUser.drive.filter(item => item.filePath == filePath && item.fileType == 'folder')
    let fileData = dbUser.drive.filter(item => item.filePath == filePath && item.fileType != 'folder')
    return res.json({ statusCode: 1, folderData, fileData })

});