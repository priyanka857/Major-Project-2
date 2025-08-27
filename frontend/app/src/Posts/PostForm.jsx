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
    data.append("upload_preset", "YOUR_UPLOAD_PRESET"); // replace with your Cloudinary preset
    data.append("cloud_name", "YOUR_CLOUD_NAME"); // replace with your Cloudinary cloud name

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();
    return result.secure_url; // return Cloudinary image URL
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    try {
      setLoading(true);

      let imageUrl = "";
      if (image) {
        imageUrl = await uploadToCloudinary(image); // upload to cloudinary
      }

      await axios.post(
        `${BACKEND_URL}/api/posts`,
        { content, image: imageUrl }, // send only URL to backend
        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      );

      setContent("");
      setImage(null);
      if (onPostCreated) onPostCreated(); // refresh posts
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
