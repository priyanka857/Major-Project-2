const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const QRCode = require("qrcode");

// Get Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(401).json({ message: "Not authorized" });

    res.json({
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      twoFactorAuth: user.twoFactorAuth,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload Profile Picture
const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
      await user.save();
      return res.status(200).json({
        message: "Profile picture updated",
        profilePicture: user.profilePicture,
      });
    } else {
      return res.status(400).json({ message: "No file uploaded" });
    }
  } catch (error) {
    console.error("Upload profile error:", error);
    res.status(500).json({ message: "Failed to upload profile picture" });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      twoFactorAuth: updatedUser.twoFactorAuth,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Search Users
const searchUsers = async (req, res) => {
  const { query } = req.query;
  const userId = req.user._id;

  try {
    if (!query || query.trim() === "") return res.json([]);

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("username email profilePicture");

    res.json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Follow User
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId
    );

    if (alreadyFollowing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    targetUser.followers.push(currentUserId);
    currentUser.following.push(targetUserId);

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ message: "Server error during follow" });
  }
};

// Unfollow User
const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId
    );

    if (!isFollowing) {
      return res.status(400).json({ message: "You are not following this user" });
    }

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId
    );
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId
    );

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ message: "Server error during unfollow" });
  }
};

// Get Followers
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "followers",
      "username email profilePicture"
    );
    res.status(200).json(user.followers);
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ message: "Failed to fetch followers" });
  }
};

// Get Following
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "following",
      "username email profilePicture"
    );
    res.status(200).json(user.following);
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ message: "Failed to fetch following" });
  }
};

// Get User Profile by Username
const getUserProfileByUsername = asyncHandler(async (req, res) => {
  const usernameParam = req.params.username;

  const user = await User.findOne({
    username: { $regex: new RegExp(`^${usernameParam}$`, "i") },
  }).select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
});


const enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({
      name: `YourAppName (${user.email})`,
    });

    // Save secret base32 in user for later verification
    user.twoFactorSecret = secret.base32;
    user.twoFactorAuth = true;
    await user.save();

    // Generate QR code data URL from otpauth URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Send QR code data URL string to frontend
    res.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error("2FA enable error:", error);
    res.status(500).json({ message: "Failed to enable 2FA" });
  }
};


// EXPORT CONTROLLER FUNCTIONS
module.exports = {
  getProfile,
  uploadProfilePicture,
  updateProfile,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserProfileByUsername,enable2FA,
};
