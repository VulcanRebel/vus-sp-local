// server/index.ts
import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const port = 3000;
const host = '127.0.0.1'; // Reverted to Localhost only

app.use(cors());
// INCREASE LIMIT for large JSON imports (needed for PLEX data)
app.use(express.json({ limit: '50mb' })); 

// --- API ROUTES ---

// 1. ADVANCED SEARCH
// Optimized for local performance and specific PLEX field handling
app.post('/api/parts/search', (req, res) => {
  try {
    const { q = '', limit = 100, offset = 0, config } = req.body;
    let sql = 'SELECT * FROM parts WHERE 1=1';
    const params: (string | number)[] = [];

    // Text Search (Main Name)
    if (q) {
      sql += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }

    // Category Filters (Part Group, Part Type)
    if (config?.serverFilters && Array.isArray(config.serverFilters)) {
      config.serverFilters.forEach((filter: any) => {
        const { field, op, value } = filter;
        // Logic to handle spaces in JSON keys: "$.\"Part Group\""
        sql += ` AND json_extract(data, '$.\"' || ? || '\"') ${op} ?`;
        params.push(field, value);
      });
    }

    // Sub-Filters (The "Coroplast" logic)
    if (config?.clientFilterField && config?.clientFilterValues?.length > 0) {
      const field = config.clientFilterField;
      const values = config.clientFilterValues;
      
      const subConditions = values.map(() => `json_extract(data, '$.\"' || ? || '\"') LIKE ?`).join(' OR ');
      sql += ` AND (${subConditions})`;
      
      values.forEach((val: string) => {
        params.push(field, `%${val}%`);
      });
    }

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(sql).all(...params);
    const results = rows.map((row: any) => ({
      id: row.id,
      Name: row.name,
      ...JSON.parse(row.data || '{}')
    }));

    res.json(results);
  } catch (error: any) {
    console.error("Search API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. BULK IMPORT (From PLEX JSON)
app.post('/api/parts/import', (req, res) => {
  const partsArray = req.body;
  if (!Array.isArray(partsArray)) return res.status(400).json({ error: 'Expected array' });

  try {
    const insert = db.prepare('INSERT INTO parts (name, type, data) VALUES (?, ?, ?)');
    const importTransaction = db.transaction((parts) => {
      for (const part of parts) {
        const name = part.Name || part['Part Name'] || part['Part No'] || 'Unknown';
        const type = part['Part Type'] || part.Type || 'misc';
        insert.run(name, type, JSON.stringify(part));
      }
    });
    importTransaction(partsArray);
    res.json({ success: true, count: partsArray.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. SINGLE INSERT (Manual Form)
app.post('/api/parts', (req, res) => {
  const { Name, type, ...rest } = req.body;
  if (!Name) return res.status(400).json({ error: 'Name is required' });
  try {
    const stmt = db.prepare('INSERT INTO parts (name, type, data) VALUES (?, ?, ?)');
    const info = stmt.run(Name, type || 'misc', JSON.stringify(rest));
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, host, () => {
  console.log(`Local Internal Server running at http://${host}:${port}`);
});