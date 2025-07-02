// ./config/database.js - (Revised Version)

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT), // We use the port from your .env file
    dialect: 'mssql',
    dialectOptions: {
      // Options specific to the 'tedious' driver
      options: {
        // This can help avoid SSL errors during local development
        trustServerCertificate: true
      }
    },
    // Set to console.log to see the generated SQL for debugging
    // Set to false for production
    logging: console.log, 
  }
);