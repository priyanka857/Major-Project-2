import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useParams, useLocation } from "react-router-dom";

const ENDPOINT =
  process.env.REACT_APP_API_BASE || "https://socialmedia-backend-yfjp.onrender.com";

const Chat = () => {
  const { id: chatId } = useParams();
  const location = useLocation();
  const selectedChat = location.state?.selectedChat;

  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  let typingTimeoutRef = useRef(null);

  // Initialize socket and current user
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("userInfo"));
    if (!storedUser) return;

    setCurrentUser(storedUser);

    socketRef.current = io(ENDPOINT, { transports: ["websocket"] });
    socketRef.current.emit("setup", storedUser);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Fetch messages and join chat room
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId || !currentUser) return;

      try {
        const token = currentUser.token;
        const { data } = await axios.get(`${ENDPOINT}/api/chats/message/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChatMessages(Array.isArray(data) ? data : []);
        socketRef.current.emit("join chat", chatId);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [chatId, currentUser]);

  // Listen for incoming messages and typing events
  useEffect(() => {
    if (!socketRef.current) return;

    const handleIncoming = (newMessage) => {
      const incomingChatId =
        newMessage?.chat?._id || newMessage?.chat || newMessage?.chatId;
      if (String(incomingChatId) === String(chatId)) {
        setChatMessages((prev) => [...prev, newMessage]);
      }
    };

    socketRef.current.on("message received", handleIncoming);

    socketRef.current.on("typing", (user) => {
      if (!typingUsers.includes(user)) setTypingUsers((prev) => [...prev, user]);
    });

    socketRef.current.on("stop typing", (user) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    });

    return () => {
      socketRef.current.off("message received", handleIncoming);
      socketRef.current.off("typing");
      socketRef.current.off("stop typing");
    };
  }, [chatId, typingUsers]);

  // Auto-scroll to bottom on new messages or typing
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typingUsers]);

  // Helper to extract sender id
  const getSenderId = (sender) => {
    if (!sender) return null;
    return typeof sender === "string" ? sender : sender?._id || null;
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !chatId) return;

    if (socketRef.current) {
      socketRef.current.emit("stop typing", {
        chatId,
        user: currentUser.username || currentUser._id,
      });
    }
    setIsTyping(false);

    try {
      const { data } = await axios.post(
        `${ENDPOINT}/api/chats/message`,
        { chatId, content: message },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );

      setChatMessages((prev) => [...prev, data]);
      setMessage("");

      if (socketRef.current) socketRef.current.emit("new message", data);
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  // Typing logic with debounce
  const handleTyping = (e) => {
    const val = e.target.value;
    setMessage(val);

    if (!socketRef.current || !chatId || !currentUser) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("typing", { chatId, user: currentUser.username || currentUser._id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stop typing", { chatId, user: currentUser.username || currentUser._id });
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  return (
    <div className="d-flex flex-column h-100 border rounded shadow-sm p-3">
      <h5 className="mb-3 d-flex align-items-center">
        <i className="fas fa-comments me-2 text-primary" />
        {selectedChat?.isGroupChat
          ? selectedChat.chatName
          : selectedChat?.chatName || "Chat"}
      </h5>

      <div className="flex-grow-1 overflow-auto bg-light p-3 rounded mb-3">
        {chatMessages.map((msg, idx) => {
          const senderId = getSenderId(msg.sender);
          const isSender = senderId && currentUser?._id && String(senderId) === String(currentUser._id);
          const isLast = idx === chatMessages.length - 1;

          return (
            <div
              key={msg._id || idx}
              className={`d-flex mb-2 ${isSender ? "justify-content-end" : "justify-content-start"}`}
            >
              <div
                className={`p-2 px-3 rounded-4 shadow-sm ${
                  isSender ? "bg-primary text-white" : "bg-white border"
                }`}
                style={{ maxWidth: "75%", wordBreak: "break-word" }}
              >
                {!isSender && (
                  <div className="text-muted small fw-bold mb-1">
                    {msg.sender?.name || msg.sender?.username || "Friend"}
                  </div>
                )}
                <div className="small">{msg.content}</div>
                {isSender && isLast && (
                  <div className="text-end small text-white-50 mt-1">
                    <i className="fas fa-check-double me-1" /> Delivered
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="text-muted small fst-italic px-2">
            {typingUsers.join(", ")} typing...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="input-group shadow-sm">
        <input
          type="text"
          className="form-control"
          placeholder="Type a message..."
          value={message}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button className="btn btn-primary" onClick={handleSendMessage}>
          <i className="fas fa-paper-plane" />
        </button>
      </div>
    </div>
  );
};

export default Chat;
