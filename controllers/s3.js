const asyncHandler = require("express-async-handler");
const { checkNameAlreadyExist } = require('../controllers/drive')
// const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid');
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
const aws = require('aws-sdk')
const User = require("../models/usermodel");


const bucketName = process.env.S3_BUCKET_NAME
const region = process.env.S3_BUCKET_REGION
const accessKeyId = process.env.BUCKET_ACCESS_KEY
const secretAccessKey = process.env.BUCKET_SECRET_KEY

const s3  = new aws.S3({
    region,
    accessKeyId,
    secretAccessKey
  })


// Generate single presigned url to upload file
exports.getSinglePresignedUrl = asyncHandler(async (req, res) => {
    try {
      const {contentType, fileSize, filePath, fileName, userId} = req.body;
      let newFileName = await checkNameAlreadyExist(filePath, fileName, userId)
      let key;
      if(filePath.includes('/')){
        // Remove the 'Home/' from the start of the filePath
        const folderPath = filePath.replace(/^Home\//, '');
        key = `uploads/${userId}/${folderPath}/${newFileName}`
      }else{
        key = `uploads/${userId}/${newFileName}`
      }
      const params = {
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,  // Restrict to specific content type
        ACL: "bucket-owner-full-control",
        Expires: 60
      };
      const uploadUL = await s3.getSignedUrlPromise('putObject', params)
      return res.status(200).json({ url:uploadUL, fileSize, contentType, key, fileName : newFileName });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Error generating presigned URL" });
    }
  });
  // endpoint to start multipart upload
exports.startMultipartUpload = asyncHandler(async (req, res) => {
    // initialization
    const {contentType, fileSize, filePath, fileName, userId} = req.body;
      let newFileName = await checkNameAlreadyExist(filePath, fileName, userId)
      let key;
      if(filePath.includes('/')){
        // Remove the 'Home/' from the start of the filePath
        const folderPath = filePath.replace(/^Home\//, '');
        key = `uploads/${userId}/${folderPath}/${newFileName}`
      }else{
        key = `uploads/${userId}/${newFileName}`
      }
    const params = {
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,  // Restrict to specific content type
    };
  
    // add extra params if content type is video
    // if (contentType == "VIDEO") {
    //   params.ContentDisposition = "inline";
    //   params.ContentType = "video/mp4";
    // }
  
    try {
      const multipart = await s3.createMultipartUpload(params).promise();
      return res.json({ uploadId: multipart.UploadId, fileSize, contentType, key, fileName : newFileName });
    } catch (error) {
      console.error("Error starting multipart upload:", error);
      return res.status(500).json({ error: "Error starting multipart upload" });
    }
  });

  // Generate presigned url for each multiparts
exports.getMultipartPresignedUrl = asyncHandler(async (req, res) => {
    // get values from req body
    const {key, uploadId, partNumbers } = req.body;
    const totalParts = Array.from({ length: partNumbers }, (_, i) => i + 1);
    try {
      const presignedUrls = await Promise.all(
        totalParts.map(async (partNumber) => {
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            PartNumber: partNumber,
            UploadId: uploadId,
            Expires: 3600 * 3,
          };
          return s3.getSignedUrl("uploadPart", {
            ...params,
          });
        })
      );
      res.json({ presignedUrls, uploadId, key });
    } catch (error) {
      console.error("Error generating pre-signed URLs:", error);
      return res.status(500).json({ error: "Error generating pre-signed URLs" });
    }
  });
 
  // Complete multipart upload
exports.completeMultipartUpload = asyncHandler(async (req, res) => {

    // Req body
    let key = req.body.key;
    let uploadId = req.body.uploadId;
    let parts = req.body.parts;
    // Sanitize and sort the parts by PartNumber in ascending order
    const sanitizedParts = parts.map(part => ({
      ETag: part.ETag.replace(/^"+|"+$/g, ''), // Remove leading and trailing quotes
      PartNumber: part.PartNumber
    })).sort((a, b) => a.PartNumber - b.PartNumber); // Sort by PartNumber

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
  
      MultipartUpload: {
        Parts: sanitizedParts // Correctly nest parts under 'Parts'
      }
    };
    try {
      const data = await s3.completeMultipartUpload(params).promise();
      return res.status(200).json({ fileData: data });
    } catch (error) {
      console.error("Error completing multipart upload:", error);
      return res.status(500).json({ error: "Error completing multipart upload" });
    }
  });

  exports.abortMultipartUpload = async (req, res) => {
    const { uploadId, key } = req.body;  // Get the uploadId and key from the request body
  
    if (!uploadId || !key) {
      return res.status(400).json({ error: 'Missing required parameters: uploadId, key, and bucket' });
    }
  
    const params = {
      Bucket: process.env.S3_BUCKET_NAME, // The name of your S3 bucket
      Key: key,       // The object key for the multipart upload
      UploadId: uploadId // The uploadId associated with the multipart upload
    };
  
    try {
      // Abort the multipart upload
      await s3.abortMultipartUpload(params).promise();
  
      // Respond with success
      res.status(200).json({ message: 'Multipart upload aborted successfully' });
    } catch (error) {
      console.error('Error aborting multipart upload:', error);
  
      // Handle errors and respond accordingly
      res.status(500).json({ error: 'Failed to abort multipart upload', details: error.message });
    }
  };
  exports.deleteSingleFile = async (req, res) => {
    const { key, objectId, userId } = req.body;
  
    if (!key) {
      return res.status(400).json({ error: 'Missing required parameters: key and bucket' });
    }
  
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };
  
    try {
      // Delete the file from S3
      await s3.deleteObject(params).promise();
      if(objectId && userId){
         // Remove the file from the user's drive array
          const result = await User.updateOne(
            { userID: userId },
            { $pull: { drive: { _id: objectId, key: key } } }
        );
        // Check if the update was successful
        if (result.modifiedCount === 0) {
            return res.status(404).json({ statusCode: 0, error: "File not found or not deleted." });
        }
         // Respond with success
        return res.status(200).json({ statusCode: 1, message: 'File deleted successfully.' });
      }
      // Respond with success
      return res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
  
      // Handle error and send response
      res.status(500).json({ error: 'Failed to delete file', details: error.message });
    }
  };

  exports.renameFile = async (req, res) => {
    const { oldKey, newFileName, filePath, objectId, userId } = req.body;
  
    if (!oldKey || !newFileName) {
      return res.status(400).json({ error: 'Missing required parameters: oldKey and newFileName' });
    }
    let newKey;
    if(filePath.includes('/')){
      // Remove the 'Home/' from the start of the filePath
      const folderPath = filePath.replace(/^Home\//, '');
      newKey = `uploads/${userId}/${folderPath}/${newFileName}`
    }else{
      newKey = `uploads/${userId}/${newFileName}`
    }
  
    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      CopySource: `${process.env.S3_BUCKET_NAME}/${oldKey}`,
      Key: newKey
    };
  
    try {
      // Copy the file to the new key
      await s3.copyObject(s3Params).promise();
  
      // Delete the old file
      await s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: oldKey }).promise();
      if (objectId && userId) {
        let newUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${newKey}`

        // Update the file record in the database
        const result = await User.updateOne(
          { userID: userId, 'drive._id': objectId },
          { $set: { 'drive.$.key': newKey, 'drive.$.name': newFileName, 'drive.$.s3Url' : newUrl } } // Adjust based on your schema
        );
  
        // Check if the update was successful
        if (result.modifiedCount === 0) {
          return res.status(404).json({ statusCode: 0, error: 'File not found or not updated.' });
        }
      }
  
      // Respond with success
      return res.status(200).json({ statusCode: 1, message: 'File renamed successfully' });
  
    } catch (error) {
      console.error('Error renaming file:', error);
  
      // Handle error and send response
      return res.status(500).json({ error: 'Failed to rename file', details: error.message });
    }
  };

