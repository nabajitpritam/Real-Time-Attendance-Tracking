import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogOut, QrCode, CheckCircle, XCircle, Scan } from 'lucide-react';
import type { User, AttendanceSession } from '../App';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { QrScanner } from './QrScanner';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [myAttendance, setMyAttendance] = useState<Array<{ sessionId: string; courseName: string; timestamp: number; }>>([]);
  const [availableSessions, setAvailableSessions] = useState<AttendanceSession[]>([]);

  useEffect(() => {
    // Load my attendance from localStorage
    const savedAttendance = localStorage.getItem(`sams_attendance_${user.id}`);
    if (savedAttendance) {
      setMyAttendance(JSON.parse(savedAttendance));
    }

    // Check for available sessions
    const checkSessions = () => {
      const savedSessions = localStorage.getItem('sams_sessions');
      if (savedSessions) {
        const sessions: AttendanceSession[] = JSON.parse(savedSessions);
        const active = sessions.filter(s => s.expiresAt > Date.now());
        setAvailableSessions(active);
      }
    };

    checkSessions();
    const interval = setInterval(checkSessions, 3000);
    return () => clearInterval(interval);
  }, [user.id]);

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula to calculate distance in meters
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleScan = async (data: string) => {
    try {
      const qrData = JSON.parse(data);
      const { sessionId, teacherId, timestamp } = qrData;

      // Load sessions
      const savedSessions = localStorage.getItem('sams_sessions');
      if (!savedSessions) {
        toast.error('Session not found');
        return;
      }

      const sessions: AttendanceSession[] = JSON.parse(savedSessions);
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        toast.error('Invalid QR code');
        return;
      }

      if (session.expiresAt < Date.now()) {
        toast.error('This session has expired');
        return;
      }

      // Check if already marked
      const alreadyMarked = session.attendanceRecords.some(r => r.studentId === user.id);
      if (alreadyMarked) {
        toast.error('You have already marked attendance for this session');
        return;
      }

      // Get current location
      const currentLocation = await getCurrentLocation();

      // Verify location (within 100 meters)
      const distance = calculateDistance(
        session.location.latitude,
        session.location.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (distance > 100) {
        toast.error(`You are too far from the classroom (${Math.round(distance)}m away)`);
        return;
      }

      // Generate device ID
      const deviceId = localStorage.getItem('sams_device_id') || 'device_' + Date.now();
      localStorage.setItem('sams_device_id', deviceId);

      // Check if device already used
      const deviceUsed = session.attendanceRecords.some(r => r.deviceId === deviceId);
      if (deviceUsed) {
        toast.error('This device has already been used to mark attendance');
        return;
      }

      // Mark attendance
      const attendanceRecord = {
        studentId: user.id,
        studentName: user.name,
        rollNumber: user.rollNumber || 'N/A',
        timestamp: Date.now(),
        location: currentLocation,
        deviceId,
      };

      session.attendanceRecords.push(attendanceRecord);

      // Update sessions
      const updatedSessions = sessions.map(s => s.id === sessionId ? session : s);
      localStorage.setItem('sams_sessions', JSON.stringify(updatedSessions));

      // Update my attendance
      const newAttendance = {
        sessionId,
        courseName: session.courseName,
        timestamp: Date.now(),
      };
      const updatedMyAttendance = [...myAttendance, newAttendance];
      setMyAttendance(updatedMyAttendance);
      localStorage.setItem(`sams_attendance_${user.id}`, JSON.stringify(updatedMyAttendance));

      toast.success('Attendance marked successfully!');
      setShowScanner(false);
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast.error('Invalid QR code format');
    }
  };

  const todayAttendance = myAttendance.filter(a => {
    const today = new Date().setHours(0, 0, 0, 0);
    const attendanceDate = new Date(a.timestamp).setHours(0, 0, 0, 0);
    return attendanceDate === today;
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
            <p className="text-gray-500">Roll: {user.rollNumber}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid gap-6">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Today's Attendance</CardDescription>
              <CardTitle className="text-gray-900">{todayAttendance.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckCircle className="size-8 text-green-600" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Attendance</CardDescription>
              <CardTitle className="text-gray-900">{myAttendance.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <QrCode className="size-8 text-blue-600" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Available Sessions</CardDescription>
              <CardTitle className="text-gray-900">{availableSessions.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Scan className="size-8 text-purple-600" />
            </CardContent>
          </Card>
        </div>

        {/* Scan QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>
              Scan the QR code shown by your teacher to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowScanner(true)} size="lg" className="w-full">
              <Scan className="size-5 mr-2" />
              Scan QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Available Sessions */}
        {availableSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Currently available sessions for attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableSessions.map((session) => {
                  const alreadyMarked = session.attendanceRecords.some(r => r.studentId === user.id);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="text-gray-900">{session.courseName}</h3>
                        <p className="text-gray-600">{session.teacherName}</p>
                        <p className="text-gray-500">
                          Expires in {Math.floor((session.expiresAt - Date.now()) / 60000)} minutes
                        </p>
                      </div>
                      <Badge variant={alreadyMarked ? "default" : "secondary"}>
                        {alreadyMarked ? '✓ Marked' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myAttendance.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No attendance records yet. Scan a QR code to mark your first attendance!
                </p>
              ) : (
                myAttendance.slice().reverse().map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h3 className="text-gray-900">{record.courseName}</h3>
                      <p className="text-gray-600">
                        {new Date(record.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle className="size-5 text-green-600" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at the QR code displayed by your teacher
            </DialogDescription>
          </DialogHeader>
          <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
