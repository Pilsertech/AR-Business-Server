// File: src/config/database.cjs (Final Version)

console.log('--- Loading database.cjs for Sequelize CLI ---');

// This will load the .env file from the root of your project
require('dotenv').config();

// --- DEBUGGING ---
// Let's print the values to make sure they are loaded correctly.
console.log(`Host from .env: ${process.env.DB_HOST}`);
console.log(`User from .env: ${process.env.DB_USER}`);
// --- END DEBUGGING ---

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    server: process.env.DB_HOST,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        // This must be true for local development to work correctly.
        trustServerCertificate: true
      }
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    server: process.env.DB_HOST,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: true, // Recommended for production
        trustServerCertificate: false
      }
    }
  }
};