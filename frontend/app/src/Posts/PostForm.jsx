import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";

const PostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const config = {
    headers: {
      Authorization: `Bearer ${userInfo?.token}`,
      "Content-Type": "multipart/form-data",
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/posts", formData, config);
      setContent("");
      setImage(null);
      if (onPostCreated) onPostCreated(); // notify parent to refresh posts
    } catch (error) {
      console.error("Post upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4 shadow p-3 rounded">
      <Form.Group controlId="postContent">
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </Form.Group>

      <Form.Group controlId="postImage" className="mt-3">
        <Form.Control
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
      </Form.Group>

      <Button variant="primary" type="submit" disabled={loading} className="mt-3">
        {loading ? <Spinner animation="border" size="sm" /> : "Post"}
      </Button>
    </Form>
  );
};

export default PostForm;
