import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import session from 'express-session';
dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-session-key',
    resave: false,
    saveUninitialized: false
}));
app.use((req, res, next) => {
    res.locals.isAuthenticated = Boolean(req.session?.authenticated);
    next();
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionLimit: 10,
    waitForConnections: true
});
let usersTableColumns;

// --Home
app.get('/', (req, res) => {
    res.redirect('/login');
});

// --AUTH PAGES
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup', {
        errorMessage: '',
        formData: getSignupFormData()
    });
});

// --HOME DASHBOARD
app.get('/home', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const userColumns = await getUsersTableColumns();
        const userSelectColumns = ['first_name'];

        if (userColumns.has('fitness_goal')) {
            userSelectColumns.push('fitness_goal');
        } else {
            userSelectColumns.push('NULL AS fitness_goal');
        }

        if (userColumns.has('preferred_workout_type')) {
            userSelectColumns.push('preferred_workout_type');
        } else {
            userSelectColumns.push('NULL AS preferred_workout_type');
        }

        const [userRows] = await pool.query(
            `SELECT ${userSelectColumns.join(', ')}
             FROM users
             WHERE user_id = ?`,
            [user_id]
        );

        const [summaryRows] = await pool.query(
            `SELECT COUNT(*) AS workout_count,
                    COALESCE(SUM(duration_minutes), 0) AS total_minutes,
                    DATE_FORMAT(MAX(workout_date), '%b %e, %Y') AS latest_workout_date
             FROM workouts
             WHERE user_id = ? AND is_deleted = 0`,
            [user_id]
        );

        const [recentRows] = await pool.query(
            `SELECT workout_id,
                    workout_name,
                    DATE_FORMAT(workout_date, '%b %e, %Y') AS workout_date_label,
                    duration_minutes,
                    notes
             FROM workouts
             WHERE user_id = ? AND is_deleted = 0
             ORDER BY workout_date DESC, workout_id DESC
             LIMIT 4`,
            [user_id]
        );

        const dashboard = createDashboardViewModel(
            userRows[0],
            summaryRows[0],
            recentRows
        );

        res.render('home', { dashboard });
    } catch (err) {
        console.error('HOME DASHBOARD ERROR:', err);
        res.status(500).send('Error loading dashboard');
    }
});

// --SIGNUP
app.post('/signup', async (req, res) => {
    const formData = getSignupFormData(req.body);

    try {
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
            return res.status(400).render('signup', {
                errorMessage: 'Please fill out all required fields.',
                formData
            });
        }

        const userColumns = await getUsersTableColumns();
        const requiredColumns = ['first_name', 'last_name', 'email', 'password'];
        const missingRequiredColumns = requiredColumns.filter((column) => !userColumns.has(column));

        if (missingRequiredColumns.length > 0) {
            throw new Error('users table is missing required signup columns??');
        }

        const insertColumns = [...requiredColumns];
        const insertValues = [
            formData.first_name,
            formData.last_name,
            formData.email,
            formData.password
        ];

        if (userColumns.has('fitness_goal')) {
            insertColumns.push('fitness_goal');
            insertValues.push(formData.fitness_goal || null);
        }

        if (userColumns.has('preferred_workout_type')) {
            insertColumns.push('preferred_workout_type');
            insertValues.push(formData.preferred_workout_type || null);
        }

        await pool.query(
            `INSERT INTO users (${insertColumns.join(', ')})
            VALUES (${insertColumns.map(() => '?').join(', ')})`,
            insertValues
        );

        res.redirect('/login');
    } catch (err) {
        console.error('SIGNUP ERROR:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('signup', {
                errorMessage: 'That email already exists. Try logging in instead.',
                formData
            });
        }

        res.status(500).render('signup', {
            errorMessage: 'Database error while creating account. Check the server log for the exact failure.',
            formData
        });
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
            req.session.user_id = rows[0].user_id;
            req.session.authenticated = true;
            res.redirect('/home');
        } else {
            res.status(401).send('Invalid email or password');
        }
    } catch (err) {
        console.error('LOGIN ERROR:', err);
        res.status(500).send('Error logging in');
    }
});

// --LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// --ADD WORKOUT 
app.get('/workouts/new', isAuthenticated, (req, res) => {
    res.render('newWorkout', { 'message': '' });
});

app.post('/workouts/new', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;

        const {
            workout_name,
            workout_date,
            duration_minutes,
            notes,
            is_deleted
        } = req.body;

        let sql = `INSERT INTO workouts
                (user_id, workout_name, workout_date, duration_minutes, notes, is_deleted)
                VALUES (?, ?, ?, ?, ?, ?)`;
        let params = [
            user_id,
            workout_name,
            workout_date,
            duration_minutes,
            notes,
            is_deleted
        ];
        const [rows] = await pool.query(sql, params);

        res.render('newWorkout', {
            message: 'Workout added!',
        });
    } catch (err) {
        console.log('ADD WORKOUT ERROR:', err);
        res.status(400).send('Error adding workout');
    }
});

app.get('/workouts/history', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const is_deleted = 0;

        let sql = `SELECT *,
                DATE_FORMAT(workout_date, '%Y-%m-%d') workout_date 
                FROM workouts WHERE user_id = ? AND is_deleted = ?`;
        const [rows] = await pool.query(sql, [user_id, is_deleted]);

        res.render('workoutsList', { 'workoutList': rows });
    } catch (err) {
        console.log('RETRIEVE HISTORY ERROR:', err);
        res.send('Error retrieving workout history');
    }
});

// --EDIT WORKOUT
app.get('/workouts/edit', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const workout_id = req.query.workout_id;

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

app.post('/workouts/edit', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const {
            workout_name,
            workout_date,
            duration_minutes,
            notes,
            is_deleted,
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

// --DELETE WORKOUT
app.get('/workouts/delete', isAuthenticated, async (req, res) => {
    const user_id = req.session.user_id;
    const is_deleted = 1;
    const sql = `UPDATE workouts 
                 SET is_deleted = ? 
                 WHERE user_id = ? AND workout_id = ?`;
    const [rows] = await pool.query(sql, [is_deleted, user_id, req.query.workout_id]);
    res.redirect('/workouts/history');
});

// --NEW EXERCISE PAGE
app.get('/workouts/:workout_id/exercises/new', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const workout_id = req.params.workout_id;
        const exerciseName = req.query.name || '';

        const sql = `
            SELECT workout_id, workout_name, DATE_FORMAT(workout_date, '%Y-%m-%d') AS workout_date
            FROM workouts
            WHERE workout_id = ? AND user_id = ? AND is_deleted = 0
        `;
        const [rows] = await pool.query(sql, [workout_id, user_id]);

        if (rows.length === 0) {
            return res.status(404).send('Workout not found');
        }

        res.render('newExercise', {
            exerciseName,
            workout: rows[0],
            message: ''
        });
    } catch (err) {
        console.log('NEW EXERCISE PAGE ERROR:', err);
        res.status(500).send('Error loading exercise page');
    }
});


// --ADD EXERCISE
app.post('/workouts/:workout_id/exercises/new', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const workout_id = req.params.workout_id;
        const exerciseName = req.query.name || '';

        const {
            exercise_name,
            sets,
            reps,
            weight,
            distance,
            exercise_type
        } = req.body;

        const workoutSql = `
            SELECT workout_id, workout_name, DATE_FORMAT(workout_date, '%Y-%m-%d') AS workout_date
            FROM workouts
            WHERE workout_id = ? AND user_id = ? AND is_deleted = 0
        `;
        const [workoutRows] = await pool.query(workoutSql, [workout_id, user_id]);

        if (workoutRows.length === 0) {
            return res.status(404).send('Workout not found');
        }

        const insertSql = `
            INSERT INTO exercises
            (workout_id, exercise_name, sets, reps, weight, distance, exercise_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            workout_id,
            exercise_name,
            sets || null,
            reps || null,
            weight || null,
            distance || null,
            exercise_type || null
        ];

        await pool.query(insertSql, params);

        res.render('newExercise', {
            exerciseName,
            workout: workoutRows[0],
            message: 'Exercise added successfully!'
        });
    } catch (err) {
        console.log('ADD EXERCISE ERROR:', err);
        res.status(500).send('Error adding exercise');
    }
});


// --VIEW EXERCISES FOR A WORKOUT
app.get('/workouts/:workout_id/exercises', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const workout_id = req.params.workout_id;

        const workoutSql = `
            SELECT workout_id, workout_name, DATE_FORMAT(workout_date, '%Y-%m-%d') AS workout_date
            FROM workouts
            WHERE workout_id = ? AND user_id = ? AND is_deleted = 0
        `;
        const [workoutRows] = await pool.query(workoutSql, [workout_id, user_id]);

        if (workoutRows.length === 0) {
            return res.status(404).send('Workout not found');
        }

        const exerciseSql = `
            SELECT *
            FROM exercises
            WHERE workout_id = ?
            ORDER BY exercise_id DESC
        `;
        const [exerciseRows] = await pool.query(exerciseSql, [workout_id]);

        res.render('exercisesList', {
            workout: workoutRows[0],
            exerciseList: exerciseRows
        });
    } catch (err) {
        console.log('VIEW EXERCISES ERROR:', err);
        res.status(500).send('Error retrieving exercises');
    }
});

// --EDIT EXERCISE PAGE
app.get('/exercises/edit', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const exercise_id = req.query.exercise_id;

        const sql = `
            SELECT 
                e.exercise_id,
                e.workout_id,
                e.exercise_name,
                e.sets,
                e.reps,
                e.weight,
                e.distance,
                e.exercise_type,
                w.workout_name,
                DATE_FORMAT(w.workout_date, '%Y-%m-%d') AS workout_date
            FROM exercises e
            JOIN workouts w ON e.workout_id = w.workout_id
            WHERE e.exercise_id = ?
              AND w.user_id = ?
              AND w.is_deleted = 0
        `;
        const [rows] = await pool.query(sql, [exercise_id, user_id]);

        if (rows.length === 0) {
            return res.status(404).send('Exercise not found');
        }

        res.render('editExercise', {
            exerciseInfo: rows[0],
            message: ''
        });
    } catch (err) {
        console.log('EDIT EXERCISE PAGE ERROR:', err);
        res.status(500).send('Error retrieving exercise');
    }
});


// --UPDATE EXERCISE
app.post('/exercises/edit', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;

        const {
            exercise_id,
            workout_id,
            exercise_name,
            sets,
            reps,
            weight,
            distance,
            exercise_type
        } = req.body;

        const checkSql = `
            SELECT 
                e.exercise_id,
                e.workout_id,
                w.workout_name,
                DATE_FORMAT(w.workout_date, '%Y-%m-%d') AS workout_date
            FROM exercises e
            JOIN workouts w ON e.workout_id = w.workout_id
            WHERE e.exercise_id = ?
              AND e.workout_id = ?
              AND w.user_id = ?
              AND w.is_deleted = 0
        `;
        const [checkRows] = await pool.query(checkSql, [exercise_id, workout_id, user_id]);

        if (checkRows.length === 0) {
            return res.status(404).send('Exercise not found');
        }

        const updateSql = `
            UPDATE exercises
            SET exercise_name = ?,
                sets = ?,
                reps = ?,
                weight = ?,
                distance = ?,
                exercise_type = ?
            WHERE exercise_id = ? AND workout_id = ?
        `;

        const params = [
            exercise_name,
            sets || null,
            reps || null,
            weight || null,
            distance || null,
            exercise_type || null,
            exercise_id,
            workout_id
        ];

        await pool.query(updateSql, params);

       res.redirect(`/workouts/${workout_id}/exercises`);
    } catch (err) {
        console.log('UPDATE EXERCISE ERROR:', err);
        res.status(500).send('Error updating exercise');
    }
});

// --DELETE EXERCISE
app.get('/exercises/delete', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const exercise_id = req.query.exercise_id;
        const workout_id = req.query.workout_id;

        const checkSql = `
            SELECT e.exercise_id
            FROM exercises e
            JOIN workouts w ON e.workout_id = w.workout_id
            WHERE e.exercise_id = ? AND w.user_id = ? AND w.is_deleted = 0
        `;
        const [rows] = await pool.query(checkSql, [exercise_id, user_id]);

        if (rows.length === 0) {
            return res.status(404).send('Exercise not found');
        }

        const deleteSql = `DELETE FROM exercises WHERE exercise_id = ?`;
        await pool.query(deleteSql, [exercise_id]);

        res.redirect(`/workouts/${workout_id}/exercises`);
    } catch (err) {
        console.log('DELETE EXERCISE ERROR:', err);
        res.status(500).send('Error deleting exercise');
    }
});

app.get('/searchExercises', isAuthenticated, async(req,res) =>{
    let url = 'https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises'
    let response = await fetch(url, {
        headers: {
        'X-RapidAPI-Key': process.env.EXERCISE_API,
        'X-RapidAPI-Host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
        }
    });

    let data = await response.json();
    
    let sql = 'SELECT workout_id, workout_name FROM workouts WHERE user_id = ?'
    const [workouts] = await pool.query(sql, [req.session.user_id]);

    res.render('searchExercise', {
        exercises: data.data,
        workouts: workouts
    });
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
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
});

// --FUNCTIONS
function isAuthenticated(req, res, next) {
    if (!req.session.authenticated) {
        res.redirect('/login');
    } else {
        next();
    }
}

function createDashboardViewModel(userRow, summaryRow, recentRows) {
    const preferredWorkoutType = userRow?.preferred_workout_type || 'No preference saved yet';

    return {
        firstName: userRow?.first_name || 'Athlete',
        fitnessGoal: userRow?.fitness_goal || 'Set a goal in your profile to keep the dashboard focused.',
        preferredWorkoutType,
        workoutCount: Number(summaryRow?.workout_count || 0),
        totalMinutes: Number(summaryRow?.total_minutes || 0),
        latestWorkoutDate: summaryRow?.latest_workout_date || 'No workouts logged yet',
        recentWorkouts: recentRows.map((workout) => ({
            ...workout,
            notesPreview: workout.notes
                ? workout.notes.slice(0, 120)
                : 'No notes added yet.'
        })),
        locationPrompt: getLocationPrompt(preferredWorkoutType)
    };
}

// responsive / contextual per user..
function getLocationPrompt(preferredWorkoutType) {
    switch (preferredWorkoutType) {
        case 'Strength':
            return 'A quick walk plus some stretching can set up a stronger lift later.';
        case 'Cardio':
            return 'If the weather feels right, this is a good time for an outdoor run.';
        case 'Flexibility':
            return 'A short stretch can make recovery more comfortable.';
        case 'Sports':
            return 'Go scout a nearby field, court, or park for ideas.';
        default:
            return 'Check in here so you can remember your spot for next time!';
    }
}

function getSignupFormData(input = {}) {
    return {
        first_name: String(input.first_name || '').trim(),
        last_name: String(input.last_name || '').trim(),
        email: String(input.email || '').trim(),
        password: String(input.password || ''),
        fitness_goal: String(input.fitness_goal || '').trim(),
        preferred_workout_type: String(input.preferred_workout_type || '').trim()
    };
}

async function getUsersTableColumns() {
    if (usersTableColumns) {
        return usersTableColumns;
    }

    const [rows] = await pool.query('SHOW COLUMNS FROM users');
    usersTableColumns = new Set(rows.map((row) => row.Field));
    return usersTableColumns;
}
