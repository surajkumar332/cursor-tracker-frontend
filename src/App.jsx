import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JoinRoom from "./pages/JoinRoom";
import Room from "./pages/Room";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/room/:roomCode" element={<Room />} />
        <Route path="/admin/:roomCode" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
