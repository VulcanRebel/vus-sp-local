// server/db.ts
import sql from 'mssql';

// REPLACE THESE WITH YOUR 1PASSWORD CREDENTIALS WHEN READY
const sqlConfig = {
  user: 'VUS_DB_User',
  password: 'River7!Copper#Falcon92',
  database: 'VUS_DB_Test',
  server: 'Vulcan10', // Or the specific IP address of the server
  options: {
    encrypt: false, // Keep false for local network connections
    trustServerCertificate: true, // Crucial for local internal servers
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// We create a "Pool Promise" so our API routes can reuse the same connection
const poolPromise = new sql.ConnectionPool(sqlConfig)
  .connect()
  .then(pool => {
    console.log('✅ Connected to MSSQL Server: Vulcan10');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database Connection Failed!', err);
    throw err;
  });

export { sql, poolPromise };