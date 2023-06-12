const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chats');
const authenticate = require('../middleware/authenticate');

router.post('/getChatContacts',authenticate, chatController.getChatContacts)
router.post('/getAllChatContacts',authenticate, chatController.getAllChatContacts)
router.post('/getInviteContacts',authenticate, chatController.getInviteContacts)
router.post('/sendChatMsg',authenticate, chatController.sendChat)
router.post('/getChatMsg',authenticate, chatController.getChat)
router.post('/deleteChatHistory',authenticate, chatController.deleteChatHistory)


module.exports = router;