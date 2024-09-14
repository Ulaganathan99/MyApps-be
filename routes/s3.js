const express = require('express')
const router = express.Router()
const s3Controller = require('../controllers/s3')


router.post('/generate-single-presigned-url', s3Controller.getSinglePresignedUrl)
router.post('/start-multipart-upload', s3Controller.startMultipartUpload)
router.post('/generate-multipart-presigned-url', s3Controller.getMultipartPresignedUrl)
router.post('/complete-multipart-upload', s3Controller.completeMultipartUpload)
router.post('/abortMultipartUpload', s3Controller.abortMultipartUpload)
router.post('/deleteSingleFile', s3Controller.deleteSingleFile)
router.post('/renameFile', s3Controller.renameFile)


module.exports = router;