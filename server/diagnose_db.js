const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnose() {
  console.log('--- MySQL Diagnostic ---');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);

  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    console.log('SUCCESS: Connected to MySQL server.');
    await conn.end();
  } catch (err) {
    console.error('FAILURE: Could not connect to MySQL server.');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('HINT: MySQL server is likely NOT running on ' + process.env.DB_HOST + ':3306');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('HINT: Incorrect username or password.');
    }
  }
}

diagnose();
