// AR Edit Content Page JS

document.addEventListener('DOMContentLoaded', function() {
  // Auto-fade flash messages (if you ever use them here)
  const flashes = document.querySelectorAll('.flash-message');
  flashes.forEach(flash => {
    setTimeout(() => {
      flash.style.transition = 'opacity 0.8s, max-height 0.6s';
      flash.style.opacity = 0;
      flash.style.maxHeight = '0';
      setTimeout(() => { flash.remove(); }, 900);
    }, 4000);
  });

  // Improve file input UX: Show selected file name (optional)
  const fileInput = document.querySelector('input[type="file"][name="markerFiles"]');
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        fileInput.parentElement.setAttribute('data-file', fileInput.files[0].name);
      } else {
        fileInput.parentElement.removeAttribute('data-file');
      }
    });
  }
});