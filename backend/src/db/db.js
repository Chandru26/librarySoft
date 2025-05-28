const { Pool } = require('pg');
require('dotenv').config(); // Load default .env file
const path = require('path');

// If NODE_ENV is 'test', load .env.test variables, potentially overriding some from .env
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test'), override: true });
  console.log('Running in test mode, loaded .env.test');
}

const dbConfig = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
};

// Log database being used, especially for test environment
console.log(`Connecting to database: ${dbConfig.database} on host ${dbConfig.host}`);

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  console.log(`Connected to the PostgreSQL database: ${pool.options.database} on host ${pool.options.host}`);
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // In a real app, you might want to handle this more gracefully than exiting
  // For tests, exiting might be fine if the DB connection is critical.
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool, // Exporting pool directly for more complex operations like transactions if needed outside
  // And potentially for test cleanup utilities
};
