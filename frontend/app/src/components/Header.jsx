import React, { useState, useEffect } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserInfo = () => {
      const userInfo = localStorage.getItem("userInfo");
      setUser(userInfo ? JSON.parse(userInfo) : null);
    };

    loadUserInfo();
    window.addEventListener("userInfoUpdated", loadUserInfo);
    window.addEventListener("storage", loadUserInfo);

    return () => {
      window.removeEventListener("userInfoUpdated", loadUserInfo);
      window.removeEventListener("storage", loadUserInfo);
    };
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    window.dispatchEvent(new Event("userInfoUpdated"));
    navigate("/login");
  };

  return (
    <header>
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>Social Media App</Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="navbar-nav" />

          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto align-items-center">
              <LinkContainer to="/">
                <Nav.Link>Home</Nav.Link>
              </LinkContainer>

              {user && (
                <Link to="/chat" className="nav-link text-white position-relative me-2">
                  <i className="fas fa-comments fa-lg"></i>
                </Link>
              )}

              {!user ? (
                <>
                  <LinkContainer to="/login">
                    <Nav.Link>Login</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/signup">
                    <Nav.Link>Signup</Nav.Link>
                  </LinkContainer>
                </>
              ) : (
                <NavDropdown
                  title={`Welcome, ${user.username}`}
                  id="user-dropdown"
                  align="end"
                  menuVariant="dark"
                >
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Profile</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logoutHandler}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;
