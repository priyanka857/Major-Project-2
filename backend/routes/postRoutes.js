const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  createPost,
  getAllPosts,
  addComment,
  getPostById,
  getUserPosts,
  deletePost,
} = require("../controller/postController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, upload.single("image"), createPost);
router.get("/",getAllPosts);

// More specific route first
router.get("/user/:userId", protect, getUserPosts);

router.get("/mine", protect, getUserPosts);


// More general route last
router.get("/:postId", protect, getPostById);

router.post("/:postId/comments", protect, addComment);
router.delete("/:postId", protect, deletePost);

module.exports = router;
