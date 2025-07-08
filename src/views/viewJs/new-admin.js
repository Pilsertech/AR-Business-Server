// AR New Admin Page JS

document.addEventListener('DOMContentLoaded', function() {
  // Password visibility toggles
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

  // Password match check and enable/disable submit
  const pw1 = document.getElementById('password');
  const pw2 = document.getElementById('password2');
  const matchMsg = document.getElementById('matchMsg');
  const mismatchMsg = document.getElementById('mismatchMsg');
  const createBtn = document.getElementById('createBtn');

  function checkMatch() {
    if (!pw1.value || !pw2.value) {
      matchMsg.style.display = "none";
      mismatchMsg.style.display = "none";
      createBtn.disabled = true;
      return;
    }
    if (pw1.value === pw2.value) {
      matchMsg.style.display = "block";
      mismatchMsg.style.display = "none";
      createBtn.disabled = false;
    } else {
      matchMsg.style.display = "none";
      mismatchMsg.style.display = "block";
      createBtn.disabled = true;
    }
  }

  pw1.addEventListener('input', checkMatch);
  pw2.addEventListener('input', checkMatch);

  // Prevent submit if passwords don't match (extra safety)
  document.getElementById('adminForm').addEventListener('submit', function(e) {
    if (pw1.value !== pw2.value) {
      e.preventDefault();
      matchMsg.style.display = "none";
      mismatchMsg.style.display = "block";
      createBtn.disabled = true;
    }
  });

  // Auto-fade flash messages after 4 seconds
  const flashes = document.querySelectorAll('.flash-message');
  flashes.forEach(flash => {
    setTimeout(() => {
      flash.style.transition = 'opacity 0.8s, max-height 0.6s';
      flash.style.opacity = 0;
      flash.style.maxHeight = '0';
      setTimeout(() => { flash.remove(); }, 900);
    }, 4000);
  });
});