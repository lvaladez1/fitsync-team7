document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');

    if (signupForm) {
        const workoutTypeField = document.getElementById('preferred_workout_type');
        const goalField = document.getElementById('fitness_goal');

        const savedWorkoutType = localStorage.getItem('preferred_workout_type');
        const savedGoal = localStorage.getItem('fitness_goal');

        if (savedWorkoutType && workoutTypeField) {
            workoutTypeField.value = savedWorkoutType;
        }

        if (savedGoal && goalField) {
            goalField.value = savedGoal;
        }

        signupForm.addEventListener('submit', (event) => {
            const firstName = document.getElementById('first_name').value.trim();
            const lastName = document.getElementById('last_name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const fitnessGoal = goalField.value.trim();
            const preferredWorkoutType = workoutTypeField.value;

            if (!firstName || !lastName || !email || !password) {
                alert('Please fill out all required fields.');
                event.preventDefault();
                return;
            }

            if (!email.includes('@')) {
                alert('Please enter a valid email.');
                event.preventDefault();
                return;
            }

            localStorage.setItem('fitness_goal', fitnessGoal);
            localStorage.setItem('preferred_workout_type', preferredWorkoutType);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            const email = document.getElementById('login_email').value.trim();
            const password = document.getElementById('login_password').value.trim();

            if (!email || !password) {
                alert('Please enter both email and password');
                event.preventDefault();
                return;
            }

            if (!email.includes('@')) {
                alert('Please enter a valid email.');
                event.preventDefault();
            }
        });
    }
});