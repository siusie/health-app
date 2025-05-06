require('dotenv').config();
const Pool = require('pg').Pool;

let pool;

if (process.env.USE_LOCAL_DB === 'true') {
  // For local PostgresDB
  pool = new Pool({
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    host: 'localhost',
    port: 5432,
    database: 'TummyTime',
  });
  console.log('Using local database');
} else {
  // For Supabase PostgresDB
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  console.log('Using remote database (Supabase)');
}
// Test database connection
pool
  .connect()
  .then(() => {
    console.log('Connected to database');
  })
  .catch((err) => {
    console.error('Error connecting to database', err);
  });

module.exports = pool;
