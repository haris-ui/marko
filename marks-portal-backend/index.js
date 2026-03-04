require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./src/db');
const authRoutes = require('./src/routes/auth');
const marksRoutes = require('./src/routes/marks');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Seed admin account ────────────────────────────────────────────────────────
async function seedAdmin() {
    const adminRoll = process.env.ADMIN_ROLL || 'ADMIN001';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const [rows] = await pool.execute(
        'SELECT id FROM students WHERE roll_number = ?',
        [adminRoll]
    );
    if (rows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, 12);
        await pool.execute(
            `INSERT INTO students (roll_number, password_hash, name, role) VALUES (?, ?, ?, ?)`,
            [adminRoll, hash, 'Administrator', 'admin']
        );
        console.log(`[Seed] Admin created: ${adminRoll}`);
    }
}

// ─── Database init ─────────────────────────────────────────────────────────────
async function initDB() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            roll_number VARCHAR(20) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            role ENUM('student', 'admin') DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS marks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            subject VARCHAR(100) NOT NULL,
            marks_obtained DECIMAL(5,2) NOT NULL,
            total_marks DECIMAL(5,2) NOT NULL,
            exam_type VARCHAR(50) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE KEY unique_mark (student_id, subject, exam_type)
        )
    `);

    await seedAdmin();
    console.log('[DB] Initialized.');
}

// ─── KEY FIX: Store init as a module-level promise ────────────────────────────
// On Vercel serverless, each cold start loads this module.
// We store the promise so every request awaits it before touching the DB.
const dbReady = initDB().catch((err) => {
    console.error('[DB] Init error:', err.message);
});

// ─── Middleware: wait for DB before handling any request ──────────────────────
app.use(async (req, res, next) => {
    try {
        await dbReady;
        next();
    } catch (err) {
        res.status(503).json({ message: 'Database not ready. Please retry.' });
    }
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/marks', marksRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Local dev only ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`[Server] http://localhost:${PORT}`));
}

module.exports = app;
