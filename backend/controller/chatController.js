const Chat = require('../models/Chat');
const User = require('../models/User');

// Create or Access 1-to-1 Chat
exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).send("UserId param not sent");

  let chat = await Chat.findOne({
    users: { $all: [req.user._id, userId] },
  }).populate("users", "-password").populate("messages");

  if (chat) return res.status(200).send(chat);

  try {
    const newChat = await Chat.create({
      users: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate("users", "-password");
    res.status(200).send(fullChat);
  } catch (err) {
    res.status(500).send({ message: "Server Error", err });
  }
};

// Fetch all chats for a user
exports.getChats = async (req, res) => {
  const currentUserId = req.user._id;

  try {
    const chats = await Chat.find({ users: currentUserId })
      .populate('users', '-password')
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message in a chat
exports.sendMessage = async (req, res) => {
  const { chatId, content } = req.body;
  const currentUserId = req.user._id;

  if (!content || !chatId) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const newMessage = {
      sender: currentUserId,
      content,
    };

    chat.messages.push(newMessage);
    await chat.save();

    const latestMessage = chat.messages[chat.messages.length - 1];

    res.status(200).json(latestMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all messages from a chat
exports.getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId).populate('messages.sender', 'username');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    res.status(200).json(chat.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
