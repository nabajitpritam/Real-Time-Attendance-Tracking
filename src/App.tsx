import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentDashboard } from "./components/StudentDashboard";

export interface User {
  id: string;
  name: string;
  role: "teacher" | "student";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {user.role === "teacher" ? (
        <TeacherDashboard user={user} onLogout={handleLogout} />
      ) : (
        <StudentDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;