// Optional: Auto-hide flash messages after 4 sec
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    document.querySelectorAll('.flash-message').forEach(e => e.style.display = 'none');
  }, 4000);
});