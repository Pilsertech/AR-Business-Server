//  ============================================================================
//  public/js/scene-logic.js
//  ① Fade‑out the loader once the A‑Frame scene (or AR.js) is ready
//  ② Fallback timeout so the UI never gets stuck
//  ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const scene  = document.querySelector('a-scene');
  const loader = document.getElementById('loader');
  if (!scene || !loader) return;

  /* Helper – fades loader via CSS then removes from DOM */
  const hideLoader = () => {
    if (loader.dataset.done) return;          // run once
    loader.dataset.done = 'true';
    loader.style.animation = 'fadeOut 300ms ease forwards';
    loader.addEventListener('animationend', () => loader.remove());
  };

  /* A-Frame fires 'loaded' when assets + scene graph ready */
  if (scene.hasLoaded) hideLoader();
  else scene.addEventListener('loaded', hideLoader);

  /* AR.js sometimes emits 'arjs-video-loaded' slightly later */
  scene.addEventListener('arjs-video-loaded', hideLoader, { once: true });

  /* Safety timeout – hide after 10 s even if events fail */
  setTimeout(hideLoader, 10000);
});