import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../Loader';
import Message from '../Message';

// Use Render backend URL
const API_BASE = process.env.REACT_APP_API_BASE || "https://socialmedia-backend-yfjp.onrender.com";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;
    if (!username || !email || !password || !confirmPassword) return 'All fields are required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!acceptedTerms) return 'You must accept the terms and conditions';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setAlert({ show: true, variant: 'danger', message: error });
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`${API_BASE}/api/auth/signup`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('userInfo', JSON.stringify(data));

      setAlert({
        show: true,
        variant: 'success',
        message: `✅ Welcome, ${data.username}! Redirecting to login...`,
      });

      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      setAcceptedTerms(false);

      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed';
      const isExists = msg.toLowerCase().includes('exists');
      setAlert({
        show: true,
        variant: 'danger',
        message: isExists ? 'User already exists, please login.' : msg,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  return (
    <Container className="mt-5" style={{ maxWidth: '500px' }}>
      <h2 className="mb-4 text-center">Sign Up Here</h2>

      {loading && <Loader />}
      {!loading && alert.show && (
        <Message variant={alert.variant} dismissible onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Message>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            placeholder="Enter username"
            value={formData.username}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            autoComplete="username"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
          />
        </Form.Group>

        <Row>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <Button variant="outline-secondary" onClick={() => setShowPassword(prev => !prev)}>
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </Button>
              </InputGroup>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Confirm</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <Button variant="outline-secondary" onClick={() => setShowConfirm(prev => !prev)}>
                  <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </Button>
              </InputGroup>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group controlId="terms" className="mb-3">
          <Form.Check
            type="checkbox"
            label={
              <span>
                I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">terms and conditions</a>
              </span>
            }
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
          Sign Up
        </Button>
      </Form>

      <div className="text-center mt-3">
        Already have an account? <Link to="/login">Login instead</Link>
      </div>
    </Container>
  );
}

export default Signup;
