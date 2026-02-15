const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'gym_mentor.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Users table (Trainer and Members)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT,
        role TEXT NOT NULL,
        expiry_date TEXT
    )`);

    // Members table (Extended details)
    db.run(`CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT,
        trainer_id TEXT,
        FOREIGN KEY(id) REFERENCES users(id)
    )`);

    // User Goals
    db.run(`CREATE TABLE IF NOT EXISTS user_goals (
        user_id TEXT PRIMARY KEY,
        goal TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Progress Scores
    db.run(`CREATE TABLE IF NOT EXISTS scores (
        user_id TEXT PRIMARY KEY,
        points INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Attendance
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        user_id TEXT,
        date TEXT,
        PRIMARY KEY(user_id, date),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Custom Plans
    db.run(`CREATE TABLE IF NOT EXISTS custom_plans (
        user_id TEXT,
        day INTEGER,
        workout TEXT,
        diet TEXT,
        PRIMARY KEY(user_id, day),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Global Templates (Templates for Weight Loss, Muscle Building, etc.)
    db.run(`CREATE TABLE IF NOT EXISTS global_templates (
        goal TEXT,
        day INTEGER,
        workout TEXT,
        diet TEXT,
        PRIMARY KEY(goal, day)
    )`);

    // Feedback
    db.run(`CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        user_name TEXT,
        message TEXT,
        date TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Seed Global Templates if empty
    db.get("SELECT count(*) as count FROM global_templates", (err, row) => {
        if (row && row.count === 0) {
            const goals = ['weight-loss', 'weight-gain', 'muscle-building'];
            goals.forEach(goal => {
                for (let day = 1; day <= 6; day++) {
                    let workout = "";
                    let diet = "";

                    if (goal === 'weight-loss') {
                        workout = day % 2 === 1
                            ? "1. Jumping Jacks (50)\n2. Bodyweight Squats (3x15)\n3. Mountain Climbers (3x20)\n4. Walking Lunges (3x12)\n5. Plank (60s)"
                            : "1. High Knees (1min)\n2. Incline Pushups (3x12)\n3. Burpees (3x10)\n4. Bicycle Crunches (3x20)\n5. Fast Walking (10min)";
                        diet = "• Breakfast: Oats with Berries\n• 11am Snack: Green Tea & 5 Almonds\n• Lunch: Grilled Chicken/Paneer Salad\n• 5pm Snack: One Apple\n• Dinner: Boiled Veggies & Clear Soup";
                    } else if (goal === 'weight-gain') {
                        workout = day % 2 === 1
                            ? "1. Bench Press (4x10)\n2. Barbell Squats (4x10)\n3. Bent Over Rows (4x10)\n4. Military Press (3x10)\n5. Bicep Curls (3x12)"
                            : "1. Deadlifts (3x8)\n2. Leg Press (4x12)\n3. Pull-ups/Lat Pulldown (4x10)\n4. Skull Crushers (3x12)\n5. Calf Raises (4x15)";
                        diet = "• Breakfast: 4 Eggs & 2 Toast\n• 11am Snack: Banana Shake & Nuts\n• Lunch: 2 cups Rice, Chicken & Curd\n• 5pm Snack: Peanut Butter Sandwich\n• Dinner: Pasta with Paneer & Veggies";
                    } else { // Muscle Building
                        workout = day % 2 === 1
                            ? "1. Dumbbell Press (4x12)\n2. Pec Deck Flys (3x15)\n3. Arnold Press (4x10)\n4. Lateral Raises (3x15)\n5. Tricep Pushdowns (4x12)"
                            : "1. Seated Rows (4x12)\n2. Hammer Curls (3x12)\n3. Leg Extensions (4x15)\n4. Lying Leg Curls (4x12)\n5. Abs Rollouts (3x15)";
                        diet = "• Breakfast: Protein Smoothie\n• 11am Snack: Boiled Egg Whites (4)\n• Lunch: Quinoa with Chicken Breast\n• 5pm Snack: Protein Bar/Sprouts\n• Dinner: Grilled Fish/Tofu & Sweet Potato";
                    }

                    db.run("INSERT INTO global_templates (goal, day, workout, diet) VALUES (?, ?, ?, ?)", [goal, day, workout, diet]);
                }
            });
        }
    });

    // Seed Trainer if not exists
    db.get("SELECT * FROM users WHERE role = 'trainer'", (err, row) => {
        if (!row) {
            db.run("INSERT INTO users (id, name, password, role) VALUES (?, ?, ?, ?)",
                ['admin', 'Trainer Admin', 'admin', 'trainer']);
        }
    });
});

module.exports = db;
