const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chatRoutes");

dotenv.config();
const app = express();
connectDB();

app.use(cors({ origin: ['http://localhost:3000', 'https://socialmedia-frontend-jkwq.onrender.com'], credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/api/chats", chatRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://socialmedia-frontend-jkwq.onrender.com'],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // setup user
  socket.on("setup", (userId) => {
    socket.join(userId);
    socket.emit("connected");
  });

  // join chat room
  socket.on("join chat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  // new message
  socket.on("new message", async (message) => {
    const chat = await Chat.findById(message.chat); // Chat model import pannunga
    if (!chat) return;

    chat.users.forEach((userId) => {
      if (userId.toString() !== message.sender.toString()) {
        socket.to(userId.toString()).emit("message received", message);
      }
    });
  });

  // typing
  socket.on("typing", ({ chatId, user }) => {
    socket.to(chatId).emit("typing", user);
  });

  socket.on("stop typing", ({ chatId, user }) => {
    socket.to(chatId).emit("stop typing", user);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
