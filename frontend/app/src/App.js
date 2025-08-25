import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Profile from "./Pages/Profile";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import { Container } from "react-bootstrap";
import Home from "../src/Pages/Home";
import UserProfile from "./Pages/UserProfile";
import ChatList from "../src/Chat/ChatList";
import Chat from "../src/Chat/Chat";


function App() {
  return (
    <BrowserRouter>
      <Header />
      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:id" element={<Chat/>} />

        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
