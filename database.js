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

                        const dietPlans = {
                            1: "• Breakfast: Oats with Berries\n• Mid-Morning: Green Tea & 5 Almonds\n• Lunch: Grilled Chicken/Paneer Salad\n• Evening: One Apple\n• Dinner: Boiled Veggies & Clear Soup",
                            2: "• Breakfast: Veggie Poha/Upma\n• Mid-Morning: Buttermilk (1 glass)\n• Lunch: 1 Chapati + Dal + Mixed Veggies\n• Evening: Roasted Chana\n• Dinner: Moong Dal Khichdi (light)",
                            3: "• Breakfast: Scrambled Eggs (White) + Toast\n• Mid-Morning: Papaya/Watermelon\n• Lunch: Brown Rice + Black Beans + Salad\n• Evening: Cucumber Slices with Hummus\n• Dinner: Grilled Tofu + Steamed Broccoli",
                            4: "• Breakfast: Low-fat Greek Yogurt + Chia Seeds\n• Mid-Morning: Orange Juice (Fresh)\n• Lunch: Quinoa Salad with Chickpeas\n• Evening: Handful of Makhana\n• Dinner: Veggie Soup + Multi-grain Crackers",
                            5: "• Breakfast: Moong Dal Chilla\n• Mid-Morning: Coconut Water\n• Lunch: Grilled Fish/Soya Chunks + Salad\n• Evening: Pomegranate Bowl\n• Dinner: Sautéed Spinach & Mushroom",
                            6: "• Breakfast: Smoothie Bowl (Spinach/Banana)\n• Mid-Morning: Handful of Walnuts\n• Lunch: 1 Ragi Rotty + Veg Curry\n• Evening: Tea (No Sugar) + 2 Marie Biscuits\n• Dinner: Vegetable Dalia"
                        };
                        diet = dietPlans[day];

                    } else if (goal === 'weight-gain') {
                        workout = day % 2 === 1
                            ? "1. Bench Press (4x10)\n2. Barbell Squats (4x10)\n3. Bent Over Rows (4x10)\n4. Military Press (3x10)\n5. Bicep Curls (3x12)"
                            : "1. Deadlifts (3x8)\n2. Leg Press (4x12)\n3. Pull-ups/Lat Pulldown (4x10)\n4. Skull Crushers (3x12)\n5. Calf Raises (4x15)";

                        const dietPlans = {
                            1: "• Breakfast: 4 Eggs & 2 Butter Toast\n• Mid-Morning: Banana Shake with Peanut Butter\n• Lunch: 2 cups Rice + Chicken Curry + Curd\n• Evening: Cheese Sandwich + Fruit\n• Dinner: Pasta with Paneer & Veggies",
                            2: "• Breakfast: Large Masala Dosa + Sambhar/Chutney\n• Mid-Morning: Handful of Cashews & Raisins\n• Lunch: 3 Chapatis + Mutton/Dal + Fried Potato\n• Evening: Protein Bar + Avocado Toast\n• Dinner: Fried Rice with Scrambled Egg/Paneer",
                            3: "• Breakfast: Parathas (Aloo/Paneer) + Ghee\n• Mid-Morning: Mango/Fruit Smoothie (Full Cream)\n• Lunch: Thick Khichdi + Omelette + Papad\n• Evening: Boiled Corn with Butter\n• Dinner: Grilled Steak/Soya Chunks with Coleslaw",
                            4: "• Breakfast: Paneer Bhurji + Multi-grain Bread\n• Mid-Morning: Chickpea (Chana) Salad with Olive Oil\n• Lunch: Chicken Biryani (Medium Spice) + Raita\n• Evening: Date & Nut Ball (Energy Balls)\n• Dinner: Lamb/Vegetable Stew with Bread",
                            5: "• Breakfast: Pancakes with Honey/Maple Syrup\n• Mid-Morning: Full Cream Milk + Almonds\n• Lunch: 2 Fish Fillets (Fried/Grilled) + Mashed Potato\n• Evening: Sweet Potato Chaat\n• Dinner: Lasagna or Cheese Casserole",
                            6: "• Breakfast: Omelette (3 Eggs) + Sausages/Soya Links\n• Mid-Morning: Yogurt with Granola & Honey\n• Lunch: Paneer Butter Masala + 2 Naans\n• Evening: Trail Mix (Nuts/Chocolate)\n• Dinner: Extra Cheese Pizza / Home Burger"
                        };
                        diet = dietPlans[day];

                    } else { // Muscle Building
                        workout = day % 2 === 1
                            ? "1. Dumbbell Press (4x12)\n2. Pec Deck Flys (3x15)\n3. Arnold Press (4x10)\n4. Lateral Raises (3x15)\n5. Tricep Pushdowns (4x12)"
                            : "1. Seated Rows (4x12)\n2. Hammer Curls (3x12)\n3. Leg Extensions (4x15)\n4. Lying Leg Curls (4x12)\n5. Abs Rollouts (3x15)";

                        const dietPlans = {
                            1: "• Breakfast: Protein Smoothie (Whey/Veg)\n• Mid-Morning: Boiled Egg Whites (4)\n• Lunch: Quinoa with Chicken Breast (200g)\n• Evening: Low-fat Curd with Berries\n• Dinner: Grilled Fish/Tofu & Sweet Potato",
                            2: "• Breakfast: Oats with Protein Powder + Nuts\n• Mid-Morning: Turkey/Soya Roll (Whole Wheat)\n• Lunch: Lean Beef/Soya Curry + Brown Rice\n• Evening: Sprouted Salad (High Protein)\n• Dinner: Grilled Salmon + Asparagus",
                            3: "• Breakfast: Whole Egg Scramble + Avocado\n• Mid-Morning: Greek Yogurt (High Protein)\n• Lunch: Chickpea Pasta with Tuna/Paneer\n• Evening: Cottage Cheese (Paneer) Cubes\n• Dinner: Roast Chicken + Quinoa + Spinach",
                            4: "• Breakfast: Tofu Scramble with Veggies\n• Mid-Morning: Protein Shake\n• Lunch: Turkey Breast/Soya Nuggets + Sweet Potato\n• Evening: Pumpkin Seeds & Walnuts\n• Dinner: Lean Burger Patties (No Bun) + Salad",
                            5: "• Breakfast: Peanut Butter & Banana on Rye Bread\n• Mid-Morning: 3 Egg Whites + 1 Whole Egg\n• Lunch: Grilled Shrimp/Mushroom + Couscous\n• Evening: Edamame Beans (Steamed)\n• Dinner: Chicken Stir Fry with Loads of Veggies",
                            6: "• Breakfast: High Protein Cereal + Soy/Nut Milk\n• Mid-Morning: Beef/Soya Jerky or Protein Bar\n• Lunch: Tuna Salad with Olive Oil Dressing\n• Evening: Casein Protein or Milk\n• Dinner: Baked Chicken Thighs + Green Salad"
                        };
                        diet = dietPlans[day];
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
