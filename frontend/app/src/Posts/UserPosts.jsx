// src/components/UserPosts.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Button, Form, Row, Col, Image } from "react-bootstrap";
import Loader from "../components/Loader";
import Message from "../components/Message";

const BACKEND_URL = process.env.REACT_APP_API_BASE || "https://socialmedia-backend-yfjp.onrender.com";

console.log("BACKEND_URL:", process.env.REACT_APP_API_BASE);

// Helper to safely get full backend image URL
const getImageUrl = (path) => (path ? `${BACKEND_URL}/${path.replace(/^\/+/, "")}` : "/default.png");

const UserPosts = ({ userId, showActions = true }) => {
  const [posts, setPosts] = useState([]);
  const [commentTexts, setCommentTexts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = {
    headers: {
      Authorization: `Bearer ${userInfo?.token}`,
    },
  };

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${BACKEND_URL}/api/posts/user/${userId || userInfo._id}`,
          config
        );
        setPosts(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    if (userInfo?.token) fetchUserPosts();
  }, [userId, userInfo?._id, userInfo?.token]);

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

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/posts/${postId}`, config);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setMessage("🗑️ Post deleted successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete post");
    }
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!posts.length) return <p className="text-center text-muted">No posts yet.</p>;

  // Profile-style Grid layout (e.g., user profile page)
  if (!showActions) {
    return (
      <Row className="g-2 mt-3">
        {posts.map((post) => (
          <Col key={post._id} xs={12} sm={6} md={4}>
            <div className="border rounded overflow-hidden">
              <Image
                src={getImageUrl(post.image)}
                alt="Post"
                className="w-100"
                style={{ aspectRatio: "1/1", objectFit: "cover" }}
              />
            </div>
          </Col>
        ))}
      </Row>
    );
  }

  // Normal full post display (Home page style)
  return (
    <>
      {message && (
        <Message variant="success" dismissible onClose={() => setMessage(null)}>
          {message}
        </Message>
      )}
      {posts.map((post) => (
        <Card key={post._id} className="mb-4 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <img
                src={getImageUrl(post.user.profilePicture)}
                alt="profile"
                className="rounded-circle"
                width={40}
                height={40}
              />
              <strong>@{post.user.username}</strong>
            </div>
            {showActions && post.user._id === userInfo._id && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDelete(post._id)}
              >
                <i className="fas fa-trash-alt"></i> Delete
              </Button>
            )}
          </Card.Header>

          {post.image && (
            <Card.Img
              variant="top"
              src={getImageUrl(post.image)}
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
                    src={getImageUrl(comment.user.profilePicture)}
                    alt=""
                    width={30}
                    height={30}
                    className="rounded-circle"
                  />
                  <div>
                    <strong>@{comment.user.username}:</strong> {comment.text}
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
      ))}
    </>
  );
};

export default UserPosts;
