import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useParams, useLocation } from "react-router-dom";

// Replace localhost with Render backend URL
const ENDPOINT = process.env.REACT_APP_API_BASE || "https://socialmedia-backend-yfjp.onrender.com";
let socket;
let typingTimeout;

const Chat = () => {
  const { id: chatId } = useParams();
  const location = useLocation();
  const selectedChat = location.state?.selectedChat;

  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("userInfo"));
    if (storedUser) {
      setCurrentUser(storedUser);
      socket = io(ENDPOINT);
      socket.emit("setup", storedUser);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
        const { data } = await axios.get(
          `${ENDPOINT}/api/chats/message/${chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setChatMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    if (chatId) {
      socket.emit("join chat", chatId);
      fetchMessages();
    }
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !chatId) return;

    try {
      socket.emit("stop typing", chatId);
      setIsTyping(false);

      const { data } = await axios.post(
        `${ENDPOINT}/api/chats/message`,
        {
          chatId: chatId,
          content: message,
        },
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );

      setChatMessages((prev) => [...prev, data]);
      setMessage("");
      socket.emit("new message", data);
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (newMessage) => {
      if (newMessage.chat === chatId) {
        setChatMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on("message received", handleIncoming);

    socket.on("typing", () => setTypingUsers(true));
    socket.on("stop typing", () => setTypingUsers(false));

    return () => {
      socket.off("message received", handleIncoming);
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [chatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typingUsers]);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!socket || !chatId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", chatId);
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stop typing", chatId);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="d-flex flex-column h-100 border rounded shadow-sm p-3">
      <h5 className="mb-3 d-flex align-items-center">
        <i className="fas fa-comments me-2 text-primary" />
        {selectedChat?.isGroupChat ? selectedChat.chatName : "Chat"}
      </h5>

      <div className="flex-grow-1 overflow-auto bg-light p-3 rounded mb-3">
        {chatMessages.map((msg, idx) => {
          const isSender =
            msg.sender === currentUser?._id ||
            msg.sender?._id === currentUser?._id;
          const isLast = idx === chatMessages.length - 1;

          return (
            <div
              key={idx}
              className={`d-flex mb-2 ${
                isSender ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div
                className={`p-2 px-3 rounded-4 shadow-sm ${
                  isSender ? "bg-primary text-white" : "bg-white border"
                }`}
                style={{ maxWidth: "75%", wordBreak: "break-word" }}
              >
                {!isSender && (
                  <div className="text-muted small fw-bold mb-1">
                    {msg.sender?.name || "Friend"}
                  </div>
                )}
                <div className="small">{msg.content}</div>
                {isSender && isLast && (
                  <div className="text-end small text-white-50 mt-1">
                    <i className="fas fa-check-double me-1" />
                    Delivered
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers && (
          <div className="text-muted small fst-italic px-2">Typing...</div>
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
