import Database from 'better-sqlite3';

// This creates a file named 'local.db' in your server folder
const db = new Database('local.db', { verbose: console.log });

// Example: Create a "users" table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;