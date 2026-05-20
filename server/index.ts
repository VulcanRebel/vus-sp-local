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
  // 🌐 ONLINE MODE: Vercel Static JSON Search (UNCHANGED)
  // ==========================================
  if (IS_VERCEL) {
    try {
      const dataPath = path.join(process.cwd(), 'sample-data.json');
      if (!fs.existsSync(dataPath)) return res.json([]);

      const rawData = fs.readFileSync(dataPath, 'utf-8');
      let parts = JSON.parse(rawData);

      if (q) {
        const query = q.toLowerCase();
        parts = parts.filter((p: any) => 
          (p.Name && p.Name.toLowerCase().includes(query)) ||
          (p['Part No'] && p['Part No'].toLowerCase().includes(query))
        );
      }

      if (config?.serverFilters && Array.isArray(config.serverFilters)) {
        parts = parts.filter((p: any) => {
          return config.serverFilters.every((filter: any) => p[filter.field] === filter.value);
        });
      }

      if (config?.clientFilterField && config?.clientFilterValues?.length > 0) {
        const field = config.clientFilterField;
        const values = config.clientFilterValues;
        parts = parts.filter((p: any) => {
          const partValue = p[field]?.toLowerCase() || '';
          return values.some((val: string) => partValue.includes(val.toLowerCase()));
        });
      }

      parts.sort((a: any, b: any) => (a.Name || '').localeCompare(b.Name || ''));
      const paginatedParts = parts.slice(Number(offset), Number(offset) + Number(limit));
      const results = paginatedParts.map((p: any, index: number) => ({ id: index + 1, ...p }));
      return res.json(results);
    } catch (error: any) {
      console.error("Vercel Search Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // 🏢 LOCAL MODE: MSSQL Vulcan10 Search
  // ==========================================
  try {
    const dbModule = await import('./db.js');
    const sql = dbModule.sql;
    const pool = await dbModule.poolPromise;
    
    let query = 'SELECT * FROM parts WHERE 1=1';
    const request = pool.request();

// Text Search
    if (q) {
      // Check the main name column OR the "Part No" inside the JSON data
      query += ` AND (name LIKE @q OR JSON_VALUE(data, '$."Part No"') LIKE @q)`;
      request.input('q', sql.NVarChar, `%${q}%`);
    }

// Category Filters
    if (config?.serverFilters && Array.isArray(config.serverFilters)) {
      config.serverFilters.forEach((filter: any, index: number) => {
        const { field, op, value } = filter;
        
        // MSSQL FIX: Translate '==' to '=' 
        const sqlOp = op === '==' ? '=' : op;
        
        // MSSQL requires exact string literals for JSON paths
        const safeField = field.replace(/"/g, '\\"');
        query += ` AND JSON_VALUE(data, '$."${safeField}"') ${sqlOp} @s_val${index}`;
        
        // Keep the input injection the same
        request.input(`s_val${index}`, value);
      });
    }

    // Sub-Filters
    if (config?.clientFilterField && config?.clientFilterValues?.length > 0) {
      const field = config.clientFilterField;
      const values = config.clientFilterValues;
      const safeField = field.replace(/"/g, '\\"');
      
      const subConditions = values.map((val: string, index: number) => {
        request.input(`c_val${index}`, sql.NVarChar, `%${val}%`);
        return `JSON_VALUE(data, '$."${safeField}"') LIKE @c_val${index}`;
      }).join(' OR ');
      
      query += ` AND (${subConditions})`;
    }

    // MSSQL Pagination (OFFSET / FETCH NEXT)
    query += ' ORDER BY name ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    request.input('offset', sql.Int, Number(offset));
    request.input('limit', sql.Int, Number(limit));

    const result = await request.query(query);
    const results = result.recordset.map((row: any) => ({
      id: row.id,
      Name: row.name,
      ...JSON.parse(row.data || '{}')
    }));

    res.json(results);
  } catch (error: any) {
    console.error("MSSQL Search API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. BULK IMPORT (From PLEX JSON) - Blocked on Vercel
app.post('/api/parts/import', async (req, res) => {
  if (IS_VERCEL) return res.status(403).json({ error: 'Read-only on Vercel' });
  
  const partsArray = req.body;
  if (!Array.isArray(partsArray)) return res.status(400).json({ error: 'Expected array' });

  try {
    const dbModule = await import('./db.js');
    const sql = dbModule.sql;
    const pool = await dbModule.poolPromise;

    // Use an MSSQL Transaction for bulk importing speed and safety
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const ps = new sql.PreparedStatement(transaction);
      ps.input('name', sql.NVarChar);
      ps.input('type', sql.NVarChar);
      ps.input('data', sql.NVarChar); // MAX is implied for large strings
      
      await ps.prepare('INSERT INTO parts (name, type, data) VALUES (@name, @type, @data)');

      for (const part of partsArray) {
        const name = part.Name || part['Part Name'] || part['Part No'] || 'Unknown';
        const type = part['Part Type'] || part.Type || 'misc';
        await ps.execute({ name, type, data: JSON.stringify(part) });
      }

      await ps.unprepare();
      await transaction.commit();
      
      res.json({ success: true, count: partsArray.length });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error: any) {
    console.error("MSSQL Import Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. SINGLE INSERT (Manual Form) - Blocked on Vercel
app.post('/api/parts', async (req, res) => {
  if (IS_VERCEL) return res.status(403).json({ error: 'Read-only on Vercel' });

  const { Name, type, ...rest } = req.body;
  if (!Name) return res.status(400).json({ error: 'Name is required' });
  
  try {
    const dbModule = await import('./db.js');
    const sql = dbModule.sql;
    const pool = await dbModule.poolPromise;

    const request = pool.request();
    request.input('name', sql.NVarChar, Name);
    request.input('type', sql.NVarChar, type || 'misc');
    request.input('data', sql.NVarChar, JSON.stringify(rest));

    // OUTPUT inserted.id gets the auto-increment ID back from SQL Server
    const result = await request.query('INSERT INTO parts (name, type, data) OUTPUT inserted.id VALUES (@name, @type, @data)');
    
    res.json({ id: result.recordset[0].id, success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

if (!IS_VERCEL) {
  app.listen(port, host, () => {
    console.log(`Local Internal Server running at http://${host}:${port}`);
  });
}