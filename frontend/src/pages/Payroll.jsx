import { useState, useEffect } from 'react';
import { reportsApi, studentsApi } from '../services/api';

export default function Payroll() {
  const [report, setReport] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await studentsApi.getAll();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  }

  async function generateReport() {
    setLoading(true);
    try {
      const data = await reportsApi.getPayroll(dateRange.startDate, dateRange.endDate);
      setReport(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  // Quick date range presets
  function setPreset(preset) {
    const today = new Date();
    let start, end;

    switch (preset) {
      case 'thisWeek':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = today;
        break;
      case 'lastWeek':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay() - 7);
        end = new Date(today);
        end.setDate(today.getDate() - today.getDay() - 1);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-semibold text-navy-900">
          Payroll Report
        </h1>
        <p className="text-navy-500 mt-1">
          Calculate earnings based on attendance and hourly rates
        </p>
      </div>

      {/* Date Range Selection */}
      <div className="card">
        <h3 className="font-semibold text-navy-900 mb-4">Select Date Range</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setPreset('thisWeek')} className="btn-outline text-sm">
            This Week
          </button>
          <button onClick={() => setPreset('lastWeek')} className="btn-outline text-sm">
            Last Week
          </button>
          <button onClick={() => setPreset('thisMonth')} className="btn-outline text-sm">
            This Month
          </button>
          <button onClick={() => setPreset('lastMonth')} className="btn-outline text-sm">
            Last Month
          </button>
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-gradient-to-br from-navy-800 to-navy-900 text-white">
              <p className="text-navy-300 text-sm">Total Hours</p>
              <p className="text-4xl font-bold mt-2">{report.totalHours.toFixed(1)}</p>
              <p className="text-navy-400 text-sm mt-1">hours worked</p>
            </div>
            <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <p className="text-amber-100 text-sm">Total Earnings</p>
              <p className="text-4xl font-bold mt-2">${report.totalEarnings.toFixed(2)}</p>
              <p className="text-amber-200 text-sm mt-1">gross revenue</p>
            </div>
            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <p className="text-green-100 text-sm">Students Taught</p>
              <p className="text-4xl font-bold mt-2">{report.students.length}</p>
              <p className="text-green-200 text-sm mt-1">in this period</p>
            </div>
          </div>

          {/* Date Range Display */}
          <div className="text-center text-navy-500">
            Report period: {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
          </div>

          {/* Breakdown Table */}
          <div className="card overflow-hidden p-0">
            <div className="p-4 border-b border-navy-100">
              <h3 className="font-semibold text-navy-900">Earnings Breakdown by Student</h3>
            </div>
            
            {report.students.length === 0 ? (
              <div className="text-center py-12 text-navy-400">
                <p className="text-5xl mb-3">📊</p>
                <p>No sessions recorded in this period</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-right">Hours</th>
                    <th className="px-6 py-4 text-right">Rate</th>
                    <th className="px-6 py-4 text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {report.students.map((item) => (
                    <tr key={item.studentId} className="hover:bg-navy-50">
                      <td className="px-6 py-4 font-medium text-navy-900">
                        {item.studentName}
                      </td>
                      <td className="px-6 py-4 text-right text-navy-600">
                        {item.hours.toFixed(1)} hrs
                      </td>
                      <td className="px-6 py-4 text-right text-navy-600">
                        ${item.hourlyRate.toFixed(2)}/hr
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">
                        ${item.earnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-navy-50 font-semibold">
                    <td className="px-6 py-4 text-navy-900">Total</td>
                    <td className="px-6 py-4 text-right text-navy-900">
                      {report.totalHours.toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4 text-right text-navy-600">-</td>
                    <td className="px-6 py-4 text-right text-green-600">
                      ${report.totalEarnings.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}

      {/* Initial State */}
      {!report && !loading && (
        <div className="card text-center py-12">
          <p className="text-5xl mb-3">📈</p>
          <p className="text-lg text-navy-600">Select a date range and generate your report</p>
          <p className="text-navy-400 text-sm mt-1">
            The report will show earnings based on attended sessions
          </p>
        </div>
      )}
    </div>
  );
}

