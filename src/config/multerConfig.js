//  ==========================================================================
//  Multer config – saves marker files (.fset, .fset3, .iset) to /targets
//  ==========================================================================

import multer from 'multer';
import path   from 'path';

const markerFields = ['fsetFile','fset3File','isetFile'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, markerFields.includes(file.fieldname) ? 'public/targets'
                                                   : 'public/uploads');
  },
  filename: (req, file, cb) => {
    if (markerFields.includes(file.fieldname)) {
      return cb(null, file.originalname);        // AR.js needs original names
    }
    const id = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, `${file.fieldname}-${id}${path.extname(file.originalname)}`);
  }
});

export const upload = multer({ storage });
