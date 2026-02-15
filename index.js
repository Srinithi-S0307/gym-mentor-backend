const express = require('express');
const cors = require('cors');
const db = require('./database');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('server/public')); // Serve the APK file directly!

// Auto-run Diet Migration for Cloud
try {
    const migrationPath = path.resolve(__dirname, 'migrate_diets.cjs');
    if (fs.existsSync(migrationPath)) {
        console.log("Found migration file, running it...");
        require('./migrate_diets.cjs');
    }
} catch (e) {
    console.warn("Migration runner skipped:", e.message);
}

// Auth: Login
app.post('/api/auth/login', (req, res) => {
    console.log("=== LOGIN REQUEST RECEIVED ===");
    const { role, id, password } = req.body;
    console.log("BODY:", JSON.stringify(req.body));
    console.log(`DETAILS: role=${role}, id=${id}, password=${password}`);

    if (role === 'trainer') {
        console.log("TRAINER LOGIN PATH TAKEN");
        db.get("SELECT * FROM users WHERE id = 'admin' AND password = ?", [password], (err, row) => {
            if (err) {
                console.error("DATABASE ERROR:", err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }
            if (row) {
                console.log("DATABASE MATCH FOUND:", JSON.stringify(row));
                res.json({ success: true, user: row });
            } else {
                console.log("NO DATABASE MATCH FOR ID 'admin' AND PROVIDED PASSWORD");
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        });
    } else {
        console.log("MEMBER LOGIN PATH TAKEN");
        db.get("SELECT * FROM users WHERE name = ? AND password = ? AND role = 'member'", [id, password], (err, row) => {
            if (row) {
                console.log("MEMBER MATCH FOUND");
                res.json({ success: true, user: row });
            } else {
                console.log("MEMBER MATCH NOT FOUND");
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        });
    }
});
// Members: Get All
app.get('/api/members', (req, res) => {
    console.log("GET /api/members called");
    db.all("SELECT * FROM users WHERE role = 'member'", (err, rows) => {
        console.log(`Returning ${rows ? rows.length : 0} members`);
        res.json(rows || []);
    });
});

// Members: Add
app.post('/api/members', (req, res) => {
    const { name, id, password, expiry_date } = req.body;
    console.log(`POST /api/members called: name=${name}, id=${id}`);
    db.run("INSERT INTO users (id, name, password, role, expiry_date) VALUES (?, ?, ?, 'member', ?)", [id, name, password, expiry_date], (err) => {
        if (err) {
            console.error("MEMBER INSERT ERROR:", err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ success: false, message: `Member ID "${id}" already exists. Please use a different one.` });
            }
            return res.status(400).json({ success: false, message: err.message });
        }
        console.log("MEMBER INSERT SUCCESSFUL");
        res.json({ success: true });
    });
});

// Members: Remove
app.delete('/api/members/:id', (req, res) => {
    console.log("DELETE /api/members called for id:", req.params.id);
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: true });
    });
});

// Scores: Get All
app.get('/api/scores', (req, res) => {
    console.log("GET /api/scores called");
    db.all("SELECT user_id, points FROM scores", (err, rows) => {
        const scoreMap = {};
        rows.forEach(r => scoreMap[r.user_id] = r.points);
        console.log("Returning score map");
        res.json(scoreMap);
    });
});

// Scores: Update
app.post('/api/scores', (req, res) => {
    const { userId, points } = req.body;
    console.log(`POST /api/scores called for ${userId}: +${points}`);
    db.run(`INSERT INTO scores (user_id, points) VALUES (?, ?) 
            ON CONFLICT(user_id) DO UPDATE SET points = points + ?`,
        [userId, points, points], (err) => {
            res.json({ success: true });
        });
});

// Attendance: Check & Log
app.post('/api/attendance', (req, res) => {
    const { userId, date } = req.body;
    console.log(`POST /api/attendance for ${userId} on ${date}`);
    db.run("INSERT OR IGNORE INTO attendance (user_id, date) VALUES (?, ?)", [userId, date], function (err) {
        if (this.changes > 0) {
            // New attendance! Add points
            db.run("INSERT INTO scores (user_id, points) VALUES (?, 10) ON CONFLICT(user_id) DO UPDATE SET points = points + 10", [userId]);
            console.log("New attendance recorded (+10 pts)");
            res.json({ success: true, newRecord: true });
        } else {
            console.log("Attendance already exists for today");
            res.json({ success: true, newRecord: false });
        }
    });
});

// Feedback: Add
app.post('/api/feedback', (req, res) => {
    const { userId, userName, message, date } = req.body;
    console.log(`POST /api/feedback from ${userName}`);
    db.run("INSERT INTO feedback (user_id, user_name, message, date) VALUES (?, ?, ?, ?)", [userId, userName, message, date], (err) => {
        res.json({ success: true });
    });
});

// Feedback: Get All
app.get('/api/feedback', (req, res) => {
    console.log("GET /api/feedback called");
    db.all("SELECT * FROM feedback ORDER BY id DESC", (err, rows) => {
        res.json(rows || []);
    });
});

// Feedback: Remove
app.delete('/api/feedback/:id', (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /api/feedback called for id: ${id}`);
    db.run("DELETE FROM feedback WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("FEEDBACK DELETE ERROR:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true });
    });
});

// Goals: Get All
app.get('/api/user-goals', (req, res) => {
    console.log("GET /api/user-goals called");
    db.all("SELECT * FROM user_goals", (err, rows) => {
        const goalMap = {};
        rows.forEach(r => goalMap[r.user_id] = r.goal);
        res.json(goalMap);
    });
});

// Goals: Update
app.post('/api/user-goals', (req, res) => {
    const { userId, goal } = req.body;
    console.log(`POST /api/user-goals for ${userId}: ${goal}`);
    db.run("INSERT INTO user_goals (user_id, goal) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET goal = ?", [userId, goal, goal], (err) => {
        res.json({ success: true });
    });
});

// Custom Plans: Get All
app.get('/api/custom-plans', (req, res) => {
    console.log("GET /api/custom-plans called");
    db.all("SELECT * FROM custom_plans", (err, rows) => {
        const planMap = {};
        rows.forEach(r => {
            if (!planMap[r.user_id]) planMap[r.user_id] = {};
            planMap[r.user_id][r.day] = { workout: r.workout, diet: r.diet };
        });
        res.json(planMap);
    });
});

// Custom Plans: Update
app.post('/api/custom-plans', (req, res) => {
    const { userId, plan } = req.body; // plan is { day: { workout, diet } }
    console.log(`POST /api/custom-plans for ${userId}`);
    const day = Object.keys(plan)[0];
    const { workout, diet } = plan[day];
    db.run(`INSERT INTO custom_plans (user_id, day, workout, diet) VALUES (?, ?, ?, ?) 
            ON CONFLICT(user_id, day) DO UPDATE SET workout = ?, diet = ?`,
        [userId, day, workout, diet, workout, diet], (err) => {
            res.json({ success: true });
        });
});

// Global Templates: Get All
app.get('/api/global-templates', (req, res) => {
    console.log("GET /api/global-templates called");
    db.all("SELECT * FROM global_templates", (err, rows) => {
        const templateMap = {};
        rows.forEach(r => {
            if (!templateMap[r.goal]) templateMap[r.goal] = {};
            templateMap[r.goal][r.day] = { workout: r.workout, diet: r.diet };
        });
        console.log(`Returning template map with ${Object.keys(templateMap).length} goals`);
        res.json(templateMap);
    });
});

// Global Templates: Update
app.post('/api/global-templates', (req, res) => {
    const { goal, day, workout, diet } = req.body;
    console.log(`POST /api/global-templates for ${goal} day ${day}`);
    db.run(`INSERT INTO global_templates (goal, day, workout, diet) VALUES (?, ?, ?, ?) 
            ON CONFLICT(goal, day) DO UPDATE SET workout = ?, diet = ?`,
        [goal, day, workout, diet, workout, diet], (err) => {
            res.json({ success: true });
        });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
