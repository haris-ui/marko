const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

/**
 * Generate a random alphanumeric password of given length.
 */
function generatePassword(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * POST /api/auth/login
 * Body: { roll_number, password }
 */
router.post(
    '/login',
    [
        body('roll_number').trim().notEmpty().withMessage('Roll number is required.'),
        body('password').notEmpty().withMessage('Password is required.'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { roll_number, password } = req.body;

        try {
            const [rows] = await pool.execute(
                'SELECT * FROM students WHERE roll_number = ?',
                [roll_number]
            );

            if (rows.length === 0) {
                return res.status(401).json({ message: 'Invalid roll number or password.' });
            }

            const student = rows[0];
            const isMatch = await bcrypt.compare(password, student.password_hash);

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid roll number or password.' });
            }

            const token = jwt.sign(
                { id: student.id, roll_number: student.roll_number, name: student.name, role: student.role },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({
                token,
                user: {
                    id: student.id,
                    roll_number: student.roll_number,
                    name: student.name,
                    email: student.email,
                    role: student.role,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/auth/register
 * Admin only — registers a single student and returns generated credentials.
 * Body: { roll_number, name, email? }
 */
router.post(
    '/register',
    verifyToken,
    requireAdmin,
    [
        body('roll_number').trim().notEmpty().withMessage('Roll number is required.'),
        body('name').trim().notEmpty().withMessage('Name is required.'),
        body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email.'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { roll_number, name, email } = req.body;

        try {
            const [existing] = await pool.execute(
                'SELECT id FROM students WHERE roll_number = ?',
                [roll_number]
            );
            if (existing.length > 0) {
                return res.status(409).json({ message: 'Roll number already exists.' });
            }

            const plainPassword = generatePassword(8);
            const password_hash = await bcrypt.hash(plainPassword, 12);

            await pool.execute(
                'INSERT INTO students (roll_number, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?)',
                [roll_number, password_hash, name, email || null, 'student']
            );

            res.status(201).json({
                message: 'Student registered successfully.',
                credentials: { roll_number, password: plainPassword, name },
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/auth/register-bulk
 * Admin only — registers multiple students from JSON array.
 * Body: { students: [{ roll_number, name, email? }] }
 * Returns: array of generated credentials.
 */
router.post(
    '/register-bulk',
    verifyToken,
    requireAdmin,
    async (req, res, next) => {
        const { students } = req.body;
        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'students array is required.' });
        }

        const results = [];
        const errors = [];

        for (const s of students) {
            const { roll_number, name, email } = s;
            if (!roll_number?.trim() || !name?.trim()) {
                errors.push({ roll_number, error: 'Missing roll_number or name.' });
                continue;
            }
            try {
                const [existing] = await pool.execute(
                    'SELECT id FROM students WHERE roll_number = ?',
                    [roll_number.trim()]
                );
                if (existing.length > 0) {
                    errors.push({ roll_number, error: 'Already exists.' });
                    continue;
                }
                const plainPassword = generatePassword(8);
                const password_hash = await bcrypt.hash(plainPassword, 12);
                await pool.execute(
                    'INSERT INTO students (roll_number, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?)',
                    [roll_number.trim(), password_hash, name.trim(), email?.trim() || null, 'student']
                );
                results.push({ roll_number: roll_number.trim(), name: name.trim(), password: plainPassword });
            } catch (err) {
                errors.push({ roll_number, error: err.message });
            }
        }

        res.json({
            message: `Registered ${results.length} students. ${errors.length} failed.`,
            credentials: results,
            errors,
        });
    }
);

/**
 * POST /api/auth/forgot-password
 * Admin only — resets a student's password and returns the new one.
 * Body: { roll_number }
 * NOTE: No email service needed — admin gives credentials to student directly.
 */
router.post(
    '/forgot-password',
    verifyToken,
    requireAdmin,
    [body('roll_number').trim().notEmpty().withMessage('Roll number is required.')],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { roll_number } = req.body;

        try {
            const [rows] = await pool.execute(
                'SELECT id, name FROM students WHERE roll_number = ?',
                [roll_number]
            );
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Student not found.' });
            }

            const plainPassword = generatePassword(8);
            const password_hash = await bcrypt.hash(plainPassword, 12);
            await pool.execute(
                'UPDATE students SET password_hash = ? WHERE id = ?',
                [password_hash, rows[0].id]
            );

            res.json({
                message: 'Password reset successfully. Share these new credentials with the student.',
                credentials: { roll_number, name: rows[0].name, password: plainPassword },
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/auth/change-password
 * Authenticated users change their own password.
 * Body: { current_password, new_password }
 */
router.post(
    '/change-password',
    verifyToken,
    [
        body('current_password').notEmpty().withMessage('Current password is required.'),
        body('new_password')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters.'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { current_password, new_password } = req.body;

        try {
            const [rows] = await pool.execute(
                'SELECT * FROM students WHERE id = ?',
                [req.user.id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const student = rows[0];
            const isMatch = await bcrypt.compare(current_password, student.password_hash);

            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect.' });
            }

            const newHash = await bcrypt.hash(new_password, 12);
            await pool.execute(
                'UPDATE students SET password_hash = ? WHERE id = ?',
                [newHash, req.user.id]
            );

            res.json({ message: 'Password changed successfully.' });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
