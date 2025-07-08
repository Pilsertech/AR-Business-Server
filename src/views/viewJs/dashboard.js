// AR Dashboard JS

document.addEventListener('DOMContentLoaded', function() {
  // Auto-fade flash messages
  const flashes = document.querySelectorAll('.flash-message');
  flashes.forEach(flash => {
    setTimeout(() => {
      flash.style.transition = 'opacity 0.8s, max-height 0.6s';
      flash.style.opacity = 0;
      flash.style.maxHeight = '0';
      setTimeout(() => { flash.remove(); }, 900);
    }, 4000);
  });

  // Confirm before delete
  const deleteForms = document.querySelectorAll('form[data-delete]');
  deleteForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const row = form.closest('tr');
      const titleTd = row ? row.querySelector('td:first-child') : null;
      const title = titleTd ? titleTd.textContent.trim() : '';
      if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
        e.preventDefault();
      }
    });
  });
});