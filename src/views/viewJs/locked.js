// AR Locked Page JS

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
});