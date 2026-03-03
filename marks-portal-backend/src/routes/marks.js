const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Multer: store CSV in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed.'));
        }
    },
});

/**
 * GET /api/marks/my
 * Student retrieves their own marks.
 */
router.get('/my', verifyToken, async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            `SELECT m.id, m.subject, m.marks_obtained, m.total_marks, m.exam_type, m.uploaded_at
       FROM marks m
       WHERE m.student_id = ?
       ORDER BY m.subject, m.exam_type`,
            [req.user.id]
        );
        res.json({ marks: rows });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/marks/all
 * Admin retrieves all students with their marks.
 */
router.get('/all', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const [students] = await pool.execute(
            `SELECT s.id, s.roll_number, s.name, s.email, s.created_at FROM students s WHERE s.role = 'student' ORDER BY s.roll_number`
        );
        const [marks] = await pool.execute(
            `SELECT m.id, m.student_id, m.subject, m.marks_obtained, m.total_marks, m.exam_type, m.uploaded_at FROM marks m ORDER BY m.student_id`
        );

        // Attach marks to students
        const studentsWithMarks = students.map((s) => ({
            ...s,
            marks: marks.filter((m) => m.student_id === s.id),
        }));

        res.json({ students: studentsWithMarks });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/marks/students
 * Admin gets simple list of students (for dropdowns).
 */
router.get('/students', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            `SELECT id, roll_number, name FROM students WHERE role = 'student' ORDER BY roll_number`
        );
        res.json({ students: rows });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/marks
 * Admin adds a single mark.
 * Body: { roll_number, subject, marks_obtained, total_marks, exam_type }
 */
router.post(
    '/',
    verifyToken,
    requireAdmin,
    [
        body('roll_number').trim().notEmpty().withMessage('Roll number is required.'),
        body('subject').trim().notEmpty().withMessage('Subject is required.'),
        body('marks_obtained').isFloat({ min: 0 }).withMessage('Marks obtained must be a non-negative number.'),
        body('total_marks').isFloat({ min: 1 }).withMessage('Total marks must be at least 1.'),
        body('exam_type').trim().notEmpty().withMessage('Exam type is required.'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { roll_number, subject, marks_obtained, total_marks, exam_type } = req.body;

        if (parseFloat(marks_obtained) > parseFloat(total_marks)) {
            return res.status(400).json({ message: 'Marks obtained cannot exceed total marks.' });
        }

        try {
            const [students] = await pool.execute(
                'SELECT id FROM students WHERE roll_number = ?',
                [roll_number]
            );
            if (students.length === 0) return res.status(404).json({ message: 'Student not found.' });

            const student_id = students[0].id;
            await pool.execute(
                `INSERT INTO marks (student_id, subject, marks_obtained, total_marks, exam_type)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), total_marks = VALUES(total_marks)`,
                [student_id, subject.trim(), marks_obtained, total_marks, exam_type.trim()]
            );

            res.status(201).json({ message: 'Mark added successfully.' });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * PUT /api/marks/:id
 * Admin edits an existing mark.
 */
router.put(
    '/:id',
    verifyToken,
    requireAdmin,
    [
        body('marks_obtained').isFloat({ min: 0 }).withMessage('Marks obtained must be a non-negative number.'),
        body('total_marks').isFloat({ min: 1 }).withMessage('Total marks must be at least 1.'),
        body('exam_type').trim().notEmpty().withMessage('Exam type is required.'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { marks_obtained, total_marks, exam_type, subject } = req.body;

        if (parseFloat(marks_obtained) > parseFloat(total_marks)) {
            return res.status(400).json({ message: 'Marks obtained cannot exceed total marks.' });
        }

        try {
            const [result] = await pool.execute(
                `UPDATE marks SET marks_obtained = ?, total_marks = ?, exam_type = ?, subject = ? WHERE id = ?`,
                [marks_obtained, total_marks, exam_type.trim(), subject.trim(), req.params.id]
            );

            if (result.affectedRows === 0) return res.status(404).json({ message: 'Mark not found.' });
            res.json({ message: 'Mark updated successfully.' });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * DELETE /api/marks/:id
 * Admin deletes a mark.
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const [result] = await pool.execute('DELETE FROM marks WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Mark not found.' });
        res.json({ message: 'Mark deleted successfully.' });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/marks/upload-csv
 * Admin bulk uploads marks from a CSV file.
 * Requires field `subject` in FormData.
 * CSV columns: roll_number, marks_obtained, total_marks, exam_type
 */
router.post('/upload-csv', verifyToken, requireAdmin, upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded.' });
    const subject = req.body.subject?.trim();
    if (!subject) return res.status(400).json({ message: 'Subject is required.' });

    try {
        const records = parse(req.file.buffer.toString('utf-8'), {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        if (records.length === 0) return res.status(400).json({ message: 'CSV file is empty.' });

        const required = ['roll_number', 'marks_obtained', 'total_marks', 'exam_type'];
        const firstRow = records[0];
        for (const col of required) {
            if (!(col in firstRow)) {
                return res.status(400).json({ message: `Missing required column: ${col}` });
            }
        }

        const errors = [];
        const success = [];

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const lineNum = i + 2; // account for header row

            const { roll_number, marks_obtained, total_marks, exam_type } = row;

            if (!roll_number || !marks_obtained || !total_marks || !exam_type) {
                errors.push({ line: lineNum, error: 'Missing required field(s).' });
                continue;
            }

            const mo = parseFloat(marks_obtained);
            const tm = parseFloat(total_marks);

            if (isNaN(mo) || isNaN(tm) || tm <= 0 || mo < 0 || mo > tm) {
                errors.push({ line: lineNum, error: 'Invalid marks values.' });
                continue;
            }

            try {
                const [students] = await pool.execute(
                    'SELECT id FROM students WHERE roll_number = ?',
                    [roll_number.trim()]
                );
                if (students.length === 0) {
                    errors.push({ line: lineNum, error: `Student ${roll_number} not found.` });
                    continue;
                }

                const student_id = students[0].id;
                await pool.execute(
                    `INSERT INTO marks (student_id, subject, marks_obtained, total_marks, exam_type)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), total_marks = VALUES(total_marks)`,
                    [student_id, subject, mo, tm, exam_type.trim()]
                );
                success.push(roll_number.trim());
            } catch (rowErr) {
                errors.push({ line: lineNum, error: rowErr.message });
            }
        }

        res.json({
            message: `Processed ${records.length} rows: ${success.length} succeeded, ${errors.length} failed.`,
            success_count: success.length,
            error_count: errors.length,
            errors,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
