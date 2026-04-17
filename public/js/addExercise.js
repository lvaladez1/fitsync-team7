document.querySelectorAll(".add-exercise").forEach(button => {
    button.addEventListener("click", () => {
        const exerciseId = button.dataset.exerciseId;

        const form = document.getElementById(`form-${exerciseId}`);
        form.style.display = form.style.display === "block" ? "none" : "block";
    });
});


document.querySelectorAll(".add-to-workout").forEach(button => {
    button.addEventListener("click", () => {
        const exerciseId = button.dataset.exerciseId;

        const container = document.getElementById(`form-${exerciseId}`);
        const workoutSelect = container.querySelector(".workout-select");
        const exerciseName = container.querySelector(".exercise-name").value;

        const workoutId = workoutSelect.value;

        if (!workoutId) {
            alert("Please choose a workout.");
            return;
        }

        window.location.href = `/workouts/${workoutId}/exercises/new?name=${encodeURIComponent(exerciseName)}`;
    });
});