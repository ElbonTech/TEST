// db.js
import mysql from 'mysql2';

// MySQL connection details (use environment variables in production)
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect(err => {
  if (err) {
    console.error('error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

export default connection;
