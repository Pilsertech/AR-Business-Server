//  ==========================================================================
//  src/models/ArContent.js
//
//  Sequelize model for every AR‑content item.
//
//  Columns added / confirmed:
//    • assetType    – 'model' | 'image' | 'video'
//    • contentType  – 'marker' | 'geo' | 'face'
//    • positionZ    – default -2 (slightly in front of marker)
//  ==========================================================================

import { DataTypes } from 'sequelize';
import { sequelize }  from '../config/database.js';

const ArContent = sequelize.define(
  'ArContent',
  {
    /* ─── Identity ──────────────────────────────────────────────────── */
    id  : { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },

    /* ─── Text ──────────────────────────────────────────────────────── */
    title      : { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },

    /* ─── Experience definition ────────────────────────────────────── */
    experienceType: {
      // example: 'marker-model', 'geo-image', 'face-video'
      type: DataTypes.STRING,
      allowNull: false
    },

    /*  Asset: model / image / video  */
    assetType: {
      type: DataTypes.STRING,                 // 'model', 'image', 'video'
      allowNull: true
    },

    /*  Category: marker / geo / face  */
    contentType: {
      type: DataTypes.STRING,
      allowNull: false,                       // always present
      defaultValue: 'marker'
    },

    /* ─── File paths -------------------------------------------------- */
    assetUrl : { type: DataTypes.STRING, allowNull: true },
    targetUrl: { type: DataTypes.STRING, allowNull: true }, // NFT marker base
    qrCodeUrl: { type: DataTypes.STRING, allowNull: false },

    /* ─── Scene parameters ------------------------------------------- */
    modelScale: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1.0 },

    positionX : { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    positionY : { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    positionZ : { type: DataTypes.FLOAT, allowNull: false, defaultValue: -2 },

    latitude  : { type: DataTypes.FLOAT, allowNull: true },
    longitude : { type: DataTypes.FLOAT, allowNull: true },

    /* ─── Optional action button (stored as JSON) --------------------- */
    actionButton: {
      type: DataTypes.TEXT,                       // JSON string
      allowNull: true,
      get() {
        const raw = this.getDataValue('actionButton');
        return raw ? JSON.parse(raw) : null;
      },
      set(val) {
        this.setDataValue('actionButton', JSON.stringify(val));
      }
    }
  },
  {
    tableName : 'ar_contents',
    timestamps: true
  }
);

export default ArContent;
