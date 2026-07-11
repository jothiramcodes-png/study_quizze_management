require('dotenv').config();
const { pool } = require('../config/database');
pool.query("UPDATE users SET password = $1 WHERE email = $2", ['$2a$12$mfaMsrHmrperr4urXx.a6uPzhDKlgh0cVzojt7FlONJeUASghrCPm', 'admin@mindtrack.edu'])
  .then(() => { console.log('Done'); process.exit(0); });
