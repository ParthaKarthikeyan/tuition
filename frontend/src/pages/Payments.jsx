import { useState, useEffect } from 'react';
import { paymentsApi, studentsApi, reportsApi } from '../services/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [paymentsData, studentsData] = await Promise.all([
        paymentsApi.getAll(),
        studentsApi.getAll()
      ]);
      setPayments(paymentsData);
      setStudents(studentsData.filter(s => s.active !== false));
      
      // Load balances for all students
      const balancePromises = studentsData
        .filter(s => s.active !== false)
        .map(s => reportsApi.getStudentBalance(s.id).catch(() => null));
      const balanceResults = await Promise.all(balancePromises);
      
      const balanceMap = {};
      balanceResults.forEach(b => {
        if (b) balanceMap[b.studentId] = b;
      });
      setBalances(balanceMap);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  function openModal(payment = null, studentId = null) {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        studentId: payment.studentId,
        amount: payment.amount.toString(),
        date: payment.date,
        notes: payment.notes || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        studentId: studentId || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPayment(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    try {
      if (editingPayment) {
        await paymentsApi.update(editingPayment.id, payload);
      } else {
        await paymentsApi.create(payload);
      }
      closeModal();
      loadData();
    } catch (err) {
      console.error('Failed to save payment:', err);
      alert('Failed to save payment');
    }
  }

  async function handleDelete(payment) {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    
    try {
      await paymentsApi.delete(payment.id);
      loadData();
    } catch (err) {
      console.error('Failed to delete payment:', err);
      alert('Failed to delete payment');
    }
  }

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  // Sort payments by date descending
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Calculate total outstanding balance
  const totalOutstanding = Object.values(balances).reduce(
    (sum, b) => sum + Math.max(0, b.balance), 0
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
            Payments
          </h1>
          <p className="text-navy-500 mt-1">
            Track payments and outstanding balances
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          + Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-navy-500">Total Received</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-navy-500">Outstanding Balance</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            ${totalOutstanding.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-navy-500">Total Payments</p>
          <p className="text-3xl font-bold text-navy-900 mt-1">
            {payments.length}
          </p>
        </div>
      </div>

      {/* Student Balances */}
      <div className="card">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Student Balances</h2>
        
        {students.length === 0 ? (
          <p className="text-navy-400">No students yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => {
              const balance = balances[student.id];
              const outstanding = balance?.balance || 0;
              
              return (
                <div
                  key={student.id}
                  className={`p-4 rounded-lg border-2 ${
                    outstanding > 0
                      ? 'border-amber-200 bg-amber-50'
                      : outstanding < 0
                      ? 'border-green-200 bg-green-50'
                      : 'border-navy-100 bg-navy-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-navy-900">{student.name}</span>
                    {outstanding > 0 && (
                      <button
                        onClick={() => openModal(null, student.id)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                      >
                        + Pay
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-navy-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Hours:</span>
                      <span>{balance?.totalHours?.toFixed(1) || 0} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Due:</span>
                      <span>${balance?.totalDue?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span className="text-green-600">${balance?.totalPaid?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-navy-200 pt-1 mt-1">
                      <span>Balance:</span>
                      <span className={outstanding > 0 ? 'text-amber-600' : outstanding < 0 ? 'text-green-600' : ''}>
                        {outstanding > 0 ? '+' : ''}${outstanding.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-navy-100">
          <h2 className="text-lg font-semibold text-navy-900">Payment History</h2>
        </div>
        
        {sortedPayments.length === 0 ? (
          <div className="text-center py-12 text-navy-400">
            <p className="text-5xl mb-3">💳</p>
            <p>No payments recorded yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Student</th>
                <th className="px-6 py-4 text-left">Notes</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {sortedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-navy-50">
                  <td className="px-6 py-4 text-navy-600">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-navy-900">
                    {studentMap[payment.studentId]?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-navy-500">
                    {payment.notes || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(payment)}
                      className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(payment)}
                      className="text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">
              {editingPayment ? 'Edit Payment' : 'Record Payment'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Student *</label>
                <select
                  className="input"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                      {balances[student.id]?.balance > 0 && 
                        ` (Owes: $${balances[student.id].balance.toFixed(2)})`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingPayment ? 'Save Changes' : 'Record Payment'}
                </button>
                <button type="button" onClick={closeModal} className="btn-outline">
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

