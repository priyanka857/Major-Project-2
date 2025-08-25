const User = require("../models/User");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { generateToken } = require("../utils/generateToken");
const { verifyToken } = require("../utils/twoFactorAuth");

// Signup
async function signup(req, res) {
  const { username, email, password } = req.body;
  try {
    if ((await User.findOne({ email })) || (await User.findOne({ username }))) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
      twoFactorAuth: user.twoFactorAuth,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Login with 2FA
async function login(req, res) {
  const { email, password, token } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password +twoFactorAuthSecret");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.twoFactorAuth) {
      if (!token) return res.status(401).json({ message: "2FA token required" });
      const isTokenValid = verifyToken(user.twoFactorAuthSecret, token);
      if (!isTokenValid) return res.status(401).json({ message: "Invalid 2FA token" });
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
      twoFactorAuth: user.twoFactorAuth,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Enable 2FA
async function enable2FA(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({ name: `SocialApp (${user.email})` });
    user.twoFactorAuthSecret = secret.base32;
    user.twoFactorAuth = true;
    await user.save();

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ qrCode: qrCodeDataUrl, secret: secret.base32 });
  } catch (error) {
    console.error("Enable 2FA error:", error.message);
    res.status(500).json({ message: "Failed to enable 2FA" });
  }
}

// Disable 2FA
async function disable2FA(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.twoFactorAuth = false;
    user.twoFactorAuthSecret = null;
    await user.save();

    res.json({ message: "2FA disabled" });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    res.status(500).json({ message: "Failed to disable 2FA" });
  }
}

module.exports = {
  signup,
  login,
  enable2FA,
  disable2FA,
};
