import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const COLORS = [
  "#e74c3c", "#3498db", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e67e22", "#e91e63",
];

function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [userId, setUserId] = useState("");
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");
    const storedRoom = sessionStorage.getItem("roomCode");
    const isAdmin = sessionStorage.getItem("isAdmin");

    if (!storedUserId || storedRoom !== roomCode) {
      navigate("/");
      return;
    }

    if (isAdmin === "true") {
      navigate(`/admin/${roomCode}`);
      return;
    }

    setUserId(storedUserId);

   socketRef.current = io(import.meta.env.VITE_API_URL);

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current.emit("join-room", {
        roomCode,
        userId: storedUserId,
        isAdmin: false,
      });
    });

    socketRef.current.on("room-users", (users) => {
      setUserCount(users.length);
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomCode, navigate]);

  const handleMouseMove = (e) => {
    if (!socketRef.current || !userId) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    socketRef.current.emit("cursor-move", { roomCode, userId, x, y });
  };

  const handleLeave = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary px-3 py-2">
        <span className="navbar-brand fw-bold mb-0">
          Room: <span className="badge bg-light text-primary ms-1">{roomCode}</span>
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white small">
            <span
              className={`badge ${connected ? "bg-success" : "bg-danger"} me-1`}
            >
              {connected ? "Live" : "Offline"}
            </span>
            {userCount} user{userCount !== 1 ? "s" : ""} connected
          </span>
          <span className="text-white small">ID: <strong>{userId}</strong></span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLeave}>
            Leave
          </button>
        </div>
      </nav>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="room-canvas"
        onMouseMove={handleMouseMove}
      >
        <div className="d-flex align-items-center justify-content-center h-100 bg-dark">
          <div className="text-center text-white">
            <div style={{ fontSize: "48px" }}>🖱️</div>
            <h5 className="mt-3">Move your cursor around!</h5>
            <p className="small text-light">
              The admin can see your cursor position in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;
