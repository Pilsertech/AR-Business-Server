/*  =========================================================================
    public/js/form-logic.js
    Dynamic show/hide for asset type + geo inputs (marker logic removed)
    ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const exp   = document.getElementById('experienceType');
  const asset = document.getElementById('assetType');

  const grp   = {
    model : document.getElementById('asset-model-group'),
    image : document.getElementById('asset-image-group'),
    video : document.getElementById('asset-video-group'),
    geo   : document.getElementById('geo-controls-group')
  };

  const toggle = (el, show) => el.classList.toggle('hidden', !show);

  function updateAsset() {
    toggle(grp.model, asset.value === 'model');
    toggle(grp.image, asset.value === 'image');
    toggle(grp.video, asset.value === 'video');
  }

  function updateGeo() {
    toggle(grp.geo, exp.value.startsWith('geo'));
  }

  asset.addEventListener('change', updateAsset);
  exp  .addEventListener('change', () => { updateAsset(); updateGeo(); });

  /* initial state */
  updateAsset(); updateGeo();
});
