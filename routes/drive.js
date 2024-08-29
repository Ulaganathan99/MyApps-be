const express = require('express')
const router = express.Router()
const driveController = require('../controllers/drive')
const authenticate = require('../middleware/authenticate');


router.post('/uploadFile', driveController.uploadFile)
router.post('/fetchFile', driveController.fetchFile)


module.exports = router;