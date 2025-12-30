import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, studentsApi } from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [dashboardData, studentsData] = await Promise.all([
        dashboardApi.get(),
        studentsApi.getAll()
      ]);
      setData(dashboardData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-navy-500">Loading...</div>
      </div>
    );
  }

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-semibold text-navy-900">
          Dashboard
        </h1>
        <p className="text-navy-500 mt-1">
          {data?.dayOfWeek}, {new Date(data?.today).toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Students"
          value={data?.activeStudents || 0}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Total Classes"
          value={data?.totalClasses || 0}
          icon="📚"
          color="purple"
        />
        <StatCard
          title="Today's Classes"
          value={data?.todaysClasses?.length || 0}
          icon="📅"
          color="amber"
        />
        <StatCard
          title="Hours This Month"
          value={data?.totalHoursMonth?.toFixed(1) || '0'}
          icon="⏱️"
          color="green"
        />
      </div>

      {/* Today's Schedule & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Today's Schedule</h2>
            <Link to="/classes" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          {data?.todaysClasses?.length === 0 ? (
            <div className="text-center py-8 text-navy-400">
              <p className="text-4xl mb-2">📭</p>
              <p>No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.todaysClasses?.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-4 bg-navy-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-navy-900">{cls.name}</p>
                    <p className="text-sm text-navy-500">
                      {cls.startTime} - {cls.endTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-navy-600">
                      {cls.studentIds?.length || 0} students
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Recent Payments</h2>
            <Link to="/payments" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          {data?.recentPayments?.length === 0 ? (
            <div className="text-center py-8 text-navy-400">
              <p className="text-4xl mb-2">💸</p>
              <p>No recent payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentPayments?.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-navy-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-navy-900">
                      {studentMap[payment.studentId]?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-navy-500">{payment.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${payment.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/students" className="btn-primary">
            + Add Student
          </Link>
          <Link to="/classes" className="btn-secondary">
            + New Class
          </Link>
          <Link to="/attendance" className="btn-outline">
            Mark Attendance
          </Link>
          <Link to="/payments" className="btn-outline">
            Record Payment
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-navy-500">{title}</p>
          <p className="text-3xl font-semibold text-navy-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

