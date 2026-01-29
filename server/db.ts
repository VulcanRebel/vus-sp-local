import Database from 'better-sqlite3';

// Creates 'local.db' in the server folder
const db = new Database('local.db', { verbose: console.log });

// Create the parts table
// We promote 'name' and 'type' to real columns for speed.
// We store everything else in 'data' so we don't lose any special fields.
db.exec(`
  CREATE TABLE IF NOT EXISTS parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Optional: Seed script check (Uncomment to add dummy data if empty)
/*
const count = db.prepare('SELECT count(*) as c FROM parts').get() as { c: number };
if (count.c === 0) {
  console.log('Seeding database with dummy parts...');
  const insert = db.prepare('INSERT INTO parts (name, type, data) VALUES (?, ?, ?)');
  insert.run('Aluminum Sign 12x18', 'aluminum_sign', JSON.stringify({ material: 'aluminum', thickness: 0.080 }));
  insert.run('ACM Panel', 'acm_sign', JSON.stringify({ material: 'acm', color: 'white' }));
  insert.run('Magnet Decal', 'magnet', JSON.stringify({ material: 'magnet', thickness: 0.030 }));
}
*/

export default db;