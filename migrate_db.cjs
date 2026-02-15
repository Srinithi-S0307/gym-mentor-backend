const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'gym_mentor.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN expiry_date TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column expiry_date already exists.");
            } else {
                console.error("Migration Error:", err.message);
            }
        } else {
            console.log("Column expiry_date added successfully.");
        }
        db.close();
    });
});
