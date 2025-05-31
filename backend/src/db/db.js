const { Pool } = require('pg');
require('dotenv').config(); // Load default .env file
// const path = require('path'); // No longer needed as .env.test loading is removed

const dbConfig = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
};

// Log database being used
console.log(`Connecting to database: ${dbConfig.database} on host ${dbConfig.host}`);

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  console.log(`Connected to the PostgreSQL database: ${pool.options.database} on host ${pool.options.host}`);
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
