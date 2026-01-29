// server/index.ts
import express from 'express';
import cors from 'cors';
import db from './db';

const app = express();
const port = 3000;
const host = '127.0.0.1'; // Localhost only

app.use(cors());
// INCREASE LIMIT for large JSON imports
app.use(express.json({ limit: '50mb' })); 

// --- POST: Advanced Search ---
app.post('/api/parts/search', (req, res) => {
  try {
    const { 
      q = '', 
      limit = 100, 
      offset = 0, 
      config 
    } = req.body;

    let sql = 'SELECT * FROM parts WHERE 1=1';
    const params: (string | number)[] = [];

    // 1. Text Search (Name)
    if (q) {
      sql += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }

    // 2. Server Filters
    if (config?.serverFilters && Array.isArray(config.serverFilters)) {
      config.serverFilters.forEach((filter: any) => {
        const { field, op, value } = filter;
        let sqlOp = '=';
        if (op === '>=') sqlOp = '>=';
        if (op === '<=') sqlOp = '<=';
        if (op === '>') sqlOp = '>';
        if (op === '<') sqlOp = '<';
        
        sql += ` AND json_extract(data, '$."' || ? || '"') ${sqlOp} ?`;
        params.push(field, value);
      });
    }

    // 3. Client Filters (Optimized to Server)
    if (config?.clientFilterField && config?.clientFilterValues?.length > 0) {
      const field = config.clientFilterField;
      const values = config.clientFilterValues;
      const placeholders = values.map(() => '?').join(',');
      sql += ` AND json_extract(data, '$."' || ? || '"') IN (${placeholders})`;
      params.push(field, ...values);
    }

    // 4. Pagination
    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);

    const results = rows.map((row: any) => {
      const jsonData = JSON.parse(row.data || '{}');
      return { id: row.id, Name: row.name, ...jsonData };
    });

    res.json(results);

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- BULK IMPORT (New!) ---
app.post('/api/parts/import', (req, res) => {
  const partsArray = req.body;

  if (!Array.isArray(partsArray)) {
    res.status(400).json({ error: 'Expected an array of parts' });
    return;
  }

  try {
    const insert = db.prepare('INSERT INTO parts (name, type, data) VALUES (?, ?, ?)');

    // Transaction makes bulk insert 100x faster
    const importTransaction = db.transaction((parts) => {
      for (const part of parts) {
        // AUTO-MAP: Try to find a Name, or fallback to Part No, or Unknown
        const name = part.Name || part['Part Name'] || part['Part No'] || 'Unknown Part';
        
        // AUTO-MAP: Try to find a Type
        const type = part['Part Type'] || part.Type || 'misc';

        // Store the raw object in JSON
        insert.run(name, type, JSON.stringify(part));
      }
    });

    importTransaction(partsArray);

    res.json({ success: true, count: partsArray.length });
  } catch (error: any) {
    console.error('Import Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- SINGLE INSERT ---
app.post('/api/parts', (req, res) => {
  const { Name, type, ...rest } = req.body;
  if (!Name) {
     res.status(400).json({ error: 'Name is required' });
     return;
  }
  try {
    const stmt = db.prepare('INSERT INTO parts (name, type, data) VALUES (?, ?, ?)');
    const info = stmt.run(Name, type || 'misc', JSON.stringify(rest));
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, host, () => {
  console.log(`Local Server running at http://${host}:${port}`);
});