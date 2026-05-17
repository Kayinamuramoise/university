const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { initDB, getPool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB on start
initDB().then(() => {
  console.log('DB ready');
});

// Middleware for auth
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// --- AUTH ROUTES ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const pool = getPool();
    const [users] = await pool.query('SELECT * FROM Users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(400).json({ message: 'User not found' });
    
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid password' });
    
    // For students, fetch student_id
    let student_id = null;
    let name = null;
    if (user.role === 'student') {
        const [students] = await pool.query('SELECT * FROM Students WHERE user_id = ?', [user.user_id]);
        if (students.length > 0) {
            student_id = students[0].student_id;
            name = students[0].name;
        }
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role, student_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user_id: user.user_id, role: user.role, student_id, name: name || user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register new student (Admin only or open)
app.post('/api/register-student', async (req, res) => {
  const { username, password, name, program } = req.body;
  try {
    const pool = getPool();
    // Check if user exists
    const [existing] = await pool.query('SELECT * FROM Users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ message: 'Username already exists' });

    const hashedPw = await bcrypt.hash(password, 10);
    
    // Transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const [userResult] = await connection.query('INSERT INTO Users (username, password, role) VALUES (?, ?, ?)', [username, hashedPw, 'student']);
      const userId = userResult.insertId;
      
      await connection.query('INSERT INTO Students (user_id, name, program) VALUES (?, ?, ?)', [userId, name, program]);
      await connection.commit();
      res.status(201).json({ message: 'Student registered successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- STUDENTS ROUTES ---
app.get('/api/students', authenticate, async (req, res) => {
  try {
    const [students] = await getPool().query(`
      SELECT s.student_id, s.name, s.program, u.username, u.user_id 
      FROM Students s 
      JOIN Users u ON s.user_id = u.user_id
    `);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/students/:id', authenticate, async (req, res) => {
    const { name, program } = req.body;
    try {
        await getPool().query('UPDATE Students SET name = ?, program = ? WHERE student_id = ?', [name, program, req.params.id]);
        res.json({ message: 'Student updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/students/:id', authenticate, async (req, res) => {
    try {
        const pool = getPool();
        const [student] = await pool.query('SELECT user_id FROM Students WHERE student_id = ?', [req.params.id]);
        if(student.length > 0) {
            await pool.query('DELETE FROM Users WHERE user_id = ?', [student[0].user_id]); // Will cascade to Students
        }
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- COURSES ROUTES ---
app.get('/api/courses', authenticate, async (req, res) => {
  try {
    const [courses] = await getPool().query('SELECT * FROM Courses');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/courses', authenticate, async (req, res) => {
  const { course_name, credits } = req.body;
  try {
    await getPool().query('INSERT INTO Courses (course_name, credits) VALUES (?, ?)', [course_name, credits]);
    res.status(201).json({ message: 'Course created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/courses/:id', authenticate, async (req, res) => {
    const { course_name, credits } = req.body;
    try {
        await getPool().query('UPDATE Courses SET course_name = ?, credits = ? WHERE course_id = ?', [course_name, credits, req.params.id]);
        res.json({ message: 'Course updated' });
    } catch(err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/courses/:id', authenticate, async (req, res) => {
    try {
        await getPool().query('DELETE FROM Courses WHERE course_id = ?', [req.params.id]);
        res.json({ message: 'Course deleted' });
    } catch(err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- REGISTRATION (ENROLLMENT) ROUTES ---
app.post('/api/enroll', authenticate, async (req, res) => {
  const { student_id, course_id } = req.body;
  try {
    await getPool().query('INSERT INTO Registration (student_id, course_id) VALUES (?, ?)', [student_id, course_id]);
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Already enrolled in this course' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Drop course
app.delete('/api/enroll/:student_id/:course_id', authenticate, async (req, res) => {
    try {
        await getPool().query('DELETE FROM Registration WHERE student_id = ? AND course_id = ?', [req.params.student_id, req.params.course_id]);
        res.json({ message: 'Dropped successfully' });
    } catch(err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student course report
app.get('/api/reports/student/:student_id', authenticate, async (req, res) => {
  try {
    const [report] = await getPool().query(`
      SELECT c.course_id, c.course_name, c.credits, r.registration_date 
      FROM Registration r
      JOIN Courses c ON r.course_id = c.course_id
      WHERE r.student_id = ?
    `, [req.params.student_id]);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all registrations (for admin)
app.get('/api/reports/all', authenticate, async (req, res) => {
  try {
    const [report] = await getPool().query(`
      SELECT r.reg_id, s.name as student_name, s.program, c.course_name, c.credits, r.registration_date 
      FROM Registration r
      JOIN Students s ON r.student_id = s.student_id
      JOIN Courses c ON r.course_id = c.course_id
      ORDER BY r.registration_date DESC
    `);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
