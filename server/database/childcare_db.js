require('dotenv').config();
const { Pool } = require('pg');

// Ensure the database connection string is available
if (!process.env.CHILDCARE_SERVICES_DB) {
  console.error("CHILDCARE_SERVICES_DB is not set in the environment variables.");
  process.exit(1);
}

// Configure the PostgreSQL connection pool
const childcarePool = new Pool({
  connectionString: process.env.CHILDCARE_SERVICES_DB,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Handle unexpected errors to maintain database connectivity
childcarePool.on('error', (err) => {
  console.error("Unexpected childcare DB error:", err);
  console.log("Retrying connection to childcare DB in 5 seconds...");
  setTimeout(() => {
    childcarePool.connect().catch(() => {
      console.error("Childcare DB reconnection failed, will retry...");
    });
  }, 5000);
});

module.exports = childcarePool;
