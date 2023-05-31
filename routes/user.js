const express = require('express')
const router = express.Router()
const userController = require('../controllers/users')
const authenticate = require('../middleware/authenticate');


router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.post('/signup-verification', userController.signupVerification)
router.post('/editProfile',authenticate, userController.editProfile)
router.post('/deleteProfile',authenticate, userController.deleteProfile)

router.post('/fetchUserInfo',authenticate, userController.getUserInfo)
module.exports = router;