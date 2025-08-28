import React, { useState } from "react";
import { Form, Button, Image } from "react-bootstrap";
import axios from "axios";
import Loader from "../components/Loader";

const BACKEND_URL = process.env.REACT_APP_API_BASE;

const PostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  // Upload image to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUDNAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) throw new Error("Failed to upload image to Cloudinary");

    const result = await res.json();
    return result.secure_url;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    try {
      setLoading(true);

      let imageUrl = "";
      if (image) imageUrl = await uploadToCloudinary(image);

      await axios.post(
        `${BACKEND_URL}/api/posts`,
        { content, image: imageUrl },
        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      );

      setContent("");
      setImage(null);
      setImagePreview(null);

      if (onPostCreated) onPostCreated(); // Refresh posts after creation
    } catch (error) {
      console.error("❌ Post upload error:", error.response?.data || error.message);
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
        <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
      </Form.Group>

      {imagePreview && (
        <div className="mt-3 text-center position-relative">
          <Image
            src={imagePreview}
            alt="preview"
            thumbnail
            style={{ maxHeight: 200, objectFit: "cover" }}
          />
          <Button
            variant="danger"
            size="sm"
            className="position-absolute top-0 end-0"
            onClick={handleRemoveImage}
          >
            Remove
          </Button>
        </div>
      )}

      <Button
        variant="primary"
        type="submit"
        disabled={loading}
        className="mt-3 w-100"
      >
        {loading ? <Loader small /> : "Post"}
      </Button>
    </Form>
  );
};

export default PostForm;
