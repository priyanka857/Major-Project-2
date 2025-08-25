const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
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

// File upload setup
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb("Invalid file type. Only images are allowed.", false);
  }
};

const upload = multer({ storage, fileFilter });

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
