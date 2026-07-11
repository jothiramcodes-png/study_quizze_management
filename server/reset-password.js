require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetPassword() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mindtrack_db',
    });

    const newPassword = 'Admin@123';
    const hashed = await bcrypt.hash(newPassword, 12);
    
    // Check if user exists
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', ['admin@mindtrack.edu']);
    
    if (rows.length === 0) {
      // If user doesn't exist, insert them
      await pool.execute(
        `INSERT INTO users (name, email, password, role) VALUES ('System Admin', 'admin@mindtrack.edu', ?, 'admin')`,
        [hashed]
      );
      console.log('Admin user was missing. Created successfully with password:', newPassword);
    } else {
      // Update existing user
      await pool.execute(
        'UPDATE users SET password = ? WHERE email = ?', 
        [hashed, 'admin@mindtrack.edu']
      );
      console.log('Password reset successfully to:', newPassword);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetPassword();
