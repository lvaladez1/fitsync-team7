import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true }));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionLimit: 10,
    waitForConnections: true
});

// --Home
app.get('/', (req, res) => {
    res.render('index');
});

// --DB TEST

app.get('/dbTest', async (req, res) => {
    try {
        // const [rows] = await pool.query('SELECT CURDATE() AS today');
        const [rows] = await pool.query('SELECT * FROM users');
        res.send(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database connection failed');
    }
});

// --START SERVER

app.listen(3000, () => {
    console.log('Express server running on port 3000');
});