const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    port: 3307,             // <-- Add this line (Change to 3307 if XAMPP shows 3307)
    user: 'root',
    password: '',           
    database: 'db_ceestem', // Ensure this matches your phpMyAdmin spelling exactly
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

module.exports = pool.promise();