const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'schemes.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database.');
    initDb();
  }
});

function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      benefits TEXT,
      required_documents TEXT,
      apply_link TEXT,
      last_date TEXT,
      ministry TEXT,
      scheme_type TEXT,
      is_active BOOLEAN DEFAULT 1,
      eligibility TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS review_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      headline TEXT NOT NULL,
      content TEXT,
      name TEXT,
      source_url TEXT,
      source_name TEXT,
      ai_confidence INTEGER,
      ai_reason TEXT,
      verification_status TEXT,
      official_portal TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_suspended BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `, () => {
    // Seed default admin
    db.get("SELECT * FROM admins WHERE username = 'admin'", (err, row) => {
      if (!row) {
        db.run("INSERT INTO admins (username, password) VALUES ('admin', 'admin@123')");
      }
    });
  });
}

module.exports = db;
