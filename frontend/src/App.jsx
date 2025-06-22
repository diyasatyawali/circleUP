import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Peoples from "./pages/Peoples";
import ChatPage from "./pages/ChatPage";
import CommunityPage from "./pages/CommunityPage";
import AdminCommunityPage from "./pages/AdminCommunityPage";

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/peoples" element={<Peoples />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/create-community" element={<AdminCommunityPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
