import React, { useEffect, useMemo, useState } from 'react';
import { LogOut, Users, GraduationCap, UserCircle, QrCode, Trash2, CheckCircle, Plus, Download, Edit3 } from 'lucide-react';

// --- Mock UI Components for Single File Usage (Shadcn-like) ---
const Button = ({ children, onClick, variant = 'default', size = 'default', className = '' }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";
  const sizeClasses = size === 'sm' ? 'h-9 px-3' : size === 'default' ? 'h-10 px-4 py-2' : '';
  let variantClasses = 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';

  if (variant === 'outline') variantClasses = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-gray-400';
  if (variant === 'secondary') variantClasses = 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300';
  if (variant === 'destructive') variantClasses = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
  if (variant === 'ghost') variantClasses = 'bg-transparent text-gray-700 hover:bg-gray-100';

  return (
    <button onClick={onClick} className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border rounded-xl shadow-lg ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ children, className = '' }) => <div className={`p-4 ${className}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={`p-4 pt-0 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }) => <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
const CardDescription = ({ children, className = '' }) => <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;

const Badge = ({ children, variant = 'default', className = '' }) => {
  let variantClasses = 'bg-blue-100 text-blue-800';
  if (variant === 'outline') variantClasses = 'bg-white text-gray-700 border border-gray-300';
  if (variant === 'secondary') variantClasses = 'bg-gray-200 text-gray-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

// Simple Toast Mock
const toast = {
  success: (message) => console.log(`TOAST: Success - ${message}`),
  error: (message) => console.error(`TOAST: Error - ${message}`),
};

// ------------------------
// Types
// ------------------------
export type UserRole = 'student' | 'teacher' | 'admin';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  rollNumber?: string;
};

export type AttendanceRecord = {
  userId: string;
  timestamp: number;
  deviceId?: string; // optional device identifier for fraud heuristics
  geo?: { lat: number; lng: number } | null; // optional geo coordinates when recorded
};

export type AttendanceSession = {
  id: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  createdAt: number;
  expiresAt: number;
  classroomId?: string | null;
  attendanceRecords: AttendanceRecord[];
};

export type Subject = {
  id: string;
  name: string;
  teacherId?: string | null;
};

export type Classroom = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

// ------------------------
// Mock data
// ------------------------
const MOCK_STUDENTS: User[] = [
  { id: 's101', name: 'Alice Johnson', role: 'student', rollNumber: 'R101' },
  { id: 's102', name: 'Bob Smith', role: 'student', rollNumber: 'R102' },
  { id: 's103', name: 'Charlie Brown', role: 'student', rollNumber: 'R103' },
];

const MOCK_TEACHERS: User[] = [
  { id: 't201', name: 'Dr. Emily Davis', role: 'teacher', email: 'emily@college.edu' },
  { id: 't202', name: 'Prof. Frank White', role: 'teacher', email: 'frank@college.edu' },
];

const MOCK_SUBJECTS: Subject[] = [
  { id: 'sub1', name: 'Mathematics 101', teacherId: 't201' },
  { id: 'sub2', name: 'Physics 201', teacherId: 't202' },
];

const MOCK_CLASSROOMS: Classroom[] = [
  { id: 'c1', name: 'Room A - Block 1', latitude: 12.9352, longitude: 77.6245 },
  { id: 'c2', name: 'Room B - Block 3', latitude: 12.9360, longitude: 77.6250 },
];

const MOCK_SESSIONS: AttendanceSession[] = [
  {
    id: 'sess1',
    courseName: 'Mathematics 101 - Lecture 1',
    teacherId: 't201',
    teacherName: 'Dr. Emily Davis',
    createdAt: Date.now() - 1000 * 60 * 60,
    expiresAt: Date.now() + 1000 * 60 * 30,
    classroomId: 'c1',
    attendanceRecords: [
      { userId: 's101', timestamp: Date.now() - 1000 * 60 * 50, deviceId: 'device-a', geo: { lat: 12.9352, lng: 77.6245 } },
      { userId: 's102', timestamp: Date.now() - 1000 * 60 * 49, deviceId: 'device-b', geo: { lat: 12.9351, lng: 77.6246 } },
    ],
  },
  {
    id: 'sess2',
    courseName: 'Physics 201 - Lab',
    teacherId: 't202',
    teacherName: 'Prof. Frank White',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    expiresAt: Date.now() - 1000 * 60 * 60 * 23,
    classroomId: 'c2',
    attendanceRecords: [
      { userId: 's103', timestamp: Date.now() - 1000 * 60 * 60 * 23.5, deviceId: 'device-c', geo: { lat: 12.9360, lng: 77.6250 } },
    ],
  },
];

// ------------------------
// Helpers
// ------------------------
const uid = (prefix = '') => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

function saveToLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

function loadFromLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load from localStorage', e);
    return fallback;
  }
}

function exportCSV(filename, rows) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Basic fraud detection heuristics
function detectFraudForRecord(record, session, classroom = null) {
  const reasons = [];
  // 1. If geo exists and classroom provided, check distance > 500 meters
  if (record.geo && classroom) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371e3; // metres
    const φ1 = toRad(classroom.latitude);
    const φ2 = toRad(record.geo.lat);
    const Δφ = toRad(record.geo.lat - classroom.latitude);
    const Δλ = toRad(record.geo.lng - classroom.longitude);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // distance in metres
    if (d > 500) reasons.push(`Recorded ~${Math.round(d)}m away from classroom`);
  }
  // 2. If timestamp is after session expires
  if (record.timestamp > session.expiresAt) {
    reasons.push('Recorded after session expiry');
  }
  return reasons;
}

// ------------------------
// Main Component
// ------------------------
interface AdminDashboardProps {
  user?: User; 
  onLogout?: () => void; // <-- The critical prop for logout
}

// Destructuring onLogout here is the fix.
export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  // Local state seeded from localStorage or mocks
  const [users, setUsers] = useState(() => loadFromLocal('sams_users', [...MOCK_STUDENTS, ...MOCK_TEACHERS]));
  const [subjects, setSubjects] = useState(() => loadFromLocal('sams_subjects', MOCK_SUBJECTS));
  const [classrooms, setClassrooms] = useState(() => loadFromLocal('sams_classrooms', MOCK_CLASSROOMS));
  const [sessions, setSessions] = useState(() => loadFromLocal('sams_sessions', MOCK_SESSIONS));

  // UI state
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [filterRole, setFilterRole] = useState('all');

  // Persist on change
  useEffect(() => saveToLocal('sams_users', users), [users]);
  useEffect(() => saveToLocal('sams_subjects', subjects), [subjects]);
  useEffect(() => saveToLocal('sams_classrooms', classrooms), [classrooms]);
  useEffect(() => saveToLocal('sams_sessions', sessions), [sessions]);

  const totalAttendanceRecords = sessions.reduce((sum, s) => sum + (s.attendanceRecords?.length || 0), 0);
  const activeSessions = sessions.filter(s => s.expiresAt > Date.now());

  // ------------------------
  // User management
  // ------------------------
  const createMockUser = (role) => {
    const newId = role === 'student' ? `s${Math.floor(Math.random() * 10000)}` : `t${Math.floor(Math.random() * 10000)}`;
    const count = users.length + 1;
    const newUser = role === 'student'
      ? { id: newId, name: `New Student ${count}`, role: 'student', rollNumber: `R${100 + count}` }
      : { id: newId, name: `New Teacher ${count}`, role: 'teacher', email: `teacher${count}@college.edu` };
    setUsers(prev => [...prev, newUser]);
    toast.success(`${newUser.name} created (mock)`);
  };

  const deleteUser = (userId) => {
    if (!window.confirm('Delete this user? This is permanent for mock data.')) return;
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success('User deleted');
  };

  const editUserName = (userId) => {
    // IMPORTANT: Do not use alert/prompt in a real application, use a custom modal UI.
    const name = window.prompt('Enter new name'); 
    if (!name) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name } : u));
    toast.success('User updated');
  };

  // ------------------------
  // Subject management
  // ------------------------
  const createSubject = () => {
    const name = window.prompt('Subject name');
    if (!name) return;
    const id = uid('sub-');
    setSubjects(prev => [...prev, { id, name }]);
    toast.success('Subject added');
  };

  const deleteSubject = (id) => {
    if (!window.confirm('Delete subject?')) return;
    setSubjects(prev => prev.filter(s => s.id !== id));
    toast.success('Subject deleted');
  };

  // ------------------------
  // Classroom management
  // ------------------------
  const addClassroom = () => {
    const name = window.prompt('Classroom name');
    const latStr = window.prompt('Latitude (decimal)');
    const lngStr = window.prompt('Longitude (decimal)');
    if (!name || !latStr || !lngStr) return;
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      window.alert('Invalid coordinates'); // Replaced original alert with window.alert for compatibility
      return;
    }
    const c = { id: uid('c-'), name, latitude, longitude };
    setClassrooms(prev => [...prev, c]);
    toast.success('Classroom added');
  };

  const deleteClassroom = (id) => {
    if (!window.confirm('Delete classroom?')) return;
    setClassrooms(prev => prev.filter(c => c.id !== id));
    toast.success('Classroom deleted');
  };

  // ------------------------
  // Session management and corrections
  // ------------------------
  const openSessionDetails = (id) => setSelectedSessionId(id);
  const closeSessionDetails = () => setSelectedSessionId(null);

  const selectedSession = useMemo(() => sessions.find(s => s.id === selectedSessionId) ?? null, [sessions, selectedSessionId]);

  const addManualAttendance = (sessionId) => {
    const userId = window.prompt('Enter userId to mark present (e.g. s101)');
    if (!userId) return;
    const user = users.find(u => u.id === userId);
    if (!user) {
      window.alert('User not found');
      return;
    }
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, attendanceRecords: [...s.attendanceRecords, { userId, timestamp: Date.now(), deviceId: 'manual' }] } : s));
    toast.success('Attendance added manually');
  };

  const removeAttendanceRecord = (sessionId, index) => {
    if (!window.confirm('Remove this attendance record?')) return;
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const copy = [...s.attendanceRecords];
      copy.splice(index, 1);
      return { ...s, attendanceRecords: copy };
    }));
    toast.success('Attendance record removed');
  };

  const deleteSession = (sessionId) => {
    if (!window.confirm('Delete session and all attendance?')) return;
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast.success('Session deleted');
  };

  // ------------------------
  // Exporting
  // ------------------------
  const exportAllSessionsCSV = () => {
    const header = ['Session ID', 'Course', 'Teacher', 'Created At', 'Expires At', 'Student ID', 'Student Name', 'Timestamp', 'DeviceId', 'GeoLat', 'GeoLng'];
    const rows = [header];
    sessions.forEach(s => {
      s.attendanceRecords.forEach(r => {
        const u = users.find(x => x.id === r.userId);
        rows.push([
          s.id,
          s.courseName,
          s.teacherName,
          new Date(s.createdAt).toISOString(),
          new Date(s.expiresAt).toISOString(),
          r.userId,
          u?.name ?? 'Unknown',
          new Date(r.timestamp).toISOString(),
          r.deviceId ?? '',
          r.geo?.lat?.toString() ?? '',
          r.geo?.lng?.toString() ?? '',
        ]);
      });
      if (s.attendanceRecords.length === 0) {
        rows.push([s.id, s.courseName, s.teacherName, new Date(s.createdAt).toISOString(), new Date(s.expiresAt).toISOString(), '', '', '', '', '', '']);
      }
    });
    exportCSV('attendance_all_sessions.csv', rows);
    toast.success('CSV export started');
  };

  const exportSessionCSV = (sessionId) => {
    const s = sessions.find(x => x.id === sessionId);
    if (!s) return window.alert('Session not found');
    const header = ['Student ID', 'Student Name', 'Timestamp', 'DeviceId', 'GeoLat', 'GeoLng'];
    const rows = [header];
    s.attendanceRecords.forEach(r => {
      const u = users.find(x => x.id === r.userId);
      rows.push([r.userId, u?.name ?? 'Unknown', new Date(r.timestamp).toISOString(), r.deviceId ?? '', r.geo?.lat?.toString() ?? '', r.geo?.lng?.toString() ?? '']);
    });
    exportCSV(`attendance_${s.id}.csv`, rows);
    toast.success('CSV export for session started');
  };

  // ------------------------
  // Fraud detection
  // ------------------------
  const fraudAlerts = useMemo(() => {
    const alerts = [];
    sessions.forEach(s => {
      const classroom = classrooms.find(c => c.id === s.classroomId) ?? null;
      // device usage map
      const deviceMap = new Map();
      s.attendanceRecords.forEach(r => {
        if (r.deviceId) {
          const set = deviceMap.get(r.deviceId) ?? new Set();
          set.add(r.userId);
          deviceMap.set(r.deviceId, set);
        }
      });

      s.attendanceRecords.forEach(r => {
        const reasons = detectFraudForRecord(r, s, classroom);
        // same device used by multiple users
        if (r.deviceId) {
          const usersWithDevice = deviceMap.get(r.deviceId) ?? new Set();
          if (usersWithDevice.size > 1) {
            reasons.push('Device used by multiple user IDs in same session');
          }
        }
        if (reasons.length) alerts.push({ sessionId: s.id, record: r, reasons });
      });
    });
    return alerts;
  }, [sessions, classrooms]);

  // ------------------------
  // Render
  // ------------------------
  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SAMS Admin Dashboard</h1>
            <p className="text-gray-600">Administrator Access: {user?.name ?? 'Admin (Mock)'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => { 
                // Fix: Call the provided onLogout function when confirmed
                if (window.confirm('Are you sure you want to log out?')) { 
                  toast.success('Logged out (mock)');
                  onLogout?.(); 
                } 
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid gap-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-gray-900">{users.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-gray-900">{sessions.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <QrCode className="h-8 w-8 text-purple-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Sessions</CardDescription>
              <CardTitle className="text-gray-900">{activeSessions.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Attendance Records</CardDescription>
              <CardTitle className="text-gray-900">{totalAttendanceRecords}</CardTitle>
            </CardHeader>
            <CardContent>
              <GraduationCap className="h-8 w-8 text-orange-600" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage students and teachers (mock data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <Button onClick={() => createMockUser('student')} variant="secondary" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Mock Student
              </Button>
              <Button onClick={() => createMockUser('teacher')} variant="secondary" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Mock Teacher
              </Button>
              <div className="mt-0 flex items-center gap-2 border rounded-lg bg-gray-50 p-1">
                <label className="text-sm font-medium text-gray-700 ml-2">Filter Role:</label>
                <select 
                  value={filterRole} 
                  onChange={e => setFilterRole(e.target.value)} 
                  className="border-none bg-transparent rounded p-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {users
                .filter(u => (filterRole === 'all' ? true : u.role === filterRole))
                .map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-6 w-6 text-gray-500" />
                      <div>
                        <h3 className="text-gray-900 font-medium">{u.name}</h3>
                        <p className="text-gray-600 text-sm">ID: {u.id} | {u.role === 'student' ? `Roll: ${u.rollNumber}` : `Email: ${u.email}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === 'student' ? 'outline' : 'default'}>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => editUserName(u.id)} className="p-1">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)} className="p-1">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subjects & Classrooms</CardTitle>
            <CardDescription>Create and manage subjects and classroom geo-coordinates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border p-4 rounded-xl bg-gray-50">
                <h4 className="font-semibold text-lg mb-3">Subjects ({subjects.length})</h4>
                <div className="flex gap-2 mb-4">
                  <Button size="sm" onClick={createSubject}><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {subjects.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-white border rounded">
                      <div>
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500">Teacher: {users.find(u => u.id === s.teacherId)?.name ?? 'Unassigned'}</div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteSubject(s.id)} className="h-7 px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border p-4 rounded-xl bg-gray-50">
                <h4 className="font-semibold text-lg mb-3">Classrooms ({classrooms.length})</h4>
                <div className="flex gap-2 mb-4">
                  <Button size="sm" onClick={addClassroom}><Plus className="mr-2 h-4 w-4" /> Add Classroom</Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {classrooms.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-white border rounded">
                      <div>
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500">Lat: {c.latitude.toFixed(4)}, Lng: {c.longitude.toFixed(4)}</div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteClassroom(c.id)} className="h-7 px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Sessions</CardTitle>
            <CardDescription>View and manage all attendance sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No sessions have been created yet.</p>
              ) : (
                sessions.slice().sort((a, b) => b.createdAt - a.createdAt).map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-gray-900 font-medium">{session.courseName}</h3>
                        <Badge variant={session.expiresAt > Date.now() ? 'default' : 'secondary'}>
                          {session.expiresAt > Date.now() ? 'Active' : 'Ended'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">Teacher: {session.teacherName} | Created: {new Date(session.createdAt).toLocaleString()}</p>
                      <p className="text-gray-500 text-sm font-medium mt-1">Attendance: {session.attendanceRecords.length} students</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openSessionDetails(session.id)}>View/Correct</Button>
                      <Button size="sm" variant="outline" onClick={() => exportSessionCSV(session.id)}>
                        <Download className="mr-1 h-4 w-4" /> CSV
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteSession(session.id)} className="h-9 px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6">
              <Button onClick={exportAllSessionsCSV}><Download className="mr-2 h-4 w-4" /> Export All Sessions Data</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fraud Detection Alerts</CardTitle>
            <CardDescription>Automatic heuristics flag suspicious attendance records for review</CardDescription>
          </CardHeader>
          <CardContent>
            {fraudAlerts.length === 0 ? (
              <div className="text-center text-gray-500 py-4 border-2 border-dashed rounded-lg bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm">No suspicious activity detected!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fraudAlerts.map((a, idx) => {
                  const session = sessions.find(s => s.id === a.sessionId);
                  const user = users.find(u => u.id === a.record.userId);
                  return (
                    <div key={`${a.sessionId}-${idx}`} className="p-3 border-l-4 border-red-500 bg-red-50 rounded">
                      <div className="text-sm font-semibold text-red-800">Alert in: {session?.courseName ?? a.sessionId}</div>
                      <div className="text-xs text-red-700 font-medium">Student: {user?.name ?? a.record.userId}</div>
                      <ul className="text-xs list-disc ml-5 text-red-600 mt-1 space-y-0.5">
                        {a.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                      <Button size="sm" variant="secondary" className="mt-2 h-7 px-2 text-xs" onClick={() => openSessionDetails(a.sessionId)}>
                        Review Record
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session details modal (simple implementation) */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-3xl w-full border border-gray-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="text-xl font-bold text-gray-800">Attendance Log — {selectedSession.courseName}</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addManualAttendance(selectedSession.id)}>Add Manual Entry</Button>
                <Button size="sm" variant="outline" onClick={closeSessionDetails}>Close</Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {selectedSession.attendanceRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No attendance recorded yet.</p>
              ) : (
                selectedSession.attendanceRecords.map((r, i) => (
                  <div key={`${r.userId}-${i}`} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">{users.find(u => u.id === r.userId)?.name ?? r.userId}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(r.timestamp).toLocaleString()} • Device: {r.deviceId ?? '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Geo: {r.geo ? `${r.geo.lat.toFixed(4)}, ${r.geo.lng.toFixed(4)}` : '—'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => removeAttendanceRecord(selectedSession.id, i)} className="h-8 px-3">
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}