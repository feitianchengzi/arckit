/* Local links to existing interaction projections. No production routing. */
(() => {
  const pages = [
    ['Today', '../today-workspace/default.html'], ['Chat', '../chat-workspace/default.html'],
    ['Product', '../product-list/default.html'], ['Idea', '../idea-workspace/default.html'],
    ['Work', '../task-browser/default.html'], ['Automation', '../automation-workspace/default.html'],
    ['Release', '../release-workspace/default.html'], ['Operations', '../operations-workspace/default.html'],
    ['Feedback', '../product-feedback-center/default.html'],
    ['Organization', '../platform-workspace/collaboration-views.html'],
    ['Engineering', '../engineering-profile/default.html']
  ];
  function closeMenus(returnFocus = false) {
    document.querySelectorAll('.legacy-pages').forEach(host => {
      const menu = host.querySelector('.legacy-menu');
      if (!menu.hidden && returnFocus) host.querySelector('button').focus();
      menu.hidden = true;
      host.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  }
  function menu(compact) {
    const host = document.createElement('div');
    host.className = `legacy-pages${compact ? ' compact-pages' : ''}`;
    host.innerHTML = `<button type="button" aria-expanded="false" aria-label="全部页面" class="${compact ? 'icon-button' : 'quiet'}">${compact ? window.WorkViews.icon('grid') : '全部页面'}</button><nav class="legacy-menu" aria-label="全部页面" hidden>${pages.map(([title, href]) => `<a href="${href}" target="_blank" rel="noopener">${title}</a>`).join('')}<button type="button" data-action="resources">资料与专业视图</button><button type="button" data-action="settings">执行与连接</button></nav>`;
    host.querySelector('button').addEventListener('click', () => {
      const open = host.querySelector('.legacy-menu').hidden;
      closeMenus();
      host.querySelector('.legacy-menu').hidden = !open;
      host.querySelector('button').setAttribute('aria-expanded', String(open));
      if (open) host.querySelector('a').focus();
    });
    return host;
  }
  function attach() {
    document.querySelector('.sidebar-bottom')?.prepend(menu(false));
    document.querySelector('.top-actions')?.prepend(menu(true));
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('.legacy-pages') || event.target.closest('.legacy-menu [data-action]')) closeMenus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && [...document.querySelectorAll('.legacy-menu')].some(el => !el.hidden)) {
      event.preventDefault(); event.stopImmediatePropagation(); closeMenus(true);
    }
  }, true);
  const original = window.WorkViews.render;
  window.WorkViews.render = () => { original(); attach(); };
  attach();
})();
