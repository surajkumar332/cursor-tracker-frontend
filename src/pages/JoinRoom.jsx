import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinRoom() {
  const [userId, setUserId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !roomCode.trim()) {
      setError("Please enter both User ID and Room Code.");
      return;
    }

    setLoading(true);

    try {
      // Try to join existing room
      const joinRes = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, userId }),
      });

      let data = await joinRes.json();

      // If room not found and isAdmin, create it
      if (!joinRes.ok && isAdmin) {
        const createRes = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode, adminId: userId }),
        });
        data = await createRes.json();
        if (!createRes.ok) {
          setError(data.message || "Failed to create room.");
          setLoading(false);
          return;
        }
        data.isAdmin = true;
      } else if (!joinRes.ok) {
        setError(data.message || "Room not found. Ask admin to create it first.");
        setLoading(false);
        return;
      }

      // Register user
      await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roomCode, isAdmin: data.isAdmin }),
      });

      // Save to sessionStorage
      sessionStorage.setItem("userId", userId);
      sessionStorage.setItem("roomCode", roomCode);
      sessionStorage.setItem("isAdmin", data.isAdmin ? "true" : "false");

      if (data.isAdmin) {
        navigate(`/admin/${roomCode}`);
      } else {
        navigate(`/room/${roomCode}`);
      }
    } catch (err) {
      setError("Server error. Make sure backend is running.");
    }

    setLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div className="card shadow-sm p-4" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">Cursor Tracker</h2>
          <p className="text-muted small">Join a room to start tracking cursors</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Your User ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. john123"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Room Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. ROOM001"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
          </div>

          <div className="mb-4 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="adminCheck"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="adminCheck">
              Join as Admin (creates room if not exists)
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Joining...
              </>
            ) : (
              "Join Room"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinRoom;
