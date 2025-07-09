// For file creation, editing, and upload forms (AJAX)
document.addEventListener('DOMContentLoaded', function() {
  // Create new file/folder
  const createForm = document.getElementById('create-form');
  if (createForm) {
    createForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const data = new FormData(createForm);
      const res = await fetch('/webedit/create', { method:'POST', body: data });
      if (res.ok) location.reload();
      else alert('Failed to create');
    });
  }

  // File edit
  const editForm = document.getElementById('edit-form');
  if (editForm) {
    editForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const data = new FormData(editForm);
      const res = await fetch('/webedit/save', { method:'POST', body: data });
      if (res.ok) location.reload();
      else alert('Failed to save');
    });
  }

  // Upload/replace media
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const data = new FormData(uploadForm);
      const res = await fetch('/webedit/upload', { method:'POST', body: data });
      if (res.ok) location.reload();
      else alert('Upload failed');
    });
  }
});