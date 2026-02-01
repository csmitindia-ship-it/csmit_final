// app.cjs
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();

// --- Middleware for logging ---
app.use((req, res, next) => {
    next();
});

app.use(express.json());

// --- Database Connection ---
const dbConfig = {
    host: 'localhost',
    user: 'backend_user',
    password: 'Backend@123!',
    database: 'csmit_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const db = mysql.createPool(dbConfig);

// --- Test route ---
app.get('/api/test', (req, res) => {
    res.json({ message: "API is working with database connection!" });
});

// --- Get all users ---
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, fullName, email, dob, mobile, college, department, yearOfPassing, state, district, createdAt FROM users');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// --- Start Server ---
const PORT = 8080;
app.listen(PORT, () => {
});
