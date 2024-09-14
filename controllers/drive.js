const asyncHandler = require("express-async-handler");
const User = require("../models/usermodel");



exports.uploadFile = asyncHandler(async (req, res) => {
    try{
        let data = req.body
        const dbUser = await User.findOne({ userID : data.userId });
    if (!dbUser) {
        return res.status(404).json({ statusCode: 0, error: "User not found." });
      }
    if(data.fileType == 'folder'){
        let existingFolder = dbUser.drive.some(item => item.name == data.name && item.filePath == data.filePath)
        if(existingFolder){
            return res.json({ statusCode: 0, error: "Folder name already exist." });
        }
        dbUser.drive.push({
            userId: data.userId,
            filePath: data.filePath,
            fileType: data.fileType,
            name: data.name,
        });
        await dbUser.save();
        let folderData = dbUser.drive.filter(item => item.filePath == data.filePath && item.fileType == 'folder')
        return res.status(201).json({ statusCode: 1, message: "Folder created successfully.", folderData });
    } else {
        let url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${data.key}`
        dbUser.drive.push({
            userId: data.userId,
            filePath: data.filePath,
            fileType: data.fileType,
            name: data.name,
            s3Url: url,
            key: data.key
        });
        await dbUser.save();
        let fileData = dbUser.drive.filter(item => item.filePath == data.filePath && item.fileType != 'folder')
        return res.status(201).json({ statusCode: 2, message: "File added successfully.", fileData });
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

exports.checkNameAlreadyExist = async (filePath, fileName, userId) => {
    const dbUser = await User.findOne({ userID: userId });
    
    // Check if user exists
    if (!dbUser) {
        return { statusCode: 404, error: "User not found." };
    }

    // Check if the file exists
    const fileExist = dbUser.drive.some(item => 
        item.filePath === filePath && item.name === fileName && item.fileType !== 'folder'
    );
    
    // If file exists, generate a new name
    if (fileExist) {
        let count = 1;
        let newFileName;
        let exist = true;

        while (exist) {
            // Construct new file name with counter
            newFileName = `${fileName}_${count.toString().padStart(2, '0')}`;

            // Check if the new file name already exists
            const newNameExists = dbUser.drive.some(item => 
                item.filePath === filePath && item.name === newFileName && item.fileType !== 'folder'
            );
            
            // If no such file exists, break the loop
            if (!newNameExists) {
                exist = false;
            } else {
                count++;
            }
        }
        
        return newFileName;
    }

    // If file doesn't exist, return the original name
    return fileName;
};