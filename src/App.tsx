import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
// Import the new Admin Dashboard component
import AdminDashboard from "./components/AdminDashboard";

// --- UPDATED INTERFACE: Added "admin" role ---
export interface User {
  id: string;
  name: string;
  role: "teacher" | "student" | "admin"; // Admin role added here
  email?: string;
  rollNumber?: string;
}

export interface AttendanceSession {
  id: string;
  teacherId: string;
  teacherName: string;
  courseName: string;
  qrCode: string;
  qrData: string;
  createdAt: number;
  expiresAt: number;
  location: {
    latitude: number;
    longitude: number;
  };
  attendanceRecords: AttendanceRecord[];
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
  };
  deviceId: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("sams_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("sams_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("sams_user");
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // --- UPDATED RENDERING LOGIC ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {user.role === "admin" ? (
        <AdminDashboard user={user} onLogout={handleLogout} /> // Render Admin Dashboard
      ) : user.role === "teacher" ? (
        <TeacherDashboard user={user} onLogout={handleLogout} /> // Render Teacher Dashboard
      ) : (
        <StudentDashboard user={user} onLogout={handleLogout} /> // Render Student Dashboard (default)
      )}
    </div>
  );
}

export default App;