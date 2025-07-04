/*  ============================================================================
    src/viewModels/arContentVM.js
    Framework‑agnostic business‑logic layer (MindAR compatible)
    ────────────────────────────────────────────────────────────────────────────
    • createContent()         – create DB row, save asset, generate QR
    • updateContentBySlug()   – replace asset, replace marker, update fields
    • deleteContentBySlug()   – drop DB row + ALL linked files on disk
    ========================================================================== */

import { ArContent }      from '../models/index.js';
import { customAlphabet } from 'nanoid';
import QRCode             from 'qrcode';
import path               from 'path';
import fs                 from 'fs/promises';
import { fileURLToPath }  from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const id10 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

export const getAllContents = () =>
  ArContent.findAll({ order: [['createdAt', 'DESC']] });

export const getBySlug = (slug) =>
  ArContent.findOne({ where: { slug } });

/* ─── CREATE ─────────────────────────────────────────────────────────────── */
export async function createContent(payload, files) {
  const slug = id10();

  /* 1 ▸ Generate a QR that opens /card/:slug */
  const qrRel = `/qr/${slug}.png`;
  await QRCode.toFile(
    path.join(__dirname, '../../public', qrRel),
    `${process.env.BASE_URL}/card/${slug}`,
    { width: 300, margin: 2 }
  );

  /* 2 ▸ Persist DB record */
  const [arType] = payload.experienceType.split('-'); // marker | geo | face

  return ArContent.create({
    ...payload,
    slug,
    contentType : arType,
    qrCodeUrl   : qrRel,
    markerFiles : [],                                    // ← empty array
    assetUrl    : files.assetFile?.length
                   ? `/uploads/${files.assetFile[0].filename}`
                   : null
  });
}

/* ─── UPDATE ─────────────────────────────────────────────────────────────── */
export async function updateContentBySlug(slug, body, files) {
  const content = await getBySlug(slug);
  if (!content) throw new Error('Content not found.');

  /* 1 ▸ Replace asset (optional) */
  if (files.assetFile?.length) {
    await safeUnlink(content.assetUrl);
    content.assetUrl = `/uploads/${files.assetFile[0].filename}`;
  }

  /* 2 ▸ Replace marker (optional) – keep ONE *.mind per record */
  if (files.markerFiles?.length) {
    /* delete previous .mind (if any) */
    await Promise.all(markerRelPaths(content.markerFiles).map(safeUnlink));

    /* store the new filename */
    content.markerFiles = [ files.markerFiles[0].filename ];  // array → JSON by setter
  }

  /* 3 ▸ Scalar fields & optional button */
  content.positionX  = body.positionX;
  content.positionY  = body.positionY;
  content.positionZ  = body.positionZ;
  content.modelScale = body.modelScale;

  content.actionButton = (body.actionButtonText && body.actionButtonUrl)
    ? { text: body.actionButtonText, url: body.actionButtonUrl }
    : null;

  await content.save();
}

/* ─── DELETE ─────────────────────────────────────────────────────────────── */
export async function deleteContentBySlug(slug) {
  const content = await getBySlug(slug);
  if (!content) throw new Error('Content not found.');

  const rels = [
    content.assetUrl,
    content.qrCodeUrl,
    ...markerRelPaths(content.markerFiles)
  ].filter(Boolean);

  await Promise.all(rels.map(safeUnlink));
  await content.destroy();
}

/* ─── Utility helpers ────────────────────────────────────────────────────── */
function markerRelPaths(list) {
  const arr = Array.isArray(list) ? list : JSON.parse(list || '[]');
  return arr.map(filename => `/targets/${filename}`);
}

async function safeUnlink(relPath) {
  if (!relPath) return;
  try {
    await fs.unlink(path.join(__dirname, '../../public', relPath));
    console.log('🗑️  deleted', relPath);
  } catch (err) {
    // file may already be gone – warn but don’t crash
    console.warn('⚠️  unable to delete', relPath, err.message);
  }
}
