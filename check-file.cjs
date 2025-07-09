const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'webedit', 'login.ejs');
console.log('Checking:', file);
fs.access(file, fs.constants.R_OK, (err) => {
  if (err) {
    console.error('NO ACCESS', err);
  } else {
    console.log('ACCESS OK');
  }
  process.exit();
});