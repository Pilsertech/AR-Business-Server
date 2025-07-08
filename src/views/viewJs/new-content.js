// AR New Content Page JS

document.addEventListener('DOMContentLoaded', function() {
  // Asset type selector logic
  const assetSelect = document.getElementById('assetType');
  const modelGroup = document.getElementById('asset-model-group');
  const imageGroup = document.getElementById('asset-image-group');
  const videoGroup = document.getElementById('asset-video-group');

  function updateAssetGroup() {
    [modelGroup, imageGroup, videoGroup].forEach(g => g.classList.add('hidden'));
    if (assetSelect.value === "model") modelGroup.classList.remove('hidden');
    else if (assetSelect.value === "image") imageGroup.classList.remove('hidden');
    else if (assetSelect.value === "video") videoGroup.classList.remove('hidden');
  }
  assetSelect.addEventListener('change', updateAssetGroup);
  updateAssetGroup();

  // AR experience type logic for geo controls
  const expType = document.getElementById('experienceType');
  const geoGroup = document.getElementById('geo-controls-group');
  function updateGeoGroup() {
    const val = expType.value;
    geoGroup.classList.toggle('hidden', !val.startsWith('geo-'));
  }
  expType.addEventListener('change', updateGeoGroup);
  updateGeoGroup();
});