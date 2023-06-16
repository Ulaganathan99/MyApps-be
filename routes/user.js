const express = require('express')
const router = express.Router()
const userController = require('../controllers/users')
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload');


router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.post('/signup-verification', userController.signupVerification)
router.post('/editProfile',authenticate,upload.single('image'), userController.editProfile)
router.post('/deleteProfile',authenticate, userController.deleteProfile)
router.post('/fetchUserInfo',authenticate, userController.getUserInfo)
router.post('/fetchImg',authenticate, userController.getProfileImg)

module.exports = router;