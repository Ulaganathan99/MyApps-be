const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const bucketRegion = process.env.S3_BUCKET_REGION
const accessKey = process.env.BUCKET_ACCESS_KEY
const secretAccessKey = process.env.BUCKET_SECRET_KEY

const s3  = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
})

// Generate single presigned url to upload file
app.post("/generate-single-presigned-url", async (req, res) => {
    try {
      const {key, contentType, fileSize} = req.body;
  
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Expires: 60, // Expires in 60 seconds
        ContentType: contentType,  // Restrict to specific content type
        ACL: "bucket-owner-full-control",
      };
  
      let url = await s3.getSignedUrlPromise("putObject", params);
  
      return res.status(200).json({ url, fileSize, contentType });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Error generating presigned URL" });
    }
  });

  // endpoint to start multipart upload
app.post("/start-multipart-upload", async (req, res) => {
    // initialization
    let fileName = req.body.fileName;
    let contentType = req.body.contentType;
  
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
    };
  
    // add extra params if content type is video
    if (contentType == "VIDEO") {
      params.ContentDisposition = "inline";
      params.ContentType = "video/mp4";
    }
  
    try {
      const multipart = await s3.createMultipartUpload(params).promise();
      res.json({ uploadId: multipart.UploadId });
    } catch (error) {
      console.error("Error starting multipart upload:", error);
      return res.status(500).json({ error: "Error starting multipart upload" });
    }
  });

  // Generate presigned url for each multiparts
app.post("/generate-multipart-presigned-url", async (req, res) => {
    // get values from req body
    const { fileName, uploadId, partNumbers } = req.body;
    const totalParts = Array.from({ length: partNumbers }, (_, i) => i + 1);
    try {
      const presignedUrls = await Promise.all(
        totalParts.map(async (partNumber) => {
          const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
            PartNumber: partNumber,
            UploadId: uploadId,
            Expires: 3600 * 3,
          };
  
          return s3.getSignedUrl("uploadPart", {
            ...params,
          });
        })
      );
      res.json({ presignedUrls });
    } catch (error) {
      console.error("Error generating pre-signed URLs:", error);
      return res.status(500).json({ error: "Error generating pre-signed URLs" });
    }
  });

  // Complete multipart upload
app.post("/complete-multipart-upload", async (req, res) => {

    // Req body
    let fileName = req.body.fileName;
    let uploadId = req.body.uploadId;
    let parts = req.body.parts;
  
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      UploadId: uploadId,
  
      MultipartUpload: {
        Parts: parts.map((part, index) => ({
          ETag: part.etag,
          PartNumber: index + 1,
        })),
      },
    };
    try {
      const data = await s3.completeMultipartUpload(params).promise();
      res.status(200).json({ fileData: data });
    } catch (error) {
      console.error("Error completing multipart upload:", error);
      return res.status(500).json({ error: "Error completing multipart upload" });
    }
  });