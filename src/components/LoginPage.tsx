import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { QrCode, GraduationCap, UserCircle } from 'lucide-react';
import type { User } from '../App';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication
    if (teacherEmail && teacherPassword) {
      onLogin({
        id: 'teacher_' + Date.now(),
        name: teacherEmail.split('@')[0],
        role: 'teacher',
        email: teacherEmail,
      });
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication
    if (studentRoll && studentPassword) {
      onLogin({
        id: 'student_' + Date.now(),
        name: 'Student ' + studentRoll,
        role: 'student',
        rollNumber: studentRoll,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-center md:text-left space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="bg-indigo-600 p-3 rounded-2xl">
              <QrCode className="size-12 text-white" />
            </div>
            <div>
              <h1 className="text-indigo-900">SAMS</h1>
              <p className="text-indigo-600">Smart Attendance Management</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-indigo-900">Welcome to the Future of Attendance</h2>
            <p className="text-gray-600">
              Track attendance in real-time using QR codes and GPS verification. 
              Fast, secure, and transparent.
            </p>
            
            <div className="grid gap-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <QrCode className="size-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-gray-900">QR Code Scanning</h3>
                  <p className="text-gray-600">Quick and contactless attendance marking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <GraduationCap className="size-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-900">Anti-Fraud Protection</h3>
                  <p className="text-gray-600">GPS verification prevents proxy attendance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <UserCircle className="size-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-gray-900">Real-time Updates</h3>
                  <p className="text-gray-600">Instant attendance confirmation and reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Login to SAMS</CardTitle>
            <CardDescription>
              Choose your role and enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="teacher">Teacher</TabsTrigger>
              </TabsList>
              
              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roll">Roll Number / College ID</Label>
                    <Input
                      id="roll"
                      placeholder="Enter your roll number"
                      value={studentRoll}
                      onChange={(e) => setStudentRoll(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="Enter your password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login as Student
                  </Button>
                  <p className="text-center text-gray-500">
                    Demo: Use any roll number and password
                  </p>
                </form>
              </TabsContent>
              
              <TabsContent value="teacher">
                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="teacher@college.edu"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-password">Password</Label>
                    <Input
                      id="teacher-password"
                      type="password"
                      placeholder="Enter your password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login as Teacher
                  </Button>
                  <p className="text-center text-gray-500">
                    Demo: Use any email and password
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
