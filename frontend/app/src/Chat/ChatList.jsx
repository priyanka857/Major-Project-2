import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Message from "../components/Message";
import Loader from "../components/Loader";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("http://localhost:5000/api/chats", {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        setChats(data);
        setFilteredChats(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load chats.");
        setLoading(false);
      }
    };

    if (userInfo?.token) fetchChats();
  }, [userInfo?.token]);

  // Filter chats by username
  useEffect(() => {
    const filtered = chats.filter((chat) =>
      chat.users.some(
        (u) =>
          u._id !== userInfo._id &&
          u.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredChats(filtered);
  }, [searchTerm, chats, userInfo._id]);

  // Backend user search for suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/users/search-users?query=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          }
        );
        setSearchResults(data);
      } catch (err) {
        console.error("User search failed:", err);
      }
    };

    const delay = setTimeout(() => fetchSuggestions(), 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Start or access a chat
  const accessChat = async (userId) => {
  try {
    const { data: chat } = await axios.post(
      "http://localhost:5000/api/chats",
      { userId },
      {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      }
    );
    navigate(`/chat/${chat._id}`, { state: { selectedChat: chat } });
  } catch (err) {
    console.error("Chat access failed:", err);
  }
};


  // Open existing chat
  const handleChatClick = (chatId) => {
  navigate(`/chat/${chatId}`);
};


  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <h3 className="mb-4 text-center">
            <i className="fas fa-comments text-primary me-2" />
            Chats
          </h3>

          {error && (
            <Message
              variant="danger"
              onClose={() => setError(null)}
              dismissible
            >
              {error}
            </Message>
          )}

          {/* Search bar */}
          <div className="position-relative">
            <InputGroup className="mb-2">
              <InputGroup.Text>
                <i className="fas fa-search" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            {/* Suggestions */}
            {searchTerm && searchResults.length > 0 && (
              <ul
                className="list-group position-absolute w-100 zindex-tooltip shadow-sm"
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  top: "100%",
                  zIndex: 1000,
                }}
              >
                {searchResults.map((user) => (
                  <li
                    key={user._id}
                    className="list-group-item list-group-item-action d-flex align-items-center"
                    onClick={() => accessChat(user._id)}
                    style={{ cursor: "pointer" }}
                  >
                    <img
                      src={user.profilePicture || "/default.png"}
                      alt="profile"
                      className="rounded-circle me-2"
                      width={30}
                      height={30}
                    />
                    @{user.username}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chat List */}
          {loading ? (
            <Loader />
          ) : filteredChats.length === 0 ? (
            <div className="text-center text-muted mt-3">No chats found.</div>
          ) : (
            filteredChats.map((chat) => {
              const otherUser = chat.users.find(
                (u) => u._id !== userInfo._id
              );
              return (
                <Card
                  key={chat._id}
                  className="mb-3 shadow-sm cursor-pointer"
                  onClick={() => handleChatClick(chat._id)}
                >
                  <Card.Body className="d-flex align-items-center gap-3">
                    <img
                      src={otherUser.profilePicture || "/default.png"}
                      alt="profile"
                      className="rounded-circle"
                      width={50}
                      height={50}
                    />
                    <div>
                      <strong>@{otherUser.username}</strong>
                      <div className="text-muted small">Click to open chat</div>
                    </div>
                    <i className="fas fa-chevron-right ms-auto text-secondary" />
                  </Card.Body>
                </Card>
              );
            })
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ChatList;
