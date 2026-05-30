import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import BookingPage from "./pages/user";
import AdminApp from "./pages/Admin";
import VideoCall from "./VideoCall";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/user" element={<BookingPage />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="/video-call" element={<VideoCall />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);