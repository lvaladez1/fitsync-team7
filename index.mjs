import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

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


/* // --ADD WORKOUT
// GET route when express-session is implemented

app.get('/workouts/new', isAuthenticated, (req, res) => {
    res.render('newWorkout');

    });

// POST route when express-session is implemented
app.post('/workouts/new', isAuthenticated, (req, res) => {
    const user_id = req.session.user_id;
    const {
        workout_name, 
        workout_date, 
        duration_minutes, 
        notes
    } = req.body;

    let sql = `INSERT INTO workouts
                (user_id, workout_name, workout_date, duration_minutes, notes)
                VALUES (?, ?, ?, ?, ?)`;
    let params = [
        user_id,
        workout_name,
        workout_date, 
        duration_minutes, 
        notes,
    ]; 
    const [rows] = await pool.query(sql, params);

    res.render('newWorkout', {'message': 'Workout added!'});
});
*/

// --ADD WORKOUT
app.get('/workouts/new', (req, res) => {
    res.render('newWorkout', { 'message': '' });
});

app.post('/workouts/new', async (req, res) => {
    try {
        const user_id = 1; // simulate express-session user_id
        const {
            workout_name,
            workout_date,
            duration_minutes,
            notes
        } = req.body;

        let sql = `INSERT INTO workouts
                (user_id, workout_name, workout_date, duration_minutes, notes)
                VALUES (?, ?, ?, ?, ?)`;
        let params = [
            user_id,
            workout_name,
            workout_date,
            duration_minutes,
            notes,
        ];
        const [rows] = await pool.query(sql, params);

        res.render('newWorkout', { 'message': 'Workout added!' });
    } catch (err) {
        console.log('ADD WORKOUT ERROR:', err);
        res.status(400).send('Error adding workout');
    }
});

app.get('/workouts/history', async (req, res) => { // ('/workouts/history', isAuthorized, async(req, res) )
    try {
        const user_id = 1; // const user_id = req.session.user_id;
        let sql = `SELECT *,
                DATE_FORMAT(workout_date, '%Y-%m-%d') workout_date 
                FROM workouts WHERE user_id = ?`;
        const [rows] = await pool.query(sql, user_id);

        res.render('workoutsList', { 'workoutList': rows });
    } catch (err) {
        console.log('RETRIEVE HISTORY ERROR:', err);
        res.send('Error retrieving workout history');
    }
});

// --EDIT WORKOUT
app.get('/workouts/edit', async (req, res) => {
    try {
        const {
            user_id,
            workout_id
        } = req.query;

        let sql = `SELECT *, 
                DATE_FORMAT(workout_date, '%Y-%m-%d') workout_date 
                FROM workouts 
                WHERE user_id = ? AND workout_id = ?`;
        const [rows] = await pool.query(sql, [user_id, workout_id]);

        res.render('editWorkout', {
            'workoutInfo': rows[0],
            'message': ''
        });
    } catch (err) {
        console.log('EDIT WORKOUT ERROR:', err);
        res.send('Error retrieving workout');
    }
});

app.post('/workouts/edit', async (req, res) => {
    try {
        const {
            workout_name,
            workout_date,
            duration_minutes,
            notes,
            is_deleted,
            user_id,
            workout_id
        } = req.body;

        let sql = `UPDATE workouts
               SET workout_name = ?,
                   workout_date = ?,
                   duration_minutes = ?,
                   notes = ?,
                   is_deleted = ?
                WHERE user_id = ? AND workout_id = ?`;
        let params = [
            workout_name,
            workout_date,
            duration_minutes,
            notes,
            is_deleted,
            user_id,
            workout_id
        ];
        const [rows] = await pool.query(sql, params);

        res.render('editWorkout', {
            'workoutInfo': {
                workout_id,
                workout_name,
                workout_date,
                duration_minutes,
                notes
            },
            'message': 'Workout updated!'
        });
    } catch (err) {
        console.log('UPDATE WORKOUT ERROR:', err);
        res.send('Error updating workout');
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

// --FUNCTIONS
function isAuthenticated(req, res, next) {
    if (!req.session.authenticated) {
        res.render('/login');
    } else {
        next();
    }
}