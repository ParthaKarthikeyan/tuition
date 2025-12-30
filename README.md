# Tuition Tracker

A web application for tracking Math class attendance, hours, and calculating payroll.

## Features

- **Dashboard** - Overview of today's classes, pending payments, and quick stats
- **Student Management** - Add, edit, delete students with contact info and hourly rates
- **Class Scheduling** - Create recurring classes, assign students by day of week
- **Attendance Tracking** - Mark students present/absent/late per session
- **Hours Logging** - Record actual start/end times, auto-calculate hours worked
- **Payroll Reports** - Calculate earnings by date range with detailed breakdown
- **Payment Tracking** - Log payments received, track outstanding balances

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Python FastAPI
- **Storage**: JSON files (simple, human-readable, easy to backup)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The API will run at http://localhost:8001

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will run at http://localhost:3000

## Data Storage

All data is stored in JSON files in `backend/data/`:

- `students.json` - Student records
- `classes.json` - Class schedules
- `sessions.json` - Actual class sessions
- `attendance.json` - Attendance records
- `payments.json` - Payment history

To backup your data, simply copy the `data` folder.

## API Endpoints

- `GET/POST /api/students` - Student management
- `GET/POST /api/classes` - Class management
- `GET/POST /api/sessions` - Session management
- `GET/POST /api/attendance` - Attendance tracking
- `GET/POST /api/payments` - Payment tracking
- `GET /api/dashboard` - Dashboard summary
- `GET /api/reports/payroll` - Payroll report
- `GET /api/reports/student-balance/{id}` - Student balance

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for a complete guide to deploy this app for **free** using:
- **GitHub Pages** (frontend)
- **PythonAnywhere** (backend)

