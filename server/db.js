const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

let pool;

async function initDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await connection.end();

    pool = mysql.createPool({
      ...dbConfig,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS Users (
        user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'student') DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createStudentsTable = `
      CREATE TABLE IF NOT EXISTS Students (
        student_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED,
        name VARCHAR(255) NOT NULL,
        program VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
      );
    `;

    const createCoursesTable = `
      CREATE TABLE IF NOT EXISTS Courses (
        course_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        course_name VARCHAR(255) NOT NULL,
        credits INT NOT NULL
      );
    `;

    const createRegistrationTable = `
      CREATE TABLE IF NOT EXISTS Registration (
        reg_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        student_id INT UNSIGNED,
        course_id INT UNSIGNED,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
        UNIQUE KEY student_course (student_id, course_id)
      );
    `;

    console.log('Creating tables...');
    await pool.query(createUsersTable);
    console.log('Users table checked/created');
    await pool.query(createStudentsTable);
    console.log('Students table checked/created');
    await pool.query(createCoursesTable);
    console.log('Courses table checked/created');
    await pool.query(createRegistrationTable);
    console.log('Registration table checked/created');

    console.log('Database and tables initialized successfully.');
    
    // Seed an admin user if it doesn't exist
    const bcrypt = require('bcrypt');
    console.log('Checking for admin user...');
    const [adminRows] = await pool.query('SELECT * FROM Users WHERE username = ?', ['admin']);
    if (adminRows.length === 0) {
      console.log('Seeding admin user...');
      const hashedPw = await bcrypt.hash('admin123', 10);
      await pool.query('INSERT INTO Users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPw, 'admin']);
      console.log('Admin user seeded (admin / admin123)');
    } else {
      console.log('Admin user already exists');
    }

    return pool;
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Don't exit immediately, maybe it's a transient error
    // process.exit(1); 
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialized');
  }
  return pool;
}

module.exports = { initDB, getPool };
