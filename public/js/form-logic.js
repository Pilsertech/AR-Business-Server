/*  ============================================================================
    public/js/form-logic.js
    Controls dynamic visibility of:
    – Asset upload fields (model/image/video)
    – GPS inputs (only shown when geo-* is selected)
    Marker uploads are not handled here (handled in edit page only)
    ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const experienceType = document.getElementById('experienceType');
  const assetType      = document.getElementById('assetType');

  const groups = {
    model: document.getElementById('asset-model-group'),
    image: document.getElementById('asset-image-group'),
    video: document.getElementById('asset-video-group'),
    geo:   document.getElementById('geo-controls-group')
  };

  const toggleVisibility = (element, shouldShow) => {
    if (element) element.classList.toggle('hidden', !shouldShow);
  };

  function updateAssetVisibility() {
    toggleVisibility(groups.model, assetType.value === 'model');
    toggleVisibility(groups.image, assetType.value === 'image');
    toggleVisibility(groups.video, assetType.value === 'video');
  }

  function updateGeoVisibility() {
    toggleVisibility(groups.geo, experienceType.value.startsWith('geo'));
  }

  assetType.addEventListener('change', updateAssetVisibility);
  experienceType.addEventListener('change', () => {
    updateAssetVisibility();
    updateGeoVisibility();
  });

  // Initial state on page load
  updateAssetVisibility();
  updateGeoVisibility();
});
