/* Local prototype only. Production appearance is owned by Electron main. */
(() => {
  const key = 'arcorbit:prototype:appearance:v1';
  const valid = value => ['system', 'light', 'dark'].includes(value) ? value : 'system';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = valid(localStorage.getItem(key)); } catch { /* use system */ }
  function apply() {
    const resolved = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }
  window.AppearancePrototype = {
    get preference() { return preference; },
    select(value) {
      const next = valid(value);
      localStorage.setItem(key, next);
      preference = next;
      apply();
    }
  };
  system.addEventListener('change', apply);
  addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = valid(event.newValue);
      apply();
    }
  });
  apply();
})();
