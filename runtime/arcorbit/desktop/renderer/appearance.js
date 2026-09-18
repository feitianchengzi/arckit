/* Runs before styles/content; theme changes never render or replace business DOM. */
(() => {
  const api = window.arckitDesktop;
  const system = matchMedia('(prefers-color-scheme: dark)');
  let current = api?.initialAppearance || { preference: 'system', resolved: system.matches ? 'dark' : 'light', revision: 0 };
  let intent = 0;
  function apply(snapshot) {
    if (!snapshot || snapshot.revision < current.revision) return;
    current = snapshot;
    document.documentElement.dataset.theme = snapshot.resolved;
    document.documentElement.style.colorScheme = snapshot.resolved;
    const select = document.getElementById('appearanceTheme');
    if (select) select.value = snapshot.preference;
    window.dispatchEvent(new CustomEvent('arcorbit:appearance', { detail: snapshot }));
  }
  apply(current);
  api?.onAppearanceChanged?.(apply);
  if (!api?.initialAppearance) system.addEventListener('change', () => {
    if (current.preference === 'system') apply({ ...current, resolved: system.matches ? 'dark' : 'light' });
  });
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('appearanceTheme');
    const feedback = document.getElementById('appearanceFeedback');
    select.value = current.preference;
    select.addEventListener('change', async () => {
      const sequence = ++intent;
      const preference = select.value;
      feedback.textContent = '正在保存外观…';
      try {
        if (!api?.setAppearance) throw new Error('当前环境不支持保存外观。');
        const saved = await api.setAppearance(preference);
        apply(saved);
        if (sequence === intent) feedback.textContent = '外观已保存。';
      } catch {
        if (sequence === intent) {
          select.value = current.preference;
          feedback.textContent = '外观未能保存，已恢复原选择。请重试。';
        }
      }
    });
    api?.getAppearance?.().then(apply).catch(() => {});
  });
})();
