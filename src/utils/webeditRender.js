import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webeditViews = path.resolve(__dirname, '../webedit');

export function renderWebedit(res, template, options = {}) {
  const templateName = `${template}.ejs`;
  const templatePath = path.join(webeditViews, templateName);
  // Express can render with an absolute path
  res.render(templatePath, options);
}