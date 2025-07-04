'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const table = 'ar_contents';
    const columns = await queryInterface.describeTable(table);

    // --- REMOVE OLD, UNNECESSARY COLUMNS ---
    if (columns.targetUrl) {
      await queryInterface.removeColumn(table, 'targetUrl');
      console.log('SUCCESS: Removed obsolete column "targetUrl".');
    }
    if (columns.contentType) {
      await queryInterface.removeColumn(table, 'contentType');
      console.log('SUCCESS: Removed obsolete column "contentType".');
    }
    if (columns.assetType) {
      await queryInterface.removeColumn(table, 'assetType');
      console.log('SUCCESS: Removed obsolete column "assetType".');
    }

    // --- ADD NEW, CORRECT COLUMNS (if they don't exist) ---
    if (!columns.experienceType) {
      await queryInterface.addColumn(table, 'experienceType', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'marker-model'
      });
      console.log('SUCCESS: Added new column "experienceType".');
    }
    if (!columns.markerFiles) {
      await queryInterface.addColumn(table, 'markerFiles', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('SUCCESS: Added new column "markerFiles".');
    }
  },

  async down (queryInterface, Sequelize) {
    // This allows you to reverse the changes
    await queryInterface.removeColumn('ar_contents', 'experienceType');
    await queryInterface.removeColumn('ar_contents', 'markerFiles');
    await queryInterface.addColumn('ar_contents', 'targetUrl', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('ar_contents', 'contentType', { type: Sequelize.STRING });
    await queryInterface.addColumn('ar_contents', 'assetType', { type: Sequelize.STRING });
  }
};