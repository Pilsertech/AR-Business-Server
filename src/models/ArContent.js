// src/models/ArContent.js (Final Corrected Version)

import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ArContent = sequelize.define('ArContent', {
  /* ─── Identity ─────────────────────────────────────────────────────────── */
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },

  /* ─── Text content ─────────────────────────────────────────────────────── */
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },

  /* ─── Experience descriptor (e.g. “marker-model”, “geo-video”) ─────────── */
  experienceType: { type: DataTypes.STRING, allowNull: false },

  /* ─── File paths --------------------------------------------------------- */
  assetUrl: { type: DataTypes.STRING },
  qrCodeUrl: { type: DataTypes.STRING, allowNull: false },

  /** NEW – array of marker filenames (stored as JSON text in DB) */
  markerFiles: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('markerFiles');
      return raw ? JSON.parse(raw) : [];
    },
    set(val = []) {
      this.setDataValue('markerFiles', JSON.stringify(val));
    }
  },

  /* ─── Scene parameters --------------------------------------------------- */
  modelScale: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1.0 },
  positionX: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  positionY: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  positionZ: { type: DataTypes.FLOAT, allowNull: false, defaultValue: -2 },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },

  /* ─── Optional CTA button ------------------------------------------------ */
  actionButton: {
    type: DataTypes.TEXT, // persisted as JSON string
    get() {
      const raw = this.getDataValue('actionButton');
      return raw ? JSON.parse(raw) : null;
    },
    set(val) {
      this.setDataValue('actionButton', JSON.stringify(val));
    }
  }
}, {
  tableName: 'ar_contents',
  timestamps: true
});

export default ArContent;