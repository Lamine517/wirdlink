// Apply the saved appearance before the application paints; contains no user content.
(() => {
  let preference = 'auto';
  try {
    const saved = localStorage.getItem('wirdlink.theme.v1');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    /* Fall back to the device appearance. */
  }
  const theme =
    preference === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
