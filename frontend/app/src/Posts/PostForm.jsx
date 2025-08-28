import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_API_BASE;

const PostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  // ✅ Cloudinary upload function
  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", process.env.REACT_APP_CLOUDINARY_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUDNAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    if (!res.ok) throw new Error("Failed to upload image to Cloudinary");

    const result = await res.json();
    return result.secure_url; // ✅ Cloudinary image URL
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    try {
      setLoading(true);

      let imageUrl = "";
      if (image) {
        imageUrl = await uploadToCloudinary(image);
      }

      await axios.post(
        `${BACKEND_URL}/api/posts`,
        { content, image: imageUrl },
        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      );

      // ✅ Reset form
      setContent("");
      setImage(null);

      // Refresh posts
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("❌ Post upload error:", error);
      alert("Failed to create post. Please try again.");
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
