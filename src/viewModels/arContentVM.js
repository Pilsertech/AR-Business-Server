/*  ==========================================================================
    Business Logic – now supports attaching marker files post‑creation
    ======================================================================= */

import { ArContent }     from '../models/index.js';
import { customAlphabet }from 'nanoid';
import QRCode            from 'qrcode';
import path              from 'path';
import fs                from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ─── Helpers ──────────────────────────────────────────────────────────── */
export async function getAllContents(){
  return ArContent.findAll({ order:[['createdAt','DESC']] });
}
export async function getBySlug(slug){
  return ArContent.findOne({ where:{ slug } });
}

/* ─── Create content ───────────────────────────────────────────────────── */
export async function createContent(payload, files){
  const slug = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789',10)();

  /* QR code */
  const qrRel = `/qr/${slug}.png`;
  const qrAbs = path.join(__dirname,'../../public',qrRel);
  const card  = `${process.env.BASE_URL}/card/${slug}`;
  await QRCode.toFile(qrAbs, card, { width:300, margin:2 });

  const [arType] = payload.experienceType.split('-');

  const content = await ArContent.create({
    ...payload,
    slug,
    contentType: arType,
    qrCodeUrl : qrRel,
    targetUrl : null,   // marker files added later
    assetUrl  : files.assetFile
                 ? `/uploads/${files.assetFile[0].filename}`
                 : null
  });
  return content;
}

/* ─── Attach NFT marker files AFTER QR conversion ─────────────────────── */
/**
 * Link new NFT marker files to a record (optional).
 * If the user did not upload any of the three files, this is a no‑op.
 */
export async function attachMarkerFiles(slug, files) {
  // If zero files were uploaded, silently skip
  const uploaded = (files.fsetFile || []).length +
                   (files.fset3File || []).length +
                   (files.isetFile || []).length;
  if (uploaded === 0) return;

  // All three must be present, otherwise abort
  if (!(files.fsetFile && files.fset3File && files.isetFile)) {
    throw new Error('All three marker files are required when replacing the marker.');
  }

  const content = await getBySlug(slug);
  if (!content) throw new Error('Content not found');

  const baseName = files.fsetFile[0].originalname.replace('.fset', '');
  content.targetUrl = `/targets/${baseName}`;
  await content.save();
}


/* ─── Delete content & files ───────────────────────────────────────────── */
export async function deleteContentBySlug(slug){
  const content = await getBySlug(slug);
  if(!content) throw new Error('Content not found');

  const rels = [
    content.assetUrl,
    content.qrCodeUrl,
    content.targetUrl && `${content.targetUrl}.fset`,
    content.targetUrl && `${content.targetUrl}.fset3`,
    content.targetUrl && `${content.targetUrl}.iset`
  ].filter(Boolean);

  for(const rel of rels){
    try{
      await fs.unlink(path.join(__dirname,'../../public',rel));
      console.log('🗑️ deleted',rel);
    }catch(err){
      console.warn('⚠️ unable to delete',rel,err.message);
    }
  }
  await content.destroy();
}
