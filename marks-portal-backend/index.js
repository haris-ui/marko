require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const pool = require('./src/db');
const authRoutes = require('./src/routes/auth');
const marksRoutes = require('./src/routes/marks');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: '*',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/marks', marksRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Seed admin account on startup ────────────────────────────────────────────
async function seedAdmin() {
    try {
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
            console.log(`[Seed] Admin account created: ${adminRoll} / ${adminPassword}`);
        }
    } catch (err) {
        console.error('[Seed] Failed to seed admin:', err.message);
    }
}

// ─── Database init and start ───────────────────────────────────────────────────
async function initDB() {
    // First, connect without a database to create it if needed
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'marks_portal'}\``);
    await connection.end();

    // Now use the pool to create tables
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
}

// ─── Initialize DB immediately (works on both local and Vercel serverless) ────
(async () => {
    try {
        await initDB();
        console.log('[DB] Tables initialized.');
        await seedAdmin();
    } catch (err) {
        console.error('[DB] Initialization error:', err.message);
    }
})();

// For local development: start a real HTTP server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`[Server] Running on http://localhost:${PORT}`);
    });
}

module.exports = app;
