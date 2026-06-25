import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const COLORS = [
  "#e74c3c", "#3498db", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e67e22", "#e91e63",
];

function AdminDashboard() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [userId, setUserId] = useState("");
  const [connected, setConnected] = useState(false);
  const [cursors, setCursors] = useState({});
  const [userColors, setUserColors] = useState({});
  const colorIndexRef = useRef(0);
  const canvasRef = useRef(null);

  const getColorForUser = (uid) => {
    setUserColors((prev) => {
      if (prev[uid]) return prev;
      const color = COLORS[colorIndexRef.current % COLORS.length];
      colorIndexRef.current++;
      return { ...prev, [uid]: color };
    });
    return userColors[uid] || COLORS[0];
  };

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");
    const storedRoom = sessionStorage.getItem("roomCode");
    const isAdmin = sessionStorage.getItem("isAdmin");

    if (!storedUserId || storedRoom !== roomCode || isAdmin !== "true") {
      navigate("/");
      return;
    }

    setUserId(storedUserId);

    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current.emit("join-room", {
        roomCode,
        userId: storedUserId,
        isAdmin: true,
      });
    });

    socketRef.current.on("cursor-update", ({ userId, x, y, socketId }) => {
      getColorForUser(userId);
      setCursors((prev) => ({
        ...prev,
        [socketId]: { userId, x, y },
      }));
    });

    socketRef.current.on("user-left", ({ socketId, userId }) => {
      setCursors((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomCode, navigate]);

  const handleLeave = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const cursorList = Object.values(cursors);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark px-3 py-2">
        <span className="navbar-brand fw-bold mb-0">
          Admin Dashboard —{" "}
          <span className="badge bg-warning text-dark ms-1">{roomCode}</span>
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white small">
            <span
              className={`badge ${connected ? "bg-success" : "bg-danger"} me-1`}
            >
              {connected ? "Live" : "Offline"}
            </span>
            {cursorList.length} user{cursorList.length !== 1 ? "s" : ""} active
          </span>
          <span className="text-white small">
            Admin: <strong>{userId}</strong>
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLeave}>
            Leave
          </button>
        </div>
      </nav>

      <div className="container-fluid flex-grow-1 p-3">
        <div className="row h-100 g-3">
          {/* Canvas */}
          <div className="col-md-9">
            <div
              ref={canvasRef}
              className="admin-canvas"
              style={{ position: "relative" }}
            >
              {cursorList.length === 0 && (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center text-muted">
                    <div style={{ fontSize: "48px" }}>👀</div>
                    <h5 className="mt-3">Waiting for users...</h5>
                    <p className="small">
                      Share room code <strong>{roomCode}</strong> with users to
                      see their cursors here.
                    </p>
                  </div>
                </div>
              )}

              {/* Render cursors */}
              {cursorList.map((cursor) => {
                const color = userColors[cursor.userId] || "#3498db";
                return (
                  <React.Fragment key={cursor.userId}>
                    <div
                      className="cursor-dot"
                      style={{
                        left: `${cursor.x}%`,
                        top: `${cursor.y}%`,
                        backgroundColor: color,
                        position: "absolute",
                      }}
                    />
                    <div
                      className="cursor-label"
                      style={{
                        left: `${cursor.x}%`,
                        top: `${cursor.y}%`,
                        position: "absolute",
                      }}
                    >
                      {cursor.userId}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Sidebar - user list */}
          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-header bg-dark text-white fw-semibold">
                Connected Users ({cursorList.length})
              </div>
              <div className="card-body p-2 overflow-auto">
                {cursorList.length === 0 ? (
                  <p className="text-muted small text-center mt-3">
                    No users connected yet
                  </p>
                ) : (
                  cursorList.map((cursor) => {
                    const color = userColors[cursor.userId] || "#3498db";
                    return (
                      <div
                        key={cursor.userId}
                        className="d-flex align-items-center gap-2 p-2 mb-1 rounded"
                        style={{ backgroundColor: "#f8f9fa" }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: color,
                            flexShrink: 0,
                          }}
                        />
                        <span className="small fw-semibold">{cursor.userId}</span>
                        <span className="ms-auto small text-muted">
                          {Math.round(cursor.x)}%, {Math.round(cursor.y)}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
