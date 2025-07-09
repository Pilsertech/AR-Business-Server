// Admin dashboard JS

document.addEventListener('DOMContentLoaded', () => {
  // Auto-hide flash messages
  setTimeout(() => {
    document.querySelectorAll('.flash-message').forEach(alert => {
      alert.style.transition = "opacity 0.7s";
      alert.style.opacity = 0;
      setTimeout(() => alert.remove(), 700);
    });
  }, 4000);

  // Confirm delete
  document.querySelectorAll('form[data-delete]').forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!confirm('Are you sure you want to delete this content?')) {
        e.preventDefault();
      }
    });
  });
});