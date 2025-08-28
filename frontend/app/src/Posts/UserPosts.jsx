import React, { useEffect, useState } from "react";
import { Card, Button, Spinner } from "react-bootstrap";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_API_BASE;

const UserPosts = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const getImageUrl = (path) => {
    if (!path) return "/default.png";
    return path.startsWith("http")
      ? path
      : `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
  };

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BACKEND_URL}/api/posts/user/${userId}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      setPosts(data);
    } catch (err) {
      console.error("Error fetching user posts:", err);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      setPosts(posts.filter((post) => post._id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post.");
    }
  };

  useEffect(() => {
    if (userId) fetchUserPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      {posts.length === 0 ? (
        <p className="text-muted text-center mt-3">No posts yet.</p>
      ) : (
        posts.map((post) => (
          <Card key={post._id} className="mb-3 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <img
                  src={getImageUrl(post.user?.profilePicture)}
                  alt="profile"
                  className="rounded-circle me-2"
                  width={40}
                  height={40}
                />
                <strong>@{post.user?.username}</strong>
              </div>

              <Card.Text>{post.content}</Card.Text>

              {post.image && (
                <img
                  src={getImageUrl(post.image)}
                  alt="post"
                  className="img-fluid rounded mb-2"
                  style={{ maxHeight: "300px", objectFit: "cover" }}
                />
              )}

              {post.comments?.length > 0 && (
                <div className="mt-3">
                  <h6>Comments:</h6>
                  {post.comments.map((comment, index) => (
                    <div key={index} className="d-flex align-items-center mb-1">
                      <img
                        src={getImageUrl(comment.user?.profilePicture)}
                        alt="profile"
                        width={30}
                        height={30}
                        className="rounded-circle me-2"
                      />
                      <strong>@{comment.user?.username}:</strong>&nbsp;
                      {comment.text}
                    </div>
                  ))}
                </div>
              )}

              {post.user?._id?.toString() === userInfo?._id?.toString() && (
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-2"
                  onClick={() => deletePost(post._id)}
                >
                  Delete
                </Button>
              )}
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );
};

export default UserPosts;
