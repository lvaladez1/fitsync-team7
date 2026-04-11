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
    res.redirect('/login');
});

// --AUTH PAGES
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

// --SIGNUP
app.post('/signup', async (req, res) => {
    try {

        const {
            first_name,
            last_name,
            email,
            password,
            fitness_goal,
            preferred_workout_type
        } = req.body;

        await pool.query(
            `INSERT INTO users 
            (first_name, last_name, email, password, fitness_goal, preferred_workout_type)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, password, fitness_goal, preferred_workout_type]
        );

        res.redirect('/login');
    } catch (err) {
        console.error('SIGNUP ERROR:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Email already exists');
        }
        res.status(500).send('Error creating account');
    }
});

// --LOGIN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        if (rows.length > 0) {
            res.redirect('/dbTest');
        } else {
            res.status(401).send('Invalid email or password');
        }
    } catch (err) {
        console.error('LOGIN ERROR:', err);
        res.status(500).send('Error logging in');
    }
});

// --DB TEST
app.get('/dbTest', async (req, res) => {
    try {
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