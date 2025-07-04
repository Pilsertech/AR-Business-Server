//  ============================================================================
//  public/js/ar-error-handler.js
//  Shows AR.js errors in a styled modal overlay instead of alert().
//  This is CSP-compliant and non-blocking for the user.
//  ============================================================================

function showArErrorModal(message) {
  // Remove existing modal if present
  const existing = document.getElementById('ar-error-modal');
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'ar-error-modal';
  overlay.className = 'ar-error-modal-overlay';
  overlay.innerHTML = `
    <div class="ar-error-modal-box">
      <h2>AR Error</h2>
      <div class="ar-error-modal-message">${message}</div>
      <button class="ar-error-modal-close" type="button">Close</button>
      <div class="ar-error-modal-help">
        • Make sure camera permission is allowed<br>
        • Reload the page
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Focus the close button for accessibility
  const closeBtn = overlay.querySelector('.ar-error-modal-close');
  closeBtn.focus();

  // Remove modal on click
  closeBtn.addEventListener('click', () => overlay.remove());

  // Also close on ESC key
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });
  // Trap focus for accessibility
  closeBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      closeBtn.focus();
    }
  });
}

// Listen for AR.js error event
document.addEventListener('ar-error', (e) => {
  const msg = (e.detail?.error || 'Unknown error');
  showArErrorModal(msg);
});