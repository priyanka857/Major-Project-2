import React, { useEffect, useState } from "react";
import { Card, Form, Button, Image } from "react-bootstrap";
import axios from "axios";
import Loader from "../components/Loader";
import Message from "../components/Message";

const BACKEND_URL = "https://socialmedia-backend-yfjp.onrender.com";

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [comment, setComment] = useState({});
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BACKEND_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setPosts(data.reverse());
      setError(null);
    } catch (error) {
      setError("Failed to load posts.");
      console.error("Fetch posts error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshToggle]);

  const handleComment = async (postId) => {
    if (!comment[postId]?.trim()) return;

    try {
      await axios.post(
        `${BACKEND_URL}/api/posts/${postId}/comments`,
        { text: comment[postId] },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );
      setComment((prev) => ({ ...prev, [postId]: "" }));
      setRefreshToggle((prev) => !prev);
    } catch (error) {
      console.error("Comment error:", error);
      setError("Failed to add comment.");
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axios.delete(`${BACKEND_URL}/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setSuccess("Post deleted successfully.");
        setRefreshToggle((prev) => !prev);
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Delete error:", error);
        setError("Failed to delete post.");
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  return (
    <>
      {error && (
        <Message variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Message>
      )}
      {success && (
        <Message variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Message>
      )}

      {loading ? (
        <Loader />
      ) : posts.length === 0 ? (
        <p className="text-center">No posts to display.</p>
      ) : (
        posts.map((post) => (
          <Card key={post._id} className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center">
                  <Image
                    src={post.user?.profilePicture ? `${BACKEND_URL}${post.user.profilePicture}` : "/uploads/default.jpg"}
                    alt="profile"
                    roundedCircle
                    width={40}
                    height={40}
                    style={{ objectFit: "cover", marginRight: 10 }}
                  />
                  <strong>@{post.user?.username}</strong>
                </div>
                {post.user?._id?.toString() === userInfo?._id?.toString() && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeletePost(post._id)}
                  >
                    Delete
                  </Button>
                )}
              </div>

              <p>{post.content || post.caption}</p>

              {post.image && (
                <img
                  src={post.image.startsWith("http") ? post.image : `${BACKEND_URL}/${post.image}`}
                  alt="post"
                  className="w-100 rounded mt-2"
                  style={{ maxHeight: 300, objectFit: "cover" }}
                />
              )}

              <Form.Group className="d-flex gap-2 mt-3">
                <Form.Control
                  type="text"
                  placeholder="Write a comment..."
                  value={comment[post._id] || ""}
                  onChange={(e) =>
                    setComment((prev) => ({ ...prev, [post._id]: e.target.value }))
                  }
                />
                <Button
                  variant="outline-primary"
                  onClick={() => handleComment(post._id)}
                  disabled={!comment[post._id]?.trim()}
                >
                  Comment
                </Button>
              </Form.Group>

              {post.comments?.length > 0 && (
                <div className="mt-3">
                  {post.comments.map((c, idx) => (
                    <div
                      key={idx}
                      className="border-top pt-2 mt-2 small d-flex align-items-start gap-2"
                    >
                      <Image
                        src={c.user?.profilePicture ? `${BACKEND_URL}${c.user.profilePicture}` : "/uploads/default.jpg"}
                        alt={c.username}
                        roundedCircle
                        width={25}
                        height={25}
                        style={{ objectFit: "cover" }}
                      />
                      <div>
                        <strong>@{c.user?.username || c.username}</strong>: {c.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        ))
      )}
    </>
  );
};

export default PostList;
