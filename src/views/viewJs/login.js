// AR Login Page JS

document.addEventListener('DOMContentLoaded', function() {
  // Password visibility toggle
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function() {
      const input = document.getElementById(this.dataset.target);
      if (input.type === "password") {
        input.type = "text";
        this.textContent = "🙈";
      } else {
        input.type = "password";
        this.textContent = "👁";
      }
    });
  });

  // Auto-fade error messages
  const errorMsg = document.querySelector('.error-message');
  if (errorMsg) {
    setTimeout(() => {
      errorMsg.style.transition = 'opacity 0.8s, max-height 0.6s';
      errorMsg.style.opacity = 0;
      errorMsg.style.maxHeight = '0';
      setTimeout(() => { errorMsg.remove(); }, 900);
    }, 4000);
  }
});