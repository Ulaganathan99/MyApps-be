const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chats');
const authenticate = require('../middleware/authenticate');

router.post('/getChatContacts',authenticate, chatController.getChatContacts)
router.post('/getInviteContacts',authenticate, chatController.getInviteContacts)
router.post('/sendChatMsg',authenticate, chatController.sendChat)
router.post('/getChatMsg',authenticate, chatController.getChat)


module.exports = router;