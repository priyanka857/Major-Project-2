const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  enable2FA,
  disable2FA,
} = require("../controller/authController");
const { protect } = require("../middleware/authMiddleware");

// Public
router.post("/signup", signup);
router.post("/login", login);

// Protected – 2FA
router.post("/2fa/enable", protect, enable2FA);
router.post("/2fa/disable", protect, disable2FA);

module.exports = router;
