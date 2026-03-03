# Student Marks Portal

A full-stack web application for managing student academic marks with separate student and admin roles.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express |
| Database | MySQL (mysql2) |
| Auth | JWT + bcryptjs |
| File Upload | Multer + csv-parse |

---

## Project Structure

```
Marko/
├── marks-portal-backend/     ← Express API
│   ├── index.js              ← Entry point (auto-creates tables + seeds admin)
│   ├── schema.sql            ← SQL schema reference
│   ├── .env                  ← Your environment variables
│   ├── .env.example          ← Template
│   └── src/
│       ├── db.js             ← MySQL connection pool
│       ├── middleware/
│       │   ├── auth.js       ← JWT verify + requireAdmin
│       │   └── errorHandler.js
│       └── routes/
│           ├── auth.js       ← /api/auth/*
│           └── marks.js      ← /api/marks/*
│
└── marks-portal-frontend/    ← Vite + React
    └── src/
        ├── App.jsx           ← Routes
        ├── contexts/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js        ← Axios + all API calls
        └── components/
            ├── Login.jsx
            ├── StudentDashboard.jsx
            ├── AdminDashboard.jsx
            ├── MarksTable.jsx
            ├── MarkModal.jsx
            ├── CSVUpload.jsx
            ├── ChangePasswordModal.jsx
            └── ProtectedRoute.jsx
```

---

## Prerequisites

- **Node.js** v18+
- **MySQL** installed and running locally
- A MySQL user with CREATE DATABASE privileges (default: `root` with no password)

---

## Setup — Backend

### 1. Configure environment

```bash
cd marks-portal-backend
copy .env.example .env   # Windows
# OR
cp .env.example .env     # Mac/Linux
```

Edit `.env` if your MySQL needs a password:
```
DB_USER=root
DB_PASSWORD=your_password_here
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

The backend auto-creates the `marks_portal` database tables on startup. You just need to create the database itself first:

```sql
-- Run in MySQL client
CREATE DATABASE IF NOT EXISTS marks_portal;
```

Or run the provided schema file:

```bash
mysql -u root -p < schema.sql
```

### 4. Start the backend

```bash
npm start
# or for development with auto-reload:
npx nodemon index.js
```

Backend runs at: **http://localhost:5000**

On first start, it automatically:
- Creates the `students` and `marks` tables
- Seeds the admin account (`ADMIN001` / `admin123`)

### 5. Email Notifications (Optional but recommended)

To enable automated email delivery for new student registrations and password resets, update these in your `.env`:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here (Use an App Password, not your regular password)
```

---

## Setup — Frontend

```bash
cd marks-portal-frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Default Credentials

| Role | Roll Number | Password |
|------|------------|----------|
| Admin | `ADMIN001` | `admin123` |

> ⚠️ **Change the admin password after first login!**

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| POST | `/api/auth/register` | Admin | Register & email credentials |
| POST | `/api/auth/forgot-password` | ❌ | Reset password & email new one |
| POST | `/api/auth/change-password` | ✅ | Change own password |

### Marks
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| GET | `/api/marks/my` | Student | Get own marks |
| GET | `/api/marks/all` | Admin | All students + marks |
| GET | `/api/marks/students` | Admin | Student list (for dropdowns) |
| POST | `/api/marks` | Admin | Add single mark |
| PUT | `/api/marks/:id` | Admin | Edit a mark |
| DELETE | `/api/marks/:id` | Admin | Delete a mark |
| POST | `/api/marks/upload-csv` | Admin | Bulk CSV upload |

---

## CSV Upload Format

Download the template from the Admin Dashboard → Upload CSV tab.

Required columns:
```
roll_number,subject,marks_obtained,total_marks,exam_type
CS2024001,Mathematics,85,100,Midterm
CS2024002,Physics,72,100,Final
```

- Existing records for the same `(student, subject, exam_type)` combination are **updated**.
- Invalid rows are skipped and reported — valid rows are still saved.

---

## Features

### Student View
- Personal marks table with percentage and grade (A+ through F)
- Overall performance stats
- Overall performance stats
- **Download marks as PDF**
- **Forgot Password flow (via Email)**
- Change password

### Admin View
- Register students (auto-generates 8-char password)
- Add / edit / delete individual marks
- Bulk upload via CSV with row-level error reporting
- Search students by name or roll number
- Accordion view of each student's marks

---

## Security

- Passwords hashed with **bcrypt** (cost factor 12)
- All routes protected by **JWT** (8-hour expiry)
- Admin routes guarded by role check
- All DB queries use **parameterized statements** (no SQL injection)
- CORS restricted to `localhost:5173` and `localhost:3000`
