import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Form, Image } from "react-bootstrap";
import Loader from "../components/Loader";
import Message from "../components/Message";
import UserPosts from "../Posts/UserPosts";

const BACKEND_URL = process.env.REACT_APP_API_BASE;
function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [followMap, setFollowMap] = useState({});

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.token) return navigate("/login");

    const fetchProfile = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };

        const { data } = await axios.get(
          `${BACKEND_URL}/api/users/profile`,
          config
        );
        setUser(data);
        setUsername(data.username);
        setEmail(data.email);

        localStorage.setItem(
          "userInfo",
          JSON.stringify({ ...userInfo, ...data })
        );

        const [followersRes, followingRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/users/followers`, config),
          axios.get(`${BACKEND_URL}/api/users/following`, config),
        ]);

        setFollowers(followersRes.data);
        setFollowing(followingRes.data);

        const map = {};
        followingRes.data.forEach((u) => {
          map[u._id] = true;
        });
        setFollowMap(map);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("userInfo");
          navigate("/login");
        } else {
          setError("Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!search.trim()) return setSuggestions([]);

      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const { data } = await axios.get(
          `${BACKEND_URL}/api/users/search-users?query=${search}`,
          {
            headers: {
              Authorization: `Bearer ${userInfo?.token}`,
            },
          }
        );
        setSuggestions(data.slice(0, 5));
      } catch (err) {
        console.error("Suggestion fetch error:", err);
      }
    };

    const delay = setTimeout(fetchSuggestions, 1000);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    if (suggestions.length === 0) return;
    const timer = setTimeout(() => setSuggestions([]), 15000);
    return () => clearTimeout(timer);
  }, [suggestions]);

  const handleSearchSelect = (username) => {
    setSearch("");
    setSuggestions([]);
    navigate(`/user/${username}`);
  };

  const toggle2FA = async () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo?.token) return navigate("/login");

    setToggleLoading(true);
    setError("");
    setSuccess("");

    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    };

    try {
      if (user.twoFactorAuth) {
        await axios.post(`${BACKEND_URL}/api/auth/2fa/disable`, {}, config);
        setUser((prev) => ({ ...prev, twoFactorAuth: false }));
        localStorage.setItem(
          "userInfo",
          JSON.stringify({ ...userInfo, twoFactorAuth: false })
        );
        setQrCode("");
        setSuccess("2FA disabled successfully.");
      } else {
        const { data } = await axios.post(
          `${BACKEND_URL}/api/auth/2fa/enable`,
          {},
          config
        );
        setUser((prev) => ({ ...prev, twoFactorAuth: true }));
        localStorage.setItem(
          "userInfo",
          JSON.stringify({ ...userInfo, twoFactorAuth: true })
        );
        setQrCode(data.qrCode);
        setSuccess("2FA enabled successfully.");
      }
    } catch (error) {
      console.error(error);
      setError("Failed to toggle 2FA");
    } finally {
      setToggleLoading(false);
    }
  };

  const uploadProfile = async () => {
    if (!profilePic) return;
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", profilePic);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `${BACKEND_URL}/api/users/upload-profile-picture`,
        formData,
        config
      );

      setUser((prev) => ({ ...prev, profilePicture: data.profilePicture }));
      localStorage.setItem(
        "userInfo",
        JSON.stringify({ ...userInfo, profilePicture: data.profilePicture })
      );
      setSuccess("Profile image updated successfully");
    } catch {
      setError("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const saveChanges = async () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setSaving(true);

    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(
        `${BACKEND_URL}/api/users/profile`,
        { username, email },
        config
      );
      setUser((prev) => ({ ...prev, username, email }));
      localStorage.setItem(
        "userInfo",
        JSON.stringify({ ...userInfo, username, email })
      );
      setSuccess("Profile updated successfully");
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleFollow = async (targetId) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    };

    try {
      const isFollowing = followMap[targetId];

      const endpoint = isFollowing
        ? `${BACKEND_URL}/api/users/${targetId}/unfollow`
        : `${BACKEND_URL}/api/users/${targetId}/follow`;

      await axios.post(endpoint, {}, config);

      setFollowMap((prev) => ({
        ...prev,
        [targetId]: !isFollowing,
      }));

      if (isFollowing) {
        setFollowing((prev) => prev.filter((u) => u._id !== targetId));
        setSuccess("Unfollowed successfully");
      } else {
        const newUser = suggestions.find((u) => u._id === targetId);
        if (newUser) {
          setFollowing((prev) => [...prev, newUser]);
        }
        setSuccess("Followed successfully");
      }
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
      setError("Failed to follow/unfollow user");
    }
  };

  if (loading || !user) return <Loader />;

  return (
    <Container fluid className="mt-4">
      {error && (
        <Message variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Message>
      )}
      {success && (
        <Message variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Message>
      )}

      <Row className="gap-3">
        {/* LEFT PANEL: Profile Overview */}
        <Col md={4} className="bg-white rounded-4 shadow-sm p-4">
          <div className="text-center mb-3">
            <div
              className="cursor-pointer"
              onClick={() => document.getElementById("profileUpload").click()}
            >
              <Image
                src={
                  user.profilePicture
                    ? `${BACKEND_URL}${user.profilePicture}` // localhost replace with BACKEND_URL
                    : "https://placehold.co/120x120?text=User"
                }
                roundedCircle
                width={120}
                height={120}
                className="border"
                style={{ objectFit: "cover" }}
              />
            </div>
            <Form.Control
              type="file"
              id="profileUpload"
              style={{ display: "none" }}
              onChange={(e) =>
                e.target.files.length > 0 && setProfilePic(e.target.files[0])
              }
            />
            <h5 className="mt-3">
              <i className="fas fa-user-circle me-2 text-primary"></i>
              {user.username}
            </h5>
            <p className="text-muted">
              <i className="fas fa-envelope me-2"></i>
              {user.email}
            </p>

            {profilePic && (
              <Button
                variant="primary"
                className="mt-2"
                onClick={uploadProfile}
                disabled={uploading}
              >
                <i className="fas fa-upload me-2"></i>
                {uploading ? "Uploading..." : "Upload Image"}
              </Button>
            )}
          </div>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="fas fa-user-edit me-2"></i>Edit Username
              </Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            <Button
              variant="success"
              className="w-100"
              onClick={saveChanges}
              disabled={saving}
            >
              <i className="fas fa-save me-2"></i>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Form>

          <hr className="my-4" />

          <div className="d-flex justify-content-between align-items-center">
            <span>
              <i className="fas fa-lock me-2"></i>Two Factor Auth
            </span>
            <Button
              size="sm"
              variant={user.twoFactorAuth ? "danger" : "outline-primary"}
              onClick={toggle2FA}
              disabled={toggleLoading}
            >
              {toggleLoading
                ? "Please wait..."
                : user.twoFactorAuth
                ? "Disable"
                : "Enable"}
            </Button>
          </div>

          {qrCode && (
            <div className="text-center mt-3">
              <h6 className="text-muted mb-2">
                <i className="fas fa-qrcode me-2"></i>Scan with Google
                Authenticator
              </h6>
              <img
                src={qrCode}
                alt="QR Code"
                className="border rounded p-2"
                style={{ width: "160px", height: "160px" }}
              />
            </div>
          )}
        </Col>

        {/* RIGHT PANEL: User Interaction */}
        <Col md={7} className="bg-white rounded-4 shadow-sm p-4">
          <Form.Control
            type="text"
            placeholder="Search for users..."
            className="mb-3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {suggestions.length > 0 && (
            <div
              className="border rounded p-2 mb-4 bg-light"
              style={{ maxHeight: "180px", overflowY: "auto" }}
            >
              {suggestions.map((u) => (
                <div
                  key={u._id}
                  className="d-flex align-items-center justify-content-between mb-2"
                >
                  <div
                    onClick={() => handleSearchSelect(u.username)}
                    className="d-flex align-items-center cursor-pointer"
                  >
                    <Image
                      src={
                        u.profilePicture
                          ? `${BACKEND_URL}${u.profilePicture}`
                          : "https://placehold.co/40x40?text=User"
                      }
                      roundedCircle
                      width={40}
                      height={40}
                    />
                    <span className="ms-2 fw-medium">{u.username}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={followMap[u._id] ? "danger" : "primary"}
                    onClick={() => toggleFollow(u._id)}
                  >
                    <i
                      className={`fas ${
                        followMap[u._id] ? "fa-user-minus" : "fa-user-plus"
                      } me-1`}
                    ></i>
                    {followMap[u._id] ? "Unfollow" : "Follow"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Row>
            <Col md={6}>
              <h6 className="mb-3">
                <i className="fas fa-users me-2 text-secondary"></i>Followers
              </h6>
              <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                {followers.map((f) => (
                  <div
                    key={f._id}
                    className="d-flex align-items-center mb-2 cursor-pointer"
                    onClick={() => navigate(`/user/${f.username}`)}
                  >
                    <Image
                      src={
                        f.profilePicture
                          ? `${BACKEND_URL}${f.profilePicture}`
                          : "https://placehold.co/40x40?text=User"
                      }
                      roundedCircle
                      width={40}
                      height={40}
                    />
                    <span className="ms-2">{f.username}</span>
                  </div>
                ))}
              </div>
            </Col>

            <Col md={6}>
              <h6 className="mb-3">
                <i className="fas fa-user-friends me-2 text-secondary"></i>
                Following
              </h6>
              <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                {following.map((f) => (
                  <div
                    key={f._id}
                    className="d-flex justify-content-between align-items-center mb-2"
                  >
                    <div
                      className="d-flex align-items-center cursor-pointer"
                      onClick={() => navigate(`/user/${f.username}`)}
                    >
                      <Image
                        src={
                          f.profilePicture
                            ? `${BACKEND_URL}${f.profilePicture}`
                            : "https://placehold.co/40x40?text=User"
                        }
                        roundedCircle
                        width={40}
                        height={40}
                      />
                      <span className="ms-2">{f.username}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => toggleFollow(f._id)}
                    >
                      <i className="fas fa-user-minus me-1"></i>Unfollow
                    </Button>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
      {/* Posts Grid */}
      <Row className="px-5">
        <Col>
          <h5 className="mb-3">Posts</h5>
          <UserPosts userId={user._id} showActions={false} />
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
