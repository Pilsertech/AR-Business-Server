/*  ========================================================================
    public/js/edit-content.js
    • Works with the new edit-content.ejs (multiple .mind files)
    • Validation:
        – If user selects files, every file must end with “.mind”.
    • UI helper: shows selected filenames under the input.
    ====================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('editForm');
  const fileInput    = form?.querySelector('input[name="markerFiles"]');
  if (!form || !fileInput) return;          // not a marker‑based edit page

  /* ── Preview list ──────────────────────────────────────────────── */
  const previewList = document.createElement('ul');
  previewList.className = 'marker-list preview';
  fileInput.after(previewList);

  fileInput.addEventListener('change', () => {
    previewList.innerHTML = '';             // reset
    Array.from(fileInput.files).forEach(f => {
      const li = document.createElement('li');
      li.textContent = f.name;
      previewList.appendChild(li);
    });
  });

  /* ── Submit validation ─────────────────────────────────────────── */
  form.addEventListener('submit', (ev) => {
    if (!fileInput.files.length) return;    // nothing to validate

    const bad = Array.from(fileInput.files).filter(f =>
      !f.name.toLowerCase().endsWith('.mind')
    );

    if (bad.length) {
      alert(
        'One or more selected files are not .mind files:\n' +
        bad.map(f => '• ' + f.name).join('\n')
      );
      ev.preventDefault();
    }
  });
});
