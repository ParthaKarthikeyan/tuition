from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import json
import os
import uuid

app = FastAPI(title="Tuition Tracker API")

# CORS middleware for React frontend
# Update GITHUB_PAGES_URL with your actual GitHub Pages URL after deployment
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001",
    # GitHub Pages - UPDATE THIS with your username!
    "https://YOUR_GITHUB_USERNAME.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory path - works both locally and on PythonAnywhere
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# ==================== Utility Functions ====================

# Default empty data structures
DEFAULT_DATA = {
    "students.json": {"students": []},
    "classes.json": {"classes": []},
    "sessions.json": {"sessions": []},
    "attendance.json": {"attendance": []},
    "payments.json": {"payments": []},
}

def read_json(filename: str) -> dict:
    filepath = os.path.join(DATA_DIR, filename)
    # Create file with default data if it doesn't exist
    if not os.path.exists(filepath):
        default = DEFAULT_DATA.get(filename, {})
        with open(filepath, "w") as f:
            json.dump(default, f, indent=2)
        return default
    with open(filepath, "r") as f:
        return json.load(f)

def write_json(filename: str, data: dict):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, default=str)

def generate_id() -> str:
    return str(uuid.uuid4())[:8]

# ==================== Pydantic Models ====================

class StudentCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    hourlyRate: float = 0.0

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hourlyRate: Optional[float] = None
    active: Optional[bool] = None
    enrolledClasses: Optional[List[str]] = None

class ClassCreate(BaseModel):
    name: str
    dayOfWeek: str
    startTime: str
    endTime: str
    studentIds: Optional[List[str]] = []

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    dayOfWeek: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    studentIds: Optional[List[str]] = None

class SessionCreate(BaseModel):
    classId: str
    date: str
    startTime: str
    endTime: str

class SessionUpdate(BaseModel):
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    hoursWorked: Optional[float] = None

class AttendanceCreate(BaseModel):
    sessionId: str
    studentId: str
    status: str  # "present", "absent", "late"

class AttendanceUpdate(BaseModel):
    status: str

class PaymentCreate(BaseModel):
    studentId: str
    amount: float
    date: str
    notes: Optional[str] = ""

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    date: Optional[str] = None
    notes: Optional[str] = None

# ==================== Student Routes ====================

@app.get("/api/students")
def get_students():
    data = read_json("students.json")
    return data["students"]

@app.get("/api/students/{student_id}")
def get_student(student_id: str):
    data = read_json("students.json")
    for student in data["students"]:
        if student["id"] == student_id:
            return student
    raise HTTPException(status_code=404, detail="Student not found")

@app.post("/api/students")
def create_student(student: StudentCreate):
    data = read_json("students.json")
    new_student = {
        "id": generate_id(),
        "name": student.name,
        "phone": student.phone,
        "email": student.email,
        "hourlyRate": student.hourlyRate,
        "active": True,
        "enrolledClasses": [],
        "createdAt": datetime.now().isoformat()
    }
    data["students"].append(new_student)
    write_json("students.json", data)
    return new_student

@app.put("/api/students/{student_id}")
def update_student(student_id: str, student: StudentUpdate):
    data = read_json("students.json")
    for i, s in enumerate(data["students"]):
        if s["id"] == student_id:
            update_data = student.model_dump(exclude_unset=True)
            data["students"][i].update(update_data)
            write_json("students.json", data)
            return data["students"][i]
    raise HTTPException(status_code=404, detail="Student not found")

@app.delete("/api/students/{student_id}")
def delete_student(student_id: str):
    data = read_json("students.json")
    for i, s in enumerate(data["students"]):
        if s["id"] == student_id:
            deleted = data["students"].pop(i)
            write_json("students.json", data)
            return {"message": "Student deleted", "student": deleted}
    raise HTTPException(status_code=404, detail="Student not found")

# ==================== Class Routes ====================

@app.get("/api/classes")
def get_classes():
    data = read_json("classes.json")
    return data["classes"]

@app.get("/api/classes/{class_id}")
def get_class(class_id: str):
    data = read_json("classes.json")
    for cls in data["classes"]:
        if cls["id"] == class_id:
            return cls
    raise HTTPException(status_code=404, detail="Class not found")

@app.post("/api/classes")
def create_class(cls: ClassCreate):
    data = read_json("classes.json")
    new_class = {
        "id": generate_id(),
        "name": cls.name,
        "dayOfWeek": cls.dayOfWeek,
        "startTime": cls.startTime,
        "endTime": cls.endTime,
        "studentIds": cls.studentIds or [],
        "createdAt": datetime.now().isoformat()
    }
    data["classes"].append(new_class)
    write_json("classes.json", data)
    
    # Update enrolled classes for each student
    if cls.studentIds:
        students_data = read_json("students.json")
        for student in students_data["students"]:
            if student["id"] in cls.studentIds:
                if new_class["id"] not in student["enrolledClasses"]:
                    student["enrolledClasses"].append(new_class["id"])
        write_json("students.json", students_data)
    
    return new_class

@app.put("/api/classes/{class_id}")
def update_class(class_id: str, cls: ClassUpdate):
    data = read_json("classes.json")
    for i, c in enumerate(data["classes"]):
        if c["id"] == class_id:
            update_data = cls.model_dump(exclude_unset=True)
            data["classes"][i].update(update_data)
            write_json("classes.json", data)
            return data["classes"][i]
    raise HTTPException(status_code=404, detail="Class not found")

@app.delete("/api/classes/{class_id}")
def delete_class(class_id: str):
    data = read_json("classes.json")
    for i, c in enumerate(data["classes"]):
        if c["id"] == class_id:
            deleted = data["classes"].pop(i)
            write_json("classes.json", data)
            return {"message": "Class deleted", "class": deleted}
    raise HTTPException(status_code=404, detail="Class not found")

# ==================== Session Routes ====================

@app.get("/api/sessions")
def get_sessions(date: Optional[str] = None, class_id: Optional[str] = None):
    data = read_json("sessions.json")
    sessions = data["sessions"]
    
    if date:
        sessions = [s for s in sessions if s["date"] == date]
    if class_id:
        sessions = [s for s in sessions if s["classId"] == class_id]
    
    return sessions

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    data = read_json("sessions.json")
    for session in data["sessions"]:
        if session["id"] == session_id:
            return session
    raise HTTPException(status_code=404, detail="Session not found")

@app.post("/api/sessions")
def create_session(session: SessionCreate):
    data = read_json("sessions.json")
    
    # Calculate hours worked
    start = datetime.strptime(session.startTime, "%H:%M")
    end = datetime.strptime(session.endTime, "%H:%M")
    hours_worked = round((end - start).seconds / 3600, 2)
    
    new_session = {
        "id": generate_id(),
        "classId": session.classId,
        "date": session.date,
        "startTime": session.startTime,
        "endTime": session.endTime,
        "hoursWorked": hours_worked,
        "createdAt": datetime.now().isoformat()
    }
    data["sessions"].append(new_session)
    write_json("sessions.json", data)
    return new_session

@app.put("/api/sessions/{session_id}")
def update_session(session_id: str, session: SessionUpdate):
    data = read_json("sessions.json")
    for i, s in enumerate(data["sessions"]):
        if s["id"] == session_id:
            update_data = session.model_dump(exclude_unset=True)
            
            # Recalculate hours if times changed
            start_time = update_data.get("startTime", s["startTime"])
            end_time = update_data.get("endTime", s["endTime"])
            start = datetime.strptime(start_time, "%H:%M")
            end = datetime.strptime(end_time, "%H:%M")
            update_data["hoursWorked"] = round((end - start).seconds / 3600, 2)
            
            data["sessions"][i].update(update_data)
            write_json("sessions.json", data)
            return data["sessions"][i]
    raise HTTPException(status_code=404, detail="Session not found")

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    data = read_json("sessions.json")
    for i, s in enumerate(data["sessions"]):
        if s["id"] == session_id:
            deleted = data["sessions"].pop(i)
            write_json("sessions.json", data)
            
            # Also delete related attendance records
            att_data = read_json("attendance.json")
            att_data["attendance"] = [a for a in att_data["attendance"] if a["sessionId"] != session_id]
            write_json("attendance.json", att_data)
            
            return {"message": "Session deleted", "session": deleted}
    raise HTTPException(status_code=404, detail="Session not found")

# ==================== Attendance Routes ====================

@app.get("/api/attendance")
def get_attendance(session_id: Optional[str] = None, student_id: Optional[str] = None):
    data = read_json("attendance.json")
    attendance = data["attendance"]
    
    if session_id:
        attendance = [a for a in attendance if a["sessionId"] == session_id]
    if student_id:
        attendance = [a for a in attendance if a["studentId"] == student_id]
    
    return attendance

@app.post("/api/attendance")
def create_attendance(attendance: AttendanceCreate):
    data = read_json("attendance.json")
    
    # Check if attendance already exists for this session/student
    for a in data["attendance"]:
        if a["sessionId"] == attendance.sessionId and a["studentId"] == attendance.studentId:
            raise HTTPException(status_code=400, detail="Attendance already recorded")
    
    new_attendance = {
        "id": generate_id(),
        "sessionId": attendance.sessionId,
        "studentId": attendance.studentId,
        "status": attendance.status,
        "createdAt": datetime.now().isoformat()
    }
    data["attendance"].append(new_attendance)
    write_json("attendance.json", data)
    return new_attendance

@app.put("/api/attendance/{attendance_id}")
def update_attendance(attendance_id: str, attendance: AttendanceUpdate):
    data = read_json("attendance.json")
    for i, a in enumerate(data["attendance"]):
        if a["id"] == attendance_id:
            data["attendance"][i]["status"] = attendance.status
            write_json("attendance.json", data)
            return data["attendance"][i]
    raise HTTPException(status_code=404, detail="Attendance not found")

@app.post("/api/attendance/bulk")
def bulk_create_attendance(attendances: List[AttendanceCreate]):
    data = read_json("attendance.json")
    created = []
    
    for attendance in attendances:
        # Skip if already exists
        exists = any(
            a["sessionId"] == attendance.sessionId and a["studentId"] == attendance.studentId
            for a in data["attendance"]
        )
        if exists:
            continue
            
        new_attendance = {
            "id": generate_id(),
            "sessionId": attendance.sessionId,
            "studentId": attendance.studentId,
            "status": attendance.status,
            "createdAt": datetime.now().isoformat()
        }
        data["attendance"].append(new_attendance)
        created.append(new_attendance)
    
    write_json("attendance.json", data)
    return created

# ==================== Payment Routes ====================

@app.get("/api/payments")
def get_payments(student_id: Optional[str] = None):
    data = read_json("payments.json")
    payments = data["payments"]
    
    if student_id:
        payments = [p for p in payments if p["studentId"] == student_id]
    
    return payments

@app.get("/api/payments/{payment_id}")
def get_payment(payment_id: str):
    data = read_json("payments.json")
    for payment in data["payments"]:
        if payment["id"] == payment_id:
            return payment
    raise HTTPException(status_code=404, detail="Payment not found")

@app.post("/api/payments")
def create_payment(payment: PaymentCreate):
    data = read_json("payments.json")
    new_payment = {
        "id": generate_id(),
        "studentId": payment.studentId,
        "amount": payment.amount,
        "date": payment.date,
        "notes": payment.notes,
        "createdAt": datetime.now().isoformat()
    }
    data["payments"].append(new_payment)
    write_json("payments.json", data)
    return new_payment

@app.put("/api/payments/{payment_id}")
def update_payment(payment_id: str, payment: PaymentUpdate):
    data = read_json("payments.json")
    for i, p in enumerate(data["payments"]):
        if p["id"] == payment_id:
            update_data = payment.model_dump(exclude_unset=True)
            data["payments"][i].update(update_data)
            write_json("payments.json", data)
            return data["payments"][i]
    raise HTTPException(status_code=404, detail="Payment not found")

@app.delete("/api/payments/{payment_id}")
def delete_payment(payment_id: str):
    data = read_json("payments.json")
    for i, p in enumerate(data["payments"]):
        if p["id"] == payment_id:
            deleted = data["payments"].pop(i)
            write_json("payments.json", data)
            return {"message": "Payment deleted", "payment": deleted}
    raise HTTPException(status_code=404, detail="Payment not found")

# ==================== Reports/Dashboard Routes ====================

@app.get("/api/reports/payroll")
def get_payroll_report(start_date: str, end_date: str):
    """Calculate payroll for a date range"""
    sessions_data = read_json("sessions.json")
    attendance_data = read_json("attendance.json")
    students_data = read_json("students.json")
    classes_data = read_json("classes.json")
    
    # Filter sessions by date range
    sessions = [
        s for s in sessions_data["sessions"]
        if start_date <= s["date"] <= end_date
    ]
    
    # Create a map of student hourly rates
    student_rates = {s["id"]: s["hourlyRate"] for s in students_data["students"]}
    student_names = {s["id"]: s["name"] for s in students_data["students"]}
    
    # Calculate earnings per student
    student_hours = {}
    for session in sessions:
        session_attendance = [
            a for a in attendance_data["attendance"]
            if a["sessionId"] == session["id"] and a["status"] in ["present", "late"]
        ]
        for att in session_attendance:
            student_id = att["studentId"]
            if student_id not in student_hours:
                student_hours[student_id] = 0
            student_hours[student_id] += session["hoursWorked"]
    
    # Calculate total earnings
    report = []
    total_hours = 0
    total_earnings = 0
    
    for student_id, hours in student_hours.items():
        rate = student_rates.get(student_id, 0)
        earnings = hours * rate
        report.append({
            "studentId": student_id,
            "studentName": student_names.get(student_id, "Unknown"),
            "hours": hours,
            "hourlyRate": rate,
            "earnings": earnings
        })
        total_hours += hours
        total_earnings += earnings
    
    return {
        "startDate": start_date,
        "endDate": end_date,
        "students": report,
        "totalHours": total_hours,
        "totalEarnings": total_earnings
    }

@app.get("/api/reports/student-balance/{student_id}")
def get_student_balance(student_id: str):
    """Get balance for a specific student"""
    sessions_data = read_json("sessions.json")
    attendance_data = read_json("attendance.json")
    payments_data = read_json("payments.json")
    students_data = read_json("students.json")
    
    # Get student info
    student = None
    for s in students_data["students"]:
        if s["id"] == student_id:
            student = s
            break
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Calculate total hours attended
    total_hours = 0
    for session in sessions_data["sessions"]:
        attendance = next(
            (a for a in attendance_data["attendance"]
             if a["sessionId"] == session["id"] and a["studentId"] == student_id and a["status"] in ["present", "late"]),
            None
        )
        if attendance:
            total_hours += session["hoursWorked"]
    
    # Calculate total due
    total_due = total_hours * student["hourlyRate"]
    
    # Calculate total paid
    total_paid = sum(
        p["amount"] for p in payments_data["payments"]
        if p["studentId"] == student_id
    )
    
    return {
        "studentId": student_id,
        "studentName": student["name"],
        "hourlyRate": student["hourlyRate"],
        "totalHours": total_hours,
        "totalDue": total_due,
        "totalPaid": total_paid,
        "balance": total_due - total_paid
    }

@app.get("/api/dashboard")
def get_dashboard():
    """Get dashboard summary data"""
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    day_of_week = datetime.now().strftime("%A")
    
    students_data = read_json("students.json")
    classes_data = read_json("classes.json")
    sessions_data = read_json("sessions.json")
    payments_data = read_json("payments.json")
    
    # Active students count
    active_students = len([s for s in students_data["students"] if s.get("active", True)])
    
    # Today's classes
    todays_classes = [c for c in classes_data["classes"] if c["dayOfWeek"] == day_of_week]
    
    # Today's sessions
    todays_sessions = [s for s in sessions_data["sessions"] if s["date"] == today]
    
    # Total hours this month
    month_start = today[:8] + "01"
    month_sessions = [s for s in sessions_data["sessions"] if s["date"] >= month_start]
    total_hours_month = sum(s["hoursWorked"] for s in month_sessions)
    
    # Recent payments
    recent_payments = sorted(payments_data["payments"], key=lambda x: x["date"], reverse=True)[:5]
    
    return {
        "today": today,
        "dayOfWeek": day_of_week,
        "activeStudents": active_students,
        "totalClasses": len(classes_data["classes"]),
        "todaysClasses": todays_classes,
        "todaysSessions": todays_sessions,
        "totalHoursMonth": total_hours_month,
        "recentPayments": recent_payments
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

