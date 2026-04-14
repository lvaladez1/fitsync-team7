# FitSync Team 7

FitSync is our simple workout tracker web app built for our final project. The goal is to let users create an account, log workouts, update workout history, and use a couple of browser or web APIs to make the app more useful.


## Final Project Plan

### Team 7

- Janaye
- Sami
- Luis
- Savannah

### 1. Project Title

FitSync

### 2. Project Description / User Stories

#### Project Description

Workout Tracker is a web application designed to help users log workouts, track progress, and manage fitness activity in one place. Users can add new workouts, update existing entries, and view their workout history. The application will use a database to store workout data and integrate web APIs to enhance user experience with exercise search and location features.

The goal of the project is to create a simple, user-friendly fitness tracking app that satisfies all course requirements, including database usage, forms, JavaScript functionality, API integration, and professional design.

#### User Stories

- As a user, I want to add a workout so I can track my fitness activities.
  - Solution: building forms which connect to the database and filling in the workout table.
- As a user, I want to edit a workout so I can update incorrect or new information.
  - Solution: with CRUD operations in pages through forms to manipulate the database.
- As a user, I want to view my workout history so I can track progress over time.
  - Solution: solved with a display page with the history being pulled from the database.
- As a user, I want to search exercises using an API so I can find new workouts.
  - Solution: This will be implemented using the ExerciseDB API with fetch calls to display exercise results dynamically.
- As a user, I want my preferences saved so I don't have to re-enter them every time.
  - Solution: This will be implemented using localStorage or sessions to store user preferences.
- As a user, I want a clean and simple interface so the app is easy to use.
  - Solution: This will be implemented using external CSS or Bootstrap to ensure a consistent and professional design.

### 3. Target Audience

The target audience includes individuals who want a simple way to track workouts and fitness progress. This includes college students, beginners starting fitness routines, and regular gym users looking for a basic workout log application.

### 4. Proposed User Interface (Mockups)

The application will include multiple pages with a clean and user-friendly layout:

- Home/Dashboard Page
  - Displays a welcome message, navigation bar, and quick summary of workouts.
- Add Workout Page
  - A form that allows users to input workout details such as name, date, duration, and notes using different form elements (text input, dropdowns, etc.).
- Edit Workout Page
  - Similar to the add page but with pre-filled data, allowing users to update existing records.
- Workout History Page
  - Displays all workouts in a list or table format with options to edit or delete entries.
- Exercise Search Page
  - Allows users to search for exercises using an API and displays results dynamically.
- Preferences Page
  - Allows users to store preferences using localStorage or sessions.

The design will be clean, consistent, and responsive using external CSS or Bootstrap.

### 5. Proposed Database Tables

#### User Table

Fields:

- `user_id` (Primary Key)
- `first_name`
- `last_name`
- `email`
- `password`
- `fitness_goal`
- `preferred_workout_type`

#### Workouts Table

Fields:

- `workout_id` (Primary Key)
- `user_id` (Foreign Key -> `Users.user_id`)
- `workout_name`
- `workout_date`
- `duration_minutes`
- `notes`

#### Exercises Table

Fields:

- `exercise_id` (Primary Key)
- `workout_id` (Foreign Key -> `Workouts.workout_id`)
- `exercise_name`
- `sets`
- `reps`
- `weight`
- `distance`
- `exercise_type`

#### EER Diagram Brief Description

- Users table stores the basic information about each user. It includes personal details such as their name, email, password, and a fitness preference. They will have the ability to set a goal.
- Workouts table stores each workout session created by the user. It includes the workout name, date, duration, and any notes they wish to store. Each workout is linked to a specific user through a foreign key (`user_id`). It allows users to track their workout history.
- Exercises table stores exercises that belong to a workout. It includes the exercise name, sets, reps, weight, distance, and type of exercise. Each exercise is connected to a specific workout through the foreign key (`workout_id`) that allows multiple exercises to be grouped together under one workout.
- The tables have a one-to-many relationship where users can have multiple workouts and each workout can have multiple exercises.

### 6. How We Will Meet the Rubric Requirements

- Include title, description, task distribution, AI usage explanation, database schema, and screenshots in the final report
- Use at least 3 database tables with more than 10 total fields
- Store JavaScript and CSS in external files
- Submit all files in a zip file including SQL database export

#### Feature Requirements

- Use at least 3 form elements (text input, dropdown, radio buttons, checkboxes)
- Implement Web Storage (localStorage) for saving user preferences
- Allow users to update existing records with pre-filled forms
- Allow users to add new records
- Include 50+ lines of client-side JavaScript
- Use at least 2 Web APIs
- Maintain a professional and consistent design

### 7. Web APIs Used

- ExerciseDB API: used to search exercises and display workout-related information
- Geolocation API: used to track or support outdoor workouts
- OpenWeather API (optional): may be used to display weather conditions for outdoor workouts

### 8. Client-Side JavaScript Plan

JavaScript will be used to:

- Validate form input
- Fetch data from APIs
- Update the DOM dynamically
- Store user preferences using localStorage
- Filter and display workout data
- Handle editing and updating records

### 9. CSS, Design Plan, & Proposed UI

The project will use external CSS files or Bootstrap to create a clean and responsive design. The interface will include consistent colors, spacing, readable text, and a user-friendly layout.

### 10. Workload Distribution

#### Sami H - JavaScript / API Integration / Front-end Interactivity

- Write client-side JavaScript
- Implement API fetch calls (ExerciseDB, Geolocation)
- Handle localStorage functionality
- Add interactivity and validation

#### Luis V - Database Design and Setup / CRUD Pages

- Create tables
- Relationships and foreign keys
- Schema documentation
- Build pages
- Create forms
- Connect forms to database

#### Janaye J - Back-End Development / Database Design

- Lead database design and table creation
- Define relationships and foreign keys
- Create and manage database schema
- Ensure data is properly stored and retrieved

#### Savannah K - Front-End Design / UI & Styling

- Design layout and user interface
- Implement CSS styling or Bootstrap
- Ensure consistent and professional design
- Improve usability and visual appearance

### 11. Current Team Status

The team has selected the Workout Tracker project because it satisfies all rubric requirements and allows for the use of databases, forms, JavaScript, APIs, and design elements. Roles have been assigned based on team strengths, and development planning is currently in progress.