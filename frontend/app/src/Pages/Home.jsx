import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Modal,
} from "react-bootstrap";
import axios from "axios";
import Loader from "../components/Loader";
import Message from "../components/Message";
import PostForm from "../Posts/PostForm";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const BACKEND_URL = process.env.REACT_APP_API_BASE || "https://socialmedia-backend-yfjp.onrender.com";

const getImageUrl = (path) => {
  if (!path) return "/default.png";
  return path.startsWith("http")
    ? path
    : `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
};

const Home = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [posts, setPosts] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  

  // Redirect to login if not logged in
  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    }
  }, [userInfo, navigate]);

  const config = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${userInfo?.token}`,
      },
    }),
    [userInfo?.token]
  );

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BACKEND_URL}/api/posts`, config);
      setPosts(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = () => {
    fetchPosts();
    setMessage("✅ Post uploaded successfully!");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const comment = commentTexts[postId]?.trim();
    if (!comment) return;

    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/posts/${postId}/comments`,
        { text: comment },
        config
      );
      setPosts((prev) => prev.map((p) => (p._id === data._id ? data : p)));
      setCommentTexts({ ...commentTexts, [postId]: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    }
  };

  const openDeleteModal = (postId) => {
    setSelectedPostId(postId);
    setShowModal(true);
  };

  const closeDeleteModal = () => {
    setShowModal(false);
    setSelectedPostId(null);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/api/posts/${selectedPostId}`, config);
      setPosts((prev) => prev.filter((post) => post._id !== selectedPostId));
      setMessage("🗑️ Post deleted successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete post");
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <h3 className="mb-4 text-center">
            <i className="fas fa-house text-primary me-2"></i>Home
          </h3>

          {message && (
            <Message variant="success" onClose={() => setMessage(null)} dismissible>
              {message}
            </Message>
          )}
          {error && (
            <Message variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Message>
          )}

          <PostForm onPostCreated={handlePostCreated} />

          {loading ? (
            <Loader />
          ) : (
            posts.map((post) => (
              <Card key={post._id} className="mb-4 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={getImageUrl(post.user?.profilePicture)}
                      alt="profile"
                      className="rounded-circle object-cover"
                      width={40}
                      height={40}
                    />
                    <strong>@{post.user?.username}</strong>
                  </div>
                  {post.user?._id?.toString() === userInfo?._id?.toString() && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="d-flex align-items-center gap-2"
                      onClick={() => openDeleteModal(post._id)}
                    >
                      <i className="fas fa-trash-alt"></i> Delete
                    </Button>
                  )}
                </Card.Header>

                {post.image && (
                  <Card.Img
                    variant="top"
                    src={getImageUrl(post.image)}
                    className="rounded-0"
                    style={{
                      width: "100%",
                      objectFit: "contain",
                      maxHeight: "500px",
                      backgroundColor: "#f8f9fa",
                    }}
                  />
                )}

                <Card.Body>
                  <Card.Text>{post.caption}</Card.Text>
                  <hr />
                  <h6 className="text-muted mb-2">
                    <i className="fas fa-comments me-1"></i>Comments:
                  </h6>

                  <ul className="list-unstyled">
                    {post.comments.map((comment, idx) => (
                      <li key={idx} className="mb-2 d-flex align-items-start gap-2">
                        <img
                          src={getImageUrl(comment.user?.profilePicture)}
                          alt="profile"
                          width={30}
                          height={30}
                          className="rounded-circle"
                        />
                        <div>
                          <strong>@{comment.user?.username}:</strong>{" "}
                          <span>{comment.text}</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Form onSubmit={(e) => handleAddComment(e, post._id)}>
                    <Form.Group controlId={`comment-${post._id}`} className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        placeholder="Write a comment..."
                        value={commentTexts[post._id] || ""}
                        onChange={(e) =>
                          setCommentTexts({ ...commentTexts, [post._id]: e.target.value })
                        }
                      />
                      <Button type="submit" variant="outline-primary">
                        <i className="fas fa-paper-plane"></i>
                      </Button>
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>
            ))
          )}
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showModal} onHide={closeDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this post?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Home;
