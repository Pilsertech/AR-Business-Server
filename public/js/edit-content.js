/*  public/js/edit-content.js
    Tiny helper: warn if user tries to upload only 1‑2 marker files     */

document.addEventListener('DOMContentLoaded', () => {
  const form  = document.getElementById('editForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    const fset  = form.querySelector('input[name="fsetFile"]').files.length;
    const fset3 = form.querySelector('input[name="fset3File"]').files.length;
    const iset  = form.querySelector('input[name="isetFile"]').files.length;

    const someFiles = fset + fset3 + iset;
    const allThree  = fset && fset3 && iset;

    if (someFiles && !allThree) {
      alert('Please upload all three marker files (.fset, .fset3, .iset) together.');
      e.preventDefault();
    }
  });
});
