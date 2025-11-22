import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LogOut, Plus, QrCode, Users, Calendar, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type { User, AttendanceSession, AttendanceRecord } from '../App';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

export function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    // Load sessions from localStorage
    const savedSessions = localStorage.getItem('sams_sessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }

    // Check for updates every 2 seconds
    const interval = setInterval(() => {
      const savedSessions = localStorage.getItem('sams_sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            // Fallback to mock location
            resolve({
              latitude: 40.7128,
              longitude: -74.0060,
            });
          }
        );
      } else {
        // Fallback to mock location
        resolve({
          latitude: 40.7128,
          longitude: -74.0060,
        });
      }
    });
  };

  const createSession = async () => {
    if (!courseName.trim()) {
      toast.error('Please enter a course name');
      return;
    }

    const location = await getCurrentLocation();
    const sessionId = 'session_' + Date.now();
    const qrData = JSON.stringify({
      sessionId,
      teacherId: user.id,
      timestamp: Date.now(),
    });

    const newSession: AttendanceSession = {
      id: sessionId,
      teacherId: user.id,
      teacherName: user.name,
      courseName: courseName.trim(),
      qrCode: qrData,
      qrData: qrData,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      location,
      attendanceRecords: [],
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    localStorage.setItem('sams_sessions', JSON.stringify(updatedSessions));
    
    setActiveSession(newSession);
    setShowCreateDialog(false);
    setCourseName('');
    toast.success('Session created successfully!');
  };

  const endSession = (sessionId: string) => {
    const updatedSessions = sessions.map(s => 
      s.id === sessionId ? { ...s, expiresAt: Date.now() } : s
    );
    setSessions(updatedSessions);
    localStorage.setItem('sams_sessions', JSON.stringify(updatedSessions));
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
    }
    toast.success('Session ended');
  };

  const isSessionActive = (session: AttendanceSession) => {
    return session.expiresAt > Date.now();
  };

  const downloadAttendance = (session: AttendanceSession) => {
    const csvContent = [
      ['Roll Number', 'Student Name', 'Timestamp', 'Latitude', 'Longitude'].join(','),
      ...session.attendanceRecords.map(record => [
        record.rollNumber,
        record.studentName,
        new Date(record.timestamp).toLocaleString(),
        record.location.latitude,
        record.location.longitude,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${session.courseName}_${new Date(session.createdAt).toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Attendance downloaded');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid gap-6">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-gray-900">{sessions.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar className="size-8 text-blue-600" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Sessions</CardDescription>
              <CardTitle className="text-gray-900">
                {sessions.filter(isSessionActive).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QrCode className="size-8 text-green-600" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Attendance</CardDescription>
              <CardTitle className="text-gray-900">
                {sessions.reduce((sum, s) => sum + s.attendanceRecords.length, 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="size-8 text-purple-600" />
            </CardContent>
          </Card>
        </div>

        {/* Create Session Button */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Sessions</CardTitle>
            <CardDescription>
              Create a new session to generate a QR code for students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="size-4 mr-2" />
              Create New Session
            </Button>
          </CardContent>
        </Card>

        {/* Active Session QR Code */}
        {activeSession && isSessionActive(activeSession) && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-green-900">{activeSession.courseName}</CardTitle>
                  <CardDescription>
                    Session expires in {Math.floor((activeSession.expiresAt - Date.now()) / 60000)} minutes
                  </CardDescription>
                </div>
                <Button variant="destructive" onClick={() => endSession(activeSession.id)}>
                  End Session
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="bg-white p-6 rounded-lg shadow-lg">
               <QRCodeCanvas
  value={activeSession.qrData}
  size={340}          // bigger = easier scanning
  level="M"           // more reliable for decoding
  includeMargin={true}
/>

              </div>
              <div className="text-center">
                <p className="text-gray-700">
                  Students present: {activeSession.attendanceRecords.length}
                </p>
                <p className="text-gray-500">
                  Show this QR code to students to mark attendance
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session History */}
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>View and manage past attendance sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No sessions yet. Create your first session to get started!
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-gray-900">{session.courseName}</h3>
                        <Badge variant={isSessionActive(session) ? "default" : "secondary"}>
                          {isSessionActive(session) ? 'Active' : 'Ended'}
                        </Badge>
                      </div>
                      <p className="text-gray-600">
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                      <p className="text-gray-500">
                        {session.attendanceRecords.length} students present
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSession(
                          activeSession?.id === session.id ? null : session
                        )}
                      >
                        {activeSession?.id === session.id ? 'Hide' : 'View'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttendance(session)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Details */}
        {activeSession && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Details - {activeSession.courseName}</CardTitle>
              <CardDescription>
                Real-time attendance updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSession.attendanceRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No attendance marked yet
                </p>
              ) : (
                <div className="space-y-2">
                  {activeSession.attendanceRecords.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900">{record.studentName}</p>
                        <p className="text-gray-600">Roll: {record.rollNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-gray-500">
                          ✓ Verified
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Session Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Attendance Session</DialogTitle>
            <DialogDescription>
              Enter the course name and generate a QR code for attendance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course Name</Label>
              <Input
                id="course"
                placeholder="e.g., Computer Science 101"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createSession} className="flex-1">
                Create Session
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
