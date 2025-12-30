import { useState, useEffect } from 'react';
import { studentsApi } from '../services/api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    hourlyRate: '',
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
    } finally {
      setLoading(false);
    }
  }

  function openModal(student = null) {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        phone: student.phone || '',
        email: student.email || '',
        hourlyRate: student.hourlyRate?.toString() || '',
      });
    } else {
      setEditingStudent(null);
      setFormData({ name: '', phone: '', email: '', hourlyRate: '' });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({ name: '', phone: '', email: '', hourlyRate: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const payload = {
      ...formData,
      hourlyRate: parseFloat(formData.hourlyRate) || 0,
    };

    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, payload);
      } else {
        await studentsApi.create(payload);
      }
      closeModal();
      loadStudents();
    } catch (err) {
      console.error('Failed to save student:', err);
      alert('Failed to save student');
    }
  }

  async function handleDelete(student) {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;
    
    try {
      await studentsApi.delete(student.id);
      loadStudents();
    } catch (err) {
      console.error('Failed to delete student:', err);
      alert('Failed to delete student');
    }
  }

  async function toggleActive(student) {
    try {
      await studentsApi.update(student.id, { active: !student.active });
      loadStudents();
    } catch (err) {
      console.error('Failed to update student:', err);
    }
  }

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
            Students
          </h1>
          <p className="text-navy-500 mt-1">
            Manage your students and their hourly rates
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          + Add Student
        </button>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden p-0">
        {students.length === 0 ? (
          <div className="text-center py-12 text-navy-400">
            <p className="text-5xl mb-3">👥</p>
            <p className="text-lg">No students yet</p>
            <p className="text-sm">Add your first student to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Hourly Rate</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-navy-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-navy-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-navy-600">{student.phone || '-'}</div>
                    <div className="text-sm text-navy-400">{student.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-navy-900">
                      ${student.hourlyRate?.toFixed(2) || '0.00'}/hr
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(student)}
                      className={`badge ${student.active !== false ? 'badge-success' : 'badge-danger'}`}
                    >
                      {student.active !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(student)}
                      className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
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
              {editingStudent ? 'Edit Student' : 'Add Student'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Hourly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingStudent ? 'Save Changes' : 'Add Student'}
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

