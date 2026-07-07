require('dotenv').config();

const { pool, testDatabaseConnection } = require('../database/connection');

async function main() {
  const ok = await testDatabaseConnection();

  if (!ok) {
    console.error('Database connection failed.');
    process.exitCode = 1;
    return;
  }

  console.log('Database connection OK.');
}

main()
  .catch((error) => {
    console.error('Database check failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
