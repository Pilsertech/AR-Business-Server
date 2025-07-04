/*  ============================================================================
    public/js/dashboard.js
    • Confirms deletion of any item on the dashboard table
    • Works via event delegation so it handles future rows without rebind
    ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  /**
   * Helper — returns the row’s <td> text for the title column
   * (assumes Title is the first cell, as in dashboard.ejs)
   */
  const getRowTitle = (row) => {
    const firstCell = row?.querySelector('td');
    return firstCell ? firstCell.textContent.trim() : 'this item';
  };

  /* Handle delete form submission */
  tbody.addEventListener('submit', (evt) => {
    const form = evt.target.closest('form[data-delete]');
    if (!form) return;                          // not a delete form

    const title = getRowTitle(form.closest('tr'));
    const ok = confirm(`Delete “${title}”?\nThis action cannot be undone.`);

    if (!ok) evt.preventDefault();
  });

  /* Also intercept Enter key on styled delete buttons (accessibility) */
  tbody.addEventListener('keydown', (evt) => {
    if (evt.key !== 'Enter') return;

    const form = evt.target.closest('form[data-delete]');
    if (!form) return;

    const title = getRowTitle(form.closest('tr'));
    const ok = confirm(`Delete “${title}”?\nThis action cannot be undone.`);
    if (!ok) evt.preventDefault();
  });
});
