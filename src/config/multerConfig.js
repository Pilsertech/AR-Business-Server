// ────────────────────────────────────────────────────────────────────────────
//  src/config/multerConfig.js  –  unified Multer storage
// ────────────────────────────────────────────────────────────────────────────
import multer from 'multer';
import path   from 'path';

const storage = multer.diskStorage({
  /* 1 ▸ target folder */
  destination: (req, file, cb) => {
    const isMarker = file.fieldname === 'markerFiles' || file.fieldname === 'targetFile';
    cb(null, isMarker ? 'public/targets' : 'public/uploads');
  },

  /* 2 ▸ filename rule */
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const stamp = Date.now() + '-' + Math.round(Math.random() * 1e9);

    /* marker → use slug when we have it (edit route), fallback to “marker” */
    if (file.fieldname === 'markerFiles' || file.fieldname === 'targetFile') {
      const base = (req.params && req.params.slug) ? req.params.slug : 'marker';
      return cb(null, `${base}-${stamp}${ext}`);        // e.g. 8ahk3fa0jy‑…​.mind
    }

    /* everything else (asset / image / video / model) */
    cb(null, `${file.fieldname}-${stamp}${ext}`);       // assetFile‑123‑….glb
  }
});

export const upload = multer({ storage });
