import React, { useEffect, useState } from "react";
import { Card, Button } from "react-bootstrap";
import axios from "axios";
import Loader from "../components/Loader";

const BACKEND_URL = process.env.REACT_APP_API_BASE;

const UserPosts = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const getImageUrl = (path) => {
    if (!path) return "/default.png";
    // If URL starts with http, use as is; otherwise, prepend BACKEND_URL with slash
    return path.startsWith("http") ? path : `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
  };

 const fetchUserPosts = async () => {
  if (!userInfo?.token) return;
  try {
    setLoading(true);

    // Use /mine if userId not provided (for profile page)
    const url = userId
      ? `${BACKEND_URL}/api/posts/user/${userId}`
      : `${BACKEND_URL}/api/posts/mine`;

    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    });

    setPosts(data);
    setError("");
  } catch (err) {
    console.error(err.response?.data || err.message);
    setError("Failed to load posts.");
  } finally {
    setLoading(false);
  }
};


  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to delete post.");
    }
  };

  useEffect(() => {
    if (userId) fetchUserPosts();
  }, [userId]);

  if (loading) return <Loader />;
  if (error) return <p className="text-danger text-center">{error}</p>;

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
                  style={{ objectFit: "cover" }}
                />
                <strong>@{post.user?.username}</strong>
              </div>

              <Card.Text>{post.content || post.caption}</Card.Text>

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
                  {post.comments.map((c, idx) => (
                    <div key={idx} className="d-flex align-items-center mb-1">
                      <img
                        src={getImageUrl(c.user?.profilePicture)}
                        alt="profile"
                        width={30}
                        height={30}
                        className="rounded-circle me-2"
                        style={{ objectFit: "cover" }}
                      />
                      <strong>@{c.user?.username || c.username}:</strong> {c.text}
                    </div>
                  ))}
                </div>
              )}

              {post.user?._id === userInfo?._id && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => deletePost(post._id)}
                  className="mt-2"
                >
                  <i className="fas fa-trash me-1" /> Delete
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
