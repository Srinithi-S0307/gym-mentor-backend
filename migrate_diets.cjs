const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'gym_mentor.sqlite');
const db = new sqlite3.Database(dbPath);

const diets = {
    'weight-loss': {
        1: "• Breakfast: Oats with Berries\n• Mid-Morning: Green Tea & 5 Almonds\n• Lunch: Grilled Chicken/Paneer Salad\n• Evening: One Apple\n• Dinner: Boiled Veggies & Clear Soup",
        2: "• Breakfast: Veggie Poha/Upma\n• Mid-Morning: Buttermilk (1 glass)\n• Lunch: 1 Chapati + Dal + Mixed Veggies\n• Evening: Roasted Chana\n• Dinner: Moong Dal Khichdi (light)",
        3: "• Breakfast: Scrambled Eggs (White) + Toast\n• Mid-Morning: Papaya/Watermelon\n• Lunch: Brown Rice + Black Beans + Salad\n• Evening: Cucumber Slices with Hummus\n• Dinner: Grilled Tofu + Steamed Broccoli",
        4: "• Breakfast: Low-fat Greek Yogurt + Chia Seeds\n• Mid-Morning: Orange Juice (Fresh)\n• Lunch: Quinoa Salad with Chickpeas\n• Evening: Handful of Makhana\n• Dinner: Veggie Soup + Multi-grain Crackers",
        5: "• Breakfast: Moong Dal Chilla\n• Mid-Morning: Coconut Water\n• Lunch: Grilled Fish/Soya Chunks + Salad\n• Evening: Pomegranate Bowl\n• Dinner: Sautéed Spinach & Mushroom",
        6: "• Breakfast: Smoothie Bowl (Spinach/Banana)\n• Mid-Morning: Handful of Walnuts\n• Lunch: 1 Ragi Rotty + Veg Curry\n• Evening: Tea (No Sugar) + 2 Marie Biscuits\n• Dinner: Vegetable Dalia"
    },
    'weight-gain': {
        1: "• Breakfast: 4 Eggs & 2 Butter Toast\n• Mid-Morning: Banana Shake with Peanut Butter\n• Lunch: 2 cups Rice + Chicken Curry + Curd\n• Evening: Cheese Sandwich + Fruit\n• Dinner: Pasta with Paneer & Veggies",
        2: "• Breakfast: Large Masala Dosa + Sambhar/Chutney\n• Mid-Morning: Handful of Cashews & Raisins\n• Lunch: 3 Chapatis + Mutton/Dal + Fried Potato\n• Evening: Protein Bar + Avocado Toast\n• Dinner: Fried Rice with Scrambled Egg/Paneer",
        3: "• Breakfast: Parathas (Aloo/Paneer) + Ghee\n• Mid-Morning: Mango/Fruit Smoothie (Full Cream)\n• Lunch: Thick Khichdi + Omelette + Papad\n• Evening: Boiled Corn with Butter\n• Dinner: Grilled Steak/Soya Chunks with Coleslaw",
        4: "• Breakfast: Paneer Bhurji + Multi-grain Bread\n• Mid-Morning: Chickpea (Chana) Salad with Olive Oil\n• Lunch: Chicken Biryani (Medium Spice) + Raita\n• Evening: Date & Nut Ball (Energy Balls)\n• Dinner: Lamb/Vegetable Stew with Bread",
        5: "• Breakfast: Pancakes with Honey/Maple Syrup\n• Mid-Morning: Full Cream Milk + Almonds\n• Lunch: 2 Fish Fillets (Fried/Grilled) + Mashed Potato\n• Evening: Sweet Potato Chaat\n• Dinner: Lasagna or Cheese Casserole",
        6: "• Breakfast: Omelette (3 Eggs) + Sausages/Soya Links\n• Mid-Morning: Yogurt with Granola & Honey\n• Lunch: Paneer Butter Masala + 2 Naans\n• Evening: Trail Mix (Nuts/Chocolate)\n• Dinner: Extra Cheese Pizza / Home Burger"
    },
    'muscle-building': {
        1: "• Breakfast: Protein Smoothie (Whey/Veg)\n• Mid-Morning: Boiled Egg Whites (4)\n• Lunch: Quinoa with Chicken Breast (200g)\n• Evening: Low-fat Curd with Berries\n• Dinner: Grilled Fish/Tofu & Sweet Potato",
        2: "• Breakfast: Oats with Protein Powder + Nuts\n• Mid-Morning: Turkey/Soya Roll (Whole Wheat)\n• Lunch: Lean Beef/Soya Curry + Brown Rice\n• Evening: Sprouted Salad (High Protein)\n• Dinner: Grilled Salmon + Asparagus",
        3: "• Breakfast: Whole Egg Scramble + Avocado\n• Mid-Morning: Greek Yogurt (High Protein)\n• Lunch: Chickpea Pasta with Tuna/Paneer\n• Evening: Cottage Cheese (Paneer) Cubes\n• Dinner: Roast Chicken + Quinoa + Spinach",
        4: "• Breakfast: Tofu Scramble with Veggies\n• Mid-Morning: Protein Shake\n• Lunch: Turkey Breast/Soya Nuggets + Sweet Potato\n• Evening: Pumpkin Seeds & Walnuts\n• Dinner: Lean Burger Patties (No Bun) + Salad",
        5: "• Breakfast: Peanut Butter & Banana on Rye Bread\n• Mid-Morning: 3 Egg Whites + 1 Whole Egg\n• Lunch: Grilled Shrimp/Mushroom + Couscous\n• Evening: Edamame Beans (Steamed)\n• Dinner: Chicken Stir Fry with Loads of Veggies",
        6: "• Breakfast: High Protein Cereal + Soy/Nut Milk\n• Mid-Morning: Beef/Soya Jerky or Protein Bar\n• Lunch: Tuna Salad with Olive Oil Dressing\n• Evening: Casein Protein or Milk\n• Dinner: Baked Chicken Thighs + Green Salad"
    }
};

db.serialize(() => {
    console.log("Starting Diet Migration...");
    Object.keys(diets).forEach(goal => {
        Object.keys(diets[goal]).forEach(day => {
            const dietContent = diets[goal][day];
            db.run("UPDATE global_templates SET diet = ? WHERE goal = ? AND day = ?", [dietContent, goal, day], (err) => {
                if (err) console.error(`Failed to update ${goal} Day ${day}:`, err.message);
                else console.log(`✓ Updated ${goal} Day ${day}`);
            });
        });
    });
    console.log("Migration finished! Close this script in 5 seconds.");
});
