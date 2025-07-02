// File: scripts/rename-migration.js

const fs = require('fs');
const path = require('path');

// Define the path to your migrations folder
const migrationsDir = path.resolve(__dirname, '../migrations');

try {
  // Read all files in the migrations directory
  const files = fs.readdirSync(migrationsDir);

  // Find the most recent .js migration file
  const latestJsMigration = files
    .filter(file => file.endsWith('.js'))
    .sort((a, b) => {
      const statA = fs.statSync(path.join(migrationsDir, a));
      const statB = fs.statSync(path.join(migrationsDir, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    })[0]; // Get the first one after sorting by date (newest)

  if (latestJsMigration) {
    const oldPath = path.join(migrationsDir, latestJsMigration);
    const newPath = path.join(migrationsDir, latestJsMigration.replace('.js', '.cjs'));

    // Rename the file
    fs.renameSync(oldPath, newPath);
    console.log(`✅ Migration successfully renamed to: ${path.basename(newPath)}`);
  } else {
    console.log('No .js migration file found to rename.');
  }
} catch (error) {
  console.error('Error renaming migration file:', error);
}