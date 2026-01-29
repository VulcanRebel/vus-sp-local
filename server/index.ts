import express from 'express';
import cors from 'cors';
import db from './db';

const app = express();
const port = 3000;

app.use(cors()); // Allow React to talk to us
app.use(express.json()); // Allow handling JSON data

// GET all users (Replaces: getDocs(collection(db, "users")))
app.get('/api/users', (req, res) => {
  const stmt = db.prepare('SELECT * FROM users');
  const users = stmt.all();
  res.json(users);
});

// ADD a user (Replaces: addDoc(collection(db, "users"), { ... }))
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    const info = stmt.run(name, email);
    res.json({ id: info.lastInsertRowid, name, email });
  } catch (error) {
    res.status(400).json({ error: 'Email likely already exists' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});