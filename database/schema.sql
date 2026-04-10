DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(55) NOT NULL,
    last_name VARCHAR(55) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    fitness_goal VARCHAR(100),
    preferred_workout_type VARCHAR(55)
);

CREATE TABLE workouts (
    workout_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workout_name VARCHAR(100) NOT NULL,
    workout_date DATE NOT NULL,
    duration_minutes INT NOT NULL,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_workouts_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE exercises (
    exercise_id INT AUTO_INCREMENT PRIMARY KEY,
    workout_id INT NOT NULL,
    exercise_name VARCHAR(100) NOT NULL,
    sets INT,
    reps INT,
    weight DECIMAL(5,2),
    distance DECIMAL(6,2),
    exercise_type VARCHAR(50),
    CONSTRAINT fk_exercises_workout
        FOREIGN KEY (workout_id) REFERENCES workouts(workout_id)
        ON DELETE CASCADE
);