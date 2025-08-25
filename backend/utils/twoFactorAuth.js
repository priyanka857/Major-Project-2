const speakeasy = require('speakeasy');

// Verify the user-provided 2FA token against the secret
const verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // allow 30s before or after
  });
};

module.exports = { verifyToken };
