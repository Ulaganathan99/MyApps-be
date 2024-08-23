const express = require('express')
const router = express.Router()
const videosController = require('../controllers/videos')
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload');


router.post('/upload', videosController.upload)


module.exports = router;