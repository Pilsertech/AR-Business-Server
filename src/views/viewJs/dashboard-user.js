// Add any dashboard user-specific JS here

document.addEventListener('DOMContentLoaded', () => {
  // Example: Smoothly auto-hide alerts after 4 seconds
  setTimeout(() => {
    document.querySelectorAll('.alert').forEach(alert => {
      alert.style.transition = "opacity 0.7s";
      alert.style.opacity = 0;
      setTimeout(() => alert.remove(), 700);
    });
  }, 4000);

  // You can add more JS enhancements as needed
});