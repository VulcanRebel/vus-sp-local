// server/index.ts
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;
const host = '127.0.0.1';

// Toggle based on Vercel's automatic environment variable
const IS_VERCEL = process.env.VERCEL === '1';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- API ROUTES ---

// 1. ADVANCED SEARCH (HYBRID)
app.post('/api/parts/search', async (req, res) => { 
  const { q = '', limit = 100, offset = 0, config } = req.body;

  // ==========================================
  // 🌐 ONLINE MODE: Vercel Static JSON Search
  // ==========================================
  if (IS_VERCEL) {
    try {
      const dataPath = path.join(process.cwd(), 'sample-data.json');
      
      // If no sample data exists, return empty array
      if (!fs.existsSync(dataPath)) {
        return res.json([]);
      }

      const rawData = fs.readFileSync(dataPath, 'utf-8');
      let parts = JSON.parse(rawData);

      // A. Text Search (Main Name or Part No)
      if (q) {
        const query = q.toLowerCase();
        parts = parts.filter((p: any) => 
          (p.Name && p.Name.toLowerCase().includes(query)) ||
          (p['Part No'] && p['Part No'].toLowerCase().includes(query))
        );
      }

      // B. Category Filters (Part Group, Part Type)
      if (config?.serverFilters && Array.isArray(config.serverFilters)) {
        parts = parts.filter((p: any) => {
          return config.serverFilters.every((filter: any) => {
            // For this app, we are mostly using '==' logic
            return p[filter.field] === filter.value;
          });
        });
      }

      // C. Sub-Filters (The "Coroplast" / "Tag" logic)
      if (config?.clientFilterField && config?.clientFilterValues?.length > 0) {
        const field = config.clientFilterField;
        const values = config.clientFilterValues;
        
        parts = parts.filter((p: any) => {
          const partValue = p[field]?.toLowerCase() || '';
          return values.some((val: string) => partValue.includes(val.toLowerCase()));
        });
      }

      // D. Sorting & Pagination
      parts.sort((a: any, b: any) => (a.Name || '').localeCompare(b.Name || ''));
      const paginatedParts = parts.slice(Number(offset), Number(offset) + Number(limit));

      // Map to standard format expected by frontend
      const results = paginatedParts.map((p: any, index: number) => ({
        id: index + 1, // Dummy ID
        ...p
      }));

      return res.json(results);
    } catch (error: any) {
      console.error("Vercel Search Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // 🏢 LOCAL MODE: SQLite Database Search
  // ==========================================
  try {
    const dbModule = await import('./db.js');
    const db = dbModule.default;
    
    let sql = 'SELECT * FROM parts WHERE 1=1';
    const params: (string | number)[] = [];

    // Text Search
    if (q) {
      sql += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }

    // Category Filters
    if (config?.serverFilters && Array.isArray(config.serverFilters)) {
      config.serverFilters.forEach((filter: any) => {
        const { field, op, value } = filter;
        sql += ` AND json_extract(data, '$.\"' || ? || '\"') ${op} ?`;
        params.push(field, value);
      });
    }

    // Sub-Filters
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
    console.error("Local Search API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. BULK IMPORT (From PLEX JSON) - Blocked on Vercel
app.post('/api/parts/import', async (req, res) => { // <-- Added async
  if (IS_VERCEL) return res.status(403).json({ error: 'Read-only on Vercel' });
  
  const partsArray = req.body;
  if (!Array.isArray(partsArray)) return res.status(400).json({ error: 'Expected array' });

  try {
    // ADD THESE TWO LINES:
    const dbModule = await import('./db.js');
    const db = dbModule.default;

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

// 3. SINGLE INSERT (Manual Form) - Blocked on Vercel
app.post('/api/parts', async (req, res) => { // <-- Added async
  if (IS_VERCEL) return res.status(403).json({ error: 'Read-only on Vercel' });

  const { Name, type, ...rest } = req.body;
  if (!Name) return res.status(400).json({ error: 'Name is required' });
  try {
    // ADD THESE TWO LINES:
    const dbModule = await import('./db.js');
    const db = dbModule.default;

    const stmt = db.prepare('INSERT INTO parts (name, type, data) VALUES (?, ?, ?)');
    const info = stmt.run(Name, type || 'misc', JSON.stringify(rest));
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export the app for Vercel Serverless Function compatibility
export default app;

// Only start the local listener if we are NOT on Vercel
if (!IS_VERCEL) {
  app.listen(port, host, () => {
    console.log(`Local Internal Server running at http://${host}:${port}`);
  });
}