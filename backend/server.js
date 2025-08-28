// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chatRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const Chat = require("./models/Chat");
dotenv.config();
const app = express();

// Connect MongoDB
connectDB();

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://socialmedia-frontend-jkwq.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// API Routes
app.use("/api/chats", chatRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ✅ Default route to avoid "Cannot GET /"
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// Create server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://socialmedia-frontend-jkwq.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

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
    try {
      const chat = await Chat.findById(message.chat).populate("users");
      if (!chat) return;

      chat.users.forEach((user) => {
        if (user._id.toString() !== message.sender.toString()) {
          socket.to(user._id.toString()).emit("message received", message);
        }
      });
    } catch (err) {
      console.error("Socket message error:", err.message);
    }
  });

  // typing events
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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
