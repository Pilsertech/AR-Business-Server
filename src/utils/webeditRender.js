import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webeditViews = path.resolve(__dirname, '../webedit');

export function renderWebedit(res, template, options = {}) {
  // Use absolute path to file
  const templatePath = path.join(webeditViews, template + '.ejs');
  // Remove .ejs extension for res.render
  const relativeTemplatePath = path.relative(process.cwd(), templatePath)
    .replace(/\\/g, '/')
    .replace(/^src\/webedit\//, ''); // Express expects path relative to views root
  res.render(templatePath, options); // Try this line first
  // If error persists, fallback to: res.render(relativeTemplatePath, options);
}