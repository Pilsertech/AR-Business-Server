// AR Admins Page JS

// Auto-fade flash messages
document.addEventListener('DOMContentLoaded', function() {
  // Fade out flash messages after 4 seconds
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
  const deleteForms = document.querySelectorAll('form[action^="/admins/delete/"]');
  deleteForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn && btn.disabled) return; // Don't confirm if disabled
      const emailTd = form.closest('tr')?.querySelector('td:first-child');
      let email = emailTd ? emailTd.textContent.trim() : '';
      if (!confirm(`Are you sure you want to delete admin${email ? ' ' + email : ''}? This action cannot be undone.`)) {
        e.preventDefault();
      }
    });
  });

  // Optional: Password show/hide toggle for change-password fields
  // (If you later add a toggle button in the markup, implement here)
});