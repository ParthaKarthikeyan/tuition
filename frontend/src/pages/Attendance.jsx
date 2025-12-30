import { useState, useEffect } from 'react';
import { classesApi, studentsApi, sessionsApi, attendanceApi } from '../services/api';

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    startTime: '09:00',
    endTime: '10:00',
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    try {
      const [classesData, studentsData, sessionsData, attendanceData] = await Promise.all([
        classesApi.getAll(),
        studentsApi.getAll(),
        sessionsApi.getAll({ date: selectedDate }),
        attendanceApi.getAll()
      ]);
      setClasses(classesData);
      setStudents(studentsData);
      setSessions(sessionsData);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  function openSessionModal(cls) {
    setSelectedClass(cls);
    setSessionForm({
      startTime: cls.startTime,
      endTime: cls.endTime,
    });
    setShowSessionModal(true);
  }

  async function createSession(e) {
    e.preventDefault();
    
    try {
      const session = await sessionsApi.create({
        classId: selectedClass.id,
        date: selectedDate,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
      });
      
      // Create initial attendance records for all enrolled students
      const attendanceRecords = selectedClass.studentIds?.map(studentId => ({
        sessionId: session.id,
        studentId,
        status: 'present',
      })) || [];
      
      if (attendanceRecords.length > 0) {
        await attendanceApi.bulkCreate(attendanceRecords);
      }
      
      setShowSessionModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to create session:', err);
      alert('Failed to create session');
    }
  }

  async function updateAttendanceStatus(attendanceId, newStatus) {
    try {
      await attendanceApi.update(attendanceId, { status: newStatus });
      loadData();
    } catch (err) {
      console.error('Failed to update attendance:', err);
    }
  }

  async function deleteSession(sessionId) {
    if (!confirm('Delete this session and all attendance records?')) return;
    
    try {
      await sessionsApi.delete(sessionId);
      loadData();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
  const classMap = Object.fromEntries(classes.map(c => [c.id, c]));
  
  // Get sessions for selected date
  const todaysSessions = sessions.filter(s => s.date === selectedDate);
  
  // Classes that don't have a session yet for this date
  const dayOfWeek = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const scheduledClasses = classes.filter(c => c.dayOfWeek === dayOfWeek);
  const classesWithoutSession = scheduledClasses.filter(
    c => !todaysSessions.some(s => s.classId === c.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-navy-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-navy-900">
            Attendance
          </h1>
          <p className="text-navy-500 mt-1">
            Track attendance for each session
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            className="input w-auto"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Date Display */}
      <div className="card bg-gradient-to-r from-navy-800 to-navy-900 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-navy-300 text-sm">Selected Date</p>
            <p className="text-2xl font-semibold">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-navy-300 text-sm">Sessions Today</p>
            <p className="text-3xl font-bold text-amber-400">{todaysSessions.length}</p>
          </div>
        </div>
      </div>

      {/* Scheduled Classes Without Sessions */}
      {classesWithoutSession.length > 0 && (
        <div className="card border-2 border-dashed border-amber-300 bg-amber-50">
          <h3 className="font-semibold text-navy-900 mb-3">Start a Session</h3>
          <p className="text-navy-500 text-sm mb-4">
            These classes are scheduled for {dayOfWeek} but don't have a session logged yet:
          </p>
          <div className="flex flex-wrap gap-2">
            {classesWithoutSession.map((cls) => (
              <button
                key={cls.id}
                onClick={() => openSessionModal(cls)}
                className="btn-primary"
              >
                + {cls.name} ({cls.startTime})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sessions */}
      {todaysSessions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-lg text-navy-600">No sessions logged for this date</p>
          <p className="text-navy-400 text-sm">
            {scheduledClasses.length > 0 
              ? 'Click on a scheduled class above to start a session'
              : 'No classes are scheduled for this day'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaysSessions.map((session) => {
            const cls = classMap[session.classId];
            const sessionAttendance = attendance.filter(a => a.sessionId === session.id);
            
            return (
              <div key={session.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-navy-900 text-lg">
                      {cls?.name || 'Unknown Class'}
                    </h3>
                    <p className="text-navy-500">
                      {session.startTime} - {session.endTime} ({session.hoursWorked} hours)
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    Delete Session
                  </button>
                </div>
                
                {sessionAttendance.length === 0 ? (
                  <p className="text-navy-400">No students in this session</p>
                ) : (
                  <div className="space-y-2">
                    {sessionAttendance.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 bg-navy-50 rounded-lg"
                      >
                        <span className="font-medium text-navy-900">
                          {studentMap[att.studentId]?.name || 'Unknown'}
                        </span>
                        <div className="flex gap-2">
                          {['present', 'late', 'absent'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateAttendanceStatus(att.id, status)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                att.status === status
                                  ? status === 'present'
                                    ? 'bg-green-500 text-white'
                                    : status === 'late'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-red-500 text-white'
                                  : 'bg-navy-200 text-navy-600 hover:bg-navy-300'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">
              Start Session: {selectedClass.name}
            </h2>
            
            <form onSubmit={createSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    className="input"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    className="input"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Students to Include</label>
                <div className="bg-navy-50 rounded-lg p-3">
                  {selectedClass.studentIds?.length === 0 ? (
                    <p className="text-navy-400 text-sm">No students enrolled in this class</p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedClass.studentIds?.map(id => (
                        <li key={id} className="text-navy-700">
                          • {studentMap[id]?.name || 'Unknown'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Start Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

