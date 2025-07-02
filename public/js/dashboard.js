/*  ============================================================================
    public/js/dashboard.js
    Handles all interactive behaviour on the Admin Dashboard page
    ---------------------------------------------------------------------------
    ① Intercepts every “delete” form and shows a confirmation alert.
    ② Uses event delegation, so it still works if rows are added dynamically.
    ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Event delegation on <tbody> keeps the handler lightweight
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.addEventListener('submit', (evt) => {
        const form = evt.target.closest('form[data-delete]');
        if (!form) return; // not a delete form

        const ok = confirm('Are you sure you want to delete this item?');
        if (!ok) evt.preventDefault(); // user cancelled
    });
});
