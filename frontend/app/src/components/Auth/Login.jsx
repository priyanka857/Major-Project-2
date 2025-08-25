import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Container } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import Loader from "../Loader";
import Message from "../Message";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(""); // 2FA OTP token
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Please fill all required fields.",
      });
      return;
    }

    if (require2FA && !token) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Please enter your 2FA OTP.",
      });
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
          token: token || undefined,
        }
      );

      localStorage.setItem("userInfo", JSON.stringify(data));

      setAlert({
        show: true,
        variant: "success",
        message: "Login successful! Redirecting...",
      });

      setTimeout(() => {
        setAlert({ show: false, variant: "", message: "" });
        navigate("/profile");
      }, 1500);
      localStorage.setItem("userInfo", JSON.stringify(data));

      window.dispatchEvent(new Event("userInfoUpdated"));

      setAlert({
        show: true,
        variant: "success",
        message: "Login successful! Redirecting...",
      });

      setTimeout(() => {
        setAlert({ show: false, variant: "", message: "" });
        navigate("/profile");
      }, 1500);
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed.";

      if (
        msg.toLowerCase().includes("2fa token required") ||
        msg.toLowerCase().includes("invalid 2fa token")
      ) {
        setRequire2FA(true);
        setAlert({ show: true, variant: "warning", message: msg });
      } else {
        setAlert({ show: true, variant: "danger", message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(
        () => setAlert({ show: false, variant: "", message: "" }),
        4000
      );
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  return (
    <Container className="mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Login</h2>

      {loading && <Loader />}

      {!loading && alert.show && (
        <Message
          variant={alert.variant}
          dismissible
          onClose={() => setAlert({ show: false })}
        >
          {alert.message}
        </Message>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label>Password</Form.Label>
          <div className="d-flex">
            <Form.Control
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button
              variant="outline-secondary"
              onClick={() => setShowPassword((prev) => !prev)}
              type="button"
            >
              <i
                className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              />
            </Button>
          </div>
        </Form.Group>

        {require2FA && (
          <Form.Group className="mb-3" controlId="formToken">
            <Form.Label>2FA OTP</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter 2FA OTP"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="one-time-code"
              required={require2FA}
            />
          </Form.Group>
        )}

        <Button
          variant="primary"
          type="submit"
          className="w-100"
          disabled={loading}
        >
          Login
        </Button>
      </Form>

      <div className="mt-3 text-center">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </div>
    </Container>
  );
}

export default Login;
