const express = require('express');
const router = express.Router();
const {accessChat,sendMessage,getChats,getMessages} = require('../controller/chatController');
const { protect } = require('../middleware/authMiddleware'); // assumes you have a JWT auth middleware

// Access or create 1-to-1 chat
router.post('/', protect, accessChat);

// Get all chats for the user
router.get('/', protect, getChats);

// Send a message
router.post('/message', protect,sendMessage);

// Get all messages from a chat
router.get('/message/:chatId', protect, getMessages);

module.exports = router;
