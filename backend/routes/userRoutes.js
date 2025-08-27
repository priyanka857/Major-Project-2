const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserProfileByUsername
} = require("../controller/userController");
const { protect } = require("../middleware/authMiddleware");

// Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pictures",   // Cloudinary la save aagum folder name
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

// Profile routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/upload-profile-picture", protect, upload.single("image"), uploadProfilePicture);

// Search
router.get("/search-users", protect, searchUsers);

// Follow/Unfollow
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

// Get followers/following
router.get("/followers", protect, getFollowers);
router.get("/following", protect, getFollowing);

// GET user profile by username
router.get('/profile/:username', protect, getUserProfileByUsername);

module.exports = router;
