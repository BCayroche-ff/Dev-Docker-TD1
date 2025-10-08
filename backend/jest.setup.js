const pool = require('./db');

/**
 * Global teardown for Jest tests
 * Closes database connection pool after all tests complete
 */
afterAll(async () => {
  await pool.end();
});
