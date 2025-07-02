//  ============================================================================
//  public/js/ar-error-handler.js
//  Listens for AR.js errors (camera denied, etc.) and shows an alert.
//  This was inline in card.ejs, now external to comply with CSP.
//  ============================================================================

document.addEventListener('ar-error', (e) => {
  /* eslint-disable no-alert */
  alert(
    'AR failed to start:\n' +
    (e.detail?.error || 'unknown error') +
    '\n\n• Make sure camera permission is allowed\n' +
    '• Reload the page'
  );
});
