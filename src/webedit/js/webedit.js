// Webedit File Explorer + Main Panel Logic
// (Legacy UI: If you now rely on elFinder, you may not need most of this file!)
// You can keep it for non-elFinder areas, or clean up unused code.

document.addEventListener('DOMContentLoaded', function() {
  // Only run legacy logic if the legacy elements are present
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

  async function fetchFolderTree(root, ul) {
    const res = await fetch(`/webedit/list-folders?root=${encodeURIComponent(root)}`);
    if (!res.ok) return;
    const data = await res.json();
    for (const entry of data) {
      const li = document.createElement('li');
      li.className = 'folder-tree-item';
      const a = document.createElement('a');
      a.href = "#";
      a.textContent = entry.name;
      a.dataset.folder = entry.path;
      a.className = "folder-tree-link";
      if (entry.path === window.WEBEDIT.currentFolder) a.classList.add('active');
      a.addEventListener('click', e => {
        e.preventDefault();
        loadFolder(entry.path);
      });
      li.appendChild(a);
      if (entry.children && entry.children.length > 0) {
        const childUl = document.createElement('ul');
        fetchFolderTree(entry.path, childUl).then();
        li.appendChild(childUl);
      }
      ul.appendChild(li);
    }
    return ul;
  }

  async function loadFolder(folderPath) {
    const res = await fetch(`/webedit/ajax-list?folder=${encodeURIComponent(folderPath)}`);
    if (!res.ok) return alert("Failed to load folder");
    const { files, folder } = await res.json();
    window.WEBEDIT.currentFolder = folder;
    const fileList = document.getElementById('file-list');
    if (!fileList) return;
    fileList.innerHTML = '';
    files.forEach(file => {
      const li = document.createElement('li');
      if (file.isDirectory) {
        li.innerHTML = `<span>📁</span>
          <a href="#" class="folder-link" data-folder="${encodeURIComponent(file.path)}">${file.name}</a>
          <form method="POST" action="/webedit/delete" style="display:inline" onsubmit="return confirm('Delete folder and all content?');">
            <input type="hidden" name="target" value="${file.path}" />
            <button type="submit" class="btn-delete">Delete</button>
          </form>`;
        li.querySelector('.folder-link').addEventListener('click', e => {
          e.preventDefault();
          loadFolder(file.path);
        });
      } else {
        li.innerHTML = `<span>📄</span>
          <a href="/webedit/view?file=${encodeURIComponent(file.path)}">${file.name}</a>
          <form method="POST" action="/webedit/delete" style="display:inline" onsubmit="return confirm('Delete this file?');">
            <input type="hidden" name="target" value="${file.path}" />
            <button type="submit" class="btn-delete">Delete</button>
          </form>`;
      }
      fileList.appendChild(li);
    });
    document.getElementById('current-folder').textContent = folder;
    updateBreadcrumbs(folder);
    document.querySelector('#create-form input[name="folder"]').value = folder;
  }

  function updateBreadcrumbs(folder) {
    const bc = document.getElementById('breadcrumbs');
    if (!bc) return;
    const parts = folder.split(/[\\/]/).filter(Boolean);
    let curr = '';
    bc.innerHTML = '';
    parts.forEach((p, idx) => {
      curr += (curr ? '/' : '') + p;
      if (idx > 0) bc.innerHTML += ' / ';
      const a = document.createElement('a');
      a.href = "#";
      a.textContent = p;
      a.addEventListener('click', e => {
        e.preventDefault();
        loadFolder(curr);
      });
      bc.appendChild(a);
    });
  }

  // Only run these if legacy UI is present
  const folderTree = document.getElementById('folder-tree');
  if (folderTree && window.WEBEDIT && window.WEBEDIT.SAFE_ROOTS) {
    window.WEBEDIT.SAFE_ROOTS.forEach(root => {
      fetchFolderTree(root, folderTree);
    });
  }

  updateBreadcrumbs(window.WEBEDIT.currentFolder);

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