import { useState, useEffect } from 'react';
import { classesApi, studentsApi } from '../services/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    studentIds: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [classesData, studentsData] = await Promise.all([
        classesApi.getAll(),
        studentsApi.getAll()
      ]);
      setClasses(classesData);
      setStudents(studentsData.filter(s => s.active !== false));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  function openModal(cls = null) {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        name: cls.name,
        dayOfWeek: cls.dayOfWeek,
        startTime: cls.startTime,
        endTime: cls.endTime,
        studentIds: cls.studentIds || [],
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: '',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        studentIds: [],
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingClass(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      if (editingClass) {
        await classesApi.update(editingClass.id, formData);
      } else {
        await classesApi.create(formData);
      }
      closeModal();
      loadData();
    } catch (err) {
      console.error('Failed to save class:', err);
      alert('Failed to save class');
    }
  }

  async function handleDelete(cls) {
    if (!confirm(`Are you sure you want to delete ${cls.name}?`)) return;
    
    try {
      await classesApi.delete(cls.id);
      loadData();
    } catch (err) {
      console.error('Failed to delete class:', err);
      alert('Failed to delete class');
    }
  }

  function toggleStudent(studentId) {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
    }));
  }

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-navy-500">Loading...</div>
      </div>
    );
  }

  // Group classes by day
  const classesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = classes.filter(c => c.dayOfWeek === day);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-navy-900">
            Classes
          </h1>
          <p className="text-navy-500 mt-1">
            Schedule and manage your weekly classes
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          + New Class
        </button>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="card">
            <h3 className="font-semibold text-navy-900 mb-3">{day}</h3>
            {classesByDay[day].length === 0 ? (
              <p className="text-navy-400 text-sm">No classes scheduled</p>
            ) : (
              <div className="space-y-2">
                {classesByDay[day].map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-4 bg-navy-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-navy-900">{cls.name}</span>
                        <span className="text-navy-500">
                          {cls.startTime} - {cls.endTime}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cls.studentIds?.length === 0 ? (
                          <span className="text-sm text-navy-400">No students assigned</span>
                        ) : (
                          cls.studentIds?.map((id) => (
                            <span key={id} className="badge bg-navy-200 text-navy-700">
                              {studentMap[id]?.name || 'Unknown'}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openModal(cls)}
                        className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls)}
                        className="text-red-500 hover:text-red-600 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">
              {editingClass ? 'Edit Class' : 'New Class'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Class Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Algebra Basics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="label">Day of Week *</label>
                <select
                  className="input"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time *</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">End Time *</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Enrolled Students</label>
                <div className="border border-navy-200 rounded-lg max-h-48 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="p-4 text-navy-400 text-sm">No students available</p>
                  ) : (
                    students.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-3 p-3 hover:bg-navy-50 cursor-pointer border-b border-navy-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={formData.studentIds.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 text-amber-500 rounded"
                        />
                        <span className="text-navy-700">{student.name}</span>
                        <span className="text-navy-400 text-sm ml-auto">
                          ${student.hourlyRate}/hr
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingClass ? 'Save Changes' : 'Create Class'}
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

