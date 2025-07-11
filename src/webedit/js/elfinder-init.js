$(function() {
  $('#elfinder').elfinder({
    // Use the correct backend endpoint for your Node.js connector.
    url : '/webedit/connector',
    height: 600,

    // Optionally, set language (if you have i18n files and want to support other languages)
    // lang: 'en', // or 'ru', 'de', etc.

    // You can customize other options here as needed, for example:
    // customData: { _csrf: 'your_csrf_token' } // if you use CSRF protection
    // handlers: { ... } // custom event handlers
  });
});