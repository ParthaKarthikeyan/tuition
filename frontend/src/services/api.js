// API Base URL - uses environment variable in production, proxy in development
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }
  
  return response.json();
}

// Students API
export const studentsApi = {
  getAll: () => fetchJson(`${API_BASE}/students`),
  getById: (id) => fetchJson(`${API_BASE}/students/${id}`),
  create: (data) => fetchJson(`${API_BASE}/students`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchJson(`${API_BASE}/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchJson(`${API_BASE}/students/${id}`, {
    method: 'DELETE',
  }),
};

// Classes API
export const classesApi = {
  getAll: () => fetchJson(`${API_BASE}/classes`),
  getById: (id) => fetchJson(`${API_BASE}/classes/${id}`),
  create: (data) => fetchJson(`${API_BASE}/classes`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchJson(`${API_BASE}/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchJson(`${API_BASE}/classes/${id}`, {
    method: 'DELETE',
  }),
};

// Sessions API
export const sessionsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`${API_BASE}/sessions${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchJson(`${API_BASE}/sessions/${id}`),
  create: (data) => fetchJson(`${API_BASE}/sessions`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchJson(`${API_BASE}/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchJson(`${API_BASE}/sessions/${id}`, {
    method: 'DELETE',
  }),
};

// Attendance API
export const attendanceApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`${API_BASE}/attendance${query ? `?${query}` : ''}`);
  },
  create: (data) => fetchJson(`${API_BASE}/attendance`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchJson(`${API_BASE}/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  bulkCreate: (data) => fetchJson(`${API_BASE}/attendance/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Payments API
export const paymentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`${API_BASE}/payments${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchJson(`${API_BASE}/payments/${id}`),
  create: (data) => fetchJson(`${API_BASE}/payments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchJson(`${API_BASE}/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchJson(`${API_BASE}/payments/${id}`, {
    method: 'DELETE',
  }),
};

// Reports API
export const reportsApi = {
  getPayroll: (startDate, endDate) => 
    fetchJson(`${API_BASE}/reports/payroll?start_date=${startDate}&end_date=${endDate}`),
  getStudentBalance: (studentId) => 
    fetchJson(`${API_BASE}/reports/student-balance/${studentId}`),
};

// Dashboard API
export const dashboardApi = {
  get: () => fetchJson(`${API_BASE}/dashboard`),
};
