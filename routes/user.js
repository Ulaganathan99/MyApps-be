const express = require('express')
const router = express.Router()
const userController = require('../controllers/users')
const authenticate = require('../middleware/authenticate');


router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.post('/signup-verification', userController.signupVerification)
// router.post('/logout',userController.logout)
// router.post('/forgot',userController.forgot)

router.post('/fetchUserInfo',authenticate, userController.getUserInfo)
module.exports = router;