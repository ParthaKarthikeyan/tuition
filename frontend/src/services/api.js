import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// UPDATE THESE with your Supabase project details
const SUPABASE_URL = 'https://qkpfntfuyvawlvbxcxor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcGZudGZ1eXZhd2x2YnhjeG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzI3ODUsImV4cCI6MjA4MjkwODc4NX0.r3ZVWtHNZT4dDgYMju-LzEJrGGUZW6Z3uqI81UxgJ7E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== Students API ====================
export const studentsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map(s => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      hourlyRate: parseFloat(s.hourly_rate),
      active: s.active,
      enrolledClasses: [],
      createdAt: s.created_at
    }));
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      hourlyRate: parseFloat(data.hourly_rate),
      active: data.active,
      createdAt: data.created_at
    };
  },

  create: async (student) => {
    const { data, error } = await supabase
      .from('students')
      .insert({
        name: student.name,
        phone: student.phone || '',
        email: student.email || '',
        hourly_rate: student.hourlyRate || 0,
        active: true
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...data, hourlyRate: parseFloat(data.hourly_rate) };
  },

  update: async (id, updates) => {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.hourlyRate !== undefined) updateData.hourly_rate = updates.hourlyRate;
    if (updates.active !== undefined) updateData.active = updates.active;

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...data, hourlyRate: parseFloat(data.hourly_rate) };
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Student deleted' };
  }
};

// ==================== Classes API ====================
export const classesApi = {
  getAll: async () => {
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .order('day_of_week');
    if (error) throw new Error(error.message);

    // Get enrolled students for each class
    const { data: enrollments } = await supabase
      .from('class_students')
      .select('class_id, student_id');

    return classes.map(c => ({
      id: c.id,
      name: c.name,
      dayOfWeek: c.day_of_week,
      startTime: c.start_time?.slice(0, 5),
      endTime: c.end_time?.slice(0, 5),
      studentIds: enrollments?.filter(e => e.class_id === c.id).map(e => e.student_id) || [],
      createdAt: c.created_at
    }));
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);

    const { data: enrollments } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', id);

    return {
      id: data.id,
      name: data.name,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time?.slice(0, 5),
      endTime: data.end_time?.slice(0, 5),
      studentIds: enrollments?.map(e => e.student_id) || []
    };
  },

  create: async (cls) => {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: cls.name,
        day_of_week: cls.dayOfWeek,
        start_time: cls.startTime,
        end_time: cls.endTime
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Add student enrollments
    if (cls.studentIds?.length > 0) {
      const enrollments = cls.studentIds.map(studentId => ({
        class_id: data.id,
        student_id: studentId
      }));
      await supabase.from('class_students').insert(enrollments);
    }

    return {
      id: data.id,
      name: data.name,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time?.slice(0, 5),
      endTime: data.end_time?.slice(0, 5),
      studentIds: cls.studentIds || []
    };
  },

  update: async (id, updates) => {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.dayOfWeek !== undefined) updateData.day_of_week = updates.dayOfWeek;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;

    const { data, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Update student enrollments if provided
    if (updates.studentIds !== undefined) {
      await supabase.from('class_students').delete().eq('class_id', id);
      if (updates.studentIds.length > 0) {
        const enrollments = updates.studentIds.map(studentId => ({
          class_id: id,
          student_id: studentId
        }));
        await supabase.from('class_students').insert(enrollments);
      }
    }

    return {
      id: data.id,
      name: data.name,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time?.slice(0, 5),
      endTime: data.end_time?.slice(0, 5),
      studentIds: updates.studentIds || []
    };
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Class deleted' };
  }
};

// ==================== Sessions API ====================
export const sessionsApi = {
  getAll: async (params = {}) => {
    let query = supabase.from('sessions').select('*');
    
    if (params.date) {
      query = query.eq('session_date', params.date);
    }
    if (params.class_id) {
      query = query.eq('class_id', params.class_id);
    }

    const { data, error } = await query.order('session_date', { ascending: false });
    if (error) throw new Error(error.message);

    return data.map(s => ({
      id: s.id,
      classId: s.class_id,
      date: s.session_date,
      startTime: s.start_time?.slice(0, 5),
      endTime: s.end_time?.slice(0, 5),
      hoursWorked: parseFloat(s.hours_worked),
      createdAt: s.created_at
    }));
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      classId: data.class_id,
      date: data.session_date,
      startTime: data.start_time?.slice(0, 5),
      endTime: data.end_time?.slice(0, 5),
      hoursWorked: parseFloat(data.hours_worked)
    };
  },

  create: async (session) => {
    // Calculate hours worked
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const hoursWorked = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        class_id: session.classId,
        session_date: session.date,
        start_time: session.startTime,
        end_time: session.endTime,
        hours_worked: hoursWorked.toFixed(2)
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      classId: data.class_id,
      date: data.session_date,
      startTime: data.start_time?.slice(0, 5),
      endTime: data.end_time?.slice(0, 5),
      hoursWorked: parseFloat(data.hours_worked)
    };
  },

  update: async (id, updates) => {
    const { data: current } = await supabase.from('sessions').select('*').eq('id', id).single();
    
    const startTime = updates.startTime || current.start_time;
    const endTime = updates.endTime || current.end_time;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const hoursWorked = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

    const { data, error } = await supabase
      .from('sessions')
      .update({
        start_time: startTime,
        end_time: endTime,
        hours_worked: hoursWorked.toFixed(2)
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      classId: data.class_id,
      date: data.session_date,
      startTime: data.start_time?.slice(0, 5),
      endTime: data.end_time?.slice(0, 5),
      hoursWorked: parseFloat(data.hours_worked)
    };
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Session deleted' };
  }
};

// ==================== Attendance API ====================
export const attendanceApi = {
  getAll: async (params = {}) => {
    let query = supabase.from('attendance').select('*');
    
    if (params.session_id) {
      query = query.eq('session_id', params.session_id);
    }
    if (params.student_id) {
      query = query.eq('student_id', params.student_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return data.map(a => ({
      id: a.id,
      sessionId: a.session_id,
      studentId: a.student_id,
      status: a.status,
      createdAt: a.created_at
    }));
  },

  create: async (attendance) => {
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        session_id: attendance.sessionId,
        student_id: attendance.studentId,
        status: attendance.status
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      sessionId: data.session_id,
      studentId: data.student_id,
      status: data.status
    };
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('attendance')
      .update({ status: updates.status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      sessionId: data.session_id,
      studentId: data.student_id,
      status: data.status
    };
  },

  bulkCreate: async (attendances) => {
    const records = attendances.map(a => ({
      session_id: a.sessionId,
      student_id: a.studentId,
      status: a.status
    }));

    const { data, error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'session_id,student_id' })
      .select();
    if (error) throw new Error(error.message);

    return data.map(a => ({
      id: a.id,
      sessionId: a.session_id,
      studentId: a.student_id,
      status: a.status
    }));
  }
};

// ==================== Payments API ====================
export const paymentsApi = {
  getAll: async (params = {}) => {
    let query = supabase.from('payments').select('*');
    
    if (params.student_id) {
      query = query.eq('student_id', params.student_id);
    }

    const { data, error } = await query.order('payment_date', { ascending: false });
    if (error) throw new Error(error.message);

    return data.map(p => ({
      id: p.id,
      studentId: p.student_id,
      amount: parseFloat(p.amount),
      date: p.payment_date,
      notes: p.notes,
      createdAt: p.created_at
    }));
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      studentId: data.student_id,
      amount: parseFloat(data.amount),
      date: data.payment_date,
      notes: data.notes
    };
  },

  create: async (payment) => {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        student_id: payment.studentId,
        amount: payment.amount,
        payment_date: payment.date,
        notes: payment.notes || ''
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      studentId: data.student_id,
      amount: parseFloat(data.amount),
      date: data.payment_date,
      notes: data.notes
    };
  },

  update: async (id, updates) => {
    const updateData = {};
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.date !== undefined) updateData.payment_date = updates.date;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      studentId: data.student_id,
      amount: parseFloat(data.amount),
      date: data.payment_date,
      notes: data.notes
    };
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Payment deleted' };
  }
};

// ==================== Reports API ====================
export const reportsApi = {
  getPayroll: async (startDate, endDate) => {
    // Get sessions in date range
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .gte('session_date', startDate)
      .lte('session_date', endDate);

    // Get attendance for these sessions
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .in('session_id', sessionIds)
      .in('status', ['present', 'late']);

    // Get students
    const { data: students } = await supabase.from('students').select('*');
    const studentMap = Object.fromEntries(students?.map(s => [s.id, s]) || []);

    // Calculate hours per student
    const studentHours = {};
    for (const att of attendance || []) {
      const session = sessions.find(s => s.id === att.session_id);
      if (session) {
        if (!studentHours[att.student_id]) studentHours[att.student_id] = 0;
        studentHours[att.student_id] += parseFloat(session.hours_worked);
      }
    }

    // Build report
    const report = [];
    let totalHours = 0;
    let totalEarnings = 0;

    for (const [studentId, hours] of Object.entries(studentHours)) {
      const student = studentMap[studentId];
      const rate = student ? parseFloat(student.hourly_rate) : 0;
      const earnings = hours * rate;
      report.push({
        studentId,
        studentName: student?.name || 'Unknown',
        hours,
        hourlyRate: rate,
        earnings
      });
      totalHours += hours;
      totalEarnings += earnings;
    }

    return {
      startDate,
      endDate,
      students: report,
      totalHours,
      totalEarnings
    };
  },

  getStudentBalance: async (studentId) => {
    // Get student
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (!student) throw new Error('Student not found');

    // Get all attendance for this student
    const { data: attendance } = await supabase
      .from('attendance')
      .select('session_id')
      .eq('student_id', studentId)
      .in('status', ['present', 'late']);

    // Get sessions for this attendance
    const sessionIds = attendance?.map(a => a.session_id) || [];
    const { data: sessions } = await supabase
      .from('sessions')
      .select('hours_worked')
      .in('id', sessionIds);

    const totalHours = sessions?.reduce((sum, s) => sum + parseFloat(s.hours_worked), 0) || 0;
    const totalDue = totalHours * parseFloat(student.hourly_rate);

    // Get payments
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('student_id', studentId);

    const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    return {
      studentId,
      studentName: student.name,
      hourlyRate: parseFloat(student.hourly_rate),
      totalHours,
      totalDue,
      totalPaid,
      balance: totalDue - totalPaid
    };
  }
};

// ==================== Dashboard API ====================
export const dashboardApi = {
  get: async () => {
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const monthStart = today.slice(0, 8) + '01';

    // Get counts
    const { data: students } = await supabase.from('students').select('id, active');
    const { data: classes } = await supabase.from('classes').select('*');
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .gte('session_date', monthStart);
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false })
      .limit(5);

    const activeStudents = students?.filter(s => s.active !== false).length || 0;
    const todaysClasses = classes?.filter(c => c.day_of_week === dayOfWeek).map(c => ({
      id: c.id,
      name: c.name,
      dayOfWeek: c.day_of_week,
      startTime: c.start_time?.slice(0, 5),
      endTime: c.end_time?.slice(0, 5)
    })) || [];
    const todaysSessions = sessions?.filter(s => s.session_date === today) || [];
    const totalHoursMonth = sessions?.reduce((sum, s) => sum + parseFloat(s.hours_worked), 0) || 0;

    return {
      today,
      dayOfWeek,
      activeStudents,
      totalClasses: classes?.length || 0,
      todaysClasses,
      todaysSessions,
      totalHoursMonth,
      recentPayments: payments?.map(p => ({
        id: p.id,
        studentId: p.student_id,
        amount: parseFloat(p.amount),
        date: p.payment_date,
        notes: p.notes
      })) || []
    };
  }
};
