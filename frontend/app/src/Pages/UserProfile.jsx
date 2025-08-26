import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Container, Card, Image, Spinner, Button } from "react-bootstrap";

const BACKEND_URL = process.env.REACT_APP_API_BASE;

const UserProfile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.token) return;

    setCurrentUserId(userInfo._id); // Logged in user ID

    const fetchUser = async () => {
      try {
        const { data } = await axios.get(
          `${BACKEND_URL}/api/users/profile/${username}`,
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );
        setUser(data);
        setIsFollowing(
          data.followers.map((id) => id.toString()).includes(userInfo._id)
        );
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  const handleFollowToggle = async () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.token || !user?._id) return;

    setProcessing(true);

    try {
      const endpoint = isFollowing
        ? `${BACKEND_URL}/api/users/${user._id}/unfollow`
        : `${BACKEND_URL}/api/users/${user._id}/follow`;

      await axios.post(
        endpoint,
        { followerId: currentUserId },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );

      setIsFollowing(!isFollowing);

      setUser((prev) => ({
        ...prev,
        followers: isFollowing
          ? prev.followers.filter((id) => id !== currentUserId)
          : [...prev.followers, currentUserId],
      }));
    } catch (err) {
      console.error("Follow/Unfollow failed", err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return <Spinner animation="border" className="mt-5 d-block mx-auto" />;
  if (!user)
    return <p className="mt-5 text-danger text-center">User not found.</p>;

  return (
    <Container className="mt-5">
      <Card className="p-4 shadow">
        <div className="text-center">
          <Image
            src={
              user.profilePicture
                ? `${BACKEND_URL}${user.profilePicture}`
                : "https://via.placeholder.com/100"
            }
            roundedCircle
            width={100}
            height={100}
          />
          <h3 className="mt-3">@{user.username}</h3>
          <p>{user.email}</p>
          <p>
            <strong>Followers:</strong> {user.followers.length}
          </p>
          <p>
            <strong>Following:</strong> {user.following.length}
          </p>

          {currentUserId !== user._id && (
            <Button
              variant={isFollowing ? "outline-danger" : "outline-primary"}
              onClick={handleFollowToggle}
              disabled={processing}
              className="mt-2"
            >
              {processing ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}
            </Button>
          )}
        </div>
      </Card>
    </Container>
  );
};

export default UserProfile;
